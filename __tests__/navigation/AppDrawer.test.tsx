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
    "agenda",
    "timetable",
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

// ── Assistance ────────────────────────────────────────────────────────────────
// L'assistance doit être disponible pour TOUS les rôles, indépendamment du
// statut testeur — voir les tests dédiés au lien "Tests" dans
// __tests__/tests/tests.navigation.test.tsx.

describe("Lien Assistance", () => {
  it("est présent dans le mode plateforme", () => {
    renderDrawer(getNavItems(platformUser));
    expect(screen.getByTestId("drawer-tickets-btn")).toBeTruthy();
  });

  it("est présent dans le mode enseignant", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.getByTestId("drawer-tickets-btn")).toBeTruthy();
  });

  it("est présent dans le mode parent", () => {
    renderDrawer(getNavItems(parentUser), {
      childSections: buildChildSections([child1]),
    });
    expect(screen.getByTestId("drawer-tickets-btn")).toBeTruthy();
  });

  it("est présent dans le mode élève", () => {
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("drawer-tickets-btn")).toBeTruthy();
  });

  it("est présent que l'utilisateur soit testeur ou non", () => {
    renderDrawer(getNavItems(parentUser), { isTester: true });
    expect(screen.getByTestId("drawer-tickets-btn")).toBeTruthy();

    renderDrawer(getNavItems(parentUser), { isTester: false });
    expect(screen.getByTestId("drawer-tickets-btn")).toBeTruthy();
  });

  it("navigue vers /tickets au clic", () => {
    renderDrawer();
    fireEvent.press(screen.getByTestId("drawer-tickets-btn"));
    act(() => jest.runAllTimers());
    expect(mockPush).toHaveBeenCalledWith("/(home)/tickets");
  });

  it("appelle onClose avant de naviguer vers l'assistance", () => {
    const onClose = jest.fn();
    renderDrawer(getNavItems(parentUser), { onClose });
    fireEvent.press(screen.getByTestId("drawer-tickets-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);
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

// ── Mon compte — toujours en premier, quel que soit le rôle ──────────────────

describe("Mon compte — premier lien du aside", () => {
  it("est visible dans le mode simple (plateforme)", () => {
    renderDrawer(getNavItems(platformUser));
    expect(screen.getByTestId("nav-item-account")).toBeTruthy();
  });

  it("est visible dans le mode simple (élève)", () => {
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("nav-item-account")).toBeTruthy();
  });

  it("est visible dans le mode enseignant avec section générale ouverte", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.getByTestId("nav-item-account")).toBeTruthy();
  });

  it("reste visible quand une section classe enseignant est ouverte", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    // Ouvrir une section classe (ferme la section générale = nav-item-home disparaît)
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));
    expect(screen.queryByTestId("nav-item-home")).toBeNull();

    // Mon compte doit rester visible
    expect(screen.getByTestId("nav-item-account")).toBeTruthy();
  });

  it("reste visible dans le mode parent avec section générale ouverte", () => {
    const childSections = buildChildSections([child1]);
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
    expect(screen.getByTestId("nav-item-account")).toBeTruthy();
  });

  it("reste visible quand une section enfant est ouverte (mode parent)", () => {
    const childSections = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: null, children: [] });
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );

    // Ouvrir la section enfant (ferme la section générale = nav-item-home disparaît)
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    expect(screen.queryByTestId("nav-item-home")).toBeNull();

    // Mon compte doit rester visible
    expect(screen.getByTestId("nav-item-account")).toBeTruthy();
  });

  it("n'est pas dans la section générale enseignant (pas dupliqué)", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    // openSection = "general" → les items de section s'affichent
    // On vérifie qu'account n'apparaît qu'une seule fois
    const allAccountItems = screen.queryAllByTestId("nav-item-account");
    expect(allAccountItems).toHaveLength(1);
  });

  it("n'est pas dupliqué dans la section générale parent", () => {
    const childSections = buildChildSections([child1]);
    useFamilyStore.setState({ activeChildId: null, children: [] });
    render(
      <AppDrawer
        {...baseProps}
        navItems={getNavItems(parentUser)}
        childSections={childSections}
      />,
    );
    // La section générale est ouverte — account ne doit apparaître qu'une fois
    const allAccountItems = screen.queryAllByTestId("nav-item-account");
    expect(allAccountItems).toHaveLength(1);
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

// ── Style visuel des sections classes et enfants = navItem (comme "Mon compte") ─

describe("Style visuel — sections classes enseignant identiques à Mon compte (navItem)", () => {
  it("le bouton de section classe a le même paddingVertical que un navItem", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    const { StyleSheet } = require("react-native");
    const accountBtn = screen.getByTestId("nav-item-account");
    const classBtn = screen.getByTestId("drawer-section-teacher-class-class-1");

    const flatAccount = StyleSheet.flatten(accountBtn.props.style) as {
      paddingVertical?: number;
    };
    const flatClass = StyleSheet.flatten(classBtn.props.style) as {
      paddingVertical?: number;
    };

    expect(flatClass.paddingVertical).toBe(flatAccount.paddingVertical);
  });

  it("le bouton de section classe a le même paddingHorizontal que un navItem", () => {
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });

    const { StyleSheet } = require("react-native");
    const accountBtn = screen.getByTestId("nav-item-account");
    const classBtn = screen.getByTestId("drawer-section-teacher-class-class-1");

    const flatAccount = StyleSheet.flatten(accountBtn.props.style) as {
      paddingHorizontal?: number;
    };
    const flatClass = StyleSheet.flatten(classBtn.props.style) as {
      paddingHorizontal?: number;
    };

    expect(flatClass.paddingHorizontal).toBe(flatAccount.paddingHorizontal);
  });

  it("avec deux classes, les deux boutons ont le même style que Mon compte", () => {
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
    const accountBtn = screen.getByTestId("nav-item-account");
    const clABtn = screen.getByTestId("drawer-section-teacher-class-cl-a");
    const clBBtn = screen.getByTestId("drawer-section-teacher-class-cl-b");

    const flatAccount = StyleSheet.flatten(accountBtn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };
    const flatA = StyleSheet.flatten(clABtn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };
    const flatB = StyleSheet.flatten(clBBtn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };

    expect(flatA.paddingVertical).toBe(flatAccount.paddingVertical);
    expect(flatA.paddingHorizontal).toBe(flatAccount.paddingHorizontal);
    expect(flatB.paddingVertical).toBe(flatAccount.paddingVertical);
    expect(flatB.paddingHorizontal).toBe(flatAccount.paddingHorizontal);
  });
});

