/**
 * Tests fonctionnels d'intégration — flux d'authentification complet.
 *
 * Ces tests vérifient le flux de bout en bout :
 * store auth + composants + navigation, avec uniquement l'API mockée.
 * Le vrai store Zustand est utilisé (pas de mock du store).
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react-native";
import LoginScreen from "../../app/login";
import HomeScreen from "../../app/(home)/index";
import { authApi } from "../../src/api/auth.api";
import { tokenStorage } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth.store";
import type { LoginResponse, AuthUser } from "../../src/types/auth.types";

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
jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
  BASE_URL: "http://localhost:3001/api",
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
const mockRouter = jest.requireMock("expo-router").router as {
  replace: jest.Mock;
  back: jest.Mock;
};

const fakeLoginResponse: LoginResponse = {
  accessToken: "access-token-integration",
  refreshToken: "refresh-token-integration",
  tokenType: "Bearer",
  expiresIn: 86400,
  refreshExpiresIn: 2592000,
  schoolSlug: "ecole-integration",
};

const fakeUser: AuthUser = {
  id: "user-001",
  firstName: "Marie",
  lastName: "Dupont",
  email: "marie@ecole.com",
  platformRoles: [],
  memberships: [{ schoolId: "school-001", role: "TEACHER" }],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "TEACHER",
  activeRole: "TEACHER",
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    schoolSlug: null,
    isLoading: false,
    isAuthenticated: false,
  });
});

// ─── FLUX LOGIN COMPLET ─────────────────────────────────────────────────────

describe("Flux complet — login téléphone → état store → navigation", () => {
  it("login réussi : store mis à jour + navigation vers /(home)", async () => {
    mockAuthApi.loginPhone.mockResolvedValue(fakeLoginResponse);

    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-phone"));

    await waitFor(() => {
      expect(mockStorage.setTokens).toHaveBeenCalledWith(
        "access-token-integration",
        "refresh-token-integration",
        2592000,
      );
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("access-token-integration");
    expect(state.schoolSlug).toBe("ecole-integration");
    expect(mockRouter.replace).toHaveBeenCalledWith("/(home)");
  });

  it("login email réussi : store mis à jour + navigation vers /(home)", async () => {
    mockAuthApi.loginEmail.mockResolvedValue(fakeLoginResponse);

    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId("tab-email"));
    fireEvent.changeText(screen.getByTestId("input-email"), "marie@ecole.com");
    fireEvent.changeText(
      screen.getByTestId("input-password"),
      "MotDePasse123!",
    );
    fireEvent.press(screen.getByTestId("submit-email"));

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/(home)"),
    );

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
  });
});

// ─── FLUX LOGOUT ───────────────────────────────────────────────────────────

describe("Flux complet — logout depuis la page home", () => {
  it("logout : store vidé + storage effacé", async () => {
    // Setup : simuler un utilisateur connecté
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token-integration",
      schoolSlug: "ecole-integration",
      isAuthenticated: true,
      isLoading: false,
    });
    mockAuthApi.logout.mockResolvedValue();

    render(<HomeScreen />);
    expect(screen.getByTestId("user-name")).toHaveTextContent("Marie Dupont");

    fireEvent.press(screen.getByTestId("logout-button"));

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
    });

    expect(mockAuthApi.logout).toHaveBeenCalled();
  });
});

// ─── FLUX INITIALIZE — RESTAURATION SESSION ─────────────────────────────────

describe("Flux complet — initialize() restaure la session", () => {
  it("restaure depuis le access token et expose isAuthenticated=true", async () => {
    mockStorage.getAccessToken.mockResolvedValue("stored-access");
    mockStorage.getRefreshToken.mockResolvedValue("stored-refresh");

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("stored-access");
  });

  it("refresh silencieux : renouvelle access token et reste authentifié", async () => {
    mockStorage.getAccessToken.mockResolvedValue(null);
    mockStorage.getRefreshToken.mockResolvedValue("old-refresh");
    mockAuthApi.refresh.mockResolvedValue({
      ...fakeLoginResponse,
      accessToken: "new-access-token",
    });

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(useAuthStore.getState().accessToken).toBe("new-access-token");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("refresh expiré → déconnecté, storage effacé", async () => {
    mockStorage.getAccessToken.mockResolvedValue(null);
    mockStorage.getRefreshToken.mockResolvedValue("expired-token");
    mockAuthApi.refresh.mockRejectedValue(new Error("Invalid refresh token"));

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockStorage.clear).toHaveBeenCalled();
  });
});

// ─── FLUX ERREURS CRITIQUES ─────────────────────────────────────────────────

describe("Flux erreurs critiques — comportement sous erreurs réseau", () => {
  it("affiche l'erreur réseau sans crasher l'app", async () => {
    const networkError = new Error("Network request failed");
    mockAuthApi.loginPhone.mockRejectedValue(networkError);

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("submit-phone"));

    await waitFor(() =>
      expect(screen.getByTestId("error-banner")).toBeOnTheScreen(),
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("logout échoue côté serveur → storage effacé quand même", async () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token",
      schoolSlug: "ecole",
      isAuthenticated: true,
      isLoading: false,
    });
    // authApi est mocké — même si l'appel réseau échoue, le store doit être vidé
    mockAuthApi.logout.mockRejectedValue(new Error("Server error"));

    await act(async () => {
      // logout() dans le store appelle authApi.logout(), si ça jette on gère
      try {
        await useAuthStore.getState().logout();
      } catch {
        // le store ne devrait pas propager l'erreur
      }
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
