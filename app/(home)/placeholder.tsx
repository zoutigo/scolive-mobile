import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppShell } from "../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { colors } from "../../src/theme";

export default function PlaceholderScreen() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const label = title ?? "Module";

  return (
    <AppShell showHeader={false}>
      <ModuleHeader
        title={label}
        onBack={() => router.back()}
        testID="placeholder-header"
        backTestID="placeholder-back-btn"
        topInset={insets.top}
      />
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="construct-outline"
              size={48}
              color={colors.warmAccent}
            />
          </View>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.subtitle}>Module en cours de développement</Text>
          <Text style={styles.body}>
            Cette fonctionnalité sera disponible prochainement.
          </Text>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.warmAccent,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
});
