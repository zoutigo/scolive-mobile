/**
 * Tests du module SchoolAdminDisciplineScreen
 *
 * Couverture :
 *  — Unitaires  : rendu, chargement meta, tabs, filtres année/classe
 *  — Fonctionnels : recherche élève, navigation vers fiche, vue par classe,
 *                   filtrage événements par élève, onglet carnets
 *  — Intégration : flux CRUD complet (créer / modifier / supprimer événement)
 *                   avec vérification store discipline
 */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SchoolAdminDisciplineScreen } from "../../src/components/discipline/SchoolAdminDisciplineScreen";
import { teachersApi } from "../../src/api/teachers.api";
import { notesApi } from "../../src/api/notes.api";
import { disciplineApi } from "../../src/api/discipline.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/teachers.api");
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Jean",
      lastName: "Foko",
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
      schoolName: "Collège Vogt",
      memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    },
  }),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockTeachersApi = teachersApi as jest.Mocked<typeof teachersApi>;
const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockDisciplineApi = disciplineApi as jest.Mocked<typeof disciplineApi>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const YEAR_2026 = { id: "sy-2026", label: "2025-2026", isActive: true };
const YEAR_2025 = { id: "sy-2025", label: "2024-2025", isActive: false };

const CLASS_6A = {
  id: "class-6a",
  name: "6e A",
  schoolYear: { id: "sy-2026", label: "2025-2026" },
};
const CLASS_5B = {
  id: "class-5b",
  name: "5e B",
  schoolYear: { id: "sy-2026", label: "2025-2026" },
};
const CLASS_OLD = {
  id: "class-old",
  name: "6e C",
  schoolYear: { id: "sy-2025", label: "2024-2025" },
};

const STUDENT_MBELE = { id: "student-1", firstName: "Lisa", lastName: "MBELE" };
const STUDENT_NTAMACK = {
  id: "student-2",
  firstName: "Remi",
  lastName: "NTAMACK",
};

const EVENT_1 = makeLifeEvent({
  id: "event-1",
  studentId: "student-1",
  classId: "class-6a",
  type: "ABSENCE",
  reason: "Absence injustifiée",
  authorUserId: "teacher-1",
});
const EVENT_2 = makeLifeEvent({
  id: "event-2",
  studentId: "student-2",
  classId: "class-6a",
  type: "RETARD",
  reason: "Bus en retard",
  authorUserId: "teacher-2",
});

function setupDefaultMocks() {
  mockTeachersApi.listSchoolYears.mockResolvedValue([YEAR_2026, YEAR_2025]);
  mockTeachersApi.listClassrooms.mockResolvedValue([
    CLASS_6A,
    CLASS_5B,
    CLASS_OLD,
  ]);
  mockNotesApi.getTeacherContext.mockResolvedValue({
    class: { id: "class-6a", name: "6e A", schoolYearId: "sy-2026" },
    subjects: [],
    evaluationTypes: [],
    students: [STUDENT_MBELE, STUDENT_NTAMACK],
  });
  mockDisciplineApi.list.mockImplementation(async (_slug, studentId) => {
    if (studentId === "student-1") return [EVENT_1];
    if (studentId === "student-2") return [EVENT_2];
    return [];
  });
  mockDisciplineApi.create.mockImplementation(
    async (_slug, studentId, payload) =>
      makeLifeEvent({
        id: "created-1",
        studentId,
        classId: "class-6a",
        reason: payload.reason,
        type: payload.type,
      }),
  );
  mockDisciplineApi.update.mockResolvedValue(
    makeLifeEvent({ id: "event-1", reason: "Modifiée" }),
  );
  mockDisciplineApi.remove.mockResolvedValue(undefined);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockClear();
  useDisciplineStore.getState().reset();
  useSuccessToastStore.getState().hide();
  setupDefaultMocks();
});

// ── Unitaires ─────────────────────────────────────────────────────────────────

describe("SchoolAdminDisciplineScreen — rendu initial", () => {
  it("affiche le header Discipline avec le nom de l'école en sous-titre", async () => {
    render(<SchoolAdminDisciplineScreen />);

    expect(screen.getByTestId("admin-discipline-header")).toBeOnTheScreen();
    expect(screen.getByTestId("admin-discipline-title")).toBeOnTheScreen();
    expect(screen.getByTestId("admin-discipline-back")).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByTestId("admin-discipline-subtitle")).toHaveTextContent(
        "Collège Vogt",
      );
    });
  });

  it("charge les années et classes au montage", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(mockTeachersApi.listSchoolYears).toHaveBeenCalledWith(
        "college-vogt",
      );
      expect(mockTeachersApi.listClassrooms).toHaveBeenCalledWith(
        "college-vogt",
      );
    });
  });

  it("affiche les deux onglets principaux Élèves et Par classe", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-main-tab-students"),
      ).toBeOnTheScreen();
      expect(
        screen.getByTestId("admin-discipline-main-tab-class"),
      ).toBeOnTheScreen();
    });
  });

  it("affiche une erreur si le chargement des meta échoue", async () => {
    mockTeachersApi.listSchoolYears.mockRejectedValue(new Error("NET"));
    mockTeachersApi.listClassrooms.mockRejectedValue(new Error("NET"));

    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-meta-error"),
      ).toBeOnTheScreen();
    });
  });
});

