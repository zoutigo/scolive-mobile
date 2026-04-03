import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { AppDrawer } from "../../src/components/navigation/AppDrawer";
import {
  getNavItems,
  buildChildSections,
} from "../../src/components/navigation/nav-config";
import { useFamilyStore } from "../../src/store/family.store";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  portalLabel: "Portail famille",
  userFullName: "Robert Ntamack",
  userInitials: "RN",
  userRole: "Parent",
  onLogout: jest.fn(),
};

const makeUser = (overrides: Partial<AuthUser>): AuthUser => ({
  id: "u1",
  firstName: "Test",
  lastName: "User",
  platformRoles: [],
  memberships: [],
  profileCompleted: true,
  role: null,
  activeRole: null,
  ...overrides,
});

// Utilisateurs par type de rôle
const platformUser = makeUser({
  platformRoles: ["SUPER_ADMIN"],
  role: "SUPER_ADMIN",
  activeRole: "SUPER_ADMIN",
});
const schoolUser = makeUser({
  memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
  role: "SCHOOL_ADMIN",
  activeRole: "SCHOOL_ADMIN",
});
const teacherUser = makeUser({
  memberships: [{ schoolId: "s1", role: "TEACHER" }],
  role: "TEACHER",
  activeRole: "TEACHER",
});
const parentUser = makeUser({
  memberships: [{ schoolId: "s1", role: "PARENT" }],
  role: "PARENT",
  activeRole: "PARENT",
});
const studentUser = makeUser({
  memberships: [{ schoolId: "s1", role: "STUDENT" }],
  role: "STUDENT",
  activeRole: "STUDENT",
});

const child1 = { id: "c1", firstName: "Lisa", lastName: "Ntamack" };
const child2 = { id: "c2", firstName: "Paul", lastName: "Ntamack" };

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useFamilyStore.setState({ activeChildId: null, children: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

function renderDrawer(navItems = getNavItems(parentUser), overrides = {}) {
  return render(
    <AppDrawer {...baseProps} navItems={navItems} {...overrides} />,
  );
}

// ── Visibilité ────────────────────────────────────────────────────────────────

describe("Visibilité du drawer", () => {
  it("le conteneur root a pointerEvents='none' quand isOpen=false", () => {
    const { toJSON } = renderDrawer(getNavItems(parentUser), { isOpen: false });
    // Le premier nœud du rendu est le conteneur root
    const root = toJSON() as { props: { pointerEvents?: string } } | null;
    expect(root?.props.pointerEvents).toBe("none");
  });

  it("le conteneur root a pointerEvents='auto' quand isOpen=true", () => {
    const { toJSON } = renderDrawer();
    const root = toJSON() as { props: { pointerEvents?: string } } | null;
    expect(root?.props.pointerEvents).toBe("auto");
  });

  it("affiche l'overlay quand isOpen=true", () => {
    renderDrawer();
    expect(screen.getByTestId("drawer-overlay")).toBeTruthy();
  });
});

// ── Fermeture ─────────────────────────────────────────────────────────────────

describe("Fermeture du drawer", () => {
  it("appelle onClose en tapant l'overlay", () => {
    const onClose = jest.fn();
    renderDrawer(getNavItems(parentUser), { onClose });
    fireEvent.press(screen.getByTestId("drawer-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Infos utilisateur ─────────────────────────────────────────────────────────

describe("Informations utilisateur", () => {
  it("affiche le nom complet de l'utilisateur", () => {
    renderDrawer();
    expect(screen.getByText("Robert Ntamack")).toBeTruthy();
  });

  it("affiche les initiales", () => {
    renderDrawer();
    expect(screen.getByText("RN")).toBeTruthy();
  });

  it("affiche le rôle", () => {
    renderDrawer();
    expect(screen.getByText("Parent")).toBeTruthy();
  });

  it("affiche le label du portail", () => {
    renderDrawer();
    expect(screen.getByText("Portail famille")).toBeTruthy();
  });
});

// ── Navigation — rôle plateforme ──────────────────────────────────────────────

describe("Items de navigation — plateforme", () => {
  const items = getNavItems(platformUser);
  const expectedKeys = [
    "home",
    "schools",
    "classes",
    "subjects",
    "curriculums",
    "enrollments",
    "students",
    "users",
    "indicators",
    "account",
  ];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });
});

// ── Navigation — rôle établissement ──────────────────────────────────────────

describe("Items de navigation — établissement", () => {
  const items = getNavItems(schoolUser);
  const expectedKeys = [
    "home",
    "feed",
    "classes",
    "subjects",
    "curriculums",
    "enrollments",
    "students",
    "teachers",
    "parents",
    "grades",
    "messages",
    "account",
  ];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });
});

// ── Navigation — rôle enseignant ──────────────────────────────────────────────

describe("Items de navigation — enseignant", () => {
  const items = getNavItems(teacherUser);
  const expectedKeys = [
    "home",
    "feed",
    "classes",
    "gradebook",
    "messages",
    "account",
  ];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });
});

// ── Navigation — rôle parent ──────────────────────────────────────────────────

describe("Items de navigation — parent", () => {
  const items = getNavItems(parentUser);
  const expectedKeys = [
    "home",
    "feed",
    "finance",
    "messages",
    "documents",
    "account",
  ];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });
});

