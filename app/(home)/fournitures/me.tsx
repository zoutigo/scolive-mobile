import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { SupplyListScreen } from "../../../src/components/supply-lists/SupplyListScreen";
import { useSelfStudentContext } from "../../../src/hooks/useSelfStudentContext";
import { colors } from "../../../src/theme";

export default function SupplyListMeRoute() {
  return (
    <AppShell showHeader={false}>
      <SupplyListMeScreen />
    </AppShell>
  );
}

function SupplyListMeScreen() {
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
        testID="supply-list-me-loading"
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SupplyListScreen
      studentId={studentId}
      studentLabel={`${firstName} ${lastName}`}
      viewerRole="student"
      onBack={() => router.push("/")}
    />
  );
}
