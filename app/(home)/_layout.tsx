import { Stack } from "expo-router";
import { useAuthStore } from "../../src/store/auth.store";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../src/theme";

export default function HomeLayout() {
  const { isLoading } = useAuthStore();
  // Pas de navigation ici : `useAuthStore.logout()` et `.invalidateSession()`
  // déclenchent eux-mêmes, une seule fois et de façon imperative,
  // `router.replace("/")` (voir src/store/auth.store.ts#redirectToRoot).
  // Avoir un second acteur réactif ici (ex. un useEffect sur
  // isAuthenticated) recréait une course avec app/index.tsx sur le même
  // changement d'état — historique d'écrans blancs figés au logout depuis
  // un écran imbriqué (/account, /classes/[id]/discipline, ...).
  //
  // Pas d'overlay "!isAuthenticated" ici non plus : ce Stack partage la
  // route "index" avec app/index.tsx (segments de groupe invisibles dans
  // l'URL — cf. app/(home)/index.tsx), donc `router.replace("/")` appelé
  // depuis un écran imbriqué peut très bien atterrir ici plutôt qu'à la
  // racine. Un overlay opaque masquerait alors le repli LoginScreen que
  // app/(home)/index.tsx affiche désormais lui-même dans ce cas.

  if (isLoading) {
    return (
      <View style={styles.loader} testID="home-layout-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
  );
}

const styles = StyleSheet.create({
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