// ── Fonctionnels — onglet Élèves ──────────────────────────────────────────────

describe("SchoolAdminDisciplineScreen — onglet Élèves", () => {
  it("affiche un état vide tant qu'aucune classe ni recherche n'est saisie", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(screen.getByText("Recherchez un élève")).toBeOnTheScreen();
    });
  });

  it("affiche le champ de recherche même sans classe sélectionnée", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-filters"),
      ).toBeOnTheScreen();
    });

    expect(
      screen.getByTestId("admin-discipline-student-search"),
    ).toBeOnTheScreen();
  });

  it("filtre les classes affichées selon l'année sélectionnée", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-year-trigger"),
      ).toBeOnTheScreen();
    });

    // Ouvrir le sélecteur d'année et choisir 2024-2025
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-year-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-year-option-sy-2025"),
    );

    // Ouvrir le sélecteur de classe → seule la classe ancienne doit apparaître
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    expect(
      screen.getByTestId("admin-discipline-students-class-option-class-old"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId("admin-discipline-students-class-option-class-6a"),
    ).toBeNull();
  });

  it("charge les élèves quand une classe est sélectionnée", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-6a",
      );
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-student-list"),
      ).toBeOnTheScreen();
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
      expect(screen.getByTestId("student-row-student-2")).toBeOnTheScreen();
    });

    expect(screen.getByText("MBELE Lisa")).toBeOnTheScreen();
    expect(screen.getByText("NTAMACK Remi")).toBeOnTheScreen();
  });

  it("affiche le nom de la classe dans chaque ligne d'élève", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
    });

    const rows = screen.getAllByText("6e A");
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it("filtre les élèves par saisie dans la barre de recherche après sélection de classe", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
    });

    fireEvent.changeText(
      screen.getByTestId("admin-discipline-student-search"),
      "mbele",
    );

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
      expect(screen.queryByTestId("student-row-student-2")).toBeNull();
    });
  });

  it("affiche un état vide si la recherche ne correspond à aucun élève (avec classe)", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
    });

    fireEvent.changeText(
      screen.getByTestId("admin-discipline-student-search"),
      "xxxxinexistant",
    );

    await waitFor(() => {
      expect(
        screen.getByText("Aucun élève ne correspond à cette recherche."),
      ).toBeOnTheScreen();
    });
  });

  it("recherche dans toutes les classes quand aucune classe n'est sélectionnée", async () => {
    render(<SchoolAdminDisciplineScreen />);

    // Attendre le chargement en arrière-plan de tous les élèves
    await waitFor(() => {
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalled();
    });

    // Le champ de recherche est visible sans sélection de classe
    const searchInput = screen.getByTestId("admin-discipline-student-search");
    expect(searchInput).toBeOnTheScreen();

    fireEvent.changeText(searchInput, "mbele");

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
    });

    // NTAMACK ne correspond pas à "mbele"
    expect(screen.queryByTestId("student-row-student-2")).toBeNull();
  });

  it("recherche toutes classes : aucun résultat si le nom ne correspond pas", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalled();
    });

    fireEvent.changeText(
      screen.getByTestId("admin-discipline-student-search"),
      "xxxxinexistant",
    );

    await waitFor(() => {
      expect(
        screen.getByText("Aucun élève ne correspond à cette recherche."),
      ).toBeOnTheScreen();
    });
  });

  it("navigue avec le nom de classe de l'élève depuis la recherche toutes classes", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalled();
    });

    fireEvent.changeText(
      screen.getByTestId("admin-discipline-student-search"),
      "mbele",
    );

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("student-row-student-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/discipline-student/[studentId]",
      params: expect.objectContaining({
        studentId: "student-1",
        studentName: "MBELE Lisa",
        className: expect.stringMatching(/6e A|6e B|5e B/),
      }),
    });
  });

  it("navigue vers DisciplineStudentScreen avec le bon studentId, nom et classe", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("student-row-student-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/discipline-student/[studentId]",
      params: expect.objectContaining({
        studentId: "student-1",
        studentName: "MBELE Lisa",
        className: "6e A",
      }),
    });
  });

  it("affiche une erreur si le chargement du contexte classe échoue", async () => {
    mockNotesApi.getTeacherContext.mockRejectedValue(new Error("CTX_ERROR"));

    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-context-error"),
      ).toBeOnTheScreen();
    });
  });
});

