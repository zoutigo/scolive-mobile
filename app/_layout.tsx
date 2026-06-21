import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";
import { SuccessToastHost } from "../src/components/feedback/SuccessToastHost";
import { configurePushNotifications } from "../src/notifications/push-registration";
import { useAppVersionCheck } from "../src/hooks/useAppVersionCheck";
import { AppUpdateModal } from "../src/components/AppUpdateModal";
import { AppInstallGuideModal } from "../src/components/AppInstallGuideModal";
import { useTranslation } from "../src/i18n/useTranslation";
import { colors } from "../src/theme";

export default function RootLayout() {
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const didInitializeRef = useRef(false);
  const { t } = useTranslation();

  const {
    status,
    updateAvailable,
    mandatory,
    currentVersionName,
    latestVersionName,
    downloadUrl,
    dismiss,
    retry,
  } = useAppVersionCheck();

  useEffect(() => {
    if (didInitializeRef.current) {
      return;
    }
    didInitializeRef.current = true;
    configurePushNotifications();
    void useAuthStore.getState().initialize();
  }, []);

  const handleDownload = useCallback(() => {
    void Linking.openURL(downloadUrl);
    setShowInstallGuide(true);
  }, [downloadUrl]);

  const handleCloseInstallGuide = useCallback(() => {
    setShowInstallGuide(false);
  }, []);

  // Tant que la vérification de version n'a pas réussi, aucun écran interactif
  // (login compris) n'est monté : ça élimine la course entre le check réseau
  // et un login que l'utilisateur pourrait déclencher avant que le check ne réponde.
  if (status === "checking") {
    return (
      <View style={styles.gateScreen} testID="startup-checking">
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.gateText}>{t("startup.checking")}</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.gateScreen} testID="startup-error">
        <Text style={styles.gateTitle}>{t("startup.error.title")}</Text>
        <Text style={styles.gateText}>{t("startup.error.message")}</Text>
        <Text
          style={styles.gateRetry}
          onPress={retry}
          testID="startup-error-retry"
          accessibilityRole="button"
        >
          {t("startup.error.retry")}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="login"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="(home)" />
        <Stack.Screen
          name="recovery/pin"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="recovery/password"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="recovery/username"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
      <SuccessToastHost />
      <AppUpdateModal
        visible={updateAvailable}
        mandatory={mandatory}
        currentVersionName={currentVersionName}
        latestVersionName={latestVersionName}
        onDismiss={dismiss}
        onDownload={handleDownload}
      />
      <AppInstallGuideModal
        visible={showInstallGuide}
        mandatory={mandatory}
        onClose={handleCloseInstallGuide}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gateScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  gateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  gateRetry: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
    overflow: "hidden",
  },
});
