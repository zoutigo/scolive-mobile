/**
 * Tests — AgendaScreen en mode SCHOOL_ADMIN
 *
 * Couvre :
 * - Structure : tabs "Users" / "Classes" (pas "Mon agenda" / "Mes classes")
 * - Sous-titre : uniquement le nom de l'école
 * - Tab Users : chargement des enseignants via class options + contexts
 * - Tab Users : filtrage par recherche texte
 * - Tab Users : sélection d'un enseignant → chargement de son agenda
 * - Tab Users : FAB de création présent, panneau créé avec prefilledTeacherId
 * - Tab Users : modal d'édition ouverte (toute occurrence est éditable)
 * - Tab Classes : toute occurrence est éditable en admin (isAdminMode)
 * - Tab Classes : modal d'édition en mode admin (picker enseignant visible)
 * - Navigation : SCHOOL_NAV contient l'entrée Agenda
 */

import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useWindowDimensions } from "react-native";
import { TeacherAgendaScreen } from "../../src/components/timetable/TeacherAgendaScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";
import { timetableApi } from "../../src/api/timetable.api";
import { getNavItems } from "../../src/components/navigation/nav-config";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("../../src/api/timetable.api");
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(() => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  })),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest
    .fn()
    .mockReturnValue({ width: 360, height: 800, scale: 2, fontScale: 1 }),
}));
const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TODAY = "2026-04-14"; // Tuesday

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-14T12:00:00Z"));
});
afterAll(() => jest.useRealTimers());

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: "admin1",
    firstName: "Sophie",
    lastName: "Ngomo",
    platformRoles: [],
    memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
    profileCompleted: true,
    role: "SCHOOL_ADMIN",
    activeRole: "SCHOOL_ADMIN",
    schoolName: "Lycée Einstein",
    referentClass: null,
    ...overrides,
  };
}

const ADMIN_USER = makeUser({});

const CLASS_OPTIONS = {
  selectedSchoolYearId: "sy1",
  schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
  classes: [
    {
      classId: "class-6eC",
      className: "6eC",
      schoolYearId: "sy1",
      schoolYearLabel: "2025-2026",
      studentCount: 28,
      subjects: [{ id: "ang", name: "Anglais" }],
    },
    {
      classId: "class-5eB",
      className: "5eB",
      schoolYearId: "sy1",
      schoolYearLabel: "2025-2026",
      studentCount: 30,
      subjects: [{ id: "math", name: "Mathématiques" }],
    },
  ],
};

// Contexte classe 6eC : Albert (u1) enseigne l'Anglais
const CTX_6EC = {
  class: {
    id: "class-6eC",
    name: "6eC",
    schoolId: "s1",
    schoolYearId: "sy1",
    academicLevelId: null,
    curriculumId: null,
    referentTeacherUserId: "u1",
  },
  allowedSubjects: [{ id: "ang", name: "Anglais" }],
  assignments: [
    {
      teacherUserId: "u1",
      subjectId: "ang",
      subject: { id: "ang", name: "Anglais" },
      teacherUser: { id: "u1", firstName: "Albert", lastName: "Mvondo" },
    },
  ],
  subjectStyles: [],
  schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
  selectedSchoolYearId: "sy1",
};

// Contexte classe 5eB : Guy (u2) enseigne les Maths
const CTX_5EB = {
  class: {
    id: "class-5eB",
    name: "5eB",
    schoolId: "s1",
    schoolYearId: "sy1",
    academicLevelId: null,
    curriculumId: null,
    referentTeacherUserId: "u2",
  },
  allowedSubjects: [{ id: "math", name: "Mathématiques" }],
  assignments: [
    {
      teacherUserId: "u2",
      subjectId: "math",
      subject: { id: "math", name: "Mathématiques" },
      teacherUser: { id: "u2", firstName: "Guy", lastName: "Ndem" },
    },
  ],
  subjectStyles: [],
  schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
  selectedSchoolYearId: "sy1",
};

// Occurrence pour Albert (u1) le TODAY
const OCC_ALBERT = {
  id: "occ-albert-14",
  source: "RECURRING" as const,
  status: "PLANNED" as const,
  occurrenceDate: TODAY,
  weekday: 2,
  startMinute: 525,
  endMinute: 600,
  room: "B45",
  reason: null,
  subject: { id: "ang", name: "Anglais" },
  teacherUser: { id: "u1", firstName: "Albert", lastName: "Mvondo" },
};

