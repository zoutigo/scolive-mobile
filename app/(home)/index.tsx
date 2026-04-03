import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuthStore } from "../../src/store/auth.store";
import { getViewType } from "../../src/components/navigation/nav-config";
import { AppShell } from "../../src/components/navigation/AppShell";
import { PlatformHome } from "../../src/components/home/PlatformHome";
import { SchoolHome } from "../../src/components/home/SchoolHome";
import { TeacherHome } from "../../src/components/home/TeacherHome";
import { ParentHome } from "../../src/components/home/ParentHome";
import { StudentHome } from "../../src/components/home/StudentHome";
import { colors } from "../../src/theme";

export default function HomeScreen() {
  const { user, schoolSlug } = useAuthStore();

  if (!user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const view = getViewType(user);

  const content = (() => {
    switch (view) {
      case "platform":
        return <PlatformHome user={user} />;
      case "school":
        return <SchoolHome user={user} schoolSlug={schoolSlug} />;
      case "teacher":
        return <TeacherHome user={user} schoolSlug={schoolSlug} />;
      case "parent":
        return <ParentHome user={user} schoolSlug={schoolSlug} />;
      case "student":
        return <StudentHome user={user} schoolSlug={schoolSlug} />;
      default:
        return (
          <View style={styles.fallback}>
            <Text style={styles.fallbackText}>
              Bienvenue, {user.firstName} {user.lastName}
            </Text>
          </View>
        );
    }
  })();

  return <AppShell>{content}</AppShell>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
});
