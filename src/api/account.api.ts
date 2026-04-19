import { apiFetch } from "./client";
import type {
  AccountProfileResponse,
  AccountRecoveryOptionsResponse,
  ChangePasswordPayload,
  ChangePinPayload,
  UpdateAccountProfilePayload,
  UpdateAccountRecoveryPayload,
} from "../types/account.types";

export const accountApi = {
  getMe(): Promise<AccountProfileResponse> {
    return apiFetch("/me", {}, true);
  },

  updateProfile(
    payload: UpdateAccountProfilePayload,
  ): Promise<AccountProfileResponse> {
    return apiFetch(
      "/me/profile",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  changePassword(payload: ChangePasswordPayload): Promise<void> {
    return apiFetch(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  changePin(payload: ChangePinPayload): Promise<void> {
    return apiFetch(
      "/auth/change-pin",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  getRecoveryOptions(): Promise<AccountRecoveryOptionsResponse> {
    return apiFetch("/auth/recovery/options", {}, true);
  },

  updateRecovery(payload: UpdateAccountRecoveryPayload): Promise<void> {
    return apiFetch(
      "/auth/recovery/update",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },
};
