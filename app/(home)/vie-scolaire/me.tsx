import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { StudentLifeScreen } from "../../../src/components/discipline/StudentLifeScreen";
import { useSelfStudentContext } from "../../../src/hooks/useSelfStudentContext";
import { colors } from "../../../src/theme";

export default function VieScolaireMeRoute() {
  return (
    <AppShell showHeader={false}>
      <VieScolaireMeScreen />
    </AppShell>
  );
}

function VieScolaireMeScreen() {
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
        testID="vie-scolaire-me-loading"
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <StudentLifeScreen
      studentId={studentId}
      studentLabel={`${firstName} ${lastName}`}
      onBack={() => router.push("/")}
    />
  );
}
