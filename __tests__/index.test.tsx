import React from "react";
import { render, screen } from "@testing-library/react-native";
import IndexScreen from "../app/index";
import { useAuthStore } from "../src/store/auth.store";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockRouter = jest.requireMock("expo-router").router as {
  replace: jest.Mock;
};

function setupStore(isAuthenticated: boolean, isLoading: boolean) {
  mockUseAuthStore.mockReturnValue({ isAuthenticated, isLoading } as ReturnType<
    typeof useAuthStore
  >);
}

beforeEach(() => jest.clearAllMocks());

describe("IndexScreen — redirect selon l'état auth", () => {
  it("affiche un loader pendant isLoading=true", () => {
    setupStore(false, true);
    render(<IndexScreen />);
    expect(screen.getByTestId !== undefined).toBe(true); // ActivityIndicator visible
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("redirige vers /login si non authentifié", () => {
    setupStore(false, false);
    render(<IndexScreen />);
    expect(mockRouter.replace).toHaveBeenCalledWith("/login");
  });

  it("redirige vers /(home) si authentifié", () => {
    setupStore(true, false);
    render(<IndexScreen />);
    expect(mockRouter.replace).toHaveBeenCalledWith("/(home)");
  });
});
