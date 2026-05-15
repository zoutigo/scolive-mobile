import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { CurriculumsAdminScreen } from "../../src/components/curriculums/CurriculumsAdminScreen";
import { curriculumsApi } from "../../src/api/curriculums.api";
import type {
  CurriculumAcademicLevel,
  CurriculumRow,
  CurriculumSubjectCatalogItem,
  CurriculumSubjectRow,
  CurriculumTrack,
} from "../../src/types/curriculums.types";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/curriculums.api");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
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

const mockCurriculumsApi = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

let levelsState: CurriculumAcademicLevel[];
let tracksState: CurriculumTrack[];
let subjectsState: CurriculumSubjectCatalogItem[];
let curriculumsState: CurriculumRow[];
let curriculumSubjectsState: Record<string, CurriculumSubjectRow[]>;

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

function seedApiState() {
  levelsState = [
    {
      id: "level-6e",
      code: "6EME",
      label: "Sixième",
      _count: { classes: 2, curriculums: 1 },
    },
  ];
  tracksState = [
    {
      id: "track-sc",
      code: "SCI",
      label: "Scientifique",
      _count: { classes: 0, curriculums: 0 },
    },
  ];
  subjectsState = [
    {
      id: "subject-math",
      name: "Mathématiques",
      branches: [],
      _count: {
        assignments: 0,
        studentGrades: 0,
        curriculumSubjects: 1,
        classOverrides: 0,
      },
    },
    {
      id: "subject-phys",
      name: "Physique",
      branches: [],
      _count: {
        assignments: 0,
        studentGrades: 0,
        curriculumSubjects: 0,
        classOverrides: 0,
      },
    },
  ];
  curriculumsState = [
    {
      id: "curr-1",
      name: "6EME - TRONC_COMMUN",
      academicLevelId: "level-6e",
      trackId: null,
      academicLevel: {
        id: "level-6e",
        code: "6EME",
        label: "Sixième",
      },
      track: null,
      _count: {
        classes: 1,
        subjects: 1,
      },
    },
    {
      id: "curr-2",
      name: "6EME - SCI",
      academicLevelId: "level-6e",
      trackId: "track-sc",
      academicLevel: {
        id: "level-6e",
        code: "6EME",
        label: "Sixième",
      },
      track: {
        id: "track-sc",
        code: "SCI",
        label: "Scientifique",
      },
      _count: {
        classes: 0,
        subjects: 0,
      },
    },
  ];
  curriculumSubjectsState = {
    "curr-1": [
      {
        id: "curr-subj-1",
        subjectId: "subject-math",
        coefficient: 4,
        weeklyHours: 5,
        isMandatory: true,
        subject: {
          id: "subject-math",
          name: "Mathématiques",
        },
      },
    ],
    "curr-2": [],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  seedApiState();
  mockAuthState = {
    schoolSlug: "college-vogt",
    user: makeSchoolAdminUser(),
  };

  mockCurriculumsApi.listAcademicLevels.mockImplementation(
    async () => levelsState,
  );
  mockCurriculumsApi.listTracks.mockImplementation(async () => tracksState);
  mockCurriculumsApi.listSubjects.mockImplementation(async () => subjectsState);
  mockCurriculumsApi.listCurriculums.mockImplementation(
    async () => curriculumsState,
  );
  mockCurriculumsApi.listCurriculumSubjects.mockImplementation(
    async (_schoolSlug, curriculumId) =>
      curriculumSubjectsState[curriculumId] ?? [],
  );

  mockCurriculumsApi.createAcademicLevel.mockImplementation(
    async (_schoolSlug, payload) => {
      const created: CurriculumAcademicLevel = {
        id: "level-5e",
        code: payload.code,
        label: payload.label,
        _count: { classes: 0, curriculums: 0 },
      };
      levelsState = [...levelsState, created];
      return created;
    },
  );

  mockCurriculumsApi.updateAcademicLevel.mockImplementation(
    async (_schoolSlug, levelId, payload) => {
      levelsState = levelsState.map((l) =>
        l.id === levelId ? { ...l, ...payload } : l,
      );
      return levelsState.find((l) => l.id === levelId)!;
    },
  );

  mockCurriculumsApi.deleteAcademicLevel.mockImplementation(
    async (_schoolSlug, levelId) => {
      levelsState = levelsState.filter((l) => l.id !== levelId);
    },
  );

  mockCurriculumsApi.createTrack.mockImplementation(
    async (_schoolSlug, payload) => {
      const created: CurriculumTrack = {
        id: "track-new",
        code: payload.code,
        label: payload.label,
        _count: { classes: 0, curriculums: 0 },
      };
      tracksState = [...tracksState, created];
      return created;
    },
  );

  mockCurriculumsApi.updateTrack.mockImplementation(
    async (_schoolSlug, trackId, payload) => {
      tracksState = tracksState.map((t) =>
        t.id === trackId ? { ...t, ...payload } : t,
      );
      return tracksState.find((t) => t.id === trackId)!;
    },
  );

  mockCurriculumsApi.deleteTrack.mockImplementation(
    async (_schoolSlug, trackId) => {
      tracksState = tracksState.filter((t) => t.id !== trackId);
    },
  );

  mockCurriculumsApi.createCurriculum.mockImplementation(
    async (_schoolSlug, payload) => {
      const level = levelsState.find(
        (entry) => entry.id === payload.academicLevelId,
      );
      const track =
        payload.trackId != null
          ? (tracksState.find((entry) => entry.id === payload.trackId) ?? null)
          : null;
      const created: CurriculumRow = {
        id: "curr-created",
        name: `${level?.code ?? "UNKNOWN"} - ${track?.code ?? "TRONC_COMMUN"}`,
        academicLevelId: payload.academicLevelId,
        trackId: payload.trackId ?? null,
        academicLevel: {
          id: level?.id ?? payload.academicLevelId,
          code: level?.code ?? "UNKNOWN",
          label: level?.label ?? "Unknown",
        },
        track,
        _count: {
          classes: 0,
          subjects: 0,
        },
      };
      curriculumsState = [...curriculumsState, created];
      curriculumSubjectsState[created.id] = [];
      return created;
    },
  );

  mockCurriculumsApi.updateCurriculum.mockImplementation(
    async (_schoolSlug, curriculumId, payload) => {
      const levelId = payload.academicLevelId;
      const level = levelId ? levelsState.find((l) => l.id === levelId) : null;
      const track = payload.trackId
        ? (tracksState.find((t) => t.id === payload.trackId) ?? null)
        : null;
      curriculumsState = curriculumsState.map((c): CurriculumRow => {
        if (c.id !== curriculumId) return c;
        return {
          ...c,
          academicLevelId: levelId ?? c.academicLevelId,
          trackId: payload.trackId ?? null,
          name: `${level?.code ?? c.academicLevel.code} - ${track?.code ?? "TRONC_COMMUN"}`,
          academicLevel: level
            ? { id: level.id, code: level.code, label: level.label }
            : c.academicLevel,
          track,
        };
      });
      return curriculumsState.find((c) => c.id === curriculumId)!;
    },
  );

  mockCurriculumsApi.deleteCurriculum.mockImplementation(
    async (_schoolSlug, curriculumId) => {
      curriculumsState = curriculumsState.filter((c) => c.id !== curriculumId);
    },
  );

  mockCurriculumsApi.deleteCurriculumSubject.mockImplementation(
    async (_schoolSlug, curriculumId, subjectId) => {
      curriculumSubjectsState[curriculumId] = (
        curriculumSubjectsState[curriculumId] ?? []
      ).filter((entry) => entry.subjectId !== subjectId);
    },
  );

  mockCurriculumsApi.upsertCurriculumSubject.mockResolvedValue({
    id: "curr-subj-2",
    subjectId: "subject-phys",
    coefficient: 2,
    weeklyHours: 2,
    isMandatory: false,
    subject: {
      id: "subject-phys",
      name: "Physique",
    },
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderAndWaitLoaded() {
  render(<CurriculumsAdminScreen />);
  await waitFor(() =>
    expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
  );
}

// ---------------------------------------------------------------------------
// Navigation & accès
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — navigation et accès", () => {
  it("charge le module school admin et permet de naviguer entre les cinq onglets", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(mockCurriculumsApi.listCurriculums).toHaveBeenCalledWith(
        "college-vogt",
      ),
    );

    expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    expect(screen.getByText("Sixième")).toBeTruthy();

    fireEvent.press(screen.getByTestId("curriculums-tab-tracks"));
    expect(screen.getByText("Scientifique")).toBeTruthy();

    fireEvent.press(screen.getByTestId("curriculums-tab-help"));
    expect(screen.getByText("Mode d'emploi")).toBeTruthy();
    expect(screen.queryByTestId("curriculums-fab")).toBeNull();
  });

  it("bloque l'accès pour un utilisateur non school admin sans lancer les appels API", () => {
    mockAuthState = {
      schoolSlug: "college-vogt",
      user: {
        ...makeSchoolAdminUser(),
        role: "TEACHER",
        activeRole: "TEACHER",
      },
    };

    render(<CurriculumsAdminScreen />);

    expect(screen.getByText("Accès réservé")).toBeTruthy();
    expect(mockCurriculumsApi.listAcademicLevels).not.toHaveBeenCalled();
    expect(screen.queryByTestId("curriculums-fab")).toBeNull();
  });

  it("affiche l'état vide 'École introuvable' quand schoolSlug est absent", () => {
    mockAuthState = { schoolSlug: null, user: makeSchoolAdminUser() };

    render(<CurriculumsAdminScreen />);

    expect(screen.getByText("École introuvable")).toBeTruthy();
    expect(mockCurriculumsApi.listAcademicLevels).not.toHaveBeenCalled();
    expect(screen.queryByTestId("curriculums-fab")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Niveaux — création, édition, suppression
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — niveaux académiques", () => {
  it("ouvre le formulaire de niveau depuis le FAB et crée un niveau avec toast de succès", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-level-code-input"),
      "5EME",
    );
    fireEvent(screen.getByTestId("curriculum-level-code-input"), "blur");
    fireEvent.changeText(
      screen.getByTestId("curriculum-level-label-input"),
      "Cinquième",
    );
    fireEvent(screen.getByTestId("curriculum-level-label-input"), "blur");
    fireEvent.press(screen.getByTestId("curriculum-level-form-submit"));

    await waitFor(() =>
      expect(mockCurriculumsApi.createAcademicLevel).toHaveBeenCalledWith(
        "college-vogt",
        { code: "5EME", label: "Cinquième" },
      ),
    );
    await waitFor(() => expect(screen.getByText("Cinquième")).toBeTruthy());
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Niveau créé",
      message: "Le niveau académique a été ajouté.",
    });
  });

  it("ouvre le formulaire d'édition de niveau pré-rempli et soumet la mise à jour", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-row-level-6e")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-level-edit-level-6e"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );

    expect(screen.getByTestId("curriculum-level-code-input").props.value).toBe(
      "6EME",
    );
    expect(screen.getByTestId("curriculum-level-label-input").props.value).toBe(
      "Sixième",
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-level-label-input"),
      "Sixième modifiée",
    );
    fireEvent.press(screen.getByTestId("curriculum-level-form-submit"));

    await waitFor(() =>
      expect(mockCurriculumsApi.updateAcademicLevel).toHaveBeenCalledWith(
        "college-vogt",
        "level-6e",
        { code: "6EME", label: "Sixième modifiée" },
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Niveau modifié",
      message: "Le niveau académique a été mis à jour.",
    });
  });

  it("supprime un niveau après confirmation et recharge la liste", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-row-level-6e")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-level-delete-level-6e"));
    expect(screen.getByTestId("confirm-dialog-confirm")).toBeTruthy();
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockCurriculumsApi.deleteAcademicLevel).toHaveBeenCalledWith(
        "college-vogt",
        "level-6e",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("curriculum-level-row-level-6e")).toBeNull(),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Niveau supprimé",
      message: "Le niveau académique a été supprimé.",
    });
  });

  it("annule la suppression d'un niveau quand on appuie sur Annuler", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-row-level-6e")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-level-delete-level-6e"));
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));

    expect(mockCurriculumsApi.deleteAcademicLevel).not.toHaveBeenCalled();
    expect(screen.getByTestId("curriculum-level-row-level-6e")).toBeTruthy();
  });

  it("affiche les erreurs code et libellé sur submit vide sans appeler l'API", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("curriculum-level-form-submit"));

    expect(
      await screen.findByTestId("curriculum-level-code-input-error"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("curriculum-level-label-input-error"),
    ).toBeTruthy();
    expect(mockCurriculumsApi.createAcademicLevel).not.toHaveBeenCalled();
  });

  it("bouton submit du form niveau toujours actif même sur form vide", async () => {
    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );
    const submit = screen.getByTestId("curriculum-level-form-submit");
    expect(submit.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("les champs invalides restent en erreur, les champs corrigés perdent leur erreur", async () => {
    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-level-code-input"),
      "X",
    );
    fireEvent.changeText(screen.getByTestId("curriculum-level-code-input"), "");
    expect(
      await screen.findByTestId("curriculum-level-code-input-error"),
    ).toBeTruthy();

    expect(
      screen.queryByTestId("curriculum-level-label-input-error"),
    ).toBeNull();
    expect(mockCurriculumsApi.createAcademicLevel).not.toHaveBeenCalled();
  });

  it("ferme le formulaire de niveau via le bouton close sans appeler l'API", async () => {
    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-level-form-sheet-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("curriculum-level-form-sheet")).toBeNull(),
    );
    expect(mockCurriculumsApi.createAcademicLevel).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Filières — création, édition, suppression
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — filières", () => {
  it("ouvre le formulaire de création de filière depuis le FAB et crée une filière", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-tracks"));
    await waitFor(() => expect(screen.getByText("Scientifique")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-form-sheet")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-track-code-input"),
      "LIT",
    );
    fireEvent.changeText(
      screen.getByTestId("curriculum-track-label-input"),
      "Littéraire",
    );
    fireEvent.press(screen.getByTestId("curriculum-track-form-submit"));

    await waitFor(() =>
      expect(mockCurriculumsApi.createTrack).toHaveBeenCalledWith(
        "college-vogt",
        { code: "LIT", label: "Littéraire" },
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Filière créée",
      message: "La filière a été ajoutée.",
    });
    await waitFor(() => expect(screen.getByText("Littéraire")).toBeTruthy());
  });

  it("ouvre le formulaire d'édition de filière pré-rempli et soumet la mise à jour", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-tracks"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-row-track-sc")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-track-edit-track-sc"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-form-sheet")).toBeTruthy(),
    );

    expect(screen.getByTestId("curriculum-track-code-input").props.value).toBe(
      "SCI",
    );
    expect(screen.getByTestId("curriculum-track-label-input").props.value).toBe(
      "Scientifique",
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-track-label-input"),
      "Sciences",
    );
    fireEvent.press(screen.getByTestId("curriculum-track-form-submit"));

    await waitFor(() =>
      expect(mockCurriculumsApi.updateTrack).toHaveBeenCalledWith(
        "college-vogt",
        "track-sc",
        { code: "SCI", label: "Sciences" },
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Filière modifiée",
      message: "La filière a été mise à jour.",
    });
  });

  it("supprime une filière après confirmation et recharge la liste", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-tracks"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-row-track-sc")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-track-delete-track-sc"));
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockCurriculumsApi.deleteTrack).toHaveBeenCalledWith(
        "college-vogt",
        "track-sc",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("curriculum-track-row-track-sc")).toBeNull(),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Filière supprimée",
      message: "La filière a été supprimée.",
    });
  });
});

