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
  label:
    term === "TERM_1"
      ? "1er Trimestre"
      : term === "TERM_2"
        ? "2eme Trimestre"
        : "3eme Trimestre",
  councilLabel: "",
  generatedAtLabel: "",
  generalAverage: { student: avg, class: avg, min: 8, max: 18 },
  sequences: [],
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
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue([]),
    clearError: jest.fn(),
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

// ─── Rendu initial ───────────────────────────────────────────────────────────

describe("Rendu initial", () => {
  it("affiche le picker avec le nom du 1er élève trié (Abega avant Ntamack)", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // Abega (stu-2) comes before Ntamack (stu-1) alphabetically
    expect(screen.getByTestId("teacher-notes-student-picker")).toBeTruthy();
    expect(screen.getByText("Abega Paul")).toBeTruthy();
  });

  it("affiche le panel de notes pour le 1er élève", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // StudentNotesPanel is rendered with its term selectors
    await waitFor(() =>
      expect(screen.getByTestId("child-notes-term-TERM_1")).toBeTruthy(),
    );
  });

  it("affiche les sélecteurs de période du panel (child-notes-term-*)", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    await waitFor(() => {
      expect(screen.getByTestId("child-notes-term-TERM_1")).toBeTruthy();
      expect(screen.getByTestId("child-notes-term-TERM_2")).toBeTruthy();
      expect(screen.getByTestId("child-notes-term-TERM_3")).toBeTruthy();
    });
  });
});

// ─── Sélection d'élève ───────────────────────────────────────────────────────

describe("Sélection d'élève", () => {
  it("ouvre le modal au clic sur le picker", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-picker-modal")).toBeTruthy(),
    );
  });

  it("liste les élèves triés dans le modal", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-notes-picker-student-stu-1"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-picker-student-stu-2"),
      ).toBeTruthy();
    });
  });

  it("ferme le modal et met à jour le picker après sélection", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-picker-student-stu-1"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-picker-student-stu-1"));

    await waitFor(() =>
      expect(screen.queryByTestId("teacher-notes-picker-list")).toBeNull(),
    );

    // Now Ntamack Lisa should be shown in the picker
    expect(screen.getByText("Ntamack Lisa")).toBeTruthy();
  });

  it("charge les notes pour le nouvel élève via StudentNotesPanel", async () => {
    // Start with empty store so loadStudentNotes is called
    const mockLoad = jest.fn().mockResolvedValue([]);
    setupStore({
      studentNotes: {},
      isLoadingStudentNotes: false,
      loadStudentNotes: mockLoad,
    });

    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // loadStudentNotes should have been called for the first selected student (Abega = stu-2)
    expect(mockLoad).toHaveBeenCalledWith("college-vogt", "stu-2");
  });
});

// ─── État vide ───────────────────────────────────────────────────────────────

describe("État vide", () => {
  it("affiche EmptyState quand students est vide", async () => {
    render(
      <TeacherClassNotesTab
        {...DEFAULT_PROPS}
        teacherContext={{ ...TEACHER_CONTEXT, students: [] }}
      />,
    );
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-tab")).toBeTruthy();
    expect(screen.getByText("Aucun élève")).toBeTruthy();
  });
});

// ─── Fermeture modal ─────────────────────────────────────────────────────────

describe("Fermeture modal", () => {
  it("ferme le modal via l'overlay", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-picker-overlay")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-picker-overlay"));

    await waitFor(() =>
      expect(screen.queryByTestId("teacher-notes-picker-list")).toBeNull(),
    );
  });

  it("ferme le modal via le bouton close", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-picker-close")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-picker-close"));

    await waitFor(() =>
      expect(screen.queryByTestId("teacher-notes-picker-list")).toBeNull(),
    );
  });
});

// ─── Filtre matière ───────────────────────────────────────────────────────────

