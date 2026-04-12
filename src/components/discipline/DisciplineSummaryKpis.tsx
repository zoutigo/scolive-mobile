import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  DISCIPLINE_TYPE_CONFIG,
  type DisciplineSummary,
} from "../../types/discipline.types";

interface KpiCardProps {
  icon: string;
  label: string;
  count: number;
  accent: string;
  bg: string;
  warning?: boolean;
  onPress?: () => void;
  testID?: string;
}

function KpiCard({
  icon,
  label,
  count,
  accent,
  bg,
  warning,
  onPress,
  testID,
}: KpiCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.8 as number } : {};

  return (
    <Wrapper
      style={[styles.kpiCard, warning && count > 0 && styles.kpiWarning]}
      testID={testID}
      {...(wrapperProps as object)}
    >
      <View style={[styles.kpiIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon as "time-outline"} size={20} color={accent} />
      </View>
      <Text style={[styles.kpiCount, { color: accent }]}>{count}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {warning && count > 0 && (
        <View style={styles.warnDot} testID={`warn-dot-${testID}`} />
      )}
    </Wrapper>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  summary: DisciplineSummary;
  onAbsencesPress?: () => void;
  onRetardsPress?: () => void;
  onSanctionsPress?: () => void;
  onPunitionsPress?: () => void;
}

export function DisciplineSummaryKpis({
  summary,
  onAbsencesPress,
  onRetardsPress,
  onSanctionsPress,
  onPunitionsPress,
}: Props) {
  const abs = DISCIPLINE_TYPE_CONFIG.ABSENCE;
  const ret = DISCIPLINE_TYPE_CONFIG.RETARD;
  const san = DISCIPLINE_TYPE_CONFIG.SANCTION;
  const pun = DISCIPLINE_TYPE_CONFIG.PUNITION;

  return (
    <View style={styles.grid} testID="discipline-summary-kpis">
      <KpiCard
        icon={abs.icon}
        label="Absences"
        count={summary.absences}
        accent={abs.accent}
        bg={abs.bg}
        warning={summary.unjustifiedAbsences > 0}
        onPress={onAbsencesPress}
        testID="kpi-absences"
      />
      <KpiCard
        icon={ret.icon}
        label="Retards"
        count={summary.retards}
        accent={ret.accent}
        bg={ret.bg}
        onPress={onRetardsPress}
        testID="kpi-retards"
      />
      <KpiCard
        icon={san.icon}
        label="Sanctions"
        count={summary.sanctions}
        accent={san.accent}
        bg={san.bg}
        onPress={onSanctionsPress}
        testID="kpi-sanctions"
      />
      <KpiCard
        icon={pun.icon}
        label="Punitions"
        count={summary.punitions}
        accent={pun.accent}
        bg={pun.bg}
        onPress={onPunitionsPress}
        testID="kpi-punitions"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    width: "47.5%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 6,
    position: "relative",
    overflow: "hidden",
  },
  kpiWarning: {
    borderColor: "#FFCDD2",
  },
  kpiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiCount: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  warnDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.notification,
  },
});
