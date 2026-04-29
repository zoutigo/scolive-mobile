/**
 * Tests — HomeScreen : comportement quand user est null après authentification
 *
 * Régression couverte :
 * - Quand isAuthenticated=true mais user=null (ex. meGlobal() échoue ou est lent),
 *   HomeScreen affichait un spinner infini sans jamais en sortir.
 * - Le fix ajoute un timeout de 8s après lequel logout() est appelé pour
 *   remettre l'app dans un état propre (écran login).
 */

import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react-native";
import HomeScreen from "../../app/(home)/index";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/auth.api", () => ({
  authApi: {
    logout: jest.fn().mockResolvedValue(undefined),
    me: jest.fn(),
    meGlobal: jest.fn(),
  },
}));
jest.mock("../../src/api/client", () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    getSchoolSlug: jest.fn(),
    setTokens: jest.fn(),
    setSchoolSlug: jest.fn(),
    clear: jest.fn().mockResolvedValue(undefined),
  },
  apiFetch: jest.fn(),
  BASE_URL: "http://localhost:3001/api",
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FULL_USER: AuthUser = {
  id: "u1",
  firstName: "Jean",
  lastName: "Mbarga",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "TEACHER" }],
  profileCompleted: true,
  role: "TEACHER",
  activeRole: "TEACHER",
  schoolName: "Collège Vogt",
  referentClass: { name: "6eC" },
};

function setupStore(
  overrides: Partial<ReturnType<typeof useAuthStore.getState>> = {},
) {
  useAuthStore.setState({
    user: null,
    accessToken: "tok",
    schoolSlug: null,
    isLoading: false,
    isAuthenticated: true,
    authErrorMessage: null,
    ...overrides,
  } as never);
}

beforeAll(() => {
  jest.useFakeTimers();
});
afterAll(() => {
  jest.useRealTimers();
});
beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HomeScreen — user null après authentification", () => {
  it("affiche un spinner quand isAuthenticated=true mais user=null", () => {
    setupStore({ user: null });
    render(<HomeScreen />);
    expect(screen.getByTestId("home-loading-spinner")).toBeTruthy();
  });

  it("n'affiche pas le spinner quand user est chargé", () => {
    setupStore({ user: FULL_USER, schoolSlug: "college-vogt" });
    render(<HomeScreen />);
    expect(screen.queryByTestId("home-loading-spinner")).toBeNull();
  });

  it("appelle logout() après 8 secondes si user reste null", async () => {
    setupStore({ user: null });
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    useAuthStore.setState((s) => ({ ...s, logout: mockLogout }));

    render(<HomeScreen />);
    expect(screen.getByTestId("home-loading-spinner")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(8000);
    });

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
  });

  it("n'appelle pas logout() si user charge avant 8 secondes", async () => {
    setupStore({ user: null });
    const mockLogout = jest.fn();
    useAuthStore.setState((s) => ({ ...s, logout: mockLogout }));

    render(<HomeScreen />);

    // User arrive après 3 secondes
    await act(async () => {
      jest.advanceTimersByTime(3000);
      useAuthStore.setState((s) => ({ ...s, user: FULL_USER }));
    });

    await act(async () => {
      jest.advanceTimersByTime(8000);
    });

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("efface le timer quand le composant se démonte", async () => {
    setupStore({ user: null });
    const mockLogout = jest.fn();
    useAuthStore.setState((s) => ({ ...s, logout: mockLogout }));

    const { unmount } = render(<HomeScreen />);
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockLogout).not.toHaveBeenCalled();
  });
});