// ---------------------------------------------------------------------------
// Curriculums — création, édition, suppression, navigation vers matières
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — curriculums", () => {
  it("utilise des listes déroulantes dans le formulaire curriculum et crée un curriculum avec header et footer stylés", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-sheet")).toBeTruthy(),
    );

    expect(screen.getByTestId("curriculum-form-sheet-header")).toHaveStyle({
      backgroundColor: "#08467D",
    });
    expect(
      screen.getByText(
        "Assemblez un niveau et une filière dans un formulaire compact pour produire un intitulé cohérent.",
      ),
    ).toBeTruthy();
    expect(screen.getByTestId("curriculum-form-level")).toHaveStyle({
      borderRadius: 14,
      backgroundColor: "#F9F3EA",
    });
    expect(screen.getByTestId("curriculum-form-track")).toHaveStyle({
      borderRadius: 14,
      backgroundColor: "#F9F3EA",
    });
    expect(screen.getByTestId("curriculum-form-action-bar")).toBeTruthy();

    fireEvent.press(screen.getByTestId("curriculum-form-level"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-level-sheet")).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("curriculum-form-level-option-level-6e"),
    );

    fireEvent.press(screen.getByTestId("curriculum-form-track"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-track-sheet")).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("curriculum-form-track-option-track-sc"),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("curriculum-form-name-preview"),
      ).toHaveTextContent("6EME - SCI"),
    );

    fireEvent.press(screen.getByTestId("curriculum-form-submit"));

    await waitFor(() =>
      expect(mockCurriculumsApi.createCurriculum).toHaveBeenCalledWith(
        "college-vogt",
        { academicLevelId: "level-6e", trackId: "track-sc" },
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Curriculum créé",
      message: "Le curriculum a été ajouté.",
    });
  });

  it("ouvre le formulaire d'édition d'un curriculum via le bouton crayon", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculum-edit-curr-1"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-sheet")).toBeTruthy(),
    );

    expect(screen.getByTestId("curriculum-form-sheet-header")).toHaveStyle({
      backgroundColor: "#08467D",
    });
    expect(screen.getByText("Modification")).toBeTruthy();
  });

  it("soumet la mise à jour d'un curriculum et affiche le toast de succès", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculum-edit-curr-2"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-sheet")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-form-track"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-track-sheet")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("curriculum-form-track-option-"));
    fireEvent.press(screen.getByTestId("curriculum-form-submit"));

    await waitFor(() =>
      expect(mockCurriculumsApi.updateCurriculum).toHaveBeenCalledWith(
        "college-vogt",
        "curr-2",
        expect.objectContaining({ academicLevelId: "level-6e" }),
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Curriculum modifié",
      message: "Le curriculum a été mis à jour.",
    });
  });

  it("supprime un curriculum après confirmation et recharge la liste", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculum-delete-curr-1"));
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockCurriculumsApi.deleteCurriculum).toHaveBeenCalledWith(
        "college-vogt",
        "curr-1",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByTestId("curriculum-row-curr-1")).toBeNull(),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Curriculum supprimé",
      message: "Le curriculum a été supprimé.",
    });
  });

  it("navigue vers l'onglet matières en appuyant sur la flèche d'un curriculum", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculum-subjects-curr-1"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-selector")).toBeTruthy(),
    );
    expect(mockCurriculumsApi.listCurriculumSubjects).toHaveBeenCalledWith(
      "college-vogt",
      "curr-1",
    );
  });

  it("navigue vers l'onglet matières en appuyant sur le nom du curriculum", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculum-open-curr-2"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-selector")).toBeTruthy(),
    );
    expect(mockCurriculumsApi.listCurriculumSubjects).toHaveBeenCalledWith(
      "college-vogt",
      "curr-2",
    );
  });

  it("bouton submit du form curriculum toujours actif même sur form vide", async () => {
    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-sheet")).toBeTruthy(),
    );
    const submit = screen.getByTestId("curriculum-form-submit");
    expect(submit.props.accessibilityState?.disabled).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// Matières du curriculum — création, édition, suppression
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — matières du curriculum", () => {
  it("utilise des listes déroulantes compactes dans le formulaire d'ajout de matière et soumet la sélection", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-selector")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-subject-form-sheet")).toBeTruthy(),
    );

    expect(
      screen.getByTestId("curriculum-subject-form-sheet-header"),
    ).toHaveStyle({
      backgroundColor: "#08467D",
    });
    expect(
      screen.getByText(
        "Sélectionnez rapidement le curriculum et la matière, puis ajustez les paramètres pédagogiques.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByTestId("curriculum-subject-form-curriculum"),
    ).toHaveStyle({
      borderRadius: 14,
      backgroundColor: "#F9F3EA",
    });
    expect(screen.getByTestId("curriculum-subject-form-subject")).toHaveStyle({
      borderRadius: 14,
      backgroundColor: "#F9F3EA",
    });
    expect(
      screen.getByTestId("curriculum-subject-form-sheet-close"),
    ).toHaveStyle({
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.15)",
    });
    expect(
      screen.getByTestId("curriculum-subject-form-action-bar"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("curriculum-subject-form-action-bar"),
    ).toHaveStyle({
      flex: 1,
    });

    fireEvent.press(screen.getByTestId("curriculum-subject-form-curriculum"));
    await waitFor(() =>
      expect(
        screen.getByTestId("curriculum-subject-form-curriculum-sheet"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("curriculum-subject-form-curriculum-option-curr-2"),
    );

    fireEvent.press(screen.getByTestId("curriculum-subject-form-subject"));
    await waitFor(() =>
      expect(
        screen.getByTestId("curriculum-subject-form-subject-sheet"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("curriculum-subject-form-subject-option-subject-phys"),
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-subject-form-coefficient"),
      "2",
    );
    fireEvent(
      screen.getByTestId("curriculum-subject-form-coefficient"),
      "blur",
    );
    fireEvent.changeText(
      screen.getByTestId("curriculum-subject-form-weekly-hours"),
      "3",
    );
    fireEvent(
      screen.getByTestId("curriculum-subject-form-weekly-hours"),
      "blur",
    );
    fireEvent(
      screen.getByTestId("curriculum-subject-form-mandatory"),
      "valueChange",
      false,
    );
    fireEvent.press(screen.getByTestId("curriculum-subject-form-submit"));

    await waitFor(() =>
      expect(mockCurriculumsApi.upsertCurriculumSubject).toHaveBeenCalledWith(
        "college-vogt",
        "curr-2",
        {
          subjectId: "subject-phys",
          coefficient: 2,
          weeklyHours: 3,
          isMandatory: false,
        },
      ),
    );
  });

  it("verrouille la liste déroulante matière en édition d'une matière existante", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));
    await waitFor(() => expect(screen.getByText("Mathématiques")).toBeTruthy());

    fireEvent.press(screen.getByTestId("curriculum-subject-edit-curr-subj-1"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-subject-form-sheet")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-subject-form-subject"));
    expect(
      screen.queryByTestId("curriculum-subject-form-subject-sheet"),
    ).toBeNull();
  });

  it("supprime une matière de curriculum après confirmation et recharge la liste", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));

    await waitFor(() => expect(screen.getByText("Mathématiques")).toBeTruthy());

    fireEvent.press(
      screen.getByTestId("curriculum-subject-delete-curr-subj-1"),
    );
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockCurriculumsApi.deleteCurriculumSubject).toHaveBeenCalledWith(
        "college-vogt",
        "curr-1",
        "subject-math",
      ),
    );
    await waitFor(() => expect(screen.queryByText("Mathématiques")).toBeNull());
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Matière retirée",
      message: "La matière a été retirée du curriculum.",
    });
  });

  it("bouton submit du form matière toujours actif même sur form vide", async () => {
    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-selector")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-subject-form-sheet")).toBeTruthy(),
    );
    const submit = screen.getByTestId("curriculum-subject-form-submit");
    expect(submit.props.accessibilityState?.disabled).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// Sélecteur de curriculum et rechargement des matières
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — sélecteur curriculum et matières", () => {
  it("utilise un sélecteur compact pour le curriculum ciblé et recharge les matières au changement", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));

    await waitFor(() =>
      expect(screen.getByTestId("curriculum-selector")).toBeTruthy(),
    );

    expect(screen.queryByText("Curriculum ciblé")).toBeNull();
    expect(screen.getByTestId("curriculum-selector")).toHaveStyle({
      borderRadius: 14,
      backgroundColor: "#F9F3EA",
    });
    expect(screen.getByText("1 matière · 1 classe")).toBeTruthy();
    expect(mockCurriculumsApi.listCurriculumSubjects).toHaveBeenCalledWith(
      "college-vogt",
      "curr-1",
    );

    fireEvent.press(screen.getByTestId("curriculum-selector"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-selector-sheet")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("curriculum-selector-option-curr-2"));

    await waitFor(() =>
      expect(mockCurriculumsApi.listCurriculumSubjects).toHaveBeenCalledWith(
        "college-vogt",
        "curr-2",
      ),
    );
    await waitFor(() =>
      expect(screen.getByText("Aucune matière liée")).toBeTruthy(),
    );
    expect(screen.getByText("0 matière · 0 classe")).toBeTruthy();
    expect(screen.getByText("0 matière(s)")).toBeTruthy();
  });

  it("désactive le FAB sur l'onglet matières quand il n'y a aucun curriculum", async () => {
    curriculumsState = [];
    mockCurriculumsApi.listCurriculums.mockResolvedValue([]);
    render(<CurriculumsAdminScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("curriculums-tab-subjects")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));
    await waitFor(() =>
      expect(screen.getByText("Aucun curriculum disponible")).toBeTruthy(),
    );

    const fab = screen.queryByTestId("curriculums-fab");
    expect(fab?.props.accessibilityState?.disabled ?? true).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Apparence des cartes de liste
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — apparence des listes", () => {
  it("affiche les lignes de liste avec borderRadius 14 et borderWidth 0", async () => {
    await renderAndWaitLoaded();

    expect(screen.getByTestId("curriculum-row-curr-1")).toHaveStyle({
      borderRadius: 14,
      borderWidth: 0,
    });
    expect(screen.queryByTestId("curriculum-level-pill-curr-1")).toBeNull();
    expect(
      screen.getByText("TRONC_COMMUN · 1 matière · 1 classe"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-row-level-6e")).toBeTruthy(),
    );
    expect(screen.getByText("6EME · 1 curriculum · 2 classes")).toBeTruthy();
    expect(screen.getByTestId("curriculum-level-row-level-6e")).toHaveStyle({
      borderRadius: 14,
      borderWidth: 0,
    });

    fireEvent.press(screen.getByTestId("curriculums-tab-tracks"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-row-track-sc")).toBeTruthy(),
    );
    expect(screen.getByText("SCI · 0 curriculum · 0 classe")).toBeTruthy();
    expect(screen.getByTestId("curriculum-track-row-track-sc")).toHaveStyle({
      borderRadius: 14,
      borderWidth: 0,
    });
  });

  it("affiche les matières du curriculum avec meta ligne unique sans capsule coefficient", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));

    await waitFor(() =>
      expect(
        screen.getByTestId("curriculum-subject-row-curr-subj-1"),
      ).toBeTruthy(),
    );

    expect(
      screen.getByTestId("curriculum-subject-row-curr-subj-1"),
    ).toHaveStyle({
      borderWidth: 0,
      borderRadius: 14,
    });
    expect(screen.getByText("Mathématiques")).toBeTruthy();
    expect(
      screen.queryByTestId("curriculum-subject-pill-curr-subj-1"),
    ).toBeNull();
    expect(screen.getByText("Coef. 4 · 5 h/sem · Obligatoire")).toBeTruthy();
  });

  it("affiche le header et footer stylés sur les formulaires et permet la fermeture", async () => {
    await renderAndWaitLoaded();

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );

    expect(
      screen.getByTestId("curriculum-level-form-sheet-header"),
    ).toHaveStyle({
      backgroundColor: "#08467D",
    });
    expect(
      screen.getByText(
        "Définissez un repère académique clair pour organiser les classes et les programmes.",
      ),
    ).toBeTruthy();
    expect(screen.getByTestId("curriculum-level-form-sheet-close")).toHaveStyle(
      {
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
      },
    );
    expect(screen.getByTestId("curriculum-level-form-action-bar")).toBeTruthy();

    fireEvent.press(screen.getByTestId("curriculum-level-form-sheet-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("curriculum-level-form-sheet")).toBeNull(),
    );
  });
});