// Occurrence pour Guy (u2) le TODAY
const OCC_GUY = {
  id: "occ-guy-14",
  source: "RECURRING" as const,
  status: "PLANNED" as const,
  occurrenceDate: TODAY,
  weekday: 2,
  startMinute: 480,
  endMinute: 540,
  room: "A01",
  reason: null,
  subject: { id: "math", name: "Mathématiques" },
  teacherUser: { id: "u2", firstName: "Guy", lastName: "Ndem" },
};

const SLOT_STUB = {
  id: "slot-1",
  weekday: 2,
  startMinute: 525,
  endMinute: 600,
  room: "B45",
  activeFromDate: null,
  activeToDate: null,
  subject: { id: "ang", name: "Anglais" },
  teacherUser: { id: "u1", firstName: "Albert", lastName: "Mvondo" },
};

function makeTimetable(occs: (typeof OCC_ALBERT)[], slots = [SLOT_STUB]) {
  return {
    class: { id: "class-6eC", schoolYearId: "sy1", academicLevelId: null },
    slots,
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: occs,
    calendarEvents: [],
    subjectStyles: [{ subjectId: "ang", colorHex: "#11C5C6" }],
  };
}

const mockLoadClassOptions = jest.fn();
const mockLoadClassTimetable = jest.fn();
const mockClearError = jest.fn();
const api = timetableApi as jest.Mocked<typeof timetableApi>;

function setupAdminStores(
  classTimetable = makeTimetable([OCC_ALBERT, OCC_GUY]),
) {
  useAuthStore.setState({
    user: ADMIN_USER,
    schoolSlug: "lycee-einstein",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });
  useTimetableStore.setState({
    myTimetable: null,
    classTimetable,
    classOptions: CLASS_OPTIONS,
    isLoadingMyTimetable: false,
    isLoadingClassOptions: false,
    isLoadingClassTimetable: false,
    isLoadingClassContext: false,
    isSubmitting: false,
    classContext: null,
    errorMessage: null,
    loadClassOptions: mockLoadClassOptions,
    loadClassTimetable: mockLoadClassTimetable,
    clearError: mockClearError,
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWindowDimensions.mockReturnValue({
    width: 360,
    height: 800,
    scale: 2,
    fontScale: 1,
  });
  mockLoadClassOptions.mockResolvedValue(CLASS_OPTIONS);
  mockLoadClassTimetable.mockResolvedValue(
    makeTimetable([OCC_ALBERT, OCC_GUY]),
  );
  // Admin mode : getAdminClassList retourne toutes les classes de l'école
  api.getAdminClassList.mockResolvedValue(CLASS_OPTIONS);
  api.getClassContext.mockImplementation((_slug, classId) =>
    Promise.resolve(classId === "class-6eC" ? CTX_6EC : CTX_5EB),
  );
  api.getClassTimetable.mockImplementation((_slug, classId) =>
    Promise.resolve(
      classId === "class-6eC"
        ? makeTimetable([OCC_ALBERT])
        : makeTimetable([OCC_GUY], []),
    ),
  );
  api.createOneOffSlot.mockResolvedValue(undefined as never);
  setupAdminStores();
});

// ── Tests — Structure de l'écran admin ───────────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — structure", () => {
  it("affiche les onglets 'Users' et 'Classes' (pas Mon agenda / Mes classes)", async () => {
    render(<TeacherAgendaScreen />);
    expect(screen.getByTestId("teacher-agenda-tab-users")).toBeTruthy();
    expect(screen.getByTestId("teacher-agenda-tab-classes")).toBeTruthy();
    expect(screen.queryByTestId("teacher-agenda-tab-mine")).toBeNull();
  });

  it("l'onglet 'Users' est actif par défaut pour un SCHOOL_ADMIN", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-picker"),
      ).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-agenda-class-picker")).toBeNull();
  });

  it("affiche le sous-titre = nom de l'école uniquement (pas de classe référente)", () => {
    render(<TeacherAgendaScreen />);
    expect(screen.getByTestId("module-header-subtitle").props.children).toBe(
      "Lycée Einstein",
    );
  });

  it("pas de sous-titre si schoolName est absent", () => {
    useAuthStore.setState((s) => ({
      ...s,
      user: s.user ? { ...s.user, schoolName: null } : null,
    }));
    render(<TeacherAgendaScreen />);
    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });

  it("switche vers l'onglet 'Classes' et affiche le dropdown de classe admin", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-dropdown")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-agenda-users-teacher-picker"),
    ).toBeNull();
  });

  it("revient sur l'onglet 'Users' depuis 'Classes'", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-dropdown")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-users"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-picker"),
      ).toBeTruthy(),
    );
  });
});

