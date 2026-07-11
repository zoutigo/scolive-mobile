import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { subjectsApi } from "../../src/api/subjects.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import {
  SubjectsAdminScreen,
  subjectFormSchema,
} from "../../src/components/subjects/SubjectsAdminScreen";
import type { AuthUser } from "../../src/types/auth.types";
import type { CurriculumRow } from "../../src/types/curriculums.types";
import type { SubjectRow } from "../../src/types/subjects.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/subjects.api");
jest.mock("../../src/api/curriculums.api");

const mockBack = jest.fn();
const mockNavigate = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    navigate: mockNavigate,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockOpenDrawer = jest.fn();
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: mockOpenDrawer }),
}));

let mockAuthState: { schoolSlug: string | null; user: AuthUser | null };
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => mockAuthState,
}));

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: (selector: (state: unknown) => unknown) =>
    selector({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    }),
}));

const mockSubjectsApi = subjectsApi as jest.Mocked<typeof subjectsApi>;
const mockCurriculumsApi = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

let subjectsState: SubjectRow[];
let curriculumsState: CurriculumRow[];

function makeSchoolAdminUser(): AuthUser {
  return {
    id: "school-admin-1",
    firstName: "Sarah",
    lastName: "Moukouri",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    profileCompleted: true,
    role: "SCHOOL_ADMIN",
    activeRole: "SCHOOL_ADMIN",
    schoolName: "Collège Vogt",
  };
}

function makeCurriculum(
  id: string,
  academicLevelLabel: string,
  trackLabel: string | null,
): CurriculumRow {
  return {
    id,
    name: `${academicLevelLabel}${trackLabel ? ` - ${trackLabel}` : ""}`,
    academicLevelId: `level-${id}`,
    trackId: trackLabel ? `track-${id}` : null,
    academicLevel: { id: `level-${id}`, code: id, label: academicLevelLabel },
    track: trackLabel
      ? { id: `track-${id}`, code: `${id}-t`, label: trackLabel }
      : null,
    _count: { classes: 0, subjects: 0 },
  };
}

function seedApiState() {
  subjectsState = [
    {
      id: "subject-1",
      schoolId: "school-1",
      name: "Mathématiques",
      createdAt: "2026-01-10T08:00:00.000Z",
      updatedAt: "2026-01-10T08:00:00.000Z",
      branches: [
        { id: "branch-1", subjectId: "subject-1", name: "Algèbre", code: null },
      ],
      curriculumSubjects: [
        {
          id: "cs-1",
          curriculumId: "curriculum-6e",
          isMandatory: true,
          coefficient: null,
          weeklyHours: null,
          curriculum: {
            id: "curriculum-6e",
            name: "6ème",
            academicLevel: { id: "level-6e", code: "6e", label: "6ème" },
            track: null,
          },
        },
      ],
      _count: {
        assignments: 0,
        studentGrades: 0,
        curriculumSubjects: 1,
        classOverrides: 0,
      },
    },
    {
      id: "subject-2",
      schoolId: "school-1",
      name: "Français",
      createdAt: "2026-01-11T08:00:00.000Z",
      updatedAt: "2026-01-11T08:00:00.000Z",
      branches: [],
      curriculumSubjects: [],
      _count: {
        assignments: 0,
        studentGrades: 0,
        curriculumSubjects: 0,
        classOverrides: 0,
      },
    },
  ];
  curriculumsState = [
    makeCurriculum("curriculum-6e", "6ème", null),
    makeCurriculum("curriculum-5e", "5ème", null),
  ];
}

