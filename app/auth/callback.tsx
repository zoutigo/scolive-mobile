import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { authApi } from "../../src/api/auth.api";
import type { ApiClientError } from "../../src/api/client";
import {
  parseApiError,
  parseGoogleSsoCallbackParams,
} from "../../src/auth/google-sso-callback";
import { useAuthStore } from "../../src/store/auth.store";

function routeToOnboarding(err: ApiClientError, fallbackEmail?: string) {
  const email = err.email ?? fallbackEmail ?? undefined;
  router.replace({
    pathname: "/onboarding",
    params: {
      ...(email ? { email } : {}),
      ...(err.schoolSlug ? { schoolSlug: err.schoolSlug } : {}),
      ...(err.setupToken ? { setupToken: err.setupToken } : {}),
    },
  });
}

export default function GoogleAuthCallbackScreen() {
  const params = useLocalSearchParams();
  const handleLoginResponse = useAuthStore((s) => s.handleLoginResponse);
  const [message, setMessage] = useState("Connexion Google en cours...");
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    const parsed = parseGoogleSsoCallbackParams(params);

    if (parsed.error) {
      setMessage(parsed.error);
      router.replace({
        pathname: "/login",
        params: { tab: "google", error: parsed.error },
      });
      return;
    }

    if (!parsed.payload) {
      router.replace({
        pathname: "/login",
        params: {
          tab: "google",
          error: "Connexion Google interrompue.",
        },
      });
      return;
    }

    async function complete() {
      try {
        const response = await authApi.loginSso(
          "GOOGLE",
          parsed.payload!.providerAccountId,
          parsed.payload!.email,
          {
            firstName: parsed.payload!.firstName,
            lastName: parsed.payload!.lastName,
            avatarUrl: parsed.payload!.avatarUrl,
          },
        );
        await handleLoginResponse(response);
        router.replace("/");
      } catch (err) {
        const apiErr = err as ApiClientError;
        if (
          apiErr?.code === "PLATFORM_CREDENTIAL_SETUP_REQUIRED" &&
          apiErr.setupToken
        ) {
          routeToOnboarding(apiErr, apiErr.email ?? parsed.payload!.email);
          return;
        }

        router.replace({
          pathname: "/login",
          params: {
            tab: "google",
            error: parseApiError(apiErr),
          },
        });
      }
    }

    void complete();
  }, [handleLoginResponse, params]);

  return (
    <View style={styles.container} testID="google-auth-callback">
      <ActivityIndicator size="large" color="#0C5FA8" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFCF8",
    paddingHorizontal: 24,
    gap: 16,
  },
  text: {
    color: "#08467D",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
