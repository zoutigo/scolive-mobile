import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { useNotesStore } from "../../src/store/notes.store";
import { useAuthStore } from "../../src/store/auth.store";
import { StudentNotesPanel } from "../../src/components/notes/ChildNotesScreen";
import type {
  StudentNotesTermSnapshot,
  StudentNotesSequenceSnapshot,
  StudentSubjectNotes,
} from "../../src/types/notes.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeSubject(
  overrides: Partial<StudentSubjectNotes> = {},
): StudentSubjectNotes {
  return {
    id: "subj-maths",
    subjectLabel: "Mathématiques",
    teachers: ["M. Dupont"],
    coefficient: 3,
    studentAverage: 14,
    classAverage: 12,
    classMin: 5,
    classMax: 19,
    appreciation: null,
    evaluations: [],
    ...overrides,
  };
}

function makeSequenceSnapshot(
  sequence: StudentNotesSequenceSnapshot["sequence"],
  subjects: StudentSubjectNotes[],
): StudentNotesSequenceSnapshot {
  return {
    sequence,
    sequenceLabel: `Séquence ${sequence.slice(-1)}`,
    isFirstSeq:
      sequence === "SEQ_1" || sequence === "SEQ_3" || sequence === "SEQ_5",
    generalAverage: { student: 13, class: 12, min: 6, max: 18 },
    subjects,
  };
}

function makeTermSnapshot(
  term: StudentNotesTermSnapshot["term"],
  sequences: StudentNotesSequenceSnapshot[],
): StudentNotesTermSnapshot {
  const allSubjects = sequences.flatMap((s) => s.subjects);
  return {
    term,
    label: `Trimestre ${term.slice(-1)}`,
    councilLabel: "6e A • Conseil du 10/05/2026",
    generatedAtLabel: "Publié le 10/05/2026",
    generalAverage: { student: 13.5, class: 12, min: 6, max: 18 },
    sequences,
    subjects: allSubjects,
  };
}

const PANEL_PROPS = {
  studentId: "student-1",
  schoolSlug: "college-vogt",
};

function setupPanel(snapshots: StudentNotesTermSnapshot[]) {
  useAuthStore.setState({ schoolSlug: "college-vogt" } as never);
  useNotesStore.setState({
    studentNotes: { "student-1": snapshots },
    isLoadingStudentNotes: false,
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    scoresVersion: 0,
  } as never);
}

// ─── EvaluationsView — sans séquences (fallback) ─────────────────────────────

describe("EvaluationsView — sans séquences (fallback)", () => {
  it("affiche les matières directement quand sequences est vide", async () => {
    const subj = makeSubject({ id: "maths", subjectLabel: "Mathématiques" });
    const snapshot = makeTermSnapshot("TERM_1", []);
    snapshot.subjects = [subj];
    setupPanel([snapshot]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-subject-row-maths")).toBeTruthy();
    });
  });

  it("n'affiche pas le sélecteur de séquence quand sequences est vide", async () => {
    const snapshot = makeTermSnapshot("TERM_1", []);
    snapshot.subjects = [makeSubject()];
    setupPanel([snapshot]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.queryByTestId("child-notes-sequence-SEQ_1")).toBeNull();
    });
  });
});

// ─── EvaluationsView — avec une seule séquence ───────────────────────────────

describe("EvaluationsView — avec une seule séquence", () => {
  it("n'affiche pas le sélecteur de séquence quand il y en a une seule", async () => {
    const subj = makeSubject({ id: "maths" });
    const snapshot = makeTermSnapshot("TERM_1", [
      makeSequenceSnapshot("SEQ_1", [subj]),
    ]);
    setupPanel([snapshot]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.queryByTestId("child-notes-sequence-SEQ_1")).toBeNull();
    });
  });

  it("affiche les matières de la séquence unique", async () => {
    const subj = makeSubject({ id: "chimie", subjectLabel: "Chimie" });
    const snapshot = makeTermSnapshot("TERM_1", [
      makeSequenceSnapshot("SEQ_1", [subj]),
    ]);
    setupPanel([snapshot]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-subject-row-chimie")).toBeTruthy();
    });
  });
});

// ─── EvaluationsView — avec deux séquences ───────────────────────────────────

