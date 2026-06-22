/**
 * Tests de la bottom tab bar fixe (Accueil, Mon compte, Assistance, Menu, Tests).
 * Unitaires : rendu, icônes, conditionnalité du tab Tests.
 * Fonctionnels : navigation, ouverture du menu, états actifs par route.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import {
  BottomTabBar,
  BOTTOM_TAB_BAR_HEIGHT,
} from "../../src/components/navigation/BottomTabBar";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 10, left: 0, right: 0 }),
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

const mockOpenDrawer = jest.fn();
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: mockOpenDrawer }),
}));

const mockPush = jest.fn();
let mockPathname = "/";
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

const baseUser: AuthUser = {
  id: "u1",
  firstName: "Robert",
  lastName: "Ntamack",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "PARENT" }],
  profileCompleted: true,
  role: "PARENT",
  activeRole: "PARENT",
};

function setUser(overrides: Partial<AuthUser> = {}) {
  mockUseAuthStore.mockReturnValue({
    user: { ...baseUser, ...overrides },
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = "/";
  setUser();
});

// ── Rendu de base ─────────────────────────────────────────────────────────────

describe("Rendu", () => {
  it("affiche les 4 tabs de base", () => {
    render(<BottomTabBar />);
    expect(screen.getByTestId("bottom-tab-home")).toBeTruthy();
    expect(screen.getByTestId("bottom-tab-account")).toBeTruthy();
    expect(screen.getByTestId("bottom-tab-assistance")).toBeTruthy();
    expect(screen.getByTestId("bottom-tab-menu")).toBeTruthy();
  });

  it("n'affiche pas le tab Tests pour un utilisateur non testeur", () => {
    setUser({ isTester: false });
    render(<BottomTabBar />);
    expect(screen.queryByTestId("bottom-tab-tests")).toBeNull();
  });

  it("affiche le tab Tests pour un utilisateur testeur", () => {
    setUser({ isTester: true });
    render(<BottomTabBar />);
    expect(screen.getByTestId("bottom-tab-tests")).toBeTruthy();
  });

  it("affiche un libellé sous chaque icône", () => {
    render(<BottomTabBar />);
    expect(screen.getByTestId("bottom-tab-home-label")).toHaveTextContent(
      "Accueil",
    );
    expect(screen.getByTestId("bottom-tab-account-label")).toHaveTextContent(
      "Mon compte",
    );
    expect(screen.getByTestId("bottom-tab-assistance-label")).toHaveTextContent(
      "Assistance",
    );
    expect(screen.getByTestId("bottom-tab-menu-label")).toHaveTextContent(
      "Menu",
    );
  });

  it("expose une accessibilityLabel et un rôle 'tab' par item", () => {
    render(<BottomTabBar />);
    const home = screen.getByTestId("bottom-tab-home");
    expect(home.props.accessibilityRole).toBe("tab");
    expect(home.props.accessibilityLabel).toBe("Accueil");
  });
});

// ── États actifs ──────────────────────────────────────────────────────────────

describe("État actif selon la route", () => {
  it("Accueil actif sur '/'", () => {
    mockPathname = "/";
    render(<BottomTabBar />);
    expect(
      screen.getByTestId("bottom-tab-home").props.accessibilityState.selected,
    ).toBe(true);
  });

  it("Mon compte actif sur /account", () => {
    mockPathname = "/account";
    render(<BottomTabBar />);
    expect(
      screen.getByTestId("bottom-tab-account").props.accessibilityState
        .selected,
    ).toBe(true);
  });

  it("Assistance actif sur /tickets", () => {
    mockPathname = "/tickets";
    render(<BottomTabBar />);
    expect(
      screen.getByTestId("bottom-tab-assistance").props.accessibilityState
        .selected,
    ).toBe(true);
  });

  it("Assistance actif sur une sous-route /tickets/123", () => {
    mockPathname = "/tickets/123";
    render(<BottomTabBar />);
    expect(
      screen.getByTestId("bottom-tab-assistance").props.accessibilityState
        .selected,
    ).toBe(true);
  });

  it("Tests actif sur /tests pour un testeur", () => {
    mockPathname = "/tests";
    setUser({ isTester: true });
    render(<BottomTabBar />);
    expect(
      screen.getByTestId("bottom-tab-tests").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId("bottom-tab-menu").props.accessibilityState.selected,
    ).toBe(false);
  });

  it("Menu actif sur toute route qui n'est ni accueil, ni compte, ni assistance, ni tests", () => {
    mockPathname = "/notes/child/c1";
    render(<BottomTabBar />);
    expect(
      screen.getByTestId("bottom-tab-menu").props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId("bottom-tab-home").props.accessibilityState.selected,
    ).toBe(false);
  });

  it("Menu actif sur les routes du groupe (home) normalisées", () => {
    mockPathname = "/(home)/feed";
    render(<BottomTabBar />);
    expect(
      screen.getByTestId("bottom-tab-menu").props.accessibilityState.selected,
    ).toBe(true);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe("Navigation au clic", () => {
  it("Accueil navigue vers '/'", () => {
    mockPathname = "/account";
    render(<BottomTabBar />);
    fireEvent.press(screen.getByTestId("bottom-tab-home"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("Mon compte navigue vers /account", () => {
    mockPathname = "/";
    render(<BottomTabBar />);
    fireEvent.press(screen.getByTestId("bottom-tab-account"));
    expect(mockPush).toHaveBeenCalledWith("/account");
  });

  it("Assistance navigue vers /(home)/tickets", () => {
    mockPathname = "/";
    render(<BottomTabBar />);
    fireEvent.press(screen.getByTestId("bottom-tab-assistance"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/tickets");
  });

  it("Tests navigue vers /(home)/tests pour un testeur", () => {
    mockPathname = "/";
    setUser({ isTester: true });
    render(<BottomTabBar />);
    fireEvent.press(screen.getByTestId("bottom-tab-tests"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/tests");
  });

  it("Menu ouvre le drawer au lieu de naviguer", () => {
    mockPathname = "/feed";
    render(<BottomTabBar />);
    fireEvent.press(screen.getByTestId("bottom-tab-menu"));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("ne navigue pas si l'onglet pressé est déjà actif", () => {
    mockPathname = "/";
    render(<BottomTabBar />);
    fireEvent.press(screen.getByTestId("bottom-tab-home"));
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── Constante de hauteur ──────────────────────────────────────────────────────

describe("BOTTOM_TAB_BAR_HEIGHT", () => {
  it("est un nombre positif exploitable pour décaler les FAB et le contenu", () => {
    expect(typeof BOTTOM_TAB_BAR_HEIGHT).toBe("number");
    expect(BOTTOM_TAB_BAR_HEIGHT).toBeGreaterThan(0);
  });
});
