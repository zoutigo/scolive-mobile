import React from "react";
import { render, screen } from "@testing-library/react-native";
import IndexScreen from "../app/index";
import { useAuthStore } from "../src/store/auth.store";

jest.mock("../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

function setupStore(overrides: {
  isAuthenticated: boolean;
  isLoading: boolean;
}) {
  mockUseAuthStore.mockReturnValue({
    isAuthenticated: overrides.isAuthenticated,
    isLoading: overrides.isLoading,
    user: null,
    accessToken: null,
    schoolSlug: null,
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("IndexScreen", () => {
  it("affiche un loader pendant le chargement", () => {
    setupStore({ isAuthenticated: false, isLoading: true });

    render(<IndexScreen />);

    expect(screen.getByTestId("index-loading")).toBeOnTheScreen();
  });

  it("affiche l'écran de connexion si non authentifié", () => {
    setupStore({ isAuthenticated: false, isLoading: false });

    render(<IndexScreen />);

    expect(screen.getByText("SCOLIVE")).toBeOnTheScreen();
    expect(screen.getByText("Bienvenue")).toBeOnTheScreen();
  });

  it("affiche l'écran home si authentifié", () => {
    setupStore({ isAuthenticated: true, isLoading: false });

    render(<IndexScreen />);

    expect(screen.getByText("Bienvenue")).toBeOnTheScreen();
  });
});
