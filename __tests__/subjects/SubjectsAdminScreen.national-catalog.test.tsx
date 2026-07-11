import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { subjectsApi } from "../../src/api/subjects.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { platformCatalogApi } from "../../src/api/platform-catalog.api";
import { SubjectsAdminScreen } from "../../src/components/subjects/SubjectsAdminScreen";
import type { AuthUser } from "../../src/types/auth.types";
import type { NationalSubjectRow } from "../../src/types/platform-catalog.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/subjects.api");
jest.mock("../../src/api/curriculums.api");
jest.mock("../../src/api/platform-catalog.api");

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
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

const mockSubjectsApi = subjectsApi as jest.Mocked<typeof subjectsApi>;
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

let nationalSubjectsState: NationalSubjectRow[];

beforeEach(() => {
  jest.clearAllMocks();
  nationalSubjectsState = [];

  mockSubjectsApi.listSubjects.mockResolvedValue([]);
  mockCurriculumsApi.listCurriculums.mockResolvedValue([]);

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
  mockPlatformCatalogApi.deleteNationalSubject.mockImplementation(
    async (id) => {
      nationalSubjectsState = nationalSubjectsState.filter(
        (entry) => entry.id !== id,
      );
      return { success: true };
    },
  );
});

describe("SubjectsAdminScreen — catalogue national", () => {
  it("n'affiche pas l'onglet catalogue national pour un SCHOOL_ADMIN", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSchoolAdminUser() };

    render(<SubjectsAdminScreen />);

    expect(await screen.findByTestId("subjects-admin-header")).toBeTruthy();
    expect(screen.queryByTestId("subjects-admin-tab-national")).toBeNull();
  });

  it("affiche l'onglet catalogue national pour un SUPER_ADMIN et liste les matières nationales", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalSubjectsState = [
      {
        id: "subject-national-1",
        code: "MATH",
        name: "Mathématiques",
        isNational: true,
        _count: {
          assignments: 0,
          studentGrades: 0,
          curriculumSubjects: 0,
          classOverrides: 0,
        },
      },
    ];

    render(<SubjectsAdminScreen />);

    const nationalTab = await screen.findByTestId(
      "subjects-admin-tab-national",
    );
    fireEvent.press(nationalTab);

    expect(
      await screen.findByTestId("subjects-admin-national-tab"),
    ).toBeTruthy();
    expect(await screen.findByText("Mathématiques")).toBeTruthy();
    expect(screen.getByText("MATH")).toBeTruthy();
  });

  it("crée une matière nationale avec le formulaire (soumission active, erreurs inline)", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-tab-national"));
    await screen.findByTestId("subjects-admin-national-tab");

    const submitButton = screen.getByTestId("subjects-admin-national-submit");
    fireEvent.press(submitButton);

    expect(
      await screen.findByTestId("subjects-admin-national-code-error"),
    ).toBeTruthy();
    expect(mockPlatformCatalogApi.createNationalSubject).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByTestId("subjects-admin-national-code"),
      "MATH",
    );
    fireEvent.changeText(
      screen.getByTestId("subjects-admin-national-name"),
      "Mathématiques",
    );
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockPlatformCatalogApi.createNationalSubject).toHaveBeenCalledWith(
        { code: "MATH", name: "Mathématiques" },
      );
    });
  });

  it("supprime une matière nationale après confirmation", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    nationalSubjectsState = [
      {
        id: "subject-national-1",
        code: "MATH",
        name: "Mathématiques",
        isNational: true,
        _count: {
          assignments: 0,
          studentGrades: 0,
          curriculumSubjects: 0,
          classOverrides: 0,
        },
      },
    ];

    render(<SubjectsAdminScreen />);

    fireEvent.press(await screen.findByTestId("subjects-admin-tab-national"));
    fireEvent.press(
      await screen.findByTestId(
        "subjects-admin-national-delete-subject-national-1",
      ),
    );

    const confirmButton = await screen.findByTestId("confirm-dialog-confirm");
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(mockPlatformCatalogApi.deleteNationalSubject).toHaveBeenCalledWith(
        "subject-national-1",
      );
    });
  });
});
