/**
 * Tests d'intégration — HomeLayout + store auth réel
 *
 * Historique du bug (reproduit manuellement sur émulateur Android), en trois
 * épisodes :
 *
 * 1. La redirection vers "/" était pilotée par un effect réactif dans
 *    HomeLayout (d'abord `router.dismissAll()`, puis `router.dismissTo("/")`
 *    + un filet de sécurité `setTimeout` → `replace`). Ce montage à
 *    plusieurs acteurs réagissant chacun au changement de `isAuthenticated`
 *    (HomeLayout + app/index.tsx) restait sujet à des courses qui gelaient
 *    l'app sur un écran blanc.
 * 2. Le correctif suivant a supprimé cette réactivité : `useAuthStore.logout()`
 *    et `.invalidateSession()` appellent eux-mêmes, une seule fois et de
 *    façon imperative, `router.replace("/")`
 *    (src/store/auth.store.ts#redirectToRoot). HomeLayout n'est plus qu'un
 *    overlay passif — mais l'écran blanc a persisté.
 * 3. Cause réelle, identifiée après reproduction sur émulateur : `app/(home)
 *    /index.tsx` partage le chemin "/" avec `app/index.tsx` (les segments de
 *    groupe expo-router comme "(home)" sont invisibles dans l'URL). Quand
 *    `router.replace("/")` est appelé depuis un écran imbriqué profond
 *    (ex. /account), React Navigation résout la cible dans le navigateur
 *    (home) déjà actif (son propre "index", avec `user` déjà à `null`)
 *    plutôt que de remonter jusqu'à `app/index.tsx` — parce que les deux
 *    états (courant et cible) s'accordent déjà sur "(home)" au niveau
 *    racine, la divergence n'apparaît qu'au niveau imbriqué. Résultat :
 *    `HomeScreen` restait bloqué sur son spinner "user null" indéfiniment,
 *    lui-même masqué par l'overlay opaque de HomeLayout — écran blanc figé,
 *    confirmé par capture d'écran et dump UI sur émulateur (les deux testID
 *    `home-loading-spinner` et l'ex-`home-layout-redirecting` étaient montés
 *    simultanément, ce dernier au-dessus).
 *
 * Le correctif final ne cherche plus à empêcher cette résolution ambiguë
 * (comportement normal de React Navigation pour les groupes de routes) : il
 * ajoute un filet de sécurité côté contenu. `app/(home)/index.tsx` affiche
 * désormais lui-même `LoginScreen` quand `isAuthenticated` est false (voir
 * __tests__/home/HomeScreen.user-loading.test.tsx), et HomeLayout n'affiche
 * plus d'overlay conditionné à `isAuthenticated` (il masquerait ce repli).
 * `redirectToRoot()` reste utile comme signal best-effort — il fonctionne
 * correctement pour tout appel depuis un écran non imbriqué (ex. après
 * login, cf. app/login.tsx) — mais n'est plus le seul rempart contre l'écran
 * blanc.
 */
import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";
import type { AuthUser } from "../../src/types/auth.types";

// ─── Mocks infrastructure ──────────────────────────────────────────────────────

jest.mock("expo-router", () => {
  const { View: MockView } = jest.requireActual("react-native");
  return {
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => (
        <MockView testID="mock-stack">{children}</MockView>
      ),
      { Screen: () => null },
    ),
    router: {
      replace: jest.fn(),
    },
  };
});

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
    it("affiche le Stack navigateur (pas d'overlay) quand le store est non-authentifié, sans naviguer elle-même", () => {
      render(<HomeLayout />);

      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("rend le spinner quand le store est en chargement", () => {
      useAuthStore.setState({ ...UNAUTHENTICATED_STATE, isLoading: true });

      render(<HomeLayout />);

      expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();
      expect(screen.queryByTestId("mock-stack")).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("rend le Stack navigateur quand le store est authentifié", () => {
      useAuthStore.setState(AUTHENTICATED_STATE);

      render(<HomeLayout />);

      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  // ── Transition logout via setState direct ──────────────────────────────────

  describe("transition authentifié → déconnecté via setState direct (hors logout())", () => {
    it("reste sur le Stack après setState sans naviguer ni lever d'erreur", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });

      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
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

      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
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

      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });
  });
});
