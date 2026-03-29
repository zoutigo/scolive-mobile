"use strict";

/**
 * Mock HTTP server pour les tests E2E — remplace l'API réelle sur le port 3001.
 *
 * Endpoints applicatifs (appelés depuis l'app Android via 10.0.2.2:3001) :
 *   POST /api/auth/login-phone                  → pilotée par currentScenario
 *   POST /api/auth/login                        → pilotée par currentEmailLoginScenario
 *   POST /api/auth/logout                       → 204
 *   POST /api/auth/refresh                      → 401
 *   GET  /api/health                            → 200
 *   GET  /api/auth/onboarding/options           → pilotée par currentOnboardingScenario
 *   POST /api/auth/onboarding/complete          → pilotée par currentOnboardingScenario
 *   POST /api/auth/forgot-pin/options           → pilotée par currentPinScenario
 *   POST /api/auth/forgot-pin/verify            → pilotée par currentPinScenario
 *   POST /api/auth/forgot-pin/complete          → pilotée par currentPinScenario
 *   POST /api/auth/forgot-password/request      → pilotée par currentPwdScenario
 *   POST /api/auth/forgot-password/options      → pilotée par currentPwdScenario
 *   POST /api/auth/forgot-password/verify       → pilotée par currentPwdScenario
 *   POST /api/auth/forgot-password/complete     → pilotée par currentPwdScenario
 *
 * Endpoints de contrôle (appelés depuis les tests Jest sur localhost:3001) :
 *   POST /__scenario              → change le scénario de login téléphone
 *   POST /__scenario/email-login  → change le scénario de login email
 *   POST /__scenario/onboarding   → change le scénario d'onboarding
 *   POST /__scenario/pin          → change le scénario de récupération PIN
 *   POST /__scenario/password     → change le scénario de récupération mot de passe
 */

const http = require("http");
const net = require("net");

// ────────────────────────── Scénarios ──────────────────────────

const SCENARIOS = {
  happy_path: {
    status: 200,
    body: {
      accessToken: "e2e-access-token-valid",
      refreshToken: "e2e-refresh-token-valid",
      tokenType: "Bearer",
      expiresIn: 86400,
      refreshExpiresIn: 2592000,
      schoolSlug: null,
      csrfToken: "e2e-csrf",
    },
  },

  invalid_credentials: {
    status: 401,
    body: {
      message: "Invalid credentials",
      error: "Unauthorized",
      statusCode: 401,
    },
  },

  rate_limited: {
    status: 429,
    body: {
      code: "AUTH_RATE_LIMITED",
      message: "Too many attempts",
      statusCode: 429,
    },
  },

  account_suspended: {
    status: 403,
    body: {
      code: "ACCOUNT_SUSPENDED",
      message: "Account suspended",
      statusCode: 403,
    },
  },

  not_activated: {
    status: 403,
    body: {
      code: "ACCOUNT_VALIDATION_REQUIRED",
      message: "Account not activated",
      statusCode: 403,
    },
  },

  // Simule une erreur réseau : la socket est détruite avant l'envoi d'une réponse
  network_error: { closeImmediately: true },
  profile_setup_required: {
    status: 403,
    body: {
      code: "PROFILE_SETUP_REQUIRED",
      message: "Profile setup required",
      statusCode: 403,
      schoolSlug: "ecole-demo",
      setupToken: "setup-token-phone",
    },
  },
};

const EMAIL_LOGIN_SCENARIOS = {
  happy_path: {
    status: 200,
    body: {
      accessToken: "e2e-email-access-token-valid",
      refreshToken: "e2e-email-refresh-token-valid",
      tokenType: "Bearer",
      expiresIn: 86400,
      refreshExpiresIn: 2592000,
      schoolSlug: "ecole-demo",
      csrfToken: "e2e-csrf",
    },
  },
  password_change_required: {
    status: 403,
    body: {
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Password change required",
      statusCode: 403,
      email: "parent@ecole.cm",
      schoolSlug: "ecole-demo",
    },
  },
};

// ────────────────────────── Scénarios récupération PIN ──────────────────────────

/**
 * Scénarios disponibles pour les endpoints forgot-pin :
 *   happy_path       → options ok, verify ok, complete ok
 *   not_found        → options → 404 NOT_FOUND
 *   invalid_recovery → verify → 400 RECOVERY_INVALID
 *   session_expired  → complete → 401 RECOVERY_SESSION_EXPIRED
 *   same_pin         → complete → 400 SAME_PIN
 */

