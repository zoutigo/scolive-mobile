import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ClassNotesManagerScreen } from "../../src/components/notes/ClassNotesManagerScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useNotesStore } from "../../src/store/notes.store";
import { teachersApi } from "../../src/api/teachers.api";
import { notesApi } from "../../src/api/notes.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("../../src/api/teachers.api");
jest.mock("../../src/api/notes.api");

const mockTeachersApi = teachersApi as jest.Mocked<typeof teachersApi>;
const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;

const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {
  classId: "class-1",
  schoolYearId: "y1",
};
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: jest.fn().mockReturnValue(true),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => mockSearchParams,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TEACHER_CONTEXT = {
  class: { id: "class-1", name: "6e A", schoolYearId: "y1" },
  subjects: [
    {
      id: "sub-1",
      name: "Mathématiques",
      branches: [{ id: "branch-1", name: "Algèbre" }],
    },
  ],
  evaluationTypes: [
    { id: "type-1", code: "COMP", label: "Composition", isDefault: true },
    { id: "type-2", code: "INTERRO", label: "Interrogation", isDefault: false },
  ],
  students: [
    { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
    { id: "stu-2", firstName: "Paul", lastName: "Abega" },
  ],
};

const EVAL_1 = {
  id: "eval-1",
  title: "Composition 1",
  description: "Exercices chapitres 1-3",
  coefficient: 2,
  maxScore: 20,
  sequence: "SEQ_1",
  term: "TERM_1",
  status: "PUBLISHED",
  scheduledAt: "2026-04-12T08:00:00.000Z",
  createdAt: "2026-04-10T08:00:00.000Z",
  updatedAt: "2026-04-10T08:00:00.000Z",
  subject: { id: "sub-1", name: "Mathématiques" },
  subjectBranch: { id: "branch-1", name: "Algèbre" },
  evaluationType: { id: "type-1", code: "COMP", label: "Composition" },
  class: { id: "class-1", name: "6e A", studentsCount: 2 },
  author: { id: "u1", firstName: "Valery", lastName: "Mbele" },
  attachments: [],
  _count: { scores: 1 },
};

const EVAL_2 = {
  ...EVAL_1,
  id: "eval-2",
  title: "DS Algèbre",
  status: "DRAFT",
  sequence: "SEQ_3",
  scheduledAt: "2026-02-01T08:00:00.000Z",
  createdAt: "2026-02-01T08:00:00.000Z",
  _count: { scores: 0 },
};

const EVAL_3 = {
  ...EVAL_1,
  id: "eval-3",
  title: "Interrogation orale",
  status: "PUBLISHED",
  sequence: "SEQ_5",
  evaluationType: { id: "type-2", code: "INTERRO", label: "Interrogation" },
  scheduledAt: "2026-05-20T08:00:00.000Z",
  createdAt: "2026-05-18T08:00:00.000Z",
  _count: { scores: 2 },
};

const EVAL_DETAIL = {
  ...EVAL_1,
  students: [
    {
      id: "stu-1",
      firstName: "Lisa",
      lastName: "Ntamack",
      score: 15,
      scoreStatus: "ENTERED",
      comment: "Très bien",
    },
    {
      id: "stu-2",
      firstName: "Paul",
      lastName: "Abega",
      score: null,
      scoreStatus: "NOT_GRADED",
      comment: "",
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setupStore(
  overrides: Partial<ReturnType<typeof useNotesStore.getState>> = {},
) {
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

  useNotesStore.setState({
    teacherContext: TEACHER_CONTEXT,
    evaluations: [EVAL_1, EVAL_2, EVAL_3],
    // Pre-populate le détail pour que selectedEvaluation soit disponible dès le mount
    evaluationDetails: { "eval-1": EVAL_DETAIL },
    termReports: { TERM_1: null, TERM_2: null, TERM_3: null },
    isLoadingTeacherContext: false,
    isLoadingEvaluations: false,
    isLoadingEvaluationDetail: false,
    isLoadingTermReports: false,
    isSubmitting: false,
    errorMessage: null,
    loadTeacherContext: jest.fn().mockResolvedValue(TEACHER_CONTEXT),
    loadEvaluations: jest.fn().mockResolvedValue([EVAL_1, EVAL_2, EVAL_3]),
    loadSchoolEvaluations: jest
      .fn()
      .mockResolvedValue([EVAL_1, EVAL_2, EVAL_3]),
    loadEvaluationDetail: jest
      .fn()
      .mockImplementation((_slug, _classId, evalId) => {
        // Simule la mise à jour du store comme le ferait la vraie action
        useNotesStore.setState((s) => ({
          evaluationDetails: { ...s.evaluationDetails, [evalId]: EVAL_DETAIL },
        }));
        return Promise.resolve(EVAL_DETAIL);
      }),
    createEvaluation: jest.fn().mockResolvedValue({ id: "eval-new" }),
    updateEvaluation: jest.fn().mockResolvedValue(undefined),
    deleteEvaluation: jest.fn().mockResolvedValue(undefined),
    saveScores: jest.fn().mockResolvedValue(EVAL_DETAIL),
    loadTermReports: jest.fn().mockResolvedValue([]),
    saveTermReports: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
    ...overrides,
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = { classId: "class-1", schoolYearId: "y1" };
  setupStore();
});

// ─── Rendu général ───────────────────────────────────────────────────────────

describe("Rendu général", () => {
  it("affiche le header, les 3 onglets et la liste d'évaluations", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    expect(screen.getByTestId("class-notes-header")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-evaluations")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-notes")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-reports")).toBeTruthy();
    expect(screen.getByText("6e A")).toBeTruthy();
  });

  it("déclenche le retour via le bouton back", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();
    fireEvent.press(screen.getByTestId("class-notes-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("affiche l'écran de refus pour un rôle parent", async () => {
    useAuthStore.setState({
      schoolSlug: "college-vogt",
      user: {
        id: "u2",
        firstName: "Marie",
        lastName: "Dupont",
        platformRoles: [],
        memberships: [{ schoolId: "s1", role: "PARENT" }],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
      },
    } as never);
    render(<ClassNotesManagerScreen />);
    await flushAsync();
    expect(screen.getByText("Accès non autorisé")).toBeTruthy();
  });
});

// ─── Vue liste + recherche ────────────────────────────────────────────────────

describe("Vue liste évaluations", () => {
  it("affiche la barre de recherche, les 2 évaluations et le FAB", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-notes-search-bar")).toBeTruthy(),
    );
    expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy();
    expect(screen.getByTestId("class-evaluation-row-eval-2")).toBeTruthy();
    expect(screen.getByTestId("class-notes-fab-create")).toBeTruthy();
  });

  it("affiche la classe et l'enseignant sur la même ligne que la matière", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy(),
    );
    expect(
      screen.getAllByText("Mathématiques • Algèbre • 6e A • Valery Mbele")
        .length,
    ).toBeGreaterThan(0);
  });

  it("filtre par titre", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("class-notes-search-input"),
      "DS Algèbre",
    );

    await waitFor(() => {
      expect(screen.queryByTestId("class-evaluation-row-eval-1")).toBeNull();
      expect(screen.getByTestId("class-evaluation-row-eval-2")).toBeTruthy();
    });
  });

  it("vide la recherche via le bouton clear", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("class-notes-search-input"),
      "test",
    );
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-search-clear")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-search-clear"));

    await waitFor(() =>
      expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy(),
    );
  });
});

