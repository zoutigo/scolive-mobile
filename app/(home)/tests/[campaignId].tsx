import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppShell,
  useDrawer,
} from "../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { testsApi } from "../../../src/api/tests.api";
import { useAuthStore } from "../../../src/store/auth.store";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { colors } from "../../../src/theme";
import type {
  TestCampaignDetail,
  TestCasePriority,
  TestExecutionStatus,
} from "../../../src/types/tests.types";

export default function TestCampaignRoute() {
  return (
    <AppShell showHeader={false}>
      <TestCampaignScreen />
    </AppShell>
  );
}

function TestCampaignScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { openDrawer } = useDrawer();
  const { schoolSlug, user } = useAuthStore();
  const [campaign, setCampaign] = useState<TestCampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!schoolSlug || !campaignId) return;
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const response = await testsApi.getCampaign(schoolSlug, campaignId);
        setCampaign(response);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("tests.common.errors.loadGeneric"),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [campaignId, schoolSlug],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={campaign?.title ?? t("tests.title")}
        subtitle={
          campaign?.targetVersion
            ? t("tests.campaigns.targetVersion").replace(
                "{version}",
                campaign.targetVersion,
              )
            : t("tests.cases.subtitle")
        }
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={insets.top}
      />

      {!user?.isTester ? (
        <EmptyState
          title={t("tests.common.restrictedTitle")}
          message={t("tests.common.restrictedMessage")}
        />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage || !campaign ? (
        <EmptyState
          title={t("tests.common.errors.loadTitle")}
          message={errorMessage ?? t("tests.common.errors.loadGeneric")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void load(true)}
            />
          }
        >
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{campaign.title}</Text>
            {campaign.description ? (
              <Text style={styles.summaryBody}>{campaign.description}</Text>
            ) : null}
            <Text style={styles.summaryFoot}>
              {t("tests.campaigns.progressLabel")
                .replace("{done}", String(campaign.summary.completedCases))
                .replace("{total}", String(campaign.summary.totalCases))}
            </Text>
          </View>

          {campaign.testCases.map((testCase) => (
            <TouchableOpacity
              key={testCase.id}
              style={styles.caseCard}
              onPress={() =>
                router.push({
                  pathname: "/(home)/tests/cases/[testCaseId]",
                  params: { testCaseId: testCase.id },
                })
              }
            >
              <View style={styles.caseHeader}>
                <Text style={styles.caseTitle}>{testCase.title}</Text>
                <StatusPill
                  label={statusLabel(
                    t,
                    testCase.latestExecution?.status ?? null,
                  )}
                  tone={statusTone(testCase.latestExecution?.status ?? null)}
                />
              </View>
              {testCase.module ? (
                <Text style={styles.caseMeta}>{testCase.module}</Text>
              ) : null}
              <View style={styles.caseFooter}>
                <StatusPill
                  label={priorityLabel(t, testCase.priority)}
                  tone="neutral"
                />
                <Text style={styles.executionCount}>
                  {t("tests.cases.executionCount").replace(
                    "{count}",
                    String(testCase.totalExecutions),
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function EmptyState(props: { title: string; message: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons
        name="alert-circle-outline"
        size={42}
        color={colors.warmBorder}
      />
      <Text style={styles.emptyTitle}>{props.title}</Text>
      <Text style={styles.emptyBody}>{props.message}</Text>
    </View>
  );
}

function priorityLabel(t: (key: string) => string, value: TestCasePriority) {
  switch (value) {
    case "LOW":
      return t("tests.priority.low");
    case "HIGH":
      return t("tests.priority.high");
    case "CRITICAL":
      return t("tests.priority.critical");
    default:
      return t("tests.priority.medium");
  }
}

function statusLabel(
  t: (key: string) => string,
  status: TestExecutionStatus | null,
) {
  switch (status) {
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
    case "TODO":
      return t("tests.status.todo");
    default:
      return t("tests.status.notStarted");
  }
}

function statusTone(status: TestExecutionStatus | null) {
  switch (status) {
    case "PASSED":
      return "success" as const;
    case "FAILED":
      return "danger" as const;
    case "BLOCKED":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function StatusPill(props: {
  label: string;
  tone: "neutral" | "success" | "danger" | "warning";
}) {
  const palette =
    props.tone === "success"
      ? { bg: "#E4F5EA", text: "#20744A" }
      : props.tone === "danger"
        ? { bg: "#FCE8E6", text: "#B42318" }
        : props.tone === "warning"
          ? { bg: "#FFF3DD", text: "#9A6700" }
          : { bg: "#F1ECE7", text: colors.textSecondary };
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.text }]}>
        {props.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, gap: 12 },
  summaryCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    gap: 8,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  summaryBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  summaryFoot: { fontSize: 13, fontWeight: "600", color: colors.primary },
  caseCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EEE2D3",
    gap: 10,
  },
  caseHeader: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  caseTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  caseMeta: { fontSize: 13, color: colors.textSecondary },
  caseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  executionCount: { fontSize: 12, color: colors.textSecondary },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: { fontSize: 12, fontWeight: "700" },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
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
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
