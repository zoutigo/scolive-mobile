import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import GoogleAuthCallbackScreen from "../../app/auth/callback";
import { authApi } from "../../src/api/auth.api";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock("../../src/api/auth.api");
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const { router: mockRouter, useLocalSearchParams } = require("expo-router") as {
  router: { replace: jest.Mock; push: jest.Mock; back: jest.Mock };
  useLocalSearchParams: jest.Mock;
};

const mockHandleLoginResponse = jest.fn().mockResolvedValue(undefined);

function makeApiError(code: string, status = 401) {
  const err = new Error(code) as Error & {
    code: string;
    statusCode: number;
    email?: string | null;
    schoolSlug?: string | null;
    setupToken?: string | null;
  };
  err.code = code;
  err.statusCode = status;
  return err;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuthStore.mockImplementation((selector: unknown) => {
    if (typeof selector === "function") {
      return selector({
        handleLoginResponse: mockHandleLoginResponse,
      });
    }
    return {
      handleLoginResponse: mockHandleLoginResponse,
    } as ReturnType<typeof useAuthStore>;
  });
});

describe("GoogleAuthCallbackScreen", () => {
  it("finalise le login SSO et revient à l'accueil", async () => {
    useLocalSearchParams.mockReturnValue({
      providerAccountId: "google-user-123",
      email: "user@gmail.com",
      firstName: "Jean",
      lastName: "Dupont",
      avatarUrl: "https://example.com/avatar.png",
    });
    mockAuthApi.loginSso.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 86400,
      refreshExpiresIn: 2592000,
      schoolSlug: "college-vogt",
    });

    render(<GoogleAuthCallbackScreen />);

    await waitFor(() => {
      expect(mockAuthApi.loginSso).toHaveBeenCalledWith(
        "GOOGLE",
        "google-user-123",
        "user@gmail.com",
        {
          firstName: "Jean",
          lastName: "Dupont",
          avatarUrl: "https://example.com/avatar.png",
        },
      );
      expect(mockHandleLoginResponse).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith("/");
    });
  });

  it("renvoie vers login avec message si le callback contient une erreur", async () => {
    useLocalSearchParams.mockReturnValue({
      error: "GOOGLE_SSO_CALLBACK_FAILED",
      message: "Session SSO incomplete",
    });

    render(<GoogleAuthCallbackScreen />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/login",
        params: {
          tab: "google",
          error: "Session SSO incomplete",
        },
      });
    });
  });

  it("redirige vers l'onboarding si la plateforme doit être finalisée", async () => {
    const err = makeApiError("PLATFORM_CREDENTIAL_SETUP_REQUIRED", 403);
    err.setupToken = "setup-token";
    err.schoolSlug = "college-vogt";
    err.email = "user@gmail.com";
    useLocalSearchParams.mockReturnValue({
      providerAccountId: "google-user-123",
      email: "user@gmail.com",
    });
    mockAuthApi.loginSso.mockRejectedValue(err);

    render(<GoogleAuthCallbackScreen />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith({
        pathname: "/onboarding",
        params: {
          email: "user@gmail.com",
          schoolSlug: "college-vogt",
          setupToken: "setup-token",
        },
      });
    });
  });
});
