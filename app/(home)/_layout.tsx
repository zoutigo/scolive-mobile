import { Stack } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../src/theme";

export default function HomeLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  // Pas de navigation ici : `useAuthStore.logout()` et `.invalidateSession()`
  // déclenchent eux-mêmes, une seule fois et de façon imperative,
  // `router.replace("/")` (voir src/store/auth.store.ts#redirectToRoot).
  // Avoir un second acteur réactif ici (ex. un useEffect sur
  // isAuthenticated) recréait une course avec app/index.tsx sur le même
  // changement d'état — historique d'écrans blancs figés au logout depuis
  // un écran imbriqué (/account, /classes/[id]/discipline, ...). Cet écran
  // ne fait plus qu'afficher un overlay pendant la fraction de seconde où
  // isAuthenticated est déjà false mais où la redirection n'a pas encore
  // démonté ce Stack.

  if (isLoading) {
    return (
      <View style={styles.loader} testID="home-layout-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Le Stack reste monté pendant la redirection (overlay par-dessus) plutôt
  // que d'être démonté immédiatement : ça évite un flash sur l'écran
  // imbriqué encore visible le temps que `router.replace("/")` prenne effet.
  return (
    <View style={styles.flexFill}>
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
          name="agenda/slot-create"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="agenda/slot-edit"
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
          name="admin-classes/[classId]/index"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="salles/index"
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
          name="tests/cases/[testCaseId]/index"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="tests/cases/[testCaseId]/submit"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
      {!isAuthenticated && (
        <View style={styles.loader} testID="home-layout-redirecting" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
