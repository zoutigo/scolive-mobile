import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../src/theme";

export default function HomeLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loader} testID="home-layout-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="placeholder"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="messages"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="account"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen name="feed" options={{ animation: "slide_from_right" }} />
      <Stack.Screen
        name="agenda/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="timetable/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="timetable/class/[classId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="timetable/child/[childId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="notes/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="notes/class/[classId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="notes/child/[childId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="children/[childId]/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="children/[childId]/vie-de-classe"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="classes/[classId]/feed"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="classes/[classId]/notes"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="classes/[classId]/discipline"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="classes/[classId]/timetable"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="classes/[classId]/homework"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="admin-classes/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="admin-classes/[classId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tickets/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tickets/create"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tickets/[ticketId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tests/index"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tests/[campaignId]"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="tests/cases/[testCaseId]"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
