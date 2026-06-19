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
import {
  type CampaignDisplayStatus,
  getCampaignDisplayStatus,
} from "../../../src/components/tests/testCampaignStatus";
import type {
  TestCampaignDetail,
  TestCasePriority,
  TestExecutionStatus,
} from "../../../src/types/tests.types";

const HERO_PALETTE: Record<CampaignDisplayStatus, string> = {
  IN_PROGRESS: colors.accentTeal,
  UPCOMING: colors.warmAccent,
  COMPLETED: colors.primary,
};

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
  const { user } = useAuthStore();
  const [campaign, setCampaign] = useState<TestCampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!campaignId) return;
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const response = await testsApi.getCampaign(campaignId);
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
    [campaignId],
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
          <CampaignHero campaign={campaign} t={t} />

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

function campaignStatusKey(status: CampaignDisplayStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "inProgress";
    case "UPCOMING":
      return "upcoming";
    default:
      return "completed";
  }
}

function CampaignHero({
  campaign,
  t,
}: {
  campaign: TestCampaignDetail;
  t: (key: string) => string;
}) {
  const status = getCampaignDisplayStatus(campaign);
  const heroColor = HERO_PALETTE[status];
  const total = campaign.summary.totalCases;
  const done = campaign.summary.completedCases;
  const progressRatio = total > 0 ? Math.min(1, done / total) : 0;

  return (
    <View
      style={[styles.heroCard, { backgroundColor: heroColor }]}
      testID="campaign-hero"
    >
      <View style={styles.heroStatusPill}>
        <Text style={styles.heroStatusPillText}>
          {t(`tests.campaigns.status.${campaignStatusKey(status)}`)}
        </Text>
      </View>
      <Text style={styles.heroTitle}>{campaign.title}</Text>
      {campaign.description ? (
        <Text style={styles.heroBody}>{campaign.description}</Text>
      ) : null}
      <View style={styles.heroProgressTrack}>
        <View
          style={[
            styles.heroProgressFill,
            { width: `${Math.round(progressRatio * 100)}%` },
          ]}
        />
      </View>
      <View style={styles.heroFootRow}>
        <Text style={styles.heroFoot}>
          {t("tests.campaigns.progressLabel")
            .replace("{done}", String(done))
            .replace("{total}", String(total))}
        </Text>
        {campaign.dueAt ? (
          <Text style={styles.heroFoot}>
            {t("tests.campaigns.dueLabel").replace(
              "{date}",
              new Intl.DateTimeFormat("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(campaign.dueAt)),
            )}
          </Text>
        ) : null}
      </View>
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
  heroCard: {
    padding: 20,
    borderRadius: 24,
    gap: 12,
  },
  heroStatusPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroStatusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: colors.white },
  heroBody: { fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,0.88)" },
  heroProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  heroProgressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  heroFootRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  heroFoot: { fontSize: 13, fontWeight: "600", color: colors.white },
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
