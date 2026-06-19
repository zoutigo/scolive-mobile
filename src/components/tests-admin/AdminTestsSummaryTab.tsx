import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { AdminTestsSynthesis } from "../../types/tests-admin.types";

type Props = {
  data: AdminTestsSynthesis;
};

export function AdminTestsSummaryTab({ data }: Props) {
  const { t } = useTranslation();

  const kpis = [
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
    },
    {
      key: "successRate",
      label: t("testsAdmin.summary.kpi.successRate"),
      value: `${Math.round(data.executions.successRate * 100)}%`,
    },
  ];

  return (
    <View style={styles.grid} testID="admin-tests-summary">
      {kpis.map((kpi) => (
        <View
          key={kpi.key}
          style={styles.card}
          testID={`admin-tests-kpi-${kpi.key}`}
        >
          <Text style={styles.value}>{kpi.value}</Text>
          <Text style={styles.label}>{kpi.label}</Text>
        </View>
      ))}
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
