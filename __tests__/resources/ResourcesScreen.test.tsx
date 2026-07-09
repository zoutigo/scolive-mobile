import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ResourcesScreen } from "../../src/components/resources/ResourcesScreen";
import { resourcesApi, resourcesAdminApi } from "../../src/api/resources.api";
import { useAuthStore } from "../../src/store/auth.store";
import { translate } from "../../src/i18n/useTranslation";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/resources.api");
jest.mock("../../src/store/auth.store");
const mockRouterPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    canGoBack: () => false,
    back: jest.fn(),
    navigate: jest.fn(),
    push: mockRouterPush,
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockResourcesApi = resourcesApi as jest.Mocked<typeof resourcesApi>;
const mockResourcesAdminApi = resourcesAdminApi as jest.Mocked<
  typeof resourcesAdminApi
>;

const TEACHER_USER = {
  id: "teacher-1",
  firstName: "Paul",
  lastName: "Martin",
  profileCompleted: true,
  platformRoles: [] as never[],
  memberships: [{ schoolId: "school-1", role: "TEACHER" as const }],
  role: "TEACHER" as const,
  activeRole: "TEACHER" as const,
};

const ADMIN_USER = {
  id: "admin-1",
  firstName: "Ada",
  lastName: "Admin",
  profileCompleted: true,
  platformRoles: ["SUPER_ADMIN"] as never[],
  memberships: [] as never[],
  role: "SUPER_ADMIN" as const,
  activeRole: "SUPER_ADMIN" as const,
};

const CATALOG = {
  academicLevels: [{ id: "level-1", code: "6EME", label: "6ème" }],
  subjects: [{ id: "subject-1", code: "MATH", name: "Mathématiques" }],
};

const BASE_RESOURCE = {
  id: "res-1",
  kind: "ASSESSMENT" as const,
  schoolId: "school-1",
  academicLevelId: "level-1",
  subjectId: "subject-1",
  examType: "SEQUENCE_TEST" as const,
  sequence: "SEQ_1" as const,
  academicYearLabel: "2025-2026",
  title: "Contrôle chapitre 3",
  authorUserId: "teacher-1",
  statementStatus: "APPROVED" as const,
  correctionContent: null,
  correctionStatus: "PENDING" as const,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  school: { id: "school-1", name: "École Test" },
  academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
  subject: { id: "subject-1", name: "Mathématiques" },
  authorUser: { id: "teacher-1", firstName: "Paul", lastName: "Martin" },
  isFavorite: false,
};

function mockDefaults() {
  mockResourcesApi.getCatalog.mockResolvedValue(CATALOG);
  mockResourcesApi.listResources.mockResolvedValue({
    items: [BASE_RESOURCE],
    total: 1,
    page: 1,
    limit: 20,
  });
  mockResourcesApi.listFavorites.mockResolvedValue([]);
  mockResourcesApi.listMyResources.mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  mockResourcesApi.listSchoolsWithResources.mockResolvedValue([
    { id: "school-1", name: "École Test" },
  ]);
}