describe("Filtre matière", () => {
  it("affiche le picker matière avec 'Toutes les matières' par défaut", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-subject-picker")).toBeTruthy();
    expect(screen.getByText("Toutes les matières")).toBeTruthy();
  });

  it("ouvre le modal matière au clic sur le picker matière", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-subject-picker-modal"),
      ).toBeTruthy(),
    );
  });

  it("liste les options matière dans le modal", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-notes-subject-picker-option-all"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-subject-picker-option-sub-1"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-subject-picker-option-sub-2"),
      ).toBeTruthy();
    });
  });

  it("ferme le modal et met à jour l'affichage après sélection d'une matière", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-subject-picker-option-sub-1"),
      ).toBeTruthy(),
    );

    fireEvent.press(
      screen.getByTestId("teacher-notes-subject-picker-option-sub-1"),
    );

    await waitFor(() =>
      expect(
        screen.queryByTestId("teacher-notes-subject-picker-list"),
      ).toBeNull(),
    );

    // "Mathématiques" appears in the filter button (at least once)
    expect(screen.getAllByText("Mathématiques").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("ferme le modal matière via l'overlay", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-subject-picker-overlay"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker-overlay"));

    await waitFor(() =>
      expect(
        screen.queryByTestId("teacher-notes-subject-picker-list"),
      ).toBeNull(),
    );
  });

  it("ferme le modal matière via le bouton close", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker"));

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-subject-picker-close"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker-close"));

    await waitFor(() =>
      expect(
        screen.queryByTestId("teacher-notes-subject-picker-list"),
      ).toBeNull(),
    );
  });
});

// ─── Filtres combinés ─────────────────────────────────────────────────────────

describe("Filtres combinés", () => {
  it("sélectionner un élève et une matière affiche les deux pickers à jour simultanément", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // Select student Ntamack (stu-1)
    fireEvent.press(screen.getByTestId("teacher-notes-student-picker"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-picker-student-stu-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-notes-picker-student-stu-1"));
    await waitFor(() =>
      expect(screen.queryByTestId("teacher-notes-picker-list")).toBeNull(),
    );

    // Select subject Mathématiques (sub-1)
    fireEvent.press(screen.getByTestId("teacher-notes-subject-picker"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-subject-picker-option-sub-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("teacher-notes-subject-picker-option-sub-1"),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("teacher-notes-subject-picker-list"),
      ).toBeNull(),
    );

    // Both pickers should show correct values
    expect(screen.getByText("Ntamack Lisa")).toBeTruthy();
    // "Mathématiques" appears in the filter button (at least once)
    expect(screen.getAllByText("Mathématiques").length).toBeGreaterThanOrEqual(
      1,
    );
  });
});

// ─── initialStudentId — Pré-sélection depuis Par élève ───────────────────────

describe("initialStudentId — Pré-sélection depuis Par élève", () => {
  it("sélectionne l'élève fourni via initialStudentId au lieu du premier trié", async () => {
    // Par défaut sans initialStudentId : Abega (stu-2) serait sélectionné (1er trié)
    // Avec initialStudentId="stu-1" : Ntamack Lisa doit être affiché dans le picker
    render(
      <TeacherClassNotesTab {...DEFAULT_PROPS} initialStudentId="stu-1" />,
    );
    await flushAsync();

    // Le picker doit afficher Ntamack (stu-1) et non Abega (stu-2)
    expect(screen.getByText("Ntamack Lisa")).toBeTruthy();
    // Abega ne doit pas être affiché dans le picker
    expect(screen.queryByText("Abega Paul")).toBeNull();
  });

  it("charge les notes de l'élève pré-sélectionné (initialStudentId)", async () => {
    const mockLoad = jest.fn().mockResolvedValue([]);
    setupStore({ loadStudentNotes: mockLoad });

    render(
      <TeacherClassNotesTab {...DEFAULT_PROPS} initialStudentId="stu-1" />,
    );
    await flushAsync();

    await waitFor(() =>
      expect(mockLoad).toHaveBeenCalledWith("college-vogt", "stu-1"),
    );
  });

  it("sans initialStudentId, sélectionne le premier élève trié par défaut", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // Abega (stu-2) est le premier trié alphabétiquement
    expect(screen.getByText("Abega Paul")).toBeTruthy();
    expect(screen.queryByText("Ntamack Lisa")).toBeNull();
  });
});
