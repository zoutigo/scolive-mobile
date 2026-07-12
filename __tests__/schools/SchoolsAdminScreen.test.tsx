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

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
    push: mockPush,
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
    academicYear: { id: "year-1", label: "2025-2026" },
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
        academicYear: null,
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
});

describe("SchoolsAdminScreen", () => {
  it("refuse l'accès à un SCHOOL_ADMIN", async () => {
    mockAuthState = { schoolSlug: "college-vogt", user: makeSchoolAdminUser() };

    render(<SchoolsAdminScreen />);

    expect(await screen.findByTestId("schools-header")).toBeTruthy();
    expect(await screen.findByText("Accès non autorisé")).toBeTruthy();
    expect(mockSchoolsApi.listSchools).not.toHaveBeenCalled();
  });

  it("affiche la synthèse par cycle par défaut", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [
      makeSchool(),
      makeSchool({
        id: "school-2",
        slug: "ecole-primaire",
        name: "École primaire du lac",
        cycle: "PRIMARY",
        studentsCount: 60,
        classesCount: 3,
      }),
      makeSchool({
        id: "school-3",
        slug: "ecole-sans-cycle",
        name: "École sans cycle",
        cycle: null,
        studentsCount: 5,
        classesCount: 1,
      }),
    ];

    render(<SchoolsAdminScreen />);

    const synthese = await screen.findByTestId("schools-synthese-tab");
    expect(
      within(synthese).getByTestId("schools-synthese-total-schools"),
    ).toHaveTextContent(/3/);
    expect(
      within(synthese).getByTestId("schools-synthese-cycle-PRIMARY"),
    ).toBeTruthy();
    expect(
      within(synthese).getByTestId("schools-synthese-cycle-SECONDARY"),
    ).toBeTruthy();
    expect(
      within(synthese).getByTestId("schools-synthese-cycle-UNSET"),
    ).toBeTruthy();
  });

  it("liste les écoles en cartes avec header/body/footer pour un SUPER_ADMIN", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));

    const card = await screen.findByTestId("schools-card-school-1");
    expect(card).toHaveTextContent(/Collège Vogt/);
    expect(card).toHaveTextContent(/2025-2026/);
    within(card).getByTestId("schools-view-school-1");
    within(card).getByTestId("schools-edit-school-1");
    within(card).getByTestId("schools-delete-school-1");
  });

  it("navigue vers la fiche détaillée au clic sur Voir", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-view-school-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/schools/[schoolId]",
      params: { schoolId: "school-1" },
    });
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

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
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

  it("crée une école via le FAB, avec toast et retour au tab d'origine après 2s", async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-fab"));

    const hero = await screen.findByTestId("schools-form-hero");
    expect(hero).toBeTruthy();
    expect(screen.queryByTestId("schools-tab-list")).toBeNull();
    expect(screen.queryByTestId("schools-fab")).toBeNull();

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

    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId("schools-tab-list")).toBeTruthy();
    });

    jest.useRealTimers();
  });

  it("annule la création sans appeler l'API et revient au tab d'origine", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-fab"));
    await screen.findByTestId("schools-create-form");

    fireEvent.press(screen.getByTestId("schools-create-cancel"));

    expect(await screen.findByTestId("schools-tab-list")).toBeTruthy();
    expect(mockSchoolsApi.createSchool).not.toHaveBeenCalled();
  });

  it("la flèche du header revient au tab d'origine depuis le formulaire, sans router.back", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-synthese"));
    fireEvent.press(await screen.findByTestId("schools-fab"));
    await screen.findByTestId("schools-create-form");

    fireEvent.press(screen.getByTestId("module-header-back"));

    expect(await screen.findByTestId("schools-tab-synthese")).toBeTruthy();
  });

  it("modifie une école existante depuis la carte", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
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

  it("affiche une erreur de validation sans appeler l'API si le nom est vide", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-edit-school-1"));

    const nameInput = await screen.findByTestId("schools-edit-name");
    fireEvent.changeText(nameInput, "");
    fireEvent.press(screen.getByTestId("schools-edit-submit"));

    expect(await screen.findByTestId("schools-edit-name-error")).toBeTruthy();
    expect(mockSchoolsApi.updateSchool).not.toHaveBeenCalled();
  });

  it("affiche un toast d'erreur et reste sur le formulaire en cas d'échec API", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];
    mockSchoolsApi.updateSchool.mockRejectedValueOnce(new Error("boom"));

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-edit-school-1"));
    fireEvent.press(await screen.findByTestId("schools-edit-submit"));

    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
    expect(screen.getByTestId("schools-edit-form-school-1")).toBeTruthy();
  });

  it("supprime une école après confirmation", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);

    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-delete-school-1"));

    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockSchoolsApi.deleteSchool).toHaveBeenCalledWith("school-1");
    });
  });
});
