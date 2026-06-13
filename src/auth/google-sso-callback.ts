import type { ApiClientError } from "../api/client";
import { DEFAULT_LOCALE } from "../i18n/translations";
import { translate, type TranslateFn } from "../i18n/useTranslation";

function normalizeParam(value?: string | string[] | null) {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed ? trimmed : undefined;
}

export type GoogleSsoCallbackPayload = {
  providerAccountId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export function parseApiError(
  err: unknown,
  t: TranslateFn = (key) => translate(DEFAULT_LOCALE, key),
): string {
  const apiErr = err as ApiClientError;
  const code = apiErr?.code;
  const statusCode = apiErr?.statusCode;
  switch (code) {
    case "INVALID_CREDENTIALS":
      return t("apiErrors.invalidCredentials");
    case "AUTH_RATE_LIMITED":
      return t("apiErrors.rateLimited");
    case "ACCOUNT_VALIDATION_REQUIRED":
      return t("apiErrors.accountValidationRequired");
    case "ACCOUNT_SUSPENDED":
      return t("apiErrors.accountSuspended");
    case "PASSWORD_CHANGE_REQUIRED":
      return t("apiErrors.passwordChangeRequired");
    case "PROFILE_SETUP_REQUIRED":
      return t("apiErrors.profileSetupRequired");
    case "SSO_PROFILE_COMPLETION_REQUIRED":
      return t("apiErrors.ssoProfileCompletionRequired");
    case "PLATFORM_CREDENTIAL_SETUP_REQUIRED":
      return t("apiErrors.platformCredentialSetupRequired");
    case "ACCOUNT_NOT_PROVISIONED":
      return t("apiErrors.accountNotProvisioned");
    case "INVALID_SCHOOL_ACCOUNT":
      return t("apiErrors.invalidSchoolAccount");
    default:
      if (statusCode === 401) {
        return t("apiErrors.invalidCredentials");
      }
      return t("apiErrors.generic");
  }
}

export function parseGoogleSsoCallbackParams(
  params: Record<string, unknown>,
  t: TranslateFn = (key) => translate(DEFAULT_LOCALE, key),
): {
  payload?: GoogleSsoCallbackPayload;
  error?: string;
} {
  const error = normalizeParam(params.error as string | string[] | null);
  const message = normalizeParam(params.message as string | string[] | null);

  if (error) {
    return { error: message || t("apiErrors.googleInterrupted") };
  }

  const providerAccountId = normalizeParam(
    params.providerAccountId as string | string[] | null,
  );
  const email = normalizeParam(params.email as string | string[] | null);

  if (!providerAccountId || !email) {
    return {
      error: t("apiErrors.googleMissingInfo"),
    };
  }

  return {
    payload: {
      providerAccountId,
      email: email.toLowerCase(),
      firstName: normalizeParam(params.firstName as string | string[] | null),
      lastName: normalizeParam(params.lastName as string | string[] | null),
      avatarUrl: normalizeParam(params.avatarUrl as string | string[] | null),
    },
  };
}
