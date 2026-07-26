/**
 * Tests — AgendaScreen en mode SCHOOL_ADMIN
 *
 * Couvre le panneau de filtres centralisé (AdminSchedulePane) :
 * - Structure : pas de tabs Users/Classes, recherche + bouton filtre
 * - Panneau de filtres : radio Users/Classes, Reset/Close/Apply
 * - Mode Users : recherche paginée via usersApi.list, sélection d'un
 *   enseignant → getTeacherMyTimetable, d'un élève → getMyTimetable(studentId),
 *   d'un staff → aucun agenda (empty state dédié)
 * - Mode Classes : niveaux via curriculumsApi.listAcademicLevels, classes
 *   paginées via getAdminClassList (search + academicLevelId), sélection →
 *   getClassTimetable
 * - Navigation : SCHOOL_NAV contient l'entrée Agenda
 */

import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react-native";
import { useWindowDimensions } from "react-native";
import { TeacherAgendaScreen } from "../../src/components/timetable/TeacherAgendaScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";
import { timetableApi } from "../../src/api/timetable.api";
import { usersApi } from "../../src/api/users.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { getNavItems } from "../../src/components/navigation/nav-config";
import type { AuthUser } from "../../src/types/auth.types";
import type { UserItem } from "../../src/types/users.types";

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock("../../src/api/timetable.api");
jest.mock("../../src/api/users.api");
jest.mock("../../src/api/curriculums.api");
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
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({}),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({
    openDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    closeDrawer: jest.fn(),
  }),
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

const TEACHER_MEMBER: UserItem = {
  type: "user" as const,
  id: "u1",
  studentId: null,
  hasAccount: true as const,
  firstName: "Albert",
  lastName: "Mvondo",
  email: "albert@school.cm",
  phone: null,
  gender: null,
  avatarUrl: null,
  roles: ["TEACHER"],
  activationStatus: "ACTIVE" as const,
  profileCompleted: true,
  createdAt: "2025-01-01T00:00:00Z",
};

const STUDENT_MEMBER: UserItem = {
  type: "user" as const,
  id: "u3",
  studentId: "student-3",
  hasAccount: true as const,
  firstName: "Chloé",
  lastName: "Fotso",
  email: null,
  phone: null,
  gender: null,
  avatarUrl: null,
  roles: ["STUDENT"],
  activationStatus: "ACTIVE" as const,
  profileCompleted: true,
  createdAt: "2025-01-01T00:00:00Z",
};

const STAFF_MEMBER: UserItem = {
  type: "user" as const,
  id: "u4",
  studentId: null,
  hasAccount: true as const,
  firstName: "Bella",
  lastName: "Owona",
  email: null,
  phone: null,
  gender: null,
  avatarUrl: null,
  roles: ["SCHOOL_STAFF"],
  activationStatus: "ACTIVE" as const,
  profileCompleted: true,
  createdAt: "2025-01-01T00:00:00Z",
};

const LEVEL_6E = { id: "lvl-6e", code: "6E", label: "6ème" };

