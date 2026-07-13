import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { CurriculumsAdminScreen } from "../../src/components/curriculums/CurriculumsAdminScreen";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { platformCatalogApi } from "../../src/api/platform-catalog.api";
import type { AuthUser } from "../../src/types/auth.types";
import type {
  NationalAcademicLevelRow,
  NationalCurriculumRow,
  NationalCurriculumSubjectRow,
  NationalCycleRow,
  NationalSubjectRow,
  NationalTrackRow,
} from "../../src/types/platform-catalog.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/curriculums.api");
jest.mock("../../src/api/platform-catalog.api");

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
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
const mockPlatformCatalogApi = platformCatalogApi as jest.Mocked<
  typeof platformCatalogApi
>;

function makeSuperAdminUser(): AuthUser {
  return {
    id: "super-admin-1",
    firstName: "Alice",
    lastName: "Ngassa",
    platformRoles: ["SUPER_ADMIN"],
    memberships: [],
    profileCompleted: true,
    role: "SUPER_ADMIN",
    activeRole: "SUPER_ADMIN",
    schoolName: null,
  };
}

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

let nationalCyclesState: NationalCycleRow[];
let nationalLevelsState: NationalAcademicLevelRow[];
let nationalTracksState: NationalTrackRow[];
let nationalCurriculumsState: NationalCurriculumRow[];
let nationalSubjectsState: NationalSubjectRow[];
let nationalCurriculumSubjectsState: NationalCurriculumSubjectRow[];

