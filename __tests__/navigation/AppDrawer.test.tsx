import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { AppDrawer } from "../../src/components/navigation/AppDrawer";
import {
  getNavItems,
  buildChildNavItems,
  buildChildSections,
  buildTeacherClassSections,
} from "../../src/components/navigation/nav-config";
import { useFamilyStore } from "../../src/store/family.store";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.2.3",
  nativeBuildVersion: "38",
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = "/";
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  userFullName: "Robert Ntamack",
  userInitials: "RN",
  userRole: "Parent",
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
  ];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });

  it("n'affiche plus 'Mon compte' (déplacé vers la bottom tab bar)", () => {
    renderDrawer(items);
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
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
  ];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });

  it("n'affiche plus 'Mon compte' (déplacé vers la bottom tab bar)", () => {
    renderDrawer(items);
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });
});

// ── Navigation — rôle enseignant ──────────────────────────────────────────────

describe("Items de navigation — enseignant", () => {
  const items = getNavItems(teacherUser);
  const expectedKeys = ["home", "feed", "agenda", "timetable", "messages"];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });

  it("n'affiche plus 'Mon compte' (déplacé vers la bottom tab bar)", () => {
    renderDrawer(items);
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
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
    expect(screen.getByText("Menu classe 6eC")).toBeTruthy();
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
  const expectedKeys = ["home", "feed", "finance", "messages", "documents"];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });

  it("n'affiche plus 'Mon compte' (déplacé vers la bottom tab bar)", () => {
    renderDrawer(items);
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });
});

// ── Navigation — rôle élève ───────────────────────────────────────────────────

describe("Items de navigation — élève", () => {
  const items = getNavItems(studentUser);
  const expectedKeys = ["home", "grades", "messages", "documents"];

  expectedKeys.forEach((key) => {
    it(`affiche l'item "${key}"`, () => {
      renderDrawer(items);
      expect(screen.getByTestId(`nav-item-${key}`)).toBeTruthy();
    });
  });

  it("n'affiche plus 'Mon compte' (déplacé vers la bottom tab bar)", () => {
    renderDrawer(items);
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
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

// ── Déconnexion / Assistance / Tests — déplacés vers la bottom tab bar ────────
// Ces fonctionnalités ne vivent plus dans le drawer : voir
// __tests__/navigation/BottomTabBar.test.tsx et __tests__/navigation/AppHeader.test.tsx.

describe("Drawer allégé — plus de déconnexion ni de lien assistance", () => {
  it("n'affiche plus de bouton de déconnexion", () => {
    renderDrawer();
    expect(screen.queryByTestId("drawer-logout-btn")).toBeNull();
  });

  it("n'affiche plus de lien assistance", () => {
    renderDrawer();
    expect(screen.queryByTestId("drawer-tickets-btn")).toBeNull();
  });

  it("n'affiche plus de lien Tests, même pour un testeur", () => {
    renderDrawer(getNavItems(parentUser));
    expect(screen.queryByTestId("drawer-tests-btn")).toBeNull();
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

// ── Mon compte — supprimé du drawer, déplacé vers la bottom tab bar ──────────

describe("Mon compte — n'apparaît plus dans le drawer, quel que soit le rôle", () => {
  it("absent en mode simple (plateforme)", () => {
    renderDrawer(getNavItems(platformUser));
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("absent en mode simple (élève)", () => {
    renderDrawer(getNavItems(studentUser));
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("absent en mode enseignant avec section générale ouverte", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("absent quand une section classe enseignant est ouverte", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("absent en mode parent avec section générale ouverte", () => {
    const childSections = buildChildSections([child1]);
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("absent quand une section enfant est ouverte (mode parent)", () => {
    const childSections = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: null, children: [] });
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });
});

// ── Nommage des sections classes enseignant ───────────────────────────────────

describe("Nommage des sections classes enseignant", () => {
  it("affiche 'Menu classe 6eC' pour une section classe", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.getByText("Menu classe 6eC")).toBeTruthy();
  });

  it("n'affiche plus le nom brut de la classe comme en-tête de section", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    // Le texte brut "6eC" ne doit pas apparaître en tant que titre de section
    // (il peut apparaître dans les items enfants mais pas comme sectionHeaderText direct)
    const allTexts = screen.queryAllByText("6eC");
    expect(allTexts).toHaveLength(0);
  });

  it("préfixe chaque section classe avec 'Menu classe '", () => {
    const twoClassSections = buildTeacherClassSections([
      {
        classId: "cl-a",
        className: "6eA",
        schoolYearId: "sy1",
        schoolYearLabel: "2025-2026",
        subjects: [],
        studentCount: 25,
      },
      {
        classId: "cl-b",
        className: "5eB",
        schoolYearId: "sy1",
        schoolYearLabel: "2025-2026",
        subjects: [],
        studentCount: 22,
      },
    ]);
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections: twoClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.getByText("Menu classe 6eA")).toBeTruthy();
    expect(screen.getByText("Menu classe 5eB")).toBeTruthy();
  });
});

// ── forcedSection ─────────────────────────────────────────────────────────────

describe("forcedSection — ouverture directe d'une section classe", () => {
  it("ouvre la section de classe correspondante quand forcedSection est fournie", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
      isOpen: true,
      forcedSection: "teacher-class-class-1",
    });
    // La section de classe est ouverte : ses items de navigation sont visibles
    expect(
      screen.getByTestId("drawer-section-teacher-class-class-1"),
    ).toBeTruthy();
  });

  it("expand la section forcée — les nav items de la classe sont affichés", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
      isOpen: true,
      forcedSection: "teacher-class-class-1",
    });
    // Quand la section est ouverte, les items fils apparaissent
    expect(
      screen.getByTestId("nav-item-teacher-class-class-1-notes"),
    ).toBeTruthy();
  });

  it("ne force aucune section si forcedSection est null", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
      isOpen: true,
      forcedSection: null,
    });
    // Aucun item de classe n'est visible par défaut (section "general" ouverte)
    expect(
      screen.queryByTestId("nav-item-teacher-class-class-1-notes"),
    ).toBeNull();
  });

  it("ne force aucune section si isOpen est false", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
      isOpen: false,
      forcedSection: "teacher-class-class-1",
    });
    // Le drawer est fermé → les items ne sont pas visibles
    expect(
      screen.queryByTestId("nav-item-teacher-class-class-1-notes"),
    ).toBeNull();
  });
});

