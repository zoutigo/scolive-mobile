import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  ALL_CAMPAIGNS_FILTER,
  type TestsCampaignsFilter,
} from "./TestsCampaignsTab";

interface KpiCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  backgroundColor: string;
  testID: string;
  onPress?: () => void;
}

function KpiCard({
  icon,
  label,
  count,
  backgroundColor,
  testID,
  onPress,
}: KpiCardProps) {
  const content = (
    <>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiLabel} testID={`${testID}-label`}>
          {label}
        </Text>
        <View style={styles.kpiIconWrap}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.kpiCount} testID={`${testID}-count`}>
        {String(count)}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[styles.kpiCard, { backgroundColor }]}
        onPress={onPress}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.kpiCard, { backgroundColor }]} testID={testID}>
      {content}
    </View>
  );
}

export type TestsKpiData = {
  totalCampaigns: number;
  inProgressCampaigns: number;
  completedCampaigns: number;
  upcomingCampaigns: number;
  totalCases: number;
  pendingCases: number;
};

interface Props {
  data: TestsKpiData;
  labels: {
    totalCampaigns: string;
    inProgress: string;
    completed: string;
    upcoming: string;
    totalCases: string;
    pending: string;
  };
  onCampaignsFilterPress?: (filter: TestsCampaignsFilter) => void;
}

export function TestsSummaryKpis({
  data,
  labels,
  onCampaignsFilterPress,
}: Props) {
  return (
    <View style={styles.grid} testID="tests-summary-kpis">
      <KpiCard
        icon="albums-outline"
        label={labels.totalCampaigns}
        count={data.totalCampaigns}
        backgroundColor={colors.primary}
        testID="tests-kpi-total-campaigns"
        onPress={() => onCampaignsFilterPress?.(ALL_CAMPAIGNS_FILTER)}
      />
      <KpiCard
        icon="play-circle-outline"
        label={labels.inProgress}
        count={data.inProgressCampaigns}
        backgroundColor={colors.accentTeal}
        testID="tests-kpi-in-progress"
        onPress={() => onCampaignsFilterPress?.("IN_PROGRESS")}
      />
      <KpiCard
        icon="time-outline"
        label={labels.upcoming}
        count={data.upcomingCampaigns}
        backgroundColor={colors.warmAccent}
        testID="tests-kpi-upcoming"
        onPress={() => onCampaignsFilterPress?.("UPCOMING")}
      />
      <KpiCard
        icon="checkmark-done-outline"
        label={labels.completed}
        count={data.completedCampaigns}
        backgroundColor="#5F5A52"
        testID="tests-kpi-completed"
        onPress={() => onCampaignsFilterPress?.("COMPLETED")}
      />
      <KpiCard
        icon="document-text-outline"
        label={labels.totalCases}
        count={data.totalCases}
        backgroundColor="#7C6AA3"
        testID="tests-kpi-total-cases"
        onPress={() => onCampaignsFilterPress?.(ALL_CAMPAIGNS_FILTER)}
      />
      <KpiCard
        icon="alert-circle-outline"
        label={labels.pending}
        count={data.pendingCases}
        backgroundColor="#B45A3C"
        testID="tests-kpi-pending"
        onPress={() => onCampaignsFilterPress?.(ALL_CAMPAIGNS_FILTER)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  kpiCard: {
    width: "48%",
    minHeight: 92,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiCount: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.white,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "700",
    flexShrink: 1,
    maxWidth: "70%",
  },
});
