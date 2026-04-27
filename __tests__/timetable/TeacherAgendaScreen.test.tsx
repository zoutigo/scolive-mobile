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

jest.mock("../../src/api/timetable.api");
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(() => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  })),
}));

// ── Mocks ──────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-04-14"; // Tuesday

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-14T12:00:00Z"));
});
afterAll(() => jest.useRealTimers());

/** Default user: teacher with schoolName + referentClass */
const TEACHER_USER = {
  id: "u1",
  firstName: "Albert",
  lastName: "Mvondo",
  platformRoles: [] as never[],
  memberships: [{ schoolId: "s1", role: "TEACHER" as const }],
  profileCompleted: true,
  role: "TEACHER" as const,
  activeRole: "TEACHER" as const,
  schoolName: "Collège Vogt",
  referentClass: { name: "6eC" },
};

/** Two sample occurrences for the teacher's own agenda — teacherUser.id matches TEACHER_USER.id */
const TEACHER_OCCS = [
  {
    id: "occ-ang-14",
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
  },
  {
    id: "occ-ang-15",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: "2026-04-15",
    weekday: 3,
    startMinute: 600,
    endMinute: 660,
    room: "B45",
    reason: null,
    subject: { id: "ang", name: "Anglais" },
    teacherUser: { id: "u1", firstName: "Albert", lastName: "Mvondo" },
  },
];

/** Two sample occurrences for class 6eC */
const CLASS_OCCS = [
  {
    id: "occ-cls-14",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: TODAY,
    weekday: 2,
    startMinute: 480,
    endMinute: 540,
    room: "A01",
    reason: null,
    subject: { id: "math", name: "Mathématiques" },
    teacherUser: { id: "t2", firstName: "Guy", lastName: "Ndem" },
  },
];

const STYLE_ANG = { subjectId: "ang", colorHex: "#11C5C6" };
const STYLE_MATH = { subjectId: "math", colorHex: "#3B82F6" };

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
      subjects: [{ id: "math", name: "Mathématiques" }],
    },
    {
      classId: "class-5eB",
      className: "5eB",
      schoolYearId: "sy1",
      schoolYearLabel: "2025-2026",
      studentCount: 30,
      subjects: [{ id: "ang", name: "Anglais" }],
    },
  ],
};

const mockLoadClassOptions = jest.fn();
const mockLoadClassTimetable = jest.fn();
const mockClearError = jest.fn();
const api = timetableApi as jest.Mocked<typeof timetableApi>;

// Contexte utilisé par TeacherOneOffCreatePanel quand il charge getClassContext
const CLASS_CTX_6EC = {
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

function makeClassTimetable(
  occs = CLASS_OCCS,
  styles = [STYLE_MATH],
  slots = [SLOT_STUB],
) {
  return {
    class: { id: "class-6eC", schoolYearId: "sy1", academicLevelId: null },
    slots,
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: occs,
    calendarEvents: [],
    subjectStyles: styles,
  };
}

function setupStores(overrides?: {
  classTimetable?: ReturnType<typeof makeClassTimetable> | null;
  classOptions?: typeof CLASS_OPTIONS | null;
}) {
  useAuthStore.setState({
    user: TEACHER_USER,
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });

  useTimetableStore.setState({
    myTimetable: null,
    classTimetable: overrides?.classTimetable ?? makeClassTimetable(),
    classOptions: overrides?.classOptions ?? CLASS_OPTIONS,
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
  // "Mon agenda" tab: loadClassOptions (store) + getClassTimetable (direct API)
  mockLoadClassOptions.mockResolvedValue(CLASS_OPTIONS);
  // Retourne les créneaux enseignant pour 6eC, vide pour les autres classes
  api.getClassTimetable.mockImplementation((_slug, classId) =>
    Promise.resolve(
      classId === "class-6eC"
        ? makeClassTimetable(TEACHER_OCCS, [STYLE_ANG])
        : makeClassTimetable([], []),
    ),
  );
  // "Mes classes" tab
  mockLoadClassTimetable.mockResolvedValue(makeClassTimetable());
  // Contexte de classe pour TeacherOneOffCreatePanel
  api.getClassContext.mockResolvedValue(CLASS_CTX_6EC);
  api.createOneOffSlot.mockResolvedValue(undefined as never);
  setupStores();
});

// ── Tests — Header & structure ─────────────────────────────────────────────

describe("TeacherAgendaScreen — header et structure", () => {
  it("affiche le ModuleHeader avec back, menu, titre et sous-titre école·classe", () => {
    render(<TeacherAgendaScreen />);

    expect(screen.getByTestId("teacher-agenda-header")).toBeTruthy();
    expect(screen.getByTestId("teacher-agenda-back")).toBeTruthy();
    expect(screen.getByTestId("teacher-agenda-menu")).toBeTruthy();
    expect(screen.getByTestId("module-header-title")).toBeTruthy();
    expect(screen.getByTestId("module-header-subtitle").props.children).toBe(
      "Collège Vogt · 6eC",
    );
  });

  it("le bouton retour appelle router.back()", () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas de sous-titre si l'enseignant n'a pas de schoolName", () => {
    useAuthStore.setState((s) => ({
      ...s,
      user: s.user
        ? { ...s.user, schoolName: null, referentClass: null }
        : null,
    }));
    render(<TeacherAgendaScreen />);
    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });

  it("affiche les deux onglets", () => {
    render(<TeacherAgendaScreen />);
    expect(screen.getByTestId("teacher-agenda-tab-mine")).toBeTruthy();
    expect(screen.getByTestId("teacher-agenda-tab-classes")).toBeTruthy();
  });

  it("l'onglet 'Mon agenda' est actif par défaut", () => {
    render(<TeacherAgendaScreen />);
    expect(screen.getByTestId("teacher-agenda-mine-pane")).toBeTruthy();
    expect(screen.queryByTestId("teacher-agenda-class-pane")).toBeNull();
  });

  it("switche vers l'onglet 'Mes classes'", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-picker")).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-agenda-mine-pane")).toBeNull();
  });

  it("revient sur 'Mon agenda' après un switch", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-picker")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-mine"));
    expect(screen.getByTestId("teacher-agenda-mine-pane")).toBeTruthy();
  });
});

