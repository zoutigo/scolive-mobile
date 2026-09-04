/**
 * Tests fonctionnels et d'intégration : SchoolAdminUsersScreen
 *
 * Couverture :
 *  — Unitaires  : rendu initial, états de chargement, message d'erreur
 *  — Fonctionnels : recherche, filtre par rôle, chargement de la page suivante,
 *                   clic sur un utilisateur → modal détail
 *  — Intégration : interaction store ↔ composant ↔ API
 */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SchoolAdminUsersScreen } from "../../src/components/users/SchoolAdminUsersScreen";
import { usersApi } from "../../src/api/users.api";
import { teachersApi } from "../../src/api/teachers.api";
import { familyApi } from "../../src/api/family.api";
import { staffFunctionsApi } from "../../src/api/staff-functions.api";
import { useUsersStore } from "../../src/store/users.store";
import {
  SAMPLE_USERS,
  TEACHER_USER,
  PARENT_USER,
  makeSchoolUser,
  makeUsersPage,
  makeSchoolUserDetail,
} from "../../test-utils/users.fixtures";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/users.api", () => ({
  usersApi: {
    list: jest.fn(),
    get: jest.fn(),
    listSchoolYears: jest.fn(),
    createStaffMember: jest.fn(),
  },
}));
jest.mock("../../src/api/teachers.api", () => ({
  teachersApi: {
    createTeacher: jest.fn(),
    listClassrooms: jest.fn(),
  },
}));
jest.mock("../../src/api/family.api", () => ({
  familyApi: {
    listAdminStudents: jest.fn(),
    createStudent: jest.fn(),
    createParent: jest.fn(),
  },
}));
jest.mock("../../src/api/staff-functions.api", () => ({
  staffFunctionsApi: {
    listStaffFunctions: jest.fn(),
    createStaffFunction: jest.fn(),
  },
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
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Jean",
      lastName: "Foko",
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
      schoolName: "Collège Vogt",
      memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    },
  }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const mockTeachersApi = teachersApi as jest.Mocked<typeof teachersApi>;
const mockFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const mockStaffFunctionsApi = staffFunctionsApi as jest.Mocked<
  typeof staffFunctionsApi
>;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  act(() => useUsersStore.getState().reset());

  // Détail vide par défaut
  mockUsersApi.get.mockResolvedValue(makeSchoolUserDetail(TEACHER_USER));
  mockUsersApi.listSchoolYears.mockResolvedValue([]);
  mockTeachersApi.listClassrooms.mockResolvedValue([]);
  mockFamilyApi.listAdminStudents.mockResolvedValue({
    students: [],
    total: 0,
    page: 1,
    hasMore: false,
  });
  mockStaffFunctionsApi.listStaffFunctions.mockResolvedValue([]);
});

function renderScreen() {
  return render(<SchoolAdminUsersScreen />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SchoolAdminUsersScreen — Unitaires", () => {
  it("affiche l'en-tête avec le titre et l'école", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-title")).toBeOnTheScreen();
    });
  });

  it("affiche le loader pendant le chargement", () => {
    mockUsersApi.list.mockImplementation(() => new Promise(() => {}));
    renderScreen();
    expect(screen.getByText("Chargement des utilisateurs…")).toBeOnTheScreen();
  });

  it("affiche un message d'erreur si l'API echoue", async () => {
    mockUsersApi.list.mockRejectedValueOnce(new Error("Network error"));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-error")).toBeOnTheScreen();
    });
    expect(
      screen.getByText("Impossible de charger les utilisateurs."),
    ).toBeOnTheScreen();
  });

  it("affiche l'etat vide si aucun utilisateur", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText("Aucun utilisateur")).toBeOnTheScreen();
    });
  });

  it("affiche la barre de recherche", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-search-input")).toBeOnTheScreen();
    });
  });

  it("affiche le bouton de filtres (panneau fermé par défaut)", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-filter-toggle")).toBeOnTheScreen();
    });
    expect(screen.queryByTestId("users-filter-panel")).toBeNull();
  });

  it("le panneau de filtres liste tous les types d'utilisateurs, y compris Superviseur et Comptable", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-filter-toggle")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));

    expect(screen.getByTestId("users-filter-role-all")).toBeOnTheScreen();
    expect(screen.getByTestId("users-filter-role-teacher")).toBeOnTheScreen();
    expect(screen.getByTestId("users-filter-role-parent")).toBeOnTheScreen();
    expect(screen.getByTestId("users-filter-role-student")).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-filter-role-school_admin"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-filter-role-school_manager"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-filter-role-supervisor"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-filter-role-school_accountant"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-filter-role-school_staff"),
    ).toBeOnTheScreen();
  });

  it("ouvre le panneau de filtres au clic sur le bouton filtre", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-filter-toggle")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));

    expect(screen.getByTestId("users-filter-panel")).toBeOnTheScreen();
    // La liste et le panneau sont mutuellement exclusifs.
    expect(screen.queryByTestId("users-list")).toBeNull();
  });
});

