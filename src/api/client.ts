import * as SecureStore from "expo-secure-store";
import { notifySessionExpired } from "../auth/session-events";

const ACCESS_TOKEN_KEY = "scolive_access_token";
const REFRESH_TOKEN_KEY = "scolive_refresh_token";
const REFRESH_EXPIRES_KEY = "scolive_refresh_expires_at";
const SCHOOL_SLUG_KEY = "scolive_school_slug";

// Android emulator → host machine ; iOS simulator → localhost
const DEFAULT_DEV_BASE_URL = "http://10.0.2.2:3001/api";
const DEFAULT_PROD_BASE_URL = "https://scolive.lisaweb.fr/api";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? DEFAULT_DEV_BASE_URL : DEFAULT_PROD_BASE_URL);

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async getSchoolSlug(): Promise<string | null> {
    return SecureStore.getItemAsync(SCHOOL_SLUG_KEY);
  },

  async setSchoolSlug(slug: string): Promise<void> {
    await SecureStore.setItemAsync(SCHOOL_SLUG_KEY, slug);
  },

  async setTokens(
    accessToken: string,
    refreshToken: string,
    refreshExpiresIn: number,
  ): Promise<void> {
    const expiresAt = Date.now() + refreshExpiresIn * 1000;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(REFRESH_EXPIRES_KEY, String(expiresAt)),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_EXPIRES_KEY),
      SecureStore.deleteItemAsync(SCHOOL_SLUG_KEY),
    ]);
  },
};

let unauthorizedHandlingPromise: Promise<void> | null = null;

async function handleUnauthorized(message: string) {
  if (!unauthorizedHandlingPromise) {
    unauthorizedHandlingPromise = notifySessionExpired({
      message:
        message.trim() || "Votre session a expiré. Veuillez vous reconnecter.",
      statusCode: 401,
    }).finally(() => {
      unauthorizedHandlingPromise = null;
    });
  }

  await unauthorizedHandlingPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (withAuth) {
    const token = await tokenStorage.getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      typeof body?.message === "string"
        ? body.message
        : response.status === 401
          ? "Votre session a expiré. Veuillez vous reconnecter."
          : "Request failed";

    if (withAuth && response.status === 401) {
      await handleUnauthorized(message);
    }

    const err = new Error(message) as ApiClientError;
    err.code = body?.code;
    err.statusCode = response.status;
    err.email = body?.email ?? null;
    err.schoolSlug = body?.schoolSlug ?? null;
    err.setupToken = body?.setupToken ?? null;
    throw err;
  }

  if (response.status === 204) return undefined as unknown as T;
  return response.json();
}

export interface ApiClientError extends Error {
  code?: string;
  statusCode?: number;
  email?: string | null;
  schoolSlug?: string | null;
  setupToken?: string | null;
}