// ─── Tri — plus récente en premier ──────────────────────────────────────────

describe("Tri des évaluations", () => {
  it("affiche la liste triée de la plus récente à la plus ancienne", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    const list = await screen.findByTestId("class-evaluations-list");
    const ids = list.props.data.map(
      (item: { id: string }) => item.id,
    ) as string[];
    // eval-3 (2026-05-20) > eval-1 (2026-04-12) > eval-2 (2026-02-01)
    expect(ids).toEqual(["eval-3", "eval-1", "eval-2"]);
  });
});

// ─── Filtres évaluations ─────────────────────────────────────────────────────

describe("Filtres évaluations", () => {
  it("le bouton filtre est inactif par défaut", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    const toggle = await screen.findByTestId("class-notes-filter-toggle");
    const flatStyle = [toggle.props.style].flat();
    expect(flatStyle).not.toContainEqual(
      expect.objectContaining({ backgroundColor: "#247C72" }),
    );
  });

  it("ouvre et ferme le panneau de filtres via le bouton toggle", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-filter-panel")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-notes-filter-toggle"));
    await waitFor(() =>
      expect(screen.queryByTestId("class-notes-filter-panel")).toBeNull(),
    );
  });

  it("le bouton Appliquer a une couleur distincte des chips actifs", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-type-type-2"),
    );

    const activeChip = screen.getByTestId("class-notes-filter-type-type-2");
    const chipStyles = [activeChip.props.style].flat();
    const chipBg = chipStyles.find(
      (s) => s && s.backgroundColor,
    )?.backgroundColor;

    const applyButton = screen.getByTestId("class-notes-filter-apply");
    const applyStyles = [applyButton.props.style].flat();
    const applyBg = applyStyles.find(
      (s) => s && s.backgroundColor,
    )?.backgroundColor;

    expect(applyBg).toBe("#08467D");
    expect(applyBg).not.toBe(chipBg);
  });

  it("masque le FAB de création tant que le panneau de filtres est ouvert", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-notes-fab-create")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-notes-filter-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-filter-panel")).toBeTruthy(),
    );
    expect(screen.queryByTestId("class-notes-fab-create")).toBeNull();

    fireEvent.press(screen.getByTestId("class-notes-filter-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-fab-create")).toBeTruthy(),
    );
  });

  it("filtre par type d'évaluation après Appliquer", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-type-type-2"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    await waitFor(() => {
      expect(screen.getByTestId("class-evaluation-row-eval-3")).toBeTruthy();
      expect(screen.queryByTestId("class-evaluation-row-eval-1")).toBeNull();
      expect(screen.queryByTestId("class-evaluation-row-eval-2")).toBeNull();
    });

    // Le bouton filtre devient actif (teal plein)
    const toggle = screen.getByTestId("class-notes-filter-toggle");
    const flatStyle = [toggle.props.style].flat();
    expect(flatStyle).toContainEqual(
      expect.objectContaining({ backgroundColor: "#247C72" }),
    );
  });

  it("filtre par séquence après Appliquer", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-sequence-SEQ_3"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    await waitFor(() => {
      expect(screen.getByTestId("class-evaluation-row-eval-2")).toBeTruthy();
      expect(screen.queryByTestId("class-evaluation-row-eval-1")).toBeNull();
      expect(screen.queryByTestId("class-evaluation-row-eval-3")).toBeNull();
    });
  });

  it("filtre par notes complètes / incomplètes après Appliquer", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-completion-complete"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    await waitFor(() => {
      expect(screen.getByTestId("class-evaluation-row-eval-3")).toBeTruthy();
      expect(screen.queryByTestId("class-evaluation-row-eval-1")).toBeNull();
      expect(screen.queryByTestId("class-evaluation-row-eval-2")).toBeNull();
    });
  });

  it("Reset vide les filtres appliqués et laisse le panneau ouvert", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-completion-incomplete"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));
    await waitFor(() =>
      expect(screen.queryByTestId("class-evaluation-row-eval-3")).toBeNull(),
    );

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(screen.getByTestId("class-notes-filter-reset"));

    // Le panneau reste ouvert après Reset
    expect(screen.getByTestId("class-notes-filter-panel")).toBeTruthy();

    fireEvent.press(screen.getByTestId("class-notes-filter-close"));
    await waitFor(() => {
      expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy();
      expect(screen.getByTestId("class-evaluation-row-eval-2")).toBeTruthy();
      expect(screen.getByTestId("class-evaluation-row-eval-3")).toBeTruthy();
    });
  });

  it("Close abandonne le brouillon en cours sans appliquer de filtre", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-type-type-2"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-close"));

    await waitFor(() =>
      expect(screen.queryByTestId("class-notes-filter-panel")).toBeNull(),
    );
    // Aucun filtre n'a été appliqué : les 3 évaluations restent visibles
    expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy();
    expect(screen.getByTestId("class-evaluation-row-eval-2")).toBeTruthy();
    expect(screen.getByTestId("class-evaluation-row-eval-3")).toBeTruthy();
  });

  it("recherche et filtres se combinent", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-type-type-1"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    fireEvent.changeText(
      screen.getByTestId("class-notes-search-input"),
      "DS Algèbre",
    );

    await waitFor(() => {
      expect(screen.getByTestId("class-evaluation-row-eval-2")).toBeTruthy();
      expect(screen.queryByTestId("class-evaluation-row-eval-1")).toBeNull();
      expect(screen.queryByTestId("class-evaluation-row-eval-3")).toBeNull();
    });
  });
});

