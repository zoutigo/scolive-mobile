import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import HomeLayout from "../../app/(home)/_layout";
import { useAuthStore } from "../../src/store/auth.store";

const mockReplace = jest.fn();

jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    {
      Screen: () => null,
    },
  ),
  useRouter: () => ({ replace: mockReplace }),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

describe("HomeLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirige vers l'accueil si l'utilisateur n'est pas authentifié", async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>);

    render(<HomeLayout />);

    expect(screen.getByTestId("home-layout-redirecting")).toBeOnTheScreen();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it("affiche la stack protégée si l'utilisateur est authentifié", () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>);

    render(<HomeLayout />);

    expect(screen.queryByTestId("home-layout-redirecting")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
