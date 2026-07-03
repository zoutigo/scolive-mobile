import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppShell } from "../../../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../../../src/components/navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../../../../../src/components/navigation/BottomTabBar";
import { testsApi } from "../../../../../src/api/tests.api";
import { useAuthStore } from "../../../../../src/store/auth.store";
import { useTranslation } from "../../../../../src/i18n/useTranslation";
import { colors } from "../../../../../src/theme";
import type {
  TestCaseDetail,
  TestExecutionStatus,
} from "../../../../../src/types/tests.types";
import { moduleBack } from "../../../../../src/utils/moduleBack";

export default function TestCaseRoute() {
  return (
    <AppShell showHeader={false}>
      <TestCaseScreen />
    </AppShell>
  );
}

function TestCaseScreen() {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { testCaseId } = useLocalSearchParams<{ testCaseId: string }>();
  const { user } = useAuthStore();
  const [detail, setDetail] = useState<TestCaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const load = useCallback(
    async (refresh = false) => {
      if (!testCaseId) return;
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const response = await testsApi.getTestCase(testCaseId);
        setDetail(response);
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
    [testCaseId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }
      void load(true);
    }, [load]),
  );

  const hasResults = (detail?.executions.length ?? 0) > 0;

  function openResults() {
    if (!detail || detail.executions.length === 0) return;
    router.push({
      pathname: "/(home)/tests/executions/[executionId]" as never,
      params: {
        executionId: detail.executions[0].id,
        campaignId: detail.campaign.id,
      },
    });
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("tests.title")}
        subtitle={detail?.campaign.title ?? t("tests.campaigns.subtitle")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="test-case-header"
      />

      {!user?.isTester ? (
        <CenteredMessage
          icon="lock-closed-outline"
          title={t("tests.common.restrictedTitle")}
          message={t("tests.common.restrictedMessage")}
        />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage || !detail ? (
        <CenteredMessage
          icon="alert-circle-outline"
          title={t("tests.common.errors.loadTitle")}
          message={errorMessage ?? t("tests.common.errors.loadGeneric")}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              hasResults && styles.scrollContentWithButton,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void load(true)}
              />
            }
          >
            <TestCaseHero
              campaignTitle={detail.campaign.title}
              testTitle={detail.title}
            />

            <SectionCard
              icon="flag-outline"
              title={t("tests.detail.objective")}
              value={detail.objective}
              noValue={t("tests.common.noValue")}
            />
            <SectionCard
              icon="key-outline"
              title={t("tests.detail.preconditions")}
              value={detail.preconditions}
              noValue={t("tests.common.noValue")}
            />
            <SectionCard
              icon="checkmark-circle-outline"
              title={t("tests.detail.expectedResult")}
              value={detail.expectedResult}
              noValue={t("tests.common.noValue")}
            />

            <View style={styles.card}>
              <CardHeader icon="list-outline" title={t("tests.detail.steps")} />
              {detail.steps.length === 0 ? (
                <Text style={styles.cardBody}>{t("tests.detail.noSteps")}</Text>
              ) : (
                detail.steps.map((step, index) => (
                  <Text key={`${index}-${step}`} style={styles.stepLine}>
                    {index + 1}. {step}
                  </Text>
                ))
              )}
            </View>

            <View style={styles.card}>
              <CardHeader
                icon="people-outline"
                title={t("tests.detail.completedBy")}
              />
              {detail.completedByUsers.length === 0 ? (
                <Text style={styles.cardBody}>
                  {t("tests.detail.noCompletedUsers")}
                </Text>
              ) : (
                detail.completedByUsers.map((entry) => (
                  <View key={entry.userId} style={styles.userRow}>
                    <Text style={styles.userName}>{entry.fullName}</Text>
                    <Text style={styles.userMeta}>
                      {statusLabel(t, entry.status)} ·{" "}
                      {formatDateTime(entry.executedAt, locale)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <CardHeader
                icon="time-outline"
                title={t("tests.detail.historyTitle")}
              />
              {detail.executions.length === 0 ? (
                <Text style={styles.cardBody}>
                  {t("tests.detail.historyEmpty")}
                </Text>
              ) : (
                detail.executions.map((execution) => (
                  <View key={execution.id} style={styles.historyCard}>
                    <Text style={styles.historyTitle}>
                      {execution.user.fullName} ·{" "}
                      {statusLabel(t, execution.status)}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {formatDateTime(execution.executedAt, locale)}
                    </Text>
                    {execution.resultText ? (
                      <Text style={styles.historyBody}>
                        {execution.resultText}
                      </Text>
                    ) : null}
                    {execution.comment ? (
                      <Text style={styles.historyComment}>
                        {execution.comment}
                      </Text>
                    ) : null}
                    <View style={styles.imageRow}>
                      {execution.attachments.map((attachment) => (
                        <Image
                          key={attachment.id}
                          source={{ uri: attachment.url }}
                          style={styles.previewImage}
                        />
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {hasResults ? (
            <View
              style={[
                styles.bottomBar,
                { paddingBottom: insets.bottom + BOTTOM_TAB_BAR_HEIGHT + 12 },
              ]}
            >
              <TouchableOpacity
                style={styles.viewResultsButton}
                onPress={openResults}
                testID="tests-view-results-btn"
              >
                <Ionicons name="list-outline" size={18} color={colors.white} />
                <Text style={styles.viewResultsText}>
                  {t("tests.detail.viewResults")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.fab,
              {
                bottom:
                  insets.bottom +
                  BOTTOM_TAB_BAR_HEIGHT +
                  (hasResults ? 80 : 24),
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/(home)/tests/cases/[testCaseId]/submit" as never,
                params: {
                  testCaseId,
                  evidenceRequired: detail.evidenceRequired ? "1" : "0",
                },
              })
            }
            testID="tests-fab-add"
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function TestCaseHero(props: { campaignTitle: string; testTitle: string }) {
  return (
    <View style={styles.heroContainer} testID="test-case-hero">
      <View style={[styles.heroDecor1, { backgroundColor: "#A05010" }]} />
      <View style={[styles.heroDecor2, { backgroundColor: "#A05010" }]} />
      <View style={styles.heroRow}>
        <View style={styles.heroIconWrap}>
          <Ionicons
            name="flask-outline"
            size={26}
            color="rgba(255,255,255,0.92)"
          />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {props.campaignTitle}
          </Text>
          <Text style={styles.heroSubtitle} numberOfLines={2}>
            {props.testTitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CenteredMessage(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.centerMessage}>
      <Ionicons name={props.icon} size={42} color={colors.warmBorder} />
      <Text style={styles.centerTitle}>{props.title}</Text>
      <Text style={styles.centerBody}>{props.message}</Text>
    </View>
  );
}

function CardHeader(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.cardHeaderRow}>
      <View style={styles.cardIconWrap}>
        <Ionicons name={props.icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.cardTitle}>{props.title}</Text>
    </View>
  );
}

function SectionCard(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | null;
  noValue: string;
}) {
  return (
    <View style={styles.card}>
      <CardHeader icon={props.icon} title={props.title} />
      <Text style={styles.cardBody}>
        {props.value?.trim() || props.noValue}
      </Text>
    </View>
  );
}

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
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  centerBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 12 },
  scrollContentWithButton: { paddingBottom: 160 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F4E9DE",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  cardBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  stepLine: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  userRow: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6DED5",
  },
  userName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  userMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  historyCard: {
    borderRadius: 14,
    backgroundColor: "#FBF7F2",
    padding: 12,
    gap: 8,
  },
  historyTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  historyMeta: { fontSize: 12, color: colors.textSecondary },
  historyBody: { fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  historyComment: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  previewImage: {
    width: 92,
    height: 92,
    borderRadius: 10,
    backgroundColor: "#EEE7DE",
  },
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  viewResultsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 14,
  },
  viewResultsText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  // Hero
  heroContainer: {
    backgroundColor: "#C0681A",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    overflow: "hidden",
  },
  heroDecor1: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 22,
    bottom: -40,
    right: -20,
    transform: [{ rotate: "30deg" }],
    opacity: 0.18,
  },
  heroDecor2: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 14,
    top: -18,
    right: 60,
    transform: [{ rotate: "20deg" }],
    opacity: 0.12,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroTextWrap: { flex: 1, gap: 3 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