// ── Style visuel des sections classes et enfants = navItem ──────────────────
// (la référence "Mon compte" a été retirée du drawer ; on compare désormais
// les sections entre elles pour vérifier l'harmonie visuelle du navItem.)

describe("Style visuel — sections classes enseignant cohérentes entre elles (navItem)", () => {
  it("deux sections classe partagent le même paddingVertical/paddingHorizontal", () => {
    const twoClassSections = buildTeacherClassSections([
      {
        classId: "cl-a",
        className: "6eA",
        schoolYearId: "sy1",
        schoolYearLabel: "2025-2026",
        subjects: [],
        studentCount: 25,
      },
      {
        classId: "cl-b",
        className: "5eB",
        schoolYearId: "sy1",
        schoolYearLabel: "2025-2026",
        subjects: [],
        studentCount: 22,
      },
    ]);
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections: twoClassSections,
      isTeacherClassNavEnabled: true,
    });

    const { StyleSheet } = require("react-native");
    const clABtn = screen.getByTestId("drawer-section-teacher-class-cl-a");
    const clBBtn = screen.getByTestId("drawer-section-teacher-class-cl-b");

    const flatA = StyleSheet.flatten(clABtn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };
    const flatB = StyleSheet.flatten(clBBtn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };

    expect(flatA.paddingVertical).toBe(flatB.paddingVertical);
    expect(flatA.paddingHorizontal).toBe(flatB.paddingHorizontal);
  });
});

describe("Style visuel — sections enfants cohérentes entre elles (navItem)", () => {
  const childSections = buildChildSections([child1, child2]);

  function renderParentDrawer2(activeChildId: string | null = null) {
    useFamilyStore.setState({ activeChildId, children: [] });
    return render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
  }

  it("les deux sections enfant partagent le même paddingVertical/paddingHorizontal", () => {
    renderParentDrawer2(null);

    const { StyleSheet } = require("react-native");
    const c1Btn = screen.getByTestId("drawer-section-child-c1");
    const c2Btn = screen.getByTestId("drawer-section-child-c2");

    const flat1 = StyleSheet.flatten(c1Btn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };
    const flat2 = StyleSheet.flatten(c2Btn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };

    expect(flat1.paddingVertical).toBe(flat2.paddingVertical);
    expect(flat1.paddingHorizontal).toBe(flat2.paddingHorizontal);
  });
});

