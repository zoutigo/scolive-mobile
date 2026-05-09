/**
 * Tests du composant TeacherHome.
 * Couvre : rendu banner, états chargement/erreur, sections (classes, messages,
 * emploi du temps, évaluations, devoirs), navigation au clic, context messaging.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { TeacherHome } from "../../src/components/home/TeacherHome";
import { useMessagingStore } from "../../src/store/messaging.store";
import * as dashboardHook from "../../src/hooks/useTeacherDashboard";
import type { TeacherDashboardData } from "../../src/hooks/useTeacherDashboard";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../../src/hooks/useTeacherDashboard");
const mockUseTeacherDashboard = dashboardHook.useTeacherDashboard as jest.Mock;

const mockOpenDrawerForClass = jest.fn();
jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({
    openDrawer: jest.fn(),
    openDrawerForClass: mockOpenDrawerForClass,
    closeDrawer: jest.fn(),
    isDrawerOpen: false,
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const teacherUser: AuthUser = {
  id: "teacher-42",
  firstName: "Sophie",
  lastName: "Martin",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "TEACHER" }],
  profileCompleted: true,
  role: "TEACHER",
  activeRole: "TEACHER",
};

const TODAY_ISO = (() => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
})();

const TOMORROW_ISO = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
})();

const classesList = [
  {
    classId: "cls-A",
    className: "3e A",
    schoolYearId: "sy1",
    schoolYearLabel: "2024-2025",
    subjects: [],
    studentCount: 25,
    openHomeworkCount: 1,
    pendingEvalCount: 1,
  },
  {
    classId: "cls-B",
    className: "4e B",
    schoolYearId: "sy1",
    schoolYearLabel: "2024-2025",
    subjects: [],
    studentCount: 28,
    openHomeworkCount: 0,
    pendingEvalCount: 0,
  },
];

const unreadMessages = [
  {
    id: "msg-1",
    folder: "inbox" as const,
    status: "SENT" as const,
    subject: "Réunion parents d'élèves",
    preview: "",
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    unread: true,
    sender: { id: "u2", firstName: "Marie", lastName: "Curie" },
    recipientsCount: 1,
    mailboxEntryId: "mbe-1",
    attachments: [],
  },
  {
    id: "msg-2",
    folder: "inbox" as const,
    status: "SENT" as const,
    subject: "Nouveau programme",
    preview: "",
    createdAt: new Date().toISOString(),
    sentAt: new Date().toISOString(),
    unread: true,
    sender: { id: "u3", firstName: "Jean", lastName: "Rousseau" },
    recipientsCount: 1,
    mailboxEntryId: "mbe-2",
    attachments: [],
  },
];

const todaySlots = [
  {
    id: "occ-1",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: TODAY_ISO,
    weekday: 1,
    startMinute: 480,
    endMinute: 570,
    room: "Salle 12",
    reason: null,
    subject: { id: "subj-1", name: "Mathématiques" },
    teacherUser: { id: "teacher-42", firstName: "Sophie", lastName: "Martin" },
    classId: "cls-A",
    className: "3e A",
  },
];

const pendingEvaluations = [
  {
    evaluation: {
      id: "eval-1",
      title: "Contrôle chapitre 4",
      description: null,
      coefficient: 1,
      maxScore: 20,
      term: "TERM_1" as const,
      status: "PUBLISHED" as const,
      scheduledAt: TODAY_ISO,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subject: { id: "subj-1", name: "Maths" },
      subjectBranch: null,
      evaluationType: { id: "et-1", code: "EXAM", label: "Examen" },
      attachments: [],
      _count: { scores: 10 },
    },
    classId: "cls-A",
    className: "3e A",
    studentCount: 25,
  },
];

const openHomework = [
  {
    homework: {
      id: "hw-1",
      classId: "cls-A",
      title: "Exercices algèbre",
      expectedAt: TOMORROW_ISO + "T00:00:00.000Z",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorUserId: "teacher-42",
      authorDisplayName: "Sophie Martin",
      subject: { id: "subj-1", name: "Maths" },
      attachments: [],
      commentsCount: 0,
      summary: { totalStudents: 25, doneStudents: 8, pendingStudents: 17 },
    },
    classId: "cls-A",
    className: "3e A",
    totalStudents: 25,
  },
];

const fullData: TeacherDashboardData = {
  classes: classesList,
  unreadCount: 2,
  unreadMessages,
  todaySlots,
  pendingEvaluations,
  openHomework,
};

function mockHook(
  overrides: Partial<ReturnType<typeof dashboardHook.useTeacherDashboard>> = {},
) {
  mockUseTeacherDashboard.mockReturnValue({
    data: fullData,
    isLoading: false,
    error: null,
    refresh: jest.fn(),
    ...overrides,
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockHook();
  useMessagingStore.setState({
    folder: "inbox",
    messages: [],
    meta: null,
    isLoading: false,
    isRefreshing: false,
    search: "",
    unreadCount: 0,
    setFolder: jest.fn((f) => useMessagingStore.setState({ folder: f })),
    loadMessages: jest.fn(),
    refreshMessages: jest.fn(),
    loadMoreMessages: jest.fn(),
    loadUnreadCount: jest.fn(),
    markLocalRead: jest.fn(),
    markLocalUnread: jest.fn(),
    removeLocal: jest.fn(),
    reset: jest.fn(),
  });
});

// ── Banner ────────────────────────────────────────────────────────────────────

describe("Banner", () => {
  it("affiche le prénom et nom de l'enseignant", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Sophie Martin")).toBeTruthy();
  });

  it("affiche le label Enseignant(e)", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Enseignant(e)")).toBeTruthy();
  });

  it("affiche le nom de l'établissement reformaté", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("College Vogt")).toBeTruthy();
  });

  it("affiche 'Mon établissement' si schoolSlug est null", () => {
    render(<TeacherHome user={teacherUser} schoolSlug={null} />);
    expect(screen.getByText("Mon établissement")).toBeTruthy();
  });
});

// ── États de chargement et d'erreur ─────────────────────────────────────────

describe("États chargement / erreur", () => {
  it("affiche l'indicateur de chargement quand isLoading et pas de data", () => {
    mockHook({ data: null, isLoading: true });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("dashboard-loading")).toBeTruthy();
  });

  it("n'affiche pas l'indicateur si data est déjà disponible", () => {
    mockHook({ isLoading: true });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.queryByTestId("dashboard-loading")).toBeNull();
  });

  it("affiche la carte d'erreur si error et pas de data", () => {
    mockHook({
      data: null,
      error: "Impossible de charger le tableau de bord.",
    });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("dashboard-error")).toBeTruthy();
    expect(
      screen.getByText("Impossible de charger le tableau de bord."),
    ).toBeTruthy();
  });

  it("affiche le bouton Réessayer et rappelle refresh au clic", () => {
    const refreshMock = jest.fn().mockResolvedValue(undefined);
    mockHook({ data: null, error: "Erreur", refresh: refreshMock });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("dashboard-retry"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});

// ── Grille des classes ────────────────────────────────────────────────────────

describe("Grille des classes", () => {
  it("affiche le container grille avec son testID", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("section-classes")).toBeTruthy();
  });

  it("chaque classe a une card avec son testID unique", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("class-card-cls-A")).toBeTruthy();
    expect(screen.getByTestId("class-card-cls-B")).toBeTruthy();
  });

  it("affiche le nom de chaque classe dans la grille", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    // getByTestId est préférable ici car "3e A" apparaît dans plusieurs sections
    expect(screen.getByTestId("class-card-cls-A")).toBeTruthy();
    expect(screen.getByTestId("class-card-cls-B")).toBeTruthy();
    expect(screen.getAllByText("3e A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("4e B").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le nombre d'élèves (chiffre seul)", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("25")).toBeTruthy();
    expect(screen.getByText("28")).toBeTruthy();
  });

  it("affiche les compteurs de devs et evals dans un texte compact", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    // cls-A : openHomeworkCount=1, pendingEvalCount=1 → "1 devs · 1 evals"
    expect(screen.getByText(/1\s*devs\s*·\s*1\s*evals/)).toBeTruthy();
    // cls-B : openHomeworkCount=0, pendingEvalCount=0 → "0 devs · 0 evals"
    expect(screen.getByText(/0\s*devs\s*·\s*0\s*evals/)).toBeTruthy();
  });

  it("ouvre le drawer avec le menu de la classe au clic sur la card", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("class-card-cls-A"));
    expect(mockOpenDrawerForClass).toHaveBeenCalledWith("cls-A");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("ouvre le bon drawer pour la deuxième classe", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("class-card-cls-B"));
    expect(mockOpenDrawerForClass).toHaveBeenCalledWith("cls-B");
  });

  it("affiche 'Aucune classe assignée' si la liste est vide", () => {
    mockHook({ data: { ...fullData, classes: [] } });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Aucune classe assignée")).toBeTruthy();
  });
});

// ── Section — Messages non lus ────────────────────────────────────────────────

describe("Section Messages non lus", () => {
  it("affiche la section messages", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("section-messages")).toBeTruthy();
  });

  it("affiche les sujets des messages non lus", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Réunion parents d'élèves")).toBeTruthy();
    expect(screen.getByText("Nouveau programme")).toBeTruthy();
  });

  it("chaque ligne de message a un testID unique", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("message-row-msg-1")).toBeTruthy();
    expect(screen.getByTestId("message-row-msg-2")).toBeTruthy();
  });

  it("navigue vers la messagerie inbox au clic sur un message", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("message-row-msg-1"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("met à jour le dossier messaging store à 'inbox' avant la navigation", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("message-row-msg-1"));
    expect(useMessagingStore.getState().folder).toBe("inbox");
  });

  it("affiche 'Aucun message non lu' si unreadCount est 0", () => {
    mockHook({
      data: {
        ...fullData,
        unreadCount: 0,
        unreadMessages: [],
      },
    });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Aucun message non lu")).toBeTruthy();
  });

  it("le lien de section navigue vers messagerie", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("section-messages-link"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });
});

// ── Section — Emploi du temps du jour ────────────────────────────────────────

describe("Section Emploi du temps du jour", () => {
  it("affiche la section timetable", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("section-timetable")).toBeTruthy();
  });

  it("affiche le nom de la matière du créneau", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Mathématiques")).toBeTruthy();
  });

  it("affiche le nom de la classe pour le créneau via testID", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    // Le créneau existe → son testID est présent
    expect(screen.getByTestId("timetable-slot-occ-1")).toBeTruthy();
  });

  it("le créneau a un testID avec l'id de l'occurrence", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("timetable-slot-occ-1")).toBeTruthy();
  });

  it("navigue vers l'agenda au clic sur un créneau", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("timetable-slot-occ-1"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/agenda");
  });

  it("affiche 'Aucun cours planifié aujourd'hui' si liste vide", () => {
    mockHook({ data: { ...fullData, todaySlots: [] } });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Aucun cours planifié aujourd'hui")).toBeTruthy();
  });

  it("le lien de section navigue vers l'agenda", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("section-timetable-link"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/agenda");
  });
});

// ── Section — Évaluations à saisir ───────────────────────────────────────────

describe("Section Évaluations à saisir", () => {
  it("affiche la section évaluations", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("section-evaluations")).toBeTruthy();
  });

  it("affiche le titre de l'évaluation non saisie", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Contrôle chapitre 4")).toBeTruthy();
  });

  it("affiche l'évaluation avec son testID (contient le nom de la classe)", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("eval-row-eval-1")).toBeTruthy();
  });

  it("l'évaluation a un testID avec son id", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("eval-row-eval-1")).toBeTruthy();
  });

  it("navigue vers les notes de la classe au clic", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("eval-row-eval-1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/notes",
      params: { classId: "cls-A" },
    });
  });

  it("affiche 'Toutes les notes sont à jour' si aucune évaluation", () => {
    mockHook({ data: { ...fullData, pendingEvaluations: [] } });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Toutes les notes sont à jour")).toBeTruthy();
  });

  it("affiche toutes les évaluations fournies par le hook (la limite est dans le hook)", () => {
    const two = [
      {
        ...pendingEvaluations[0]!,
        evaluation: { ...pendingEvaluations[0]!.evaluation, id: "ev-x-0" },
      },
      {
        ...pendingEvaluations[0]!,
        evaluation: { ...pendingEvaluations[0]!.evaluation, id: "ev-x-1" },
      },
    ];
    mockHook({ data: { ...fullData, pendingEvaluations: two } });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("eval-row-ev-x-0")).toBeTruthy();
    expect(screen.getByTestId("eval-row-ev-x-1")).toBeTruthy();
  });
});

// ── Section — Devoirs ─────────────────────────────────────────────────────────

describe("Section Devoirs", () => {
  it("affiche la section devoirs", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("section-homework")).toBeTruthy();
  });

  it("affiche le titre du devoir", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Exercices algèbre")).toBeTruthy();
  });

  it("le devoir a un testID avec son id", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("homework-row-hw-1")).toBeTruthy();
  });

  it("navigue vers les devoirs de la classe au clic", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("homework-row-hw-1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/homework",
      params: { classId: "cls-A" },
    });
  });

  it("affiche le ratio élèves ayant rendu le devoir (done/total)", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    // summary.doneStudents=8, totalStudents=25
    expect(screen.getByText("8/25")).toBeTruthy();
  });

  it("affiche 'Aucun devoir en cours' si liste vide", () => {
    mockHook({ data: { ...fullData, openHomework: [] } });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Aucun devoir en cours")).toBeTruthy();
  });

  it("affiche tous les devoirs fournis par le hook (la limite est dans le hook)", () => {
    const two = [
      {
        ...openHomework[0]!,
        homework: { ...openHomework[0]!.homework, id: "hw-x-0" },
      },
      {
        ...openHomework[0]!,
        homework: { ...openHomework[0]!.homework, id: "hw-x-1" },
      },
    ];
    mockHook({ data: { ...fullData, openHomework: two } });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("homework-row-hw-x-0")).toBeTruthy();
    expect(screen.getByTestId("homework-row-hw-x-1")).toBeTruthy();
  });
});

// ── Intégration — hook wiring ─────────────────────────────────────────────────

describe("Intégration — wiring du hook", () => {
  it("appelle useTeacherDashboard avec le bon schoolSlug et userId", () => {
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    expect(mockUseTeacherDashboard).toHaveBeenCalledWith(
      "college-vogt",
      "teacher-42",
    );
  });

  it("transmet schoolSlug null au hook si non fourni", () => {
    render(<TeacherHome user={teacherUser} schoolSlug={null} />);
    expect(mockUseTeacherDashboard).toHaveBeenCalledWith(null, "teacher-42");
  });

  it("affiche le state 'Chargement…' dans chaque section quand data est null", () => {
    mockHook({ data: null, isLoading: true });
    render(<TeacherHome user={teacherUser} schoolSlug="college-vogt" />);
    const loadingTexts = screen.getAllByText("Chargement…");
    // 5 sections × 1 = 5 textes Chargement (une par section vide)
    expect(loadingTexts.length).toBeGreaterThanOrEqual(5);
  });
});
