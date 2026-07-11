import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { SchoolsAdminScreen } from "../../src/components/schools/SchoolsAdminScreen";
import { schoolsApi } from "../../src/api/schools.api";
import type { AuthUser } from "../../src/types/auth.types";
import type { SchoolRow } from "../../src/types/schools.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/schools.api");

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

const mockSchoolsApi = schoolsApi as jest.Mocked<typeof schoolsApi>;

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

function makeSchool(overrides?: Partial<SchoolRow>): SchoolRow {
  return {
    id: "school-1",
    slug: "college-vogt",
    name: "Collège Vogt",
    country: "Cameroun",
    region: "Centre",
    city: "Yaoundé",
    cycle: "SECONDARY",
    languageSystem: "FRANCOPHONE",
    logoUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    usersCount: 10,
    classesCount: 4,
    studentsCount: 120,
    ...overrides,
  };
}

let schoolsState: SchoolRow[];

beforeEach(() => {
  jest.clearAllMocks();
  schoolsState = [];

  mockSchoolsApi.listSchools.mockImplementation(async () => schoolsState);
  mockSchoolsApi.createSchool.mockImplementation(async (payload) => {
    schoolsState = [
      ...schoolsState,
      makeSchool({
        id: "school-created",
        slug: "nouvelle-ecole",
        name: payload.name,
        cycle: payload.cycle ?? null,
        languageSystem: payload.languageSystem ?? null,
        usersCount: 0,
        classesCount: 0,
        studentsCount: 0,
      }),
    ];
    return { userExisted: false, setupCompleted: false };
  });
  mockSchoolsApi.updateSchool.mockImplementation(async (id, payload) => {
    schoolsState = schoolsState.map((entry) =>
      entry.id === id ? { ...entry, ...payload } : entry,
    );
    return schoolsState.find((entry) => entry.id === id)!;
  });
  mockSchoolsApi.deleteSchool.mockImplementation(async (id) => {
    schoolsState = schoolsState.filter((entry) => entry.id !== id);
    return { success: true };
  });
  mockSchoolsApi.addSchoolAdmin.mockResolvedValue({
    schoolAdmin: {
      id: "admin-2",
      email: "new.admin@vogt.cm",
      firstName: "New",
    },
    userExisted: false,
    setupCompleted: false,
  });
});

describe("SchoolsAdminScreen", () => {
  it("refuse l'accès à un SCHOOL_ADMIN", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSchoolAdminUser() };

    render(<SchoolsAdminScreen />);

    expect(await screen.findByTestId("schools-header")).toBeTruthy();
    expect(await screen.findByText("Accès non autorisé")).toBeTruthy();
    expect(mockSchoolsApi.listSchools).not.toHaveBeenCalled();
  });

  it("liste les écoles en cartes pour un SUPER_ADMIN", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    const card = await screen.findByTestId("schools-card-school-1");
    expect(card).toHaveTextContent(/Collège Vogt/);
    within(card).getByTestId("schools-edit-school-1");
    within(card).getByTestId("schools-delete-school-1");
  });

  it("filtre les écoles via la recherche du header", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [
      makeSchool(),
      makeSchool({
        id: "school-2",
        slug: "greenwich-college",
        name: "Greenwich College",
        city: "Bamenda",
        region: "Nord-Ouest",
      }),
    ];

    render(<SchoolsAdminScreen />);

    await screen.findByTestId("schools-card-school-1");

    fireEvent.press(screen.getByTestId("schools-search-toggle"));
    fireEvent.changeText(
      screen.getByTestId("schools-filter-search-input"),
      "greenwich",
    );

    await waitFor(() => {
      expect(screen.queryByTestId("schools-card-school-1")).toBeNull();
      expect(screen.getByTestId("schools-card-school-2")).toBeTruthy();
    });
  });

  it("crée une école avec cycle, système linguistique et email du school admin", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-create"));
    await screen.findByTestId("schools-create-form");

    fireEvent.changeText(
      screen.getByTestId("schools-create-name"),
      "Greenwich College",
    );
    fireEvent.changeText(
      screen.getByTestId("schools-create-admin-email"),
      "admin@greenwich.cm",
    );

    fireEvent.press(screen.getByTestId("schools-create-cycle"));
    fireEvent.press(
      await screen.findByTestId("schools-create-cycle-option-SECONDARY"),
    );
    fireEvent.press(screen.getByTestId("schools-create-language-system"));
    fireEvent.press(
      await screen.findByTestId(
        "schools-create-language-system-option-ANGLOPHONE",
      ),
    );

    fireEvent.press(screen.getByTestId("schools-create-submit"));

    await waitFor(() => {
      expect(mockSchoolsApi.createSchool).toHaveBeenCalledWith({
        name: "Greenwich College",
        country: undefined,
        region: undefined,
        city: undefined,
        cycle: "SECONDARY",
        languageSystem: "ANGLOPHONE",
        schoolAdminEmail: "admin@greenwich.cm",
      });
    });
  });

  it("modifie une école existante", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-edit-school-1"));

    const nameInput = await screen.findByTestId("schools-edit-name");
    fireEvent.changeText(nameInput, "Collège Vogt Premium");

    fireEvent.press(screen.getByTestId("schools-edit-submit"));

    await waitFor(() => {
      expect(mockSchoolsApi.updateSchool).toHaveBeenCalledWith("school-1", {
        name: "Collège Vogt Premium",
        country: "Cameroun",
        region: "Centre",
        city: "Yaoundé",
        cycle: "SECONDARY",
        languageSystem: "FRANCOPHONE",
      });
    });
  });

  it("ajoute un school admin depuis l'édition d'une école", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-edit-school-1"));
    await screen.findByTestId("schools-add-admin-form");

    fireEvent.changeText(
      screen.getByTestId("schools-add-admin-email"),
      "new.admin@vogt.cm",
    );
    fireEvent.press(screen.getByTestId("schools-add-admin-submit"));

    await waitFor(() => {
      expect(mockSchoolsApi.addSchoolAdmin).toHaveBeenCalledWith("school-1", {
        email: "new.admin@vogt.cm",
      });
    });
  });

  it("supprime une école après confirmation", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-delete-school-1"));

    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockSchoolsApi.deleteSchool).toHaveBeenCalledWith("school-1");
    });
  });
});
