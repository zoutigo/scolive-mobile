/**
 * Tests d'intégration — HomeLayout + store auth réel
 *
 * Ces tests vérifient que la correction du bug "Maximum update depth exceeded"
 * tient quand le vrai store Zustand est utilisé (pas de mock de useAuthStore).
 *
 * Scénario du bug : lors de la déconnexion depuis un écran (home)/*,
 * HomeLayout utilisait useEffect + router.replace("/") tout en rendant une
 * <View> ordinaire à la place du <Stack> navigator. React Navigation perdait
 * l'arbre de navigateurs et générait des mises à jour synchrones en cascade
 * remontant jusqu'à RootLayout ("Maximum update depth exceeded").
 *
 * Le correctif remplace ce pattern par <Redirect href="/" /> déclaratif
 * d'expo-router, qui est une instruction de navigation valide pour le runtime.
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
  Redirect: ({ href }: { href: string }) => {
    const { View } = require("react-native");
    return <View testID="home-layout-redirect" accessibilityLabel={href} />;
  },
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
    it("rend <Redirect href='/' /> quand le store est non-authentifié", () => {
      render(<HomeLayout />);

      expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
      expect(screen.getByTestId("home-layout-redirect")).toHaveProp(
        "accessibilityLabel",
        "/",
      );
    });

    it("rend le spinner quand le store est en chargement", () => {
      useAuthStore.setState({ ...UNAUTHENTICATED_STATE, isLoading: true });

      render(<HomeLayout />);

      expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();
      expect(screen.queryByTestId("home-layout-redirect")).toBeNull();
    });

    it("rend le Stack navigateur quand le store est authentifié", () => {
      useAuthStore.setState(AUTHENTICATED_STATE);

      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirect")).toBeNull();
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    });
  });

  // ── Transition logout via setState direct ──────────────────────────────────

  describe("transition authentifié → déconnecté via setState", () => {
    it("passe à <Redirect href='/' /> après setState sans lever d'erreur", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirect")).toBeNull();

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });

      expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
      expect(screen.getByTestId("home-layout-redirect")).toHaveProp(
        "accessibilityLabel",
        "/",
      );
    });

    it("ne renvoie jamais l'ancien testID home-layout-redirecting", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });

      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
    });
  });

  // ── Transition logout via logout() réel ───────────────────────────────────

  describe("transition via logout() du store", () => {
    it("HomeLayout affiche <Redirect> après logout() sans crash", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      expect(screen.queryByTestId("home-layout-redirect")).toBeNull();

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
    });

    it("logout() vide le store et HomeLayout redirige vers '/'", async () => {
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      expect(screen.getByTestId("home-layout-redirect")).toHaveProp(
        "accessibilityLabel",
        "/",
      );
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
    });

    it("le composant ne se réabonne pas en boucle après déconnexion", async () => {
      // Scénario : plusieurs setState sur le store en état déconnecté
      // ne doivent pas provoquer de re-renders infinis.
      useAuthStore.setState(AUTHENTICATED_STATE);
      render(<HomeLayout />);

      await act(async () => {
        useAuthStore.setState(UNAUTHENTICATED_STATE);
      });

      // Changements supplémentaires sans changer isAuthenticated
      await act(async () => {
        useAuthStore.setState({ authErrorMessage: "test" });
        useAuthStore.setState({ authErrorMessage: null });
      });

      // Toujours stable : Redirect présent, pas de boucle
      expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
    });

    it("useRouter n'est pas requis par le composant (pas de crash si absent du mock)", () => {
      // Le mock expo-router n'expose PAS useRouter.
      // Si HomeLayout appelait useRouter(), ce test crasherait avec
      // "TypeError: useRouter is not a function".
      // Son succès prouve que le composant ne dépend plus de router.replace().
      useAuthStore.setState(UNAUTHENTICATED_STATE);

      expect(() => render(<HomeLayout />)).not.toThrow();
    });
  });
});
