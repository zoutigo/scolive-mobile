import { useRouter, Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { useAuthStore } from "../../src/store/auth.store";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../src/theme";

export default function HomeLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  // `router.replace` déclenché une seule fois par transition : le rendre à
  // chaque re-render (ex. via <Redirect>) entre en conflit avec le swap
  // HomeScreen/LoginScreen de app/index.tsx sur le même changement de
  // isAuthenticated (ex. logout depuis un écran imbriqué comme /account) et
  // provoque un "Maximum update depth exceeded" qui gèle l'app en écran blanc.
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      hasRedirectedRef.current = false;
      return;
    }
    if (isLoading || hasRedirectedRef.current) {
      return;
    }
    hasRedirectedRef.current = true;
    // `dismissAll` dépile jusqu'à l'écran "/" déjà existant dans la pile
    // plutôt que d'en empiler un second (ce que fait `replace`) : avec deux
    // instances de l'écran "/" actives, chacune réagissant au même
    // isAuthenticated, React Navigation entre en boucle de réconciliation.
    router.dismissAll();
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loader} testID="home-layout-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Le Stack reste monté pendant la redirection (overlay par-dessus) : le
  // démonter avant que l'effet ci-dessus déclenche `router.dismissAll()`
  // (action POP_TO_TOP) laisse cette action sans navigateur pour la
  // recevoir, d'où l'avertissement "POP_TO_TOP was not handled by any
  // navigator" observé en dev.
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