describe("SchoolAdminUsersScreen — Fonctionnels", () => {
  it("affiche la liste des utilisateurs apres chargement", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage(SAMPLE_USERS));
    renderScreen();
    await waitFor(() => {
      expect(
        screen.getByTestId(`user-card-${TEACHER_USER.id}`),
      ).toBeOnTheScreen();
    });
    expect(screen.getByText("Ebelle Marie")).toBeOnTheScreen();
    expect(screen.getByText("Atangana Pierre")).toBeOnTheScreen();
  });

  it("affiche le compteur d'utilisateurs sur le bouton de filtre", async () => {
    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage(SAMPLE_USERS, { total: 5 }),
    );
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-total")).toBeOnTheScreen();
    });
    expect(screen.getByText("5")).toBeOnTheScreen();
  });

  it("affiche la légende des pastilles de rôle avec des libellés courts", async () => {
    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage(SAMPLE_USERS, { total: 5 }),
    );
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-role-legend")).toBeOnTheScreen();
    });
    expect(screen.getByText("ENS")).toBeOnTheScreen();
    expect(screen.getByText("SUP")).toBeOnTheScreen();
    expect(screen.getByText("CPT")).toBeOnTheScreen();
  });

  it("n'affiche pas la légende quand la liste est vide", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([], { total: 0 }));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-search-input")).toBeOnTheScreen();
    });
    expect(screen.queryByTestId("users-role-legend")).toBeNull();
  });

  it("filtre par role via le panneau de filtres (chip + Appliquer)", async () => {
    mockUsersApi.list
      .mockResolvedValueOnce(makeUsersPage(SAMPLE_USERS))
      .mockResolvedValueOnce(makeUsersPage([TEACHER_USER]));

    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-list")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    fireEvent.press(screen.getByTestId("users-filter-role-teacher"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("users-filter-apply"));
    });

    await waitFor(() => {
      expect(mockUsersApi.list).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ role: "TEACHER" }),
      );
    });
    // Le panneau se referme après Appliquer.
    expect(screen.queryByTestId("users-filter-panel")).toBeNull();
  });

  it("le bouton filtre devient teal plein quand un filtre est appliqué", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-filter-toggle")).toBeOnTheScreen();
    });

    const toggleBefore = screen.getByTestId("users-filter-toggle");
    expect(toggleBefore.props.style).not.toEqual(
      expect.objectContaining({ backgroundColor: "#247C72" }),
    );

    fireEvent.press(toggleBefore);
    fireEvent.press(screen.getByTestId("users-filter-account-without_account"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("users-filter-apply"));
    });

    const toggleAfter = screen.getByTestId("users-filter-toggle");
    expect(toggleAfter.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#247C72" }),
    );
  });

  it("Reset vide les filtres et Fermer abandonne le brouillon", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-filter-toggle")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    fireEvent.press(screen.getByTestId("users-filter-role-parent"));
    fireEvent.press(screen.getByTestId("users-filter-close"));

    expect(useUsersStore.getState().filters.role).toBe("ALL");

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    fireEvent.press(screen.getByTestId("users-filter-role-parent"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("users-filter-apply"));
    });
    expect(useUsersStore.getState().filters.role).toBe("PARENT");

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("users-filter-reset"));
    });
    expect(useUsersStore.getState().filters.role).toBe("ALL");
  });

  it("affiche l'indice de désactivation du filtre Année pour un rôle qui n'a pas d'année (ALL)", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-filter-toggle")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    expect(
      screen.getByText(
        "Disponible uniquement pour les rôles Élève et Enseignant.",
      ),
    ).toBeOnTheScreen();
  });

  it("masque l'indice de désactivation du filtre Année pour le rôle Enseignant", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-filter-toggle")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    fireEvent.press(screen.getByTestId("users-filter-role-teacher"));

    expect(
      screen.queryByText(
        "Disponible uniquement pour les rôles Élève et Enseignant.",
      ),
    ).toBeNull();
  });

  it("n'envoie pas schoolYearId à l'API quand le rôle appliqué n'est ni Élève ni Enseignant", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(mockUsersApi.list).toHaveBeenCalled();
    });

    const lastCall =
      mockUsersApi.list.mock.calls[mockUsersApi.list.mock.calls.length - 1];
    expect(lastCall[1].schoolYearId).toBeUndefined();
  });

  it("efface le bouton de recherche quand le champ est vide", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-search-input")).toBeOnTheScreen();
    });
    expect(screen.queryByTestId("users-search-clear")).toBeNull();
  });

  it("affiche le bouton effacer quand le champ a du texte", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-search-input")).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByTestId("users-search-input"), "Kouam");
    expect(screen.getByTestId("users-search-clear")).toBeOnTheScreen();
  });

  it("vide le champ quand on clique sur effacer", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-search-input")).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByTestId("users-search-input"), "test");
    fireEvent.press(screen.getByTestId("users-search-clear"));

    expect(useUsersStore.getState().filters.search).toBe("");
  });

  it("ouvre le modal de detail quand on clique sur un utilisateur", async () => {
    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage([TEACHER_USER, PARENT_USER]),
    );
    mockUsersApi.get.mockResolvedValueOnce(makeSchoolUserDetail(TEACHER_USER));
    renderScreen();

    await waitFor(() => {
      expect(
        screen.getByTestId(`user-card-${TEACHER_USER.id}`),
      ).toBeOnTheScreen();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId(`user-card-${TEACHER_USER.id}`));
    });

    await waitFor(() => {
      expect(screen.getByTestId("users-detail-modal")).toBeOnTheScreen();
    });
  });

  it("n'est pas une modale : ouvrir le détail remplace l'écran liste (pas d'affichage superposé)", async () => {
    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage([TEACHER_USER, PARENT_USER]),
    );
    mockUsersApi.get.mockResolvedValueOnce(makeSchoolUserDetail(TEACHER_USER));
    renderScreen();

    await waitFor(() => {
      expect(
        screen.getByTestId(`user-card-${TEACHER_USER.id}`),
      ).toBeOnTheScreen();
    });
    expect(screen.getByTestId("users-list")).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId(`user-card-${TEACHER_USER.id}`));
    });

    await waitFor(() => {
      expect(screen.getByTestId("users-detail-modal")).toBeOnTheScreen();
    });
    expect(screen.queryByTestId("users-list")).toBeNull();
    expect(screen.queryByTestId("school-admin-users-screen")).toBeNull();
  });
});

