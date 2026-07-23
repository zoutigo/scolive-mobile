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
  it("affiche la recherche avec le nom du 1er élève trié (Abega avant Ntamack)", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // Abega (stu-2) comes before Ntamack (stu-1) alphabetically
    const input = screen.getByTestId("teacher-notes-search-input");
    expect(input.props.value).toBe("Abega Paul");
  });

  it("affiche le panel de notes pour le 1er élève sans les sélecteurs internes", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    // The switcher/term pills are hidden — filters live in the teal panel now
    expect(screen.queryByTestId("child-notes-term-TERM_1")).toBeNull();
  });

  it("affiche le bouton de filtre", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-filter-toggle")).toBeTruthy();
  });
});

// ─── Recherche élève ─────────────────────────────────────────────────────────

describe("Recherche élève", () => {
  it("affiche la liste de résultats quand on tape dans la recherche", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-search-input"),
      "Nt",
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-search-result-stu-1"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-notes-search-result-stu-2"),
    ).toBeNull();
  });

  it("sélectionne un élève depuis les résultats de recherche", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-search-input"),
      "Nt",
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-search-result-stu-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-notes-search-result-stu-1"));

    await waitFor(() =>
      expect(screen.queryByTestId("teacher-notes-search-results")).toBeNull(),
    );
    expect(screen.getByTestId("teacher-notes-search-input").props.value).toBe(
      "Ntamack Lisa",
    );
  });

  it("charge les notes pour le nouvel élève via StudentNotesPanel", async () => {
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

// ─── Panneau de filtres ────────────────────────────────────────────────────

describe("Panneau de filtres", () => {
  it("ouvre le panneau au clic sur le bouton filtre", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-filter-toggle"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-filter-panel")).toBeTruthy(),
    );
  });

  it("liste les options matière dans le panneau", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-filter-toggle"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-notes-filter-subject-all"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-filter-subject-sub-1"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-filter-subject-sub-2"),
      ).toBeTruthy();
    });
  });

  it("liste les options de trimestre et de vue", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-filter-toggle"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-notes-filter-term-TERM_1"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-filter-view-evaluations"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-filter-view-averages"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-filter-view-charts"),
      ).toBeTruthy();
    });
  });

  it("applique un filtre matière et ferme le panneau", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-filter-toggle"));
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-filter-subject-sub-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-notes-filter-subject-sub-1"));
    fireEvent.press(screen.getByTestId("teacher-notes-filter-apply"));

    await waitFor(() =>
      expect(screen.queryByTestId("teacher-notes-filter-panel")).toBeNull(),
    );
    expect(screen.getByTestId("teacher-notes-filter-toggle")).toBeTruthy();
  });

  it("réinitialise les filtres (le panneau reste ouvert)", async () => {
    render(<TeacherClassNotesTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-filter-toggle"));
    fireEvent.press(screen.getByTestId("teacher-notes-filter-subject-sub-1"));
    fireEvent.press(screen.getByTestId("teacher-notes-filter-apply"));

    fireEvent.press(screen.getByTestId("teacher-notes-filter-toggle"));
    fireEvent.press(screen.getByTestId("teacher-notes-filter-reset"));

    expect(screen.getByTestId("teacher-notes-filter-toggle")).toBeTruthy();
  });
});

// ─── initialStudentId — Pré-sélection depuis Par élève ───────────────────────

describe("initialStudentId — Pré-sélection depuis Par élève", () => {
  it("sélectionne l'élève fourni via initialStudentId au lieu du premier trié", async () => {
    render(
      <TeacherClassNotesTab {...DEFAULT_PROPS} initialStudentId="stu-1" />,
    );
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-search-input").props.value).toBe(
      "Ntamack Lisa",
    );
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

    expect(screen.getByTestId("teacher-notes-search-input").props.value).toBe(
      "Abega Paul",
    );
  });
});
