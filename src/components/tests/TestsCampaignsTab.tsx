import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import type { TestCampaignSummary } from "../../types/tests.types";
import {
  type CampaignDisplayStatus,
  getCampaignDisplayStatus,
  sortCampaignsByDisplayStatus,
} from "./testCampaignStatus";
import {
  TESTS_TOUR_FALLBACK_CAMPAIGN_ID,
  TESTS_TOUR_ID,
  TESTS_TOUR_TARGETS,
} from "./tests-tour.config";

export type TestsCampaignsFilter = "ALL" | CampaignDisplayStatus;
export const ALL_CAMPAIGNS_FILTER: TestsCampaignsFilter = "ALL";

type FilterKey = TestsCampaignsFilter;

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
  filter: TestsCampaignsFilter;
  onFilterChange: (filter: TestsCampaignsFilter) => void;
}

export function TestsCampaignsTab({
  campaigns,
  filter,
  onFilterChange,
}: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [mineOnly, setMineOnly] = useState(() =>
    campaigns.some((campaign) => campaign.assignedToMe),
  );

  const currentTourTargetKey = useOnboardingTourStore((state) =>
    state.activeTourId === TESTS_TOUR_ID
      ? state.steps[state.stepIndex]?.targetKey
      : undefined,
  );
  const isCampaignActionTourStep =
    currentTourTargetKey === TESTS_TOUR_TARGETS.campaignAction;

  const fallbackCampaign: TestCampaignSummary = useMemo(
    () => ({
      id: TESTS_TOUR_FALLBACK_CAMPAIGN_ID,
      title: t("tests.tourFallback.title"),
      description: t("tests.tourFallback.description"),
      targetVersion: null,
      startsAt: null,
      dueAt: null,
      status: "ACTIVE",
      assignedToMe: true,
      summary: { totalCases: 5, completedCases: 0, totalExecutions: 0 },
    }),
    [t],
  );

  const sorted = useMemo(
    () => sortCampaignsByDisplayStatus(campaigns),
    [campaigns],
  );

  const searchNormalized = searchInput.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (isCampaignActionTourStep) return [fallbackCampaign];
    return sorted.filter((campaign) => {
      if (filter !== "ALL" && getCampaignDisplayStatus(campaign) !== filter) {
        return false;
      }
      if (mineOnly && !campaign.assignedToMe) {
        return false;
      }
      if (searchNormalized) {
        const haystack =
          `${campaign.title} ${campaign.description ?? ""}`.toLowerCase();
        if (!haystack.includes(searchNormalized)) {
          return false;
        }
      }
      return true;
    });
  }, [
    sorted,
    filter,
    mineOnly,
    searchNormalized,
    isCampaignActionTourStep,
    fallbackCampaign,
  ]);

  function resetSearchAndFilters() {
    setSearchInput("");
    setMineOnly(false);
    onFilterChange(ALL_CAMPAIGNS_FILTER);
  }

  function goToCampaign(campaignId: string) {
    if (campaignId === TESTS_TOUR_FALLBACK_CAMPAIGN_ID) return;
    router.push({
      pathname: "/(home)/tests/[campaignId]",
      params: { campaignId },
    });
  }

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "ALL", label: t("tests.campaigns.filters.all") },
    { key: "IN_PROGRESS", label: t("tests.campaigns.filters.inProgress") },
    { key: "UPCOMING", label: t("tests.campaigns.filters.upcoming") },
    { key: "COMPLETED", label: t("tests.campaigns.filters.completed") },
  ];

  if (campaigns.length === 0 && !isCampaignActionTourStep) {
    return (
      <View style={styles.empty} testID="tests-campaigns-tab">
        <Ionicons
          name="clipboard-outline"
          size={42}
          color={colors.warmBorder}
        />
        <Text style={styles.emptyTitle}>{t("tests.campaigns.emptyTitle")}</Text>
        <Text style={styles.emptyBody}>
          {t("tests.campaigns.emptyMessage")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="tests-campaigns-tab">
      <View style={styles.searchRow} testID="tests-campaigns-search-row">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t("tests.campaigns.search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={t("tests.campaigns.search.accessibilityLabel")}
            testID="tests-campaigns-search-input"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchInput("")}
              testID="tests-campaigns-search-clear"
              accessibilityLabel={t(
                "tests.campaigns.search.clearAccessibilityLabel",
              )}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.mineToggle, mineOnly && styles.mineToggleActive]}
          onPress={() => setMineOnly((value) => !value)}
          testID="tests-campaigns-mine-toggle"
          accessibilityLabel={t(
            "tests.campaigns.filters.mineAccessibilityLabel",
          )}
        >
          <Ionicons
            name={mineOnly ? "person" : "person-outline"}
            size={18}
            color={mineOnly ? colors.white : colors.accentTeal}
          />
        </TouchableOpacity>
      </View>

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
              onPress={() => onFilterChange(entry.key)}
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

      {filtered.length === 0 ? (
        <View style={styles.emptySearch} testID="tests-campaigns-no-results">
          <Ionicons name="search-outline" size={32} color={colors.warmBorder} />
          <Text style={styles.emptyTitle}>
            {t("tests.campaigns.emptySearchTitle")}
          </Text>
          <Text style={styles.emptyBody}>
            {t("tests.campaigns.emptySearchMessage")}
          </Text>
          <TouchableOpacity
            style={styles.resetSearchButton}
            onPress={resetSearchAndFilters}
            testID="tests-campaigns-reset-search"
          >
            <Text style={styles.resetSearchButtonText}>
              {t("tests.campaigns.filters.resetSearch")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((campaign) => {
            const status = getCampaignDisplayStatus(campaign);
            const palette = STATUS_PALETTE[status];
            const hasStarted = campaign.summary.completedCases > 0;
            return (
              <TouchableOpacity
                key={campaign.id}
                style={[styles.card, { borderLeftColor: palette.accent }]}
                onPress={() => goToCampaign(campaign.id)}
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
                  <Text style={styles.cardBody} numberOfLines={2}>
                    {campaign.description}
                  </Text>
                ) : null}
                <View style={styles.footerRow}>
                  <View style={styles.metaCompact}>
                    <Text style={styles.metaCompactText}>
                      {t("tests.campaigns.progressCompact")
                        .replace(
                          "{done}",
                          String(campaign.summary.completedCases),
                        )
                        .replace(
                          "{total}",
                          String(campaign.summary.totalCases),
                        )}
                    </Text>
                    {campaign.dueAt ? (
                      <Text style={styles.metaCompactText}>
                        {t("tests.campaigns.dueLabel").replace(
                          "{date}",
                          formatDate(campaign.dueAt, locale),
                        )}
                      </Text>
                    ) : null}
                  </View>
                  {(() => {
                    const actionButton = (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => goToCampaign(campaign.id)}
                        testID={`test-campaign-action-${campaign.id}`}
                      >
                        <Ionicons
                          name={hasStarted ? "eye-outline" : "play"}
                          size={14}
                          color={colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          {t(
                            hasStarted
                              ? "tests.campaigns.actions.review"
                              : "tests.campaigns.actions.start",
                          )}
                        </Text>
                      </TouchableOpacity>
                    );
                    return campaign.id === TESTS_TOUR_FALLBACK_CAMPAIGN_ID ? (
                      <OnboardingTarget id={TESTS_TOUR_TARGETS.campaignAction}>
                        {actionButton}
                      </OnboardingTarget>
                    ) : (
                      actionButton
                    );
                  })()}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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

function formatDate(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  mineToggle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  mineToggleActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
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
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  metaCompact: { flex: 1, gap: 2 },
  metaCompactText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 60,
    gap: 10,
  },
  emptySearch: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
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
  resetSearchButton: {
    marginTop: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resetSearchButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accentTeal,
  },
});