describe("SchoolAdminUsersScreen — Intégration store", () => {
  it("le store est mis a jour apres le chargement", async () => {
    const users = [TEACHER_USER, PARENT_USER];
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage(users, { total: 2 }));
    renderScreen();

    await waitFor(() => {
      expect(useUsersStore.getState().users).toHaveLength(2);
    });
    expect(useUsersStore.getState().total).toBe(2);
    expect(useUsersStore.getState().isLoading).toBe(false);
  });

  it("la premiere page est chargee dans le store", async () => {
    const page1 = Array.from({ length: 20 }, (_, i) =>
      makeSchoolUser({ id: `u-${i}` }),
    );

    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage(page1, { hasMore: true, total: 21 }),
    );

    renderScreen();

    await waitFor(() => {
      expect(useUsersStore.getState().users).toHaveLength(20);
    });

    expect(useUsersStore.getState().hasMore).toBe(true);
    expect(useUsersStore.getState().total).toBe(21);
  });

  it("appendUsers ajoute les utilisateurs aux existants dans le store", () => {
    const page1 = [makeSchoolUser({ id: "u-1" })];
    const page2 = [makeSchoolUser({ id: "u-2" })];

    act(() => {
      useUsersStore.getState().setUsers(page1, true, 1, 2);
    });
    act(() => {
      useUsersStore.getState().appendUsers(page2, false, 2);
    });

    expect(useUsersStore.getState().users).toHaveLength(2);
    expect(useUsersStore.getState().hasMore).toBe(false);
  });

  it("le filtre de role est conserve dans le store apres Appliquer", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();

    await waitFor(() => {
      expect(useUsersStore.getState().isLoading).toBe(false);
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    fireEvent.press(screen.getByTestId("users-filter-role-parent"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("users-filter-apply"));
    });

    await waitFor(() => {
      expect(useUsersStore.getState().filters.role).toBe("PARENT");
    });
  });
});

