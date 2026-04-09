import {
  parseApiError,
  parseGoogleSsoCallbackParams,
} from "../../src/auth/google-sso-callback";

describe("google-sso-callback helpers", () => {
  it("parse un callback Google valide", () => {
    expect(
      parseGoogleSsoCallbackParams({
        providerAccountId: "google-user-123",
        email: "USER@gmail.com",
        firstName: "Jean",
        lastName: "Dupont",
        avatarUrl: "https://example.com/avatar.png",
      }),
    ).toEqual({
      payload: {
        providerAccountId: "google-user-123",
        email: "user@gmail.com",
        firstName: "Jean",
        lastName: "Dupont",
        avatarUrl: "https://example.com/avatar.png",
      },
    });
  });

  it("retourne une erreur si les données minimales manquent", () => {
    expect(
      parseGoogleSsoCallbackParams({
        email: "user@gmail.com",
      }),
    ).toEqual({
      error: "Le compte Google ne fournit pas les informations requises.",
    });
  });

  it("retourne le message d'erreur du callback web", () => {
    expect(
      parseGoogleSsoCallbackParams({
        error: "GOOGLE_SSO_CALLBACK_FAILED",
        message: "Session SSO incomplete",
      }),
    ).toEqual({
      error: "Session SSO incomplete",
    });
  });

  it("mappe les erreurs API attendues", () => {
    expect(parseApiError({ code: "ACCOUNT_NOT_PROVISIONED" })).toBe(
      "Ce compte Google n'est pas encore autorisé par votre établissement.",
    );
  });
});
