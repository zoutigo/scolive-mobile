/**
 * Tests E2E — Récupération de PIN
 *
 * Prérequis : voir auth-phone.e2e.ts
 * L'API réelle NE doit PAS tourner sur le port 3001.
 */

import { by, device, element, expect, waitFor } from "detox";

export {};

const MOCK_CONTROL_URL = "http://localhost:3001/__scenario";
const TIMEOUT = 10_000;
const SUBMIT_TIMEOUT = 8_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function setPinScenario(scenario: string): Promise<void> {
  const res = await fetch(`${MOCK_CONTROL_URL}/pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok)
    throw new Error(`setPinScenario("${scenario}") a échoué : ${res.status}`);
}

async function waitForLoginScreen(): Promise<void> {
  await waitFor(element(by.id("tab-phone")))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

async function resetToLoginScreen(): Promise<void> {
  await device.launchApp({ newInstance: true, delete: true });
  await waitForLoginScreen();
}

async function waitForPinRecoveryStep(stepId: string): Promise<void> {
  await waitFor(element(by.id(stepId)))
    .toBeVisible()
    .withTimeout(SUBMIT_TIMEOUT);
}

async function expectError(expectedText: string): Promise<void> {
  await waitFor(element(by.id("error-message")))
    .toBeVisible()
    .withTimeout(SUBMIT_TIMEOUT);
  await expect(element(by.id("error-message"))).toHaveText(expectedText);
}

async function navigateToPinRecovery(): Promise<void> {
  await waitForLoginScreen();
  await element(by.id("link-forgot-pin")).tap();
  await waitForPinRecoveryStep("step-1");
}

async function fillStep1Phone(phone: string): Promise<void> {
  await element(by.id("input-phone")).tap();
  await element(by.id("input-phone")).clearText();
  await element(by.id("input-phone")).typeText(phone);
  await element(by.id("btn-step1")).tap();
}

async function fillStep2(birthDate: string, answers: string[]): Promise<void> {
  await waitForPinRecoveryStep("step-2");
  await element(by.id("input-birthdate")).tap();
  await element(by.id("input-birthdate")).clearText();
  await element(by.id("input-birthdate")).typeText(birthDate);
  for (let i = 0; i < answers.length; i++) {
    await element(by.id(`input-answer-${i}`)).tap();
    await element(by.id(`input-answer-${i}`)).clearText();
    await element(by.id(`input-answer-${i}`)).typeText(answers[i]);
  }
  await element(by.id("btn-step2")).tap();
}

async function fillStep3(newPin: string, confirmPin: string): Promise<void> {
  await waitForPinRecoveryStep("step-3");
  await element(by.id("input-new-pin")).tap();
  await element(by.id("input-new-pin")).clearText();
  await element(by.id("input-new-pin")).typeText(newPin);
  await element(by.id("input-confirm-pin")).tap();
  await element(by.id("input-confirm-pin")).clearText();
  await element(by.id("input-confirm-pin")).typeText(confirmPin);
  await element(by.id("input-confirm-pin")).tapReturnKey();
  await element(by.id("btn-step3")).tap();
}

// ── Constantes de test ────────────────────────────────────────────────────────

const VALID_PHONE = "650000001";
const VALID_BIRTH_DATE = "15011990";
const VALID_ANSWERS = ["dupont", "yaoundé", "football"];
const VALID_NEW_PIN = "654321";

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("Récupération de PIN", () => {
  afterAll(async () => {
    await device.terminateApp();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Validation côté client
  // ──────────────────────────────────────────────────────────────────────────
  describe("Validation côté client — Step 1", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await navigateToPinRecovery();
    });

    it("affiche une erreur si le téléphone est vide", async () => {
      await element(by.id("btn-step1")).tap();
      await waitFor(element(by.id("error-phone")))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.id("error-phone"))).toHaveText(
        "Le numéro de téléphone est requis.",
      );
    });

    it("affiche une erreur si le téléphone n'a pas 9 chiffres", async () => {
      await element(by.id("input-phone")).typeText("65000000");
      await element(by.id("btn-step1")).tap();
      await waitFor(element(by.id("error-phone")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Erreurs API sur step 1
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API — Step 1", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await navigateToPinRecovery();
    });

    it('affiche "Aucun compte trouvé" sur NOT_FOUND', async () => {
      await setPinScenario("not_found");
      await fillStep1Phone(VALID_PHONE);
      await expectError("Aucun compte trouvé avec ces informations.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Erreurs API sur step 2
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API — Step 2", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPinScenario("happy_path");
      await navigateToPinRecovery();
      await fillStep1Phone(VALID_PHONE);
    });

    it('affiche "Informations invalides" sur RECOVERY_INVALID', async () => {
      await setPinScenario("invalid_recovery");
      await fillStep2(VALID_BIRTH_DATE, VALID_ANSWERS);
      await expectError("Informations de récupération invalides.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Erreurs API sur step 3
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API — Step 3", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPinScenario("happy_path");
      await navigateToPinRecovery();
      await fillStep1Phone(VALID_PHONE);
      await fillStep2(VALID_BIRTH_DATE, VALID_ANSWERS);
    });

    it('affiche "Session expirée" sur RECOVERY_SESSION_EXPIRED', async () => {
      await setPinScenario("session_expired");
      await fillStep3(VALID_NEW_PIN, VALID_NEW_PIN);
      await expectError("Session expirée. Recommencez depuis le début.");
    });

    it('affiche "Même PIN" sur SAME_PIN', async () => {
      await setPinScenario("same_pin");
      await fillStep3(VALID_NEW_PIN, VALID_NEW_PIN);
      await expectError("Le nouveau PIN doit être différent de l'actuel.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Validation côté client — Step 3
  // ──────────────────────────────────────────────────────────────────────────
  describe("Validation côté client — Step 3", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPinScenario("happy_path");
      await navigateToPinRecovery();
      await fillStep1Phone(VALID_PHONE);
      await fillStep2(VALID_BIRTH_DATE, VALID_ANSWERS);
      await waitForPinRecoveryStep("step-3");
    });

    it("affiche une erreur si le nouveau PIN n'a pas 6 chiffres", async () => {
      await element(by.id("input-new-pin")).typeText("12345");
      await element(by.id("input-confirm-pin")).typeText("12345");
      await element(by.id("btn-step3")).tap();
      await waitFor(element(by.id("error-new-pin")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it("affiche une erreur si la confirmation ne correspond pas", async () => {
      await element(by.id("input-new-pin")).typeText("123456");
      await element(by.id("input-confirm-pin")).typeText("654321");
      await element(by.id("btn-step3")).tap();
      await waitFor(element(by.id("error-confirm-pin")))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.id("error-confirm-pin"))).toHaveText(
        "La confirmation ne correspond pas au PIN.",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Visibilité clavier — adjustPan garde les champs visibles au focus
  // ──────────────────────────────────────────────────────────────────────────
  describe("Visibilité clavier — champs visibles au focus", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPinScenario("happy_path");
      await navigateToPinRecovery();
      await fillStep1Phone(VALID_PHONE);
      await waitForPinRecoveryStep("step-2");
    });

    it("le 3e champ réponse reste visible après ouverture du clavier", async () => {
      // Le 3e champ (index 2) est en bas d'écran et était masqué avant adjustPan
      await element(by.id("input-answer-2")).tap();
      await waitFor(element(by.id("input-answer-2")))
        .toBeVisible()
        .withTimeout(2000);
    });

    it("le champ date de naissance reste visible après ouverture du clavier", async () => {
      await element(by.id("input-birthdate")).tap();
      await waitFor(element(by.id("input-birthdate")))
        .toBeVisible()
        .withTimeout(2000);
    });

    it("le champ confirmation PIN reste visible au focus sur step-3", async () => {
      await fillStep2(VALID_BIRTH_DATE, VALID_ANSWERS);
      await waitForPinRecoveryStep("step-3");
      await element(by.id("input-confirm-pin")).tap();
      await waitFor(element(by.id("input-confirm-pin")))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Happy path complet
  // ──────────────────────────────────────────────────────────────────────────
  describe("Happy path — Récupération complète", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPinScenario("happy_path");
    });

    it("complète le workflow en 3 étapes et affiche l'écran de succès", async () => {
      await navigateToPinRecovery();
      await fillStep1Phone(VALID_PHONE);
      await fillStep2(VALID_BIRTH_DATE, VALID_ANSWERS);
      await fillStep3(VALID_NEW_PIN, VALID_NEW_PIN);
      await waitForPinRecoveryStep("step-4");
      await expect(element(by.id("btn-go-login"))).toBeVisible();
    });

    it("revient sur l'écran de login après le succès", async () => {
      await element(by.id("btn-go-login")).tap();
      await waitForLoginScreen();
    });
  });
});
