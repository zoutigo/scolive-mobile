import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as WebBrowser from "expo-web-browser";

const DEFAULT_DEV_WEB_URL = "http://localhost:3000";
const DEFAULT_PROD_WEB_URL = "https://scolive.lisaweb.fr";
export const MOBILE_REDIRECT_URI = "scolive://auth/callback";

export class GoogleAuthError extends Error {
  constructor(
    public readonly code:
      | "GOOGLE_AUTH_NOT_CONFIGURED"
      | "GOOGLE_AUTH_NATIVE_BUILD_REQUIRED"
      | "GOOGLE_AUTH_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

function isExpoGoRuntime() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function getWebBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (configured) {
    return configured;
  }

  const isDevRuntime = typeof __DEV__ !== "undefined" ? __DEV__ : false;
  return isDevRuntime ? DEFAULT_DEV_WEB_URL : DEFAULT_PROD_WEB_URL;
}

function normalizeWebBaseUrlForRuntime(webBaseUrl: string) {
  try {
    const url = new URL(webBaseUrl);
    return url.toString().replace(/\/$/, "");
  } catch {
    return webBaseUrl;
  }
}

export function buildGoogleSsoStartUrl() {
  const webBaseUrl = normalizeWebBaseUrlForRuntime(getWebBaseUrl());

  if (!webBaseUrl) {
    throw new GoogleAuthError(
      "GOOGLE_AUTH_NOT_CONFIGURED",
      "La configuration SSO Google mobile est incomplète.",
    );
  }

  const url = new URL("/auth/mobile-sso-start", webBaseUrl);
  url.searchParams.set("redirectUri", MOBILE_REDIRECT_URI);
  url.searchParams.set("webBaseUrl", webBaseUrl);
  return url.toString();
}

export async function signInWithGoogleAsync(): Promise<void> {
  if (isExpoGoRuntime()) {
    throw new GoogleAuthError(
      "GOOGLE_AUTH_NATIVE_BUILD_REQUIRED",
      "La connexion Google nécessite l'application Android native. Lancez `npm run android:build` puis réessayez.",
    );
  }

  const startUrl = buildGoogleSsoStartUrl();

  try {
    if (Platform.OS === "android") {
      await WebBrowser.warmUpAsync();
    }

    const result = await WebBrowser.openAuthSessionAsync(
      startUrl,
      MOBILE_REDIRECT_URI,
    );

    if (
      result.type === "opened" ||
      result.type === "success" ||
      result.type === "cancel" ||
      result.type === "dismiss"
    ) {
      return;
    }
  } catch {
    throw new GoogleAuthError(
      "GOOGLE_AUTH_FAILED",
      "Impossible d'ouvrir la connexion Google.",
    );
  } finally {
    if (Platform.OS === "android") {
      void WebBrowser.coolDownAsync();
    }
  }
}
