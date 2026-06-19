import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { testsAdminApi } from "../../api/tests-admin.api";
import type { AdminCampaignRow } from "../../types/tests-admin.types";
import type { TestCampaignStatus } from "../../types/tests.types";

type FilterKey = "" | TestCampaignStatus;

export function AdminTestsCampaignsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<AdminCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await testsAdminApi.listCampaigns({
        search: search.trim() || undefined,
        status: filter || undefined,
      });
      setCampaigns(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: "", label: t("testsAdmin.campaigns.filters.all") },
    { key: "DRAFT", label: t("testsAdmin.campaigns.filters.draft") },
    { key: "ACTIVE", label: t("testsAdmin.campaigns.filters.active") },
    { key: "ARCHIVED", label: t("testsAdmin.campaigns.filters.archived") },
  ];

  return (
    <View style={styles.container} testID="admin-tests-campaigns-tab">
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder={t("testsAdmin.campaigns.searchPlaceholder")}
        placeholderTextColor={colors.textSecondary}
        testID="admin-tests-search"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((entry) => {
          const isActive = entry.key === filter;
          return (
            <TouchableOpacity
              key={entry.key || "all"}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setFilter(entry.key)}
              testID={`admin-tests-filter-${entry.key || "all"}`}
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : campaigns.length === 0 ? (
        <Text style={styles.empty}>{t("testsAdmin.campaigns.empty")}</Text>
      ) : (
        <View style={styles.list}>
          {campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(home)/admin-tests/[campaignId]",
                  params: { campaignId: campaign.id },
                })
              }
              testID={`admin-campaign-card-${campaign.id}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.reference}>
                  {t("testsAdmin.campaigns.referencePrefix").replace(
                    "{reference}",
                    String(campaign.reference).padStart(6, "0"),
                  )}
                </Text>
                <StatusPill status={campaign.status} />
              </View>
              <Text style={styles.cardTitle}>{campaign.title}</Text>
              <Text style={styles.cardMeta}>
                {t("testsAdmin.campaigns.testCasesCount").replace(
                  "{count}",
                  String(campaign.testCasesCount),
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function StatusPill({ status }: { status: TestCampaignStatus }) {
  const { t } = useTranslation();
  const map: Record<
    TestCampaignStatus,
    { bg: string; text: string; key: string }
  > = {
    DRAFT: { bg: "#F1ECE7", text: colors.textSecondary, key: "draft" },
    ACTIVE: { bg: "#E4F5EA", text: "#20744A", key: "active" },
    ARCHIVED: { bg: "#F1ECE7", text: colors.textSecondary, key: "archived" },
  };
  const palette = map[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.statusPillText, { color: palette.text }]}>
        {t(`testsAdmin.campaigns.status.${palette.key}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  search: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  filterRow: { gap: 8 },
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
  center: { paddingVertical: 32, alignItems: "center" },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 24,
  },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E8DCCD",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reference: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  cardMeta: { fontSize: 13, color: colors.textSecondary },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
});