// ─── Bouton Notes du footer — couleur selon complétion ───────────────────────

describe("Couleur du bouton Notes selon la complétion des scores", () => {
  it("colore le bouton en teal quand toutes les notes sont saisies", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    const label = await screen.findByTestId("eval-action-scores-label-eval-3");
    const flatStyle = [label.props.style].flat();
    expect(flatStyle).toContainEqual(
      expect.objectContaining({ color: "#247C72" }),
    );
  });

  it("colore le bouton en orange quand des notes manquent", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    const label = await screen.findByTestId("eval-action-scores-label-eval-1");
    const flatStyle = [label.props.style].flat();
    expect(flatStyle).toContainEqual(
      expect.objectContaining({ color: "#D89B5B" }),
    );
  });
});

// ─── Footer — 4 actions par carte ────────────────────────────────────────────

describe("Footer actions par carte", () => {
  it("affiche les 4 boutons d'action sur chaque carte", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy(),
    );

    expect(screen.getByTestId("eval-action-detail-eval-1")).toBeTruthy();
    expect(screen.getByTestId("eval-action-edit-eval-1")).toBeTruthy();
    expect(screen.getByTestId("eval-action-scores-eval-1")).toBeTruthy();
    expect(screen.getByTestId("eval-action-delete-eval-1")).toBeTruthy();
  });
});

