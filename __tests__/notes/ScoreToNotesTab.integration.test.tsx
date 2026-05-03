/**
 * Flux d'intégration : saisie de note → cohérence onglet Notes
 *
 * Vérifie que :
 * 1. Le trimestre est automatiquement déduit de la date planifiée de l'évaluation
 * 2. Après la saisie d'une note, scoresVersion s'incrémente dans le store
 * 3. StudentNotesPanel recharge les notes après un save (via scoresVersion)
 * 4. La note apparaît dans le bon trimestre et la bonne matière dans l'onglet Notes
 */

import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherClassNotesTab } from "../../src/components/notes/TeacherClassNotesTab";
import { useAuthStore } from "../../src/store/auth.store";
import { useNotesStore } from "../../src/store/notes.store";
import { getCurrentTerm } from "../../src/utils/notes";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ classId: "class-1", schoolYearId: "y1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEACHER_CONTEXT = {
  class: { id: "class-1", name: "6e A", schoolYearId: "y1" },
  subjects: [
    {
      id: "sub-math",
      name: "Mathématiques",
      branches: [{ id: "branch-1", name: "Algèbre" }],
    },
  ],
  evaluationTypes: [
    { id: "type-1", code: "COMP", label: "Composition", isDefault: true },
  ],
  students: [
    { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
    { id: "stu-2", firstName: "Paul", lastName: "Abega" },
  ],
};

// Évaluation planifiée le 15 février 2026 → TERM_2 (janvier-mars)
const EVAL_TERM2 = {
  id: "eval-term2",
  title: "Compo Algèbre T2",
  description: null,
  coefficient: 2,
  maxScore: 20,
  term: "TERM_2" as const,
  status: "PUBLISHED" as const,
  scheduledAt: "2026-02-15T08:00:00.000Z",
  createdAt: "2026-02-01T08:00:00.000Z",
  updatedAt: "2026-02-01T08:00:00.000Z",
  subject: { id: "sub-math", name: "Mathématiques" },
  subjectBranch: { id: "branch-1", name: "Algèbre" },
  evaluationType: { id: "type-1", code: "COMP", label: "Composition" },
  attachments: [],
  _count: { scores: 0 },
};

// Détail de l'évaluation : Lisa n'a pas encore de note
const EVAL_DETAIL_BEFORE = {
  ...EVAL_TERM2,
  students: [
    {
      id: "stu-1",
      firstName: "Lisa",
      lastName: "Ntamack",
      score: null,
      scoreStatus: "NOT_GRADED" as const,
      comment: null,
    },
    {
      id: "stu-2",
      firstName: "Paul",
      lastName: "Abega",
      score: null,
      scoreStatus: "NOT_GRADED" as const,
      comment: null,
    },
  ],
};

// Après saisie de la note de Lisa : 17/20
const EVAL_DETAIL_AFTER = {
  ...EVAL_TERM2,
  _count: { scores: 1 },
  students: [
    {
      id: "stu-1",
      firstName: "Lisa",
      lastName: "Ntamack",
      score: 17,
      scoreStatus: "ENTERED" as const,
      comment: null,
    },
    {
      id: "stu-2",
      firstName: "Paul",
      lastName: "Abega",
      score: null,
      scoreStatus: "NOT_GRADED" as const,
      comment: null,
    },
  ],
};

// Snapshot TERM_2 pour Lisa avec la note saisie
const STUDENT_NOTES_TERM2 = [
  {
    term: "TERM_2" as const,
    label: "Trimestre 2",
    councilLabel: "6e A • Trimestre 2",
    generatedAtLabel: "Données au 15/02/2026",
    generalAverage: { student: 17, class: 14, min: 10, max: 19 },
    subjects: [
      {
        id: "sub-math",
        subjectLabel: "Mathématiques",
        teachers: ["Prof. Dupont"],
        coefficient: 2,
        studentAverage: 17,
        classAverage: 14,
        classMin: 10,
        classMax: 19,
        appreciation: null,
        evaluations: [
          {
            id: "eval-term2",
            label: "Compo Algèbre T2",
            score: 17,
            maxScore: 20,
            weight: 2,
            recordedAt: "15/02/2026",
            status: "ENTERED" as const,
          },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setupAuth() {
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "u1",
      firstName: "Valery",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "TEACHER" }],
      profileCompleted: true,
      role: "TEACHER",
      activeRole: "TEACHER",
    },
  } as never);
}

