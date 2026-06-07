import React from "react";
import { render, screen } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));

/**
 * Redirect est mocké en un View observable :
 *   testID="home-layout-redirect"  — présence du composant
 *   accessibilityLabel={href}      — valeur de la destination
 *
 * Note : useRouter n'est plus utilisé dans HomeLayout (plus de router.replace
 * impératif via useEffect). Ce mock n'expose intentionnellement PAS useRouter
 * pour garantir que le composant ne repose pas sur lui.
 */
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

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderAsLoading() {
  mockUseAuthStore.mockReturnValue({
    isAuthenticated: false,
    isLoading: true,
  } as ReturnType<typeof useAuthStore>);
  return render(<HomeLayout />);
}

function renderAsUnauthenticated() {
  mockUseAuthStore.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
  } as ReturnType<typeof useAuthStore>);
  return render(<HomeLayout />);
}

function renderAsAuthenticated() {
  mockUseAuthStore.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
  } as ReturnType<typeof useAuthStore>);
  return render(<HomeLayout />);
}

// ─── Tests unitaires ──────────────────────────────────────────────────────────

describe("HomeLayout — tests unitaires", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── État chargement ────────────────────────────────────────────────────────

  describe("isLoading = true", () => {
    it("affiche le spinner de chargement", () => {
      renderAsLoading();
      expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();
    });

    it("ne rend pas <Redirect> pendant le chargement", () => {
      renderAsLoading();
      expect(screen.queryByTestId("home-layout-redirect")).toBeNull();
    });
  });

  // ── État non-authentifié ───────────────────────────────────────────────────

  describe("isAuthenticated = false, isLoading = false", () => {
    it("rend <Redirect href='/' />", () => {
      renderAsUnauthenticated();
      expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
    });

    it("la destination du Redirect est '/'", () => {
      renderAsUnauthenticated();
      expect(screen.getByTestId("home-layout-redirect")).toHaveProp(
        "accessibilityLabel",
        "/",
      );
    });

    it("ne montre pas le spinner de chargement", () => {
      renderAsUnauthenticated();
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    });

    it("n'utilise pas l'ancien spinner de redirection (testID home-layout-redirecting)", () => {
      renderAsUnauthenticated();
      expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
    });
  });

  // ── État authentifié ───────────────────────────────────────────────────────

  describe("isAuthenticated = true, isLoading = false", () => {
    it("n'affiche pas <Redirect>", () => {
      renderAsAuthenticated();
      expect(screen.queryByTestId("home-layout-redirect")).toBeNull();
    });

    it("n'affiche pas le spinner de chargement", () => {
      renderAsAuthenticated();
      expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    });
  });
});

// ─── Tests fonctionnels ───────────────────────────────────────────────────────

describe("HomeLayout — tests fonctionnels", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passe de Stack à <Redirect> lors de la déconnexion", () => {
    mockUseAuthStore
      .mockReturnValueOnce({
        isAuthenticated: true,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>)
      .mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

    const { rerender } = render(<HomeLayout />);

    // Avant logout : Stack visible, pas de redirect
    expect(screen.queryByTestId("home-layout-redirect")).toBeNull();

    rerender(<HomeLayout />);

    // Après logout : Redirect vers "/" rendu
    expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
    expect(screen.getByTestId("home-layout-redirect")).toHaveProp(
      "accessibilityLabel",
      "/",
    );
  });

  it("passe de spinner à <Redirect> quand le chargement se termine sans auth", () => {
    mockUseAuthStore
      .mockReturnValueOnce({
        isAuthenticated: false,
        isLoading: true,
      } as ReturnType<typeof useAuthStore>)
      .mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

    const { rerender } = render(<HomeLayout />);
    expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();
    expect(screen.queryByTestId("home-layout-redirect")).toBeNull();

    rerender(<HomeLayout />);

    expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
  });

  it("passe de spinner à Stack quand le chargement se termine avec auth", () => {
    mockUseAuthStore
      .mockReturnValueOnce({
        isAuthenticated: false,
        isLoading: true,
      } as ReturnType<typeof useAuthStore>)
      .mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

    const { rerender } = render(<HomeLayout />);
    expect(screen.getByTestId("home-layout-loading")).toBeOnTheScreen();

    rerender(<HomeLayout />);

    expect(screen.queryByTestId("home-layout-loading")).toBeNull();
    expect(screen.queryByTestId("home-layout-redirect")).toBeNull();
  });
});

// ─── Tests de régression — bug "Maximum update depth exceeded" ────────────────

describe("HomeLayout — régression MaxUpdateDepth", () => {
  beforeEach(() => jest.clearAllMocks());

  it("plusieurs rerenders successifs en état non-authentifié ne lèvent pas d'erreur", () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>);

    expect(() => {
      const { rerender } = render(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
      rerender(<HomeLayout />);
    }).not.toThrow();

    expect(screen.getByTestId("home-layout-redirect")).toBeOnTheScreen();
  });

  it("<Redirect> est rendu une seule fois même sur plusieurs rerenders", () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>);

    const { rerender } = render(<HomeLayout />);
    rerender(<HomeLayout />);
    rerender(<HomeLayout />);

    // Un seul Redirect doit être dans le tree (pas de duplicats)
    expect(screen.getAllByTestId("home-layout-redirect")).toHaveLength(1);
  });

  it("n'expose pas useRouter dans le composant (le hook ne doit pas être appelé)", () => {
    // Si HomeLayout appelait useRouter, le mock ci-dessus n'incluant pas useRouter
    // ferait crasher le test avec "useRouter is not a function".
    // Ce test garantit implicitement que le composant n'appelle plus useRouter.
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>);

    expect(() => render(<HomeLayout />)).not.toThrow();
  });
});
