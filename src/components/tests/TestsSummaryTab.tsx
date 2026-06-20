import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { TestCampaignSummary } from "../../types/tests.types";
import { TestsSummaryKpis, type TestsKpiData } from "./TestsSummaryKpis";
import { getCampaignDisplayStatus } from "./testCampaignStatus";
import type { TestsCampaignsFilter } from "./TestsCampaignsTab";

interface Props {
  campaigns: TestCampaignSummary[];
  onCampaignsFilterPress?: (filter: TestsCampaignsFilter) => void;
}

export function TestsSummaryTab({ campaigns, onCampaignsFilterPress }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const kpis: TestsKpiData = useMemo(() => {
    let inProgressCampaigns = 0;
    let completedCampaigns = 0;
    let upcomingCampaigns = 0;
    let totalCases = 0;
    let pendingCases = 0;

    for (const campaign of campaigns) {
      const status = getCampaignDisplayStatus(campaign);
      if (status === "IN_PROGRESS") inProgressCampaigns += 1;
      else if (status === "COMPLETED") completedCampaigns += 1;
      else upcomingCampaigns += 1;

      totalCases += campaign.summary.totalCases;
      pendingCases += Math.max(
        0,
        campaign.summary.totalCases - campaign.summary.completedCases,
      );
    }

    return {
      totalCampaigns: campaigns.length,
      inProgressCampaigns,
      completedCampaigns,
      upcomingCampaigns,
      totalCases,
      pendingCases,
    };
  }, [campaigns]);

  const highlight = useMemo(() => {
    const candidates = campaigns
      .filter((campaign) => {
        const status = getCampaignDisplayStatus(campaign);
        return (
          (status === "IN_PROGRESS" || status === "UPCOMING") &&
          campaign.summary.completedCases < campaign.summary.totalCases
        );
      })
      .sort((a, b) => {
        const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return aDue - bDue;
      });

    return candidates[0] ?? null;
  }, [campaigns]);

  if (campaigns.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons
          name="clipboard-outline"
          size={42}
          color={colors.warmBorder}
        />
        <Text style={styles.emptyTitle}>{t("tests.summary.emptyTitle")}</Text>
        <Text style={styles.emptyBody}>{t("tests.summary.emptyMessage")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="tests-summary-tab">
      <TestsSummaryKpis
        data={kpis}
        labels={{
          totalCampaigns: t("tests.summary.kpi.totalCampaigns"),
          inProgress: t("tests.summary.kpi.inProgress"),
          completed: t("tests.summary.kpi.completed"),
          upcoming: t("tests.summary.kpi.upcoming"),
          totalCases: t("tests.summary.kpi.totalCases"),
          pending: t("tests.summary.kpi.pending"),
        }}
        onCampaignsFilterPress={onCampaignsFilterPress}
      />

      <View style={styles.highlightCard} testID="tests-highlight-card">
        <View style={styles.highlightHeader}>
          <Ionicons
            name="sparkles-outline"
            size={18}
            color={colors.warmAccent}
          />
          <Text style={styles.highlightTitle}>
            {t("tests.summary.highlight.title")}
          </Text>
        </View>

        {highlight ? (
          <TouchableOpacity
            style={styles.highlightBody}
            onPress={() =>
              router.push({
                pathname: "/(home)/tests/[campaignId]",
                params: { campaignId: highlight.id },
              })
            }
            testID="tests-highlight-cta"
          >
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeText}>
                {t("tests.summary.highlight.campaignBadge")}
              </Text>
            </View>
            <Text style={styles.highlightCampaignTitle}>{highlight.title}</Text>
            <Text style={styles.highlightMeta}>
              {t("tests.campaigns.progressLabel")
                .replace("{done}", String(highlight.summary.completedCases))
                .replace("{total}", String(highlight.summary.totalCases))}
            </Text>
            <View style={styles.highlightCta}>
              <Text style={styles.highlightCtaText}>
                {t("tests.summary.highlight.cta")}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.highlightEmpty}>
            {t("tests.summary.highlight.empty")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  highlightCard: {
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    padding: 16,
    gap: 10,
  },
  highlightHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  highlightTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  highlightBody: { gap: 8 },
  highlightBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F4E9DE",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  highlightBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  highlightCampaignTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  highlightMeta: { fontSize: 13, color: colors.textSecondary },
  highlightCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  highlightCtaText: { fontSize: 13, fontWeight: "700", color: colors.primary },
  highlightEmpty: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
