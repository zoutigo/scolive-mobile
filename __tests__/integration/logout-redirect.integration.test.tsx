/**
 * Tests d'intégration — HomeLayout + store auth réel
 *
 * Ces tests vérifient que la correction du bug "Maximum update depth exceeded"
 * tient quand le vrai store Zustand est utilisé (pas de mock de useAuthStore).
 *
 * Scénario du bug (reproduit manuellement sur émulateur Android) : lors de la
 * déconnexion depuis un écran (home)/* imbriqué (ex. /account avec le
 * sélecteur de rôle ouvert), HomeLayout rendait <Redirect href="/" />
 * déclarativement à chaque render dès que isAuthenticated passait à false.
 * Au même moment, app/index.tsx réagit au même changement de store en
 * basculant HomeScreen -> LoginScreen. Les deux écrans "/" concurrents (celui
 * déjà présent dans la pile de navigation + celui recréé par le Redirect)
 * faisaient boucler React Navigation ("Maximum update depth exceeded"),
 * gelant l'app sur un écran blanc — logout "qui ne fait rien".
 *
 * Le correctif remplace le <Redirect> déclaratif par un unique appel
 * `router.dismissAll()` déclenché dans un effect gardé par un ref (jamais
 * plus d'une fois par transition), qui dépile jusqu'à l'écran "/" déjà
 * existant au lieu d'en empiler un second.
 */
import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthUser } from "../../src/types/auth.types";

// ─── Mocks infrastructure ──────────────────────────────────────────────────────

const mockDismissAll = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    { Screen: () => null },
  ),
  useRouter: () => ({
    dismissAll: mockDismissAll,
    replace: mockReplace,
  }),
}));

jest.mock("../../src/notifications/push-registration", () => ({
  syncPushRegistration: jest.fn().mockResolvedValue(undefined),
  unregisterPushRegistration: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/api/auth.api", () => ({
  authApi: {
    logout: jest.fn().mockResolvedValue(undefined),
    me: jest.fn().mockResolvedValue(null),
    meGlobal: jest.fn().mockResolvedValue(null),
    refresh: jest.fn().mockRejectedValue(new Error("no refresh")),
  },
}));

jest.mock("../../src/api/client", () => ({
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue(null),
    getRefreshToken: jest.fn().mockResolvedValue(null),
    getSchoolSlug: jest.fn().mockResolvedValue(null),
    setTokens: jest.fn().mockResolvedValue(undefined),
    setSchoolSlug: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
  apiFetch: jest.fn(),
  BASE_URL: "http://localhost:3001/api",
  notifySessionExpired: jest.fn().mockResolvedValue(undefined),
}));

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const fakeTeacher: AuthUser = {
  id: "teacher-001",
  firstName: "Sophie",
  lastName: "Mbarga",
  email: "sophie@ecole.fr",
  platformRoles: [],
  memberships: [{ schoolId: "school-001", role: "TEACHER" }],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "TEACHER",
  activeRole: "TEACHER",
};

const AUTHENTICATED_STATE = {
  user: fakeTeacher,
  accessToken: "access-token-123",
  schoolSlug: "lycee-test",
  isAuthenticated: true,
  isLoading: false,
  authErrorMessage: null,
};

const UNAUTHENTICATED_STATE = {
  user: null,
  accessToken: null,
  schoolSlug: null,
  isAuthenticated: false,
  isLoading: false,
  authErrorMessage: null,
};

// ─── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState(UNAUTHENTICATED_STATE);
});

// ─── Tests d'intégration ───────────────────────────────────────────────────────

describe("HomeLayout + store auth réel — intégration", () => {
  describe("état initial du store", () => {
    it("affiche la vue de redirection quand le store est non-authentifié", () => {
      render(<HomeLayout />);

      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
    });

    it("rend le spinner quand le store est en chargement", () => {
      useAuthStore.setState({ ...UNAUTHENTICATED_STATE, isLoading: true });

      render(<HomeLayout />);

      expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();
      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
      expect(mockDismissAll).not.toHaveBeenCalled();
    });

    it("rend le Stack navigateur quand le store est authentifié", () => {
      useAuthStore.setState(AUTHENTICATED_STATE);

      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
      expect(mockDismissAll).not.toHaveBeenCalled();
    });
  });

  // ── Transition logout via setState direct ──────────────────────────────────

  describe("transition authentifié → déconnecté via setState", () => {
    it("passe à la vue de redirection après setState sans lever d'erreur", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });

      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("ne renvoie jamais l'ancien pattern <Redirect> (testID home-layout-redirect)", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });

      expect(screen.queryByTestId("home-layout-redirect")).toBeNull();
    });
  });

  // ── Transition logout via logout() réel ───────────────────────────────────

  describe("transition via logout() du store", () => {
    it("HomeLayout redirige après logout() sans crash", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
    });

    it("logout() vide le store et HomeLayout n'appelle dismissAll qu'une fois", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(mockDismissAll).toHaveBeenCalledTimes(1);
    });
  });

  // ── Régression — "Maximum update depth exceeded" ───────────────────────────

  describe("régression — boucle infinie de rendus (MaxUpdateDepth)", () => {
    it("des changements d'état rapides successifs ne lèvent pas d'erreur", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await expect(
        act(async () => {
          useAuthStore.setState({ ...UNAUTHENTICATED_STATE, isLoading: true });
          useAuthStore.setState(UNAUTHENTICATED_STATE);
          useAuthStore.setState(UNAUTHENTICATED_STATE);
          useAuthStore.setState(UNAUTHENTICATED_STATE);
        }),
      ).resolves.not.toThrow();

      // Une seule redirection malgré les changements d'état multiples.
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
    });

    it("le composant ne redéclenche pas dismissAll après déconnexion", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });
      expect(mockDismissAll).toHaveBeenCalledTimes(1);

      // Changements supplémentaires sans changer isAuthenticated (ex. le
      // ConfirmDialog "session expirée" de app/index.tsx pilote authErrorMessage).
      await act(async () => {
        useAuthStore.setState({ authErrorMessage: "test" });
        useAuthStore.setState({ authErrorMessage: null });
      });

      // Toujours stable : un seul dismissAll, pas de boucle.
      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
    });

    it("logout depuis un écran imbriqué (isAuthenticated bascule alors qu'un autre re-render est déjà en cours) reste stable", async () => {
      // Reproduit la condition de course du bug : plusieurs souscripteurs du
      // store (ici simulés par des setState imbriqués) réagissent au même
      // instant que HomeLayout au changement d'authentification.
      useAuthStore.setState(AUTHENTICATED_STATE);
      const { rerender } = render(<HomeLayout />);

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
        rerender(<HomeLayout />);
        rerender(<HomeLayout />);
        rerender(<HomeLayout />);
      });

      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
    });
  });
});
