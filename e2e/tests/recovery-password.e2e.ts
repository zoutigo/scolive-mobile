/**
 * Tests E2E — Récupération de mot de passe
 *
 * Prérequis : voir auth-phone.e2e.ts
 * L'API réelle NE doit PAS tourner sur le port 3001.
 */

import { by, device, element, expect, waitFor } from "detox";

export {};

const MOCK_CONTROL_URL = "http://localhost:3001/__scenario";
const TIMEOUT = 10_000;
const SUBMIT_TIMEOUT = 8_000;
const VALID_TOKEN = "a".repeat(48);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function setPwdScenario(scenario: string): Promise<void> {
  const res = await fetch(`${MOCK_CONTROL_URL}/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok)
    throw new Error(`setPwdScenario("${scenario}") a échoué : ${res.status}`);
}

async function waitForLoginScreen(): Promise<void> {
  await waitFor(element(by.id("tab-phone")))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

async function resetToLoginScreen(): Promise<void> {
  try {
    await waitForLoginScreen();
    return;
  } catch {
    // L'application n'est pas encore sur le login.
  }

  try {
    await device.reloadReactNative();
  } catch {
    await device.launchApp({ newInstance: true });
  }

  await waitForLoginScreen();
}

async function waitForStep(stepId: string): Promise<void> {
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

async function navigateToPasswordRecovery(): Promise<void> {
  await waitForLoginScreen();
  // L'onglet Email doit être actif pour que le lien "Mot de passe oublié ?" soit visible
  await element(by.id("tab-email")).tap();
  await element(by.id("link-forgot-password")).tap();
  await waitForStep("step-1");
}

async function fillStep1Email(email: string): Promise<void> {
  await element(by.id("input-email")).tap();
  await element(by.id("input-email")).clearText();
  await element(by.id("input-email")).typeText(email);
  await element(by.id("btn-step1")).tap();
}

async function fillStep2Token(token: string): Promise<void> {
  await waitForStep("step-2");
  await element(by.id("input-token")).tap();
  await element(by.id("input-token")).clearText();
  await element(by.id("input-token")).typeText(token);
  await element(by.id("btn-step2")).tap();
}

async function fillStep3(birthDate: string, answers: string[]): Promise<void> {
  await waitForStep("step-3");
  await element(by.id("input-birthdate")).tap();
  await element(by.id("input-birthdate")).clearText();
  await element(by.id("input-birthdate")).typeText(birthDate);
  for (let i = 0; i < answers.length; i++) {
    await element(by.id(`input-answer-${i}`)).tap();
    await element(by.id(`input-answer-${i}`)).clearText();
    await element(by.id(`input-answer-${i}`)).typeText(answers[i]);
  }
  await element(by.id("btn-step3")).tap();
}

async function fillStep4(
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  await waitForStep("step-4");
  await element(by.id("input-new-password")).tap();
  await element(by.id("input-new-password")).clearText();
  await element(by.id("input-new-password")).typeText(newPassword);
  await element(by.id("input-confirm-password")).tap();
  await element(by.id("input-confirm-password")).clearText();
  await element(by.id("input-confirm-password")).typeText(confirmPassword);
  await element(by.id("btn-step4")).tap();
}

// ── Constantes de test ────────────────────────────────────────────────────────

const VALID_EMAIL = "test@example.com";
const VALID_BIRTH_DATE = "15011990";
const VALID_ANSWERS = ["dupont", "yaoundé", "football"];
const VALID_NEW_PASSWORD = "NewValidPass1";

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("Récupération de mot de passe", () => {
  afterAll(async () => {
    await device.terminateApp();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Validation côté client — Step 1
  // ──────────────────────────────────────────────────────────────────────────
  describe("Validation côté client — Step 1", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await navigateToPasswordRecovery();
    });

    it("affiche une erreur si l'email est vide", async () => {
      await element(by.id("btn-step1")).tap();
      await waitFor(element(by.id("error-email")))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.id("error-email"))).toHaveText(
        "L'adresse email est requise.",
      );
    });

    it("affiche une erreur si l'email est invalide", async () => {
      await element(by.id("input-email")).typeText("notanemail");
      await element(by.id("btn-step1")).tap();
      await waitFor(element(by.id("error-email")))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.id("error-email"))).toHaveText(
        "Adresse email invalide.",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Erreurs API — Step 1
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API — Step 1", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await navigateToPasswordRecovery();
    });

    it('affiche "Aucun compte trouvé" sur NOT_FOUND', async () => {
      await setPwdScenario("not_found");
      await fillStep1Email(VALID_EMAIL);
      await expectError("Aucun compte trouvé pour cette adresse email.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Validation côté client — Step 2
  // ──────────────────────────────────────────────────────────────────────────
  describe("Validation côté client — Step 2", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPwdScenario("happy_path");
      await navigateToPasswordRecovery();
      await fillStep1Email(VALID_EMAIL);
    });

    it("affiche une erreur si le token est vide", async () => {
      await waitForStep("step-2");
      await element(by.id("btn-step2")).tap();
      await waitFor(element(by.id("error-token")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it("affiche une erreur si le token est trop court", async () => {
      await waitForStep("step-2");
      await element(by.id("input-token")).typeText("short");
      await element(by.id("btn-step2")).tap();
      await waitFor(element(by.id("error-token")))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.id("error-token"))).toHaveText(
        "Le lien de réinitialisation est invalide (trop court).",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Erreurs API — Step 2
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API — Step 2", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPwdScenario("happy_path");
      await navigateToPasswordRecovery();
      await fillStep1Email(VALID_EMAIL);
    });

    it('affiche "Lien invalide" sur TOKEN_INVALID', async () => {
      await setPwdScenario("token_invalid");
      await fillStep2Token(VALID_TOKEN);
      await expectError("Lien de réinitialisation invalide.");
    });

    it('affiche "Lien expiré" sur TOKEN_EXPIRED', async () => {
      await setPwdScenario("token_expired");
      await fillStep2Token(VALID_TOKEN);
      await expectError("Le lien a expiré. Recommencez depuis le début.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Erreurs API — Step 3
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API — Step 3", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPwdScenario("happy_path");
      await navigateToPasswordRecovery();
      await fillStep1Email(VALID_EMAIL);
      await fillStep2Token(VALID_TOKEN);
    });

    it('affiche "Informations invalides" sur RECOVERY_INVALID', async () => {
      await setPwdScenario("invalid_recovery");
      await fillStep3(VALID_BIRTH_DATE, VALID_ANSWERS);
      await expectError("Informations de récupération invalides.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Validation côté client — Step 4
  // ──────────────────────────────────────────────────────────────────────────
  describe("Validation côté client — Step 4", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPwdScenario("happy_path");
      await navigateToPasswordRecovery();
      await fillStep1Email(VALID_EMAIL);
      await fillStep2Token(VALID_TOKEN);
      await fillStep3(VALID_BIRTH_DATE, VALID_ANSWERS);
      await waitForStep("step-4");
    });

    it("affiche une erreur si le mot de passe est trop court", async () => {
      await element(by.id("input-new-password")).typeText("Abc1");
      await element(by.id("input-confirm-password")).typeText("Abc1");
      await element(by.id("btn-step4")).tap();
      await waitFor(element(by.id("error-new-password")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it("affiche une erreur si le mot de passe ne contient pas de majuscule", async () => {
      await element(by.id("input-new-password")).typeText("validpass1");
      await element(by.id("input-confirm-password")).typeText("validpass1");
      await element(by.id("btn-step4")).tap();
      await waitFor(element(by.id("error-new-password")))
        .toBeVisible()
        .withTimeout(3000);
    });

    it("affiche une erreur si la confirmation ne correspond pas", async () => {
      await element(by.id("input-new-password")).typeText("ValidPass1");
      await element(by.id("input-confirm-password")).typeText("OtherPass2");
      await element(by.id("btn-step4")).tap();
      await waitFor(element(by.id("error-confirm-password")))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.id("error-confirm-password"))).toHaveText(
        "La confirmation ne correspond pas au nouveau mot de passe.",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Erreurs API — Step 4
  // ──────────────────────────────────────────────────────────────────────────
  describe("Erreurs API — Step 4", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPwdScenario("happy_path");
      await navigateToPasswordRecovery();
      await fillStep1Email(VALID_EMAIL);
      await fillStep2Token(VALID_TOKEN);
      await fillStep3(VALID_BIRTH_DATE, VALID_ANSWERS);
    });

    it('affiche "Même mot de passe" sur SAME_PASSWORD', async () => {
      await setPwdScenario("same_password");
      await fillStep4(VALID_NEW_PASSWORD, VALID_NEW_PASSWORD);
      await expectError(
        "Le nouveau mot de passe doit être différent de l'actuel.",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Visibilité clavier — adjustPan garde les champs visibles au focus
  // ──────────────────────────────────────────────────────────────────────────
  describe("Visibilité clavier — champs visibles au focus", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPwdScenario("happy_path");
      await navigateToPasswordRecovery();
      await fillStep1Email(VALID_EMAIL);
      await fillStep2Token(VALID_TOKEN);
      await waitForStep("step-3");
    });

    it("le 3e champ réponse reste visible après ouverture du clavier", async () => {
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

    it("le champ confirmation mot de passe reste visible au focus sur step-4", async () => {
      await fillStep3(VALID_BIRTH_DATE, VALID_ANSWERS);
      await waitForStep("step-4");
      await element(by.id("input-confirm-password")).tap();
      await waitFor(element(by.id("input-confirm-password")))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Happy path complet
  // ──────────────────────────────────────────────────────────────────────────
  describe("Happy path — Récupération complète", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
      await setPwdScenario("happy_path");
    });

    it("complète le workflow en 4 étapes et affiche l'écran de succès", async () => {
      await navigateToPasswordRecovery();
      await fillStep1Email(VALID_EMAIL);
      await fillStep2Token(VALID_TOKEN);
      await fillStep3(VALID_BIRTH_DATE, VALID_ANSWERS);
      await fillStep4(VALID_NEW_PASSWORD, VALID_NEW_PASSWORD);
      await waitForStep("step-5");
      await expect(element(by.id("btn-go-login"))).toBeVisible();
    });

    it("revient sur l'écran de login après le succès", async () => {
      await element(by.id("btn-go-login")).tap();
      await waitForLoginScreen();
    });
  });
});
