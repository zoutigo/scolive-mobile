import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import HomeScreen from "../../app/(home)/index";
import IndexScreen from "../../app/index";
import { authApi } from "../../src/api/auth.api";
import { tokenStorage } from "../../src/api/client";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthUser, LoginResponse } from "../../src/types/auth.types";

jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
}));
jest.mock("../../src/api/auth.api");
jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    getSchoolSlug: jest.fn().mockResolvedValue(null),
    setTokens: jest.fn().mockResolvedValue(undefined),
    setSchoolSlug: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
  BASE_URL: "http://localhost:3001/api",
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

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

describe("Flux store auth", () => {
  it("initialize restaure une session à partir d'un access token", async () => {
    mockStorage.getAccessToken.mockResolvedValue("stored-access");
    mockStorage.getRefreshToken.mockResolvedValue("stored-refresh");

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("stored-access");
  });

  it("initialize tente un refresh silencieux si seul le refresh token existe", async () => {
    mockStorage.getAccessToken.mockResolvedValue(null);
    mockStorage.getRefreshToken.mockResolvedValue("stored-refresh");
    mockAuthApi.refresh.mockResolvedValue({
      ...fakeLoginResponse,
      accessToken: "refreshed-access",
    });

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(mockAuthApi.refresh).toHaveBeenCalledWith("stored-refresh");
    expect(useAuthStore.getState().accessToken).toBe("refreshed-access");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("logout vide le store même si l'API échoue", async () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token",
      schoolSlug: "ecole",
      isAuthenticated: true,
      isLoading: false,
    });
    mockAuthApi.logout.mockRejectedValue(new Error("Server error"));

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});

describe("Flux écrans auth", () => {
  it("IndexScreen affiche le login si l'utilisateur est déconnecté", () => {
    render(<IndexScreen />);

    expect(screen.getByText("SCO")).toBeOnTheScreen();
    expect(screen.getByTestId("tab-phone")).toBeOnTheScreen();
  });

  it("IndexScreen affiche le header Scolive quand l'utilisateur est connecté", () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token",
      schoolSlug: "ecole",
      isAuthenticated: true,
      isLoading: false,
    });

    render(<IndexScreen />);

    // Le header avec logo et bouton menu doit être présent
    expect(screen.getByTestId("header-logo")).toBeOnTheScreen();
    expect(screen.getByTestId("header-menu-btn")).toBeOnTheScreen();
  });

  it("HomeScreen déclenche bien logout via le drawer avec confirmation", async () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token",
      schoolSlug: "ecole",
      isAuthenticated: true,
      isLoading: false,
    });
    mockAuthApi.logout.mockResolvedValue(undefined);

    render(<HomeScreen />);

    // Ouvrir le drawer via le bouton menu du header
    fireEvent.press(screen.getByTestId("header-menu-btn"));

    // Appuyer sur le bouton de déconnexion dans le drawer
    await waitFor(() => {
      expect(screen.getByTestId("drawer-logout-btn")).toBeOnTheScreen();
    });
    fireEvent.press(screen.getByTestId("drawer-logout-btn"));

    // Le ConfirmDialog doit apparaître — l'utilisateur n'est pas encore déconnecté
    await waitFor(() => {
      expect(screen.getByTestId("confirm-dialog-card")).toBeOnTheScreen();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Confirmer la déconnexion
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  it("HomeScreen annuler la déconnexion dans le dialog garde l'utilisateur connecté", async () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token",
      schoolSlug: "ecole",
      isAuthenticated: true,
      isLoading: false,
    });
    mockAuthApi.logout.mockResolvedValue(undefined);

    render(<HomeScreen />);

    fireEvent.press(screen.getByTestId("header-menu-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("drawer-logout-btn")).toBeOnTheScreen();
    });
    fireEvent.press(screen.getByTestId("drawer-logout-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("confirm-dialog-card")).toBeOnTheScreen();
    });

    // Annuler — l'utilisateur reste connecté
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(screen.queryByTestId("confirm-dialog-card")).toBeNull();
  });
});
