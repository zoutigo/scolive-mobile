import React from "react";
import { act, render, screen } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));

/**
 * Reproduction confirmée sur émulateur Android (voir logs de session) :
 * quand HomeLayout redirige via <Redirect href="/" /> (rendu déclaratif à
 * chaque render) pendant qu'on se déconnecte depuis un écran imbriqué comme
 * /account, app/index.tsx réagit au MÊME changement de isAuthenticated en
 * basculant HomeScreen -> LoginScreen. Les deux écrans "/" concurrents
 * (celui déjà dans la pile + celui recréé par le Redirect) font boucler
 * React Navigation -> "Maximum update depth exceeded" -> écran blanc figé.
 *
 * Le correctif déclenche `router.dismissAll()` une seule fois par transition
 * (via un ref, jamais au render) pour dépiler jusqu'à l'écran "/" déjà
 * existant au lieu d'en empiler un second. Reproduit puis vérifié corrigé
 * manuellement à plusieurs reprises sur device avant d'écrire ces tests.
 */
const mockDismissAll = jest.fn();
const mockReplace = jest.fn();

// Le mock de Stack rend un wrapper avec testID pour pouvoir vérifier qu'il
// reste monté pendant l'état de redirection (régression POP_TO_TOP non géré :
// voir describe "régression POP_TO_TOP" plus bas).
jest.mock("expo-router", () => {
  const { View: MockView } = jest.requireActual("react-native");
  return {
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => (
        <MockView testID="mock-stack">{children}</MockView>
      ),
      { Screen: () => null },
    ),
    useRouter: () => ({
      dismissAll: mockDismissAll,
      replace: mockReplace,
    }),
  };
});

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

    it("ne déclenche pas dismissAll pendant le chargement", () => {
      setAuthState({ isAuthenticated: false, isLoading: true });
      render(<HomeLayout />);
      expect(mockDismissAll).not.toHaveBeenCalled();
    });
  });

  describe("isAuthenticated = false, isLoading = false", () => {
    it("affiche une vue neutre de redirection (pas le Stack navigator)", () => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      render(<HomeLayout />);
      expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
    });

    it("appelle router.dismissAll() exactement une fois", () => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      render(<HomeLayout />);
      expect(mockDismissAll).toHaveBeenCalledTimes(1);
    });

    it("n'appelle jamais router.replace (empilerait un second écran '/')", () => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      render(<HomeLayout />);
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

    it("n'appelle pas dismissAll", () => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      render(<HomeLayout />);
      expect(mockDismissAll).not.toHaveBeenCalled();
    });
  });
});

// ─── Tests fonctionnels ───────────────────────────────────────────────────────

describe("HomeLayout — tests fonctionnels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passe de Stack à la vue de redirection lors de la déconnexion", () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
    const { rerender } = render(<HomeLayout />);

    expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });

    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
    expect(mockDismissAll).toHaveBeenCalledTimes(1);
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
    expect(mockDismissAll).not.toHaveBeenCalled();
  });

  it("revient authentifié après une déconnexion sans redéclencher dismissAll", () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
    const { rerender } = render(<HomeLayout />);

    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });
    expect(mockDismissAll).toHaveBeenCalledTimes(1);

    act(() => {
      setAuthState({ isAuthenticated: true, isLoading: false });
      rerender(<HomeLayout />);
    });
    expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();

    // Nouvelle déconnexion : le ref doit avoir été réarmé, dismissAll rappelé une fois de plus.
    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });
    expect(mockDismissAll).toHaveBeenCalledTimes(2);
  });
});

// ─── Tests de régression — bug "Maximum update depth exceeded" ────────────────

describe("HomeLayout — régression MaxUpdateDepth (logout depuis écran imbriqué)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("plusieurs rerenders successifs en état non-authentifié ne lèvent pas d'erreur", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });

    expect(() => {
      const { rerender } = render(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
    }).not.toThrow();

    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
  });

  it("dismissAll n'est jamais appelé plus d'une fois même sur de nombreux rerenders", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });

    const { rerender } = render(<HomeLayout />);
    rerender(<HomeLayout />);
    rerender(<HomeLayout />);
    rerender(<HomeLayout />);
    rerender(<HomeLayout />);

    expect(mockDismissAll).toHaveBeenCalledTimes(1);
  });

  it("des changements d'état non liés à isAuthenticated ne redéclenchent pas dismissAll", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });
    const { rerender } = render(<HomeLayout />);
    expect(mockDismissAll).toHaveBeenCalledTimes(1);

    // Simule un re-render provoqué par un autre champ du store (ex. authErrorMessage).
    rerender(<HomeLayout />);
    rerender(<HomeLayout />);

    expect(mockDismissAll).toHaveBeenCalledTimes(1);
  });
});

// ─── Tests de régression — "POP_TO_TOP was not handled by any navigator" ──────

/**
 * Reproduction confirmée sur émulateur Android (capture d'écran LogBox) :
 * l'ancienne version retournait une <View> à la place du <Stack> dès que
 * `isAuthenticated` passait à `false`, démontant le navigateur imbriqué dans
 * le même commit que celui où l'effet allait déclencher `router.dismissAll()`
 * (action POP_TO_TOP). L'action arrivait donc sans navigateur Stack monté
 * pour la recevoir -> avertissement dev "POP_TO_TOP was not handled by any
 * navigator".
 *
 * Le correctif garde le Stack monté pendant toute la redirection ; l'écran de
 * redirection n'est plus qu'un overlay par-dessus. Ces tests vérifient que le
 * Stack (mocké avec testID "mock-stack") reste présent au moment précis où
 * dismissAll() est appelé, pas seulement avant.
 */
describe("HomeLayout — régression POP_TO_TOP non géré (Stack démonté avant dismissAll)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("garde le Stack monté pendant l'affichage de la vue de redirection", () => {
    setAuthState({ isAuthenticated: false, isLoading: false });
    render(<HomeLayout />);

    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();
  });

  it("le Stack est toujours monté lors du passage authentifié -> déconnecté (moment de l'appel dismissAll)", () => {
    setAuthState({ isAuthenticated: true, isLoading: false });
    const { rerender } = render(<HomeLayout />);
    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();

    act(() => {
      setAuthState({ isAuthenticated: false, isLoading: false });
      rerender(<HomeLayout />);
    });

    // dismissAll a bien été appelé, ET le Stack est toujours dans l'arbre au
    // même render : la régression testée ici est l'inverse (Stack démonté
    // avant l'appel), ce qui n'est plus le cas.
    expect(mockDismissAll).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mock-stack")).toBeOnTheScreen();
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
