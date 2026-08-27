import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { DisciplineSelfScreen } from "../../../src/components/discipline/DisciplineSelfScreen";
import { useSelfStudentContext } from "../../../src/hooks/useSelfStudentContext";
import { colors } from "../../../src/theme";

export default function DisciplineMeRoute() {
  return (
    <AppShell showHeader={false}>
      <DisciplineMeScreen />
    </AppShell>
  );
}

function DisciplineMeScreen() {
  const router = useRouter();
  const { studentId, firstName, lastName, isLoading } = useSelfStudentContext();

  if (isLoading || !studentId) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
        testID="discipline-me-loading"
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <DisciplineSelfScreen
      studentId={studentId}
      studentLabel={`${firstName} ${lastName}`}
      onBack={() => router.push("/")}
      viewerRole="student"
    />
  );
}
