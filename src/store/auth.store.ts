import { create } from "zustand";
import { authApi } from "../api/auth.api";
import { tokenStorage } from "../api/client";
import type { AuthUser, LoginResponse } from "../types/auth.types";

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
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!accessToken && !refreshToken) {
        set({ isLoading: false });
        return;
      }

      if (accessToken) {
        set({ accessToken, isAuthenticated: true, isLoading: false });
        return;
      }

      // Access token absent but refresh token present → try silent refresh
      try {
        const response = await authApi.refresh(refreshToken!);
        await tokenStorage.setTokens(
          response.accessToken,
          response.refreshToken,
          response.refreshExpiresIn,
        );
        set({
          accessToken: response.accessToken,
          schoolSlug: response.schoolSlug,
          isAuthenticated: true,
          isLoading: false,
        });
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
    set({
      accessToken: response.accessToken,
      schoolSlug: response.schoolSlug,
      isAuthenticated: true,
    });
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
