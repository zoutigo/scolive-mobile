import { apiFetch } from "./client";
import type {
  ForgotPinOptionsRequest,
  ForgotPinOptionsResponse,
  ForgotPinVerifyRequest,
  ForgotPinVerifyResponse,
  ForgotPinCompleteRequest,
  ForgotPinCompleteResponse,
  ForgotPasswordRequestRequest,
  ForgotPasswordRequestResponse,
  ForgotPasswordOptionsRequest,
  ForgotPasswordOptionsResponse,
  ForgotPasswordVerifyRequest,
  ForgotPasswordVerifyResponse,
  ForgotPasswordCompleteRequest,
  ForgotPasswordCompleteResponse,
} from "../types/recovery.types";

export const recoveryApi = {
  // ── PIN Recovery ────────────────────────────────────────────────────────────

  forgotPinOptions(
    data: ForgotPinOptionsRequest,
  ): Promise<ForgotPinOptionsResponse> {
    return apiFetch("/auth/forgot-pin/options", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  forgotPinVerify(
    data: ForgotPinVerifyRequest,
  ): Promise<ForgotPinVerifyResponse> {
    return apiFetch("/auth/forgot-pin/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  forgotPinComplete(
    data: ForgotPinCompleteRequest,
  ): Promise<ForgotPinCompleteResponse> {
    return apiFetch("/auth/forgot-pin/complete", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ── Password Recovery ───────────────────────────────────────────────────────

  forgotPasswordRequest(
    data: ForgotPasswordRequestRequest,
  ): Promise<ForgotPasswordRequestResponse> {
    return apiFetch("/auth/forgot-password/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  forgotPasswordOptions(
    data: ForgotPasswordOptionsRequest,
  ): Promise<ForgotPasswordOptionsResponse> {
    return apiFetch("/auth/forgot-password/options", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  forgotPasswordVerify(
    data: ForgotPasswordVerifyRequest,
  ): Promise<ForgotPasswordVerifyResponse> {
    return apiFetch("/auth/forgot-password/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  forgotPasswordComplete(
    data: ForgotPasswordCompleteRequest,
  ): Promise<ForgotPasswordCompleteResponse> {
    return apiFetch("/auth/forgot-password/complete", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