describe("ResourcesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockDefaults();
  });

  it("affiche les onglets Évaluations / Examens / Mes ressources / Favoris pour un enseignant", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-ASSESSMENT")).toBeTruthy(),
    );
    expect(screen.getByTestId("resources-tab-EXAM")).toBeTruthy();
    expect(screen.getByTestId("resources-tab-mine")).toBeTruthy();
    expect(screen.getByTestId("resources-tab-favorites")).toBeTruthy();
    expect(screen.queryByTestId("resources-tab-moderation")).toBeNull();
  });

  it("affiche l'onglet Modération uniquement pour un platform role", async () => {
    mockUseAuthStore.mockReturnValue({ user: ADMIN_USER } as never);
    mockResourcesAdminApi.listAdminResources.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-moderation")).toBeTruthy(),
    );
  });

  it("le FAB n'est pas visible pour un rôle qui ne peut pas soumettre", async () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        ...TEACHER_USER,
        memberships: [{ schoolId: "school-1", role: "PARENT" as const }],
      },
    } as never);

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-ASSESSMENT")).toBeTruthy(),
    );
    expect(screen.queryByTestId("resources-fab")).toBeNull();
  });

  it("FAB → ouvre l'onglet forms avec le hero et les champs du formulaire", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-form-hero")).toBeTruthy(),
    );
    expect(screen.getByTestId("resources-form-title")).toBeTruthy();
    expect(screen.getByTestId("resources-form-level")).toBeTruthy();
    expect(screen.getByTestId("resources-form-subject")).toBeTruthy();
    expect(screen.getByTestId("resources-form-sequence")).toBeTruthy();
    expect(screen.getByTestId("resources-form-academic-year")).toBeTruthy();
    expect(screen.queryByTestId("resources-tab-ASSESSMENT")).toBeNull();
  });

  it("le champ année académique est pré-rempli avec l'année en cours", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-form-academic-year")).toBeTruthy(),
    );
    // Non vide : une valeur par défaut est toujours sélectionnée, jamais un placeholder.
    expect(
      screen.getByTestId("resources-form-academic-year").props.children,
    ).not.toBe(undefined);
  });

  it("le champ séquence n'apparaît pas pour un examen national, mais l'année académique reste obligatoire", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-EXAM")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-tab-EXAM"));
    await waitFor(() =>
      expect(mockResourcesApi.listResources).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "EXAM" }),
      ),
    );

    fireEvent.press(screen.getByTestId("resources-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("resources-form-hero")).toBeTruthy(),
    );
    expect(screen.queryByTestId("resources-form-sequence")).toBeNull();
    expect(screen.getByTestId("resources-form-academic-year")).toBeTruthy();
  });

  it("Annuler → revient à l'onglet d'origine sans appeler l'API", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-form-cancel")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-form-cancel"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-ASSESSMENT")).toBeTruthy(),
    );
    expect(mockResourcesApi.createResource).not.toHaveBeenCalled();
  });

  it("la flèche du header depuis l'onglet forms revient au tab d'origine (pas de router.back)", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-back-btn")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-back-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-ASSESSMENT")).toBeTruthy(),
    );
  });

  it("validation : le submit est bloqué et affiche l'erreur si le titre est vide", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-form-submit")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-form-submit"));

    await waitFor(() =>
      expect(
        screen.getByText(
          translate("fr", "resources.form.validation.titleRequired"),
        ),
      ).toBeTruthy(),
    );
    expect(mockResourcesApi.createResource).not.toHaveBeenCalled();
  });

  it("succès : appelle l'API de création puis revient au tab d'origine après 2s", async () => {
    jest.useFakeTimers();
    mockResourcesApi.createResource.mockResolvedValue({
      ...BASE_RESOURCE,
      statementContent: "<p>Bonjour</p>",
      attachments: [],
    });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-form-title")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("resources-form-title"),
      "Contrôle chapitre 4",
    );

    fireEvent.press(screen.getByTestId("resources-form-level"));
    fireEvent.press(screen.getByTestId("resources-form-level-option-level-1"));
    fireEvent.press(screen.getByTestId("resources-form-subject"));
    fireEvent.press(
      screen.getByTestId("resources-form-subject-option-subject-1"),
    );
    fireEvent.press(screen.getByTestId("resources-form-exam-type"));
    fireEvent.press(
      screen.getByTestId("resources-form-exam-type-option-SEQUENCE_TEST"),
    );
    fireEvent.press(screen.getByTestId("resources-form-sequence"));
    fireEvent.press(screen.getByTestId("resources-form-sequence-option-SEQ_1"));

    fireEvent.press(screen.getByTestId("resources-form-submit"));

    await waitFor(() =>
      expect(mockResourcesApi.createResource).toHaveBeenCalled(),
    );
    expect(mockResourcesApi.createResource).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "ASSESSMENT",
        schoolId: "school-1",
        academicLevelId: "level-1",
        subjectId: "subject-1",
        examType: "SEQUENCE_TEST",
        sequence: "SEQ_1",
        academicYearLabel: expect.any(String),
        title: "Contrôle chapitre 4",
      }),
    );

    expect(screen.getByTestId("resources-form-hero")).toBeTruthy();

    await jest.advanceTimersByTimeAsync(2000);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-ASSESSMENT")).toBeTruthy(),
    );

    jest.useRealTimers();
  });

  it("erreur : affiche le toast d'erreur et reste sur l'onglet forms", async () => {
    mockResourcesApi.createResource.mockRejectedValue(new Error("Boom"));

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-form-title")).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByTestId("resources-form-title"), "X");
    fireEvent.press(screen.getByTestId("resources-form-level"));
    fireEvent.press(screen.getByTestId("resources-form-level-option-level-1"));
    fireEvent.press(screen.getByTestId("resources-form-subject"));
    fireEvent.press(
      screen.getByTestId("resources-form-subject-option-subject-1"),
    );
    fireEvent.press(screen.getByTestId("resources-form-exam-type"));
    fireEvent.press(
      screen.getByTestId("resources-form-exam-type-option-SEQUENCE_TEST"),
    );
    fireEvent.press(screen.getByTestId("resources-form-sequence"));
    fireEvent.press(screen.getByTestId("resources-form-sequence-option-SEQ_1"));

    fireEvent.press(screen.getByTestId("resources-form-submit"));

    await waitFor(() =>
      expect(mockResourcesApi.createResource).toHaveBeenCalled(),
    );
    expect(screen.getByTestId("resources-form-tab")).toBeTruthy();
  });

  it("liste : affiche l'année académique sur la card", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId(`resources-card-${BASE_RESOURCE.id}-academic-year`),
      ).toBeTruthy(),
    );
    expect(screen.getByText("2025-2026")).toBeTruthy();
  });

  it("liste : bascule le favori au tap sur l'étoile", async () => {
    mockResourcesApi.favoriteResource.mockResolvedValue({ favorite: true });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId(`resources-card-${BASE_RESOURCE.id}`),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId(`resources-card-${BASE_RESOURCE.id}-favorite`),
    );

    await waitFor(() =>
      expect(mockResourcesApi.favoriteResource).toHaveBeenCalledWith(
        BASE_RESOURCE.id,
      ),
    );
  });

  it("liste : navigue vers la page Énoncé au tap sur le bouton", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId(`resources-card-${BASE_RESOURCE.id}`),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId(`resources-card-${BASE_RESOURCE.id}-statement-btn`),
    );

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(home)/resources/[resourceId]/statement",
        params: { resourceId: BASE_RESOURCE.id },
      }),
    );
  });

  it("liste : le bouton Corrigé est masqué tant que le corrigé n'est pas approuvé", async () => {
    mockResourcesApi.listResources.mockResolvedValue({
      items: [
        {
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "PENDING" as const,
          authorUserId: "someone-else",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId(`resources-card-${BASE_RESOURCE.id}`),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId(`resources-card-${BASE_RESOURCE.id}-correction-btn`),
    ).toBeNull();
  });

  it("liste : le bouton Corrigé est visible pour l'auteur même en attente", async () => {
    mockResourcesApi.listResources.mockResolvedValue({
      items: [
        {
          ...BASE_RESOURCE,
          correctionContent: "<p>Corrigé</p>",
          correctionStatus: "PENDING" as const,
          authorUserId: TEACHER_USER.id,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId(`resources-card-${BASE_RESOURCE.id}-correction-btn`),
      ).toBeTruthy(),
    );
  });
});

describe("ResourcesScreen — recherche et filtres", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockDefaults();
  });

  it("affiche le bouton de recherche sur l'onglet Évaluations mais pas sur Mes ressources", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-tab-mine"));
    await waitFor(() =>
      expect(mockResourcesApi.listMyResources).toHaveBeenCalled(),
    );
    expect(screen.queryByTestId("resources-search-toggle")).toBeNull();
  });

  it("ouvre et ferme le panneau de recherche au clic sur le bouton", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    expect(screen.queryByTestId("resources-filter-panel")).toBeNull();

    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("resources-filter-panel")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(screen.queryByTestId("resources-filter-panel")).toBeNull(),
    );
  });

  it("le filtre séquence est visible sur Évaluations mais pas sur Examens", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(
        screen.getByTestId("resources-filter-sequence-trigger"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-tab-EXAM"));
    await waitFor(() =>
      expect(mockResourcesApi.listResources).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "EXAM" }),
      ),
    );
    expect(
      screen.queryByTestId("resources-filter-sequence-trigger"),
    ).toBeNull();
  });

  it("tape dans la recherche, applique et déclenche listResources avec le texte saisi", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("resources-filter-search-input")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("resources-filter-search-input"),
      "chapitre 3",
    );
    fireEvent.press(screen.getByTestId("resources-filter-apply"));

    await waitFor(() =>
      expect(mockResourcesApi.listResources).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "ASSESSMENT", search: "chapitre 3" }),
      ),
    );
  });

  it("le panneau se ferme automatiquement après un apply", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("resources-filter-apply")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-filter-apply"));

    await waitFor(() =>
      expect(screen.queryByTestId("resources-filter-panel")).toBeNull(),
    );
  });

  it("cancel ferme le panneau sans appliquer les changements du formulaire", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(
        screen.getByTestId("resources-filter-school-trigger"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-filter-school-trigger"));
    fireEvent.press(
      screen.getByTestId("resources-filter-school-option-school-1"),
    );

    mockResourcesApi.listResources.mockClear();
    fireEvent.press(screen.getByTestId("resources-filter-cancel"));

    await waitFor(() =>
      expect(screen.queryByTestId("resources-filter-panel")).toBeNull(),
    );
    expect(mockResourcesApi.listResources).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(
        screen.getByTestId("resources-filter-school-trigger"),
      ).toBeTruthy(),
    );
    expect(
      screen.getByText(translate("fr", "resources.filters.allSchools")),
    ).toBeTruthy();
  });

  it("sélectionne un établissement puis applique pour relancer la recherche", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(
        screen.getByTestId("resources-filter-school-trigger"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-filter-school-trigger"));
    fireEvent.press(
      screen.getByTestId("resources-filter-school-option-school-1"),
    );

    mockResourcesApi.listResources.mockClear();
    fireEvent.press(screen.getByTestId("resources-filter-apply"));

    await waitFor(() =>
      expect(mockResourcesApi.listResources).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "ASSESSMENT", schoolId: "school-1" }),
      ),
    );
  });

  it("le bouton réinitialiser est désactivé sans filtre choisi dans le formulaire, puis actif une fois un filtre choisi", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("resources-filter-reset")).toBeTruthy(),
    );
    expect(
      screen.getByTestId("resources-filter-reset").props.accessibilityState
        ?.disabled,
    ).toBe(true);

    fireEvent.press(screen.getByTestId("resources-filter-school-trigger"));
    fireEvent.press(
      screen.getByTestId("resources-filter-school-option-school-1"),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-filter-reset").props.accessibilityState
          ?.disabled,
      ).toBe(false),
    );
  });

  it("réinitialiser efface le formulaire de filtres sans recharger, apply recharge ensuite sans critère", async () => {
    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-search-toggle")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(
        screen.getByTestId("resources-filter-school-trigger"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-filter-school-trigger"));
    fireEvent.press(
      screen.getByTestId("resources-filter-school-option-school-1"),
    );
    fireEvent.press(screen.getByTestId("resources-filter-apply"));
    await waitFor(() =>
      expect(mockResourcesApi.listResources).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: "school-1" }),
      ),
    );

    fireEvent.press(screen.getByTestId("resources-search-toggle"));
    await waitFor(() =>
      expect(screen.getByTestId("resources-filter-reset")).toBeTruthy(),
    );

    mockResourcesApi.listResources.mockClear();
    fireEvent.press(screen.getByTestId("resources-filter-reset"));

    expect(mockResourcesApi.listResources).not.toHaveBeenCalled();
    expect(
      screen.getByText(translate("fr", "resources.filters.allSchools")),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("resources-filter-apply"));

    await waitFor(() =>
      expect(mockResourcesApi.listResources).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "ASSESSMENT",
          search: undefined,
          schoolId: undefined,
          academicYearLabel: undefined,
          academicLevelId: undefined,
          sequence: undefined,
          examType: undefined,
        }),
      ),
    );
  });
});

