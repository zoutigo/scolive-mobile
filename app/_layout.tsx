import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";
import { SuccessToastHost } from "../src/components/feedback/SuccessToastHost";
import { configurePushNotifications } from "../src/notifications/push-registration";
import { useAppVersionCheck } from "../src/hooks/useAppVersionCheck";
import { AppUpdateModal } from "../src/components/AppUpdateModal";
import { AppInstallGuideModal } from "../src/components/AppInstallGuideModal";

export default function RootLayout() {
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const didInitializeRef = useRef(false);

  const {
    updateAvailable,
    mandatory,
    currentVersionName,
    latestVersionName,
    downloadUrl,
    dismiss,
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
    if (mandatory) {
      void Linking.openURL("https://scolive.lisaweb.fr");
    } else {
      void Linking.openURL(downloadUrl);
      setShowInstallGuide(true);
    }
  }, [mandatory, downloadUrl]);

  const handleCloseInstallGuide = useCallback(() => {
    setShowInstallGuide(false);
  }, []);

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
        onClose={handleCloseInstallGuide}
      />
    </>
  );
}
