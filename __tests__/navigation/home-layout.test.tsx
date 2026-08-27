import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));

/**
 * HomeLayout ne pilote plus aucune navigation (voir
 * __tests__/integration/logout-redirect.integration.test.tsx pour
 * l'historique du bug et le correctif). La redirection vers "/" au
 * logout/expiration de session est désormais déclenchée une seule fois, de
 * façon imperative, directement dans `useAuthStore.logout()` /
 * `.invalidateSession()` (src/store/auth.store.ts#redirectToRoot) — jamais
 * ici. Ce fichier vérifie donc uniquement le rendu pur de HomeLayout en
 * fonction de isAuthenticated/isLoading, et l'absence totale d'appel
 * `router.*` depuis ce composant, quel que soit le nombre de rerenders.
 */
// Le mock de Stack rend un wrapper avec testID pour pouvoir vérifier qu'il
// reste monté pendant l'état de redirection (overlay par-dessus, pas de
// démontage prématuré du navigateur imbriqué).
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
    it("affiche une vue neutre de redirection (pas le Stack navigator) sans naviguer", () => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      render(<HomeLayout />);
      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
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
    it("n'affiche pas la vue de redirection", () => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      render(<HomeLayout />);
      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
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

  it("passe de Stack à la vue de redirection lors de la déconnexion, sans naviguer lui-même", () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
    const { rerender } = render(<HomeLayout />);

    expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });

    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("passe de spinner à la vue de redirection quand le chargement se termine sans auth", () => {
    setAuthState({ isAuthenticated: false, isLoading: true });
    const { rerender } = render(<HomeLayout />);
    expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();

    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });

    expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
  });

  it("passe de spinner à Stack quand le chargement se termine avec auth", () => {
    setAuthState({ isAuthenticated: false, isLoading: true });
    const { rerender } = render(<HomeLayout />);
    expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();

    act(() => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      rerender(<HomeLayout />);
    });

    expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it("revient authentifié après une déconnexion sans jamais naviguer", () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
    const { rerender } = render(<HomeLayout />);

    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });

    act(() => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      rerender(<HomeLayout />);
    });
    expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });

    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
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

    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

// ─── Tests de régression — le Stack reste monté pendant l'overlay de redirection ──

/**
 * Le Stack imbriqué reste monté pendant tout l'état "déconnecté" (overlay
 * par-dessus), pour éviter tout flash ou tout démontage/remontage brutal du
 * navigateur pendant que `router.replace("/")` (déclenché depuis le store)
 * prend effet.
 */
describe("HomeLayout — le Stack reste monté pendant l'overlay de redirection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("garde le Stack monté pendant l'affichage de la vue de redirection", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });
    render(<HomeLayout />);

    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
  });

  it("le Stack n'est jamais démonté pendant que isAuthenticated reste false sur plusieurs rerenders", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });
    const { rerender } = render(<HomeLayout />);

    for (let i = 0; i < 5; i += 1) {
      rerender(<HomeLayout />);
      expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    }
  });
});
