/**
 * Tests E2E — Authentification par téléphone
 *
 * Prérequis :
 *   - L'API réelle NE doit PAS tourner sur le port 3001 (le mock server l'occupe)
 *   - Metro doit tourner : npm start
 *   - L'émulateur Scolive_Dev_AOSP_API33 doit être démarré
 *   - L'APK de test doit être installé : npm run e2e:build
 *
 * Lancement : npm run e2e:test
 */

import { by, device, element, expect, waitFor } from "detox";

export {};

// ────────────── Helpers ──────────────────────────────────────────────────────

const MOCK_CONTROL_URL = "http://localhost:3001/__scenario";
const LOGIN_SCREEN_TIMEOUT = 10_000;
const SUBMIT_TIMEOUT = 8_000;

/** Change le scénario du mock server avant chaque test. */
async function setScenario(scenario: string): Promise<void> {
  const res = await fetch(MOCK_CONTROL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    throw new Error(`setScenario("${scenario}") a échoué : ${res.status}`);
  }
}

/** Attend l'affichage de l'écran de connexion (onglet Téléphone visible). */
async function waitForLoginScreen(): Promise<void> {
  await waitFor(element(by.id("tab-phone")))
    .toBeVisible()
    .withTimeout(LOGIN_SCREEN_TIMEOUT);
}

/** Attend l'affichage de HomeScreen (bouton déconnexion visible). */
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

/** Remplit les champs téléphone et PIN puis soumet. */
async function submitPhoneLogin(phone: string, pin: string): Promise<void> {
  await element(by.id("input-phone")).tap();
  await element(by.id("input-phone")).clearText();
  await element(by.id("input-phone")).typeText(phone);

  await element(by.id("input-pin")).tap();
  await element(by.id("input-pin")).clearText();
  await element(by.id("input-pin")).typeText(pin);

  // Ferme le clavier avant de taper le bouton
  await element(by.id("input-pin")).tapReturnKey();
  await element(by.id("submit-login")).tap();
}

/** Attend l'affichage de la boîte d'erreur et vérifie son texte. */
async function expectError(expectedText: string): Promise<void> {
  await waitFor(element(by.id("error-message")))
    .toBeVisible()
    .withTimeout(SUBMIT_TIMEOUT);
  await expect(element(by.id("error-message"))).toHaveText(expectedText);
}

// Numéros/PIN utilisés dans les tests (pas de compte réel nécessaire)
const VALID_PHONE = "650000001";
const VALID_PIN = "123456";

// ────────────── Suite principale ─────────────────────────────────────────────