// ─── Tests cohérence trimestre ────────────────────────────────────────────────

describe("Cohérence trimestre automatique à la création", () => {
  it("date 15 février → TERM_2 (janvier–mars)", () => {
    expect(getCurrentTerm(new Date("2026-02-15"))).toBe("TERM_2");
  });

  it("date 10 octobre → TERM_1 (septembre–décembre)", () => {
    expect(getCurrentTerm(new Date("2026-10-10"))).toBe("TERM_1");
  });

  it("date 5 juin → TERM_3 (avril–août)", () => {
    expect(getCurrentTerm(new Date("2026-06-05"))).toBe("TERM_3");
  });

  it("l'évaluation EVAL_TERM2 porte bien le term TERM_2 déduit de sa date", () => {
    const scheduledDate = EVAL_TERM2.scheduledAt.slice(0, 10); // "2026-02-15"
    const [year, month] = scheduledDate.split("-").map(Number);
    const d = new Date(year, month - 1, 1);
    expect(getCurrentTerm(d)).toBe("TERM_2");
    expect(EVAL_TERM2.term).toBe("TERM_2");
  });
});

// ─── Tests scoresVersion ──────────────────────────────────────────────────────

describe("scoresVersion — synchronisation store après save", () => {
  beforeEach(() => {
    setupAuth();
    useNotesStore.setState({
      teacherContext: TEACHER_CONTEXT,
      evaluations: [EVAL_TERM2],
      evaluationDetails: { "eval-term2": EVAL_DETAIL_BEFORE },
      scoresVersion: 0,
      studentNotes: {},
      termReports: { TERM_1: null, TERM_2: null, TERM_3: null },
      isLoadingTeacherContext: false,
      isLoadingEvaluations: false,
      isLoadingEvaluationDetail: false,
      isLoadingTermReports: false,
      isSubmitting: false,
      errorMessage: null,
      loadTeacherContext: jest.fn().mockResolvedValue(TEACHER_CONTEXT),
      loadEvaluations: jest.fn().mockResolvedValue([EVAL_TERM2]),
      loadEvaluationDetail: jest
        .fn()
        .mockImplementation((_slug, _classId, evalId) => {
          useNotesStore.setState((s) => ({
            evaluationDetails: {
              ...s.evaluationDetails,
              [evalId]: EVAL_DETAIL_AFTER,
            },
          }));
          return Promise.resolve(EVAL_DETAIL_AFTER);
        }),
      loadStudentNotes: jest.fn().mockImplementation((_slug, studentId) => {
        useNotesStore.setState((s) => ({
          studentNotes: { ...s.studentNotes, [studentId]: STUDENT_NOTES_TERM2 },
        }));
        return Promise.resolve(STUDENT_NOTES_TERM2);
      }),
      saveScores: jest
        .fn()
        .mockImplementation((_slug, _classId, evaluationId) => {
          // Simule le comportement du vrai store : update detail + incrémente version
          useNotesStore.setState((s) => ({
            evaluationDetails: {
              ...s.evaluationDetails,
              [evaluationId]: EVAL_DETAIL_AFTER,
            },
            scoresVersion: s.scoresVersion + 1,
          }));
          return Promise.resolve(EVAL_DETAIL_AFTER);
        }),
      loadTermReports: jest.fn().mockResolvedValue([]),
      saveTermReports: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
    } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("scoresVersion est 0 au départ", () => {
    expect(useNotesStore.getState().scoresVersion).toBe(0);
  });

  it("scoresVersion s'incrémente à 1 après un saveScores réussi", async () => {
    await act(async () => {
      await useNotesStore
        .getState()
        .saveScores("college-vogt", "class-1", "eval-term2", {
          scores: [
            { studentId: "stu-1", score: 17, status: "ENTERED", comment: null },
          ],
        });
    });
    expect(useNotesStore.getState().scoresVersion).toBe(1);
  });

  it("saveScores met à jour evaluationDetails avec la note de l'élève", async () => {
    await act(async () => {
      await useNotesStore
        .getState()
        .saveScores("college-vogt", "class-1", "eval-term2", {
          scores: [
            { studentId: "stu-1", score: 17, status: "ENTERED", comment: null },
          ],
        });
    });
    const detail = useNotesStore.getState().evaluationDetails["eval-term2"];
    const lisa = detail?.students.find((s) => s.id === "stu-1");
    expect(lisa?.score).toBe(17);
    expect(lisa?.scoreStatus).toBe("ENTERED");
  });
});

// ─── Tests StudentNotesPanel recharge après scoresVersion ─────────────────────

describe("StudentNotesPanel — rechargement après save", () => {
  let loadStudentNotesMock: jest.Mock;

  beforeEach(() => {
    setupAuth();
    loadStudentNotesMock = jest.fn().mockImplementation((_slug, studentId) => {
      useNotesStore.setState((s) => ({
        studentNotes: { ...s.studentNotes, [studentId]: STUDENT_NOTES_TERM2 },
      }));
      return Promise.resolve(STUDENT_NOTES_TERM2);
    });

    useNotesStore.setState({
      studentNotes: {},
      scoresVersion: 0,
      isLoadingStudentNotes: false,
      errorMessage: null,
      loadStudentNotes: loadStudentNotesMock,
      clearError: jest.fn(),
    } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("appelle loadStudentNotes une première fois au mount", async () => {
    render(
      <TeacherClassNotesTab
        teacherContext={TEACHER_CONTEXT}
        schoolSlug="college-vogt"
        bottomInset={0}
      />,
    );
    await flushAsync();
    expect(loadStudentNotesMock).toHaveBeenCalledWith(
      "college-vogt",
      "stu-2", // premier alphabétiquement : Abega Paul
    );
  });

  it("rappelle loadStudentNotes quand scoresVersion s'incrémente", async () => {
    render(
      <TeacherClassNotesTab
        teacherContext={TEACHER_CONTEXT}
        schoolSlug="college-vogt"
        bottomInset={0}
      />,
    );
    await flushAsync();
    const callsBefore = loadStudentNotesMock.mock.calls.length;

    // Simule un save de note qui incrémente scoresVersion
    await act(async () => {
      useNotesStore.setState((s) => ({
        scoresVersion: s.scoresVersion + 1,
      }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(loadStudentNotesMock.mock.calls.length).toBeGreaterThan(
        callsBefore,
      ),
    );
  });
});

// ─── Tests flux complet : note saisie → visible dans onglet Notes ─────────────

describe("Flux complet : saisie note → onglet Notes au bon trimestre", () => {
  beforeEach(() => {
    setupAuth();
    useNotesStore.setState({
      teacherContext: TEACHER_CONTEXT,
      evaluations: [EVAL_TERM2],
      evaluationDetails: { "eval-term2": EVAL_DETAIL_AFTER },
      scoresVersion: 1, // simule un save déjà effectué
      studentNotes: {
        "stu-1": STUDENT_NOTES_TERM2,
        "stu-2": [],
      },
      termReports: { TERM_1: null, TERM_2: null, TERM_3: null },
      isLoadingTeacherContext: false,
      isLoadingEvaluations: false,
      isLoadingEvaluationDetail: false,
      isLoadingTermReports: false,
      isLoadingStudentNotes: false,
      isSubmitting: false,
      errorMessage: null,
      loadTeacherContext: jest.fn().mockResolvedValue(TEACHER_CONTEXT),
      loadEvaluations: jest.fn().mockResolvedValue([EVAL_TERM2]),
      loadEvaluationDetail: jest.fn().mockResolvedValue(EVAL_DETAIL_AFTER),
      loadStudentNotes: jest.fn().mockImplementation((_slug, studentId) => {
        const notes = studentId === "stu-1" ? STUDENT_NOTES_TERM2 : [];
        useNotesStore.setState((s) => ({
          studentNotes: { ...s.studentNotes, [studentId]: notes },
        }));
        return Promise.resolve(notes);
      }),
      saveScores: jest.fn().mockResolvedValue(EVAL_DETAIL_AFTER),
      loadTermReports: jest.fn().mockResolvedValue([]),
      saveTermReports: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
    } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("l'onglet Notes affiche la fiche d'évaluation de Lisa en TERM_2", async () => {
    render(
      <TeacherClassNotesTab
        teacherContext={TEACHER_CONTEXT}
        schoolSlug="college-vogt"
        bottomInset={0}
      />,
    );
    await flushAsync();

    // Sélectionne Lisa Ntamack dans le picker
    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-picker-student-stu-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-notes-picker-student-stu-1"));
    await flushAsync();

    // Le sélecteur de période affiche TERM_2
    await waitFor(() =>
      expect(screen.getByTestId("child-notes-term-TERM_2")).toBeTruthy(),
    );

    // La card d'évaluation de l'eval-term2 est visible
    await waitFor(() =>
      expect(
        screen.getByTestId("child-notes-evaluation-eval-term2"),
      ).toBeTruthy(),
    );

    // Le score 17 s'affiche
    await waitFor(() =>
      expect(screen.getByTestId("score-value-eval-term2")).toHaveTextContent(
        "17",
      ),
    );
  });

  it("filtre par matière Mathématiques : seule la matière et son éval s'affichent", async () => {
    render(
      <TeacherClassNotesTab
        teacherContext={TEACHER_CONTEXT}
        schoolSlug="college-vogt"
        bottomInset={0}
      />,
    );
    await flushAsync();

    // Sélectionne Lisa
    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-picker-student-stu-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-notes-picker-student-stu-1"));
    await flushAsync();

    // Filtre par Mathématiques
    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-subject-picker-option-sub-math"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-notes-subject-picker-option-sub-math"),
    );
    await flushAsync();

    // La row de la matière Mathématiques est visible
    await waitFor(() =>
      expect(
        screen.getByTestId("child-notes-subject-row-sub-math"),
      ).toBeTruthy(),
    );
    // La card de l'évaluation est présente
    await waitFor(() =>
      expect(
        screen.getByTestId("child-notes-evaluation-eval-term2"),
      ).toBeTruthy(),
    );
    // Le score est 17
    await waitFor(() =>
      expect(screen.getByTestId("score-value-eval-term2")).toHaveTextContent(
        "17",
      ),
    );
  });

  it("la note 17 n'est pas visible quand TERM_1 est sélectionné (snapshot vide)", async () => {
    // Pour ce test : loadStudentNotes retourne TERM_1 vide + TERM_2 avec la note
    const term1Empty = {
      term: "TERM_1" as const,
      label: "Trimestre 1",
      councilLabel: "",
      generatedAtLabel: "",
      generalAverage: { student: null, class: null, min: null, max: null },
      subjects: [],
    };
    const notesWithTwoTerms = [term1Empty, ...STUDENT_NOTES_TERM2];

    useNotesStore.setState({
      loadStudentNotes: jest.fn().mockImplementation((_slug, studentId) => {
        const notes = studentId === "stu-1" ? notesWithTwoTerms : [];
        useNotesStore.setState((s) => ({
          studentNotes: { ...s.studentNotes, [studentId]: notes },
        }));
        return Promise.resolve(notes);
      }),
    } as never);

    render(
      <TeacherClassNotesTab
        teacherContext={TEACHER_CONTEXT}
        schoolSlug="college-vogt"
        bottomInset={0}
      />,
    );
    await flushAsync();

    // Sélectionne Lisa
    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-picker-student-stu-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-notes-picker-student-stu-1"));
    await flushAsync();

    // Les deux trimestres sont affichés dans le sélecteur
    await waitFor(() =>
      expect(screen.getByTestId("child-notes-term-TERM_1")).toBeTruthy(),
    );
    expect(screen.getByTestId("child-notes-term-TERM_2")).toBeTruthy();

    // Passe sur TERM_1
    fireEvent.press(screen.getByTestId("child-notes-term-TERM_1"));
    await flushAsync();

    // L'évaluation du T2 ne doit PAS être visible dans T1
    expect(
      screen.queryByTestId("child-notes-evaluation-eval-term2"),
    ).toBeNull();
  });
});