describe("EvaluationsView — avec plusieurs séquences", () => {
  function makeMultiSeqSnapshot() {
    const mathsSeq1 = makeSubject({
      id: "maths",
      subjectLabel: "Mathématiques",
      evaluations: [
        {
          id: "eval-1",
          label: "Interro 1",
          score: 14,
          maxScore: 20,
          recordedAt: "12/01/2026",
          status: "ENTERED",
        },
      ],
    });
    const mathsSeq2 = makeSubject({
      id: "maths",
      subjectLabel: "Mathématiques",
      studentAverage: 16,
      evaluations: [
        {
          id: "eval-2",
          label: "Interro 2",
          score: 16,
          maxScore: 20,
          recordedAt: "20/02/2026",
          status: "ENTERED",
        },
      ],
    });
    return makeTermSnapshot("TERM_1", [
      makeSequenceSnapshot("SEQ_1", [mathsSeq1]),
      makeSequenceSnapshot("SEQ_2", [mathsSeq2]),
    ]);
  }

  it("affiche le sélecteur de séquence quand il y en a plusieurs", async () => {
    setupPanel([makeMultiSeqSnapshot()]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-sequence-SEQ_1")).toBeTruthy();
      expect(screen.getByTestId("child-notes-sequence-SEQ_2")).toBeTruthy();
    });
  });

  it("affiche les évaluations de SEQ_1 par défaut", async () => {
    setupPanel([makeMultiSeqSnapshot()]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-evaluation-eval-1")).toBeTruthy();
      expect(screen.queryByTestId("child-notes-evaluation-eval-2")).toBeNull();
    });
  });

  it("bascule sur les évaluations de SEQ_2 après sélection", async () => {
    setupPanel([makeMultiSeqSnapshot()]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-sequence-SEQ_2")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-notes-sequence-SEQ_2"));

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-evaluation-eval-2")).toBeTruthy();
      expect(screen.queryByTestId("child-notes-evaluation-eval-1")).toBeNull();
    });
  });

  it("réinitialise sur SEQ_1 quand le trimestre change", async () => {
    const seq1subj = makeSubject({
      id: "maths",
      evaluations: [
        {
          id: "eval-t1",
          label: "Interro T1",
          score: 14,
          maxScore: 20,
          recordedAt: "12/01/2026",
          status: "ENTERED",
        },
      ],
    });
    const seq3subj = makeSubject({
      id: "maths",
      evaluations: [
        {
          id: "eval-t2",
          label: "Interro T2",
          score: 12,
          maxScore: 20,
          recordedAt: "05/03/2026",
          status: "ENTERED",
        },
      ],
    });
    const snap1 = makeTermSnapshot("TERM_1", [
      makeSequenceSnapshot("SEQ_1", [seq1subj]),
      makeSequenceSnapshot("SEQ_2", [makeSubject({ id: "maths" })]),
    ]);
    const snap2 = makeTermSnapshot("TERM_2", [
      makeSequenceSnapshot("SEQ_3", [seq3subj]),
    ]);
    setupPanel([snap1, snap2]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    // On SEQ_1 by default
    await waitFor(() => {
      expect(screen.getByTestId("child-notes-evaluation-eval-t1")).toBeTruthy();
    });

    // Switch to SEQ_2
    fireEvent.press(screen.getByTestId("child-notes-sequence-SEQ_2"));

    // Switch term to TERM_2
    fireEvent.press(screen.getByTestId("child-notes-term-TERM_2"));

    // Should now show TERM_2's SEQ_3 (the first sequence of that term), not SEQ_2
    await waitFor(() => {
      expect(screen.getByTestId("child-notes-evaluation-eval-t2")).toBeTruthy();
    });
  });
});

// ─── ChartsView — données annuelles ──────────────────────────────────────────

describe("ChartsView — données annuelles", () => {
  it("n'affiche pas le badge ANNÉE SCOLAIRE en vue Eval", async () => {
    const snapshot = makeTermSnapshot("TERM_1", [
      makeSequenceSnapshot("SEQ_1", [makeSubject()]),
    ]);
    setupPanel([snapshot]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    await waitFor(() => {
      expect(screen.queryByText("ANNÉE SCOLAIRE")).toBeNull();
    });
  });

  it("affiche le badge ANNÉE SCOLAIRE en vue Graph", async () => {
    const snapshot = makeTermSnapshot("TERM_1", [
      makeSequenceSnapshot("SEQ_1", [
        makeSubject({ studentAverage: 14, classAverage: 12 }),
      ]),
    ]);
    setupPanel([snapshot]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    fireEvent.press(screen.getByTestId("child-notes-view-charts"));

    await waitFor(() => {
      expect(screen.getByText("ANNÉE SCOLAIRE")).toBeTruthy();
    });
  });

  it("affiche l'état vide Graph si aucune moyenne disponible", async () => {
    const snapshot = makeTermSnapshot("TERM_1", []);
    snapshot.subjects = [
      makeSubject({ studentAverage: null, classAverage: null }),
    ];
    setupPanel([snapshot]);

    render(<StudentNotesPanel {...PANEL_PROPS} />);

    fireEvent.press(screen.getByTestId("child-notes-view-charts"));

    await waitFor(() => {
      expect(screen.getByText("Graphiques indisponibles")).toBeTruthy();
    });
  });
});
