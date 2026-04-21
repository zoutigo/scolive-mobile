import { apiFetch } from "./client";
import type {
  AccountProfileResponse,
  AccountRecoveryOptionsResponse,
  AddEmailPayload,
  AddPhoneCredentialPayload,
  ChangePasswordPayload,
  ChangePinPayload,
  CreatePasswordPayload,
  SetActiveRolePayload,
  SetActiveRoleResponse,
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

  setActiveRole(payload: SetActiveRolePayload): Promise<SetActiveRoleResponse> {
    return apiFetch(
      "/me/active-role",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  addEmail(
    payload: AddEmailPayload,
  ): Promise<{ success: boolean; message: string }> {
    return apiFetch(
      "/auth/add-email",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  createPassword(
    payload: CreatePasswordPayload,
  ): Promise<{ success: boolean }> {
    return apiFetch(
      "/auth/create-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  addPhoneCredential(
    payload: AddPhoneCredentialPayload,
  ): Promise<{ success: boolean }> {
    return apiFetch(
      "/auth/add-phone-credential",
      {
        method: "POST",
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
