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

describe("authApi.getOnboardingOptions", () => {
  it("appelle GET /auth/onboarding/options avec email", async () => {
    mockApiFetch.mockResolvedValue({ schoolRoles: [] });

    await authApi.getOnboardingOptions({ email: "parent@ecole.cm" });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/auth/onboarding/options?email=parent%40ecole.cm",
    );
  });

  it("appelle GET /auth/onboarding/options avec setupToken", async () => {
    mockApiFetch.mockResolvedValue({ schoolRoles: [] });

    await authApi.getOnboardingOptions({ setupToken: "setup-token" });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/auth/onboarding/options?setupToken=setup-token",
    );
  });
});

describe("authApi.completeOnboarding", () => {
  it("appelle POST /auth/onboarding/complete", async () => {
    mockApiFetch.mockResolvedValue({ success: true });

    await authApi.completeOnboarding({
      email: "parent@ecole.cm",
      temporaryPassword: "TempPass11",
      newPassword: "NewPassWord9",
      firstName: "Lisa",
      lastName: "Mbele",
      gender: "F",
      birthDate: "1987-01-09",
      answers: [
        { questionKey: "MOTHER_MAIDEN_NAME", answer: "Abena" },
        { questionKey: "BIRTH_CITY", answer: "Douala" },
        { questionKey: "FAVORITE_SPORT", answer: "Basket" },
      ],
      parentClassId: "class-1",
      parentStudentId: "student-1",
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/auth/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({
        email: "parent@ecole.cm",
        temporaryPassword: "TempPass11",
        newPassword: "NewPassWord9",
        firstName: "Lisa",
        lastName: "Mbele",
        gender: "F",
        birthDate: "1987-01-09",
        answers: [
          { questionKey: "MOTHER_MAIDEN_NAME", answer: "Abena" },
          { questionKey: "BIRTH_CITY", answer: "Douala" },
          { questionKey: "FAVORITE_SPORT", answer: "Basket" },
        ],
        parentClassId: "class-1",
        parentStudentId: "student-1",
      }),
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
