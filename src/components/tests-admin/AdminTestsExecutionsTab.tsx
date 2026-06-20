import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { testsAdminApi } from "../../api/tests-admin.api";
import { SelectField } from "./SelectField";
import type { AdminTestExecutionRow } from "../../types/tests-admin.types";
import type { TestExecutionStatus } from "../../types/tests.types";

export type AdminExecutionsFilter = {
  status: TestExecutionStatus | "";
  campaignId: string;
  testerId: string;
  reviewed: "" | "true" | "false";
};

export const EMPTY_EXECUTIONS_FILTER: AdminExecutionsFilter = {
  status: "",
  campaignId: "",
  testerId: "",
  reviewed: "",
};

type Props = {
  filter: AdminExecutionsFilter;
  onFilterChange: (filter: AdminExecutionsFilter) => void;
};

const STATUS_OPTIONS: TestExecutionStatus[] = [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "IN_PROGRESS",
  "TODO",
];

export function AdminTestsExecutionsTab({ filter, onFilterChange }: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<AdminTestExecutionRow[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([]);
  const [testers, setTesters] = useState<Array<{ id: string; fullName: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [campaignsResponse, testersResponse] = await Promise.all([
          testsAdminApi.listCampaigns(),
          testsAdminApi.listTesters(),
        ]);
        setCampaigns(campaignsResponse.items);
        setTesters(testersResponse.items);
      } catch {
        // les options de filtre sont secondaires, l'absence de chargement ne bloque pas la liste
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const response = await testsAdminApi.listExecutions({
          status: filter.status || undefined,
          campaignId: filter.campaignId || undefined,
          testerId: filter.testerId || undefined,
          reviewed:
            filter.reviewed === "" ? undefined : filter.reviewed === "true",
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
              : t("testsAdmin.common.errors.loadGeneric"),
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("testsAdmin.executions.filters.statusAll") },
      ...STATUS_OPTIONS.map((value) => ({
        value,
        label: statusLabel(t, value),
      })),
    ],
    [t],
  );

  const campaignOptions = useMemo(
    () => [
      { value: "", label: t("testsAdmin.executions.filters.campaignAll") },
      ...campaigns.map((campaign) => ({
        value: campaign.id,
        label: campaign.title,
      })),
    ],
    [campaigns, t],
  );

  const testerOptions = useMemo(
    () => [
      { value: "", label: t("testsAdmin.executions.filters.testerAll") },
      ...testers.map((tester) => ({ value: tester.id, label: tester.fullName })),
    ],
    [testers, t],
  );

  const reviewedOptions = [
    { value: "", label: t("testsAdmin.executions.filters.reviewedAll") },
    {
      value: "false",
      label: t("testsAdmin.executions.filters.reviewedPending"),
    },
    {
      value: "true",
      label: t("testsAdmin.executions.filters.reviewedDone"),
    },
  ];

  function openExecution(executionId: string) {
    router.push({
      pathname: "/(home)/admin-tests/executions/[executionId]",
      params: {
        executionId,
        status: filter.status,
        campaignId: filter.campaignId,
        testerId: filter.testerId,
        reviewed: filter.reviewed,
      },
    });
  }

  return (
    <View style={styles.container} testID="admin-tests-executions-tab">
      <View style={styles.filtersRow}>
        <View style={styles.filterCol}>
          <SelectField
            label={t("testsAdmin.executions.filters.status")}
            value={filter.status}
            options={statusOptions}
            onChange={(value) =>
              onFilterChange({ ...filter, status: value as TestExecutionStatus | "" })
            }
            placeholder={t("testsAdmin.executions.filters.statusAll")}
            closeLabel={t("testsAdmin.common.cancel")}
            testIDPrefix="admin-executions-filter-status"
          />
        </View>
        <View style={styles.filterCol}>
          <SelectField
            label={t("testsAdmin.executions.filters.reviewed")}
            value={filter.reviewed}
            options={reviewedOptions}
            onChange={(value) =>
              onFilterChange({
                ...filter,
                reviewed: value as AdminExecutionsFilter["reviewed"],
              })
            }
            placeholder={t("testsAdmin.executions.filters.reviewedAll")}
            closeLabel={t("testsAdmin.common.cancel")}
            testIDPrefix="admin-executions-filter-reviewed"
          />
        </View>
      </View>
      <View style={styles.filtersRow}>
        <View style={styles.filterCol}>
          <SelectField
            label={t("testsAdmin.executions.filters.campaign")}
            value={filter.campaignId}
            options={campaignOptions}
            onChange={(value) => onFilterChange({ ...filter, campaignId: value })}
            placeholder={t("testsAdmin.executions.filters.campaignAll")}
            closeLabel={t("testsAdmin.common.cancel")}
            testIDPrefix="admin-executions-filter-campaign"
          />
        </View>
        <View style={styles.filterCol}>
          <SelectField
            label={t("testsAdmin.executions.filters.tester")}
            value={filter.testerId}
            options={testerOptions}
            onChange={(value) => onFilterChange({ ...filter, testerId: value })}
            placeholder={t("testsAdmin.executions.filters.testerAll")}
            closeLabel={t("testsAdmin.common.cancel")}
            testIDPrefix="admin-executions-filter-tester"
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
            {t("testsAdmin.executions.emptyTitle")}
          </Text>
          <Text style={styles.emptyBody}>
            {t("testsAdmin.executions.emptyMessage")}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((execution) => (
            <TouchableOpacity
              key={execution.id}
              style={styles.card}
              onPress={() => openExecution(execution.id)}
              testID={`admin-execution-card-${execution.id}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{execution.testCase.title}</Text>
                <StatusPill status={execution.status} label={statusLabel(t, execution.status)} />
              </View>
              <Text style={styles.cardMeta}>
                {t("testsAdmin.executions.cardTester").replace(
                  "{name}",
                  execution.user.fullName,
                )}
              </Text>
              <Text style={styles.cardMeta}>
                {t("testsAdmin.executions.cardCampaign").replace(
                  "{title}",
                  execution.campaign.title,
                )}
              </Text>
              <Text style={styles.cardMeta}>
                {formatDateTime(execution.executedAt, locale)}
              </Text>
              <View
                style={[
                  styles.reviewBadge,
                  execution.adminReviewedAt
                    ? styles.reviewBadgeDone
                    : styles.reviewBadgePending,
                ]}
              >
                <Text style={styles.reviewBadgeText}>
                  {execution.adminReviewedAt
                    ? t("testsAdmin.executions.reviewedBadge")
                    : t("testsAdmin.executions.pendingBadge")}
                </Text>
              </View>
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
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  reviewBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  reviewBadgeDone: { backgroundColor: "#E4F5EA" },
  reviewBadgePending: { backgroundColor: "#FFF3DD" },
  reviewBadgeText: { fontSize: 11, fontWeight: "700", color: colors.textPrimary },
});
