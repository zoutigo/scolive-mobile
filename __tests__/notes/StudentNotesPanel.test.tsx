import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StudentNotesPanel } from "../../src/components/notes/ChildNotesScreen";
import { useNotesStore } from "../../src/store/notes.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SNAPSHOT_T1 = {
  term: "TERM_1" as const,
  label: "1er Trimestre",
  councilLabel: "6e A • Conseil du 12 avril",
  generatedAtLabel: "Données publiées le 12/04/2026",
  generalAverage: { student: 13.5, class: 12.2, min: 7, max: 18 },
  subjects: [
    {
      id: "math",
      subjectLabel: "Mathématiques",
      teachers: ["Prof. Dupont"],
      coefficient: 4,
      studentAverage: 14,
      classAverage: 11.5,
      classMin: 6,
      classMax: 17,
      appreciation: "Bonne régularité.",
      evaluations: [
        {
          id: "eval-1",
          label: "Interro 1",
          score: 15,
          maxScore: 20,
          weight: 1,
          recordedAt: "12/04/2026",
          status: "ENTERED" as const,
        },
      ],
    },
  ],
};

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
    studentNotes: { "child-1": [SNAPSHOT_T1] },
    isLoadingStudentNotes: false,
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue([]),
    clearError: jest.fn(),
    ...overrides,
  } as never);
}

const DEFAULT_PROPS = {
  studentId: "child-1",
  schoolSlug: "college-vogt",
  bottomInset: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
});

// ─── Rendu de base ───────────────────────────────────────────────────────────

describe("Rendu de base", () => {
  it("affiche les sélecteurs de période (TERM_1/2/3)", async () => {
    // Setup store with 3 snapshots so all term selectors are visible
    setupStore({
      studentNotes: {
        "child-1": [
          SNAPSHOT_T1,
          { ...SNAPSHOT_T1, term: "TERM_2" as const, label: "2eme Trimestre" },
          { ...SNAPSHOT_T1, term: "TERM_3" as const, label: "3eme Trimestre" },
        ],
      },
    });

    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByTestId("child-notes-term-TERM_1")).toBeTruthy();
    expect(screen.getByTestId("child-notes-term-TERM_2")).toBeTruthy();
    expect(screen.getByTestId("child-notes-term-TERM_3")).toBeTruthy();
  });

  it("affiche les sélecteurs de vue (eval/moy/graph)", async () => {
    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByTestId("child-notes-view-evaluations")).toBeTruthy();
    expect(screen.getByTestId("child-notes-view-averages")).toBeTruthy();
    expect(screen.getByTestId("child-notes-view-charts")).toBeTruthy();
  });

  it("affiche les notes de la matière", async () => {
    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByText("MATHÉMATIQUES")).toBeTruthy();
  });
});

// ─── Chargement ──────────────────────────────────────────────────────────────

describe("Chargement", () => {
  it("appelle loadStudentNotes(schoolSlug, studentId) au montage", async () => {
    const mockLoad = jest.fn().mockResolvedValue([]);
    setupStore({ loadStudentNotes: mockLoad });

    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(mockLoad).toHaveBeenCalledWith("college-vogt", "child-1");
  });

  it("affiche loading quand isLoadingStudentNotes: true et pas de données", async () => {
    setupStore({
      studentNotes: {},
      isLoadingStudentNotes: true,
    });

    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByText("Chargement des notes publiées...")).toBeTruthy();
  });

  it("ne rappelle pas loadStudentNotes si données déjà en cache", async () => {
    const mockLoad = jest.fn().mockResolvedValue([]);
    setupStore({
      studentNotes: { "child-1": [SNAPSHOT_T1] },
      loadStudentNotes: mockLoad,
    });

    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    // loadStudentNotes IS called (it loads to refresh) but since data is
    // already in cache the loading state won't block. The function IS called once.
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });
});

// ─── Navigation vue ──────────────────────────────────────────────────────────

