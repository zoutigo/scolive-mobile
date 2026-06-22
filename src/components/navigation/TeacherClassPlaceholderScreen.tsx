import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModuleHeader } from "./ModuleHeader";
import { colors } from "../../theme";

type Props = {
  moduleTitle: string;
  moduleDescription: string;
  availabilityLabel?: string;
  testIDPrefix: string;
};

export function TeacherClassPlaceholderScreen({
  moduleTitle,
  moduleDescription,
  availabilityLabel = "Préparation en cours",
  testIDPrefix,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const subtitle = classId ? `Classe ${classId}` : "Classe active";

  return (
    <>
      <ModuleHeader
        title={moduleTitle}
        subtitle={subtitle}
        onBack={() => router.back()}
        testID={`${testIDPrefix}-header`}
        backTestID={`${testIDPrefix}-back`}
        titleTestID={`${testIDPrefix}-title`}
        subtitleTestID={`${testIDPrefix}-subtitle`}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.heroCard} testID={`${testIDPrefix}-card`}>
          <Text style={styles.eyebrow}>{availabilityLabel}</Text>
          <Text style={styles.title}>{moduleTitle}</Text>
          <Text style={styles.body}>{moduleDescription}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    color: colors.warmAccent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
