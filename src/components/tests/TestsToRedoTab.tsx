import React, { useMemo, useState } from "react";
import {
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
import { SelectField } from "../tests-admin/SelectField";
import type {
  TestCampaignSummary,
  TestCaseToRedo,
} from "../../types/tests.types";

type Props = {
  items: TestCaseToRedo[];
  campaigns: TestCampaignSummary[];
};

export function TestsToRedoTab({ items, campaigns }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [mineOnly, setMineOnly] = useState(() =>
    campaigns.some((campaign) => campaign.assignedToMe),
  );

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
    return [
      { value: "", label: t("tests.toRedo.filters.campaignAll") },
      ...Array.from(unique.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [items, t]);

  const searchNormalized = searchInput.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (campaignId && item.campaign.id !== campaignId) return false;
      if (mineOnly && !assignedCampaignIds.has(item.campaign.id)) {
        return false;
      }
      if (searchNormalized) {
        const haystack = `${item.title} ${item.campaign.title}`.toLowerCase();
        if (!haystack.includes(searchNormalized)) return false;
      }
      return true;
    });
  }, [items, campaignId, searchNormalized, mineOnly, assignedCampaignIds]);

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
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t("tests.toRedo.search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={t("tests.toRedo.search.accessibilityLabel")}
            testID="tests-to-redo-search-input"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchInput("")}
              testID="tests-to-redo-search-clear"
              accessibilityLabel={t(
                "tests.toRedo.search.clearAccessibilityLabel",
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
          testID="tests-to-redo-mine-toggle"
          accessibilityLabel={t("tests.toRedo.filters.mineAccessibilityLabel")}
        >
          <Ionicons
            name={mineOnly ? "person" : "person-outline"}
            size={18}
            color={mineOnly ? colors.white : colors.accentTeal}
          />
        </TouchableOpacity>
      </View>

      {campaignOptions.length > 2 ? (
        <SelectField
          label={t("tests.toRedo.filters.campaign")}
          value={campaignId}
          options={campaignOptions}
          onChange={setCampaignId}
          placeholder={t("tests.toRedo.filters.campaignAll")}
          closeLabel={t("tests.common.cancel")}
          testIDPrefix="tests-to-redo-filter-campaign"
        />
      ) : null}

      {filteredItems.length === 0 ? (
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
