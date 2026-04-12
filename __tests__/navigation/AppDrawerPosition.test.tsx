/**
 * Tests de positionnement du drawer.
 *
 * Comportements garantis :
 * - Le panneau ne dépasse pas le header (top = insets.top + 56)
 * - Le panneau ne touche pas les boutons de navigation de l'appareil (bottom = insets.bottom)
 * - La liste des items est scrollable (ScrollView)
 */
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { AppDrawer } from "../../src/components/navigation/AppDrawer";
import { getNavItems } from "../../src/components/navigation/nav-config";
import type { AuthUser } from "../../src/types/auth.types";

// ── Constante partagée avec AppDrawer ────────────────────────────────────────
const BAR_HEIGHT = 56;

// ── Insets mutables — overridés par test ─────────────────────────────────────
const mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const parentUser: AuthUser = {
  id: "u1",
  firstName: "Robert",
  lastName: "Ntamack",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "PARENT" }],
  profileCompleted: true,
  role: "PARENT",
  activeRole: "PARENT",
};

const platformUser: AuthUser = {
  id: "u2",
  firstName: "Alice",
  lastName: "Admin",
  platformRoles: ["SUPER_ADMIN"],
  memberships: [],
  profileCompleted: true,
  role: "SUPER_ADMIN",
  activeRole: "SUPER_ADMIN",
};

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  portalLabel: "Portail famille",
  userFullName: "Robert Ntamack",
  userInitials: "RN",
  userRole: "Parent",
  onLogout: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Réinitialiser les insets à zéro avant chaque test
  mockInsets.top = 0;
  mockInsets.bottom = 0;
});

/** Extrait top et bottom du panneau drawer via StyleSheet.flatten (gère tableau, objet ou ID). */
function getDrawerPanelStyle(): { top?: number; bottom?: number } {
  const panel = screen.getByTestId("drawer-panel");
  const flat = StyleSheet.flatten(panel.props.style) as {
    top?: number;
    bottom?: number;
  };
  return { top: flat.top, bottom: flat.bottom };
}

// ── top : le drawer ne dépasse pas le header ──────────────────────────────────

describe("Positionnement haut — le drawer commence sous le header", () => {
  it("top = 56 quand il n'y a pas de status bar (insets.top = 0)", () => {
    mockInsets.top = 0;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    expect(getDrawerPanelStyle().top).toBe(0 + BAR_HEIGHT); // 56
  });

  it("top = 80 avec une status bar de 24px (Android typique)", () => {
    mockInsets.top = 24;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    expect(getDrawerPanelStyle().top).toBe(24 + BAR_HEIGHT); // 80
  });

  it("top = 100 avec une status bar de 44px (iPhone notch)", () => {
    mockInsets.top = 44;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    expect(getDrawerPanelStyle().top).toBe(44 + BAR_HEIGHT); // 100
  });

  it("le top est toujours supérieur à BAR_HEIGHT", () => {
    mockInsets.top = 10;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    expect(getDrawerPanelStyle().top).toBeGreaterThanOrEqual(BAR_HEIGHT);
  });
});

// ── bottom : le drawer respecte la barre de navigation ───────────────────────

describe("Positionnement bas — le drawer respecte la barre de navigation", () => {
  it("bottom = 0 quand il n'y a pas de barre de navigation (insets.bottom = 0)", () => {
    mockInsets.bottom = 0;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    expect(getDrawerPanelStyle().bottom).toBe(0);
  });

  it("bottom = 34 avec une barre de navigation iPhone (insets.bottom = 34)", () => {
    mockInsets.bottom = 34;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    expect(getDrawerPanelStyle().bottom).toBe(34);
  });

  it("bottom = 48 avec une grande barre de navigation (insets.bottom = 48)", () => {
    mockInsets.bottom = 48;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    expect(getDrawerPanelStyle().bottom).toBe(48);
  });
});

// ── Combinaison top + bottom ──────────────────────────────────────────────────

describe("Positionnement combiné", () => {
  it("applique correctement top et bottom simultanément (Android typique)", () => {
    mockInsets.top = 24;
    mockInsets.bottom = 0;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    const style = getDrawerPanelStyle();
    expect(style.top).toBe(80);
    expect(style.bottom).toBe(0);
  });

  it("applique correctement top et bottom simultanément (iPhone notch)", () => {
    mockInsets.top = 44;
    mockInsets.bottom = 34;
    render(<AppDrawer {...baseProps} navItems={getNavItems(parentUser)} />);
    const style = getDrawerPanelStyle();
    expect(style.top).toBe(100);
    expect(style.bottom).toBe(34);
  });

  it("fonctionne pour tous les rôles — plateforme", () => {
    mockInsets.top = 24;
    mockInsets.bottom = 16;
    render(<AppDrawer {...baseProps} navItems={getNavItems(platformUser)} />);
    const style = getDrawerPanelStyle();
    expect(style.top).toBe(80);
    expect(style.bottom).toBe(16);
  });
});

// ── Scrollabilité ─────────────────────────────────────────────────────────────

describe("Scrollabilité de la liste de navigation", () => {
  it("la liste des items est rendue dans un ScrollView", () => {
    const { UNSAFE_getAllByType } = render(
      <AppDrawer {...baseProps} navItems={getNavItems(platformUser)} />,
    );
    const scrollViews = UNSAFE_getAllByType(ScrollView);
    expect(scrollViews.length).toBeGreaterThanOrEqual(1);
  });

  it("tous les items plateforme (10) sont dans le ScrollView", () => {
    render(<AppDrawer {...baseProps} navItems={getNavItems(platformUser)} />);
    // 10 items = home + schools + classes + subjects + curriculums +
    //            enrollments + students + users + indicators + account
    const platformItems = getNavItems(platformUser);
    expect(platformItems).toHaveLength(10);
    platformItems.forEach((item) => {
      expect(screen.getByTestId(`nav-item-${item.key}`)).toBeTruthy();
    });
  });

  it("tous les items établissement (13) sont dans le ScrollView", () => {
    const schoolUser: AuthUser = {
      id: "u3",
      firstName: "Eve",
      lastName: "Dir",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
    };
    render(<AppDrawer {...baseProps} navItems={getNavItems(schoolUser)} />);
    const schoolItems = getNavItems(schoolUser);
    expect(schoolItems).toHaveLength(13);
    schoolItems.forEach((item) => {
      expect(screen.getByTestId(`nav-item-${item.key}`)).toBeTruthy();
    });
  });
});