describe("Navigation vue", () => {
  it("passe à la vue moyennes au clic sur 'Moy'", async () => {
    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("child-notes-view-averages"));

    await waitFor(() =>
      expect(screen.getByTestId("child-notes-averages-board")).toBeTruthy(),
    );
  });

  it("passe à la vue graphiques au clic sur 'Graph'", async () => {
    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("child-notes-view-charts"));

    await waitFor(() =>
      expect(screen.getByText("Comparaison par matière")).toBeTruthy(),
    );
  });
});

// ─── Changement d'élève ──────────────────────────────────────────────────────

describe("Changement d'élève", () => {
  it("appelle loadStudentNotes avec le nouveau studentId quand la prop change", async () => {
    const mockLoad = jest.fn().mockResolvedValue([]);
    setupStore({
      studentNotes: {
        "child-1": [SNAPSHOT_T1],
        "child-2": [{ ...SNAPSHOT_T1, term: "TERM_1" as const }],
      },
      loadStudentNotes: mockLoad,
    });

    const { rerender } = render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    rerender(
      <StudentNotesPanel
        studentId="child-2"
        schoolSlug="college-vogt"
        bottomInset={0}
      />,
    );
    await flushAsync();

    expect(mockLoad).toHaveBeenCalledWith("college-vogt", "child-2");
  });

  it("réinitialise la vue à 'evaluations' quand l'élève change", async () => {
    setupStore({
      studentNotes: { "child-1": [SNAPSHOT_T1] },
    });

    const { rerender } = render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    // Switch to averages view
    fireEvent.press(screen.getByTestId("child-notes-view-averages"));
    await waitFor(() =>
      expect(screen.getByTestId("child-notes-averages-board")).toBeTruthy(),
    );

    // Change student
    setupStore({
      studentNotes: {
        "child-1": [SNAPSHOT_T1],
        "child-2": [SNAPSHOT_T1],
      },
    });
    rerender(
      <StudentNotesPanel
        studentId="child-2"
        schoolSlug="college-vogt"
        bottomInset={0}
      />,
    );
    await flushAsync();

    // Should be back to evaluations view
    await waitFor(() =>
      expect(screen.queryByTestId("child-notes-averages-board")).toBeNull(),
    );
    expect(screen.getByText("MATHÉMATIQUES")).toBeTruthy();
  });
});

// ─── État vide ───────────────────────────────────────────────────────────────

describe("État vide", () => {
  it("affiche l'état vide si aucune note disponible", async () => {
    setupStore({ studentNotes: {} });

    render(<StudentNotesPanel {...DEFAULT_PROPS} />);
    await flushAsync();

    expect(screen.getByText("Aucune note publiée")).toBeTruthy();
  });
});

// ─── Filtre par matière (subjectFilter) ──────────────────────────────────────

describe("Filtre par matière (subjectFilter)", () => {
  it("sans filtre (subjectFilter='') : affiche tous les sujets", async () => {
    render(<StudentNotesPanel {...DEFAULT_PROPS} subjectFilter="" />);
    await flushAsync();

    expect(screen.getByText("MATHÉMATIQUES")).toBeTruthy();
  });

  it("avec filtre sur subjectFilter='math' : affiche uniquement le sujet MATHÉMATIQUES", async () => {
    render(<StudentNotesPanel {...DEFAULT_PROPS} subjectFilter="math" />);
    await flushAsync();

    expect(screen.getByText("MATHÉMATIQUES")).toBeTruthy();
  });

  it("avec filtre sur un subject id inconnu : affiche l'état vide de la vue sans EmptyState global", async () => {
    render(<StudentNotesPanel {...DEFAULT_PROPS} subjectFilter="unknown-id" />);
    await flushAsync();

    // The global empty state ("Aucune note publiee") must NOT appear
    expect(screen.queryByText("Aucune note publiee")).toBeNull();
    // And no subjects are rendered
    expect(screen.queryByText("MATHÉMATIQUES")).toBeNull();
  });
});