beforeEach(() => {
  jest.clearAllMocks();
  seedApiState();
  mockAuthState = {
    schoolSlug: "college-vogt",
    user: makeSchoolAdminUser(),
  };

  mockSubjectsApi.listSubjects.mockImplementation(async () => subjectsState);
  mockCurriculumsApi.listCurriculums.mockImplementation(
    async () => curriculumsState,
  );

  mockSubjectsApi.createSubject.mockImplementation(async (_slug, payload) => {
    const created: SubjectRow = {
      id: "subject-created",
      schoolId: "school-1",
      name: payload.name ?? "",
      createdAt: "2026-05-14T10:00:00.000Z",
      updatedAt: "2026-05-14T10:00:00.000Z",
      branches: [],
      curriculumSubjects: [],
      _count: {
        assignments: 0,
        studentGrades: 0,
        curriculumSubjects: 0,
        classOverrides: 0,
      },
    };
    subjectsState = [...subjectsState, created];
    return created;
  });
  mockSubjectsApi.updateSubject.mockImplementation(
    async (_slug, subjectId, payload) => {
      subjectsState = subjectsState.map((entry) =>
        entry.id === subjectId
          ? { ...entry, name: payload.name ?? entry.name }
          : entry,
      );
      return subjectsState.find((entry) => entry.id === subjectId)!;
    },
  );
  mockSubjectsApi.deleteSubject.mockImplementation(async (_slug, subjectId) => {
    subjectsState = subjectsState.filter((entry) => entry.id !== subjectId);
    return { success: true };
  });
  mockSubjectsApi.createSubjectBranch.mockImplementation(
    async (_slug, subjectId, payload) => ({
      id: "branch-created",
      subjectId,
      name: payload.name ?? "",
      code: payload.code ?? null,
    }),
  );
  mockSubjectsApi.updateSubjectBranch.mockImplementation(
    async (_slug, branchId, payload) => ({
      id: branchId,
      subjectId: "subject-1",
      name: payload.name ?? "",
      code: payload.code ?? null,
    }),
  );
  mockSubjectsApi.deleteSubjectBranch.mockImplementation(async () => ({
    success: true,
  }));
  mockCurriculumsApi.upsertCurriculumSubject.mockImplementation(
    async (_slug, curriculumId, payload) => ({
      id: "cs-created",
      subjectId: payload.subjectId,
      isMandatory: payload.isMandatory ?? true,
      coefficient: payload.coefficient ?? null,
      weeklyHours: payload.weeklyHours ?? null,
      subject: { id: payload.subjectId, name: "" },
    }),
  );
  mockCurriculumsApi.deleteCurriculumSubject.mockImplementation(async () => ({
    success: true,
  }));
});

// ---------------------------------------------------------------------------
// Schema unit tests
// ---------------------------------------------------------------------------

