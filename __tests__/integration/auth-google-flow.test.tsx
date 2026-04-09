import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import LoginScreen from "../../app/login";
import { useAuthStore } from "../../src/store/auth.store";
import { signInWithGoogleAsync } from "../../src/auth/google-auth";

jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));
jest.mock("../../src/auth/google-auth", () => ({
  GoogleAuthError: class GoogleAuthError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "GoogleAuthError";
      this.code = code;
    }
  },
  signInWithGoogleAsync: jest.fn(),
}));
const mockGoogleAuth = signInWithGoogleAsync as jest.MockedFunction<
  typeof signInWithGoogleAsync
>;

describe("Flux d'intégration Google login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      schoolSlug: null,
      isLoading: false,
      isAuthenticated: false,
      authErrorMessage: null,
    });
  });

  it("déclenche le navigateur Google puis laisse le callback finaliser l'auth", async () => {
    mockGoogleAuth.mockResolvedValue(undefined);
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId("tab-google"));
    fireEvent.press(screen.getByTestId("sso-google"));

    await waitFor(() => {
      expect(mockGoogleAuth).toHaveBeenCalled();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