// ── Tests — Tab Users : chargement des enseignants ──────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — tab Users : chargement enseignants", () => {
  it("appelle loadClassOptions + getClassContext pour chaque classe", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(mockLoadClassOptions).toHaveBeenCalledWith("lycee-einstein"),
    );
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "lycee-einstein",
        "class-6eC",
      ),
    );
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "lycee-einstein",
        "class-5eB",
      ),
    );
  });

  it("affiche un bouton par enseignant découvert dans les contextes", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-btn-u1"),
      ).toBeTruthy(),
    );
    expect(
      screen.getByTestId("teacher-agenda-users-teacher-btn-u2"),
    ).toBeTruthy();
    expect(screen.getByText("Mvondo Albert")).toBeTruthy();
    expect(screen.getByText("Ndem Guy")).toBeTruthy();
  });
});

// ── Tests — Tab Users : filtrage par recherche ───────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — tab Users : recherche", () => {
  async function waitForTeachers() {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-btn-u1"),
      ).toBeTruthy(),
    );
  }

  it("affiche le champ de recherche", async () => {
    await waitForTeachers();
    expect(screen.getByTestId("teacher-agenda-users-search")).toBeTruthy();
  });

  it("filtre les enseignants par recherche texte (insensible à la casse)", async () => {
    await waitForTeachers();
    fireEvent.changeText(
      screen.getByTestId("teacher-agenda-users-search"),
      "albert",
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-btn-u1"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-agenda-users-teacher-btn-u2"),
    ).toBeNull();
  });

  it("recherche vide = tous les enseignants", async () => {
    await waitForTeachers();
    fireEvent.changeText(
      screen.getByTestId("teacher-agenda-users-search"),
      "albert",
    );
    fireEvent.changeText(screen.getByTestId("teacher-agenda-users-search"), "");
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-btn-u2"),
      ).toBeTruthy(),
    );
  });
});

// ── Tests — Tab Users : sélection d'un enseignant ───────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — tab Users : sélection enseignant", () => {
  async function selectTeacher(teacherId: string) {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(
        screen.getByTestId(`teacher-agenda-users-teacher-btn-${teacherId}`),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId(`teacher-agenda-users-teacher-btn-${teacherId}`),
    );
  }

  it("sélectionner Albert charge getClassTimetable filtré par u1", async () => {
    await selectTeacher("u1");
    await waitFor(() =>
      expect(api.getClassTimetable).toHaveBeenCalledWith(
        "lycee-einstein",
        expect.any(String),
        expect.any(Object),
      ),
    );
  });

  it("affiche les cours d'Albert après sélection", async () => {
    await selectTeacher("u1");
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-day-card-occ-albert-14"),
      ).toBeTruthy(),
    );
    expect(screen.getByText("08:45 - 10:00 · Anglais")).toBeTruthy();
  });

  it("les créneaux d'un autre enseignant ne sont pas affichés", async () => {
    // Toutes classes retournent OCC_ALBERT seulement → OCC_GUY absent
    api.getClassTimetable.mockResolvedValue(makeTimetable([OCC_ALBERT]));
    await selectTeacher("u1");
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-users-day-list")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-agenda-users-day-card-occ-guy-14"),
    ).toBeNull();
  });

  it("passe en vue Semaine depuis le tab Users", async () => {
    await selectTeacher("u1");
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-users-mode-week")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-users-mode-week"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-users-week-grid")).toBeTruthy(),
    );
  });

  it("passe en vue Mois depuis le tab Users", async () => {
    await selectTeacher("u1");
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-mode-month"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-users-mode-month"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-month-grid"),
      ).toBeTruthy(),
    );
  });

  it("affiche un empty state avant la sélection d'un enseignant", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-btn-u1"),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Sélectionnez un enseignant")).toBeTruthy();
  });
});

// ── Tests — Tab Users : modal de création ───────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — tab Users : modal de création", () => {
  async function openUserCreateModal() {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-btn-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-users-teacher-btn-u1"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-fab-create"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-users-fab-create"));
  }

  it("le FAB de création est présent quand un enseignant est sélectionné", async () => {
    await openUserCreateModal();
    expect(screen.getByTestId("teacher-oneoff-create-panel")).toBeTruthy();
  });

  it("le panneau de création charge le contexte de la classe pour pré-remplir le bon enseignant", async () => {
    await openUserCreateModal();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-create-panel")).toBeTruthy(),
    );
    // Picker de classe visible (pas de classe pré-remplie dans le users pane)
    expect(screen.getByTestId("teacher-oneoff-class-class-6eC")).toBeTruthy();
    // Sélectionner la classe pour charger le contexte
    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "lycee-einstein",
        "class-6eC",
      ),
    );
  });
});

