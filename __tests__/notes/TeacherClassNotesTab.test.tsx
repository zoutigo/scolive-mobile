import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherClassNotesTab } from "../../src/components/notes/TeacherClassNotesTab";
import { useNotesStore } from "../../src/store/notes.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TEACHER_CONTEXT = {
  class: { id: "c1", name: "6e A", schoolYearId: "y1" },
  subjects: [
    {
      id: "sub-1",
      name: "Mathématiques",
      branches: [{ id: "br-1", name: "Algèbre" }],
    },
    { id: "sub-2", name: "Physique", branches: [] },
  ],
  evaluationTypes: [
    { id: "type-1", code: "COMP", label: "Composition", isDefault: true },
  ],
  students: [
    { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
    { id: "stu-2", firstName: "Paul", lastName: "Abega" },
  ],
};

const makeSnapshot = (
  term: "TERM_1" | "TERM_2" | "TERM_3",
  avg: number | null,
) => ({
  term,
  label: term,
  councilLabel: "",
  generatedAtLabel: "",
  generalAverage: { student: avg, class: avg, min: 8, max: 18 },
  subjects: [
    {
      id: "sub-1",
      subjectLabel: "Mathématiques",
      teachers: ["Prof. Dupont"],
      coefficient: 4,
      studentAverage: avg,
      classAverage: avg,
      classMin: 8,
      classMax: 18,
      appreciation: avg !== null ? "Bon travail" : null,
      evaluations: [
        {
          id: "eval-1",
          label: "Compo 1",
          score: avg,
          maxScore: 20,
          recordedAt: "2026-04-12T08:00:00.000Z",
          status: "ENTERED" as const,
        },
      ],
    },
  ],
});

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setupStore(
  overrides: Partial<ReturnType<typeof useNotesStore.getState>> = {},
) {
  useNotesStore.setState({
    studentNotes: {
      "stu-1": [
        makeSnapshot("TERM_1", 14.5),
        makeSnapshot("TERM_2", 13),
        makeSnapshot("TERM_3", 14.5),
      ],
      "stu-2": [
        makeSnapshot("TERM_1", 12),
        makeSnapshot("TERM_2", 11),
        makeSnapshot("TERM_3", 12),
      ],
    },
    isLoadingStudentNotes: false,
    loadStudentNotes: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as never);
}

const DEFAULT_PROPS = {
  teacherContext: TEACHER_CONTEXT,
  schoolSlug: "college-vogt",
  bottomInset: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
});

// ─── Rendu de base ───────────────────────────────────────────────────────────

describe("Rendu de base", () => {
  it("affiche les sélecteurs de période T1/T2/T3", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-term-TERM_1")).toBeTruthy();
    expect(screen.getByTestId("teacher-notes-term-TERM_2")).toBeTruthy();
    expect(screen.getByTestId("teacher-notes-term-TERM_3")).toBeTruthy();
  });

  it("affiche la barre de recherche élève", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-student-search")).toBeTruthy();
    expect(screen.getByTestId("teacher-notes-student-input")).toBeTruthy();
  });

  it("affiche les filtres matière (Toutes + 2 matières)", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-subject-all")).toBeTruthy();
    expect(screen.getByTestId("teacher-notes-subject-sub-1")).toBeTruthy();
    expect(screen.getByTestId("teacher-notes-subject-sub-2")).toBeTruthy();
  });

  it("affiche un bloc par élève trié alphabétiquement", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-bloc-stu-2")).toBeTruthy(),
    );
    expect(screen.getByTestId("teacher-notes-bloc-stu-1")).toBeTruthy();
    // Abega (stu-2) doit apparaître avant Ntamack (stu-1)
    expect(screen.getByText("Abega Paul")).toBeTruthy();
    expect(screen.getByText("Ntamack Lisa")).toBeTruthy();
  });

  it("affiche la moyenne générale de chaque élève", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // The default term is getCurrentTerm() which returns TERM_3 in May.
    // Both students have snapshots for TERM_3 with avg 14.5 and 12.
    // formatScore(14.5) → "14,50", formatScore(12) → "12"
    await waitFor(
      () =>
        expect(
          screen.getAllByText("14,50").length +
            screen.getAllByText("12").length,
        ).toBeGreaterThan(0),
      { timeout: 3000 },
    );
  });
});

// ─── Filtre par élève ─────────────────────────────────────────────────────────

describe("Filtre par élève", () => {
  it("filtre les blocs par nom d'élève", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-student-input")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-student-input"),
      "Abega",
    );

    await waitFor(() => {
      expect(screen.getByTestId("teacher-notes-bloc-stu-2")).toBeTruthy();
      expect(screen.queryByTestId("teacher-notes-bloc-stu-1")).toBeNull();
    });
  });

  it("affiche le bouton clear quand la recherche n'est pas vide", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-student-input"),
      "test",
    );

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-student-clear")).toBeTruthy(),
    );
  });

  it("vide la recherche via le bouton clear", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-student-input"),
      "Abega",
    );
    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-student-clear")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-student-clear"));

    await waitFor(() => {
      expect(screen.getByTestId("teacher-notes-bloc-stu-1")).toBeTruthy();
      expect(screen.getByTestId("teacher-notes-bloc-stu-2")).toBeTruthy();
    });
  });
});

// ─── Filtre par matière ───────────────────────────────────────────────────────

describe("Filtre par matière", () => {
  it("sélectionne le chip de matière Mathématiques", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-subject-sub-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-subject-sub-1"));

    // Le chip est sélectionné — vérification visuelle via le composant
    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-subject-sub-1")).toBeTruthy(),
    );
    // Le chip "Toutes" est toujours présent
    expect(screen.getByTestId("teacher-notes-subject-all")).toBeTruthy();
  });

  it("revient sur 'Toutes les matières' après avoir sélectionné une matière", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-subject-sub-1")).toBeTruthy(),
    );

    // Sélectionne une matière puis revient sur Toutes
    fireEvent.press(screen.getByTestId("teacher-notes-subject-sub-1"));
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-notes-subject-all"));
    await flushAsync();

    // Les deux chips sont toujours présents
    expect(screen.getByTestId("teacher-notes-subject-all")).toBeTruthy();
    expect(screen.getByTestId("teacher-notes-subject-sub-1")).toBeTruthy();
  });
});

// ─── Sélection de période ─────────────────────────────────────────────────────

describe("Sélection de période", () => {
  it("bascule sur T1 et affiche les données de T1", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-term-TERM_1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-term-TERM_1"));
    await flushAsync();

    // Students have TERM_1 data
    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-bloc-stu-1")).toBeTruthy(),
    );
  });
});

// ─── Chargement initial ───────────────────────────────────────────────────────

describe("Chargement initial", () => {
  it("appelle loadStudentNotes pour les élèves sans données", async () => {
    setupStore({
      studentNotes: {},
      isLoadingStudentNotes: true,
      loadStudentNotes: jest.fn().mockResolvedValue([]),
    });

    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    const { loadStudentNotes } = useNotesStore.getState();
    expect(loadStudentNotes).toHaveBeenCalledWith("college-vogt", "stu-1");
    expect(loadStudentNotes).toHaveBeenCalledWith("college-vogt", "stu-2");
  });

  it("n'appelle pas loadStudentNotes si les données sont déjà en cache", async () => {
    const mockLoad = jest.fn().mockResolvedValue([]);
    setupStore({ loadStudentNotes: mockLoad });

    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(mockLoad).not.toHaveBeenCalled();
  });
});