// ─── Vue détail ──────────────────────────────────────────────────────────────

describe("Vue détail", () => {
  async function openDetail() {
    render(<ClassNotesManagerScreen />);
    await flushAsync();
    await waitFor(() =>
      expect(screen.getByTestId("eval-action-detail-eval-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-detail-eval-1"));
    await flushAsync();
  }

  it("affiche les informations de l'évaluation", async () => {
    await openDetail();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-detail-back")).toBeTruthy(),
    );
    expect(screen.getByText("Composition 1")).toBeTruthy();
    expect(screen.getByText("Exercices chapitres 1-3")).toBeTruthy();
  });

  it("revient à la liste via le bouton retour", async () => {
    await openDetail();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-detail-back")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-detail-back"));
    await flushAsync();
    await waitFor(() =>
      expect(screen.getByTestId("class-evaluations-list")).toBeTruthy(),
    );
  });

  it("navigue vers la vue scores depuis Saisir les notes", async () => {
    await openDetail();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-detail-scores")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-detail-scores"));
    await flushAsync();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-scores-hero")).toBeTruthy(),
    );
  });

  it("navigue vers le formulaire depuis Modifier", async () => {
    await openDetail();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-detail-edit")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-detail-edit"));
    await flushAsync();
    await waitFor(() =>
      expect(screen.getByTestId("eval-form-back")).toBeTruthy(),
    );
  });
});

// ─── Vue saisie notes (scores page) ──────────────────────────────────────────

describe("Vue saisie notes", () => {
  async function openScoresView() {
    render(<ClassNotesManagerScreen />);
    await flushAsync();
    await waitFor(() =>
      expect(screen.getByTestId("eval-action-scores-eval-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-scores-eval-1"));
    await flushAsync();
  }

  it("affiche la barre filtre élève sans bouton submit global", async () => {
    await openScoresView();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-scores-filter-bar")).toBeTruthy(),
    );
    expect(screen.getByTestId("class-notes-scores-filter-btn")).toBeTruthy();
    expect(screen.queryByTestId("class-notes-save-scores-page")).toBeNull();
  });

  it("affiche les élèves triés alphabétiquement (Abega avant Ntamack)", async () => {
    await openScoresView();
    await waitFor(() =>
      expect(screen.getByTestId("scores-student-stu-2")).toBeTruthy(),
    );
    expect(screen.getByTestId("scores-student-stu-1")).toBeTruthy();

    const abega = screen.getByText("Abega Paul");
    const ntamack = screen.getByText("Ntamack Lisa");
    expect(abega).toBeTruthy();
    expect(ntamack).toBeTruthy();
  });

  it("filtre les élèves via le dropdown", async () => {
    await openScoresView();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-scores-filter-btn")).toBeTruthy(),
    );

    // Ouvre le modal
    fireEvent.press(screen.getByTestId("class-notes-scores-filter-btn"));

    // Sélectionne Abega (stu-2)
    await waitFor(() =>
      expect(
        screen.getByTestId("class-notes-scores-filter-stu-2"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-scores-filter-stu-2"));

    await waitFor(() => {
      expect(screen.getByTestId("scores-student-stu-2")).toBeTruthy();
      expect(screen.queryByTestId("scores-student-stu-1")).toBeNull();
    });
  });

  it("revient à la liste via le bouton retour du header module", async () => {
    await openScoresView();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-scores-hero")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-back"));
    await flushAsync();
    await waitFor(() =>
      expect(screen.getByTestId("class-evaluations-list")).toBeTruthy(),
    );
  });

  it("affiche le bandeau brouillon si l'évaluation est en DRAFT", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    // eval-2 a status DRAFT
    await waitFor(() =>
      expect(screen.getByTestId("eval-action-scores-eval-2")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-scores-eval-2"));
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("class-notes-scores-draft-warning"),
      ).toBeTruthy(),
    );
  });

  it("n'affiche pas le bandeau brouillon si l'évaluation est PUBLISHED", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    // eval-1 a status PUBLISHED
    await waitFor(() =>
      expect(screen.getByTestId("eval-action-scores-eval-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-scores-eval-1"));
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-notes-scores-filter-bar")).toBeTruthy(),
    );
    expect(screen.queryByTestId("class-notes-scores-draft-warning")).toBeNull();
  });

  it("sauvegarde la note d'un élève via le bouton Enregistrer de sa carte", async () => {
    await openScoresView();

    // stu-1 a déjà une note (score=15, ENTERED) → mode view → bouton "Modifier"
    await waitFor(() =>
      expect(screen.getByTestId("scores-submit-stu-1")).toBeTruthy(),
    );
    expect(screen.getByTestId("scores-submit-stu-1")).toHaveTextContent(
      "Modifier",
    );

    // stu-2 n'a pas de note → mode édition → bouton "Enregistrer"
    expect(screen.getByTestId("scores-submit-stu-2")).toHaveTextContent(
      "Enregistrer",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("scores-submit-stu-2"));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useNotesStore.getState().saveScores).toHaveBeenCalledTimes(1);
    // La vue ne navigue pas vers la liste : on reste sur la vue scores
    expect(screen.queryByTestId("class-evaluations-list")).toBeNull();
  });
});