// ── Tests — Tab Users : modal d'édition ─────────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — tab Users : modal d'édition", () => {
  it("un clic sur Edit d'une occurrence ouvre la modale d'édition", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-teacher-btn-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-users-teacher-btn-u1"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-day-card-edit-occ-albert-14"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-users-day-card-edit-occ-albert-14"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-users-edit-modal"),
      ).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-slot-edit-panel")).toBeTruthy();
  });
});

// ── Tests — Tab Classes : toutes les occurrences sont éditables (admin) ─────

describe("AgendaScreen — SCHOOL_ADMIN — tab Classes : mode admin", () => {
  async function openClassesTab() {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    // Attendre le dropdown (getAdminClassList résolu)
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-dropdown")).toBeTruthy(),
    );
    // La première classe est auto-sélectionnée → loadClassTimetable appelé
    await waitFor(() => expect(mockLoadClassTimetable).toHaveBeenCalled());
  }

  it("appelle getAdminClassList pour charger toutes les classes (pas seulement celles avec assignments)", async () => {
    await openClassesTab();
    expect(api.getAdminClassList).toHaveBeenCalledWith("lycee-einstein");
  });

  it("toutes les occurrences ont un bouton d'édition (y compris celles d'un autre enseignant)", async () => {
    // classTimetable contient OCC_GUY dont teacherUser.id !== admin1
    await openClassesTab();
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-day-card-edit-occ-guy-14"),
      ).toBeTruthy(),
    );
  });

  it("ouvrir la modale d'édition d'un créneau quelconque en mode admin", async () => {
    await openClassesTab();
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-day-card-edit-occ-guy-14"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-class-day-card-edit-occ-guy-14"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-edit-modal"),
      ).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-slot-edit-panel")).toBeTruthy();
  });

  it("le panneau d'édition en mode admin charge le contexte de classe pour le picker enseignant", async () => {
    await openClassesTab();
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-day-card-edit-occ-guy-14"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-class-day-card-edit-occ-guy-14"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-edit-modal"),
      ).toBeTruthy(),
    );
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "lycee-einstein",
        "class-6eC",
      ),
    );
  });
});

// ── Tests — Navigation : SCHOOL_ADMIN a l'entrée Agenda ─────────────────────

describe("nav-config — SCHOOL_ADMIN", () => {
  function makeNavUser(overrides: Partial<AuthUser>): AuthUser {
    return {
      id: "a1",
      firstName: "Sophie",
      lastName: "Ngomo",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
      ...overrides,
    };
  }

  it("getNavItems pour SCHOOL_ADMIN retourne une entrée 'agenda' pointant vers /agenda", () => {
    const user = makeNavUser({});
    const items = getNavItems(user);
    const agendaItem = items.find((i) => i.key === "agenda");
    expect(agendaItem).toBeDefined();
    expect(agendaItem?.route).toBe("/agenda");
    expect(agendaItem?.icon).toBe("calendar-number-outline");
  });

  it("getNavItems pour SCHOOL_ADMIN ne retourne pas d'entrée 'timetable' (remplacée)", () => {
    const user = makeNavUser({});
    const items = getNavItems(user);
    expect(items.find((i) => i.key === "timetable")).toBeUndefined();
  });

  it("TEACHER garde ses propres entrées agenda et timetable", () => {
    const user = makeNavUser({
      role: "TEACHER",
      activeRole: "TEACHER",
      memberships: [{ schoolId: "s1", role: "TEACHER" }],
    });
    const items = getNavItems(user);
    expect(items.find((i) => i.key === "agenda")).toBeDefined();
    expect(items.find((i) => i.key === "timetable")).toBeDefined();
  });
});

// ── Tests — buildAdminSubtitle ────────────────────────────────────────────────

describe("buildAdminSubtitle", () => {
  it("retourne le nom de l'école quand il est présent", () => {
    const {
      buildAdminSubtitle,
    } = require("../../src/components/navigation/nav-config");
    const user = makeUser({ schoolName: "Lycée Einstein" });
    expect(buildAdminSubtitle(user)).toBe("Lycée Einstein");
  });

  it("retourne null si schoolName est absent", () => {
    const {
      buildAdminSubtitle,
    } = require("../../src/components/navigation/nav-config");
    const user = makeUser({ schoolName: null });
    expect(buildAdminSubtitle(user)).toBeNull();
  });
});