// ── Tests — Onglet "Mon agenda" ────────────────────────────────────────────

describe("TeacherAgendaScreen — onglet Mon agenda", () => {
  it("appelle loadClassOptions + getClassTimetable pour agréger l'agenda", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(mockLoadClassOptions).toHaveBeenCalledWith("college-vogt"),
    );
    await waitFor(() =>
      expect(api.getClassTimetable).toHaveBeenCalledWith(
        "college-vogt",
        expect.any(String),
        expect.any(Object),
      ),
    );
  });

  it("affiche les créneaux du jour courant filtrés par teacherUser.id", async () => {
    render(<TeacherAgendaScreen />);
    // Attend que le chargement async se termine
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-mine-day-card-occ-ang-14"),
      ).toBeTruthy(),
    );
    expect(screen.getByText("08:45 - 10:00 · Anglais")).toBeTruthy();
    expect(screen.getByText(/Aujourd'hui/)).toBeTruthy();
  });

  it("n'affiche pas les créneaux d'un autre enseignant", async () => {
    // Occurrence avec un autre teacherUser — ne doit pas apparaître
    const otherTeacherOcc = {
      ...TEACHER_OCCS[0]!,
      id: "occ-other",
      teacherUser: { id: "other-teacher", firstName: "Guy", lastName: "Ndem" },
    };
    api.getClassTimetable.mockImplementation(() =>
      Promise.resolve(makeClassTimetable([otherTeacherOcc], [STYLE_ANG])),
    );
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-day-list")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-agenda-mine-day-card-occ-other"),
    ).toBeNull();
  });

  it("n'affiche pas les créneaux d'un autre jour en vue Jour", async () => {
    render(<TeacherAgendaScreen />);
    // occ-ang-14 est le 14 avril (today), occ-ang-15 est le 15 → pas affiché
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-day-list")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-agenda-mine-day-card-occ-ang-15"),
    ).toBeNull();
  });

  it("affiche un empty state si aucun cours le jour courant", async () => {
    // Seul occ-ang-15 (demain) → aucun créneau aujourd'hui
    api.getClassTimetable.mockImplementation(() =>
      Promise.resolve(makeClassTimetable([TEACHER_OCCS[1]!], [STYLE_ANG])),
    );
    render(<TeacherAgendaScreen />);
    await waitFor(() => expect(screen.getByText("Aucun cours")).toBeTruthy());
  });

  it("passe en vue Semaine", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-mode-week")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-mode-week"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-week-grid")).toBeTruthy(),
    );
  });

  it("passe en vue Mois", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-mode-month")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-mode-month"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-month-grid")).toBeTruthy(),
    );
  });

  it("passe au jour suivant via nav-next", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-nav-next")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-nav-next"));
    expect(screen.getByText(/15 avr/)).toBeTruthy();
  });

  it("passe au jour précédent via nav-prev (skip weekend)", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-nav-prev")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-nav-prev"));
    expect(screen.queryByText(/Aujourd'hui/)).toBeNull();
    expect(screen.getByTestId("teacher-agenda-mine-nav-label")).toBeTruthy();
  });

  it("le bouton label remet à aujourd'hui", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-nav-next")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-nav-next"));
    expect(screen.getByText(/15 avr/)).toBeTruthy();
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-nav-label"));
    expect(screen.getByText(/Aujourd'hui/)).toBeTruthy();
  });

  it("recharge le planning au pull-to-refresh", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() => expect(api.getClassTimetable).toHaveBeenCalled());
    jest.clearAllMocks();
    api.getClassTimetable.mockResolvedValue(
      makeClassTimetable(TEACHER_OCCS, [STYLE_ANG]),
    );
    fireEvent(screen.getByTestId("teacher-agenda-mine-pane"), "onRefresh");
    await waitFor(() => expect(mockLoadClassOptions).toHaveBeenCalledTimes(1));
  });

  it("affiche un bloc de chargement pendant le chargement initial", async () => {
    // Simule un délai infini pour voir le loading block
    api.getClassTimetable.mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByText("Chargement de l'agenda...")).toBeTruthy(),
    );
  });

  it("vue Semaine : contient la grille et la carte de détail", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-mode-week")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-mode-week"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-week-grid")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-agenda-mine-week-detail")).toBeTruthy();
  });

  it("vue Mois : contient la grille et l'agenda du jour sélectionné", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-mode-month")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-mode-month"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-month-grid")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-agenda-mine-month-agenda")).toBeTruthy();
  });
});