// ── Hiérarchie visuelle — liseré top-level ────────────────────────────────────
//
// Règle : tout élément top-level inactif affiche un topLevelBar (liseré tamisé)
// et un texte navLabelTopLevel (lumineux + gras).  Tout élément actif affiche
// un activeBar (plein) et navLabelActive.  Les sous-éléments indentés n'ont
// aucun liseré.

// ── Helpers de style ──────────────────────────────────────────────────────────

function flatStyle(element: ReturnType<typeof screen.getByTestId>) {
  const { StyleSheet } = require("react-native");
  return StyleSheet.flatten(element.props.style) as Record<string, unknown>;
}

// ── Mode simple (NavRow sans indent) ─────────────────────────────────────────

describe("Hiérarchie visuelle — NavRow top-level inactif (mode simple)", () => {
  // En mode "simple" (ex. élève), tous les items sont des NavRow sans indent.
  // mockPathname = "/" → seul "home" est actif ; "documents" reste inactif.

  it("un item inactif top-level a un topLevelBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("documents-top-level-bar")).toBeTruthy();
  });

  it("un item inactif top-level n'a pas d'activeBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    expect(screen.queryByTestId("documents-active-bar")).toBeNull();
  });

  it("un item actif a un activeBar et pas de topLevelBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("home-active-bar")).toBeTruthy();
    expect(screen.queryByTestId("home-top-level-bar")).toBeNull();
  });

  it("le label d'un item inactif top-level a la couleur navLabelTopLevel", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    const style = flatStyle(screen.getByTestId("documents-label"));
    expect(style.color).toBe("rgba(255,255,255,0.92)");
  });

  it("le label d'un item inactif top-level a fontWeight 600", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    const style = flatStyle(screen.getByTestId("documents-label"));
    expect(style.fontWeight).toBe("600");
  });

  it("le label d'un item actif a la couleur navLabelActive (blanc)", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    const style = flatStyle(screen.getByTestId("home-label"));
    expect(style.color).toBe("#FFFFFF");
  });
});

// ── Sous-éléments indentés (NavRow avec indent) ───────────────────────────────

describe("Hiérarchie visuelle — sous-éléments indentés sans liseré", () => {
  // Les sous-items du menu enseignant (section générale ouverte) sont indentés.
  // Ils ne doivent avoir ni topLevelBar ni activeBar quand inactifs.

  it("un sous-item inactif n'a pas de topLevelBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    // La section générale est ouverte par défaut → les items sont visibles.
    expect(screen.queryByTestId("feed-top-level-bar")).toBeNull();
  });

  it("un sous-item inactif n'a pas d'activeBar non plus", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.queryByTestId("feed-active-bar")).toBeNull();
  });

  it("un sous-item actif a un activeBar mais pas de topLevelBar", () => {
    mockPathname = "/feed";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.getByTestId("feed-active-bar")).toBeTruthy();
    expect(screen.queryByTestId("feed-top-level-bar")).toBeNull();
  });

  it("le label d'un sous-item inactif a la couleur dim (0.72)", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    const style = flatStyle(screen.getByTestId("feed-label"));
    expect(style.color).toBe("rgba(255,255,255,0.72)");
  });

  it("le label d'un sous-item inactif a fontWeight 400", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    const style = flatStyle(screen.getByTestId("feed-label"));
    expect(style.fontWeight).toBe("400");
  });
});

// ── sectionHeader "Menu enseignant" ──────────────────────────────────────────
// Le style visuel suit la ROUTE (isGeneralRouteActive), pas l'accordéon.
// L'accordéon (openSection) contrôle uniquement l'affichage des sous-items.