describe("Auth — Login par téléphone", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await waitForLoginScreen();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Validation côté client (aucun appel réseau)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Validation côté client", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it("affiche une erreur si le numéro a moins de 8 chiffres", async () => {
      await submitPhoneLogin("1234567", VALID_PIN); // 7 chiffres
      await expectError("Numéro de téléphone invalide.");
    });

    it("affiche une erreur si le PIN ne contient pas exactement 6 chiffres", async () => {
      await submitPhoneLogin(VALID_PHONE, "12345"); // 5 chiffres
      await expectError("Le code PIN doit contenir exactement 6 chiffres.");
    });

    it("affiche une erreur si le PIN contient des lettres", async () => {
      await submitPhoneLogin(VALID_PHONE, "abc123");
      await expectError("Le code PIN doit contenir exactement 6 chiffres.");
    });

    it("affiche une erreur si le champ téléphone est vide", async () => {
      await submitPhoneLogin("", VALID_PIN);
      await expectError("Numéro de téléphone invalide.");
    });

    it("l'erreur disparaît lorsqu'on change d'onglet puis revient", async () => {
      // Génère une erreur de validation
      await submitPhoneLogin("123", VALID_PIN);
      await waitFor(element(by.id("error-message")))
        .toBeVisible()
        .withTimeout(3000);

      // Bascule sur l'onglet Email puis revient sur Téléphone
      await element(by.id("tab-email")).tap();
      await element(by.id("tab-phone")).tap();

      // L'erreur doit avoir disparu
      await expect(element(by.id("error-message"))).not.toBeVisible();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Erreurs retournées par l'API (mock server)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it('affiche "Identifiants incorrects" sur une réponse 401', async () => {
      await setScenario("invalid_credentials");
      await submitPhoneLogin(VALID_PHONE, VALID_PIN);
      await expectError("Identifiants incorrects. Vérifiez vos informations.");
    });

    it('affiche "Trop de tentatives" sur AUTH_RATE_LIMITED', async () => {
      await setScenario("rate_limited");
      await submitPhoneLogin(VALID_PHONE, VALID_PIN);
      await expectError("Trop de tentatives. Réessayez dans quelques minutes.");
    });

    it('affiche "Compte suspendu" sur ACCOUNT_SUSPENDED', async () => {
      await setScenario("account_suspended");
      await submitPhoneLogin(VALID_PHONE, VALID_PIN);
      await expectError(
        "Votre compte a été suspendu. Contactez votre administration.",
      );
    });

    it('affiche "En attente d\'activation" sur ACCOUNT_VALIDATION_REQUIRED', async () => {
      await setScenario("not_activated");
      await submitPhoneLogin(VALID_PHONE, VALID_PIN);
      await expectError("Votre compte est en attente d'activation.");
    });

    it('affiche "Impossible de se connecter" sur une erreur réseau', async () => {
      await setScenario("network_error");
      await submitPhoneLogin(VALID_PHONE, VALID_PIN);
      await expectError(
        "Impossible de se connecter. Vérifiez votre connexion.",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Retry après erreur (le formulaire reste fonctionnel)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Retry après erreur", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setScenario("happy_path");
    });

    it("permet de soumettre à nouveau après une erreur 401", async () => {
      // 1ère tentative → erreur
      await setScenario("invalid_credentials");
      await submitPhoneLogin(VALID_PHONE, VALID_PIN);
      await expectError("Identifiants incorrects. Vérifiez vos informations.");

      // 2ème tentative → succès
      await setScenario("happy_path");
      await element(by.id("submit-login")).tap();
      await waitForHomeScreen();
    });

    it("permet de corriger les champs après une erreur de validation", async () => {
      // Erreur de validation (PIN trop court)
      await submitPhoneLogin(VALID_PHONE, "12345");
      await expectError("Le code PIN doit contenir exactement 6 chiffres.");

      // Correction + re-soumission
      await setScenario("happy_path");
      await element(by.id("input-pin")).clearText();
      await element(by.id("input-pin")).typeText(VALID_PIN);
      await element(by.id("submit-login")).tap();
      await waitForHomeScreen();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Visibilité clavier — adjustPan garde les champs visibles au focus
  // ──────────────────────────────────────────────────────────────────────────
  describe("Visibilité clavier — champs visibles au focus", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it("input-pin reste visible après ouverture du clavier", async () => {
      await element(by.id("input-phone")).tap();
      await element(by.id("input-phone")).typeText(VALID_PHONE);
      await element(by.id("input-pin")).tap();
      await waitFor(element(by.id("input-pin")))
        .toBeVisible()
        .withTimeout(2000);
    });

    it("input-password (onglet Email) reste visible après ouverture du clavier", async () => {
      await element(by.id("tab-email")).tap();
      await element(by.id("input-email")).tap();
      await element(by.id("input-email")).typeText("test@test.cm");
      await element(by.id("input-password")).tap();
      await waitFor(element(by.id("input-password")))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Connexion réussie (en dernier — laisse des tokens dans SecureStore)
  // ──────────────────────────────────────────────────────────────────────────
  describe("Connexion réussie", () => {
    beforeAll(async () => {
      await resetToLoginScreen();
      await setScenario("happy_path");
    });

    it("navigue vers HomeScreen après une connexion valide", async () => {
      await submitPhoneLogin(VALID_PHONE, VALID_PIN);
      await waitForHomeScreen();
      await expect(element(by.id("user-name"))).toBeVisible();
    });

    it("HomeScreen affiche le bouton de déconnexion", async () => {
      await expect(element(by.id("logout-button"))).toBeVisible();
    });

    it("la déconnexion ramène sur l'écran de login", async () => {
      await element(by.id("logout-button")).tap();
      await waitForLoginScreen();
    });
  });
});
