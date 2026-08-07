import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { useSelfStudentContext } from "../../../src/hooks/useSelfStudentContext";
import { buildTeacherClassHomeworkTarget } from "../../../src/components/navigation/nav-config";
import { colors } from "../../../src/theme";

/**
 * Redirige l'élève connecté vers l'écran Devoirs de sa propre classe
 * (`/(home)/classes/[classId]/homework`), déjà générique par classId et déjà
 * self-capable pour le rôle STUDENT (résolution implicite côté API) — pas de
 * duplication d'écran, juste la résolution de la classe courante ici.
 */
export default function HomeworkMeRoute() {
  return (
    <AppShell showHeader={false}>
      <HomeworkMeRedirect />
    </AppShell>
  );
}

function HomeworkMeRedirect() {
  const router = useRouter();
  const { classId, isLoading } = useSelfStudentContext();

  useEffect(() => {
    if (!classId) return;
    router.replace(buildTeacherClassHomeworkTarget(classId) as never);
  }, [classId, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
      testID="homework-me-loading"
    >
      {isLoading || !classId ? (
        <ActivityIndicator color={colors.primary} />
      ) : null}
    </View>
  );
}
