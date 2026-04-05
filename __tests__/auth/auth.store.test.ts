import { act } from "@testing-library/react-native";
import { useAuthStore } from "../../src/store/auth.store";
import { authApi } from "../../src/api/auth.api";
import { tokenStorage } from "../../src/api/client";
import type { AuthUser, LoginResponse } from "../../src/types/auth.types";

jest.mock("../../src/api/auth.api");
jest.mock("../../src/api/client", () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    getSchoolSlug: jest.fn(),
    setTokens: jest.fn(),
    setSchoolSlug: jest.fn(),
    clear: jest.fn(),
  },
  apiFetch: jest.fn(),
  BASE_URL: "http://localhost:3001/api",
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

const fakeLoginResponse: LoginResponse = {
  accessToken: "access-token-123",
  refreshToken: "refresh-token-456",
  tokenType: "Bearer",
  expiresIn: 86400,
  refreshExpiresIn: 2592000,
  schoolSlug: "ecole-test",
};

const fakeUser: AuthUser = {
  id: "user-001",
  firstName: "Jean",
  lastName: "Mbarga",
  email: "jean@ecole.com",
  platformRoles: [],
  memberships: [{ schoolId: "school-001", role: "TEACHER" }],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "TEACHER",
  activeRole: "TEACHER",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.getSchoolSlug.mockResolvedValue(null);
  mockStorage.setSchoolSlug.mockResolvedValue(undefined);
  // Reset store state
  useAuthStore.setState({
    user: null,
    accessToken: null,
    schoolSlug: null,
    isLoading: true,
    isAuthenticated: false,
    authErrorMessage: null,
  });
});

describe("auth.store — initialize", () => {
  it("passe isLoading à false sans token stocké", async () => {
    mockStorage.getAccessToken.mockResolvedValue(null);
    mockStorage.getRefreshToken.mockResolvedValue(null);

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    const { isLoading, isAuthenticated } = useAuthStore.getState();
    expect(isLoading).toBe(false);
    expect(isAuthenticated).toBe(false);
  });

  it("restaure la session depuis le access token existant", async () => {
    mockStorage.getAccessToken.mockResolvedValue("stored-access-token");
    mockStorage.getRefreshToken.mockResolvedValue("stored-refresh-token");
    mockStorage.getSchoolSlug.mockResolvedValue("ecole-test");
    mockAuthApi.me.mockResolvedValue(fakeUser);

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    const { isAuthenticated, accessToken, isLoading } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(accessToken).toBe("stored-access-token");
    expect(isLoading).toBe(false);
  });

  it("tente un refresh silencieux si seul le refresh token est présent", async () => {
    mockStorage.getAccessToken.mockResolvedValue(null);
    mockStorage.getRefreshToken.mockResolvedValue("stored-refresh-token");
    mockAuthApi.refresh.mockResolvedValue(fakeLoginResponse);
    mockStorage.setTokens.mockResolvedValue(undefined);
    mockAuthApi.me.mockResolvedValue(fakeUser);

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(mockAuthApi.refresh).toHaveBeenCalledWith("stored-refresh-token");
    expect(mockStorage.setTokens).toHaveBeenCalledWith(
      fakeLoginResponse.accessToken,
      fakeLoginResponse.refreshToken,
      fakeLoginResponse.refreshExpiresIn,
    );
    expect(mockStorage.setSchoolSlug).toHaveBeenCalledWith(
      fakeLoginResponse.schoolSlug,
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("efface le storage et reste déconnecté si le refresh échoue", async () => {
    mockStorage.getAccessToken.mockResolvedValue(null);
    mockStorage.getRefreshToken.mockResolvedValue("expired-refresh-token");
    mockAuthApi.refresh.mockRejectedValue(new Error("Invalid refresh token"));
    mockStorage.clear.mockResolvedValue();

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(mockStorage.clear).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

describe("auth.store — handleLoginResponse", () => {
  it("stocke les tokens, récupère le profil et marque comme authentifié", async () => {
    mockStorage.setTokens.mockResolvedValue(undefined);
    mockAuthApi.me.mockResolvedValue(fakeUser);

    await act(async () => {
      await useAuthStore.getState().handleLoginResponse(fakeLoginResponse);
    });

    expect(mockStorage.setTokens).toHaveBeenCalledWith(
      "access-token-123",
      "refresh-token-456",
      2592000,
    );
    expect(mockStorage.setSchoolSlug).toHaveBeenCalledWith("ecole-test");
    expect(mockAuthApi.me).toHaveBeenCalledWith("ecole-test");
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe("access-token-123");
    expect(state.schoolSlug).toBe("ecole-test");
    expect(state.user).toEqual(fakeUser);
  });

  it("reste authentifié même si authApi.me échoue", async () => {
    mockStorage.setTokens.mockResolvedValue(undefined);
    mockAuthApi.me.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      await useAuthStore.getState().handleLoginResponse(fakeLoginResponse);
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toBeNull();
  });
});

describe("auth.store — logout", () => {
  it("efface le state et appelle authApi.logout", async () => {
    useAuthStore.setState({
      user: null,
      accessToken: "access-token-123",
      schoolSlug: "ecole-test",
      isAuthenticated: true,
      isLoading: false,
    });
    mockAuthApi.logout.mockResolvedValue();

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.schoolSlug).toBeNull();
    expect(mockAuthApi.logout).toHaveBeenCalled();
  });

  it("invalidateSession efface la session et stocke un message utilisateur", async () => {
    useAuthStore.setState({
      user: fakeUser,
      accessToken: "access-token-123",
      schoolSlug: "ecole-test",
      isAuthenticated: true,
      isLoading: false,
      authErrorMessage: null,
    });
    mockStorage.clear.mockResolvedValue(undefined);

    await act(async () => {
      await useAuthStore
        .getState()
        .invalidateSession(
          "Votre session a expiré. Veuillez vous reconnecter.",
        );
    });

    const state = useAuthStore.getState();
    expect(mockStorage.clear).toHaveBeenCalled();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.schoolSlug).toBeNull();
    expect(state.authErrorMessage).toBe(
      "Votre session a expiré. Veuillez vous reconnecter.",
    );
  });
});