beforeEach(() => {
  jest.clearAllMocks();
  nationalCyclesState = [];
  nationalLevelsState = [];
  nationalTracksState = [];
  nationalCurriculumsState = [];
  nationalSubjectsState = [];
  nationalCurriculumSubjectsState = [];

  mockCurriculumsApi.listAcademicLevels.mockResolvedValue([]);
  mockCurriculumsApi.listTracks.mockResolvedValue([]);
  mockCurriculumsApi.listCurriculums.mockResolvedValue([]);
  mockCurriculumsApi.listSubjects.mockResolvedValue([]);

  mockPlatformCatalogApi.listNationalCycles.mockImplementation(
    async () => nationalCyclesState,
  );
  mockPlatformCatalogApi.createNationalCycle.mockImplementation(
    async (payload) => {
      const created: NationalCycleRow = {
        id: "cycle-created",
        code: payload.code,
        label: payload.label,
        _count: { academicLevels: 0 },
      };
      nationalCyclesState = [...nationalCyclesState, created];
      return created;
    },
  );
  mockPlatformCatalogApi.updateNationalCycle.mockImplementation(
    async (id, payload) => {
      nationalCyclesState = nationalCyclesState.map((entry) =>
        entry.id === id ? { ...entry, ...payload } : entry,
      );
      return nationalCyclesState.find((entry) => entry.id === id)!;
    },
  );
  mockPlatformCatalogApi.deleteNationalCycle.mockImplementation(async (id) => {
    nationalCyclesState = nationalCyclesState.filter(
      (entry) => entry.id !== id,
    );
    return { success: true };
  });

  mockPlatformCatalogApi.listNationalAcademicLevels.mockImplementation(
    async () => nationalLevelsState,
  );
  mockPlatformCatalogApi.createNationalAcademicLevel.mockImplementation(
    async (payload) => {
      const cycle = nationalCyclesState.find(
        (entry) => entry.id === payload.cycleId,
      );
      const created: NationalAcademicLevelRow = {
        id: "level-national-created",
        code: payload.code,
        label: payload.label,
        cycleId: payload.cycleId ?? null,
        cycle: cycle ?? null,
        languageSystem: payload.languageSystem ?? null,
        isNational: true,
      };
      nationalLevelsState = [...nationalLevelsState, created];
      return created;
    },
  );
  mockPlatformCatalogApi.updateNationalAcademicLevel.mockImplementation(
    async (id, payload) => {
      nationalLevelsState = nationalLevelsState.map((entry) =>
        entry.id === id ? { ...entry, ...payload } : entry,
      );
      return nationalLevelsState.find((entry) => entry.id === id)!;
    },
  );
  mockPlatformCatalogApi.deleteNationalAcademicLevel.mockImplementation(
    async (id) => {
      nationalLevelsState = nationalLevelsState.filter(
        (entry) => entry.id !== id,
      );
      return { success: true };
    },
  );
  mockPlatformCatalogApi.listNationalTracks.mockImplementation(
    async () => nationalTracksState,
  );
  mockPlatformCatalogApi.createNationalTrack.mockImplementation(
    async (payload) => {
      const created: NationalTrackRow = {
        id: "track-national-created",
        code: payload.code,
        label: payload.label,
        isNational: true,
        _count: { classes: 0, curriculums: 0 },
      };
      nationalTracksState = [...nationalTracksState, created];
      return created;
    },
  );
  mockPlatformCatalogApi.updateNationalTrack.mockImplementation(
    async (id, payload) => {
      nationalTracksState = nationalTracksState.map((entry) =>
        entry.id === id ? { ...entry, ...payload } : entry,
      );
      return nationalTracksState.find((entry) => entry.id === id)!;
    },
  );
  mockPlatformCatalogApi.deleteNationalTrack.mockImplementation(async (id) => {
    nationalTracksState = nationalTracksState.filter(
      (entry) => entry.id !== id,
    );
    return { success: true };
  });

  mockPlatformCatalogApi.listNationalCurriculums.mockImplementation(
    async () => nationalCurriculumsState,
  );
  mockPlatformCatalogApi.createNationalCurriculum.mockImplementation(
    async (payload) => {
      const level = nationalLevelsState.find(
        (entry) => entry.id === payload.academicLevelId,
      );
      const track = nationalTracksState.find(
        (entry) => entry.id === payload.trackId,
      );
      const created: NationalCurriculumRow = {
        id: "curriculum-national-created",
        name: `${level?.code ?? "N/A"} - ${track ? track.code : "TRONC_COMMUN"}`,
        academicLevelId: payload.academicLevelId,
        trackId: payload.trackId ?? null,
        academicLevel: level ?? {
          id: payload.academicLevelId,
          code: "N/A",
          label: "N/A",
        },
        track: track ?? null,
        isNational: true,
        _count: { classes: 0, subjects: 0 },
      };
      nationalCurriculumsState = [...nationalCurriculumsState, created];
      return created;
    },
  );
  mockPlatformCatalogApi.updateNationalCurriculum.mockImplementation(
    async (id, payload) => {
      const level = nationalLevelsState.find(
        (entry) => entry.id === payload.academicLevelId,
      );
      nationalCurriculumsState = nationalCurriculumsState.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              academicLevelId: payload.academicLevelId ?? entry.academicLevelId,
              academicLevel: level ?? entry.academicLevel,
              name: level ? `${level.code} - TRONC_COMMUN` : entry.name,
            }
          : entry,
      );
      return nationalCurriculumsState.find((entry) => entry.id === id)!;
    },
  );
  mockPlatformCatalogApi.deleteNationalCurriculum.mockImplementation(
    async (id) => {
      nationalCurriculumsState = nationalCurriculumsState.filter(
        (entry) => entry.id !== id,
      );
      return { success: true };
    },
  );
  mockPlatformCatalogApi.listNationalSubjects.mockImplementation(
    async () => nationalSubjectsState,
  );
  mockPlatformCatalogApi.createNationalSubject.mockImplementation(
    async (payload) => {
      const created: NationalSubjectRow = {
        id: "subject-national-created",
        code: payload.code,
        name: payload.name,
        isNational: true,
        _count: {
          assignments: 0,
          studentGrades: 0,
          curriculumSubjects: 0,
          classOverrides: 0,
        },
      };
      nationalSubjectsState = [...nationalSubjectsState, created];
      return created;
    },
  );
  mockPlatformCatalogApi.updateNationalSubject.mockImplementation(
    async (id, payload) => {
      nationalSubjectsState = nationalSubjectsState.map((entry) =>
        entry.id === id ? { ...entry, ...payload } : entry,
      );
      return nationalSubjectsState.find((entry) => entry.id === id)!;
    },
  );
  mockPlatformCatalogApi.deleteNationalSubject.mockImplementation(
    async (id) => {
      nationalSubjectsState = nationalSubjectsState.filter(
        (entry) => entry.id !== id,
      );
      return { success: true };
    },
  );
  mockPlatformCatalogApi.listNationalCurriculumSubjects.mockImplementation(
    async () => nationalCurriculumSubjectsState,
  );
  mockPlatformCatalogApi.upsertNationalCurriculumSubject.mockImplementation(
    async (_curriculumId, payload) => {
      const subject = nationalSubjectsState.find(
        (entry) => entry.id === payload.subjectId,
      )!;
      const created: NationalCurriculumSubjectRow = {
        id: `national-curriculum-subject-${payload.subjectId}`,
        subjectId: payload.subjectId,
        isMandatory: payload.isMandatory ?? true,
        coefficient: payload.coefficient ?? null,
        weeklyHours: payload.weeklyHours ?? null,
        subject: { id: subject.id, name: subject.name },
      };
      nationalCurriculumSubjectsState = [
        ...nationalCurriculumSubjectsState.filter(
          (entry) => entry.subjectId !== payload.subjectId,
        ),
        created,
      ];
      return created;
    },
  );
  mockPlatformCatalogApi.deleteNationalCurriculumSubject.mockImplementation(
    async (_curriculumId, subjectId) => {
      nationalCurriculumSubjectsState = nationalCurriculumSubjectsState.filter(
        (entry) => entry.subjectId !== subjectId,
      );
      return { success: true };
    },
  );
});