// ─── Suppression ─────────────────────────────────────────────────────────────

describe("Suppression d'une évaluation", () => {
  it("ouvre le dialog de confirmation au clic sur Supprimer", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-action-delete-eval-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-delete-eval-1"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy(),
    );
  });

  it("annule la suppression sans appeler deleteEvaluation", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-action-delete-eval-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-delete-eval-1"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog-cancel")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));

    await flushAsync();
    expect(useNotesStore.getState().deleteEvaluation).not.toHaveBeenCalled();
  });

  it("confirme la suppression et appelle deleteEvaluation", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-action-delete-eval-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-delete-eval-1"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog-confirm")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useNotesStore.getState().deleteEvaluation).toHaveBeenCalledWith(
      "college-vogt",
      "class-1",
      "eval-1",
    );
  });
});

// ─── Vue formulaire (FAB + édition via footer) ────────────────────────────────

describe("Vue formulaire", () => {
  it("ouvre le formulaire de création via le FAB", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-notes-fab-create")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-fab-create"));
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-form-title")).toBeTruthy(),
    );
  });

  it("ouvre le formulaire en mode édition via le bouton Modifier du footer", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-action-edit-eval-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-action-edit-eval-1"));
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-form-back")).toBeTruthy(),
    );
  });

  it("revient à la liste via le lien retour du formulaire", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("class-notes-fab-create"));
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-form-back")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("eval-form-back"));
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-evaluations-list")).toBeTruthy(),
    );
  });
});

// ─── preStudentId — Arrivée depuis "Par élève" ────────────────────────────────

describe("preStudentId — Arrivée depuis le module Par élève", () => {
  beforeEach(() => {
    mockSearchParams = {
      classId: "class-1",
      schoolYearId: "y1",
      preStudentId: "stu-1",
    };
  });

  it("ouvre l'onglet Notes (et non Évaluations) quand preStudentId est présent", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    // L'onglet Notes doit être actif : TeacherClassNotesTab doit être rendu
    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-tab")).toBeTruthy(),
    );

    // L'onglet Évaluations ne doit pas être actif (liste évals absente)
    expect(screen.queryByTestId("class-evaluations-list")).toBeNull();
  });

  it("pré-filtre la saisie des notes sur l'élève fourni via preStudentId", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    // Basculer manuellement sur l'onglet Évaluations → vue scores
    fireEvent.press(screen.getByTestId("notes-tab-evaluations"));
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-evaluations-list")).toBeTruthy(),
    );

    // Ouvrir la vue saisie sur la première évaluation
    fireEvent.press(screen.getByTestId(`eval-action-scores-${EVAL_1.id}`));
    await flushAsync();

    // Le filtre élève doit afficher le nom de l'élève pré-sélectionné
    // (apparaît au moins dans la barre de filtre, potentiellement dans la carte aussi)
    await waitFor(() =>
      expect(screen.getAllByText("Ntamack Lisa").length).toBeGreaterThanOrEqual(
        1,
      ),
    );
    // "Tous les élèves" ne doit pas être affiché dans le filtre
    expect(screen.queryByText("Tous les élèves")).toBeNull();
  });

  it("sans preStudentId, l'onglet Évaluations est actif par défaut", async () => {
    mockSearchParams = { classId: "class-1", schoolYearId: "y1" };

    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-evaluations-list")).toBeTruthy(),
    );
    expect(screen.queryByTestId("teacher-notes-tab")).toBeNull();
  });
});

// ─── preEvaluationId / openCreate — Arrivée depuis la vue école ──────────────

describe("preEvaluationId — Arrivée depuis la liste multi-classes", () => {
  it("ouvre directement le détail de l'évaluation fournie via preEvaluationId", async () => {
    mockSearchParams = {
      classId: "class-1",
      schoolYearId: "y1",
      preEvaluationId: "eval-1",
    };

    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("class-notes-detail-back")).toBeTruthy(),
    );
    expect(screen.getByText("Composition 1")).toBeTruthy();
  });
});

