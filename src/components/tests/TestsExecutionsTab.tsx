import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { testsApi } from "../../api/tests.api";
import { SelectField } from "../tests-admin/SelectField";
import type {
  TestCampaignSummary,
  TestExecutionRow,
  TestExecutionStatus,
} from "../../types/tests.types";

type Props = {
  campaigns: TestCampaignSummary[];
};

const STATUS_OPTIONS: TestExecutionStatus[] = [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "IN_PROGRESS",
  "TODO",
];

export function TestsExecutionsTab({ campaigns }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState<TestExecutionStatus | "">("");
  const [campaignId, setCampaignId] = useState<string>("");
  const [items, setItems] = useState<TestExecutionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [mineOnly, setMineOnly] = useState(() =>
    campaigns.some((campaign) => campaign.assignedToMe),
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const response = await testsApi.listExecutions({
          status: status || undefined,
          campaignId: campaignId || undefined,
        });
        if (!cancelled) {
          setItems(response.items);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : t("tests.common.errors.loadGeneric"),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, campaignId]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("tests.executions.filters.statusAll") },
      ...STATUS_OPTIONS.map((value) => ({
        value,
        label: statusLabel(t, value),
      })),
    ],
    [t],
  );

  const campaignOptions = useMemo(
    () => [
      { value: "", label: t("tests.executions.filters.campaignAll") },
      ...campaigns.map((campaign) => ({
        value: campaign.id,
        label: campaign.title,
      })),
    ],
    [campaigns, t],
  );

  function openExecution(executionId: string) {
    router.push({
      pathname: "/(home)/tests/executions/[executionId]",
      params: { executionId, status, campaignId },
    });
  }

  const assignedCampaignIds = useMemo(
    () =>
      new Set(
        campaigns
          .filter((campaign) => campaign.assignedToMe)
          .map((campaign) => campaign.id),
      ),
    [campaigns],
  );

  const searchNormalized = searchInput.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    return items.filter((execution) => {
      if (mineOnly && !assignedCampaignIds.has(execution.campaign.id)) {
        return false;
      }
      if (searchNormalized) {
        const haystack =
          `${execution.testCase.title} ${execution.campaign.title}`.toLowerCase();
        if (!haystack.includes(searchNormalized)) return false;
      }
      return true;
    });
  }, [items, searchNormalized, mineOnly, assignedCampaignIds]);

  return (
    <View style={styles.container} testID="tests-executions-tab">
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t("tests.executions.search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={t("tests.executions.search.accessibilityLabel")}
            testID="tests-executions-search-input"
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchInput("")}
              testID="tests-executions-search-clear"
              accessibilityLabel={t(
                "tests.executions.search.clearAccessibilityLabel",
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
          testID="tests-executions-mine-toggle"
          accessibilityLabel={t(
            "tests.executions.filters.mineAccessibilityLabel",
          )}
        >
          <Ionicons
            name={mineOnly ? "person" : "person-outline"}
            size={18}
            color={mineOnly ? colors.white : colors.accentTeal}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.filterCol}>
          <SelectField
            label={t("tests.executions.filters.status")}
            value={status}
            options={statusOptions}
            onChange={(value) => setStatus(value as TestExecutionStatus | "")}
            placeholder={t("tests.executions.filters.statusAll")}
            closeLabel={t("tests.common.cancel")}
            testIDPrefix="tests-executions-filter-status"
          />
        </View>
        <View style={styles.filterCol}>
          <SelectField
            label={t("tests.executions.filters.campaign")}
            value={campaignId}
            options={campaignOptions}
            onChange={setCampaignId}
            placeholder={t("tests.executions.filters.campaignAll")}
            closeLabel={t("tests.common.cancel")}
            testIDPrefix="tests-executions-filter-campaign"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {t("tests.executions.emptyTitle")}
          </Text>
          <Text style={styles.emptyBody}>
            {t("tests.executions.emptyMessage")}
          </Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.empty} testID="tests-executions-no-results">
          <Text style={styles.emptyTitle}>
            {t("tests.executions.emptySearchTitle")}
          </Text>
          <Text style={styles.emptyBody}>
            {t("tests.executions.emptySearchMessage")}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredItems.map((execution) => (
            <TouchableOpacity
              key={execution.id}
              style={styles.card}
              onPress={() => openExecution(execution.id)}
              testID={`tests-execution-card-${execution.id}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{execution.testCase.title}</Text>
                <StatusPill
                  status={execution.status}
                  label={statusLabel(t, execution.status)}
                />
              </View>
              <Text style={styles.cardMeta}>
                {t("tests.executions.cardCampaign").replace(
                  "{title}",
                  execution.campaign.title,
                )}
              </Text>
              <Text style={styles.cardMeta}>
                {formatDateTime(execution.executedAt, locale)}
              </Text>
              {execution.comment ? (
                <Text style={styles.cardComment} numberOfLines={2}>
                  {execution.comment}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: TestExecutionStatus;
  label: string;
}) {
  const palette = STATUS_PALETTE[status] ?? STATUS_PALETTE.TODO;
  return (
    <View style={[styles.statusPill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.statusPillText, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

const STATUS_PALETTE: Record<
  TestExecutionStatus,
  { bg: string; text: string }
> = {
  PASSED: { bg: "#E4F5EA", text: "#20744A" },
  FAILED: { bg: "#FBE3E1", text: "#B3261E" },
  BLOCKED: { bg: "#FFF3DD", text: "#9A6700" },
  SKIPPED: { bg: "#F1ECE7", text: colors.textSecondary },
  IN_PROGRESS: { bg: "#E4F5EA", text: "#20744A" },
  TODO: { bg: "#F1ECE7", text: colors.textSecondary },
};

function statusLabel(t: (key: string) => string, value: TestExecutionStatus) {
  switch (value) {
    case "PASSED":
      return t("tests.status.passed");
    case "FAILED":
      return t("tests.status.failed");
    case "BLOCKED":
      return t("tests.status.blocked");
    case "SKIPPED":
      return t("tests.status.skipped");
    case "IN_PROGRESS":
      return t("tests.status.inProgress");
    default:
      return t("tests.status.todo");
  }
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
  filtersRow: { flexDirection: "row", gap: 12 },
  filterCol: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  errorText: { fontSize: 14, color: colors.notification },
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
    borderColor: "#E8DCCD",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  cardComment: { fontSize: 13, color: colors.textPrimary, marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
});