// ---------------------------------------------------------------------------
// Gestion des erreurs API
// ---------------------------------------------------------------------------

describe("CurriculumsAdminScreen — erreurs API", () => {
  it("affiche un toast d'erreur quand la création d'un niveau échoue et garde le form ouvert", async () => {
    mockCurriculumsApi.createAcademicLevel.mockRejectedValue(
      new Error("Erreur réseau"),
    );

    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-level-code-input"),
      "5EME",
    );
    fireEvent.changeText(
      screen.getByTestId("curriculum-level-label-input"),
      "Cinquième",
    );
    fireEvent.press(screen.getByTestId("curriculum-level-form-submit"));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Action impossible" }),
      ),
    );
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("affiche un toast d'erreur quand la suppression d'un curriculum échoue", async () => {
    mockCurriculumsApi.deleteCurriculum.mockRejectedValue(
      new Error("Suppression impossible"),
    );

    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculum-delete-curr-1"));
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Action impossible" }),
      ),
    );
    expect(screen.getByTestId("curriculum-row-curr-1")).toBeTruthy();
  });

  it("affiche un toast d'erreur quand la mise à jour d'une filière échoue", async () => {
    mockCurriculumsApi.updateTrack.mockRejectedValue(
      new Error("Conflit serveur"),
    );

    await renderAndWaitLoaded();
    fireEvent.press(screen.getByTestId("curriculums-tab-tracks"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-row-track-sc")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculum-track-edit-track-sc"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-form-sheet")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("curriculum-track-label-input"),
      "Sciences modifiées",
    );
    fireEvent.press(screen.getByTestId("curriculum-track-form-submit"));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Action impossible" }),
      ),
    );
  });
});
