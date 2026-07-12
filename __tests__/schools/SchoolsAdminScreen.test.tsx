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
import { colors } from "../../src/theme";
import type { AuthUser } from "../../src/types/auth.types";
import type {
  SchoolRow,
  SchoolsListParams,
  SchoolsListResult,
  SchoolsOverview,
} from "../../src/types/schools.types";

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

function computeOverview(schools: SchoolRow[]): SchoolsOverview {
  const byCycle: SchoolsOverview["byCycle"] = {
    PRIMARY: { schools: 0, students: 0, classes: 0 },
    SECONDARY: { schools: 0, students: 0, classes: 0 },
    UNSET: { schools: 0, students: 0, classes: 0 },
  };
  let totalStudents = 0;
  let totalClasses = 0;
  for (const school of schools) {
    const key = school.cycle ?? "UNSET";
    byCycle[key].schools += 1;
    byCycle[key].students += school.studentsCount;
    byCycle[key].classes += school.classesCount;
    totalStudents += school.studentsCount;
    totalClasses += school.classesCount;
  }
  return {
    totals: {
      schools: schools.length,
      students: totalStudents,
      classes: totalClasses,
    },
    byCycle,
  };
}

function computeListResult(
  schools: SchoolRow[],
  params: SchoolsListParams = {},
): SchoolsListResult {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  let filtered = [...schools].sort((a, b) => a.name.localeCompare(b.name));

  const search = params.search?.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter((school) =>
      [school.name, school.slug, school.city, school.region, school.country]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search)),
    );
  }
  if (params.cycle) {
    filtered = filtered.filter((school) => school.cycle === params.cycle);
  }
  if (params.languageSystem) {
    filtered = filtered.filter(
      (school) => school.languageSystem === params.languageSystem,
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return { items, meta: { page, limit, total, totalPages } };
}

function makeManySchools(count: number): SchoolRow[] {
  return Array.from({ length: count }, (_, index) => {
    const n = String(index + 1).padStart(2, "0");
    return makeSchool({
      id: `school-bulk-${n}`,
      slug: `ecole-${n}`,
      name: `École ${n}`,
      cycle: "SECONDARY",
      studentsCount: 10,
      classesCount: 1,
    });
  });
}

let schoolsState: SchoolRow[];

beforeEach(() => {
  jest.clearAllMocks();
  schoolsState = [];

  mockSchoolsApi.listSchools.mockImplementation(async (params) =>
    computeListResult(schoolsState, params),
  );
  mockSchoolsApi.getSchoolsOverview.mockImplementation(async () =>
    computeOverview(schoolsState),
  );
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
    return {
      school: {
        id: "school-created",
        slug: "nouvelle-ecole",
        name: payload.name,
        country: payload.country ?? null,
        region: payload.region ?? null,
        city: payload.city ?? null,
        cycle: payload.cycle ?? null,
        languageSystem: payload.languageSystem ?? null,
        logoUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      userExisted: false,
      setupCompleted: false,
    };
  });
  mockSchoolsApi.addSchoolAdmin.mockImplementation(async () => ({
    schoolAdmin: {
      id: "extra-admin-1",
      email: "extra@greenwich.cm",
      firstName: "Extra",
    },
    userExisted: false,
    setupCompleted: false,
  }));
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
    expect(mockSchoolsApi.getSchoolsOverview).not.toHaveBeenCalled();
  });

  it("affiche la synthèse par cycle par défaut, préchargée dès l'arrivée sur le module", async () => {
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

    // Les 3 cartes KPI sont sur une seule rangée, chacune avec sa propre
    // bordure gauche colorée (design "vue d'ensemble" de la landing page).
    const overviewRow = within(synthese).getByTestId(
      "schools-synthese-overview",
    );
    expect(overviewRow.props.style).toEqual(
      expect.objectContaining({ flexDirection: "row" }),
    );
    expect(
      within(synthese).getByTestId("schools-synthese-total-schools").props
        .style,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderLeftColor: colors.primary }),
      ]),
    );
    expect(
      within(synthese).getByTestId("schools-synthese-total-students").props
        .style,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderLeftColor: colors.accentTeal }),
      ]),
    );
    expect(
      within(synthese).getByTestId("schools-synthese-total-classes").props
        .style,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderLeftColor: colors.warmAccent }),
      ]),
    );

    // La première page de la liste est préchargée en parallèle, sans avoir
    // besoin de cliquer sur l'onglet "Liste".
    await waitFor(() => {
      expect(mockSchoolsApi.listSchools).toHaveBeenCalled();
    });
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

  it("filtre les écoles via la recherche (debounce, appel serveur)", async () => {
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

    fireEvent.changeText(
      screen.getByTestId("schools-search-input"),
      "greenwich",
    );

    // Le debounce (300ms) doit s'écouler avant que la recherche ne parte
    // vers l'API.
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(screen.queryByTestId("schools-card-school-1")).toBeNull();
      expect(screen.getByTestId("schools-card-school-2")).toBeTruthy();
    });

    expect(mockSchoolsApi.listSchools).toHaveBeenCalledWith(
      expect.objectContaining({ search: "greenwich", page: 1 }),
    );
  });

  it("efface la recherche via le bouton clear et retrouve toute la liste", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [
      makeSchool(),
      makeSchool({ id: "school-2", slug: "ecole-2", name: "École secondaire" }),
    ];

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    await screen.findByTestId("schools-card-school-1");

    fireEvent.changeText(screen.getByTestId("schools-search-input"), "vogt");
    await new Promise((resolve) => setTimeout(resolve, 650));
    await waitFor(() => {
      expect(screen.queryByTestId("schools-card-school-2")).toBeNull();
    });

    fireEvent.press(screen.getByTestId("schools-search-clear"));
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(screen.getByTestId("schools-card-school-1")).toBeTruthy();
      expect(screen.getByTestId("schools-card-school-2")).toBeTruthy();
    });
  });

  it("affiche un message vide dédié quand la recherche ne matche rien", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    await screen.findByTestId("schools-card-school-1");

    fireEvent.changeText(
      screen.getByTestId("schools-search-input"),
      "introuvable",
    );

    await new Promise((resolve) => setTimeout(resolve, 650));

    expect(
      await screen.findByText("Aucune école ne correspond à la recherche."),
    ).toBeTruthy();
  });

  it("applique un filtre par cycle depuis le panneau de filtres et l'indique comme actif", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [
      makeSchool({ cycle: "SECONDARY" }),
      makeSchool({
        id: "school-2",
        slug: "ecole-primaire",
        name: "École primaire",
        cycle: "PRIMARY",
      }),
    ];

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    await screen.findByTestId("schools-card-school-1");
    await screen.findByTestId("schools-card-school-2");

    const toggle = screen.getByTestId("schools-filter-toggle");
    expect(toggle.props.style).not.toEqual(
      expect.objectContaining({ backgroundColor: colors.accentTeal }),
    );

    fireEvent.press(toggle);
    expect(await screen.findByTestId("schools-filter-panel")).toBeTruthy();
    fireEvent.press(await screen.findByTestId("schools-filter-cycle-PRIMARY"));
    fireEvent.press(screen.getByTestId("schools-filter-apply"));

    // Le panneau se ferme après application.
    await waitFor(() => {
      expect(screen.queryByTestId("schools-filter-panel")).toBeNull();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("schools-card-school-1")).toBeNull();
      expect(screen.getByTestId("schools-card-school-2")).toBeTruthy();
    });

    expect(mockSchoolsApi.listSchools).toHaveBeenCalledWith(
      expect.objectContaining({ cycle: "PRIMARY", page: 1 }),
    );

    // Le bouton filtre passe en teal actif une fois un filtre appliqué.
    expect(screen.getByTestId("schools-filter-toggle").props.style).toEqual(
      expect.objectContaining({ backgroundColor: colors.accentTeal }),
    );
  });

  it("réinitialise les filtres appliqués via le bouton Réinitialiser", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [
      makeSchool({ cycle: "SECONDARY" }),
      makeSchool({
        id: "school-2",
        slug: "ecole-primaire",
        name: "École primaire",
        cycle: "PRIMARY",
      }),
    ];

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    await screen.findByTestId("schools-card-school-1");

    fireEvent.press(screen.getByTestId("schools-filter-toggle"));
    fireEvent.press(await screen.findByTestId("schools-filter-cycle-PRIMARY"));
    fireEvent.press(screen.getByTestId("schools-filter-apply"));

    // Laisse le temps au scheduler React de traiter la réponse mockée et de
    // committer le nouveau rendu avant de vérifier les assertions (évite un
    // flush incomplet en environnement de test).
    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.queryByTestId("schools-card-school-1")).toBeNull();
    });

    fireEvent.press(screen.getByTestId("schools-filter-toggle"));
    fireEvent.press(screen.getByTestId("schools-filter-reset"));

    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => {
      expect(screen.getByTestId("schools-card-school-1")).toBeTruthy();
      expect(screen.getByTestId("schools-card-school-2")).toBeTruthy();
    });
  });

  it("ferme le panneau de filtres sans appliquer les changements en cours via Fermer", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [
      makeSchool({ cycle: "SECONDARY" }),
      makeSchool({
        id: "school-2",
        slug: "ecole-primaire",
        name: "École primaire",
        cycle: "PRIMARY",
      }),
    ];

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    await screen.findByTestId("schools-card-school-1");

    fireEvent.press(screen.getByTestId("schools-filter-toggle"));
    fireEvent.press(await screen.findByTestId("schools-filter-cycle-PRIMARY"));
    fireEvent.press(screen.getByTestId("schools-filter-close"));

    // Rien n'a été appliqué : toujours les deux écoles.
    expect(screen.getByTestId("schools-card-school-1")).toBeTruthy();
    expect(screen.getByTestId("schools-card-school-2")).toBeTruthy();

    // Le brouillon a bien été remis à l'état appliqué (aucun cycle) en
    // rouvrant le panneau.
    fireEvent.press(screen.getByTestId("schools-filter-toggle"));
    expect(await screen.findByTestId("schools-filter-cycle-all")).toBeTruthy();
  });

  it("charge la page suivante via l'infinite scroll", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = makeManySchools(25);

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));

    await screen.findByTestId("schools-card-school-bulk-01");
    expect(screen.queryByTestId("schools-card-school-bulk-21")).toBeNull();

    fireEvent(screen.getByTestId("schools-list"), "onEndReached", {
      distanceFromEnd: 0,
    });

    await waitFor(() => {
      expect(mockSchoolsApi.listSchools).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });

    // La page suivante (dernière, 5 écoles sur 25) a été chargée : la liste
    // n'a plus de page suivante à charger.
    await waitFor(() => {
      expect(screen.getByTestId("infinite-scroll-end-footer")).toBeTruthy();
    });
  });

  it("affiche le footer de fin de liste quand il n'y a plus de page suivante", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };
    schoolsState = [makeSchool()];

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));

    await screen.findByTestId("schools-card-school-1");
    expect(
      await screen.findByTestId("infinite-scroll-end-footer"),
    ).toBeTruthy();
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
      screen.getByTestId("schools-create-main-admin-email"),
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
        country: "Cameroun",
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

  it("verrouille le pays sur Cameroun et propose région/ville en cascade avec recherche", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-fab"));
    await screen.findByTestId("schools-create-form");

    // Pays verrouillé sur Cameroun, non éditable.
    const countryInput = screen.getByTestId("schools-create-country-input");
    expect(countryInput.props.value).toBe("Cameroun");
    expect(countryInput.props.editable).toBe(false);

    // La ville est désactivée tant qu'aucune région n'est choisie.
    const cityInputBefore = screen.getByTestId("schools-create-city-input");
    expect(cityInputBefore.props.editable).toBe(false);

    // Choix de la région "Littoral" via la recherche par frappe.
    const regionInput = screen.getByTestId("schools-create-region-input");
    fireEvent(regionInput, "focus");
    fireEvent.changeText(regionInput, "litto");
    fireEvent.press(
      await screen.findByTestId("schools-create-region-option-Littoral"),
    );

    // La ville se débloque et propose les villes du Littoral.
    const cityInputAfter = screen.getByTestId("schools-create-city-input");
    expect(cityInputAfter.props.editable).toBe(true);
    fireEvent(cityInputAfter, "focus");
    fireEvent.changeText(cityInputAfter, "doua");
    fireEvent.press(
      await screen.findByTestId("schools-create-city-option-Douala"),
    );

    fireEvent.changeText(
      screen.getByTestId("schools-create-name"),
      "École du Littoral",
    );
    fireEvent.changeText(
      screen.getByTestId("schools-create-main-admin-email"),
      "admin@littoral.cm",
    );
    fireEvent.press(screen.getByTestId("schools-create-submit"));

    await waitFor(() => {
      expect(mockSchoolsApi.createSchool).toHaveBeenCalledWith(
        expect.objectContaining({
          country: "Cameroun",
          region: "Littoral",
          city: "Douala",
        }),
      );
    });
  });

  it("crée l'admin fondateur par téléphone + PIN quand ce mode est choisi", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-fab"));
    await screen.findByTestId("schools-create-form");

    fireEvent.changeText(
      screen.getByTestId("schools-create-name"),
      "École par téléphone",
    );
    fireEvent.press(screen.getByTestId("schools-create-main-admin-mode-phone"));
    fireEvent.changeText(
      screen.getByTestId("schools-create-main-admin-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("schools-create-main-admin-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("schools-create-submit"));

    await waitFor(() => {
      expect(mockSchoolsApi.createSchool).toHaveBeenCalledWith(
        expect.objectContaining({
          schoolAdminPhone: "699001122",
          schoolAdminPin: "123456",
        }),
      );
    });
    expect(mockSchoolsApi.createSchool).toHaveBeenCalledWith(
      expect.not.objectContaining({ schoolAdminEmail: expect.anything() }),
    );
  });

  it("permet d'ajouter et de retirer des administrateurs supplémentaires à la création", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-fab"));
    await screen.findByTestId("schools-create-form");

    fireEvent.changeText(
      screen.getByTestId("schools-create-name"),
      "École multi-admins",
    );
    fireEvent.changeText(
      screen.getByTestId("schools-create-main-admin-email"),
      "principal@ecole.cm",
    );

    fireEvent.press(screen.getByTestId("schools-create-add-admin"));
    expect(
      screen.getByTestId("schools-create-additional-admin-0"),
    ).toBeTruthy();

    // Un deuxième administrateur additionnel, par téléphone.
    fireEvent.press(screen.getByTestId("schools-create-add-admin"));
    fireEvent.press(
      screen.getByTestId("schools-create-additional-admin-1-mode-phone"),
    );
    fireEvent.changeText(
      screen.getByTestId("schools-create-additional-admin-1-phone"),
      "677889900",
    );
    fireEvent.changeText(
      screen.getByTestId("schools-create-additional-admin-1-pin"),
      "654321",
    );

    // On retire le premier administrateur additionnel (resté vide) : le
    // deuxième (téléphone) glisse à l'index 0.
    fireEvent.press(
      screen.getByTestId("schools-create-additional-admin-0-remove"),
    );
    expect(
      screen.queryByTestId("schools-create-additional-admin-1"),
    ).toBeNull();
    expect(
      screen.getByTestId("schools-create-additional-admin-0-phone").props.value,
    ).toBe("677889900");

    fireEvent.press(screen.getByTestId("schools-create-submit"));

    await waitFor(() => {
      expect(mockSchoolsApi.createSchool).toHaveBeenCalledWith(
        expect.objectContaining({ schoolAdminEmail: "principal@ecole.cm" }),
      );
    });
    await waitFor(() => {
      expect(mockSchoolsApi.addSchoolAdmin).toHaveBeenCalledWith(
        "school-created",
        { phone: "677889900", pin: "654321" },
      );
    });
    expect(mockSchoolsApi.addSchoolAdmin).toHaveBeenCalledTimes(1);
  });

  it("bloque la soumission tant que l'admin fondateur téléphone n'a pas de PIN valide", async () => {
    mockAuthState = { schoolSlug: null, user: makeSuperAdminUser() };

    render(<SchoolsAdminScreen />);
    fireEvent.press(await screen.findByTestId("schools-tab-list"));
    fireEvent.press(await screen.findByTestId("schools-fab"));
    await screen.findByTestId("schools-create-form");

    fireEvent.changeText(
      screen.getByTestId("schools-create-name"),
      "École incomplète",
    );
    fireEvent.press(screen.getByTestId("schools-create-main-admin-mode-phone"));
    fireEvent.changeText(
      screen.getByTestId("schools-create-main-admin-phone"),
      "699001122",
    );
    // PIN volontairement laissé vide.
    fireEvent.press(screen.getByTestId("schools-create-submit"));

    expect(
      await screen.findByTestId("schools-create-main-admin-pin-error"),
    ).toBeTruthy();
    expect(mockSchoolsApi.createSchool).not.toHaveBeenCalled();
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
