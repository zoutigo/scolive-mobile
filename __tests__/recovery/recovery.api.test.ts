import { recoveryApi } from "../../src/api/recovery.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const MOCK_QUESTIONS = [
  { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
  { key: "BIRTH_CITY", label: "Votre ville de naissance" },
  { key: "FAVORITE_SPORT", label: "Votre sport préféré" },
];

describe("recoveryApi", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  // ── PIN Recovery ──────────────────────────────────────────────────────────

  describe("forgotPinOptions", () => {
    it("appelle POST /auth/forgot-pin/options avec phone", async () => {
      const response = {
        success: true,
        principalHint: "6***3",
        questions: MOCK_QUESTIONS,
        schoolSlug: null,
      };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPinOptions({ phone: "650000001" });

      expect(mockApiFetch).toHaveBeenCalledWith("/auth/forgot-pin/options", {
        method: "POST",
        body: JSON.stringify({ phone: "650000001" }),
      });
      expect(result).toEqual(response);
    });

    it("appelle POST /auth/forgot-pin/options avec email", async () => {
      const response = {
        success: true,
        principalHint: "j***n@example.com",
        questions: MOCK_QUESTIONS,
        schoolSlug: "ecole-test",
      };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPinOptions({
        email: "jean@example.com",
      });

      expect(mockApiFetch).toHaveBeenCalledWith("/auth/forgot-pin/options", {
        method: "POST",
        body: JSON.stringify({ email: "jean@example.com" }),
      });
      expect(result).toEqual(response);
    });

    it("propage les erreurs API", async () => {
      const error = { code: "NOT_FOUND", statusCode: 404 };
      mockApiFetch.mockRejectedValueOnce(error);

      await expect(
        recoveryApi.forgotPinOptions({ phone: "650000001" }),
      ).rejects.toEqual(error);
    });
  });

  describe("forgotPinVerify", () => {
    const payload = {
      phone: "650000001",
      birthDate: "1990-01-15",
      answers: [
        { questionKey: "MOTHER_MAIDEN_NAME", answer: "dupont" },
        { questionKey: "BIRTH_CITY", answer: "yaoundé" },
        { questionKey: "FAVORITE_SPORT", answer: "football" },
      ],
    };

    it("appelle POST /auth/forgot-pin/verify", async () => {
      const response = {
        success: true,
        recoveryToken: "jwt-token-123",
        schoolSlug: null,
      };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPinVerify(payload);

      expect(mockApiFetch).toHaveBeenCalledWith("/auth/forgot-pin/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result.recoveryToken).toBe("jwt-token-123");
    });

    it("propage RECOVERY_INVALID", async () => {
      const error = { code: "RECOVERY_INVALID", statusCode: 400 };
      mockApiFetch.mockRejectedValueOnce(error);

      await expect(recoveryApi.forgotPinVerify(payload)).rejects.toEqual(error);
    });
  });

  describe("forgotPinComplete", () => {
    it("appelle POST /auth/forgot-pin/complete", async () => {
      const response = { success: true, schoolSlug: null };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPinComplete({
        recoveryToken: "jwt-token-123",
        newPin: "654321",
      });

      expect(mockApiFetch).toHaveBeenCalledWith("/auth/forgot-pin/complete", {
        method: "POST",
        body: JSON.stringify({
          recoveryToken: "jwt-token-123",
          newPin: "654321",
        }),
      });
      expect(result.success).toBe(true);
    });

    it("propage RECOVERY_SESSION_EXPIRED", async () => {
      const error = { code: "RECOVERY_SESSION_EXPIRED", statusCode: 401 };
      mockApiFetch.mockRejectedValueOnce(error);

      await expect(
        recoveryApi.forgotPinComplete({
          recoveryToken: "expired",
          newPin: "654321",
        }),
      ).rejects.toEqual(error);
    });
  });

  // ── Password Recovery ─────────────────────────────────────────────────────

  describe("forgotPasswordRequest", () => {
    it("appelle POST /auth/forgot-password/request", async () => {
      const response = {
        success: true,
        message: "Si ce compte existe, un lien a été envoyé.",
      };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPasswordRequest({
        email: "test@example.com",
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/forgot-password/request",
        {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );
      expect(result.success).toBe(true);
    });

    it("propage les erreurs réseau", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        recoveryApi.forgotPasswordRequest({ email: "test@example.com" }),
      ).rejects.toThrow("Network error");
    });
  });

  describe("forgotPasswordOptions", () => {
    it("appelle POST /auth/forgot-password/options avec le token", async () => {
      const response = {
        success: true,
        emailHint: "t***t@example.com",
        schoolSlug: null,
        questions: MOCK_QUESTIONS,
      };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPasswordOptions({
        token: "a".repeat(48),
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/forgot-password/options",
        {
          method: "POST",
          body: JSON.stringify({ token: "a".repeat(48) }),
        },
      );
      expect(result.questions).toHaveLength(3);
    });

    it("propage TOKEN_INVALID", async () => {
      const error = { code: "TOKEN_INVALID", statusCode: 400 };
      mockApiFetch.mockRejectedValueOnce(error);

      await expect(
        recoveryApi.forgotPasswordOptions({ token: "invalid" }),
      ).rejects.toEqual(error);
    });
  });

  describe("forgotPasswordVerify", () => {
    const payload = {
      token: "a".repeat(48),
      birthDate: "1990-01-15",
      answers: [
        { questionKey: "MOTHER_MAIDEN_NAME", answer: "dupont" },
        { questionKey: "BIRTH_CITY", answer: "yaoundé" },
        { questionKey: "FAVORITE_SPORT", answer: "football" },
      ],
    };

    it("appelle POST /auth/forgot-password/verify", async () => {
      const response = { success: true, verified: true };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPasswordVerify(payload);

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/forgot-password/verify",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      expect(result.verified).toBe(true);
    });

    it("propage RECOVERY_INVALID", async () => {
      const error = { code: "RECOVERY_INVALID", statusCode: 400 };
      mockApiFetch.mockRejectedValueOnce(error);

      await expect(recoveryApi.forgotPasswordVerify(payload)).rejects.toEqual(
        error,
      );
    });
  });

  describe("forgotPasswordComplete", () => {
    it("appelle POST /auth/forgot-password/complete", async () => {
      const response = { success: true };
      mockApiFetch.mockResolvedValueOnce(response);

      const result = await recoveryApi.forgotPasswordComplete({
        token: "a".repeat(48),
        newPassword: "NewPass1",
      });

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/auth/forgot-password/complete",
        {
          method: "POST",
          body: JSON.stringify({
            token: "a".repeat(48),
            newPassword: "NewPass1",
          }),
        },
      );
      expect(result.success).toBe(true);
    });

    it("propage SAME_PASSWORD", async () => {
      const error = { code: "SAME_PASSWORD", statusCode: 400 };
      mockApiFetch.mockRejectedValueOnce(error);

      await expect(
        recoveryApi.forgotPasswordComplete({
          token: "a".repeat(48),
          newPassword: "OldPass1",
        }),
      ).rejects.toEqual(error);
    });
  });
});
