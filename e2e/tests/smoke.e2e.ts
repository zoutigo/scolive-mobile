/**
 * Smoke E2E — validation de l'infrastructure de test Android/Detox.
 *
 * Cette suite doit rester minimale :
 *   - lancement de l'app
 *   - rendu de l'écran de login
 *   - validation client locale, sans dépendre du backend mocké
 */

import { by, device, element, expect, waitFor } from "detox";

export {};

const LOGIN_SCREEN_TIMEOUT = 15_000;
const SUBMIT_TIMEOUT = 8_000;

async function waitForLoginScreen(): Promise<void> {
  await waitFor(element(by.id("tab-phone")))
    .toBeVisible()
    .withTimeout(LOGIN_SCREEN_TIMEOUT);
  await expect(element(by.id("tab-email"))).toBeVisible();
}

describe("Smoke — Android Detox", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await waitForLoginScreen();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it("affiche l'écran de login", async () => {
    await expect(element(by.id("tab-phone"))).toBeVisible();
    await expect(element(by.id("tab-email"))).toBeVisible();
  });

  it("exécute une validation client locale sur l'onglet email", async () => {
    await element(by.id("tab-email")).tap();
    await waitFor(element(by.id("panel-email")))
      .toBeVisible()
      .withTimeout(SUBMIT_TIMEOUT);

    await element(by.id("input-email")).tap();
    await element(by.id("input-email")).replaceText("invalid-email");
    await element(by.id("input-password")).tap();
    await element(by.id("input-password")).replaceText("TempPass11");
    await element(by.id("submit-login")).tap();

    await waitFor(element(by.id("error-message")))
      .toBeVisible()
      .withTimeout(SUBMIT_TIMEOUT);
    await expect(element(by.id("error-message"))).toHaveText(
      "Adresse email invalide.",
    );
  });
});
