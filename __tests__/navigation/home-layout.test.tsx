import React from "react";
import { render, screen } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));

/**
 * HomeLayout ne pilote plus aucune navigation (voir
 * __tests__/integration/logout-redirect.integration.test.tsx pour
 * l'historique du bug et le correctif). La redirection vers "/" au
 * logout/expiration de session est déclenchée une seule fois, de façon
 * imperative, directement dans `useAuthStore.logout()` /
 * `.invalidateSession()` (src/store/auth.store.ts#redirectToRoot) — jamais
 * ici.
 *
 * Ce fichier vérifie uniquement :
 * - le rendu pur de HomeLayout en fonction de isLoading
 * - l'absence totale d'appel `router.*` depuis ce composant, quel que soit
 *   isAuthenticated ou le nombre de rerenders
 *
 * Il n'affiche plus d'overlay conditionné à isAuthenticated : ce Stack
 * partage la route "index" avec app/index.tsx (segments de groupe expo-router
 * invisibles dans l'URL), donc un `router.replace("/")` déclenché depuis un
 * écran imbriqué peut atterrir ici plutôt qu'à la racine — dans ce cas c'est
 * app/(home)/index.tsx qui affiche lui-même LoginScreen (voir
 * __tests__/home/HomeScreen.user-loading.test.tsx). Un overlay opaque ici
 * masquerait ce repli.
 */
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
      dismissTo: jest.fn(),
      replace: jest.fn(),
    },
  };
});

const { router: mockRouter } = require("expo-router") as {
  router: { dismissTo: jest.Mock; replace: jest.Mock };
};
const mockDismissTo = mockRouter.dismissTo;
const mockReplace = mockRouter.replace;

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setAuthState(state: { isAuthenticated: boolean; isLoading: boolean }) {
  mockUseAuthStore.mockReturnValue(state as ReturnType<typeof useAuthStore>);
}

// ─── Tests unitaires ──────────────────────────────────────────────────────────

describe("HomeLayout — tests unitaires", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isLoading = true", () => {
    it("affiche le spinner de chargement", () => {
      setAuthState({ isAuthenticated: false, isLoading: true });
      render(<HomeLayout />);
      expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();
    });

    it("ne navigue jamais pendant le chargement", () => {
      setAuthState({ isAuthenticated: false, isLoading: true });
      render(<HomeLayout />);
      expect(mockDismissTo).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe("isAuthenticated = false, isLoading = false", () => {
    it("affiche le Stack navigator (pas d'overlay), sans naviguer", () => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      render(<HomeLayout />);
      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
      expect(mockDismissTo).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("ne montre pas le spinner de chargement", () => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      render(<HomeLayout />);
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    });
  });

  describe("isAuthenticated = true, isLoading = false", () => {
    it("affiche le Stack navigator", () => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      render(<HomeLayout />);
      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    });

    it("n'affiche pas le spinner de chargement", () => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      render(<HomeLayout />);
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    });

    it("ne navigue jamais", () => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      render(<HomeLayout />);
      expect(mockDismissTo).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});

// ─── Tests fonctionnels ───────────────────────────────────────────────────────

describe("HomeLayout — tests fonctionnels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reste sur le Stack lors de la déconnexion, sans naviguer lui-même", () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
    const { rerender } = render(<HomeLayout />);

    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();

    setAuthState({ isAuthenticated: false, isLoading: false });
    rerender(<HomeLayout />);

    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("passe de spinner à Stack quand le chargement se termine sans auth", () => {
    setAuthState({ isAuthenticated: false, isLoading: true });
    const { rerender } = render(<HomeLayout />);
    expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();

    setAuthState({ isAuthenticated: false, isLoading: false });
    rerender(<HomeLayout />);

    expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
  });

  it("passe de spinner à Stack quand le chargement se termine avec auth", () => {
    setAuthState({ isAuthenticated: false, isLoading: true });
    const { rerender } = render(<HomeLayout />);
    expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();

    setAuthState({ isAuthenticated: true, isLoading: false });
    rerender(<HomeLayout />);

    expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});

// ─── Tests de régression — pas de navigation, quel que soit le nombre de rerenders ──

describe("HomeLayout — régression : aucun appel router.* depuis ce composant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("plusieurs rerenders successifs en état non-authentifié ne lèvent pas d'erreur ni ne naviguent", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });

    expect(() => {
      const { rerender } = render(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
    }).not.toThrow();

    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

// ─── Tests de régression — le Stack reste monté quel que soit l'état d'auth ──

describe("HomeLayout — le Stack reste monté quel que soit l'état d'auth (pas d'overlay)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("garde le Stack monté en état non-authentifié", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });
    render(<HomeLayout />);

    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
  });

  it("le Stack n'est jamais démonté sur plusieurs rerenders, quel que soit isAuthenticated", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });
    const { rerender } = render(<HomeLayout />);

    for (let i = 0; i < 5; i += 1) {
      rerender(<HomeLayout />);
      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    }
  });
});
