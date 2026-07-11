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

beforeEach(() => {
  jest.clearAllMocks();
  nationalLevelsState = [];
  nationalCurriculumsState = [];

  mockCurriculumsApi.listAcademicLevels.mockResolvedValue([]);
  mockCurriculumsApi.listTracks.mockResolvedValue([]);
  mockCurriculumsApi.listCurriculums.mockResolvedValue([]);
  mockCurriculumsApi.listSubjects.mockResolvedValue([]);

  mockPlatformCatalogApi.listNationalAcademicLevels.mockImplementation(
    async () => nationalLevelsState,
  );
  mockPlatformCatalogApi.listNationalCurriculums.mockImplementation(
    async () => nationalCurriculumsState,
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
  mockPlatformCatalogApi.deleteNationalAcademicLevel.mockImplementation(
    async (id) => {
      nationalLevelsState = nationalLevelsState.filter(
        (entry) => entry.id !== id,
      );
      return { success: true };
    },
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
  mockPlatformCatalogApi.deleteNationalCurriculum.mockImplementation(
    async (id) => {
      nationalCurriculumsState = nationalCurriculumsState.filter(
        (entry) => entry.id !== id,
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
});