const MOCK_PIN_QUESTIONS = [
  { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
  { key: "BIRTH_CITY", label: "Votre ville de naissance" },
  { key: "FAVORITE_SPORT", label: "Votre sport préféré" },
];

// ────────────────────────── Scénarios récupération mot de passe ──────────────

/**
 * Scénarios disponibles pour les endpoints forgot-password :
 *   happy_path       → request ok, options ok, verify ok, complete ok
 *   not_found        → request → 404 NOT_FOUND
 *   token_invalid    → options → 400 TOKEN_INVALID
 *   token_expired    → options → 401 TOKEN_EXPIRED
 *   invalid_recovery → verify → 400 RECOVERY_INVALID
 *   same_password    → complete → 400 SAME_PASSWORD
 */

// ────────────────────────── État courant ──────────────────────────

let currentScenario = "happy_path";
let currentEmailLoginScenario = "happy_path";
let currentOnboardingScenario = "email_parent_happy";
let currentPinScenario = "happy_path";
let currentPwdScenario = "happy_path";
let server = null;

// ────────────────────────── Gestion des requêtes ──────────────────────────

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function handleRequest(req, res) {
  const { url, method } = req;

  // ── Endpoints de contrôle (tests → mock server) ─────────────
  if (
    url === "/__scenario" ||
    url === "/__scenario/email-login" ||
    url === "/__scenario/onboarding" ||
    url === "/__scenario/pin" ||
    url === "/__scenario/password"
  ) {
    if (method === "POST") {
      readBody(req).then((raw) => {
        try {
          const { scenario } = JSON.parse(raw);
          if (url === "/__scenario") {
            if (!SCENARIOS[scenario]) {
              return json(res, 400, {
                error: `Scénario login inconnu : "${scenario}"`,
              });
            }
            currentScenario = scenario;
          } else if (url === "/__scenario/email-login") {
            if (!EMAIL_LOGIN_SCENARIOS[scenario]) {
              return json(res, 400, {
                error: `Scénario login email inconnu : "${scenario}"`,
              });
            }
            currentEmailLoginScenario = scenario;
          } else if (url === "/__scenario/onboarding") {
            currentOnboardingScenario = scenario;
          } else if (url === "/__scenario/pin") {
            currentPinScenario = scenario;
          } else {
            currentPwdScenario = scenario;
          }
          console.log(`[mock] ${url} → ${scenario}`);
          json(res, 200, { ok: true, scenario });
        } catch {
          json(res, 400, { error: "JSON invalide" });
        }
      });
      return;
    }
    if (method === "GET") {
      return json(res, 200, {
        login: currentScenario,
        emailLogin: currentEmailLoginScenario,
        onboarding: currentOnboardingScenario,
        pin: currentPinScenario,
        password: currentPwdScenario,
      });
    }
  }

  // ── Health check ─────────────────────────────────────────────
  if (method === "GET" && url === "/api/health") {
    return json(res, 200, { status: "mock-ok" });
  }

  // ── Logout : toujours OK (l'app nettoie le stockage local) ───
  if (method === "POST" && url === "/api/auth/logout") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Refresh : forcé à échouer (pas de session persistante en E2E) ─
  if (method === "POST" && url === "/api/auth/refresh") {
    return json(res, 401, {
      message: "Refresh token invalide",
      statusCode: 401,
    });
  }

  // ── Login par téléphone : piloté par le scénario ─────────────
  if (method === "POST" && url === "/api/auth/login-phone") {
    const scenario = SCENARIOS[currentScenario];
    if (scenario.closeImmediately) {
      req.socket.destroy();
      return;
    }
    return json(res, scenario.status, scenario.body);
  }

  if (method === "POST" && url === "/api/auth/login") {
    const scenario = EMAIL_LOGIN_SCENARIOS[currentEmailLoginScenario];
    return json(res, scenario.status, scenario.body);
  }

  if (method === "GET" && url.startsWith("/api/auth/onboarding/options")) {
    if (currentOnboardingScenario === "options_error") {
      return json(res, 400, {
        message: "Impossible de charger les options d'activation.",
        statusCode: 400,
      });
    }

    if (currentOnboardingScenario === "phone_happy") {
      return json(res, 200, {
        schoolSlug: "ecole-demo",
        schoolRoles: ["TEACHER"],
        questions: MOCK_PIN_QUESTIONS,
        classes: [],
        students: [],
      });
    }

    return json(res, 200, {
      schoolSlug: "ecole-demo",
      schoolRoles: ["PARENT"],
      questions: [
        ...MOCK_PIN_QUESTIONS,
        { key: "FAVORITE_BOOK", label: "Votre livre préféré" },
      ],
      classes: [{ id: "class-1", name: "6e A", year: "2025-2026" }],
      students: [{ id: "student-1", firstName: "Paul", lastName: "MBELE" }],
    });
  }

  if (method === "POST" && url === "/api/auth/onboarding/complete") {
    if (currentOnboardingScenario === "complete_email_in_use") {
      return json(res, 403, {
        message: "Cette adresse email est deja utilisee.",
        statusCode: 403,
      });
    }
    if (currentOnboardingScenario === "invalid_activation") {
      return json(res, 401, {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
        statusCode: 401,
      });
    }
    return json(res, 200, { success: true, schoolSlug: "ecole-demo" });
  }

  // ── Récupération PIN ─────────────────────────────────────────

  if (method === "POST" && url === "/api/auth/forgot-pin/options") {
    if (currentPinScenario === "not_found") {
      return json(res, 404, {
        code: "NOT_FOUND",
        message: "User not found",
        statusCode: 404,
      });
    }
    return json(res, 200, {
      success: true,
      principalHint: "6***3",
      schoolSlug: null,
      questions: MOCK_PIN_QUESTIONS,
    });
  }

  if (method === "POST" && url === "/api/auth/forgot-pin/verify") {
    if (currentPinScenario === "invalid_recovery") {
      return json(res, 400, {
        code: "RECOVERY_INVALID",
        message: "Invalid recovery info",
        statusCode: 400,
      });
    }
    return json(res, 200, {
      success: true,
      recoveryToken: "e2e-pin-recovery-token",
      schoolSlug: null,
    });
  }

  if (method === "POST" && url === "/api/auth/forgot-pin/complete") {
    if (currentPinScenario === "session_expired") {
      return json(res, 401, {
        code: "RECOVERY_SESSION_EXPIRED",
        message: "Session expired",
        statusCode: 401,
      });
    }
    if (currentPinScenario === "same_pin") {
      return json(res, 400, {
        code: "SAME_PIN",
        message: "Same PIN not allowed",
        statusCode: 400,
      });
    }
    return json(res, 200, { success: true, schoolSlug: null });
  }

  // ── Récupération mot de passe ─────────────────────────────────

  if (method === "POST" && url === "/api/auth/forgot-password/request") {
    if (currentPwdScenario === "not_found") {
      return json(res, 404, {
        code: "NOT_FOUND",
        message: "User not found",
        statusCode: 404,
      });
    }
    return json(res, 200, {
      success: true,
      message: "Si ce compte existe, un lien a été envoyé.",
    });
  }

  if (method === "POST" && url === "/api/auth/forgot-password/options") {
    if (currentPwdScenario === "token_invalid") {
      return json(res, 400, {
        code: "TOKEN_INVALID",
        message: "Invalid token",
        statusCode: 400,
      });
    }
    if (currentPwdScenario === "token_expired") {
      return json(res, 401, {
        code: "TOKEN_EXPIRED",
        message: "Token expired",
        statusCode: 401,
      });
    }
    return json(res, 200, {
      success: true,
      emailHint: "t***t@example.com",
      schoolSlug: null,
      questions: MOCK_PIN_QUESTIONS,
    });
  }

  if (method === "POST" && url === "/api/auth/forgot-password/verify") {
    if (currentPwdScenario === "invalid_recovery") {
      return json(res, 400, {
        code: "RECOVERY_INVALID",
        message: "Invalid recovery info",
        statusCode: 400,
      });
    }
    return json(res, 200, { success: true, verified: true });
  }

  if (method === "POST" && url === "/api/auth/forgot-password/complete") {
    if (currentPwdScenario === "same_password") {
      return json(res, 400, {
        code: "SAME_PASSWORD",
        message: "Same password not allowed",
        statusCode: 400,
      });
    }
    return json(res, 200, { success: true });
  }

  // ── Route inconnue ────────────────────────────────────────────
  json(res, 404, { message: "Not found", statusCode: 404 });
}

// ────────────────────────── Cycle de vie ──────────────────────────

function checkPortFree(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `[E2E] Le port ${port} est déjà utilisé.\n` +
              "Arrêtez l'API réelle avant de lancer les tests E2E :\n" +
              '  pkill -f "nest" || true',
          ),
        );
      } else {
        reject(err);
      }
    });
    probe.once("listening", () => probe.close(() => resolve()));
    probe.listen(port);
  });
}

async function startMockServer(port = 3001) {
  await checkPortFree(port);
  return new Promise((resolve, reject) => {
    server = http.createServer(handleRequest);
    server.listen(port, "0.0.0.0", () => {
      console.log(`[mock] serveur E2E démarré sur le port ${port}`);
      resolve();
    });
    server.on("error", reject);
  });
}

function stopMockServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => {
      console.log("[mock] serveur E2E arrêté");
      server = null;
      resolve();
    });
  });
}

module.exports = { startMockServer, stopMockServer, SCENARIOS };