// ── Tests — Onglet "Mes classes" ───────────────────────────────────────────

describe("TeacherAgendaScreen — onglet Mes classes", () => {
  async function openClassTab() {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-picker")).toBeTruthy(),
    );
  }

  it("charge les options de classe au montage", async () => {
    await openClassTab();
    expect(mockLoadClassOptions).toHaveBeenCalledWith("college-vogt");
  });

  it("affiche un bouton pour chaque classe accessible", async () => {
    await openClassTab();
    expect(
      screen.getByTestId("teacher-agenda-class-btn-class-6eC"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teacher-agenda-class-btn-class-5eB"),
    ).toBeTruthy();
    expect(screen.getAllByText("6eC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5eB").length).toBeGreaterThan(0);
  });

  it("charge automatiquement l'agenda de la première classe", async () => {
    await openClassTab();
    await waitFor(() =>
      expect(mockLoadClassTimetable).toHaveBeenCalledWith(
        "college-vogt",
        "class-6eC",
        expect.any(Object),
      ),
    );
  });

  it("affiche les créneaux de la classe sélectionnée en vue Jour", async () => {
    await openClassTab();
    await waitFor(() =>
      expect(screen.getByText("08:00 - 09:00 · Mathématiques")).toBeTruthy(),
    );
  });

  it("change de classe et recharge le planning", async () => {
    await openClassTab();
    jest.clearAllMocks();
    fireEvent.press(screen.getByTestId("teacher-agenda-class-btn-class-5eB"));
    await waitFor(() =>
      expect(mockLoadClassTimetable).toHaveBeenCalledWith(
        "college-vogt",
        "class-5eB",
        expect.any(Object),
      ),
    );
  });

  it("passe en vue Semaine pour la classe", async () => {
    await openClassTab();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-mode-week")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-class-mode-week"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-week-grid")).toBeTruthy(),
    );
  });

  it("passe en vue Mois pour la classe", async () => {
    await openClassTab();
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-mode-month"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-class-mode-month"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-month-grid"),
      ).toBeTruthy(),
    );
  });

  it("navigation prev/next fonctionne pour la vue classe", async () => {
    await openClassTab();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-nav-next")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-class-nav-next"));
    expect(screen.getByText(/15 avr/)).toBeTruthy();
  });

  it("affiche un empty state si aucune classe n'est disponible", async () => {
    setupStores({ classOptions: { ...CLASS_OPTIONS, classes: [] } });
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(screen.getByText("Aucune classe accessible")).toBeTruthy(),
    );
  });
});

// ── Tests d'intégration ────────────────────────────────────────────────────

describe("TeacherAgendaScreen — intégration state & navigation", () => {
  it("chaque onglet démarre en vue Jour et les vues sont indépendantes", async () => {
    render(<TeacherAgendaScreen />);

    // Attendre que "Mon agenda" soit chargé
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-mode-week")).toBeTruthy(),
    );
    // Tab mine: passer en semaine
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-mode-week"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-week-grid")).toBeTruthy(),
    );

    // Switcher sur classes → commence en Jour (onglet indépendant)
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-picker")).toBeTruthy(),
    );
    // L'onglet classes commence en vue Jour
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-class-day-list")).toBeTruthy(),
    );

    // Passer classes en mois
    fireEvent.press(screen.getByTestId("teacher-agenda-class-mode-month"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-month-grid"),
      ).toBeTruthy(),
    );

    // Revenir sur mine → vue jour (state reset = comportement attendu)
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-mine"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-pane")).toBeTruthy(),
    );
    // Mine revient en jour (unmount/remount)
    expect(screen.getByTestId("teacher-agenda-mine-day-list")).toBeTruthy();
  });

  it("sélectionner un créneau semaine popule la carte de détail", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-mode-week")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-mode-week"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-mine-week-slot-occ-ang-14"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-agenda-mine-week-slot-occ-ang-14"),
    );
    // WeekDetailCard affiche le nom complet (texte imbriqué → regex)
    await waitFor(() => expect(screen.getByText(/Anglais/)).toBeTruthy());
    expect(screen.getByTestId("teacher-agenda-mine-week-detail")).toBeTruthy();
  });

  it("cliquer sur un jour dans la vue Mois filtre l'agenda du jour", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-mode-month")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-mode-month"));
    await waitFor(() =>
      expect(
        screen.getByTestId(`teacher-agenda-mine-month-day-${TODAY}`),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId(`teacher-agenda-mine-month-day-${TODAY}`),
    );
    await waitFor(() =>
      expect(screen.getByText("08:45 - 10:00 · Anglais")).toBeTruthy(),
    );
  });
});

