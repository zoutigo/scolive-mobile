import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  SchoolCycle,
  SchoolLanguageSystem,
} from "../../types/schools.types";

const CYCLE_TONES: Record<SchoolCycle, { bg: string; fg: string }> = {
  PRIMARY: { bg: "rgba(36,124,114,0.14)", fg: colors.accentTealDark },
  SECONDARY: { bg: "rgba(216,155,91,0.20)", fg: "#8A5A24" },
};

export function CyclePill(props: {
  cycle: SchoolCycle | null;
  testID?: string;
}) {
  const { t } = useTranslation();
  const tone = props.cycle
    ? CYCLE_TONES[props.cycle]
    : { bg: colors.background, fg: colors.textSecondary };
  const label = t(`schoolsAdmin.cycle.${props.cycle ?? "UNSET"}`);
  return (
    <View
      style={[styles.pill, { backgroundColor: tone.bg }]}
      testID={props.testID}
    >
      <Text style={[styles.pillText, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

export function LanguagePill(props: {
  languageSystem: SchoolLanguageSystem | null;
  testID?: string;
}) {
  const { t } = useTranslation();
  if (!props.languageSystem) return null;
  return (
    <View style={[styles.pill, styles.pillOutline]} testID={props.testID}>
      <Text style={styles.pillOutlineText}>
        {t(`schoolsAdmin.language.${props.languageSystem}`)}
      </Text>
    </View>
  );
}

export function StatTile(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  tone?: "primary" | "teal" | "warm";
  testID?: string;
}) {
  const tone = props.tone ?? "primary";
  const iconColor =
    tone === "teal"
      ? colors.accentTeal
      : tone === "warm"
        ? colors.warmAccent
        : colors.primary;
  return (
    <View style={styles.statTile} testID={props.testID}>
      <View
        style={[styles.statIconWrap, { backgroundColor: `${iconColor}1F` }]}
      >
        <Ionicons name={props.icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{props.value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {props.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  pillOutline: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
  },
  pillOutlineText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statTile: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 4,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
