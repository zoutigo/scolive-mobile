import { create } from "zustand";
import { registerSessionExpiredHandler } from "../auth/session-events";
import { accountApi } from "../api/account.api";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../api/client";
import {
  syncPushRegistration,
  unregisterPushRegistration,
} from "../notifications/push-registration";
import { useLocaleStore } from "./locale.store";
import type { AuthUser, LoginResponse } from "../types/auth.types";

const STORAGE_TIMEOUT_MS = 1500;
const REFRESH_TIMEOUT_MS = 5000;

// Account preference wins over the device locale, per user request.
function applyAccountLocale(user: AuthUser | null | undefined): void {
  if (!user?.preferredLocale) return;
  useLocaleStore
    .getState()
    .setLocale(user.preferredLocale === "EN" ? "en" : "fr");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  schoolSlug: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authErrorMessage: string | null;

  initialize: () => Promise<void>;
  handleLoginResponse: (response: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  invalidateSession: (message?: string) => Promise<void>;
  clearAuthError: () => void;
  setUser: (user: AuthUser) => void;
  switchActiveSchool: (schoolId: string) => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  schoolSlug: null,
  isLoading: true,
  isAuthenticated: false,
  authErrorMessage: null,

  initialize: async () => {
    try {
      const [accessToken, refreshToken, schoolSlug] = await Promise.all([
        withTimeout(
          tokenStorage.getAccessToken().catch(() => null),
          STORAGE_TIMEOUT_MS,
        ).catch(() => null),
        withTimeout(
          tokenStorage.getRefreshToken().catch(() => null),
          STORAGE_TIMEOUT_MS,
        ).catch(() => null),
        withTimeout(
          tokenStorage.getSchoolSlug().catch(() => null),
          STORAGE_TIMEOUT_MS,
        ).catch(() => null),
      ]);

      if (!accessToken && !refreshToken) {
        set({ isLoading: false, authErrorMessage: null });
        return;
      }

      if (accessToken) {
        set({
          accessToken,
          schoolSlug,
          isAuthenticated: true,
          isLoading: false,
          authErrorMessage: null,
        });
        if (schoolSlug) {
          void syncPushRegistration(schoolSlug).catch((error) =>
            console.warn("[push] syncPushRegistration failed", error),
          );
        }
        const fetchUser = schoolSlug
          ? authApi.me(schoolSlug)
          : authApi.meGlobal();
        fetchUser
          .then((user) => {
            set({ user });
            applyAccountLocale(user);
          })
          .catch(() => {});
        return;
      }

      // Access token absent but refresh token present → try silent refresh
      try {
        const response = await withTimeout(
          authApi.refresh(refreshToken!),
          REFRESH_TIMEOUT_MS,
        );
        await tokenStorage.setTokens(
          response.accessToken,
          response.refreshToken,
          response.refreshExpiresIn,
        );
        if (response.schoolSlug) {
          await tokenStorage.setSchoolSlug(response.schoolSlug);
        }
        set({
          accessToken: response.accessToken,
          schoolSlug: response.schoolSlug,
          isAuthenticated: true,
          isLoading: false,
          authErrorMessage: null,
        });
        if (response.schoolSlug) {
          void syncPushRegistration(response.schoolSlug).catch((error) =>
            console.warn("[push] syncPushRegistration failed", error),
          );
        }
        if (response.schoolSlug) {
          authApi
            .me(response.schoolSlug)
            .then((user) => {
              set({ user });
              applyAccountLocale(user);
            })
            .catch(() => {});
        }
      } catch {
        await tokenStorage.clear();
        set({ isLoading: false, authErrorMessage: null });
      }
    } catch {
      set({ isLoading: false, authErrorMessage: null });
    }
  },

  handleLoginResponse: async (response: LoginResponse) => {
    await tokenStorage.setTokens(
      response.accessToken,
      response.refreshToken,
      response.refreshExpiresIn,
    );
    if (response.schoolSlug) {
      await tokenStorage.setSchoolSlug(response.schoolSlug);
    }
    set({
      accessToken: response.accessToken,
      schoolSlug: response.schoolSlug,
      isAuthenticated: true,
      authErrorMessage: null,
    });
    if (response.schoolSlug) {
      void syncPushRegistration(response.schoolSlug).catch((error) =>
        console.warn("[push] syncPushRegistration failed", error),
      );
    }
    try {
      const user = response.schoolSlug
        ? await authApi.me(response.schoolSlug)
        : await authApi.meGlobal();
      set({ user });
      applyAccountLocale(user);
    } catch {
      // user stays null; home screen will handle gracefully
    }
  },

  logout: async () => {
    const currentSchoolSlug = useAuthStore.getState().schoolSlug;
    set({
      user: null,
      accessToken: null,
      schoolSlug: null,
      isAuthenticated: false,
      isLoading: false,
      authErrorMessage: null,
    });
    await unregisterPushRegistration(currentSchoolSlug).catch(() => {});
    await authApi.logout().catch(() => {});
  },

  invalidateSession: async (message?: string) => {
    await tokenStorage.clear().catch(() => {});
    set({
      user: null,
      accessToken: null,
      schoolSlug: null,
      isAuthenticated: false,
      isLoading: false,
      authErrorMessage:
        message?.trim() || "Votre session a expire. Veuillez vous reconnecter.",
    });
  },

  clearAuthError: () => set({ authErrorMessage: null }),

  setUser: (user: AuthUser) => set({ user }),

  switchActiveSchool: async (schoolId: string): Promise<string | null> => {
    const globalProfile = await accountApi.setActiveSchool({ schoolId });
    const nextSchoolSlug = globalProfile.schoolSlug;

    if (!nextSchoolSlug) {
      return null;
    }

    await tokenStorage.setSchoolSlug(nextSchoolSlug);

    const previousSchoolSlug = useAuthStore.getState().schoolSlug;
    set({ schoolSlug: nextSchoolSlug });

    if (previousSchoolSlug && previousSchoolSlug !== nextSchoolSlug) {
      await unregisterPushRegistration(previousSchoolSlug).catch(() => {});
    }
    void syncPushRegistration(nextSchoolSlug).catch((error) =>
      console.warn("[push] syncPushRegistration failed", error),
    );

    const user = await authApi.me(nextSchoolSlug);
    set({ user });
    applyAccountLocale(user);

    return nextSchoolSlug;
  },
}));

registerSessionExpiredHandler(async ({ message }) => {
  await useAuthStore.getState().invalidateSession(message);
});