// ── Tests — FAB de création ────────────────────────────────────────────────

describe("TeacherAgendaScreen — FAB de création", () => {
  it("affiche le FAB dans 'Mon agenda' quand des classes sont disponibles", async () => {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-fab-create")).toBeTruthy(),
    );
  });

  it("affiche le FAB dans 'Mes classes' quand des classes sont disponibles", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-fab-create"),
      ).toBeTruthy(),
    );
  });

  it("masque le FAB quand aucune classe n'est disponible", async () => {
    setupStores({ classOptions: { ...CLASS_OPTIONS, classes: [] } });
    mockLoadClassOptions.mockResolvedValue({ ...CLASS_OPTIONS, classes: [] });
    api.getClassTimetable.mockResolvedValue(makeClassTimetable([], []));
    render(<TeacherAgendaScreen />);
    // Attendre la fin du chargement
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-pane")).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-agenda-mine-fab-create")).toBeNull();
  });
});

// ── Tests — Modal de création ──────────────────────────────────────────────

describe("TeacherAgendaScreen — modal de création", () => {
  async function openCreateModal() {
    render(<TeacherAgendaScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("teacher-agenda-mine-fab-create")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-mine-fab-create"));
  }

  it("ouvrir le FAB affiche le panneau de création", async () => {
    await openCreateModal();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-create-panel")).toBeTruthy(),
    );
    expect(screen.getByText("Nouveau créneau")).toBeTruthy();
  });

  it("le bouton fermer dans le panneau ferme la modal", async () => {
    await openCreateModal();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-create-close")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-oneoff-create-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("teacher-oneoff-create-panel")).toBeNull(),
    );
  });

  it("dans 'Mon agenda' : le picker de classe est affiché (pas de classe pré-remplie)", async () => {
    await openCreateModal();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-create-panel")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-oneoff-class-class-6eC")).toBeTruthy();
    expect(screen.getByTestId("teacher-oneoff-class-class-5eB")).toBeTruthy();
  });

  it("dans 'Mes classes' : la classe sélectionnée est pré-remplie (pas de picker)", async () => {
    render(<TeacherAgendaScreen />);
    fireEvent.press(screen.getByTestId("teacher-agenda-tab-classes"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-agenda-class-fab-create"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-agenda-class-fab-create"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-create-panel")).toBeTruthy(),
    );
    // Pas de picker de classe (prefilledClassId fourni → masqué)
    expect(screen.queryByTestId("teacher-oneoff-class-class-6eC")).toBeNull();
    // Le contexte est chargé automatiquement
    await waitFor(() =>
      expect(api.getClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-6eC",
      ),
    );
  });

  it(
    "après une création réussie : la modal se ferme et le planning recharge",
    async () => {
    await openCreateModal();
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-class-class-6eC")).toBeTruthy(),
    );
    // Sélectionner la classe → charger le contexte
    fireEvent.press(screen.getByTestId("teacher-oneoff-class-class-6eC"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-oneoff-date-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-oneoff-date-input"),
      "2026-04-28",
    );
    jest.clearAllMocks();
    mockLoadClassOptions.mockResolvedValue(CLASS_OPTIONS);
    api.getClassTimetable.mockResolvedValue(
      makeClassTimetable(TEACHER_OCCS, [STYLE_ANG]),
    );
    api.createOneOffSlot.mockResolvedValue(undefined as never);

      fireEvent.press(screen.getByTestId("teacher-oneoff-create-save"));

      await waitFor(() => expect(api.createOneOffSlot).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.queryByTestId("teacher-oneoff-create-panel")).toBeNull(),
      );
      // Le planning est rechargé (loadClassOptions + getClassTimetable appelés)
      await waitFor(() => expect(mockLoadClassOptions).toHaveBeenCalled());
    },
    15000,
  );
});
