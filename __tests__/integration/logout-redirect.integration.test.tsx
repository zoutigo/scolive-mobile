/**
 * Tests d'intégration — HomeLayout + store auth réel
 *
 * Historique du bug (reproduit manuellement sur émulateur Android) : lors de
 * la déconnexion depuis un écran (home)/* imbriqué (ex. /account avec le
 * sélecteur de rôle ouvert), la redirection vers "/" était pilotée par un
 * effect réactif dans HomeLayout (d'abord `router.dismissAll()`, puis
 * `router.dismissTo("/")` + un filet de sécurité `setTimeout` → `replace`).
 * Ce montage à plusieurs acteurs réagissant chacun au changement de
 * `isAuthenticated` (HomeLayout + app/index.tsx) restait sujet à des courses
 * qui gelaient l'app sur un écran blanc, y compris après ces deux correctifs
 * successifs.
 *
 * Le correctif actuel supprime cette réactivité : `useAuthStore.logout()`
 * et `.invalidateSession()` appellent eux-mêmes, une seule fois et de façon
 * imperative, `router.replace("/")` (src/store/auth.store.ts#redirectToRoot)
 * — exactement le même pattern déjà utilisé après un login réussi
 * (app/login.tsx). HomeLayout n'est plus qu'un simple overlay pendant la
 * fraction de seconde où `isAuthenticated` est déjà false mais où la
 * redirection n'a pas encore démonté ce Stack ; il ne déclenche plus aucune
 * navigation lui-même.
 */
import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthUser } from "../../src/types/auth.types";

// ─── Mocks infrastructure ──────────────────────────────────────────────────────

jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    { Screen: () => null },
  ),
  router: {
    replace: jest.fn(),
  },
}));

const { router: mockRouter } = require("expo-router") as {
  router: { replace: jest.Mock };
};
const mockReplace = mockRouter.replace;

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
    it("affiche la vue de redirection quand le store est non-authentifié, sans naviguer elle-même", () => {
      render(<HomeLayout />);

      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("rend le spinner quand le store est en chargement", () => {
      useAuthStore.setState({ ...UNAUTHENTICATED_STATE, isLoading: true });

      render(<HomeLayout />);

      expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();
      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("rend le Stack navigateur quand le store est authentifié", () => {
      useAuthStore.setState(AUTHENTICATED_STATE);

      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  // ── Transition logout via setState direct ──────────────────────────────────

  describe("transition authentifié → déconnecté via setState direct (hors logout())", () => {
    it("passe à la vue de redirection après setState sans naviguer ni lever d'erreur", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });

      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      // Un setState direct (pas via logout()/invalidateSession()) ne déclenche
      // plus aucune navigation : seul le call site imperatif du store le fait.
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  // ── Transition logout via logout() réel ───────────────────────────────────

  describe("transition via logout() du store", () => {
    it("logout() vide le store, redirige vers / une seule fois, et HomeLayout ne navigue pas lui-même", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("logout() ne redirige qu'une fois même si le composant re-render plusieurs fois ensuite", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      const { rerender } = render(<HomeLayout />);

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);

      expect(mockReplace).toHaveBeenCalledTimes(1);
    });
  });

  // ── Transition invalidateSession() (expiration de session) ─────────────────

  describe("transition via invalidateSession() du store", () => {
    it("invalidateSession() redirige vers / une seule fois", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await act(async () => {
        await useAuthStore.getState().invalidateSession("Session expirée");
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  // ── Régression — pas de re-déclenchement en boucle ──────────────────────────

  describe("régression — pas de navigation en boucle sur des changements d'état répétés", () => {
    it("des changements d'état rapides successifs (hors logout()) ne lèvent pas d'erreur et ne naviguent jamais", async () => {
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

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("logout depuis un écran imbriqué (plusieurs re-renders de HomeLayout après coup) reste stable et ne redirige qu'une fois", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      const { rerender } = render(<HomeLayout />);

      await act(async () => {
        await useAuthStore.getState().logout();
        rerender(<HomeLayout />);
        rerender(<HomeLayout />);
        rerender(<HomeLayout />);
      });

      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });
  });
});
