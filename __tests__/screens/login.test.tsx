import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import LoginScreen from "../../app/login";
import { authApi } from "../../src/api/auth.api";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthState } from "../../src/store/auth.store";
import type { LoginResponse } from "../../src/types/auth.types";

// --- Mocks ---
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), replace: jest.fn() },
}));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock("expo-web-browser", () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));
jest.mock("../../src/api/auth.api");
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockRouter = jest.requireMock("expo-router").router as {
  replace: jest.Mock;
  back: jest.Mock;
};

const fakeLoginResponse: LoginResponse = {
  accessToken: "access-123",
  refreshToken: "refresh-456",
  tokenType: "Bearer",
  expiresIn: 86400,
  refreshExpiresIn: 2592000,
  schoolSlug: "ecole-test",
};

function setupStore(overrides: Partial<AuthState> = {}) {
  const mockHandleLoginResponse = jest.fn().mockResolvedValue(undefined);
  mockUseAuthStore.mockImplementation((selector: (s: AuthState) => unknown) =>
    selector({
      handleLoginResponse: mockHandleLoginResponse,
      ...overrides,
    } as AuthState),
  );
  return { mockHandleLoginResponse };
}

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
});

// ─── TAB NAVIGATION ────────────────────────────────────────────────────────

describe("Navigation par onglets", () => {
  it("affiche l'onglet Téléphone par défaut", () => {
    render(<LoginScreen />);
    expect(screen.getByTestId("input-phone")).toBeOnTheScreen();
    expect(screen.getByTestId("input-pin")).toBeOnTheScreen();
  });

  it("affiche le formulaire Email après clic sur l'onglet Email", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
    expect(screen.getByTestId("input-email")).toBeOnTheScreen();
    expect(screen.getByTestId("input-password")).toBeOnTheScreen();
  });

  it("affiche le bouton Google après clic sur l'onglet SSO", () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-sso"));
    expect(screen.getByTestId("sso-google")).toBeOnTheScreen();
  });

  it("efface l'erreur lors du changement d'onglet", async () => {
    mockAuthApi.loginPhone.mockRejectedValue(
      Object.assign(new Error("Identifiants incorrects."), { statusCode: 401 }),
    );
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-phone"));
    await waitFor(() =>
      expect(screen.getByTestId("error-banner")).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByTestId("tab-email"));
    expect(screen.queryByTestId("error-banner")).toBeNull();
  });
});

// ─── VALIDATION PHONE ──────────────────────────────────────────────────────

describe("Validation — onglet Téléphone", () => {
  it("affiche une erreur si le numéro est vide", async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("submit-phone"));
    await waitFor(() =>
      expect(screen.getByTestId("error-banner")).toBeOnTheScreen(),
    );
    expect(screen.getByText(/9 chiffres requis/)).toBeOnTheScreen();
  });

  it("affiche une erreur si le PIN n'a pas 6 chiffres", async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123");
    fireEvent.press(screen.getByTestId("submit-phone"));
    await waitFor(() =>
      expect(screen.getByText(/exactement 6 chiffres/)).toBeOnTheScreen(),
    );
  });

  it("n'appelle pas l'API si la validation échoue", async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("submit-phone"));
    await waitFor(() =>
      expect(screen.getByTestId("error-banner")).toBeOnTheScreen(),
    );
    expect(mockAuthApi.loginPhone).not.toHaveBeenCalled();
  });
});

// ─── VALIDATION EMAIL ──────────────────────────────────────────────────────

describe("Validation — onglet Email", () => {
  beforeEach(() => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
  });

  it("affiche une erreur pour un email invalide", async () => {
    fireEvent.changeText(screen.getByTestId("input-email"), "pas-un-email");
    fireEvent.changeText(screen.getByTestId("input-password"), "password");
    fireEvent.press(screen.getByTestId("submit-email"));
    await waitFor(() =>
      expect(screen.getByText(/email invalide/i)).toBeOnTheScreen(),
    );
  });

  it("affiche une erreur si le mot de passe est vide", async () => {
    fireEvent.changeText(screen.getByTestId("input-email"), "test@test.com");
    fireEvent.press(screen.getByTestId("submit-email"));
    await waitFor(() =>
      expect(screen.getByText(/mot de passe requis/i)).toBeOnTheScreen(),
    );
  });
});

// ─── LOGIN TÉLÉPHONE RÉUSSI ─────────────────────────────────────────────────

describe("Login téléphone — succès", () => {
  it("appelle authApi.loginPhone avec les bons paramètres", async () => {
    mockAuthApi.loginPhone.mockResolvedValue(fakeLoginResponse);
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-phone"));
    await waitFor(() =>
      expect(mockAuthApi.loginPhone).toHaveBeenCalledWith(
        "612345678",
        "123456",
      ),
    );
  });

  it("appelle handleLoginResponse puis navigue vers /(home)", async () => {
    const { mockHandleLoginResponse } = setupStore();
    mockAuthApi.loginPhone.mockResolvedValue(fakeLoginResponse);
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-phone"));
    await waitFor(() =>
      expect(mockHandleLoginResponse).toHaveBeenCalledWith(fakeLoginResponse),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/(home)");
  });
});

// ─── LOGIN EMAIL RÉUSSI ─────────────────────────────────────────────────────

describe("Login email — succès", () => {
  it("appelle authApi.loginEmail puis navigue vers /(home)", async () => {
    const { mockHandleLoginResponse } = setupStore();
    mockAuthApi.loginEmail.mockResolvedValue(fakeLoginResponse);
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
    fireEvent.changeText(screen.getByTestId("input-email"), "test@ecole.com");
    fireEvent.changeText(
      screen.getByTestId("input-password"),
      "MonPassword123",
    );
    fireEvent.press(screen.getByTestId("submit-email"));
    await waitFor(() =>
      expect(mockHandleLoginResponse).toHaveBeenCalledWith(fakeLoginResponse),
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/(home)");
  });
});

// ─── GESTION DES ERREURS API ────────────────────────────────────────────────

describe("Gestion des erreurs API", () => {
  const cases: Array<{ code?: string; statusCode?: number; expected: RegExp }> =
    [
      { statusCode: 401, expected: /Identifiants incorrects/ },
      { statusCode: 429, expected: /Trop de tentatives/ },
      {
        code: "PASSWORD_CHANGE_REQUIRED",
        expected: /changer votre mot de passe/,
      },
      { code: "PROFILE_SETUP_REQUIRED", expected: /profil est incomplet/ },
      { code: "ACCOUNT_VALIDATION_REQUIRED", expected: /activé/ },
      {
        code: "PLATFORM_CREDENTIAL_SETUP_REQUIRED",
        expected: /Configuration de compte/,
      },
    ];

  cases.forEach(({ code, statusCode, expected }) => {
    it(`affiche le bon message pour ${code ?? `HTTP ${statusCode}`}`, async () => {
      const err = Object.assign(new Error("err"), { code, statusCode });
      mockAuthApi.loginPhone.mockRejectedValue(err);
      render(<LoginScreen />);
      fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
      fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
      fireEvent.press(screen.getByTestId("submit-phone"));
      await waitFor(() => expect(screen.getByText(expected)).toBeOnTheScreen());
    });
  });

  it("n'affiche pas de bannière d'erreur si login réussi", async () => {
    mockAuthApi.loginPhone.mockResolvedValue(fakeLoginResponse);
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-phone"));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalled());
    expect(screen.queryByTestId("error-banner")).toBeNull();
  });
});