describe("SchoolAdminUsersScreen — Pagination", () => {
  it("charge la page 2 quand onEndReached est déclenché", async () => {
    const page1 = Array.from({ length: 20 }, (_, i) =>
      makeSchoolUser({ id: `u-${i}` }),
    );
    const page2 = [makeSchoolUser({ id: "u-page2" })];

    mockUsersApi.list
      .mockResolvedValueOnce(makeUsersPage(page1, { hasMore: true, total: 21 }))
      .mockResolvedValueOnce(
        makeUsersPage(page2, { hasMore: false, total: 21 }),
      );

    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId("users-list")).toBeOnTheScreen();
    });

    await act(async () => {
      fireEvent(screen.getByTestId("users-list"), "onEndReached", {
        distanceFromEnd: 0,
      });
    });

    await waitFor(() => {
      expect(mockUsersApi.list).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("ne relance pas de chargement si hasMore est false", async () => {
    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage([TEACHER_USER], { hasMore: false, total: 1 }),
    );
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId("users-list")).toBeOnTheScreen();
    });

    mockUsersApi.list.mockClear();

    await act(async () => {
      fireEvent(screen.getByTestId("users-list"), "onEndReached", {
        distanceFromEnd: 0,
      });
    });

    expect(mockUsersApi.list).not.toHaveBeenCalled();
  });

  it("revient en page 1 quand le filtre change après un load-more", async () => {
    const page1 = Array.from({ length: 20 }, (_, i) =>
      makeSchoolUser({ id: `u-${i}` }),
    );
    const page2 = [makeSchoolUser({ id: "u-page2" })];

    mockUsersApi.list
      .mockResolvedValueOnce(makeUsersPage(page1, { hasMore: true, total: 21 }))
      .mockResolvedValueOnce(
        makeUsersPage(page2, { hasMore: false, total: 21 }),
      )
      .mockResolvedValueOnce(makeUsersPage([TEACHER_USER], { total: 1 }));

    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId("users-list")).toBeOnTheScreen();
    });

    await act(async () => {
      fireEvent(screen.getByTestId("users-list"), "onEndReached", {
        distanceFromEnd: 0,
      });
    });

    await waitFor(() => {
      expect(useUsersStore.getState().page).toBe(2);
    });

    fireEvent.press(screen.getByTestId("users-filter-toggle"));
    fireEvent.press(screen.getByTestId("users-filter-role-teacher"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("users-filter-apply"));
    });

    await waitFor(() => {
      expect(mockUsersApi.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ page: 1, role: "TEACHER" }),
      );
    });
  });
});