describe("Hiérarchie visuelle — sectionHeader 'Menu enseignant'", () => {
  function renderTeacher() {
    return renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
  }

  it("a un activeBar quand la route courante est dans la section générale (/)", () => {
    mockPathname = "/";
    renderTeacher();
    expect(
      screen.getByTestId("drawer-section-teacher-general-active-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-teacher-general-top-level-bar"),
    ).toBeNull();
  });

  it("a un topLevelBar quand la route est dans une section classe", () => {
    // La route appartient à la classe → isGeneralRouteActive=false → topLevelBar
    mockPathname = "/classes/class-1/notes";
    renderTeacher();
    expect(
      screen.getByTestId("drawer-section-teacher-general-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-teacher-general-active-bar"),
    ).toBeNull();
  });

  it("son label a navLabelActive quand la route est dans la section générale", () => {
    mockPathname = "/";
    renderTeacher();
    const style = flatStyle(
      screen.getByTestId("drawer-section-teacher-general-label"),
    );
    expect(style.color).toBe("#FFFFFF");
    expect(style.fontWeight).toBe("600");
  });

  it("son label a navLabelTopLevel quand la route est hors section générale", () => {
    mockPathname = "/account";
    renderTeacher();
    const style = flatStyle(
      screen.getByTestId("drawer-section-teacher-general-label"),
    );
    expect(style.color).toBe("rgba(255,255,255,0.92)");
    expect(style.fontWeight).toBe("600");
  });

  it("sur /account (Mon compte, désormais hors drawer) : Menu enseignant reste inactif", () => {
    mockPathname = "/account";
    renderTeacher();
    expect(
      screen.getByTestId("drawer-section-teacher-general-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-teacher-general-active-bar"),
    ).toBeNull();
  });
});

// ── ExpandableNavRow — sections classes enseignant ────────────────────────────
// active = isClassRouteActive (route uniquement, pas isOpen).

describe("Hiérarchie visuelle — ExpandableNavRow sections classes", () => {
  function renderTeacher() {
    return renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
  }

  it("une section classe inactive a un topLevelBar quand la route ne la concerne pas", () => {
    mockPathname = "/";
    renderTeacher();
    expect(
      screen.getByTestId("drawer-section-teacher-class-class-1-top-level-bar"),
    ).toBeTruthy();
  });

  it("une section classe inactive n'a pas d'activeBar", () => {
    mockPathname = "/";
    renderTeacher();
    expect(
      screen.queryByTestId("drawer-section-teacher-class-class-1-active-bar"),
    ).toBeNull();
  });

  it("une section classe active a un activeBar quand la route lui appartient", () => {
    mockPathname = "/classes/class-1/notes";
    renderTeacher();
    expect(
      screen.getByTestId("drawer-section-teacher-class-class-1-active-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId(
        "drawer-section-teacher-class-class-1-top-level-bar",
      ),
    ).toBeNull();
  });

  it("son label a navLabelTopLevel quand la route n'appartient pas à la classe", () => {
    mockPathname = "/";
    renderTeacher();
    const style = flatStyle(
      screen.getByTestId("drawer-section-teacher-class-class-1-label"),
    );
    expect(style.color).toBe("rgba(255,255,255,0.92)");
    expect(style.fontWeight).toBe("600");
  });

  it("son label a navLabelActive quand la route appartient à la classe", () => {
    mockPathname = "/classes/class-1/notes";
    renderTeacher();
    const style = flatStyle(
      screen.getByTestId("drawer-section-teacher-class-class-1-label"),
    );
    expect(style.color).toBe("#FFFFFF");
    expect(style.fontWeight).toBe("600");
  });

  it("détecte automatiquement sa route active sans interaction utilisateur", () => {
    mockPathname = "/classes/class-1/notes";
    renderTeacher();
    expect(
      screen.getByTestId("drawer-section-teacher-class-class-1-active-bar"),
    ).toBeTruthy();
  });

  it("ouvrir l'accordéon (clic) sans naviguer ne rend pas la section visuellement active", () => {
    mockPathname = "/";
    renderTeacher();
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));
    // L'accordéon est ouvert mais la route est "/" → pas d'activeBar
    expect(
      screen.queryByTestId("drawer-section-teacher-class-class-1-active-bar"),
    ).toBeNull();
    expect(
      screen.getByTestId("drawer-section-teacher-class-class-1-top-level-bar"),
    ).toBeTruthy();
  });
});

// ── sectionHeader "Mon espace famille" (mode parent) ─────────────────────────