const CLASS_6EC = {
  classId: "class-6eC",
  className: "6eC",
  schoolYearId: "sy1",
  schoolYearLabel: "2025-2026",
  studentCount: 28,
  subjects: [{ id: "ang", name: "Anglais" }],
  academicLevelId: "lvl-6e",
  academicLevelName: "6ème",
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

// Occurrence pour Chloé (élève) le TODAY
const OCC_CHLOE = {
  id: "occ-chloe-14",
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

function makeClassTimetable(occs: unknown[], slots = [SLOT_STUB]) {
  return {
    class: { id: "class-6eC", schoolYearId: "sy1", academicLevelId: "lvl-6e" },
    slots,
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: occs,
    calendarEvents: [],
    subjectStyles: [{ subjectId: "ang", colorHex: "#11C5C6" }],
  };
}

function makeTeacherTimetable() {
  return {
    teacher: { id: "u1", firstName: "Albert", lastName: "Mvondo" },
    classes: [
      {
        id: "class-6eC",
        name: "6eC",
        schoolYearId: "sy1",
        academicLevelId: "lvl-6e",
      },
    ],
    slots: [SLOT_STUB],
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: [OCC_ALBERT],
    occurrenceContexts: [
      {
        occurrenceId: "occ-albert-14",
        classId: "class-6eC",
        className: "6eC",
        schoolYearId: "sy1",
      },
    ],
    subjectStyles: [{ subjectId: "ang", colorHex: "#11C5C6" }],
  };
}

function makeStudentTimetable() {
  return {
    student: { id: "student-3", firstName: "Chloé", lastName: "Fotso" },
    class: {
      id: "class-5eB",
      name: "5eB",
      schoolYearId: "sy1",
      academicLevelId: "lvl-5e",
    },
    slots: [{ ...SLOT_STUB, subject: { id: "math", name: "Mathématiques" } }],
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: [OCC_CHLOE],
    calendarEvents: [],
    subjectStyles: [{ subjectId: "math", colorHex: "#AA5522" }],
  };
}

const api = timetableApi as jest.Mocked<typeof timetableApi>;
const usersApiMock = usersApi as jest.Mocked<typeof usersApi>;
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

function setupAdminStores() {
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
    classTimetable: null,
    classOptions: null,
    isLoadingMyTimetable: false,
    isLoadingClassOptions: false,
    isLoadingClassTimetable: false,
    isLoadingClassContext: false,
    isSubmitting: false,
    classContext: null,
    errorMessage: null,
    loadClassOptions: jest.fn(),
    loadClassTimetable: jest.fn(),
    clearError: jest.fn(),
  } as never);
}

async function flushDebounce() {
  await act(async () => {
    jest.advanceTimersByTime(350);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWindowDimensions.mockReturnValue({
    width: 360,
    height: 800,
    scale: 2,
    fontScale: 1,
  });
  usersApiMock.list.mockResolvedValue({
    data: [TEACHER_MEMBER, STUDENT_MEMBER, STAFF_MEMBER],
    total: 3,
    page: 1,
    limit: 20,
    hasMore: false,
  });
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([LEVEL_6E]);
  api.getAdminClassList.mockResolvedValue({
    data: [CLASS_6EC],
    total: 1,
    page: 1,
    limit: 20,
    hasMore: false,
  });
  api.getTeacherMyTimetable.mockResolvedValue(makeTeacherTimetable() as never);
  api.getMyTimetable.mockResolvedValue(makeStudentTimetable() as never);
  api.getClassTimetable.mockResolvedValue(
    makeClassTimetable([OCC_ALBERT]) as never,
  );
  api.createOneOffSlot.mockResolvedValue(undefined as never);
  setupAdminStores();
});

// ── Tests — Structure de l'écran admin ───────────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — structure", () => {
  it("n'affiche plus les onglets Users/Classes : recherche + bouton filtre à la place", () => {
    render(<TeacherAgendaScreen />);
    expect(screen.queryByTestId("teacher-agenda-tab-users")).toBeNull();
    expect(screen.queryByTestId("teacher-agenda-tab-classes")).toBeNull();
    expect(
      screen.getByTestId("teacher-agenda-admin-search-input"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teacher-agenda-admin-filter-toggle"),
    ).toBeTruthy();
  });

  it("affiche un état vide invitant à ouvrir les filtres tant que rien n'est sélectionné", () => {
    render(<TeacherAgendaScreen />);
    expect(
      screen.getByText("Choisissez un utilisateur ou une classe"),
    ).toBeTruthy();
  });

  it("affiche le sous-titre = nom de l'école uniquement (pas de classe référente)", () => {
    render(<TeacherAgendaScreen />);
    expect(screen.getByTestId("module-header-subtitle").props.children).toBe(
      "Lycée Einstein",
    );
  });

  it("le panneau de filtres est fermé par défaut, s'ouvre au tap sur le bouton filtre", () => {
    render(<TeacherAgendaScreen />);
    expect(
      screen.queryByTestId("teacher-agenda-admin-filter-panel"),
    ).toBeNull();
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    expect(
      screen.getByTestId("teacher-agenda-admin-filter-panel"),
    ).toBeTruthy();
  });

  it("le mode 'Users' est actif par défaut à l'ouverture du panneau", () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    expect(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    ).toBeTruthy();
  });
});

