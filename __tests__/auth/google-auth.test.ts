jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { executionEnvironment: "bare" },
  ExecutionEnvironment: {
    StoreClient: "storeClient",
    Bare: "bare",
  },
}));

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
  warmUpAsync: jest.fn(),
  coolDownAsync: jest.fn(),
}));

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    Platform: {
      ...actual.Platform,
      OS: "android",
    },
  };
});

import type { WebBrowserAuthSessionResult } from "expo-web-browser";

const { GoogleAuthError, buildGoogleSsoStartUrl, signInWithGoogleAsync } =
  require("../../src/auth/google-auth") as typeof import("../../src/auth/google-auth");
const WebBrowser =
  require("expo-web-browser") as typeof import("expo-web-browser");

describe("google-auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_WEB_URL;
    jest.spyOn(WebBrowser, "warmUpAsync").mockResolvedValue({} as never);
    jest.spyOn(WebBrowser, "coolDownAsync").mockResolvedValue({} as never);
    jest.spyOn(WebBrowser, "openAuthSessionAsync").mockResolvedValue({
      type: "opened",
    } as WebBrowserAuthSessionResult);
  });

  it("construit l'URL SSO Google par défaut", () => {
    expect(buildGoogleSsoStartUrl()).toBe(
      "http://localhost:3000/auth/mobile-sso-start?redirectUri=scolive%3A%2F%2Fauth%2Fcallback&webBaseUrl=http%3A%2F%2Flocalhost%3A3000",
    );
  });

  it("utilise EXPO_PUBLIC_WEB_URL si défini", () => {
    process.env.EXPO_PUBLIC_WEB_URL = "https://app.scolive.test";

    expect(buildGoogleSsoStartUrl()).toBe(
      "https://app.scolive.test/auth/mobile-sso-start?redirectUri=scolive%3A%2F%2Fauth%2Fcallback&webBaseUrl=https%3A%2F%2Fapp.scolive.test",
    );
  });

  it("ouvre un navigateur d'authentification avec l'URL SSO Google", async () => {
    await signInWithGoogleAsync();

    expect(WebBrowser.warmUpAsync).toHaveBeenCalled();
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      "http://localhost:3000/auth/mobile-sso-start?redirectUri=scolive%3A%2F%2Fauth%2Fcallback&webBaseUrl=http%3A%2F%2Flocalhost%3A3000",
      "scolive://auth/callback",
    );
    expect(WebBrowser.coolDownAsync).toHaveBeenCalled();
  });

  it("échoue si l'ouverture du navigateur d'authentification casse", async () => {
    jest
      .spyOn(WebBrowser, "openAuthSessionAsync")
      .mockRejectedValue(new Error("boom"));

    await expect(signInWithGoogleAsync()).rejects.toEqual(
      new GoogleAuthError(
        "GOOGLE_AUTH_FAILED",
        "Impossible d'ouvrir la connexion Google.",
      ),
    );
  });
});