describe("Hiérarchie visuelle — sectionHeader 'Mon espace famille'", () => {
  const childSections = buildChildSections([child1, child2]);

  function renderParentWithChildren(activeChildId: string | null = null) {
    useFamilyStore.setState({ activeChildId, children: [] });
    return render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
  }

  it("a un activeBar quand la route courante est dans la section générale (/)", () => {
    mockPathname = "/";
    renderParentWithChildren(null);
    expect(
      screen.getByTestId("drawer-section-general-active-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-general-top-level-bar"),
    ).toBeNull();
  });

  it("a un topLevelBar quand la route est dans un item enfant (hors section générale)", () => {
    // /notes/child/c1 = route Notes de c1 → pas dans les navItems généraux
    mockPathname = "/notes/child/c1";
    renderParentWithChildren(null);
    expect(
      screen.getByTestId("drawer-section-general-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-general-active-bar"),
    ).toBeNull();
  });

  it("son label a navLabelActive quand la route est dans la section générale", () => {
    mockPathname = "/";
    renderParentWithChildren(null);
    const style = flatStyle(screen.getByTestId("drawer-section-general-label"));
    expect(style.color).toBe("#FFFFFF");
    expect(style.fontWeight).toBe("600");
  });

  it("son label a navLabelTopLevel quand la route est hors section générale", () => {
    mockPathname = "/notes/child/c1";
    renderParentWithChildren(null);
    const style = flatStyle(screen.getByTestId("drawer-section-general-label"));
    expect(style.color).toBe("rgba(255,255,255,0.92)");
    expect(style.fontWeight).toBe("600");
  });

  it("sur /account (Mon compte, désormais hors drawer) : Mon espace famille reste inactif", () => {
    mockPathname = "/account";
    renderParentWithChildren(null);
    expect(
      screen.getByTestId("drawer-section-general-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-general-active-bar"),
    ).toBeNull();
  });

  it("ouvrir l'accordéon d'un enfant (clic) ne rend pas Mon espace famille inactif si la route y est", () => {
    mockPathname = "/";
    renderParentWithChildren(null);
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    // Route "/" appartient à la section générale → toujours activeBar
    expect(
      screen.getByTestId("drawer-section-general-active-bar"),
    ).toBeTruthy();
  });
});

// ── ExpandableNavRow — sections enfants (mode parent) ─────────────────────────
// active = isChildRouteActive (route uniquement, pas isOpen).

describe("Hiérarchie visuelle — ExpandableNavRow sections enfants", () => {
  const childSections = buildChildSections([child1, child2]);

  function renderParentWithChildren(activeChildId: string | null = null) {
    useFamilyStore.setState({ activeChildId, children: [] });
    return render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
  }

  it("une section enfant inactive a un topLevelBar sur /account", () => {
    mockPathname = "/account";
    renderParentWithChildren(null);
    expect(
      screen.getByTestId("drawer-section-child-c1-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("drawer-section-child-c2-top-level-bar"),
    ).toBeTruthy();
  });

  it("une section enfant inactive n'a pas d'activeBar", () => {
    mockPathname = "/account";
    renderParentWithChildren(null);
    expect(
      screen.queryByTestId("drawer-section-child-c1-active-bar"),
    ).toBeNull();
  });

  it("la section enfant active a un activeBar quand la route lui appartient", () => {
    // /notes/child/c1 = route grades de c1
    mockPathname = "/notes/child/c1";
    renderParentWithChildren(null);
    expect(
      screen.getByTestId("drawer-section-child-c1-active-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-child-c1-top-level-bar"),
    ).toBeNull();
  });

  it("l'autre section enfant reste avec un topLevelBar quand c1 est actif par route", () => {
    mockPathname = "/notes/child/c1";
    renderParentWithChildren(null);
    // c2 n'a pas d'item sur /notes/child/c1 → inactive
    expect(
      screen.getByTestId("drawer-section-child-c2-top-level-bar"),
    ).toBeTruthy();
  });

  it("son label a navLabelTopLevel quand la route n'appartient pas à l'enfant", () => {
    mockPathname = "/account";
    renderParentWithChildren(null);
    const style = flatStyle(
      screen.getByTestId("drawer-section-child-c1-label"),
    );
    expect(style.color).toBe("rgba(255,255,255,0.92)");
    expect(style.fontWeight).toBe("600");
  });

  it("son label a navLabelActive quand la route appartient à l'enfant", () => {
    mockPathname = "/notes/child/c1";
    renderParentWithChildren(null);
    const style = flatStyle(
      screen.getByTestId("drawer-section-child-c1-label"),
    );
    expect(style.color).toBe("#FFFFFF");
    expect(style.fontWeight).toBe("600");
  });

  it("ouvrir l'accordéon enfant (clic) sans naviguer ne rend pas la section visuellement active", () => {
    mockPathname = "/account";
    renderParentWithChildren(null);
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    // Accordéon ouvert mais route /account → pas d'activeBar
    expect(
      screen.queryByTestId("drawer-section-child-c1-active-bar"),
    ).toBeNull();
    expect(
      screen.getByTestId("drawer-section-child-c1-top-level-bar"),
    ).toBeTruthy();
  });
});

// ── Cohérence globale : "Mon compte" n'apparaît plus jamais dans le drawer ───

describe("'Mon compte' — absent du drawer dans tous les modes (déplacé vers la bottom tab bar)", () => {
  it("mode simple", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("mode enseignant, section générale ouverte", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("mode enseignant, section classe ouverte", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("mode parent, section générale ouverte", () => {
    mockPathname = "/";
    const childSecs = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: null, children: [] });
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSecs}
      />,
    );
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("mode parent, section enfant ouverte", () => {
    mockPathname = "/";
    const childSecs = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: "c1", children: [] });
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSecs}
      />,
    );
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });

  it("même sur la route /account", () => {
    mockPathname = "/account";
    renderDrawer(getNavItems(studentUser));
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
  });
});

