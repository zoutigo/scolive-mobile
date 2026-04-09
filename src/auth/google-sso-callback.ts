import type { ApiClientError } from "../api/client";

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

export function parseApiError(err: unknown): string {
  const apiErr = err as ApiClientError;
  const code = apiErr?.code;
  const statusCode = apiErr?.statusCode;
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Identifiants incorrects. Vérifiez vos informations.";
    case "AUTH_RATE_LIMITED":
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    case "ACCOUNT_VALIDATION_REQUIRED":
      return "Votre compte est en attente d'activation.";
    case "ACCOUNT_SUSPENDED":
      return "Votre compte a été suspendu. Contactez votre administration.";
    case "PASSWORD_CHANGE_REQUIRED":
      return "Vous devez modifier votre mot de passe.";
    case "PROFILE_SETUP_REQUIRED":
      return "Votre profil est incomplet.";
    case "SSO_PROFILE_COMPLETION_REQUIRED":
      return "Votre compte Google est reconnu, mais certaines informations de profil manquent encore. Finalisez votre profil sur le web ou contactez l'administration.";
    case "PLATFORM_CREDENTIAL_SETUP_REQUIRED":
      return "Votre compte doit encore finaliser ses identifiants de plateforme.";
    case "ACCOUNT_NOT_PROVISIONED":
      return "Ce compte Google n'est pas encore autorisé par votre établissement.";
    case "INVALID_SCHOOL_ACCOUNT":
      return "Ce compte Google n'est pas rattaché à cette école.";
    default:
      if (statusCode === 401) {
        return "Identifiants incorrects. Vérifiez vos informations.";
      }
      return "Impossible de se connecter. Vérifiez votre connexion.";
  }
}

export function parseGoogleSsoCallbackParams(params: Record<string, unknown>): {
  payload?: GoogleSsoCallbackPayload;
  error?: string;
} {
  const error = normalizeParam(params.error as string | string[] | null);
  const message = normalizeParam(params.message as string | string[] | null);

  if (error) {
    return { error: message || "Connexion Google interrompue." };
  }

  const providerAccountId = normalizeParam(
    params.providerAccountId as string | string[] | null,
  );
  const email = normalizeParam(params.email as string | string[] | null);

  if (!providerAccountId || !email) {
    return {
      error: "Le compte Google ne fournit pas les informations requises.",
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
