import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ResourcesScreen } from "../../src/components/resources/ResourcesScreen";
import { resourcesApi, resourcesAdminApi } from "../../src/api/resources.api";
import { useAuthStore } from "../../src/store/auth.store";
import { translate } from "../../src/i18n/useTranslation";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/resources.api");
jest.mock("../../src/store/auth.store");
jest.mock("expo-router", () => ({
  useRouter: () => ({ canGoBack: () => false, back: jest.fn(), navigate: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
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
      user: { ...TEACHER_USER, memberships: [{ schoolId: "school-1", role: "PARENT" as const }] },
    } as never);

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("resources-tab-ASSESSMENT")).toBeTruthy(),
    );
    expect(screen.queryByTestId("resources-fab")).toBeNull();
  });

  it("FAB → ouvre l'onglet forms avec le hero et les champs du formulaire", async () => {
    render(<ResourcesScreen />);

    await waitFor(() => expect(screen.getByTestId("resources-fab")).toBeTruthy());
    fireEvent.press(screen.getByTestId("resources-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("resources-form-hero")).toBeTruthy(),
    );
    expect(screen.getByTestId("resources-form-title")).toBeTruthy();
    expect(screen.getByTestId("resources-form-level")).toBeTruthy();
    expect(screen.getByTestId("resources-form-subject")).toBeTruthy();
    expect(screen.getByTestId("resources-form-sequence")).toBeTruthy();
    expect(screen.queryByTestId("resources-tab-ASSESSMENT")).toBeNull();
  });

  it("le champ séquence n'apparaît pas pour un examen national", async () => {
    render(<ResourcesScreen />);

    await waitFor(() => expect(screen.getByTestId("resources-tab-EXAM")).toBeTruthy());
    fireEvent.press(screen.getByTestId("resources-tab-EXAM"));
    await waitFor(() => expect(mockResourcesApi.listResources).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "EXAM" }),
    ));

    fireEvent.press(screen.getByTestId("resources-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("resources-form-hero")).toBeTruthy(),
    );
    expect(screen.queryByTestId("resources-form-sequence")).toBeNull();
  });

  it("Annuler → revient à l'onglet d'origine sans appeler l'API", async () => {
    render(<ResourcesScreen />);

    await waitFor(() => expect(screen.getByTestId("resources-fab")).toBeTruthy());
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

    await waitFor(() => expect(screen.getByTestId("resources-fab")).toBeTruthy());
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

    await waitFor(() => expect(screen.getByTestId("resources-fab")).toBeTruthy());
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

    await waitFor(() => expect(screen.getByTestId("resources-fab")).toBeTruthy());
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
    fireEvent.press(
      screen.getByTestId("resources-form-sequence-option-SEQ_1"),
    );

    fireEvent.press(screen.getByTestId("resources-form-submit"));

    await waitFor(() => expect(mockResourcesApi.createResource).toHaveBeenCalled());
    expect(mockResourcesApi.createResource).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "ASSESSMENT",
        schoolId: "school-1",
        academicLevelId: "level-1",
        subjectId: "subject-1",
        examType: "SEQUENCE_TEST",
        sequence: "SEQ_1",
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
    mockResourcesApi.createResource.mockRejectedValue(
      new Error("Boom"),
    );

    render(<ResourcesScreen />);

    await waitFor(() => expect(screen.getByTestId("resources-fab")).toBeTruthy());
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
    fireEvent.press(
      screen.getByTestId("resources-form-sequence-option-SEQ_1"),
    );

    fireEvent.press(screen.getByTestId("resources-form-submit"));

    await waitFor(() => expect(mockResourcesApi.createResource).toHaveBeenCalled());
    expect(screen.getByTestId("resources-form-tab")).toBeTruthy();
  });

  it("liste : bascule le favori au tap sur l'étoile", async () => {
    mockResourcesApi.favoriteResource.mockResolvedValue({ favorite: true });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId(`resources-card-${BASE_RESOURCE.id}`)).toBeTruthy(),
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

  it("liste : ouvre le détail au tap sur la card", async () => {
    mockResourcesApi.getResource.mockResolvedValue({
      ...BASE_RESOURCE,
      statementContent: "<p>Enoncé complet</p>",
      attachments: [],
    });

    render(<ResourcesScreen />);

    await waitFor(() =>
      expect(screen.getByTestId(`resources-card-${BASE_RESOURCE.id}`)).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId(`resources-card-${BASE_RESOURCE.id}`));

    await waitFor(() =>
      expect(screen.getByTestId("resources-detail-panel")).toBeTruthy(),
    );
    expect(mockResourcesApi.getResource).toHaveBeenCalledWith(BASE_RESOURCE.id);
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
