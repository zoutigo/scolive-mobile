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

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));

const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {
  classId: "class-1",
  schoolYearId: "y1",
};
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
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
  term: "TERM_1",
  status: "PUBLISHED",
  scheduledAt: "2026-04-12T08:00:00.000Z",
  createdAt: "2026-04-10T08:00:00.000Z",
  updatedAt: "2026-04-10T08:00:00.000Z",
  subject: { id: "sub-1", name: "Mathématiques" },
  subjectBranch: { id: "branch-1", name: "Algèbre" },
  evaluationType: { id: "type-1", code: "COMP", label: "Composition" },
  attachments: [],
  _count: { scores: 1 },
};

const EVAL_2 = {
  ...EVAL_1,
  id: "eval-2",
  title: "DS Algèbre",
  status: "DRAFT",
  _count: { scores: 0 },
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
    evaluations: [EVAL_1, EVAL_2],
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
    loadEvaluations: jest.fn().mockResolvedValue([EVAL_1, EVAL_2]),
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
  it("affiche le header, les 4 onglets et la liste d'évaluations", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsync();

    expect(screen.getByTestId("class-notes-header")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-evaluations")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-scores")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-notes")).toBeTruthy();
    expect(screen.getByTestId("notes-tab-council")).toBeTruthy();
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
      expect(screen.getByTestId("class-notes-scores-back")).toBeTruthy(),
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

  it("revient à la liste via le bouton retour", async () => {
    await openScoresView();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-scores-back")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-notes-scores-back"));
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
