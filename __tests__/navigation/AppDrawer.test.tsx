import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { AppDrawer } from "../../src/components/navigation/AppDrawer";
import {
  getNavItems,
  buildChildSections,
  buildTeacherClassSections,
} from "../../src/components/navigation/nav-config";
import { useFamilyStore } from "../../src/store/family.store";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockPush = jest.fn();
let mockPathname = "/";
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
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
const teacherClassSections = buildTeacherClassSections([
  {
    classId: "class-1",
    className: "6eC",
    schoolYearId: "sy1",
    schoolYearLabel: "2025-2026",
    subjects: [{ id: "math", name: "Mathématiques" }],
    studentCount: 20,
  },
]);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockPathname = "/";
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

  it("n'affiche plus le badge de portail (supprimé car redondant avec le rôle)", () => {
    renderDrawer();
    expect(screen.queryByText("Portail famille")).toBeNull();
    expect(screen.queryByText("PORTAIL FAMILLE")).toBeNull();
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
    "agenda",
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
    "timetable",
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

  it("affiche une section 'Menu enseignant' et une section par classe quand les classes sont fournies", () => {
    renderDrawer(items, {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    expect(screen.getByTestId("drawer-section-teacher-general")).toBeTruthy();
    expect(
      screen.getByTestId("drawer-section-teacher-class-class-1"),
    ).toBeTruthy();
    expect(screen.getByText("6eC")).toBeTruthy();
  });

  it("ouvre le sous-menu de classe et affiche ses modules", () => {
    renderDrawer(items, {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));

    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-feed"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-notes"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-discipline"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-timetable"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-homework"),
    ).toBeTruthy();
  });

  it("replie le menu général quand une section classe est ouverte", () => {
    renderDrawer(items, {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));

    expect(screen.queryByTestId("nav-item-home")).toBeNull();
    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-feed"),
    ).toBeTruthy();
  });

  it("ouvre automatiquement la classe active quand la route correspond à un sous-module de classe", () => {
    mockPathname = "/classes/class-1/notes";

    renderDrawer(items, {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    expect(screen.queryByTestId("nav-item-home")).toBeNull();
    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-notes"),
    ).toBeTruthy();
  });

  it("affiche un état de chargement des classes enseignant", () => {
    renderDrawer(items, {
      teacherClassSections: [],
      isTeacherClassNavEnabled: true,
      isLoadingTeacherClassSections: true,
    });

    expect(screen.getByTestId("drawer-teacher-classes-loading")).toBeTruthy();
  });

  it("affiche un état d'erreur des classes enseignant", () => {
    renderDrawer(items, {
      teacherClassSections: [],
      isTeacherClassNavEnabled: true,
      teacherClassSectionsError: "Erreur API",
    });

    expect(screen.getByTestId("drawer-teacher-classes-error")).toBeTruthy();
    expect(screen.getByText("Erreur API")).toBeTruthy();
  });

  it("affiche un état vide quand aucune classe enseignant n'est disponible", () => {
    renderDrawer(items, {
      teacherClassSections: [],
      isTeacherClassNavEnabled: true,
    });

    expect(screen.getByTestId("drawer-teacher-classes-empty")).toBeTruthy();
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
    expect(mockPush).toHaveBeenCalledWith("/feed");
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
    expect(screen.getByTestId("nav-item-child-c1-class-life")).toBeTruthy();
  });

  it("ouvre la section du deuxième enfant quand activeChildId est c2", () => {
    renderParentDrawer("c2");
    expect(screen.getByTestId("nav-item-child-c2-home")).toBeTruthy();
    expect(screen.getByTestId("nav-item-child-c2-grades")).toBeTruthy();
    expect(screen.getByTestId("nav-item-child-c2-class-life")).toBeTruthy();
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

  it("cliquer sur un item d'enfant synchronise activeChildId avant navigation", () => {
    renderParentDrawer(null);

    fireEvent.press(screen.getByTestId("drawer-section-child-c2"));
    fireEvent.press(screen.getByTestId("nav-item-child-c2-home"));
    act(() => jest.runAllTimers());

    expect(useFamilyStore.getState().activeChildId).toBe("c2");
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "c2" },
    });
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

// ── Accordéon : cycle complet ouverture/fermeture ─────────────────────────────

describe("Accordéon — cycle ouverture/fermeture", () => {
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

  it("cliquer sur un enfant ouvre son menu et ferme celui de Mon espace famille", () => {
    // Départ : section générale ouverte (activeChildId null)
    renderParentDrawer(null);

    // Les items de Mon espace famille sont visibles
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
    // Les items de l'enfant sont absents
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();

    // Clic sur la section enfant
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));

    // → Menu enfant ouvert
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
    expect(screen.getByTestId("nav-item-child-c1-grades")).toBeTruthy();
    // → Menu Mon espace famille fermé
    expect(screen.queryByTestId("nav-item-home")).toBeNull();
  });

  it("recliquer sur Mon espace famille referme le menu enfant et rouvre Mon espace famille", () => {
    // Départ : section enfant ouverte
    renderParentDrawer("c1");

    // Vérification état initial
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-home")).toBeNull();

    // Clic sur Mon espace famille
    fireEvent.press(screen.getByTestId("drawer-section-general"));

    // → Menu Mon espace famille ouvert
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
    // → Menu enfant fermé
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();
  });

  it("cycle complet : général → enfant → général", () => {
    renderParentDrawer(null);

    // État 1 : Mon espace famille ouvert
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();

    // → Clic enfant
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));

    // État 2 : menu enfant ouvert, Mon espace famille fermé
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-home")).toBeNull();

    // → Clic Mon espace famille
    fireEvent.press(screen.getByTestId("drawer-section-general"));

    // État 3 : Mon espace famille rouvert, menu enfant refermé
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();
  });

  it("cliquer sur Mon espace famille remet activeChildId à null dans le store", () => {
    renderParentDrawer("c1");

    fireEvent.press(screen.getByTestId("drawer-section-general"));

    expect(useFamilyStore.getState().activeChildId).toBeNull();
  });

  it("après reset du store, le drawer rouvre sur Mon espace famille et non sur l'enfant", () => {
    // Simuler un remontage du composant après avoir cliqué sur Mon espace famille
    renderParentDrawer("c1");
    fireEvent.press(screen.getByTestId("drawer-section-general"));

    // activeChildId est maintenant null dans le store
    expect(useFamilyStore.getState().activeChildId).toBeNull();

    // Si le composant remonte avec activeChildId=null, la section générale s'ouvre
    const { unmount } = renderParentDrawer(
      useFamilyStore.getState().activeChildId,
    );
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();
    unmount();
  });

  it("avec deux enfants, ouvrir l'enfant 2 ferme l'enfant 1", () => {
    renderParentDrawer("c1");

    // Enfant 1 ouvert au départ
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-child-c2-home")).toBeNull();

    // Clic sur enfant 2
    fireEvent.press(screen.getByTestId("drawer-section-child-c2"));

    // Enfant 2 ouvert, enfant 1 fermé
    expect(screen.getByTestId("nav-item-child-c2-home")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-child-c1-home")).toBeNull();
  });
});