// ── Tests — Mode Users : sélection enseignant ────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — mode Users : enseignant", () => {
  async function applyTeacherFilter() {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));
  }

  it("sélectionner un enseignant appelle getTeacherMyTimetable avec son id", async () => {
    await applyTeacherFilter();
    await waitFor(() =>
      expect(api.getTeacherMyTimetable).toHaveBeenCalledWith(
        "lycee-einstein",
        expect.objectContaining({ teacherUserId: "u1" }),
      ),
    );
  });

  it("affiche les cours de l'enseignant sélectionné avec bouton d'édition", async () => {
    await applyTeacherFilter();
    await waitFor(() =>
      expect(
        screen.getByTestId(
          "teacher-agenda-admin-agenda-day-card-occ-albert-14",
        ),
      ).toBeTruthy(),
    );
    expect(
      screen.getByTestId(
        "teacher-agenda-admin-agenda-day-card-edit-occ-albert-14",
      ),
    ).toBeTruthy();
  });

  it("le FAB de création pré-remplit teacherId dans l'URL", async () => {
    await applyTeacherFilter();
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-agenda-fab-create"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-agenda-fab-create"),
    );
    expect(mockPush.mock.calls[0][0]).toContain("teacherId=u1");
  });

  it("le bouton filtre devient teal actif après application", async () => {
    await applyTeacherFilter();
    await waitFor(() => {
      const style = screen.getByTestId("teacher-agenda-admin-filter-toggle")
        .props.style;
      expect([style].flat()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: "#247C72" }),
        ]),
      );
    });
  });
});

// ── Tests — Mode Users : sélection élève ─────────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — mode Users : élève", () => {
  it("sélectionner un élève appelle getMyTimetable avec son studentId", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u3"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u3"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));

    await waitFor(() =>
      expect(api.getMyTimetable).toHaveBeenCalledWith(
        "lycee-einstein",
        expect.objectContaining({ studentId: "student-3" }),
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-agenda-day-card-occ-chloe-14"),
      ).toBeTruthy(),
    );
  });
});

// ── Tests — Mode Users : staff sans agenda ───────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — mode Users : staff sans agenda", () => {
  it("sélectionner un membre du staff n'appelle aucun endpoint d'agenda et affiche un message dédié", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u4"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u4"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Ce profil ne dispose pas d'emploi du temps (personnel administratif).",
        ),
      ).toBeTruthy(),
    );
    expect(api.getTeacherMyTimetable).not.toHaveBeenCalled();
    expect(api.getMyTimetable).not.toHaveBeenCalled();
    expect(api.getClassTimetable).not.toHaveBeenCalled();
  });
});

// ── Tests — Mode Classes ──────────────────────────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — mode Classes", () => {
  async function applyClassFilter() {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-mode-class"));
    await waitFor(() =>
      expect(curriculumsApiMock.listAcademicLevels).toHaveBeenCalledWith(
        "lycee-einstein",
      ),
    );
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-class-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-class-picker-item-class-6eC"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-class-picker-item-class-6eC"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));
  }

  it("switcher vers Classes charge les niveaux et les classes", async () => {
    await applyClassFilter();
    expect(curriculumsApiMock.listAcademicLevels).toHaveBeenCalledWith(
      "lycee-einstein",
    );
  });

  it("sélectionner un niveau relance getAdminClassList avec academicLevelId", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-mode-class"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-level-lvl-6e"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-level-lvl-6e"));
    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenCalledWith(
        "lycee-einstein",
        expect.objectContaining({ academicLevelId: "lvl-6e" }),
      ),
    );
  });

  it("sélectionner une classe appelle getClassTimetable et toutes les occurrences sont éditables", async () => {
    await applyClassFilter();
    await waitFor(() =>
      expect(api.getClassTimetable).toHaveBeenCalledWith(
        "lycee-einstein",
        "class-6eC",
        expect.any(Object),
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId(
          "teacher-agenda-admin-agenda-day-card-edit-occ-albert-14",
        ),
      ).toBeTruthy(),
    );
  });

  it("clic Edit navigue vers slot-edit avec adminMode=true", async () => {
    await applyClassFilter();
    await waitFor(() =>
      expect(
        screen.getByTestId(
          "teacher-agenda-admin-agenda-day-card-edit-occ-albert-14",
        ),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId(
        "teacher-agenda-admin-agenda-day-card-edit-occ-albert-14",
      ),
    );
    expect(mockPush).toHaveBeenCalledWith("/(home)/agenda/slot-edit");
    expect(useTimetableStore.getState().pendingSlotEdit?.adminMode).toBe(true);
  });
});

