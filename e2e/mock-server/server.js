"use strict";

/**
 * Mock HTTP server pour les tests E2E — remplace l'API réelle sur le port 3001.
 *
 * Endpoints applicatifs (appelés depuis l'app Android via 10.0.2.2:3001) :
 *   POST /api/auth/login-phone   → réponse pilotée par le scénario courant
 *   POST /api/auth/logout        → 204 (toujours OK)
 *   POST /api/auth/refresh       → 401 (forçage d'une nouvelle authentification)
 *   GET  /api/health             → 200
 *
 * Endpoint de contrôle (appelé depuis les tests Jest sur localhost:3001) :
 *   POST /__scenario             → change le scénario courant
 *   GET  /__scenario             → lit le scénario courant (debug)
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
};

// ────────────────────────── État courant ──────────────────────────

let currentScenario = "happy_path";
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

  // ── Endpoint de contrôle (tests → mock server) ──────────────
  if (url === "/__scenario") {
    if (method === "POST") {
      readBody(req).then((raw) => {
        try {
          const { scenario } = JSON.parse(raw);
          if (!SCENARIOS[scenario]) {
            return json(res, 400, {
              error: `Scénario inconnu : "${scenario}"`,
            });
          }
          currentScenario = scenario;
          console.log(`[mock] scénario → ${scenario}`);
          json(res, 200, { ok: true, scenario });
        } catch {
          json(res, 400, { error: "JSON invalide" });
        }
      });
      return;
    }
    if (method === "GET") {
      return json(res, 200, { scenario: currentScenario });
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