describe("ResourcesScreen — modération", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: ADMIN_USER } as never);
    mockDefaults();
  });

  it("liste les ressources en attente et permet d'approuver l'énoncé", async () => {
    mockResourcesAdminApi.listAdminResources.mockResolvedValue({
      items: [{ ...BASE_RESOURCE, statementStatus: "PENDING" as const }],
      total: 1,
      page: 1,
      limit: 20,
    });
    mockResourcesAdminApi.approveStatement.mockResolvedValue({
      ...BASE_RESOURCE,
      statementContent: "<p>x</p>",
      attachments: [],
      statementStatus: "APPROVED",
    });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-moderation")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-tab-moderation"));

    await waitFor(() =>
      expect(
        screen.getByTestId(`resources-moderation-approve-${BASE_RESOURCE.id}`),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId(`resources-moderation-approve-${BASE_RESOURCE.id}`),
    );

    await waitFor(() =>
      expect(mockResourcesAdminApi.approveStatement).toHaveBeenCalledWith(
        BASE_RESOURCE.id,
      ),
    );
  });

  it("bascule entre énoncé et corrigé dans la modération", async () => {
    mockResourcesAdminApi.listAdminResources.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-moderation")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-tab-moderation"));

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-part-correction"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-moderation-part-correction"));

    await waitFor(() =>
      expect(mockResourcesAdminApi.listAdminResources).toHaveBeenCalledWith(
        expect.objectContaining({ part: "correction" }),
      ),
    );
  });
});