// ── Tests — Recherche (debounce) ─────────────────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — recherche", () => {
  it("la saisie dans le search principal relance usersApi.list après le debounce", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    usersApiMock.list.mockClear();

    fireEvent.changeText(
      screen.getByTestId("teacher-agenda-admin-search-input"),
      "albert",
    );
    await flushDebounce();

    await waitFor(() =>
      expect(usersApiMock.list).toHaveBeenCalledWith(
        "lycee-einstein",
        expect.objectContaining({ search: "albert", page: 1 }),
      ),
    );
  });
});

// ── Tests — Reset / Close / Apply ────────────────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — Reset / Close / Apply", () => {
  it("Close referme le panneau sans appliquer la sélection en cours", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-close"));

    expect(
      screen.queryByTestId("teacher-agenda-admin-filter-panel"),
    ).toBeNull();
    expect(api.getTeacherMyTimetable).not.toHaveBeenCalled();
    expect(
      screen.getByText("Choisissez un utilisateur ou une classe"),
    ).toBeTruthy();
  });

  it("Reset vide draft ET applied, le panneau reste ouvert", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));
    await waitFor(() => expect(api.getTeacherMyTimetable).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-reset"));

    expect(
      screen.getByTestId("teacher-agenda-admin-filter-panel"),
    ).toBeTruthy();
    const style = screen.getByTestId("teacher-agenda-admin-filter-toggle").props
      .style;
    expect([style].flat()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#247C72" }),
      ]),
    );
  });
});

// ── Tests — Bandeau de sélection contextuel ──────────────────────────────────

describe("AgendaScreen — SCHOOL_ADMIN — bandeau de sélection", () => {
  it("n'affiche aucun bandeau tant qu'aucune sélection n'est appliquée", () => {
    render(<TeacherAgendaScreen />);
    expect(
      screen.queryByTestId("teacher-agenda-admin-selection-banner"),
    ).toBeNull();
  });

  it("affiche 'Agenda de : <nom> · <rôle>' après sélection d'un enseignant", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-selection-banner-label").props
          .children,
      ).toBe("Agenda de : Mvondo Albert · Enseignant"),
    );
  });

  it("affiche 'Classe : <nom> · <niveau>' après sélection d'une classe", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-mode-class"));
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-class-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-class-picker-item-class-6eC"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-class-picker-item-class-6eC"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-selection-banner-label").props
          .children,
      ).toBe("Classe : 6eC · 6ème"),
    );
  });

  it("le bandeau reste visible et affiche la sélection même quand le profil n'a pas d'agenda (staff)", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u4"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u4"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-selection-banner-label").props
          .children,
      ).toBe("Agenda de : Owona Bella · Personnel"),
    );
  });

  it("le bandeau est masqué pendant que le panneau de filtres est ouvert", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-selection-banner"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    expect(
      screen.queryByTestId("teacher-agenda-admin-selection-banner"),
    ).toBeNull();
  });

  it("taper sur le bandeau rouvre le panneau de filtres pré-rempli avec la sélection", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-selection-banner"),
      ).toBeTruthy(),
    );

    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-selection-banner"),
    );

    expect(
      screen.getByTestId("teacher-agenda-admin-filter-panel"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    ).toBeTruthy();
  });

  it("taper sur le bouton d'effacement du bandeau réinitialise la sélection sans ouvrir le panneau", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-toggle"));
    await waitFor(() => expect(usersApiMock.list).toHaveBeenCalled());
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-trigger"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-user-picker-item-u1"),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-admin-filter-apply"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-admin-selection-banner"),
      ).toBeTruthy(),
    );

    fireEvent.press(
      screen.getByTestId("teacher-agenda-admin-selection-banner-clear"),
    );

    expect(
      screen.queryByTestId("teacher-agenda-admin-selection-banner"),
    ).toBeNull();
    expect(
      screen.queryByTestId("teacher-agenda-admin-filter-panel"),
    ).toBeNull();
    expect(
      screen.getByText("Choisissez un utilisateur ou une classe"),
    ).toBeTruthy();
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
