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

  const scrollRef = useRef<ScrollView>(null);
  const historyY = useRef(0);

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

  function scrollToResults() {
    scrollRef.current?.scrollTo({ y: historyY.current, animated: true });
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={detail?.title ?? t("tests.title")}
        subtitle={detail?.campaign.title ?? t("tests.detail.subtitle")}
        onBack={() => router.back()}
        topInset={insets.top}
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
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void load(true)}
              />
            }
          >
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.resultsButton}
                onPress={scrollToResults}
                testID="tests-view-results-btn"
              >
                <Ionicons
                  name="list-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.resultsButtonText}>
                  {t("tests.detail.viewResults")}
                </Text>
              </TouchableOpacity>
            </View>

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

            <View
              style={styles.card}
              onLayout={(event) => {
                historyY.current = event.nativeEvent.layout.y;
              }}
            >
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

          <TouchableOpacity
            style={styles.fab}
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
  actionsRow: { flexDirection: "row", justifyContent: "flex-end" },
  resultsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  resultsButtonText: { fontSize: 12, fontWeight: "700", color: colors.primary },
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24 + BOTTOM_TAB_BAR_HEIGHT,
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
});
