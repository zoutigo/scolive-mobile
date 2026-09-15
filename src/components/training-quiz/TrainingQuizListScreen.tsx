import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppShell } from "../navigation/AppShell";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { PageHelpModal } from "../help/PageHelpModal";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { moduleBack } from "../../utils/moduleBack";
import { trainingQuizApi } from "../../api/training-quiz.api";
import { TrainingQuizIcon } from "./TrainingQuizIcon";
import { ProgressBar } from "./ProgressBar";
import type {
  QuizChapterSummary,
  QuizScoreSummary,
} from "../../types/training-quiz.types";

export function TrainingQuizListScreen() {
  return (
    <AppShell showHeader={false}>
      <TrainingQuizHomeScreen />
    </AppShell>
  );
}

function TrainingQuizHomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [chapters, setChapters] = useState<QuizChapterSummary[]>([]);
  const [score, setScore] = useState<QuizScoreSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const isInitialLoad = useRef(true);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const [chaptersData, scoreData] = await Promise.all([
        trainingQuizApi.listChapters(),
        trainingQuizApi.getScore(),
      ]);
      setChapters(chaptersData);
      setScore(scoreData);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t("trainingQuiz.errors.load"),
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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

  const inProgressChapters = chapters.filter(
    (chapter) =>
      chapter.solvedQuestions > 0 &&
      chapter.solvedQuestions < chapter.totalQuestions,
  );
  const otherChapters = chapters.filter(
    (chapter) =>
      chapter.solvedQuestions === 0 ||
      chapter.solvedQuestions >= chapter.totalQuestions,
  );

  const percent = score?.globalPercent ?? 0;
  const encouragement =
    score === null || score.solvedQuestions === 0
      ? t("trainingQuiz.score.encouragementEmpty")
      : percent >= 100
        ? t("trainingQuiz.score.encouragementDone")
        : t("trainingQuiz.score.encouragementProgress");

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("trainingQuiz.list.title")}
        subtitle={t("trainingQuiz.list.subtitle")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="training-quiz-header"
        helpAction={{
          label: t("trainingQuiz.help.menuLabel"),
          onPress: () => setHelpVisible(true),
          testID: "training-quiz-help-menu-item",
        }}
      />

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("trainingQuiz.list.title")}
        body={[t("trainingQuiz.list.subtitle")]}
        closeLabel={t("trainingQuiz.help.close")}
        testID="training-quiz-help-modal"
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage ? (
        <EmptyState
          icon="alert-circle-outline"
          title={t("trainingQuiz.errors.load")}
          message={errorMessage}
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
          <View style={styles.scoreCard} testID="training-quiz-score-card">
            <Text style={styles.scoreTitle}>
              {t("trainingQuiz.score.title")}
            </Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scorePercent}>{percent}%</Text>
              <View style={{ flex: 1 }}>
                <ProgressBar percent={percent} />
              </View>
            </View>
            <Text style={styles.scoreEncouragement}>{encouragement}</Text>
          </View>

          {chapters.length === 0 ? (
            <Text style={styles.emptyText}>{t("trainingQuiz.list.empty")}</Text>
          ) : (
            <>
              {inProgressChapters.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t("trainingQuiz.list.inProgressSection")}
                  </Text>
                  {inProgressChapters.map((chapter) => (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      t={t}
                      onOpen={() =>
                        router.push({
                          pathname: "/(home)/training-quiz/[chapterId]",
                          params: { chapterId: chapter.id },
                        })
                      }
                    />
                  ))}
                </View>
              ) : null}

              {otherChapters.length > 0 ? (
                <View style={styles.section}>
                  {inProgressChapters.length > 0 ? (
                    <Text style={styles.sectionTitle}>
                      {t("trainingQuiz.list.allChaptersSection")}
                    </Text>
                  ) : null}
                  {otherChapters.map((chapter) => (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      t={t}
                      onOpen={() =>
                        router.push({
                          pathname: "/(home)/training-quiz/[chapterId]",
                          params: { chapterId: chapter.id },
                        })
                      }
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ChapterCard({
  chapter,
  t,
  onOpen,
}: {
  chapter: QuizChapterSummary;
  t: (key: string) => string;
  onOpen: () => void;
}) {
  const percent =
    chapter.totalQuestions === 0
      ? 0
      : Math.round((chapter.solvedQuestions / chapter.totalQuestions) * 100);
  const inProgress = percent > 0 && percent < 100;
  const cta =
    percent >= 100
      ? t("trainingQuiz.list.completeCta")
      : inProgress
        ? t("trainingQuiz.list.continueCta")
        : t("trainingQuiz.list.startCta");

  return (
    <TouchableOpacity
      style={[styles.chapterCard, inProgress ? styles.chapterCardActive : null]}
      onPress={onOpen}
      testID={`training-quiz-chapter-card-${chapter.id}`}
    >
      <View style={styles.chapterHeaderRow}>
        <View
          style={[styles.chapterBadge, { backgroundColor: chapter.colorFrom }]}
        >
          <TrainingQuizIcon name={chapter.icon} size={20} />
        </View>
        <Text style={styles.chapterTitle} numberOfLines={1}>
          {chapter.title}
        </Text>
        {inProgress ? (
          <View style={styles.statusPillInProgress}>
            <Text style={styles.statusPillTextInProgress}>
              {t("trainingQuiz.list.statusInProgress")}
            </Text>
          </View>
        ) : percent >= 100 ? (
          <View style={styles.statusPillComplete}>
            <Text style={styles.statusPillTextComplete}>
              {t("trainingQuiz.list.statusComplete")}
            </Text>
          </View>
        ) : null}
        <Text style={styles.chapterPercent}>{percent}%</Text>
      </View>

      <Text style={styles.chapterDescription}>{chapter.description}</Text>

      <ProgressBar percent={percent} />

      <View style={styles.chapterFooterRow}>
        <Text style={styles.missionsCount}>
          {chapter.currentStage
            ? t("trainingQuiz.list.currentStageMissionsCount")
                .replace(
                  "{stage}",
                  t(
                    `trainingQuiz.chapter.stage.${chapter.currentStage.stage.toLowerCase()}`,
                  ),
                )
                .replace("{count}", String(chapter.currentStage.totalQuestions))
            : t("trainingQuiz.list.missionsCount").replace(
                "{count}",
                String(chapter.totalQuestions),
              )}
        </Text>
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>{cta}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={props.icon} size={42} color={colors.warmBorder} />
      <Text style={styles.emptyTitle}>{props.title}</Text>
      <Text style={styles.emptyBody}>{props.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, gap: 12 },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  scoreTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  scorePercent: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 56,
  },
  scoreEncouragement: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: { marginTop: 4, gap: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  chapterCard: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  chapterCardActive: {
    borderColor: colors.primary,
  },
  chapterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chapterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  chapterDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusPillInProgress: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#D5EDE8",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillTextInProgress: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  statusPillComplete: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#BFE0DA",
    backgroundColor: "#EAF5F3",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillTextComplete: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  chapterFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  missionsCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  ctaRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
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
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