describe("SchoolAdminUsersScreen — Création d'utilisateur (FAB)", () => {
  beforeEach(() => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
  });

  it("affiche le FAB de création sur la liste", async () => {
    renderScreen();
    expect(await screen.findByTestId("users-create-fab")).toBeOnTheScreen();
  });

  it("ouvre le sélecteur de type au clic sur le FAB, sans SCHOOL_ADMIN", async () => {
    renderScreen();
    fireEvent.press(await screen.findByTestId("users-create-fab"));

    expect(
      await screen.findByTestId("users-create-type-teacher"),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("users-create-type-student")).toBeOnTheScreen();
    expect(screen.getByTestId("users-create-type-parent")).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-create-type-school_manager"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-create-type-supervisor"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-create-type-school_accountant"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("users-create-type-school_staff"),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId("users-create-type-school_admin")).toBeNull();
    // Liste masquée pendant la création.
    expect(screen.queryByTestId("users-list")).toBeNull();
  });

  it("crée un enseignant par téléphone puis affiche sa fiche détail", async () => {
    mockTeachersApi.createTeacher.mockResolvedValueOnce({
      user: { id: "new-teacher-1" },
      userExisted: false,
    });
    mockUsersApi.get.mockResolvedValueOnce(
      makeSchoolUserDetail({ ...TEACHER_USER, id: "new-teacher-1" }),
    );

    renderScreen();
    fireEvent.press(await screen.findByTestId("users-create-fab"));
    fireEvent.press(await screen.findByTestId("users-create-type-teacher"));
    await screen.findByTestId("users-create-teacher-form-content");

    fireEvent.changeText(
      screen.getByTestId("users-create-teacher-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("users-create-teacher-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("users-create-teacher-submit"));

    await waitFor(() => {
      expect(mockTeachersApi.createTeacher).toHaveBeenCalledWith(
        "college-vogt",
        { phone: "699001122", pin: "123456" },
      );
    });
    expect(mockShowSuccess).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("users-detail-modal")).toBeOnTheScreen();
    });
    expect(mockUsersApi.get).toHaveBeenCalledWith(
      "college-vogt",
      "new-teacher-1",
    );
  });

  it("erreur de création enseignant → showError, formulaire toujours visible", async () => {
    mockTeachersApi.createTeacher.mockRejectedValueOnce(
      new Error("Teacher already exists"),
    );

    renderScreen();
    fireEvent.press(await screen.findByTestId("users-create-fab"));
    fireEvent.press(await screen.findByTestId("users-create-type-teacher"));
    await screen.findByTestId("users-create-teacher-form-content");

    fireEvent.changeText(
      screen.getByTestId("users-create-teacher-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("users-create-teacher-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("users-create-teacher-submit"));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Teacher already exists" }),
      );
    });
    expect(
      screen.getByTestId("users-create-teacher-form-content"),
    ).toBeOnTheScreen();
  });

  it("charge les classes au choix du type Élève et crée l'élève sans compte", async () => {
    mockTeachersApi.listClassrooms.mockResolvedValueOnce([
      {
        id: "class-1",
        name: "6eC",
        schoolYear: { id: "sy-1", label: "2025-2026" },
        academicLevel: { id: "level-1", code: "6E", label: "6ème" },
      },
    ]);
    mockFamilyApi.createStudent.mockResolvedValueOnce({
      id: "student-new-1",
    });
    mockUsersApi.get.mockResolvedValueOnce(
      makeSchoolUserDetail({ ...TEACHER_USER, id: "student-new-1" }),
    );

    renderScreen();
    fireEvent.press(await screen.findByTestId("users-create-fab"));
    fireEvent.press(await screen.findByTestId("users-create-type-student"));
    await screen.findByTestId("users-create-student-form-content");

    await waitFor(() => {
      expect(mockTeachersApi.listClassrooms).toHaveBeenCalledWith(
        "college-vogt",
      );
    });

    fireEvent.changeText(
      screen.getByTestId("users-create-student-first-name"),
      "Jean",
    );
    fireEvent.changeText(
      screen.getByTestId("users-create-student-last-name"),
      "Dupont",
    );
    fireEvent.press(screen.getByTestId("users-create-student-level"));
    fireEvent.press(
      screen.getByTestId("users-create-student-level-option-level-1"),
    );
    fireEvent.press(screen.getByTestId("users-create-student-class"));
    fireEvent.press(
      screen.getByTestId("users-create-student-class-option-class-1"),
    );

    const now = new Date();
    // Day 1 of the current month is never in the future relative to "now",
    // unlike a fixed day (e.g. 15) which the date-of-birth field's
    // maximumDate={new Date()} would disable whenever the test runs before
    // that day of the month.
    const dateOfBirthIso = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-01`;
    fireEvent.press(screen.getByTestId("users-create-student-date-of-birth"));
    fireEvent.press(
      await screen.findByTestId(
        `users-create-student-date-of-birth-day-${dateOfBirthIso}`,
      ),
    );
    fireEvent.press(
      screen.getByTestId("users-create-student-date-of-birth-confirm"),
    );

    fireEvent.press(screen.getByTestId("users-create-student-submit"));

    await waitFor(() => {
      expect(mockFamilyApi.createStudent).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          firstName: "Jean",
          lastName: "Dupont",
          classId: "class-1",
          dateOfBirth: dateOfBirthIso,
        }),
      );
    });
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  it("charge les fonctions au choix d'un type personnel et crée le membre", async () => {
    mockStaffFunctionsApi.listStaffFunctions.mockResolvedValueOnce([
      { id: "fn-1", name: "Économe", description: null },
    ]);
    mockUsersApi.createStaffMember.mockResolvedValueOnce({
      user: { id: "staff-new-1" },
      userExisted: false,
      onboardingEmailSent: false,
      activationRequired: true,
    });
    mockUsersApi.get.mockResolvedValueOnce(
      makeSchoolUserDetail({ ...TEACHER_USER, id: "staff-new-1" }),
    );

    renderScreen();
    fireEvent.press(await screen.findByTestId("users-create-fab"));
    fireEvent.press(
      await screen.findByTestId("users-create-type-school_accountant"),
    );
    await screen.findByTestId("users-create-staff-form-content");

    await waitFor(() => {
      expect(mockStaffFunctionsApi.listStaffFunctions).toHaveBeenCalledWith(
        "college-vogt",
      );
    });

    fireEvent.changeText(
      screen.getByTestId("users-create-staff-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("users-create-staff-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("users-create-staff-submit"));

    await waitFor(() => {
      expect(mockUsersApi.createStaffMember).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          role: "SCHOOL_ACCOUNTANT",
          phone: "699001122",
          pin: "123456",
        }),
      );
    });
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  // Régression : aucune école n'avait de fonction configurée, laissant le
  // sélecteur de fonction vide pour tout type de compte staff, sans moyen
  // d'en créer une depuis mobile (fonctionnalité seulement exposée côté web,
  // dans Paramètres). Ce test verrouille la création inline.
  it("permet de créer une fonction à la volée quand aucune n'est encore configurée", async () => {
    mockStaffFunctionsApi.listStaffFunctions.mockResolvedValueOnce([]);
    mockStaffFunctionsApi.createStaffFunction.mockResolvedValueOnce({
      id: "fn-new-1",
      name: "Bibliothécaire",
      description: null,
    });
    mockUsersApi.createStaffMember.mockResolvedValueOnce({
      user: { id: "staff-new-1" },
      userExisted: false,
      onboardingEmailSent: false,
      activationRequired: true,
    });
    mockUsersApi.get.mockResolvedValueOnce(
      makeSchoolUserDetail({ ...TEACHER_USER, id: "staff-new-1" }),
    );

    renderScreen();
    fireEvent.press(await screen.findByTestId("users-create-fab"));
    fireEvent.press(
      await screen.findByTestId("users-create-type-school_staff"),
    );
    await screen.findByTestId("users-create-staff-form-content");

    await waitFor(() => {
      expect(mockStaffFunctionsApi.listStaffFunctions).toHaveBeenCalledWith(
        "college-vogt",
      );
    });

    fireEvent.changeText(
      screen.getByTestId("users-create-staff-new-function-input"),
      "Bibliothécaire",
    );
    await act(async () => {
      fireEvent.press(
        screen.getByTestId("users-create-staff-new-function-submit"),
      );
    });

    await waitFor(() => {
      expect(mockStaffFunctionsApi.createStaffFunction).toHaveBeenCalledWith(
        "college-vogt",
        { name: "Bibliothécaire" },
      );
    });

    // La fonction créée est désormais sélectionnée dans le dropdown.
    expect(screen.getByTestId("users-create-staff-function")).toHaveTextContent(
      "Bibliothécaire",
    );

    fireEvent.changeText(
      screen.getByTestId("users-create-staff-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("users-create-staff-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("users-create-staff-submit"));

    await waitFor(() => {
      expect(mockUsersApi.createStaffMember).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          role: "SCHOOL_STAFF",
          functionId: "fn-new-1",
        }),
      );
    });
  });

  it("revient au sélecteur de type puis à la liste via le bouton retour", async () => {
    renderScreen();
    fireEvent.press(await screen.findByTestId("users-create-fab"));
    fireEvent.press(await screen.findByTestId("users-create-type-teacher"));
    await screen.findByTestId("users-create-teacher-form-content");

    fireEvent.press(screen.getByTestId("users-back"));
    expect(
      await screen.findByTestId("users-create-type-teacher"),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("users-back"));
    await waitFor(() => {
      expect(screen.getByTestId("users-list")).toBeOnTheScreen();
    });
  });
});