// ── Navigation — rôle élève ───────────────────────────────────────────────────

describe("Items de navigation — élève", () => {
  const items = getNavItems(studentUser);
  const expectedKeys = ["home", "grades", "messages", "documents", "account"];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });
});

// ── Navigation — liens ────────────────────────────────────────────────────────

describe("Navigation — clic sur un item", () => {
  it("navigue vers '/' pour l'item Accueil", () => {
    renderDrawer(getNavItems(parentUser));
    fireEvent.press(screen.getByTestId("nav-item-home"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("navigue vers /placeholder avec le titre pour un item non-home", () => {
    renderDrawer(getNavItems(parentUser));
    fireEvent.press(screen.getByTestId("nav-item-feed"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/placeholder",
      params: { title: "Fil d'actualité" },
    });
  });

  it("appelle onClose avant de naviguer", () => {
    const onClose = jest.fn();
    renderDrawer(getNavItems(parentUser), { onClose });
    fireEvent.press(screen.getByTestId("nav-item-messages"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Déconnexion ───────────────────────────────────────────────────────────────

describe("Bouton de déconnexion", () => {
  it("est présent dans le drawer", () => {
    renderDrawer();
    expect(screen.getByTestId("drawer-logout-btn")).toBeTruthy();
  });

  it("affiche le ConfirmDialog au clic sur le bouton de déconnexion", () => {
    renderDrawer();
    fireEvent.press(screen.getByTestId("drawer-logout-btn"));
    expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy();
  });

  it("n'appelle pas onLogout directement au clic (passe par la confirmation)", () => {
    const onLogout = jest.fn();
    renderDrawer(getNavItems(parentUser), { onLogout });
    fireEvent.press(screen.getByTestId("drawer-logout-btn"));
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("appelle onLogout après confirmation dans le dialog", () => {
    const onLogout = jest.fn();
    renderDrawer(getNavItems(parentUser), { onLogout });
    fireEvent.press(screen.getByTestId("drawer-logout-btn"));
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onLogout si on annule dans le dialog", () => {
    const onLogout = jest.fn();
    renderDrawer(getNavItems(parentUser), { onLogout });
    fireEvent.press(screen.getByTestId("drawer-logout-btn"));
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("ferme le dialog si on annule (la carte disparaît)", () => {
    renderDrawer();
    fireEvent.press(screen.getByTestId("drawer-logout-btn"));
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(screen.queryByTestId("confirm-dialog-card")).toBeNull();
  });
});

// ── Accordéon parent+enfants ──────────────────────────────────────────────────

describe("Accordéon parent — sections enfants", () => {
  const childSections = buildChildSections([child1, child2]);
  const navItems = getNavItems(parentUser);

  function renderParentDrawer(activeChildId: string | null = null) {
    useFamilyStore.setState({ activeChildId, children: [] });
    return render(
      <AppDrawer
        {...baseProps}
        navItems={navItems}
        childSections={childSections}
      />,
    );
  }

  it("affiche le bouton de section 'Mon espace famille'", () => {
    renderParentDrawer();
    expect(screen.getByTestId("drawer-section-general")).toBeTruthy();
  });

  it("affiche un bouton de section par enfant", () => {
    renderParentDrawer();
    expect(screen.getByTestId("drawer-section-child-c1")).toBeTruthy();
    expect(screen.getByTestId("drawer-section-child-c2")).toBeTruthy();
  });

  it("ouvre la section 'général' par défaut quand activeChildId est null", () => {
    renderParentDrawer(null);
    // Les items parent sont visibles (section générale ouverte)
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
  });

  it("ouvre la section de l'enfant actif quand activeChildId est défini", () => {
    renderParentDrawer("c1");
    // Les items de l'enfant c1 sont visibles
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
    expect(screen.getByTestId("nav-item-child-c1-grades")).toBeTruthy();
  });

  it("ouvre la section du deuxième enfant quand activeChildId est c2", () => {
    renderParentDrawer("c2");
    expect(screen.getByTestId("nav-item-child-c2-home")).toBeTruthy();
    expect(screen.getByTestId("nav-item-child-c2-grades")).toBeTruthy();
  });

  it("n'affiche pas les items d'un enfant non-actif", () => {
    renderParentDrawer("c1");
    expect(screen.queryByTestId("nav-item-child-c2-home")).toBeNull();
  });

  it("cliquer sur la section d'un enfant l'ouvre", () => {
    renderParentDrawer(null);
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
  });

  it("cliquer sur 'Mon espace famille' ouvre la section générale", () => {
    renderParentDrawer("c1");
    fireEvent.press(screen.getByTestId("drawer-section-general"));
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();
  });

  it("changer activeChildId dans le store met à jour la section ouverte", () => {
    renderParentDrawer("c1");
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
    act(() => {
      useFamilyStore.setState({ activeChildId: "c2" });
    });
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();
    expect(screen.getByTestId("nav-item-child-c2-home")).toBeTruthy();
  });
});