// ── isItemActive — clés "-home" enfant utilisent le matching de route ─────────
// Avant le fix, les clés "-home" matchaient uniquement "/".
// Après fix : seul item.key === "home" (racine) matche "/".
// Les items enfants "-home" utilisent la route réelle (/children/c1, etc.)

describe("isItemActive — clés '-home' enfant : route réelle, pas la racine '/'", () => {
  const childSections = buildChildSections([child1, child2]);

  function renderParentOnRoute(
    pathname: string,
    activeChildId: string | null = null,
  ) {
    mockPathname = pathname;
    useFamilyStore.setState({ activeChildId, children: [] });
    return render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
  }

  it("sur /children/c1 : MBELE Lisa est visuellement active (activeBar)", () => {
    renderParentOnRoute("/children/c1");
    expect(
      screen.getByTestId("drawer-section-child-c1-active-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-child-c1-top-level-bar"),
    ).toBeNull();
  });

  it("sur /children/c1 : c2 reste inactive (topLevelBar)", () => {
    renderParentOnRoute("/children/c1");
    expect(
      screen.getByTestId("drawer-section-child-c2-top-level-bar"),
    ).toBeTruthy();
  });

  it("sur /children/c2 : c2 active, c1 inactive", () => {
    renderParentOnRoute("/children/c2");
    expect(
      screen.getByTestId("drawer-section-child-c2-active-bar"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("drawer-section-child-c1-top-level-bar"),
    ).toBeTruthy();
  });

  it("sur / : item home racine actif, Mon espace famille actif, enfants inactifs", () => {
    renderParentOnRoute("/");
    // Home racine actif via navRow top-level (mode simple non parent, pas visible ici)
    // Mon espace famille : isGeneralNavActive = home racine matche "/" → active
    expect(
      screen.getByTestId("drawer-section-general-active-bar"),
    ).toBeTruthy();
    // Sections enfant : leurs items "-home" ne matchent plus "/" → inactives
    expect(
      screen.getByTestId("drawer-section-child-c1-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("drawer-section-child-c2-top-level-bar"),
    ).toBeTruthy();
  });

  it("sur /account : Mon espace famille et enfants inactifs (Mon compte n'est plus dans le drawer)", () => {
    renderParentOnRoute("/account");
    expect(screen.queryByTestId("nav-item-account")).toBeNull();
    expect(
      screen.getByTestId("drawer-section-general-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("drawer-section-child-c1-top-level-bar"),
    ).toBeTruthy();
  });

  it("label MBELE Lisa : navLabelActive sur /children/c1", () => {
    renderParentOnRoute("/children/c1");
    const style = flatStyle(
      screen.getByTestId("drawer-section-child-c1-label"),
    );
    expect(style.color).toBe("#FFFFFF");
    expect(style.fontWeight).toBe("600");
  });

  it("label MBELE Lisa : navLabelTopLevel sur /", () => {
    renderParentOnRoute("/");
    const style = flatStyle(
      screen.getByTestId("drawer-section-child-c1-label"),
    );
    expect(style.color).toBe("rgba(255,255,255,0.92)");
    expect(style.fontWeight).toBe("600");
  });
});

// ── Effect A — auto-ouvre la section enfant correspondant à la route ──────────
// Effect A détecte la route courante et ouvre (accordéon) la section enfant
// correspondante, en plus de la rendre visuellement active.

describe("Effect A — auto-ouverture de la section enfant par route", () => {
  const childSections = buildChildSections([child1, child2]);

  function renderParentOnRoute(
    pathname: string,
    activeChildId: string | null = null,
  ) {
    mockPathname = pathname;
    useFamilyStore.setState({ activeChildId, children: [] });
    return render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
  }

  it("sur /children/c1 : accordéon c1 ouvert (sous-items visibles)", () => {
    renderParentOnRoute("/children/c1");
    // L'accordéon de c1 doit être ouvert → sous-items visibles
    expect(screen.getByTestId("nav-item-child-c1-grades")).toBeTruthy();
  });

  it("sur /notes/child/c1 : accordéon c1 ouvert (route grades)", () => {
    renderParentOnRoute("/notes/child/c1");
    expect(screen.getByTestId("nav-item-child-c1-grades")).toBeTruthy();
  });

  it("sur /children/c2 : accordéon c2 ouvert, c1 fermé", () => {
    renderParentOnRoute("/children/c2");
    expect(screen.getByTestId("nav-item-child-c2-grades")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-child-c1-grades")).toBeNull();
  });

  it("sur /account : aucun accordéon ouvert (openSection='none')", () => {
    renderParentOnRoute("/account");
    // Ni les sous-items de la section générale ni ceux des enfants ne sont visibles
    expect(screen.queryByTestId("nav-item-home")).toBeNull();
    expect(screen.queryByTestId("nav-item-child-c1-grades")).toBeNull();
    expect(screen.queryByTestId("nav-item-child-c2-grades")).toBeNull();
  });

  it("sur / : accordéon de la section générale ouvert (activeChildId=null)", () => {
    renderParentOnRoute("/", null);
    // Section générale ouverte → items nav parent visibles
    expect(screen.getByTestId("nav-item-home")).toBeTruthy();
  });

  it("sur / avec activeChildId=c1 : accordéon c1 ouvert (ambiguïté levée par store)", () => {
    renderParentOnRoute("/", "c1");
    expect(screen.getByTestId("nav-item-child-c1-grades")).toBeTruthy();
    expect(screen.queryByTestId("nav-item-home")).toBeNull();
  });
});

// ── Version de l'application ───────────────────────────────────────────────────

describe("Version de l'application", () => {
  it("affiche le versionName au format V.x.x.x, pas le build number", () => {
    renderDrawer();
    expect(screen.getByTestId("drawer-app-version")).toHaveTextContent(
      "V1.2.3",
    );
  });

  it("n'affiche pas le build number natif dans le tiroir", () => {
    renderDrawer();
    expect(screen.getByTestId("drawer-app-version")).not.toHaveTextContent(
      "38",
    );
  });
});

// ── Badges ───────────────────────────────────────────────────────────────────

describe("Badges sur les items de navigation", () => {
  it("affiche un badge quand item.unread est défini et positif", () => {
    const navItems = getNavItems(parentUser).map((item) =>
      item.key === "messages" ? { ...item, unread: 4 } : item,
    );
    renderDrawer(navItems);
    expect(screen.getByTestId("messages-badge")).toBeTruthy();
    expect(screen.getByTestId("messages-badge")).toHaveTextContent("4");
  });

  it("n'affiche pas de badge quand item.unread est absent ou nul", () => {
    const navItems = getNavItems(parentUser);
    renderDrawer(navItems);
    expect(screen.queryByTestId("messages-badge")).toBeNull();
  });

  it("affiche le badge notes pour un enfant en section accordéon", () => {
    useFamilyStore.setState({ activeChildId: "c1", children: [child1] });
    const childSections = [
      {
        ...child1,
        navItems: buildChildNavItems(child1, {
          studentId: "c1",
          firstName: "Lisa",
          lastName: "Ntamack",
          homeworkPending: 0,
          notesUnread: 7,
          disciplineUnread: 0,
        }),
      },
    ];

    renderDrawer(getNavItems(parentUser), { childSections });

    expect(screen.getByTestId("child-c1-grades-badge")).toHaveTextContent("7");
    expect(screen.queryByTestId("child-c1-life-badge")).toBeNull();
  });
});

// ── Stratégie push vs replace — logique anti-empilement de modules ────────────
//
// Règle :
//  - Depuis l'accueil (/)           → push  (home reste la base de la stack)
//  - Même section (même module)     → push  (historique des onglets préservé)
//  - Section différente (cross-module) → replace (évite d'empiler un ancien module)

describe("Stratégie push/replace — depuis l'accueil", () => {
  it("utilise push quand la route courante est /", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(parentUser));
    fireEvent.press(screen.getByTestId("nav-item-feed"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith("/feed");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("utilise push pour l'item home depuis /", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(parentUser));
    fireEvent.press(screen.getByTestId("nav-item-home"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("utilise push quand la route courante est /index (alias home)", () => {
    mockPathname = "/index";
    renderDrawer(getNavItems(parentUser));
    fireEvent.press(screen.getByTestId("nav-item-feed"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("Stratégie push/replace — navigation dans le même module (push)", () => {
  it("onglets enseignant même classe → push (historique des onglets préservé)", () => {
    // On est déjà sur l'onglet feed de la classe (route active)
    mockPathname = "/classes/class-1/feed";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    // L'accordéon de la classe est auto-ouvert (route active)
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-1-notes"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/notes",
      params: { classId: "class-1" },
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("onglets enseignant même classe : discipline depuis notes → push", () => {
    mockPathname = "/classes/class-1/notes";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    fireEvent.press(
      screen.getByTestId("nav-item-teacher-class-class-1-discipline"),
    );
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/discipline",
      params: { classId: "class-1" },
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("items de la section générale entre eux → push (même section générale)", () => {
    // Sur /feed, on clique sur /agenda → même section "general" → push
    mockPathname = "/feed";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    fireEvent.press(screen.getByTestId("nav-item-agenda"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("Stratégie push/replace — changement de module (replace)", () => {
  it("depuis un module général vers une classe enseignant → replace", () => {
    // On est sur la route notes (section générale)
    mockPathname = "/notes";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    // Ouvrir la section classe
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));
    // Cliquer sur l'onglet feed de la classe
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-1-feed"));
    act(() => jest.runAllTimers());
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/feed",
      params: { classId: "class-1" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("depuis un onglet de classe vers la section générale → replace", () => {
    mockPathname = "/classes/class-1/discipline";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    // Ouvrir la section générale enseignant
    fireEvent.press(screen.getByTestId("drawer-section-teacher-general"));
    fireEvent.press(screen.getByTestId("nav-item-timetable"));
    act(() => jest.runAllTimers());
    expect(mockReplace).toHaveBeenCalledWith("/timetable");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("depuis un onglet enfant vers la section générale parent → replace", () => {
    const childSecs = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: "c1", children: [] });
    mockPathname = "/notes/child/c1";
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSecs}
      />,
    );
    // La section de l'enfant c1 est ouverte (route active) → ouvrir "Mon espace famille"
    fireEvent.press(screen.getByTestId("drawer-section-general"));
    fireEvent.press(screen.getByTestId("nav-item-feed"));
    act(() => jest.runAllTimers());
    expect(mockReplace).toHaveBeenCalledWith("/feed");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("depuis la section générale parent vers un onglet enfant → replace", () => {
    const childSecs = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: null, children: [] });
    mockPathname = "/feed";
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSecs}
      />,
    );
    // Section générale ouverte, on clique sur la section enfant
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    fireEvent.press(screen.getByTestId("nav-item-child-c1-grades"));
    act(() => jest.runAllTimers());
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId: "c1" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("Stratégie push/replace — navigation onglets enfant (même section)", () => {
  it("onglets du même enfant entre eux → push", () => {
    const childSecs = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: "c1", children: [] });
    mockPathname = "/notes/child/c1";
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSecs}
      />,
    );
    // Naviguer vers vie-scolaire du même enfant
    fireEvent.press(screen.getByTestId("nav-item-child-c1-life"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/vie-scolaire/[childId]",
      params: { childId: "c1" },
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe("Stratégie push/replace — cas limites", () => {
  it("route vide ('') traitée comme home → push", () => {
    mockPathname = "";
    renderDrawer(getNavItems(parentUser));
    fireEvent.press(screen.getByTestId("nav-item-feed"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("plusieurs onglets successifs de la même classe → push à chaque fois", () => {
    mockPathname = "/classes/class-1/feed";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-1-notes"));
    fireEvent.press(
      screen.getByTestId("nav-item-teacher-class-class-1-homework"),
    );
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledTimes(2);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
