import { authApi } from "../../src/api/auth.api";
import { apiFetch, tokenStorage } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
  tokenStorage: {
    getRefreshToken: jest.fn(),
    clear: jest.fn(),
  },
  BASE_URL: "http://localhost:3001/api",
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

beforeEach(() => jest.clearAllMocks());

describe("authApi.loginEmail", () => {
  it("appelle POST /auth/login avec email + password", async () => {
    mockApiFetch.mockResolvedValue({ accessToken: "tok" });
    await authApi.loginEmail("test@test.com", "password123");
    expect(mockApiFetch).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", password: "password123" }),
    });
  });
});

describe("authApi.loginPhone", () => {
  it("appelle POST /auth/login-phone avec phone + pin", async () => {
    mockApiFetch.mockResolvedValue({ accessToken: "tok" });
    await authApi.loginPhone("612345678", "123456");
    expect(mockApiFetch).toHaveBeenCalledWith("/auth/login-phone", {
      method: "POST",
      body: JSON.stringify({ phone: "612345678", pin: "123456" }),
    });
  });

  it("inclut schoolSlug si fourni", async () => {
    mockApiFetch.mockResolvedValue({ accessToken: "tok" });
    await authApi.loginPhone("612345678", "123456", "mon-ecole");
    expect(mockApiFetch).toHaveBeenCalledWith("/auth/login-phone", {
      method: "POST",
      body: JSON.stringify({
        phone: "612345678",
        pin: "123456",
        schoolSlug: "mon-ecole",
      }),
    });
  });
});

describe("authApi.loginSso", () => {
  it("appelle POST /auth/sso/login avec provider + providerAccountId + email", async () => {
    mockApiFetch.mockResolvedValue({ accessToken: "tok" });
    await authApi.loginSso("GOOGLE", "google-uid-123", "user@gmail.com", {
      firstName: "Jean",
      lastName: "Dupont",
    });
    expect(mockApiFetch).toHaveBeenCalledWith("/auth/sso/login", {
      method: "POST",
      body: JSON.stringify({
        provider: "GOOGLE",
        providerAccountId: "google-uid-123",
        email: "user@gmail.com",
        firstName: "Jean",
        lastName: "Dupont",
      }),
    });
  });
});

describe("authApi.refresh", () => {
  it("appelle POST /auth/refresh avec le refreshToken dans le body", async () => {
    mockApiFetch.mockResolvedValue({ accessToken: "new-tok" });
    await authApi.refresh("my-refresh-token");
    expect(mockApiFetch).toHaveBeenCalledWith("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: "my-refresh-token" }),
    });
  });
});

describe("authApi.logout", () => {
  it("récupère le refreshToken depuis le storage et appelle POST /auth/logout", async () => {
    mockStorage.getRefreshToken.mockResolvedValue("stored-refresh");
    mockApiFetch.mockResolvedValue({});
    mockStorage.clear.mockResolvedValue();

    await authApi.logout();

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: "stored-refresh" }),
      },
      true,
    );
    expect(mockStorage.clear).toHaveBeenCalled();
  });

  it("efface quand même le storage si l'API échoue", async () => {
    mockStorage.getRefreshToken.mockResolvedValue("stored-refresh");
    mockApiFetch.mockRejectedValue(new Error("Network error"));
    mockStorage.clear.mockResolvedValue();

    await authApi.logout();

    expect(mockStorage.clear).toHaveBeenCalled();
  });
});