// ── Fonctionnels — onglet Par classe ──────────────────────────────────────────

describe("SchoolAdminDisciplineScreen — onglet Par classe", () => {
  async function switchToClassTab() {
    render(<SchoolAdminDisciplineScreen />);
    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-main-tab-class"),
      ).toBeOnTheScreen();
    });
    fireEvent.press(screen.getByTestId("admin-discipline-main-tab-class"));
  }

  it("affiche un état vide avant toute sélection de classe", async () => {
    await switchToClassTab();

    await waitFor(() => {
      expect(screen.getByText("Sélectionnez une classe")).toBeOnTheScreen();
    });
  });

  it("charge les événements de classe après sélection et affiche les sous-onglets", async () => {
    await switchToClassTab();

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-class-trigger"));
    fireEvent.press(
      screen.getByTestId("admin-discipline-class-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(mockDisciplineApi.list).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-tab-events"),
      ).toBeOnTheScreen();
      expect(
        screen.getByTestId("admin-discipline-class-tab-carnets"),
      ).toBeOnTheScreen();
    });
  });

  it("affiche les événements de classe avec le nom de l'élève en headline", async () => {
    await switchToClassTab();

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-class-trigger"));
    fireEvent.press(
      screen.getByTestId("admin-discipline-class-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-events-list"),
      ).toBeOnTheScreen();
    });

    await waitFor(() => {
      expect(screen.getByText("Absence injustifiée")).toBeOnTheScreen();
      expect(screen.getByText("Bus en retard")).toBeOnTheScreen();
    });
  });

  it("filtre les événements par élève via le sélecteur dans l'onglet Événements", async () => {
    await switchToClassTab();

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-class-trigger"));
    fireEvent.press(
      screen.getByTestId("admin-discipline-class-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(screen.getByText("Absence injustifiée")).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-class-event-student-trigger"),
    );
    fireEvent.press(
      screen.getByTestId(
        "admin-discipline-class-event-student-option-student-1",
      ),
    );

    expect(screen.getByText("Absence injustifiée")).toBeOnTheScreen();
    expect(screen.queryByText("Bus en retard")).toBeNull();
  });

  it("ouvre le formulaire depuis le FAB", async () => {
    await switchToClassTab();

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-class-trigger"));
    fireEvent.press(
      screen.getByTestId("admin-discipline-class-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-discipline-fab")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-fab"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-class-discipline-form-sheet"),
      ).toBeOnTheScreen();
    });
  });

  it("bascule vers l'onglet Carnets et affiche le sélecteur d'élève", async () => {
    await switchToClassTab();

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-class-trigger"));
    fireEvent.press(
      screen.getByTestId("admin-discipline-class-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-tab-carnets"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-tab-carnets"));

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-carnets-card"),
      ).toBeOnTheScreen();
    });
  });

  it("affiche la synthèse DisciplineSummaryOverview quand un élève est sélectionné dans Carnets", async () => {
    useDisciplineStore.setState({
      eventsMap: { "student-1": [EVENT_1], "student-2": [EVENT_2] },
    });

    await switchToClassTab();

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-class-trigger"));
    fireEvent.press(
      screen.getByTestId("admin-discipline-class-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-tab-carnets"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-tab-carnets"));

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-carnet-student-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(
      screen.getByTestId("admin-discipline-class-carnet-student-trigger"),
    );
    fireEvent.press(
      screen.getByTestId(
        "admin-discipline-class-carnet-student-option-student-1",
      ),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-carnet-summary"),
      ).toBeOnTheScreen();
    });
  });
});

// ── Intégration — CRUD complet ─────────────────────────────────────────────────

