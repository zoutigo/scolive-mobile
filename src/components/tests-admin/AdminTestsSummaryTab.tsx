import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { AdminTestsSynthesis } from "../../types/tests-admin.types";
import { EMPTY_EXECUTIONS_FILTER, type AdminExecutionsFilter } from "./AdminTestsExecutionsTab";

type Props = {
  data: AdminTestsSynthesis;
  onKpiPress?: (filter: AdminExecutionsFilter) => void;
};

export function AdminTestsSummaryTab({ data, onKpiPress }: Props) {
  const { t } = useTranslation();

  const kpis: Array<{
    key: string;
    label: string;
    value: string | number;
    filter?: AdminExecutionsFilter;
  }> = [
    {
      key: "campaignsActive",
      label: t("testsAdmin.summary.kpi.campaignsActive"),
      value: data.campaigns.active,
    },
    {
      key: "campaignsTotal",
      label: t("testsAdmin.summary.kpi.campaignsTotal"),
      value: data.campaigns.total,
    },
    {
      key: "totalCases",
      label: t("testsAdmin.summary.kpi.totalCases"),
      value: data.totalCases,
    },
    {
      key: "testersCount",
      label: t("testsAdmin.summary.kpi.testersCount"),
      value: data.testersCount,
    },
    {
      key: "executions",
      label: t("testsAdmin.summary.kpi.executions"),
      value: data.executions.total,
      filter: EMPTY_EXECUTIONS_FILTER,
    },
    {
      key: "successRate",
      label: t("testsAdmin.summary.kpi.successRate"),
      value: `${Math.round(data.executions.successRate * 100)}%`,
      filter: { ...EMPTY_EXECUTIONS_FILTER, status: "PASSED" },
    },
    {
      key: "failed",
      label: t("tests.status.failed"),
      value: data.executions.failed,
      filter: { ...EMPTY_EXECUTIONS_FILTER, status: "FAILED" },
    },
    {
      key: "pendingReview",
      label: t("testsAdmin.summary.kpi.pendingReview"),
      value: data.executions.pendingReview,
      filter: { ...EMPTY_EXECUTIONS_FILTER, reviewed: "false" },
    },
  ];

  return (
    <View style={styles.grid} testID="admin-tests-summary">
      {kpis.map((kpi) => {
        const content = (
          <>
            <Text style={styles.value}>{kpi.value}</Text>
            <Text style={styles.label}>{kpi.label}</Text>
          </>
        );

        if (kpi.filter && onKpiPress) {
          return (
            <Pressable
              key={kpi.key}
              style={styles.card}
              onPress={() => onKpiPress(kpi.filter as AdminExecutionsFilter)}
              testID={`admin-tests-kpi-${kpi.key}`}
            >
              {content}
            </Pressable>
          );
        }

        return (
          <View key={kpi.key} style={styles.card} testID={`admin-tests-kpi-${kpi.key}`}>
            {content}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    flexGrow: 1,
    minWidth: "30%",
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
  },
  value: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  label: { fontSize: 12, color: colors.textSecondary },
});
