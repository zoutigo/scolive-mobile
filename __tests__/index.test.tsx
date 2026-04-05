import React from "react";
import { render, screen } from "@testing-library/react-native";
import IndexScreen from "../app/index";
import { useAuthStore } from "../src/store/auth.store";
import type { AuthUser } from "../src/types/auth.types";

jest.mock("../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

const fakeTeacher: AuthUser = {
  id: "u1",
  firstName: "Marie",
  lastName: "Dupont",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "TEACHER" }],
  profileCompleted: true,
  role: "TEACHER",
  activeRole: "TEACHER",
};

function setupStore(overrides: {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: AuthUser | null;
  schoolSlug?: string | null;
  authErrorMessage?: string | null;
}) {
  mockUseAuthStore.mockReturnValue({
    isAuthenticated: overrides.isAuthenticated,
    isLoading: overrides.isLoading,
    user: overrides.user ?? null,
    accessToken: null,
    schoolSlug: overrides.schoolSlug ?? null,
    authErrorMessage: overrides.authErrorMessage ?? null,
    clearAuthError: jest.fn(),
    logout: jest.fn(),
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("IndexScreen", () => {
  it("affiche un loader pendant le chargement", () => {
    setupStore({ isAuthenticated: false, isLoading: true });
    render(<IndexScreen />);
    expect(screen.getByTestId("index-loading")).toBeOnTheScreen();
  });

  it("affiche l'écran de connexion si non authentifié", () => {
    setupStore({ isAuthenticated: false, isLoading: false });
    render(<IndexScreen />);
    expect(screen.getByText("SCO")).toBeOnTheScreen();
    expect(screen.getByTestId("tab-phone")).toBeOnTheScreen();
  });

  it("affiche le header avec le bouton menu quand authentifié", () => {
    setupStore({
      isAuthenticated: true,
      isLoading: false,
      user: fakeTeacher,
      schoolSlug: "college-vogt",
    });
    render(<IndexScreen />);
    expect(screen.getByTestId("header-menu-btn")).toBeOnTheScreen();
  });

  it("affiche le logo Scolive quand authentifié", () => {
    setupStore({
      isAuthenticated: true,
      isLoading: false,
      user: fakeTeacher,
      schoolSlug: "college-vogt",
    });
    render(<IndexScreen />);
    expect(screen.getByTestId("header-logo")).toBeOnTheScreen();
  });

  it("affiche une vraie modale si la session a expiré", () => {
    setupStore({
      isAuthenticated: false,
      isLoading: false,
      authErrorMessage: "Votre session a expiré. Veuillez vous reconnecter.",
    });

    render(<IndexScreen />);

    expect(screen.getByTestId("confirm-dialog-card")).toBeOnTheScreen();
    expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
      "Session expirée",
    );
    expect(screen.getByTestId("confirm-dialog-subtitle")).toHaveTextContent(
      "Votre espace a été verrouillé en toute sécurité",
    );
    expect(screen.getByTestId("confirm-dialog-message")).toHaveTextContent(
      "Votre session a expiré. Veuillez vous reconnecter.",
    );
    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Se reconnecter",
    );
    expect(screen.queryByTestId("confirm-dialog-cancel")).toBeNull();
  });
});
