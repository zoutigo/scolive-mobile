import { apiFetch, tokenStorage } from "./client";
import { Platform } from "react-native";
import type { AuthUser, LoginResponse, SsoProvider } from "../types/auth.types";
import type {
  OnboardingCompletePayload,
  OnboardingOptionsResponse,
} from "../types/onboarding.types";

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

  meGlobal(): Promise<AuthUser> {
    return apiFetch(`/me`, {}, true);
  },

  registerPushToken(
    schoolSlug: string,
    payload: {
      token: string;
      platform: "IOS" | "ANDROID" | "UNKNOWN";
      deviceId?: string;
      deviceName?: string;
      appVersion?: string;
      projectId?: string;
    },
  ) {
    return apiFetch(
      `/schools/${schoolSlug}/me/push-tokens`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  unregisterPushToken(schoolSlug: string, token: string) {
    return apiFetch(
      `/schools/${schoolSlug}/me/push-tokens`,
      {
        method: "DELETE",
        body: JSON.stringify({ token }),
      },
      true,
    );
  },

  getOnboardingOptions(input: {
    email?: string;
    setupToken?: string;
  }): Promise<OnboardingOptionsResponse> {
    const query = new URLSearchParams();
    if (input.email?.trim()) {
      query.set("email", input.email.trim());
    }
    if (input.setupToken?.trim()) {
      query.set("setupToken", input.setupToken.trim());
    }
    return apiFetch(`/auth/onboarding/options?${query.toString()}`);
  },

  completeOnboarding(
    payload: OnboardingCompletePayload,
  ): Promise<{ success: boolean; schoolSlug?: string | null }> {
    return apiFetch("/auth/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};

export function mobilePushPlatform(): "IOS" | "ANDROID" | "UNKNOWN" {
  if (Platform.OS === "ios") return "IOS";
  if (Platform.OS === "android") return "ANDROID";
  return "UNKNOWN";
}