describe("subjectFormSchema", () => {
  it("exige un nom non vide", () => {
    const result = subjectFormSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.name).toContain(
      "Le nom de la matière est obligatoire.",
    );
  });

  it("valide un nom renseigné", () => {
    const result = subjectFormSchema.safeParse({ name: "Mathématiques" });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Chargement et liste
// ---------------------------------------------------------------------------

describe("SubjectsAdminScreen — chargement et liste", () => {
  it("charge le module et affiche les matières avec leurs niveaux et spécialités", async () => {
    render(<SubjectsAdminScreen />);

    expect(await screen.findByTestId("subjects-admin-header")).toBeTruthy();
    expect(screen.getByText("2 matières")).toBeTruthy();
    expect(
      await screen.findByTestId("subjects-admin-subject-row-subject-1"),
    ).toBeTruthy();
    expect(screen.getByText("6ème")).toBeTruthy();
    expect(screen.getByText("Algèbre")).toBeTruthy();
    expect(screen.getByText("Aucun niveau affecté")).toBeTruthy();
  });

  it("affiche un banner d'erreur si le chargement initial échoue", async () => {
    mockSubjectsApi.listSubjects.mockRejectedValueOnce(
      new Error("Erreur réseau"),
    );

    render(<SubjectsAdminScreen />);

    expect(
      await screen.findByTestId("subjects-admin-error-banner"),
    ).toBeTruthy();
  });

  it("affiche le fallback verrouillé hors rôle admin", async () => {
    mockAuthState = {
      schoolSlug: "college-vogt",
      user: {
        ...makeSchoolAdminUser(),
        role: "TEACHER",
        activeRole: "TEACHER",
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
      },
    };

    render(<SubjectsAdminScreen />);

    expect(
      await screen.findByText("Module réservé aux comptes admin"),
    ).toBeTruthy();
    expect(mockSubjectsApi.listSubjects).not.toHaveBeenCalled();
  });

  it("le FAB est visible sur le tab liste et masqué sur le tab aide", async () => {
    render(<SubjectsAdminScreen />);
    expect(await screen.findByTestId("subjects-admin-fab")).toBeTruthy();

    fireEvent.press(await screen.findByTestId("subjects-admin-tab-help"));
    expect(screen.queryByTestId("subjects-admin-fab")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tab forms — création
// ---------------------------------------------------------------------------

describe("SubjectsAdminScreen — tab forms / création matière", () => {
  it("FAB → tab forms actif avec hero, nom, niveaux et spécialités", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-fab"));

    expect(await screen.findByTestId("subjects-admin-forms-tab")).toBeTruthy();
    expect(screen.getByTestId("subjects-admin-form-hero")).toBeTruthy();
    expect(screen.getByTestId("subjects-admin-form-name")).toBeTruthy();
    expect(
      await screen.findByTestId("subjects-admin-form-niveau-curriculum-6e"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("subjects-admin-form-niveau-curriculum-5e"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("subjects-admin-form-new-branch-name"),
    ).toBeTruthy();
  });

  it("submit sur formulaire vide → erreur nom sans appel API", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-fab"));
    await screen.findByTestId("subjects-admin-form-content");

    fireEvent.press(screen.getByTestId("subjects-admin-form-submit"));

    expect(
      await screen.findByTestId("subjects-admin-form-name-error"),
    ).toBeTruthy();
    expect(mockSubjectsApi.createSubject).not.toHaveBeenCalled();
  });

  it("crée une matière seule (aucun niveau, aucune spécialité)", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-fab"));
    await screen.findByTestId("subjects-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("subjects-admin-form-name"),
      "Histoire",
    );
    fireEvent.press(screen.getByTestId("subjects-admin-form-submit"));

    await waitFor(() => {
      expect(mockSubjectsApi.createSubject).toHaveBeenCalledWith(
        "college-vogt",
        { name: "Histoire" },
      );
    });
    expect(mockCurriculumsApi.upsertCurriculumSubject).not.toHaveBeenCalled();
    expect(mockSubjectsApi.createSubjectBranch).not.toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Matière créée" }),
    );
  });

  it("crée une matière avec un niveau sélectionné et une spécialité ajoutée", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-fab"));
    await screen.findByTestId("subjects-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("subjects-admin-form-name"),
      "Physique-Chimie",
    );
    fireEvent.press(
      await screen.findByTestId("subjects-admin-form-niveau-curriculum-5e"),
    );
    fireEvent.changeText(
      screen.getByTestId("subjects-admin-form-new-branch-name"),
      "Chimie",
    );
    fireEvent.press(screen.getByTestId("subjects-admin-form-add-branch"));

    expect(screen.getByDisplayValue("Chimie")).toBeTruthy();

    fireEvent.press(screen.getByTestId("subjects-admin-form-submit"));

    await waitFor(() => {
      expect(mockSubjectsApi.createSubject).toHaveBeenCalledWith(
        "college-vogt",
        { name: "Physique-Chimie" },
      );
    });
    await waitFor(() => {
      expect(mockCurriculumsApi.upsertCurriculumSubject).toHaveBeenCalledWith(
        "college-vogt",
        "curriculum-5e",
        { subjectId: "subject-created" },
      );
    });
    await waitFor(() => {
      expect(mockSubjectsApi.createSubjectBranch).toHaveBeenCalledWith(
        "college-vogt",
        "subject-created",
        { name: "Chimie", code: undefined },
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Matière créée" }),
    );
  });

  it("bouton d'ajout de spécialité désactivé tant que le nom est vide", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-fab"));
    await screen.findByTestId("subjects-admin-form-content");

    const addBtn = screen.getByTestId("subjects-admin-form-add-branch");
    expect(addBtn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it("erreur création → showError + formulaire toujours visible", async () => {
    mockSubjectsApi.createSubject.mockRejectedValueOnce(
      new Error("Matière déjà existante"),
    );

    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-fab"));
    await screen.findByTestId("subjects-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("subjects-admin-form-name"),
      "Mathématiques",
    );
    fireEvent.press(screen.getByTestId("subjects-admin-form-submit"));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Opération impossible",
          message: "Matière déjà existante",
        }),
      );
    });
    expect(screen.getByTestId("subjects-admin-forms-tab")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tab forms — édition
// ---------------------------------------------------------------------------

describe("SubjectsAdminScreen — édition d'une matière", () => {
  it("bouton édition → formulaire pré-rempli (nom, niveau coché, spécialité listée)", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("subjects-admin-subject-edit-subject-1"),
    );

    expect(await screen.findByTestId("subjects-admin-forms-tab")).toBeTruthy();
    expect(screen.getByText("Modifier la matière")).toBeTruthy();
    expect(screen.getByDisplayValue("Mathématiques")).toBeTruthy();
    expect(screen.getByDisplayValue("Algèbre")).toBeTruthy();
  });

  it("modifie le nom, ajoute un niveau et retire une spécialité", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("subjects-admin-subject-edit-subject-1"),
    );
    await screen.findByTestId("subjects-admin-form-content");

    fireEvent.changeText(
      screen.getByTestId("subjects-admin-form-name"),
      "Mathématiques avancées",
    );
    fireEvent.press(
      screen.getByTestId("subjects-admin-form-niveau-curriculum-5e"),
    );
    fireEvent.press(
      screen.getByTestId("subjects-admin-form-branch-remove-branch-1"),
    );
    fireEvent.press(screen.getByTestId("subjects-admin-form-submit"));

    await waitFor(() => {
      expect(mockSubjectsApi.updateSubject).toHaveBeenCalledWith(
        "college-vogt",
        "subject-1",
        { name: "Mathématiques avancées" },
      );
    });
    await waitFor(() => {
      expect(mockCurriculumsApi.upsertCurriculumSubject).toHaveBeenCalledWith(
        "college-vogt",
        "curriculum-5e",
        { subjectId: "subject-1" },
      );
    });
    await waitFor(() => {
      expect(mockSubjectsApi.deleteSubjectBranch).toHaveBeenCalledWith(
        "college-vogt",
        "branch-1",
      );
    });
    expect(mockCurriculumsApi.deleteCurriculumSubject).not.toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Matière modifiée" }),
    );
  });

  it("décocher un niveau déjà affecté déclenche la suppression de l'affectation", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("subjects-admin-subject-edit-subject-1"),
    );
    await screen.findByTestId("subjects-admin-form-content");

    fireEvent.press(
      await screen.findByTestId("subjects-admin-form-niveau-curriculum-6e"),
    );
    fireEvent.press(screen.getByTestId("subjects-admin-form-submit"));

    await waitFor(() => {
      expect(mockCurriculumsApi.deleteCurriculumSubject).toHaveBeenCalledWith(
        "college-vogt",
        "curriculum-6e",
        "subject-1",
      );
    });
    expect(mockCurriculumsApi.upsertCurriculumSubject).not.toHaveBeenCalled();
  });

  it("annuler depuis édition → retour au tab liste sans appel API", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("subjects-admin-subject-edit-subject-1"),
    );
    await screen.findByTestId("subjects-admin-form-content");

    fireEvent.press(screen.getByTestId("subjects-admin-form-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("subjects-admin-forms-tab")).toBeNull();
    });
    expect(mockSubjectsApi.updateSubject).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------

describe("SubjectsAdminScreen — suppression d'une matière", () => {
  it("supprime une matière et affiche un toast succès", async () => {
    render(<SubjectsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("subjects-admin-subject-delete-subject-2"),
    );
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockSubjectsApi.deleteSubject).toHaveBeenCalledWith(
        "college-vogt",
        "subject-2",
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Matière supprimée" }),
    );
  });

  it("suppression bloquée par le backend → showError, matière conservée", async () => {
    mockSubjectsApi.deleteSubject.mockRejectedValueOnce(
      new Error(
        "Cannot delete a subject used by curriculums, assignments, class overrides or student grades",
      ),
    );

    render(<SubjectsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("subjects-admin-subject-delete-subject-1"),
    );
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Suppression impossible" }),
      );
    });
    expect(
      await screen.findByTestId("subjects-admin-subject-row-subject-1"),
    ).toBeTruthy();
  });
});
