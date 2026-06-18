import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { TestCampaignSummary } from "../../types/tests.types";
import {
  type CampaignDisplayStatus,
  getCampaignDisplayStatus,
  sortCampaignsByDisplayStatus,
} from "./testCampaignStatus";

type FilterKey = "ALL" | CampaignDisplayStatus;

const STATUS_PALETTE: Record<
  CampaignDisplayStatus,
  { accent: string; bg: string; text: string }
> = {
  IN_PROGRESS: { accent: colors.accentTeal, bg: "#E4F5EA", text: "#20744A" },
  UPCOMING: { accent: colors.warmAccent, bg: "#FFF3DD", text: "#9A6700" },
  COMPLETED: { accent: "#9C958B", bg: "#F1ECE7", text: colors.textSecondary },
};

interface Props {
  campaigns: TestCampaignSummary[];
}

export function TestsCampaignsTab({ campaigns }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const sorted = useMemo(
    () => sortCampaignsByDisplayStatus(campaigns),
    [campaigns],
  );

  const filtered = useMemo(() => {
    if (filter === "ALL") return sorted;
    return sorted.filter(
      (campaign) => getCampaignDisplayStatus(campaign) === filter,
    );
  }, [filter, sorted]);

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "ALL", label: t("tests.campaigns.filters.all") },
    { key: "IN_PROGRESS", label: t("tests.campaigns.filters.inProgress") },
    { key: "UPCOMING", label: t("tests.campaigns.filters.upcoming") },
    { key: "COMPLETED", label: t("tests.campaigns.filters.completed") },
  ];

  return (
    <View style={styles.container} testID="tests-campaigns-tab">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((entry) => {
          const isActive = entry.key === filter;
          return (
            <TouchableOpacity
              key={entry.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilter(entry.key)}
              testID={`tests-campaigns-filter-${entry.key}`}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {entry.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {filtered.map((campaign) => {
          const status = getCampaignDisplayStatus(campaign);
          const palette = STATUS_PALETTE[status];
          return (
            <TouchableOpacity
              key={campaign.id}
              style={[styles.card, { borderLeftColor: palette.accent }]}
              onPress={() =>
                router.push({
                  pathname: "/(home)/tests/[campaignId]",
                  params: { campaignId: campaign.id },
                })
              }
              testID={`test-campaign-card-${campaign.id}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{campaign.title}</Text>
                <View
                  style={[styles.statusPill, { backgroundColor: palette.bg }]}
                >
                  <Text
                    style={[styles.statusPillText, { color: palette.text }]}
                  >
                    {t(`tests.campaigns.status.${statusKey(status)}`)}
                  </Text>
                </View>
              </View>
              {campaign.description ? (
                <Text style={styles.cardBody}>{campaign.description}</Text>
              ) : null}
              <View style={styles.metaRow}>
                <LabelPill
                  text={t("tests.campaigns.totalCases").replace(
                    "{count}",
                    String(campaign.summary.totalCases),
                  )}
                />
                <LabelPill
                  text={t("tests.campaigns.progressLabel")
                    .replace("{done}", String(campaign.summary.completedCases))
                    .replace("{total}", String(campaign.summary.totalCases))}
                />
                {campaign.dueAt ? (
                  <LabelPill
                    text={t("tests.campaigns.dueLabel").replace(
                      "{date}",
                      formatDate(campaign.dueAt, locale),
                    )}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function statusKey(status: CampaignDisplayStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "inProgress";
    case "UPCOMING":
      return "upcoming";
    default:
      return "completed";
  }
}

function LabelPill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

function formatDate(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  filterRow: { gap: 8, paddingRight: 8 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  filterChipTextActive: { color: colors.white },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: "#F4E9DE",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
});