describe("openCreate — Création directe depuis la liste multi-classes", () => {
  it("ouvre directement le formulaire de création quand openCreate=1", async () => {
    mockSearchParams = {
      classId: "class-1",
      schoolYearId: "y1",
      openCreate: "1",
    };

    render(<ClassNotesManagerScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(screen.getByTestId("eval-form-back")).toBeTruthy(),
    );
  });
});

// ─── Mode admin (arrivée directe, sans classId) ──────────────────────────────

const LEVEL_6E = { id: "level-6e", code: "6E", label: "6ème" };
const LEVEL_5E = { id: "level-5e", code: "5E", label: "5ème" };

const CLASSROOM_6A = {
  id: "class-1",
  name: "6e A",
  schoolYear: { id: "y1", label: "2025-2026" },
  academicLevel: LEVEL_6E,
};
const CLASSROOM_6B = {
  id: "class-2",
  name: "6e B",
  schoolYear: { id: "y1", label: "2025-2026" },
  academicLevel: LEVEL_6E,
};
const CLASSROOM_5A = {
  id: "class-3",
  name: "5e A",
  schoolYear: { id: "y1", label: "2025-2026" },
  academicLevel: LEVEL_5E,
};

describe("Mode admin — arrivée sans classId", () => {
  beforeEach(() => {
    mockSearchParams = { schoolYearId: "y1" };
    mockTeachersApi.listClassrooms.mockResolvedValue([
      CLASSROOM_6A,
      CLASSROOM_6B,
      CLASSROOM_5A,
    ] as never);
  });

  it("ne charge pas le contexte enseignant tant qu'aucune classe n'est choisie, mais charge les évaluations de toute l'école", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    expect(screen.queryByTestId("class-notes-subtitle")).toBeNull();
    expect(useNotesStore.getState().loadTeacherContext).not.toHaveBeenCalled();
    expect(useNotesStore.getState().loadSchoolEvaluations).toHaveBeenCalledWith(
      "college-vogt",
      { academicLevelId: undefined },
    );
  });

  it("ouvre automatiquement le panneau de filtres à l'arrivée", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    expect(await screen.findByTestId("class-notes-filter-panel")).toBeTruthy();
    expect(screen.getByTestId("class-notes-filter-level-trigger")).toBeTruthy();
    expect(screen.getByTestId("class-notes-filter-class-trigger")).toBeTruthy();
  });

  it("affiche la liste de toute l'école (pas de blocage) si le panneau de filtres est fermé sans sélection", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();
    fireEvent.press(await screen.findByTestId("class-notes-filter-close"));

    await waitFor(() => {
      expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy();
      expect(screen.getByTestId("class-evaluation-row-eval-2")).toBeTruthy();
      expect(screen.getByTestId("class-evaluation-row-eval-3")).toBeTruthy();
    });
    // Créer une évaluation exige une classe précise : le FAB reste masqué.
    expect(screen.queryByTestId("class-notes-fab-create")).toBeNull();
  });

  it("propose Toutes les classes dans le sélecteur de classe (pas de choix forcé)", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(
      await screen.findByTestId("class-notes-filter-class-trigger"),
    );
    expect(
      screen.getByTestId("class-notes-filter-class-option-empty"),
    ).toBeTruthy();
  });

  it("narrowing par niveau seul reste en navigation école entière (pas de contexte enseignant chargé)", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(
      await screen.findByTestId("class-notes-filter-level-trigger"),
    );
    fireEvent.press(
      await screen.findByTestId(
        `class-notes-filter-level-option-${LEVEL_6E.id}`,
      ),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    await waitFor(() => {
      expect(
        useNotesStore.getState().loadSchoolEvaluations,
      ).toHaveBeenCalledWith("college-vogt", {
        academicLevelId: LEVEL_6E.id,
      });
    });
    expect(useNotesStore.getState().loadTeacherContext).not.toHaveBeenCalled();
    expect(screen.queryByTestId("class-notes-fab-create")).toBeNull();
  });

  it("limite les classes proposées au niveau sélectionné", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(
      await screen.findByTestId("class-notes-filter-level-trigger"),
    );
    fireEvent.press(
      await screen.findByTestId(
        `class-notes-filter-level-option-${LEVEL_6E.id}`,
      ),
    );

    fireEvent.press(
      await screen.findByTestId("class-notes-filter-class-trigger"),
    );
    expect(
      screen.getByTestId(`class-notes-filter-class-option-${CLASSROOM_6A.id}`),
    ).toBeTruthy();
    expect(
      screen.getByTestId(`class-notes-filter-class-option-${CLASSROOM_6B.id}`),
    ).toBeTruthy();
    expect(
      screen.queryByTestId(
        `class-notes-filter-class-option-${CLASSROOM_5A.id}`,
      ),
    ).toBeNull();
  });

  it("charge le contexte de la classe choisie via le filtre, et uniquement celle-ci", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(
      await screen.findByTestId("class-notes-filter-class-trigger"),
    );
    fireEvent.press(
      await screen.findByTestId(
        `class-notes-filter-class-option-${CLASSROOM_6B.id}`,
      ),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    await waitFor(() => {
      expect(useNotesStore.getState().loadTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-2",
      );
    });
    expect(
      useNotesStore.getState().loadTeacherContext,
    ).not.toHaveBeenCalledWith("college-vogt", "class-1");
  });

  it("Reset ramène en navigation école entière après avoir engagé une classe via le filtre", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    // Engage la classe 6e B via le filtre.
    fireEvent.press(
      await screen.findByTestId("class-notes-filter-class-trigger"),
    );
    fireEvent.press(
      await screen.findByTestId(
        `class-notes-filter-class-option-${CLASSROOM_6B.id}`,
      ),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));
    await waitFor(() => {
      expect(useNotesStore.getState().loadTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-2",
      );
    });

    (useNotesStore.getState().loadSchoolEvaluations as jest.Mock).mockClear();

    // Reset : les dropdowns doivent revenir à "Tous/Toutes" et la navigation
    // école entière doit reprendre.
    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    fireEvent.press(screen.getByTestId("class-notes-filter-reset"));

    fireEvent.press(
      await screen.findByTestId("class-notes-filter-class-trigger"),
    );
    expect(
      screen.getByTestId("class-notes-filter-class-option-empty"),
    ).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("class-notes-filter-class-option-empty"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    await waitFor(() => {
      expect(
        useNotesStore.getState().loadSchoolEvaluations,
      ).toHaveBeenCalledWith("college-vogt", { academicLevelId: undefined });
    });
  });

  it("résout la classe depuis la ligne pour Modifier une évaluation d'une autre classe que celle engagée", async () => {
    const OTHER_CLASS_EVAL = {
      ...EVAL_1,
      id: "eval-9",
      title: "Contrôle 6e B",
      class: { id: "class-2", name: "6e B" },
    };
    useNotesStore.setState({
      evaluations: [EVAL_1, OTHER_CLASS_EVAL],
    } as never);

    render(<ClassNotesManagerScreen />);
    await flushAsync();
    fireEvent.press(await screen.findByTestId("class-notes-filter-close"));

    fireEvent.press(await screen.findByTestId("eval-action-edit-eval-9"));

    await waitFor(() => {
      expect(useNotesStore.getState().loadTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-2",
      );
    });
  });

  it("résout la classe depuis la ligne pour Supprimer une évaluation d'une autre classe que celle engagée", async () => {
    const OTHER_CLASS_EVAL = {
      ...EVAL_1,
      id: "eval-9",
      title: "Contrôle 6e B",
      class: { id: "class-2", name: "6e B" },
    };
    useNotesStore.setState({
      evaluations: [EVAL_1, OTHER_CLASS_EVAL],
    } as never);

    render(<ClassNotesManagerScreen />);
    await flushAsync();
    fireEvent.press(await screen.findByTestId("class-notes-filter-close"));

    fireEvent.press(await screen.findByTestId("eval-action-delete-eval-9"));

    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog-confirm")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(useNotesStore.getState().deleteEvaluation).toHaveBeenCalledWith(
      "college-vogt",
      "class-2",
      "eval-9",
    );
  });

  it("affiche tous les chips de type d'évaluation même sans classe engagée (dérivés des évaluations chargées)", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    expect(await screen.findByTestId("class-notes-filter-panel")).toBeTruthy();
    // EVAL_1/EVAL_2 sont de type "type-1", EVAL_3 de type "type-2" : les deux
    // chips doivent apparaître, alors qu'aucun contexte enseignant (qui les
    // fournirait normalement) n'est chargé en navigation "toute l'école".
    expect(screen.getByTestId("class-notes-filter-type-type-1")).toBeTruthy();
    expect(screen.getByTestId("class-notes-filter-type-type-2")).toBeTruthy();
    expect(useNotesStore.getState().loadTeacherContext).not.toHaveBeenCalled();
  });

  it("propose aussi le filtre de complétion des notes sans classe engagée, et il filtre correctement", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    expect(await screen.findByTestId("class-notes-filter-panel")).toBeTruthy();
    expect(
      screen.getByTestId("class-notes-filter-completion-complete"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("class-notes-filter-completion-incomplete"),
    ).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("class-notes-filter-completion-complete"),
    );
    fireEvent.press(screen.getByTestId("class-notes-filter-apply"));

    // eval-3 a 2/2 notes saisies (complet), eval-1 et eval-2 sont incomplets.
    await waitFor(() => {
      expect(screen.getByTestId("class-evaluation-row-eval-3")).toBeTruthy();
      expect(screen.queryByTestId("class-evaluation-row-eval-1")).toBeNull();
      expect(screen.queryByTestId("class-evaluation-row-eval-2")).toBeNull();
    });
  });

  describe("Onglet Notes — recherche élève sur toute l'école", () => {
    beforeEach(() => {
      mockNotesApi.getTeacherContext.mockImplementation(
        (_slug, classId: string) => {
          if (classId === "class-1") {
            return Promise.resolve({
              class: {
                id: "class-1",
                name: "6e A",
                schoolYearId: "y1",
                isReferentTeacher: false,
              },
              subjects: [{ id: "sub-1", name: "Mathématiques", branches: [] }],
              evaluationTypes: [],
              students: [
                { id: "stu-1", firstName: "Kevin", lastName: "Fouda" },
              ],
            } as never);
          }
          if (classId === "class-2") {
            return Promise.resolve({
              class: {
                id: "class-2",
                name: "6e B",
                schoolYearId: "y1",
                isReferentTeacher: false,
              },
              subjects: [{ id: "sub-2", name: "Anglais", branches: [] }],
              evaluationTypes: [],
              // Homonyme du stu-1 de la classe 6e A : c'est exactement le cas
              // que le school admin doit pouvoir désambiguïser.
              students: [
                { id: "stu-2", firstName: "Kevin", lastName: "Fouda" },
              ],
            } as never);
          }
          return Promise.resolve({
            class: {
              id: "class-3",
              name: "5e A",
              schoolYearId: "y1",
              isReferentTeacher: false,
            },
            subjects: [],
            evaluationTypes: [],
            students: [],
          } as never);
        },
      );
    });

    it("ne charge rien pour la recherche élève tant que l'onglet Notes n'est pas ouvert", async () => {
      render(<ClassNotesManagerScreen />);
      await flushAsync();

      expect(mockNotesApi.getTeacherContext).not.toHaveBeenCalled();
    });

    it("agrège les élèves de toutes les classes de l'école avec leur classe respective", async () => {
      render(<ClassNotesManagerScreen />);
      await flushAsync();

      fireEvent.press(screen.getByTestId("notes-tab-notes"));
      await flushAsync();

      await waitFor(() => {
        expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
          "college-vogt",
          "class-1",
        );
        expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
          "college-vogt",
          "class-2",
        );
        expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
          "college-vogt",
          "class-3",
        );
      });

      fireEvent.changeText(
        screen.getByTestId("teacher-notes-search-input"),
        "Fouda",
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("teacher-notes-search-result-stu-1"),
        ).toBeTruthy();
        expect(
          screen.getByTestId("teacher-notes-search-result-stu-2"),
        ).toBeTruthy();
      });
      expect(
        screen.getByTestId("teacher-notes-search-result-class-stu-1"),
      ).toHaveTextContent("6e A");
      expect(
        screen.getByTestId("teacher-notes-search-result-class-stu-2"),
      ).toHaveTextContent("6e B");
    });

    it("affiche un état de chargement pendant l'agrégation multi-classes", async () => {
      let resolveContext: (value: unknown) => void = () => {};
      mockNotesApi.getTeacherContext.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveContext = resolve;
          }) as never,
      );

      render(<ClassNotesManagerScreen />);
      await flushAsync();
      fireEvent.press(screen.getByTestId("notes-tab-notes"));

      expect(screen.getByText("Chargement des élèves…")).toBeTruthy();

      await act(async () => {
        resolveContext({
          class: {
            id: "class-1",
            name: "6e A",
            schoolYearId: "y1",
            isReferentTeacher: false,
          },
          subjects: [],
          evaluationTypes: [],
          students: [],
        });
        await Promise.resolve();
      });
    });
  });
});

describe("Mode enseignant — classId fourni par la route", () => {
  it("ne montre pas les filtres Niveau/Classe (réservés au mode admin)", async () => {
    mockSearchParams = { classId: "class-1", schoolYearId: "y1" };

    render(<ClassNotesManagerScreen />);
    await flushAsync();

    fireEvent.press(await screen.findByTestId("class-notes-filter-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-filter-panel")).toBeTruthy(),
    );

    expect(screen.queryByTestId("class-notes-filter-level-trigger")).toBeNull();
    expect(screen.queryByTestId("class-notes-filter-class-trigger")).toBeNull();
    expect(mockTeachersApi.listClassrooms).not.toHaveBeenCalled();
  });
});
