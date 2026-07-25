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
jest.mock("../../src/api/users.api");
jest.mock("../../src/api/users.api", () => ({
  usersApi: { list: jest.fn(), get: jest.fn(), listSchoolYears: jest.fn() },
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

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  act(() => useUsersStore.getState().reset());

  // Détail vide par défaut
  mockUsersApi.get.mockResolvedValue(makeSchoolUserDetail(TEACHER_USER));
  mockUsersApi.listSchoolYears.mockResolvedValue([]);
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

  it("affiche le compteur d'utilisateurs", async () => {
    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage(SAMPLE_USERS, { total: 5 }),
    );
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-total")).toBeOnTheScreen();
    });
    expect(screen.getByText("5 utilisateurs")).toBeOnTheScreen();
  });

  it("affiche la légende des pastilles de rôle à côté du compteur", async () => {
    mockUsersApi.list.mockResolvedValueOnce(
      makeUsersPage(SAMPLE_USERS, { total: 5 }),
    );
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-role-legend")).toBeOnTheScreen();
    });
    expect(screen.getByText("Enseignant")).toBeOnTheScreen();
    expect(screen.getByText("Superviseur")).toBeOnTheScreen();
    expect(screen.getByText("Comptable")).toBeOnTheScreen();
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
