import { apiFetch, tokenStorage } from "./client";
import type { AuthUser, LoginResponse, SsoProvider } from "../types/auth.types";

export const authApi = {
  loginEmail(email: string, password: string): Promise<LoginResponse> {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  loginPhone(
    phone: string,
    pin: string,
    schoolSlug?: string,
  ): Promise<LoginResponse> {
    return apiFetch("/auth/login-phone", {
      method: "POST",
      body: JSON.stringify({
        phone,
        pin,
        ...(schoolSlug ? { schoolSlug } : {}),
      }),
    });
  },

  loginSso(
    provider: SsoProvider,
    providerAccountId: string,
    email: string,
    extra?: { firstName?: string; lastName?: string; avatarUrl?: string },
  ): Promise<LoginResponse> {
    return apiFetch("/auth/sso/login", {
      method: "POST",
      body: JSON.stringify({ provider, providerAccountId, email, ...extra }),
    });
  },

  refresh(refreshToken: string): Promise<LoginResponse> {
    return apiFetch("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  async logout(): Promise<void> {
    const refreshToken = await tokenStorage.getRefreshToken();
    await apiFetch(
      "/auth/logout",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      true,
    ).catch(() => {});
    await tokenStorage.clear();
  },

  me(schoolSlug: string): Promise<AuthUser> {
    return apiFetch(`/schools/${schoolSlug}/auth/me`, {}, true);
  },
};
