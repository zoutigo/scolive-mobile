import { Stack } from "expo-router";

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[messageId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="compose"
        options={{ animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}
