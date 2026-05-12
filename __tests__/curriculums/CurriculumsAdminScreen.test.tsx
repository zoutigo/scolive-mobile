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

describe("CurriculumsAdminScreen", () => {
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

  it("ouvre le formulaire de niveau depuis le FAB et crée un niveau avec toast de succès", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

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
        {
          code: "5EME",
          label: "Cinquième",
        },
      ),
    );
    await waitFor(() => expect(screen.getByText("Cinquième")).toBeTruthy());
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Niveau créé",
      message: "Le niveau académique a été ajouté.",
    });
  });

  it("affiche un header et un footer modernisés sur les formulaires et permet la fermeture par le bouton dédié", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculums-tab-levels"));
    await waitFor(() => expect(screen.getByText("Sixième")).toBeTruthy());
    fireEvent.press(screen.getByTestId("curriculums-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("curriculum-level-form-sheet")).toBeTruthy(),
    );

    expect(
      screen.getByTestId("curriculum-level-form-sheet-header"),
    ).toHaveStyle({
      backgroundColor: "#FCF8F2",
      borderBottomWidth: 1,
    });
    expect(
      screen.getByText(
        "Définissez un repère académique clair pour organiser les classes et les programmes.",
      ),
    ).toBeTruthy();
    expect(screen.getByTestId("curriculum-level-form-sheet-close")).toHaveStyle(
      {
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.78)",
      },
    );
    expect(screen.getByTestId("curriculum-level-form-action-bar")).toHaveStyle({
      borderRadius: 16,
      backgroundColor: "#FBF6EF",
    });

    fireEvent.press(screen.getByTestId("curriculum-level-form-sheet-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("curriculum-level-form-sheet")).toBeNull(),
    );
  });

  it("utilise des listes déroulantes dans le formulaire curriculum et crée un curriculum avec header et footer stylés", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculums-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-form-sheet")).toBeTruthy(),
    );

    expect(screen.getByTestId("curriculum-form-sheet-header")).toHaveStyle({
      backgroundColor: "#FCF8F2",
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
    expect(screen.getByTestId("curriculum-form-action-bar")).toHaveStyle({
      borderRadius: 16,
      backgroundColor: "#FBF6EF",
    });

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
        {
          academicLevelId: "level-6e",
          trackId: "track-sc",
        },
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith({
      title: "Curriculum créé",
      message: "Le curriculum a été ajouté.",
    });
  });

  it("supprime une matière de curriculum après confirmation et recharge la liste", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

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

  it("utilise des listes déroulantes compactes dans le formulaire d'ajout de matière et soumet la sélection", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

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
      backgroundColor: "#FCF8F2",
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
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.78)",
    });
    expect(
      screen.getByTestId("curriculum-subject-form-action-bar"),
    ).toHaveStyle({
      borderRadius: 16,
      backgroundColor: "#FBF6EF",
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
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

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

  it("remplace les avatars par des repères textuels et allège les cartes de liste", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("curriculum-row-curr-1")).toBeTruthy(),
    );

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
    expect(screen.queryByTestId("curriculum-level-code-level-6e")).toBeNull();
    expect(screen.getByText("6EME · 1 curriculum · 2 classes")).toBeTruthy();
    expect(screen.getByTestId("curriculum-level-row-level-6e")).toHaveStyle({
      borderRadius: 14,
      borderWidth: 0,
    });

    fireEvent.press(screen.getByTestId("curriculums-tab-tracks"));
    await waitFor(() =>
      expect(screen.getByTestId("curriculum-track-row-track-sc")).toBeTruthy(),
    );
    expect(screen.queryByTestId("curriculum-track-code-track-sc")).toBeNull();
    expect(screen.getByText("SCI · 0 curriculum · 0 classe")).toBeTruthy();
    expect(screen.getByTestId("curriculum-track-row-track-sc")).toHaveStyle({
      borderRadius: 14,
      borderWidth: 0,
    });
  });

  it("utilise un sélecteur compact pour le curriculum ciblé et recharge les matières au changement", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("curriculums-tab-subjects"));

    await waitFor(() =>
      expect(screen.getByTestId("curriculum-selector")).toBeTruthy(),
    );

    expect(screen.queryByText("Curriculum ciblé")).toBeNull();
    expect(
      screen.queryByText(
        "Le changement de sélection recharge immédiatement la liste des matières",
      ),
    ).toBeNull();
    expect(screen.queryByText("Curriculum")).toBeNull();
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

  it("allège aussi la liste des matières sans capsule dédiée au coefficient", async () => {
    render(<CurriculumsAdminScreen />);

    await waitFor(() =>
      expect(screen.getByText("6EME - TRONC_COMMUN")).toBeTruthy(),
    );

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
});