describe("SchoolAdminDisciplineScreen — intégration CRUD", () => {
  async function setupClassView() {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-main-tab-class"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-main-tab-class"));

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-class-class-trigger"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("admin-discipline-class-class-trigger"));
    fireEvent.press(
      screen.getByTestId("admin-discipline-class-class-option-class-6a"),
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-discipline-fab")).toBeOnTheScreen();
    });
  }

  it("crée un événement discipline et met à jour le store", async () => {
    await setupClassView();

    fireEvent.press(screen.getByTestId("admin-discipline-fab"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-class-discipline-form-sheet"),
      ).toBeOnTheScreen();
    });

    // Sélectionner l'élève
    fireEvent.press(screen.getByTestId("discipline-form-student-trigger"));
    fireEvent.press(
      screen.getByTestId("discipline-form-student-option-student-1"),
    );

    // Remplir le formulaire
    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Comportement perturbateur",
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-occurred-at"),
      "2026-05-15T09:00",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("discipline-form-submit"));
    });

    await waitFor(() => {
      expect(mockDisciplineApi.create).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        expect.objectContaining({ reason: "Comportement perturbateur" }),
      );
    });

    const store = useDisciplineStore.getState();
    expect(store.eventsMap["student-1"]).toContainEqual(
      expect.objectContaining({ id: "created-1" }),
    );
  });

  it("modifie un événement existant via le bouton Éditer", async () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [EVENT_1],
        "student-2": [EVENT_2],
      },
    });

    await setupClassView();

    await waitFor(() => {
      expect(screen.getByText("Absence injustifiée")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId(`edit-event-${EVENT_1.id}`));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-class-discipline-form-sheet"),
      ).toBeOnTheScreen();
    });

    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Modifiée",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("discipline-form-submit"));
    });

    await waitFor(() => {
      expect(mockDisciplineApi.update).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        EVENT_1.id,
        expect.objectContaining({ reason: "Modifiée" }),
      );
    });
  });

  it("supprime un événement discipline après confirmation", async () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [EVENT_1],
        "student-2": [EVENT_2],
      },
    });

    await setupClassView();

    await waitFor(() => {
      expect(screen.getByText("Absence injustifiée")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId(`delete-event-${EVENT_1.id}`));

    await waitFor(() => {
      expect(screen.getByTestId("delete-dialog")).toBeOnTheScreen();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("delete-dialog-confirm"));
    });

    await waitFor(() => {
      expect(mockDisciplineApi.remove).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        EVENT_1.id,
      );
    });

    const store = useDisciplineStore.getState();
    expect(store.eventsMap["student-1"]).not.toContainEqual(
      expect.objectContaining({ id: EVENT_1.id }),
    );
  });

  it("affiche une erreur toast si la création échoue", async () => {
    mockDisciplineApi.create.mockRejectedValue(new Error("SERVER_ERROR"));

    await setupClassView();

    fireEvent.press(screen.getByTestId("admin-discipline-fab"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-class-discipline-form-sheet"),
      ).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("discipline-form-student-trigger"));
    fireEvent.press(
      screen.getByTestId("discipline-form-student-option-student-1"),
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Test erreur",
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-occurred-at"),
      "2026-05-15T09:00",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("discipline-form-submit"));
    });

    await waitFor(() => {
      expect(useSuccessToastStore.getState().visible).toBe(true);
      expect(useSuccessToastStore.getState().variant).toBe("error");
    });
  });

  it("annule la suppression sans appeler l'API", async () => {
    useDisciplineStore.setState({
      eventsMap: { "student-1": [EVENT_1], "student-2": [] },
    });

    await setupClassView();

    await waitFor(() => {
      expect(screen.getByText("Absence injustifiée")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId(`delete-event-${EVENT_1.id}`));

    await waitFor(() => {
      expect(screen.getByTestId("delete-dialog")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("delete-dialog-cancel"));

    expect(mockDisciplineApi.remove).not.toHaveBeenCalled();
    expect(screen.getByText("Absence injustifiée")).toBeOnTheScreen();
  });
});

// ── Intégration — flux annuaire élève complet ─────────────────────────────────

describe("SchoolAdminDisciplineScreen — flux annuaire vers fiche élève", () => {
  it("sélection année → classe → recherche → tap élève → navigation correcte", async () => {
    render(<SchoolAdminDisciplineScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-discipline-students-year-trigger"),
      ).toBeOnTheScreen();
    });

    // Changer l'année (choisir 2024-2025)
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-year-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-year-option-sy-2025"),
    );

    // Vérifier que seule la classe de l'année 2024-2025 est disponible
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    expect(
      screen.getByTestId("admin-discipline-students-class-option-class-old"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId("admin-discipline-students-class-option-class-6a"),
    ).toBeNull();

    // Revenir à 2025-2026 et sélectionner 6e A
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-close"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-year-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-year-option-sy-2026"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("admin-discipline-students-class-option-class-6a"),
    );

    // Attendre chargement de la liste des élèves
    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-1")).toBeOnTheScreen();
    });

    fireEvent.changeText(
      screen.getByTestId("admin-discipline-student-search"),
      "ntamack",
    );

    await waitFor(() => {
      expect(screen.getByTestId("student-row-student-2")).toBeOnTheScreen();
      expect(screen.queryByTestId("student-row-student-1")).toBeNull();
    });

    fireEvent.press(screen.getByTestId("student-row-student-2"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/discipline-student/[studentId]",
      params: expect.objectContaining({
        studentId: "student-2",
        studentName: "NTAMACK Remi",
        className: "6e A",
      }),
    });
  });
});
