/**
 * Tests E2E — Authentification par email
 */

import { by, device, element, expect, waitFor } from "detox";

export {};

const MOCK_CONTROL_URL = "http://localhost:3001/__scenario";
const LOGIN_SCREEN_TIMEOUT = 10_000;
const SUBMIT_TIMEOUT = 8_000;

const VALID_EMAIL = "parent@ecole.cm";
const VALID_PASSWORD = "TempPass11";

async function setScenario(scenario: string): Promise<void> {
  const res = await fetch(`${MOCK_CONTROL_URL}/email-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    throw new Error(`setScenario("${scenario}") a échoué : ${res.status}`);
  }
}

async function openEmailTab(): Promise<void> {
  await waitFor(element(by.id("tab-email")))
    .toBeVisible()
    .withTimeout(LOGIN_SCREEN_TIMEOUT);
  await element(by.id("tab-email")).tap();
  await waitFor(element(by.id("panel-email")))
    .toBeVisible()
    .withTimeout(SUBMIT_TIMEOUT);
}

async function waitForLoginScreen(): Promise<void> {
  await waitFor(element(by.id("tab-phone")))
    .toBeVisible()
    .withTimeout(LOGIN_SCREEN_TIMEOUT);
}

async function waitForHomeScreen(): Promise<void> {
  await waitFor(element(by.id("logout-button")))
    .toBeVisible()
    .withTimeout(SUBMIT_TIMEOUT);
}

async function resetToLoginScreen(): Promise<void> {
  await device.reloadReactNative();
  try {
    await waitFor(element(by.id("logout-button")))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id("logout-button")).tap();
  } catch {
    // L'application est deja revenue au login.
  }
  await waitForLoginScreen();
}

async function submitEmailLogin(
  email: string,
  password: string,
): Promise<void> {
  await openEmailTab();
  await element(by.id("input-email")).tap();
  await element(by.id("input-email")).clearText();
  if (email) {
    await element(by.id("input-email")).typeText(email);
  }

  await element(by.id("input-password")).tap();
  await element(by.id("input-password")).clearText();
  if (password) {
    await element(by.id("input-password")).typeText(password);
    await element(by.id("input-password")).tapReturnKey();
  }

  await element(by.id("submit-login")).tap();
}

async function expectError(expectedText: string): Promise<void> {
  await waitFor(element(by.id("error-message")))
    .toBeVisible()
    .withTimeout(SUBMIT_TIMEOUT);
  await expect(element(by.id("error-message"))).toHaveText(expectedText);
}

describe("Auth — Login par email", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await waitForLoginScreen();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe("Validation côté client", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it("affiche une erreur si l'adresse email est invalide", async () => {
      await submitEmailLogin("invalid-email", VALID_PASSWORD);
      await expectError("Adresse email invalide.");
    });

    it("affiche une erreur si le mot de passe est vide", async () => {
      await submitEmailLogin(VALID_EMAIL, "");
      await expectError("Mot de passe requis.");
    });

    it("efface l'erreur lorsqu'on change d'onglet", async () => {
      await submitEmailLogin("invalid-email", VALID_PASSWORD);
      await waitFor(element(by.id("error-message")))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id("tab-phone")).tap();
      await element(by.id("tab-email")).tap();

      await expect(element(by.id("error-message"))).not.toBeVisible();
    });
  });

  describe("Erreurs API", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it('affiche "Identifiants incorrects" sur une réponse 401', async () => {
      await setScenario("invalid_credentials");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await expectError("Identifiants incorrects. Vérifiez vos informations.");
    });

    it('affiche "Trop de tentatives" sur AUTH_RATE_LIMITED', async () => {
      await setScenario("rate_limited");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await expectError("Trop de tentatives. Réessayez dans quelques minutes.");
    });

    it('affiche "Compte suspendu" sur ACCOUNT_SUSPENDED', async () => {
      await setScenario("account_suspended");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await expectError(
        "Votre compte a été suspendu. Contactez votre administration.",
      );
    });

    it('affiche "En attente d\'activation" sur ACCOUNT_VALIDATION_REQUIRED', async () => {
      await setScenario("not_activated");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await expectError("Votre compte est en attente d'activation.");
    });

    it('affiche "Impossible de se connecter" sur une erreur réseau', async () => {
      await setScenario("network_error");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await expectError(
        "Impossible de se connecter. Vérifiez votre connexion.",
      );
    });
  });

  describe("Transitions de workflow", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it("redirige vers l'onboarding si le mot de passe doit être changé", async () => {
      await setScenario("password_change_required");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await waitFor(element(by.id("step-1")))
        .toBeVisible()
        .withTimeout(SUBMIT_TIMEOUT);
    });

    it("redirige vers l'onboarding si le profil est incomplet", async () => {
      await setScenario("profile_setup_required");
      await submitEmailLogin("prof@ecole.cm", VALID_PASSWORD);
      await waitFor(element(by.id("step-1")))
        .toBeVisible()
        .withTimeout(SUBMIT_TIMEOUT);
    });

    it("ouvre le workflow de récupération de mot de passe", async () => {
      await openEmailTab();
      await element(by.id("link-forgot-password")).tap();
      await waitFor(element(by.id("step-1")))
        .toBeVisible()
        .withTimeout(SUBMIT_TIMEOUT);
    });
  });

  describe("Retry et succès", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setScenario("happy_path");
    });

    it("permet de resoumettre après une erreur 401", async () => {
      await setScenario("invalid_credentials");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await expectError("Identifiants incorrects. Vérifiez vos informations.");

      await setScenario("happy_path");
      await element(by.id("submit-login")).tap();
      await waitForHomeScreen();
    });

    it("navigue vers HomeScreen après une connexion valide", async () => {
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await waitForHomeScreen();
      await expect(element(by.id("user-name"))).toBeVisible();
    });

    it("permet de se déconnecter après une connexion email", async () => {
      await setScenario("happy_path");
      await submitEmailLogin(VALID_EMAIL, VALID_PASSWORD);
      await waitForHomeScreen();
      await element(by.id("logout-button")).tap();
      await waitForLoginScreen();
    });
  });
});
