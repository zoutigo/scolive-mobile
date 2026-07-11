import React from "react";
import {
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
  NationalSubjectRow,
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

let nationalLevelsState: NationalAcademicLevelRow[];
let nationalCurriculumsState: NationalCurriculumRow[];
let nationalSubjectsState: NationalSubjectRow[];
let nationalCurriculumSubjectsState: NationalCurriculumSubjectRow[];

beforeEach(() => {
  jest.clearAllMocks();
  nationalLevelsState = [];
  nationalCurriculumsState = [];
  nationalSubjectsState = [];
  nationalCurriculumSubjectsState = [];

  mockCurriculumsApi.listAcademicLevels.mockResolvedValue([]);
  mockCurriculumsApi.listTracks.mockResolvedValue([]);
  mockCurriculumsApi.listCurriculums.mockResolvedValue([]);
  mockCurriculumsApi.listSubjects.mockResolvedValue([]);

  mockPlatformCatalogApi.listNationalAcademicLevels.mockImplementation(
    async () => nationalLevelsState,
  );
  mockPlatformCatalogApi.createNationalAcademicLevel.mockImplementation(
    async (payload) => {
      const created: NationalAcademicLevelRow = {
        id: "level-national-created",
        code: payload.code,
        label: payload.label,
        cycle: payload.cycle ?? null,
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
  mockPlatformCatalogApi.listNationalCurriculums.mockImplementation(
    async () => nationalCurriculumsState,
  );
  mockPlatformCatalogApi.createNationalCurriculum.mockImplementation(
    async (payload) => {
      const level = nationalLevelsState.find(
        (entry) => entry.id === payload.academicLevelId,
      );
      const created: NationalCurriculumRow = {
        id: "curriculum-national-created",
        name: `${level?.code ?? "N/A"} - TRONC_COMMUN`,
        academicLevelId: payload.academicLevelId,
        academicLevel: level ?? {
          id: payload.academicLevelId,
          code: "N/A",
          label: "N/A",
        },
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
  it("n'affiche pas l'onglet catalogue national pour un SCHOOL_ADMIN", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSchoolAdminUser() };

    render(<CurriculumsAdminScreen />);

    expect(await screen.findByTestId("curriculums-header")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByTestId("curriculums-tab-national")).toBeNull();
    });
  });

  it("affiche l'onglet catalogue national pour un SUPER_ADMIN et liste niveaux + curriculums", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycle: "SECONDARY",
        languageSystem: "FRANCOPHONE",
        isNational: true,
      },
    ];
    nationalCurriculumsState = [
      {
        id: "curriculum-1",
        name: "6EME - TRONC_COMMUN",
        academicLevelId: "level-1",
        academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
        isNational: true,
        _count: { classes: 0, subjects: 0 },
      },
    ];

    render(<CurriculumsAdminScreen />);

    const nationalTab = await screen.findByTestId("curriculums-tab-national");
    fireEvent.press(nationalTab);

    expect(await screen.findByTestId("curriculums-national-tab")).toBeTruthy();
    expect((await screen.findAllByText("6ème")).length).toBeGreaterThan(0);
    expect(await screen.findByText("6EME - TRONC_COMMUN")).toBeTruthy();
    expect(await screen.findByText("Secondaire · Francophone")).toBeTruthy();
  });

  it("crée un niveau académique national avec soumission active et erreurs inline", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("curriculums-tab-national"));
    await screen.findByTestId("curriculums-national-tab");

    const submitButton = screen.getByTestId(
      "curriculums-national-level-submit",
    );
    fireEvent.press(submitButton);

    expect(
      await screen.findByTestId("curriculums-national-level-code-error"),
    ).toBeTruthy();
    expect(
      mockPlatformCatalogApi.createNationalAcademicLevel,
    ).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByTestId("curriculums-national-level-code"),
      "6EME",
    );
    fireEvent.changeText(
      screen.getByTestId("curriculums-national-level-label"),
      "6ème",
    );
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.createNationalAcademicLevel,
      ).toHaveBeenCalledWith({ code: "6EME", label: "6ème" });
    });
  });

  it("crée un niveau académique national anglophone secondaire avec cycle et système sélectionnés", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("curriculums-tab-national"));
    await screen.findByTestId("curriculums-national-tab");

    fireEvent.changeText(
      screen.getByTestId("curriculums-national-level-code"),
      "FORM1",
    );
    fireEvent.changeText(
      screen.getByTestId("curriculums-national-level-label"),
      "Form 1",
    );

    fireEvent.press(screen.getByTestId("curriculums-national-level-cycle"));
    fireEvent.press(
      await screen.findByTestId(
        "curriculums-national-level-cycle-option-SECONDARY",
      ),
    );

    fireEvent.press(
      screen.getByTestId("curriculums-national-level-language-system"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "curriculums-national-level-language-system-option-ANGLOPHONE",
      ),
    );

    fireEvent.press(screen.getByTestId("curriculums-national-level-submit"));

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.createNationalAcademicLevel,
      ).toHaveBeenCalledWith({
        code: "FORM1",
        label: "Form 1",
        cycle: "SECONDARY",
        languageSystem: "ANGLOPHONE",
      });
    });

    expect(await screen.findByText("Secondaire · Anglophone")).toBeTruthy();

    expect(
      screen.getByTestId("curriculums-national-level-code").props.value,
    ).toBe("");
  });

  it("supprime un niveau académique national après confirmation", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycle: "SECONDARY",
        languageSystem: "FRANCOPHONE",
        isNational: true,
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("curriculums-tab-national"));
    fireEvent.press(
      await screen.findByTestId("curriculums-national-level-delete-level-1"),
    );

    const confirmButton = await screen.findByTestId("confirm-dialog-confirm");
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.deleteNationalAcademicLevel,
      ).toHaveBeenCalledWith("level-1");
    });
  });

  it("modifie un niveau académique national existant", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycle: "SECONDARY",
        languageSystem: "FRANCOPHONE",
        isNational: true,
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("curriculums-tab-national"));
    fireEvent.press(
      await screen.findByTestId("curriculums-national-level-edit-level-1"),
    );

    const codeInput = await screen.findByTestId(
      "curriculums-national-level-edit-code",
    );
    fireEvent.changeText(codeInput, "6EME-BIS");

    fireEvent.press(
      await screen.findByTestId("curriculums-national-level-edit-submit"),
    );

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.updateNationalAcademicLevel,
      ).toHaveBeenCalledWith(
        "level-1",
        expect.objectContaining({ code: "6EME-BIS" }),
      );
    });
  });

  it("modifie un curriculum national existant", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycle: null,
        languageSystem: null,
        isNational: true,
      },
      {
        id: "level-2",
        code: "5EME",
        label: "5ème",
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
        academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
        isNational: true,
        _count: { classes: 0, subjects: 0 },
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("curriculums-tab-national"));
    fireEvent.press(
      await screen.findByTestId(
        "curriculums-national-curriculum-edit-curriculum-1",
      ),
    );

    fireEvent.press(
      await screen.findByTestId("curriculums-national-curriculum-edit-level"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "curriculums-national-curriculum-edit-level-option-level-2",
      ),
    );

    fireEvent.press(
      await screen.findByTestId("curriculums-national-curriculum-edit-submit"),
    );

    await waitFor(() => {
      expect(
        mockPlatformCatalogApi.updateNationalCurriculum,
      ).toHaveBeenCalledWith("curriculum-1", { academicLevelId: "level-2" });
    });
  });

  it("affiche les compteurs par cycle", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };
    nationalLevelsState = [
      {
        id: "level-1",
        code: "6EME",
        label: "6ème",
        cycle: "SECONDARY",
        languageSystem: "FRANCOPHONE",
        isNational: true,
      },
      {
        id: "level-2",
        code: "CP",
        label: "CP",
        cycle: "PRIMARY",
        languageSystem: "FRANCOPHONE",
        isNational: true,
      },
    ];

    render(<CurriculumsAdminScreen />);

    fireEvent.press(await screen.findByTestId("curriculums-tab-national"));

    const secondaryRow = await screen.findByTestId(
      "curriculums-national-cycle-row-SECONDARY",
    );
    expect(secondaryRow).toHaveTextContent(/1 niveau national/);
    const primaryRow = await screen.findByTestId(
      "curriculums-national-cycle-row-PRIMARY",
    );
    expect(primaryRow).toHaveTextContent(/1 niveau national/);
  });

  it("crée, modifie une matière nationale puis la rattache à un curriculum avec un coefficient", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSuperAdminUser() };
    nationalCurriculumsState = [
      {
        id: "curriculum-1",
        name: "6EME - TRONC_COMMUN",
        academicLevelId: "level-1",
        academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
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

    fireEvent.press(await screen.findByTestId("curriculums-tab-national"));
    await screen.findByText("Maths");

    fireEvent.changeText(
      screen.getByTestId("curriculums-national-subject-code"),
      "PHYS",
    );
    fireEvent.changeText(
      screen.getByTestId("curriculums-national-subject-name"),
      "Physique",
    );
    fireEvent.press(screen.getByTestId("curriculums-national-subject-submit"));

    await waitFor(() => {
      expect(mockPlatformCatalogApi.createNationalSubject).toHaveBeenCalledWith(
        { code: "PHYS", name: "Physique" },
      );
    });

    fireEvent.press(
      screen.getByTestId("curriculums-national-subject-edit-subject-1"),
    );
    fireEvent.changeText(
      await screen.findByTestId("curriculums-national-subject-edit-name"),
      "Mathematiques",
    );
    fireEvent.press(
      screen.getByTestId("curriculums-national-subject-edit-submit"),
    );

    await waitFor(() => {
      expect(mockPlatformCatalogApi.updateNationalSubject).toHaveBeenCalledWith(
        "subject-1",
        expect.objectContaining({ name: "Mathematiques" }),
      );
    });

    fireEvent.press(
      screen.getByTestId("curriculums-national-rattachement-curriculum"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "curriculums-national-rattachement-curriculum-option-curriculum-1",
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
