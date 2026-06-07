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
  usersApi: { list: jest.fn(), get: jest.fn() },
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

  it("affiche la barre de filtres par role", async () => {
    mockUsersApi.list.mockResolvedValueOnce(makeUsersPage([]));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-role-filter")).toBeOnTheScreen();
    });
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

  it("filtre par role quand on clique sur un chip", async () => {
    mockUsersApi.list
      .mockResolvedValueOnce(makeUsersPage(SAMPLE_USERS))
      .mockResolvedValueOnce(makeUsersPage([TEACHER_USER]));

    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId("users-list")).toBeOnTheScreen();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("role-filter-teacher"));
    });

    await waitFor(() => {
      expect(mockUsersApi.list).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ role: "TEACHER" }),
      );
    });
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

  it("le filtre de role est conserve dans le store", async () => {
    mockUsersApi.list.mockResolvedValue(makeUsersPage([]));
    renderScreen();

    await waitFor(() => {
      expect(useUsersStore.getState().isLoading).toBe(false);
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("role-filter-parent"));
    });

    await waitFor(() => {
      expect(useUsersStore.getState().filters.role).toBe("PARENT");
    });
  });
});
