import { create } from "zustand";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../api/client";
import type { AuthUser, LoginResponse } from "../types/auth.types";

const STORAGE_TIMEOUT_MS = 1500;
const REFRESH_TIMEOUT_MS = 5000;

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

  initialize: () => Promise<void>;
  handleLoginResponse: (response: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  schoolSlug: null,
  isLoading: true,
  isAuthenticated: false,

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
        set({ isLoading: false });
        return;
      }

      if (accessToken) {
        set({
          accessToken,
          schoolSlug,
          isAuthenticated: true,
          isLoading: false,
        });
        if (schoolSlug) {
          authApi
            .me(schoolSlug)
            .then((user) => set({ user }))
            .catch(() => {});
        }
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
        });
        if (response.schoolSlug) {
          authApi
            .me(response.schoolSlug)
            .then((user) => set({ user }))
            .catch(() => {});
        }
      } catch {
        await tokenStorage.clear();
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
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
    });
    if (response.schoolSlug) {
      try {
        const user = await authApi.me(response.schoolSlug);
        set({ user });
      } catch {
        // user stays null; will retry on next initialize
      }
    }
  },

  logout: async () => {
    await authApi.logout().catch(() => {});
    set({
      user: null,
      accessToken: null,
      schoolSlug: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: AuthUser) => set({ user }),
}));
