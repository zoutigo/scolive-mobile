import { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "../src/store/auth.store";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" options={{ animation: "slide_from_right" }} />
      <Stack.Screen
        name="onboarding"
        options={{ animation: "slide_from_right" }}
      />
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
  );
}
