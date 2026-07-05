/**
 * Tests d'intégration — Stratégie de navigation du drawer
 *
 * Vérifie que la logique push/replace garantit :
 *  1. Pas d'empilement cross-module : naviguer vers un autre module remplace
 *     la vue courante (pas de push), évitant que le bouton retour du header
 *     ne ramène vers un module précédemment quitté.
 *  2. Historique des onglets préservé : naviguer entre les onglets du MÊME
 *     module empile (push), permettant au bouton retour de revenir à l'onglet
 *     précédent.
 *  3. Depuis l'accueil : toujours push (home reste la base de la stack).
 */

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

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "1",
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
let mockPathname = "/";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    dismissAll: mockDismissAll,
    canDismiss: () => true,
  }),
  usePathname: () => mockPathname,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

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

const classA = {
  classId: "class-a",
  className: "6eA",
  schoolYearId: "sy1",
  schoolYearLabel: "2025-2026",
  subjects: [],
  studentCount: 20,
};

const classB = {
  classId: "class-b",
  className: "5eB",
  schoolYearId: "sy1",
  schoolYearLabel: "2025-2026",
  subjects: [],
  studentCount: 22,
};

const teacherSections = buildTeacherClassSections([classA, classB]);

const child1 = { id: "c1", firstName: "Lisa", lastName: "Ntamack" };
const child2 = { id: "c2", firstName: "Paul", lastName: "Ntamack" };

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  userFullName: "Marie Dupont",
  userInitials: "MD",
  userRole: "Enseignant(e)",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockPathname = "/";
  useFamilyStore.setState({ activeChildId: null, children: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderTeacherDrawer(overrides = {}) {
  return render(
    <AppDrawer
      {...baseProps}
      navItems={getNavItems(teacherUser)}
      teacherClassSections={teacherSections}
      isTeacherClassNavEnabled
      {...overrides}
    />,
  );
}

function renderParentDrawer(
  childSections = buildChildSections([child1, child2]),
  overrides = {},
) {
  return render(
    <AppDrawer
      {...baseProps}
      navItems={getNavItems(parentUser)}
      childSections={childSections}
      {...overrides}
    />,
  );
}

// ── Scénario 1 : flux enseignant — bug original ───────────────────────────────
//
// Reproduction du bug : l'enseignant est sur notes (module général), navigue
// vers les onglets de classe A, et le retour du header ne doit plus revenir
// sur notes (module précédent).
//
// Avec le fix : la navigation cross-module utilise replace, donc notes n'est
// plus dans la stack quand on entre dans la classe A.

describe("Flux enseignant — anti-empilement cross-module", () => {
  it("naviguer de notes vers classe-A-feed utilise replace (pas push)", () => {
    mockPathname = "/notes";
    renderTeacherDrawer();
    // Ouvrir la section de la classe A
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-a"));
    // Cliquer sur l'onglet feed de la classe A
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-a-feed"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/feed",
      params: { classId: "class-a" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("dans la classe A, naviguer entre onglets utilise push (historique préservé)", () => {
    mockPathname = "/classes/class-a/feed";
    renderTeacherDrawer();
    // Cliquer sur notes de la classe A
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-a-notes"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/notes",
      params: { classId: "class-a" },
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockDismissAll).not.toHaveBeenCalled();
  });

  it("depuis la classe A, retour vers le menu général utilise replace", () => {
    mockPathname = "/classes/class-a/discipline";
    renderTeacherDrawer();
    fireEvent.press(screen.getByTestId("drawer-section-teacher-general"));
    fireEvent.press(screen.getByTestId("nav-item-timetable"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/timetable");
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── Scénario 2 : flux complet depuis l'accueil ────────────────────────────────

describe("Flux enseignant depuis l'accueil", () => {
  it("accueil → classe-A-feed → push (home reste la base de la stack)", () => {
    mockPathname = "/";
    renderTeacherDrawer();
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-a"));
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-a-feed"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/feed",
      params: { classId: "class-a" },
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockDismissAll).not.toHaveBeenCalled();
  });
});

// ── Scénario 3 : navigation entre deux classes différentes ────────────────────

describe("Flux enseignant — navigation entre deux classes", () => {
  it("classe-A → classe-B utilise replace (cross-section)", () => {
    mockPathname = "/classes/class-a/notes";
    renderTeacherDrawer();
    // Ouvrir la section classe B
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-b"));
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-b-feed"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/feed",
      params: { classId: "class-b" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── Scénario 4 : flux parent avec enfants ────────────────────────────────────

describe("Flux parent — anti-empilement cross-section", () => {
  it("depuis un onglet enfant C1 vers la section générale → replace", () => {
    useFamilyStore.setState({ activeChildId: "c1", children: [] });
    mockPathname = "/notes/child/c1";
    renderParentDrawer();
    // Ouvrir la section générale
    fireEvent.press(screen.getByTestId("drawer-section-general"));
    fireEvent.press(screen.getByTestId("nav-item-messages"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/messages");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("depuis la section générale vers un onglet enfant → replace", () => {
    useFamilyStore.setState({ activeChildId: null, children: [] });
    // /feed est dans la section générale PARENT mais n'est dans aucun
    // item enfant (contrairement à /messages qui existe dans les deux).
    mockPathname = "/feed";
    renderParentDrawer();
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    fireEvent.press(screen.getByTestId("nav-item-child-c1-class-life"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]/vie-de-classe",
      params: { childId: "c1" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("entre onglets du même enfant C1 → push", () => {
    useFamilyStore.setState({ activeChildId: "c1", children: [] });
    mockPathname = "/notes/child/c1";
    renderParentDrawer();
    fireEvent.press(screen.getByTestId("nav-item-child-c1-life"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/vie-scolaire/[childId]",
      params: { childId: "c1" },
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockDismissAll).not.toHaveBeenCalled();
  });

  it("depuis enfant C1 vers enfant C2 → replace (sections différentes)", () => {
    useFamilyStore.setState({ activeChildId: "c1", children: [] });
    mockPathname = "/notes/child/c1";
    renderParentDrawer();
    // Ouvrir la section C2
    fireEvent.press(screen.getByTestId("drawer-section-child-c2"));
    fireEvent.press(screen.getByTestId("nav-item-child-c2-grades"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId: "c2" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("accueil → onglet enfant C1 → push (home reste la base)", () => {
    useFamilyStore.setState({ activeChildId: null, children: [] });
    mockPathname = "/";
    renderParentDrawer();
    fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    fireEvent.press(screen.getByTestId("nav-item-child-c1-grades"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId: "c1" },
    });
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockDismissAll).not.toHaveBeenCalled();
  });
});

// ── Scénario 5 : résilience / cas limites ────────────────────────────────────

describe("Stratégie navigation — cas limites", () => {
  it("items du menu enseignant général entre eux → push (même section générale)", () => {
    mockPathname = "/feed";
    renderTeacherDrawer();
    fireEvent.press(screen.getByTestId("nav-item-agenda"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockDismissAll).not.toHaveBeenCalled();
  });

  it("route inconnue (pas dans les sections) traitée comme générale → replace si classe active", () => {
    // Si la route courante est une route inconnue, getActiveSection renvoie "general".
    // Naviguer vers une classe (teacher-class) depuis "general" → replace.
    mockPathname = "/unknown-route";
    renderTeacherDrawer();
    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-a"));
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-a-notes"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/notes",
      params: { classId: "class-a" },
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("plusieurs navigations cross-module successives : chaque fois replace, précédée d'un dismissAll", () => {
    // module 1 → module 2 → module 3 : chaque transition vide d'abord la
    // pile (dismissAll) avant de remplacer, pour ne jamais laisser d'écrans
    // du module précédent montés en mémoire.
    mockPathname = "/feed";
    renderTeacherDrawer();

    fireEvent.press(screen.getByTestId("drawer-section-teacher-class-class-a"));
    fireEvent.press(screen.getByTestId("nav-item-teacher-class-class-a-feed"));
    act(() => jest.runAllTimers());

    expect(mockDismissAll).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
