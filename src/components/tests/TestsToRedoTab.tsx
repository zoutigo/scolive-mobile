import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  TestCampaignSummary,
  TestCaseToRedo,
} from "../../types/tests.types";
import {
  FilterDropdownGroup,
  FilterToggleGroup,
  TestsFilterPanel,
  TestsSearchRow,
} from "./TestsFilterPanel";

type Props = {
  items: TestCaseToRedo[];
  campaigns: TestCampaignSummary[];
};

type DraftFilters = { campaignId: string; mineOnly: boolean };

export function TestsToRedoTab({ items, campaigns }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [appliedMineOnly, setAppliedMineOnly] = useState(() =>
    campaigns.some((campaign) => campaign.assignedToMe),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
    campaignId,
    mineOnly: appliedMineOnly,
  });

  const assignedCampaignIds = useMemo(
    () =>
      new Set(
        campaigns
          .filter((campaign) => campaign.assignedToMe)
          .map((campaign) => campaign.id),
      ),
    [campaigns],
  );

  const campaignOptions = useMemo(() => {
    const unique = new Map<string, string>();
    for (const item of items) {
      unique.set(item.campaign.id, item.campaign.title);
    }
    return Array.from(unique.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [items]);

  const searchNormalized = searchInput.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (campaignId && item.campaign.id !== campaignId) return false;
      if (appliedMineOnly && !assignedCampaignIds.has(item.campaign.id)) {
        return false;
      }
      if (searchNormalized) {
        const haystack = `${item.title} ${item.campaign.title}`.toLowerCase();
        if (!haystack.includes(searchNormalized)) return false;
      }
      return true;
    });
  }, [items, campaignId, searchNormalized, appliedMineOnly, assignedCampaignIds]);

  const hasActiveFilters = campaignId !== "" || appliedMineOnly;

  function openFilters() {
    setDraftFilters({ campaignId, mineOnly: appliedMineOnly });
    setFiltersOpen(true);
  }
  function closeFilters() {
    setDraftFilters({ campaignId, mineOnly: appliedMineOnly });
    setFiltersOpen(false);
  }
  function toggleFilters() {
    if (filtersOpen) closeFilters();
    else openFilters();
  }
  function applyFilters() {
    setCampaignId(draftFilters.campaignId);
    setAppliedMineOnly(draftFilters.mineOnly);
    setFiltersOpen(false);
  }
  function resetFilters() {
    setDraftFilters({ campaignId: "", mineOnly: false });
    setCampaignId("");
    setAppliedMineOnly(false);
  }

  function openCase(item: TestCaseToRedo) {
    router.push({
      pathname: "/(home)/tests/cases/[testCaseId]",
      params: {
        testCaseId: item.id,
        evidenceRequired: item.evidenceRequired ? "1" : "0",
      },
    });
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty} testID="tests-to-redo-empty">
        <Text style={styles.emptyTitle}>{t("tests.toRedo.emptyTitle")}</Text>
        <Text style={styles.emptyBody}>{t("tests.toRedo.emptyMessage")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="tests-to-redo-tab">
      <TestsSearchRow
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder={t("tests.toRedo.search.placeholder")}
        accessibilityLabel={t("tests.toRedo.search.accessibilityLabel")}
        clearAccessibilityLabel={t(
          "tests.toRedo.search.clearAccessibilityLabel",
        )}
        filtersActive={hasActiveFilters}
        onToggleFilters={toggleFilters}
        toggleAccessibilityLabel={t("tests.filters.toggleAccessibilityLabel")}
        testIDPrefix="tests-to-redo"
      />

      <TestsFilterPanel
        visible={filtersOpen}
        titleLabel={t("tests.filters.panelTitle")}
        resetLabel={t("tests.filters.reset")}
        closeLabel={t("tests.filters.close")}
        applyLabel={t("tests.filters.apply")}
        onReset={resetFilters}
        onClose={closeFilters}
        onApply={applyFilters}
        testIDPrefix="tests-to-redo"
      >
        {campaignOptions.length > 1 ? (
          <FilterDropdownGroup
            label={t("tests.toRedo.filters.campaign")}
            allLabel={t("tests.toRedo.filters.campaignAll")}
            options={campaignOptions}
            value={draftFilters.campaignId || null}
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                campaignId: value ?? "",
              }))
            }
            testID="tests-to-redo-filter-campaign"
          />
        ) : null}
        <FilterToggleGroup
          label={t("tests.toRedo.filters.mineAccessibilityLabel")}
          activeLabel={t("tests.filters.mineOnlyLabel")}
          value={draftFilters.mineOnly}
          onChange={(value) =>
            setDraftFilters((current) => ({ ...current, mineOnly: value }))
          }
          testIDPrefix="tests-to-redo-filter-mine"
        />
      </TestsFilterPanel>

      {filtersOpen ? null : filteredItems.length === 0 ? (
        <View style={styles.empty} testID="tests-to-redo-no-results">
          <Text style={styles.emptyTitle}>
            {t("tests.toRedo.emptySearchTitle")}
          </Text>
          <Text style={styles.emptyBody}>
            {t("tests.toRedo.emptySearchMessage")}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => openCase(item)}
              testID={`tests-to-redo-card-${item.id}`}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {t("tests.toRedo.cardCampaign").replace(
                  "{title}",
                  item.campaign.title,
                )}
              </Text>
              <Text style={styles.cardMeta}>
                {t("tests.toRedo.requestedOn").replace(
                  "{date}",
                  formatDateTime(item.reworkRequestedAt, locale),
                )}
              </Text>
              {item.reworkNote ? (
                <Text style={styles.cardNote} numberOfLines={3}>
                  {item.reworkNote}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function formatDateTime(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  empty: { paddingVertical: 40, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  emptyBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F0C9C2",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  cardNote: { fontSize: 13, color: colors.textPrimary, marginTop: 2 },
});
