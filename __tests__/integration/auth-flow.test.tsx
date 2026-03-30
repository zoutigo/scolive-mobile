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

  it("IndexScreen affiche home si l'utilisateur est connecté", () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token",
      schoolSlug: "ecole",
      isAuthenticated: true,
      isLoading: false,
    });

    render(<IndexScreen />);

    expect(screen.getByText("Bienvenue")).toBeOnTheScreen();
    expect(screen.getByTestId("user-name")).toHaveTextContent("Marie Dupont");
  });

  it("HomeScreen déclenche bien logout depuis le bouton", async () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token",
      schoolSlug: "ecole",
      isAuthenticated: true,
      isLoading: false,
    });
    mockAuthApi.logout.mockResolvedValue(undefined);

    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("logout-button"));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