describe("Style visuel — sections enfants identiques à Mon compte (navItem)", () => {
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

  it("le bouton de section enfant a le même paddingVertical que Mon compte", () => {
    renderParentDrawer2(null);

    const { StyleSheet } = require("react-native");
    const accountBtn = screen.getByTestId("nav-item-account");
    const childBtn = screen.getByTestId("drawer-section-child-c1");

    const flatAccount = StyleSheet.flatten(accountBtn.props.style) as {
      paddingVertical?: number;
    };
    const flatChild = StyleSheet.flatten(childBtn.props.style) as {
      paddingVertical?: number;
    };

    expect(flatChild.paddingVertical).toBe(flatAccount.paddingVertical);
  });

  it("le bouton de section enfant a le même paddingHorizontal que Mon compte", () => {
    renderParentDrawer2(null);

    const { StyleSheet } = require("react-native");
    const accountBtn = screen.getByTestId("nav-item-account");
    const childBtn = screen.getByTestId("drawer-section-child-c1");

    const flatAccount = StyleSheet.flatten(accountBtn.props.style) as {
      paddingHorizontal?: number;
    };
    const flatChild = StyleSheet.flatten(childBtn.props.style) as {
      paddingHorizontal?: number;
    };

    expect(flatChild.paddingHorizontal).toBe(flatAccount.paddingHorizontal);
  });

  it("les deux sections enfant ont le même style que Mon compte", () => {
    renderParentDrawer2(null);

    const { StyleSheet } = require("react-native");
    const accountBtn = screen.getByTestId("nav-item-account");
    const c1Btn = screen.getByTestId("drawer-section-child-c1");
    const c2Btn = screen.getByTestId("drawer-section-child-c2");

    const flatAccount = StyleSheet.flatten(accountBtn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };
    const flat1 = StyleSheet.flatten(c1Btn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };
    const flat2 = StyleSheet.flatten(c2Btn.props.style) as {
      paddingVertical?: number;
      paddingHorizontal?: number;
    };

    expect(flat1.paddingVertical).toBe(flatAccount.paddingVertical);
    expect(flat1.paddingHorizontal).toBe(flatAccount.paddingHorizontal);
    expect(flat2.paddingVertical).toBe(flatAccount.paddingVertical);
    expect(flat2.paddingHorizontal).toBe(flatAccount.paddingHorizontal);
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
  // mockPathname = "/" → seul "home" est actif ; "account" reste inactif.

  it("un item inactif top-level a un topLevelBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("account-top-level-bar")).toBeTruthy();
  });

  it("un item inactif top-level n'a pas d'activeBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    expect(screen.queryByTestId("account-active-bar")).toBeNull();
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
    const style = flatStyle(screen.getByTestId("account-label"));
    expect(style.color).toBe("rgba(255,255,255,0.92)");
  });

  it("le label d'un item inactif top-level a fontWeight 600", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    const style = flatStyle(screen.getByTestId("account-label"));
    expect(style.fontWeight).toBe("600");
  });

  it("le label d'un item actif a la couleur navLabelActive (blanc)", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    const style = flatStyle(screen.getByTestId("home-label"));
    expect(style.color).toBe("#FFFFFF");
  });

  it("quand account devient la route active, il passe à activeBar et perd topLevelBar", () => {
    mockPathname = "/account";
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("account-active-bar")).toBeTruthy();
    expect(screen.queryByTestId("account-top-level-bar")).toBeNull();
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

  it("sur /account : n'est pas visuellement actif — pas de double actif avec Mon compte", () => {
    // Scénario utilisateur : on est sur Mon compte, Menu enseignant doit être inactif.
    mockPathname = "/account";
    renderTeacher();
    expect(
      screen.getByTestId("drawer-section-teacher-general-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-teacher-general-active-bar"),
    ).toBeNull();
    // Mon compte lui est actif
    expect(screen.getByTestId("account-active-bar")).toBeTruthy();
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

  it("sur /account : n'est pas visuellement actif — pas de double actif avec Mon compte", () => {
    mockPathname = "/account";
    renderParentWithChildren(null);
    expect(
      screen.getByTestId("drawer-section-general-top-level-bar"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("drawer-section-general-active-bar"),
    ).toBeNull();
    expect(screen.getByTestId("account-active-bar")).toBeTruthy();
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

// ── Cohérence globale : "Mon compte" a toujours le bon liseré ─────────────────

describe("Hiérarchie visuelle — 'Mon compte' top-level dans tous les modes", () => {
  it("mode simple : inactif → topLevelBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("account-top-level-bar")).toBeTruthy();
  });

  it("mode enseignant, section générale ouverte : inactif → topLevelBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    expect(screen.getByTestId("account-top-level-bar")).toBeTruthy();
  });

  it("mode enseignant, section classe ouverte : inactif → topLevelBar", () => {
    mockPathname = "/";
    renderDrawer(getNavItems(teacherUser), {
      teacherClassSections,
      isTeacherClassNavEnabled: true,
    });
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-1"));
    expect(screen.getByTestId("account-top-level-bar")).toBeTruthy();
  });

  it("mode parent, section générale ouverte : inactif → topLevelBar", () => {
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
    expect(screen.getByTestId("account-top-level-bar")).toBeTruthy();
  });

  it("mode parent, section enfant ouverte : inactif → topLevelBar", () => {
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
    expect(screen.getByTestId("account-top-level-bar")).toBeTruthy();
  });

  it("actif (/account) → activeBar, pas de topLevelBar", () => {
    mockPathname = "/account";
    renderDrawer(getNavItems(studentUser));
    expect(screen.getByTestId("account-active-bar")).toBeTruthy();
    expect(screen.queryByTestId("account-top-level-bar")).toBeNull();
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

  it("sur /account : Mon compte seul actif, Mon espace famille et enfants inactifs", () => {
    renderParentOnRoute("/account");
    expect(screen.getByTestId("account-active-bar")).toBeTruthy();
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
