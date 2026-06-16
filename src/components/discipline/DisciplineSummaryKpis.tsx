import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import {
  DISCIPLINE_TYPE_CONFIG,
  type DisciplineSummary,
  type StudentLifeEventType,
} from "../../types/discipline.types";

interface KpiCardProps {
  icon: string;
  label: string;
  count: number;
  iconBubble: string;
  backgroundColor: string;
  warning?: boolean;
  onPress?: () => void;
  testID?: string;
}

function KpiCard({
  icon,
  label,
  count,
  iconBubble,
  backgroundColor,
  warning,
  onPress,
  testID,
}: KpiCardProps) {
  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress ? { onPress } : {};

  return (
    <Wrapper
      style={[
        styles.kpiCard,
        { backgroundColor },
        warning && count > 0 && styles.kpiWarning,
      ]}
      testID={testID}
      {...(wrapperProps as object)}
    >
      <View style={styles.kpiHeader} testID={`${testID}-header`}>
        <Text style={styles.kpiLabel} testID={`${testID}-label`}>
          {label}
        </Text>
        <View
          style={[styles.kpiIconWrap, { backgroundColor: iconBubble }]}
          testID={`${testID}-icon-wrap`}
        >
          <Ionicons name={icon as "time-outline"} size={20} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.kpiCount} testID={`${testID}-count`}>
        {String(count)}
      </Text>
      {warning && count > 0 && (
        <View style={styles.warnDot} testID={`warn-dot-${testID}`} />
      )}
    </Wrapper>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  summary: DisciplineSummary;
  onFilterPress?: (type: StudentLifeEventType) => void;
}

export function DisciplineSummaryKpis({ summary, onFilterPress }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.grid} testID="discipline-summary-kpis">
      <KpiCard
        icon={DISCIPLINE_TYPE_CONFIG.ABSENCE.icon}
        label={t("discipline.kpi.absences")}
        count={summary.absences}
        backgroundColor="#2E8FE1"
        iconBubble="rgba(255,255,255,0.18)"
        warning={summary.unjustifiedAbsences > 0}
        onPress={onFilterPress ? () => onFilterPress("ABSENCE") : undefined}
        testID="kpi-absences"
      />
      <KpiCard
        icon={DISCIPLINE_TYPE_CONFIG.RETARD.icon}
        label={t("discipline.kpi.retards")}
        count={summary.retards}
        backgroundColor="#FF6B39"
        iconBubble="rgba(255,255,255,0.18)"
        onPress={onFilterPress ? () => onFilterPress("RETARD") : undefined}
        testID="kpi-retards"
      />
      <KpiCard
        icon={DISCIPLINE_TYPE_CONFIG.SANCTION.icon}
        label={t("discipline.kpi.sanctions")}
        count={summary.sanctions}
        backgroundColor="#E9151A"
        iconBubble="rgba(255,255,255,0.18)"
        onPress={onFilterPress ? () => onFilterPress("SANCTION") : undefined}
        testID="kpi-sanctions"
      />
      <KpiCard
        icon={DISCIPLINE_TYPE_CONFIG.PUNITION.icon}
        label={t("discipline.kpi.punitions")}
        count={summary.punitions}
        backgroundColor="#B432D6"
        iconBubble="rgba(255,255,255,0.18)"
        onPress={onFilterPress ? () => onFilterPress("PUNITION") : undefined}
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
    justifyContent: "space-between",
    gap: 12,
  },
  kpiCard: {
    width: "48%",
    minHeight: 96,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "relative",
    overflow: "hidden",
  },
  kpiWarning: {
    shadowColor: colors.notification,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kpiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiCount: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
    color: colors.white,
    includeFontPadding: false,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 0.4,
    includeFontPadding: false,
    flexShrink: 1,
    maxWidth: "70%",
  },
  warnDot: {
    position: "absolute",
    top: 12,
    right: 60,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.notification,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
