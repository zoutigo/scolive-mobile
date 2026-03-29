/**
 * Tests E2E — Première connexion / onboarding
 */

import { by, device, element, expect, waitFor } from "detox";

export {};

const MOCK_CONTROL_URL = "http://localhost:3001/__scenario";
const LOGIN_SCREEN_TIMEOUT = 10_000;
const SUBMIT_TIMEOUT = 8_000;

async function setPhoneLoginScenario(scenario: string): Promise<void> {
  const res = await fetch(MOCK_CONTROL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    throw new Error(
      `setPhoneLoginScenario("${scenario}") a échoué : ${res.status}`,
    );
  }
}

async function setEmailLoginScenario(scenario: string): Promise<void> {
  const res = await fetch(`${MOCK_CONTROL_URL}/email-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    throw new Error(
      `setEmailLoginScenario("${scenario}") a échoué : ${res.status}`,
    );
  }
}

async function setOnboardingScenario(scenario: string): Promise<void> {
  const res = await fetch(`${MOCK_CONTROL_URL}/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) {
    throw new Error(
      `setOnboardingScenario("${scenario}") a échoué : ${res.status}`,
    );
  }
}

async function waitForLoginScreen(): Promise<void> {
  await waitFor(element(by.id("tab-phone")))
    .toBeVisible()
    .withTimeout(LOGIN_SCREEN_TIMEOUT);
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

async function submitEmailLogin(
  email: string,
  password: string,
): Promise<void> {
  await element(by.id("tab-email")).tap();
  await element(by.id("input-email")).tap();
  await element(by.id("input-email")).clearText();
  await element(by.id("input-email")).typeText(email);
  await element(by.id("input-password")).tap();
  await element(by.id("input-password")).clearText();
  await element(by.id("input-password")).typeText(password);
  await element(by.id("input-password")).tapReturnKey();
  await element(by.id("submit-login")).tap();
}

async function submitPhoneLogin(phone: string, pin: string): Promise<void> {
  await element(by.id("input-phone")).tap();
  await element(by.id("input-phone")).clearText();
  await element(by.id("input-phone")).typeText(phone);
  await element(by.id("input-pin")).tap();
  await element(by.id("input-pin")).clearText();
  await element(by.id("input-pin")).typeText(pin);
  await element(by.id("input-pin")).tapReturnKey();
  await element(by.id("submit-login")).tap();
}

async function completeEmailProfileSteps(): Promise<void> {
  await waitForStep("step-1");
  await element(by.id("input-temporary-password")).tap();
  await element(by.id("input-temporary-password")).typeText("TempPass11");
  await element(by.id("input-new-password")).tap();
  await element(by.id("input-new-password")).typeText("NewPassWord9");
  await element(by.id("input-confirm-password")).tap();
  await element(by.id("input-confirm-password")).typeText("NewPassWord9");
  await element(by.id("btn-step1")).tap();

  await waitForStep("step-2");
  await element(by.id("input-first-name")).tap();
  await element(by.id("input-first-name")).typeText("Lisa");
  await element(by.id("input-last-name")).tap();
  await element(by.id("input-last-name")).typeText("Mbele");
  await element(by.id("gender-F")).tap();
  await element(by.id("input-birthdate")).tap();
  await element(by.id("input-birthdate")).typeText("09011987");
  await element(by.id("btn-step2")).tap();
}

async function completeRecoveryForParent(): Promise<void> {
  await waitForStep("step-3");
  await element(by.id("question-MOTHER_MAIDEN_NAME")).tap();
  await element(by.id("question-BIRTH_CITY")).tap();
  await element(by.id("question-FAVORITE_SPORT")).tap();
  await element(by.id("input-answer-0")).tap();
  await element(by.id("input-answer-0")).typeText("Abena");
  await element(by.id("input-answer-1")).tap();
  await element(by.id("input-answer-1")).typeText("Douala");
  await element(by.id("input-answer-2")).tap();
  await element(by.id("input-answer-2")).typeText("Basket");
  await element(by.id("parent-class-class-1")).tap();
  await element(by.id("parent-student-student-1")).tap();
  await element(by.id("btn-submit-onboarding")).tap();
}

async function completePhoneOnboarding(): Promise<void> {
  await waitForStep("step-1");
  await element(by.id("btn-step1")).tap();

  await waitForStep("step-2");
  await element(by.id("input-first-name")).tap();
  await element(by.id("input-first-name")).typeText("Jean");
  await element(by.id("input-last-name")).tap();
  await element(by.id("input-last-name")).typeText("Dupont");
  await element(by.id("gender-M")).tap();
  await element(by.id("input-birthdate")).tap();
  await element(by.id("input-birthdate")).typeText("15011990");
  await element(by.id("btn-step2")).tap();

  await waitForStep("step-3");
  await element(by.id("input-new-pin")).tap();
  await element(by.id("input-new-pin")).typeText("654321");
  await element(by.id("input-confirm-pin")).tap();
  await element(by.id("input-confirm-pin")).typeText("654321");
  await element(by.id("btn-step3")).tap();

  await waitForStep("step-4");
  await element(by.id("question-MOTHER_MAIDEN_NAME")).tap();
  await element(by.id("question-BIRTH_CITY")).tap();
  await element(by.id("question-FAVORITE_SPORT")).tap();
  await element(by.id("input-answer-0")).tap();
  await element(by.id("input-answer-0")).typeText("Amina");
  await element(by.id("input-answer-1")).tap();
  await element(by.id("input-answer-1")).typeText("Yaounde");
  await element(by.id("input-answer-2")).tap();
  await element(by.id("input-answer-2")).typeText("Football");
  await element(by.id("btn-submit-onboarding")).tap();
}

describe("Onboarding mobile", () => {
  afterAll(async () => {
    await device.terminateApp();
  });

  describe("Validation client", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it("valide le mot de passe provisoire en étape 1 email", async () => {
      await setEmailLoginScenario("password_change_required");
      await setOnboardingScenario("email_parent_happy");
      await submitEmailLogin("parent@ecole.cm", "TempPass11");
      await waitForStep("step-1");

      await element(by.id("input-temporary-password")).clearText();
      await element(by.id("btn-step1")).tap();

      await waitFor(element(by.id("error-temporary-password")))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.id("error-temporary-password"))).toHaveText(
        "Le mot de passe provisoire est obligatoire.",
      );
    });

    it("valide le PIN en étape 3 phone", async () => {
      await setPhoneLoginScenario("profile_setup_required");
      await setOnboardingScenario("phone_happy");
      await submitPhoneLogin("650000001", "123456");
      await waitForStep("step-1");
      await element(by.id("btn-step1")).tap();

      await waitForStep("step-2");
      await element(by.id("input-first-name")).typeText("Jean");
      await element(by.id("input-last-name")).typeText("Dupont");
      await element(by.id("gender-M")).tap();
      await element(by.id("input-birthdate")).typeText("15011990");
      await element(by.id("btn-step2")).tap();

      await waitForStep("step-3");
      await element(by.id("input-new-pin")).typeText("123");
      await element(by.id("input-confirm-pin")).typeText("123");
      await element(by.id("btn-step3")).tap();

      await waitFor(element(by.id("error-newPin")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe("Parcours complet", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it("termine le workflow email de première connexion", async () => {
      await setEmailLoginScenario("password_change_required");
      await setOnboardingScenario("email_parent_happy");

      await submitEmailLogin("parent@ecole.cm", "TempPass11");
      await completeEmailProfileSteps();
      await completeRecoveryForParent();

      await waitForStep("step-5");
      await expect(element(by.id("btn-go-login"))).toBeVisible();
      await element(by.id("btn-go-login")).tap();
      await waitForLoginScreen();
    });

    it("termine le workflow phone de première connexion", async () => {
      await setPhoneLoginScenario("profile_setup_required");
      await setOnboardingScenario("phone_happy");

      await submitPhoneLogin("650000001", "123456");
      await completePhoneOnboarding();

      await waitForStep("step-5");
      await expect(element(by.id("btn-go-login"))).toBeVisible();
    });
  });

  describe("Erreurs API", () => {
    beforeEach(async () => {
      await resetToLoginScreen();
    });

    it("affiche l'erreur backend sur la finalisation email", async () => {
      await setEmailLoginScenario("password_change_required");
      await setOnboardingScenario("complete_email_in_use");

      await submitEmailLogin("parent@ecole.cm", "TempPass11");
      await completeEmailProfileSteps();
      await completeRecoveryForParent();

      await expectError("Cette adresse email est deja utilisee.");
    });

    it("affiche une erreur si les options d'onboarding ne chargent pas", async () => {
      await setEmailLoginScenario("password_change_required");
      await setOnboardingScenario("options_error");

      await submitEmailLogin("parent@ecole.cm", "TempPass11");
      await expectError("Impossible de charger les options d'activation.");
    });

    it("affiche une erreur backend sur la finalisation phone", async () => {
      await setPhoneLoginScenario("profile_setup_required");
      await setOnboardingScenario("invalid_activation");

      await submitPhoneLogin("650000001", "123456");
      await completePhoneOnboarding();

      await expectError("Identifiants incorrects. Vérifiez vos informations.");
    });
  });
});