describe("CurriculumsAdminScreen — catalogue national", () => {
  it("n'affiche pas le catalogue national pour un SCHOOL_ADMIN", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSchoolAdminUser() };

    render(<CurriculumsAdminScreen />);

    expect(await screen.findByTestId("curriculums-header")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByTestId("national-catalog-header")).toBeNull();
    });
  });

  it("affiche directement le catalogue national pour un SUPER_ADMIN, sans dépendre du schoolSlug hérité", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };

    render(<CurriculumsAdminScreen />);

    expect(await screen.findByTestId("national-catalog-header")).toBeTruthy();
    expect(screen.queryByTestId("curriculums-tab-levels")).toBeNull();
    expect(screen.queryByTestId("curriculums-tab-tracks")).toBeNull();
    expect(screen.queryByTestId("curriculums-tab-curriculums")).toBeNull();
    expect(screen.queryByTestId("curriculums-tab-subjects")).toBeNull();
    expect(screen.queryByText("collège vogt")).toBeNull();
    expect(screen.queryByText("college-vogt")).toBeNull();
  });

  it("affiche directement le catalogue national pour un SUPER_ADMIN sans école active (pas de blocage 'École introuvable')", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<CurriculumsAdminScreen />);

    expect(await screen.findByTestId("national-catalog-header")).toBeTruthy();
    expect(screen.queryByText("École introuvable")).toBeNull();
  });

  it("affiche la vue d'ensemble avec les compteurs globaux", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalCyclesState = [
      { id: "cycle-secondary", code: "SECONDARY", label: "Secondaire" },
    ];
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycleId: "cycle-secondary",
        cycle: nationalCyclesState[0],
        languageSystem: "FRANCOPHONE",
        isNational: true,
      },
    ];

    render(<CurriculumsAdminScreen />);

    expect(await screen.findByTestId("national-overview-stats")).toBeTruthy();
    const cycleRow = await screen.findByTestId(
      "national-overview-cycle-cycle-secondary",
    );
    expect(cycleRow).toHaveTextContent(/Secondaire/);
    expect(cycleRow).toHaveTextContent(/1 niveau national/);
  });

  it("crée un cycle national depuis l'onglet Cycles via le FAB", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("national-catalog-tab-cycles"));
    fireEvent.press(await screen.findByTestId("national-catalog-fab"));

    const submitButton = await screen.findByTestId(
      "national-cycle-form-submit",
    );
    fireEvent.press(submitButton);

    expect(
      await screen.findByTestId("national-cycle-form-code-error"),
    ).toBeTruthy();
    expect(mockPlatformCatalogApi.createNationalCycle).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByTestId("national-cycle-form-code"),
      "SECONDARY",
    );
    fireEvent.changeText(
      screen.getByTestId("national-cycle-form-label"),
      "Secondaire",
    );
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockPlatformCatalogApi.createNationalCycle).toHaveBeenCalledWith({
        code: "SECONDARY",
        label: "Secondaire",
      });
    });
  });

  it("modifie et supprime un cycle national existant", async () => {
    jest.useFakeTimers();
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalCyclesState = [
      {
        id: "cycle-1",
        code: "PRIMARY",
        label: "Primaire",
        _count: { academicLevels: 0 },
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("national-catalog-tab-cycles"));
    fireEvent.press(await screen.findByTestId("national-cycle-edit-cycle-1"));
    fireEvent.changeText(
      await screen.findByTestId("national-cycle-form-label"),
      "Primaire renommé",
    );
    fireEvent.press(await screen.findByTestId("national-cycle-form-submit"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.updateNationalCycle).toHaveBeenCalledWith(
        "cycle-1",
        expect.objectContaining({ label: "Primaire renommé" }),
      );
    });

    act(() => jest.advanceTimersByTime(2000));

    fireEvent.press(await screen.findByTestId("national-cycle-delete-cycle-1"));
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.deleteNationalCycle).toHaveBeenCalledWith(
        "cycle-1",
      );
    });
  });

  it("filtre les niveaux par cycle et crée un niveau rattaché au cycle sélectionné", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalCyclesState = [
      { id: "cycle-primary", code: "PRIMARY", label: "Primaire" },
      { id: "cycle-secondary", code: "SECONDARY", label: "Secondaire" },
    ];
    nationalLevelsState = [
      {
        id: "level-1",
        code: "CP",
        label: "CP",
        cycleId: "cycle-primary",
        cycle: nationalCyclesState[0],
        languageSystem: null,
        isNational: true,
      },
      {
        id: "level-2",
        code: "6EME",
        label: "6ème",
        cycleId: "cycle-secondary",
        cycle: nationalCyclesState[1],
        languageSystem: null,
        isNational: true,
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("national-catalog-tab-levels"));

    expect(await screen.findByText("CP")).toBeTruthy();
    expect(await screen.findByText("6ème")).toBeTruthy();

    fireEvent.press(
      await screen.findByTestId("national-levels-filter-cycle-primary"),
    );

    await waitFor(() => {
      expect(screen.queryByText("6ème")).toBeNull();
    });
    expect(await screen.findByText("CP")).toBeTruthy();

    fireEvent.press(await screen.findByTestId("national-catalog-fab"));
    fireEvent.changeText(
      await screen.findByTestId("national-level-form-code"),
      "CE1",
    );
    fireEvent.changeText(
      screen.getByTestId("national-level-form-label"),
      "CE1",
    );
    fireEvent.press(screen.getByTestId("national-level-form-submit"));

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.createNationalAcademicLevel,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "CE1",
          label: "CE1",
          cycleId: "cycle-primary",
        }),
      );
    });
  });

  it("modifie et supprime un niveau académique national existant", async () => {
    jest.useFakeTimers();
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycleId: null,
        cycle: null,
        languageSystem: "FRANCOPHONE",
        isNational: true,
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("national-catalog-tab-levels"));
    fireEvent.press(await screen.findByTestId("national-level-edit-level-1"));

    const codeInput = await screen.findByTestId("national-level-form-code");
    fireEvent.changeText(codeInput, "6EME-BIS");
    fireEvent.press(await screen.findByTestId("national-level-form-submit"));

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.updateNationalAcademicLevel,
      ).toHaveBeenCalledWith(
        "level-1",
        expect.objectContaining({ code: "6EME-BIS" }),
      );
    });

    act(() => jest.advanceTimersByTime(2000));

    fireEvent.press(await screen.findByTestId("national-level-delete-level-1"));
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.deleteNationalAcademicLevel,
      ).toHaveBeenCalledWith("level-1");
    });
  });

  it("crée et modifie un curriculum national", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycleId: null,
        cycle: null,
        languageSystem: null,
        isNational: true,
      },
      {
        id: "level-2",
        code: "5EME",
        label: "5ème",
        cycleId: null,
        cycle: null,
        languageSystem: null,
        isNational: true,
      },
    ];
    nationalCurriculumsState = [
      {
        id: "curriculum-1",
        name: "6EME - TRONC_COMMUN",
        academicLevelId: "level-1",
        trackId: null,
        academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
        track: null,
        isNational: true,
        _count: { classes: 0, subjects: 0 },
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("national-catalog-tab-curriculums"),
    );
    fireEvent.press(
      await screen.findByTestId("national-curriculum-edit-curriculum-1"),
    );

    fireEvent.press(
      await screen.findByTestId("national-curriculum-form-level"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "national-curriculum-form-level-option-level-2",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("national-curriculum-form-submit"),
    );

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.updateNationalCurriculum,
      ).toHaveBeenCalledWith("curriculum-1", { academicLevelId: "level-2" });
    });
  });

  it("crée, modifie et supprime une filière nationale depuis l'onglet Filières", async () => {
    jest.useFakeTimers();
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("national-catalog-tab-tracks"));
    fireEvent.press(await screen.findByTestId("national-catalog-fab"));
    fireEvent.changeText(
      await screen.findByTestId("national-track-form-code"),
      "D",
    );
    fireEvent.changeText(
      await screen.findByTestId("national-track-form-label"),
      "Série D",
    );
    fireEvent.press(await screen.findByTestId("national-track-form-submit"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.createNationalTrack).toHaveBeenCalledWith({
        code: "D",
        label: "Série D",
      });
    });

    act(() => jest.advanceTimersByTime(2000));

    fireEvent.press(
      await screen.findByTestId("national-track-edit-track-national-created"),
    );
    fireEvent.changeText(
      await screen.findByTestId("national-track-form-label"),
      "Série D renommée",
    );
    fireEvent.press(await screen.findByTestId("national-track-form-submit"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.updateNationalTrack).toHaveBeenCalledWith(
        "track-national-created",
        expect.objectContaining({ label: "Série D renommée" }),
      );
    });

    act(() => jest.advanceTimersByTime(2000));

    fireEvent.press(
      await screen.findByTestId("national-track-delete-track-national-created"),
    );
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.deleteNationalTrack).toHaveBeenCalledWith(
        "track-national-created",
      );
    });
  });

  it("crée un curriculum national avec une filière et l'affiche dans la liste", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "TLE",
        label: "Terminale",
        cycleId: null,
        cycle: null,
        languageSystem: null,
        isNational: true,
      },
    ];
    nationalTracksState = [
      {
        id: "track-1",
        code: "D",
        label: "Série D",
        isNational: true,
        _count: { classes: 0, curriculums: 0 },
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("national-catalog-tab-curriculums"),
    );
    fireEvent.press(await screen.findByTestId("national-catalog-fab"));

    fireEvent.press(
      await screen.findByTestId("national-curriculum-form-level"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "national-curriculum-form-level-option-level-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("national-curriculum-form-track"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "national-curriculum-form-track-option-track-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("national-curriculum-form-submit"),
    );

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.createNationalCurriculum,
      ).toHaveBeenCalledWith({
        academicLevelId: "level-1",
        trackId: "track-1",
      });
    });

    expect(await screen.findByText("Série D")).toBeTruthy();
  });

  it("crée, modifie une matière nationale puis la rattache à un curriculum avec un coefficient", async () => {
    jest.useFakeTimers();
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalCurriculumsState = [
      {
        id: "curriculum-1",
        name: "6EME - TRONC_COMMUN",
        academicLevelId: "level-1",
        trackId: null,
        academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
        track: null,
        isNational: true,
        _count: { classes: 0, subjects: 0 },
      },
    ];
    nationalSubjectsState = [
      {
        id: "subject-1",
        code: "MATH",
        name: "Maths",
        isNational: true,
        _count: {
          assignments: 0,
          studentGrades: 0,
          curriculumSubjects: 0,
          classOverrides: 0,
        },
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("national-catalog-tab-subjects"));
    await screen.findByText("Maths");

    fireEvent.press(await screen.findByTestId("national-catalog-fab"));
    fireEvent.changeText(
      await screen.findByTestId("national-subject-form-code"),
      "PHYS",
    );
    fireEvent.changeText(
      screen.getByTestId("national-subject-form-name"),
      "Physique",
    );
    fireEvent.press(screen.getByTestId("national-subject-form-submit"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.createNationalSubject).toHaveBeenCalledWith(
        { code: "PHYS", name: "Physique" },
      );
    });

    act(() => jest.advanceTimersByTime(2000));

    fireEvent.press(
      await screen.findByTestId("national-subject-edit-subject-1"),
    );
    fireEvent.changeText(
      await screen.findByTestId("national-subject-form-name"),
      "Mathematiques",
    );
    fireEvent.press(screen.getByTestId("national-subject-form-submit"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.updateNationalSubject).toHaveBeenCalledWith(
        "subject-1",
        expect.objectContaining({ name: "Mathematiques" }),
      );
    });

    act(() => jest.advanceTimersByTime(2000));

    fireEvent.press(
      await screen.findByTestId("national-rattachement-curriculum"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "national-rattachement-curriculum-option-curriculum-1",
      ),
    );

    fireEvent.press(
      await screen.findByTestId(
        "curriculums-national-curriculum-subject-subject",
      ),
    );
    fireEvent.press(
      await screen.findByTestId(
        "curriculums-national-curriculum-subject-subject-option-subject-1",
      ),
    );
    fireEvent.changeText(
      screen.getByTestId("curriculums-national-curriculum-subject-coefficient"),
      "4",
    );
    fireEvent.press(
      screen.getByTestId("curriculums-national-curriculum-subject-submit"),
    );

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.upsertNationalCurriculumSubject,
      ).toHaveBeenCalledWith("curriculum-1", {
        subjectId: "subject-1",
        isMandatory: true,
        coefficient: 4,
        weeklyHours: undefined,
      });
    });
  });
});
