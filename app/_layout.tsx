import { useEffect, useState } from "react";
import { Linking } from "react-native";
import { Stack } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";
import { SuccessToastHost } from "../src/components/feedback/SuccessToastHost";
import { configurePushNotifications } from "../src/notifications/push-registration";
import { useAppVersionCheck } from "../src/hooks/useAppVersionCheck";
import { AppUpdateModal } from "../src/components/AppUpdateModal";
import { AppInstallGuideModal } from "../src/components/AppInstallGuideModal";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const {
    updateAvailable,
    currentVersionName,
    latestVersionName,
    downloadUrl,
    dismiss,
  } = useAppVersionCheck();

  useEffect(() => {
    configurePushNotifications();
    initialize();
  }, [initialize]);

  function handleDownload() {
    void Linking.openURL(downloadUrl);
    setShowInstallGuide(true);
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
      </Stack>
      <SuccessToastHost />
      <AppUpdateModal
        visible={updateAvailable}
        currentVersionName={currentVersionName}
        latestVersionName={latestVersionName}
        onDismiss={dismiss}
        onDownload={handleDownload}
      />
      <AppInstallGuideModal
        visible={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />
    </>
  );
}
