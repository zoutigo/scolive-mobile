import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppShell } from "../navigation/AppShell";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { moduleBack } from "../../utils/moduleBack";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { trainingQuizApi } from "../../api/training-quiz.api";
import { LevelIntro } from "./LevelIntro";
import { LevelComplete } from "./LevelComplete";
import { ConfettiBurst } from "./ConfettiBurst";
import { QuestionImage } from "./QuestionImage";
import type {
  QuizAnswerOption,
  QuizAnswerResult,
  QuizChapterDetail,
  QuizChapterSummary,
  QuizQuestion,
  QuizStage,
  QuizStageProgress,
} from "../../types/training-quiz.types";

const STAGE_ORDER: QuizStage[] = ["DISCOVERY", "PRACTICE", "MASTERY"];

// Cooldown (seconds) applied before "Retry" is re-enabled, indexed by the
// number of wrong attempts made so far on this question (a single honest
// mistake stays free). Steep past that — up to 8 minutes — to make random
// clicking through options a genuinely unattractive strategy.
const RETRY_COOLDOWN_SECONDS = [0, 120, 240, 480];

function retryCooldownFor(attemptsCount: number): number {
  const index = Math.min(
    Math.max(attemptsCount - 1, 0),
    RETRY_COOLDOWN_SECONDS.length - 1,
  );
  return RETRY_COOLDOWN_SECONDS[index];
}

function formatCooldown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}min ${String(seconds).padStart(2, "0")}s`;
}

function shuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let s = seed || 1;
  const random = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Maps a web-style `deepLinkRoute` (e.g. "/children/{childId}/notes") to the
// matching mobile expo-router target. Unknown/unresolvable routes return
// null so the CTA is simply hidden, same as the web behavior.
function resolveDeepLink(
  deepLinkRoute: string | null,
  childId: string | null,
): { pathname: string; params?: Record<string, string> } | null {
  if (!deepLinkRoute) return null;
  if (deepLinkRoute === "/messagerie") {
    return { pathname: "/messages" };
  }
  if (deepLinkRoute.includes("{childId}")) {
    if (!childId) return null;
    if (deepLinkRoute.endsWith("/notes")) {
      return {
        pathname: "/(home)/notes/child/[childId]",
        params: { childId },
      };
    }
    if (deepLinkRoute.endsWith("/discipline")) {
      return { pathname: "/(home)/discipline/[childId]", params: { childId } };
    }
  }
  return null;
}

export function TrainingQuizChapterScreen() {
  return (
    <AppShell showHeader={false}>
      <TrainingQuizChapterInner />
    </AppShell>
  );
}

function TrainingQuizChapterInner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ chapterId: string }>();
  const chapterId = params.chapterId;

  const schoolSlug = useAuthStore((state) => state.schoolSlug);
  const familyChildren = useFamilyStore((state) => state.children);
  const loadFamilyChildren = useFamilyStore((state) => state.loadChildren);
  const linkedChildId = familyChildren[0]?.id ?? null;

  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState<QuizChapterDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentLevel, setCurrentLevel] = useState<QuizStage>("DISCOVERY");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<QuizAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [attemptRound, setAttemptRound] = useState(0);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const [hasVisitedDeepLink, setHasVisitedDeepLink] = useState(false);
  const [showLevelIntro, setShowLevelIntro] = useState(false);
  const [startingLevel, setStartingLevel] = useState(false);
  const [levelJustCompleted, setLevelJustCompleted] =
    useState<QuizStageProgress | null>(null);
  const [nextModuleSuggestion, setNextModuleSuggestion] =
    useState<QuizChapterSummary | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (schoolSlug && familyChildren.length === 0) {
      void loadFamilyChildren(schoolSlug);
    }
  }, [schoolSlug, familyChildren.length, loadFamilyChildren]);

  const boot = useCallback(async () => {
    if (!chapterId) return;
    try {
      const data = await trainingQuizApi.getChapter(chapterId);
      setChapter(data);

      const firstUnfinishedLevel =
        data.levels.find(
          (level) =>
            level.unlocked &&
            level.totalQuestions > 0 &&
            level.solvedQuestions < level.totalQuestions,
        ) ?? data.levels.find((level) => level.totalQuestions > 0);
      const stage = firstUnfinishedLevel?.stage ?? "DISCOVERY";
      setCurrentLevel(stage);
      const levelQuestions = data.questions.filter((q) => q.stage === stage);
      const firstUnsolved = levelQuestions.findIndex((q) => !q.solved);
      setCurrentIndex(firstUnsolved === -1 ? 0 : firstUnsolved);
      setShowLevelIntro(
        data.levels.find((level) => level.stage === stage)?.introSeen === false,
      );
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("trainingQuiz.errors.load"),
      );
    } finally {
      setReady(true);
    }
  }, [chapterId]);

  useEffect(() => {
    void boot();
  }, [boot]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (cooldownTimer.current) clearInterval(cooldownTimer.current);
      };
    }, []),
  );

  const levelQuestions = useMemo(
    () => chapter?.questions.filter((q) => q.stage === currentLevel) ?? [],
    [chapter, currentLevel],
  );
  const question = levelQuestions[currentIndex] ?? null;
  const isLastInLevel = currentIndex === levelQuestions.length - 1;
  const isLastLevelWithQuestions = chapter
    ? STAGE_ORDER.filter(
        (s) => chapter.levels.find((l) => l.stage === s)?.totalQuestions,
      ).at(-1) === currentLevel
    : true;
  const isLast = isLastInLevel && isLastLevelWithQuestions;
  const isPracticeStage = question ? question.stage === "PRACTICE" : false;

  const displayedOptions: QuizAnswerOption[] = useMemo(() => {
    if (!question) return [];
    return shuffle(
      question.options,
      question.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) +
        attemptRound * 97,
    );
  }, [question, attemptRound]);

  const resolvedDeepLink = useMemo(
    () => resolveDeepLink(question?.deepLinkRoute ?? null, linkedChildId),
    [question, linkedChildId],
  );

  function startCooldown(seconds: number) {
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    if (seconds <= 0) {
      setCooldownSecondsLeft(0);
      return;
    }
    setCooldownSecondsLeft(seconds);
    cooldownTimer.current = setInterval(() => {
      setCooldownSecondsLeft((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function toggleOption(optionId: string) {
    if (result || !question) return;
    if (question.type === "MCQ_MULTI") {
      setSelected((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setSelected([optionId]);
    }
  }

  async function handleValidate() {
    if (!question || selected.length === 0) return;
    setSubmitting(true);
    try {
      const res = await trainingQuizApi.submitAnswer(question.id, selected);
      setResult(res);
      if (res.correct) {
        try {
          const fresh = await trainingQuizApi.getChapter(chapterId);
          setChapter(fresh);
        } catch {
          setChapter((prev) => {
            if (!prev) return prev;
            const questions = prev.questions.map((q) =>
              q.id === question.id ? { ...q, solved: true } : q,
            );
            const levels: QuizStageProgress[] = [];
            let previousLevelCleared = true;
            for (const stage of STAGE_ORDER) {
              const levelQs = questions.filter((q) => q.stage === stage);
              const totalQuestions = levelQs.length;
              const solvedQuestions = levelQs.filter((q) => q.solved).length;
              const prevLevel = prev.levels.find((l) => l.stage === stage);
              levels.push({
                stage,
                totalQuestions,
                solvedQuestions,
                unlocked: previousLevelCleared,
                objective: prevLevel?.objective ?? "",
                introSeen: prevLevel?.introSeen ?? false,
              });
              previousLevelCleared =
                totalQuestions > 0 && solvedQuestions === totalQuestions;
            }
            return {
              ...prev,
              solvedQuestions: question.solved
                ? prev.solvedQuestions
                : prev.solvedQuestions + 1,
              questions,
              levels,
            };
          });
        }
      } else {
        if (res.attemptsCount >= 2) {
          setHintOpen(true);
        }
        startCooldown(retryCooldownFor(res.attemptsCount));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetQuestionState() {
    setSelected([]);
    setResult(null);
    setHintOpen(false);
    setAttemptRound(0);
    setCooldownSecondsLeft(0);
    setHasVisitedDeepLink(false);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
  }

  function goToIndex(index: number) {
    setCurrentIndex(index);
    resetQuestionState();
  }

  function goToLevel(stage: QuizStage) {
    setCurrentLevel(stage);
    setCurrentIndex(0);
    resetQuestionState();
    setShowLevelIntro(
      chapter?.levels.find((level) => level.stage === stage)?.introSeen ===
        false,
    );
  }

  async function handleStartLevel() {
    if (!chapter) return;
    setStartingLevel(true);
    try {
      await trainingQuizApi.markLevelIntroSeen(chapter.id, currentLevel);
      setChapter((prev) =>
        prev
          ? {
              ...prev,
              levels: prev.levels.map((level) =>
                level.stage === currentLevel
                  ? { ...level, introSeen: true }
                  : level,
              ),
            }
          : prev,
      );
      setShowLevelIntro(false);
    } finally {
      setStartingLevel(false);
    }
  }

  async function handleLevelCompleteContinue() {
    const completedLevel = levelJustCompleted;
    setLevelJustCompleted(null);
    if (!completedLevel || !chapter) return;
    const nextLevel = STAGE_ORDER.slice(
      STAGE_ORDER.indexOf(completedLevel.stage) + 1,
    ).find((s) => chapter.levels.find((l) => l.stage === s)?.totalQuestions);
    if (nextLevel) {
      goToLevel(nextLevel);
      return;
    }
    try {
      const chapters = await trainingQuizApi.listChapters();
      const suggestion = chapters.find(
        (c) =>
          c.id !== chapter.id &&
          c.totalQuestions > 0 &&
          c.solvedQuestions < c.totalQuestions,
      );
      setNextModuleSuggestion(suggestion ?? null);
    } catch {
      setNextModuleSuggestion(null);
    }
    setFinished(true);
  }

  function handleRetry() {
    if (cooldownSecondsLeft > 0) return;
    if (isPracticeStage && !hasVisitedDeepLink) return;
    setResult(null);
    setSelected([]);
    setAttemptRound((prev) => prev + 1);
  }

  function handleNext() {
    if (!chapter) return;
    if (isLastInLevel) {
      const completedLevel = chapter.levels.find(
        (l) => l.stage === currentLevel,
      );
      if (completedLevel) {
        setLevelJustCompleted(completedLevel);
      }
      return;
    }
    goToIndex(currentIndex + 1);
  }

  if (!ready) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title={t("trainingQuiz.shellName")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !chapter) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title={t("trainingQuiz.shellName")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
        />
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error ?? t("trainingQuiz.errors.load")}
          </Text>
        </View>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title={chapter.title}
          onBack={() => router.replace("/(home)/training-quiz")}
          topInset={insets.top}
        />
        <ScrollView contentContainerStyle={styles.completeContainer}>
          <View
            style={styles.completeCard}
            testID="training-quiz-chapter-complete"
          >
            <ConfettiBurst />
            <View
              style={[
                styles.completeBadge,
                { backgroundColor: chapter.colorFrom },
              ]}
            >
              <Ionicons name="trophy" size={36} color={colors.white} />
            </View>
            <Text style={styles.completeTitle}>
              {t("trainingQuiz.chapter.completeTitle")}
            </Text>
            <Text style={styles.completeSubtitle}>
              {t("trainingQuiz.chapter.completeSubtitle")}
            </Text>
            <View style={styles.completeScorePill}>
              <Text style={styles.completeScoreText}>
                {t("trainingQuiz.chapter.completeScore").replace(
                  "{total}",
                  String(chapter.totalQuestions),
                )}
              </Text>
            </View>

            {nextModuleSuggestion ? (
              <View style={styles.nextModuleCard}>
                <Text style={styles.nextModuleLabel}>
                  {t("trainingQuiz.chapter.nextModuleLabel")}
                </Text>
                <Text style={styles.nextModuleTitle}>
                  {nextModuleSuggestion.title}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.primaryButtonFull,
                    { marginTop: 12, width: "100%" },
                  ]}
                  onPress={() =>
                    router.replace({
                      pathname: "/(home)/training-quiz/[chapterId]",
                      params: { chapterId: nextModuleSuggestion.id },
                    })
                  }
                >
                  <Text style={styles.primaryButtonText}>
                    {t("trainingQuiz.chapter.nextModuleCta")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.secondaryButtonFull,
                { marginTop: 14, width: "100%" },
                nextModuleSuggestion ? null : styles.primaryButtonFull,
              ]}
              onPress={() => router.replace("/(home)/training-quiz")}
            >
              <Text
                style={
                  nextModuleSuggestion
                    ? styles.secondaryButtonText
                    : styles.primaryButtonText
                }
              >
                {t("trainingQuiz.chapter.completeBackCta")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (levelJustCompleted) {
    const nextStage =
      STAGE_ORDER.slice(STAGE_ORDER.indexOf(levelJustCompleted.stage) + 1).find(
        (s) => chapter.levels.find((l) => l.stage === s)?.totalQuestions,
      ) ?? null;
    return (
      <View style={styles.root}>
        <ModuleHeader
          title={chapter.title}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
        />
        <ScrollView>
          <LevelComplete
            chapter={chapter}
            level={levelJustCompleted}
            nextStage={nextStage}
            onContinue={handleLevelCompleteContinue}
            onBackToHome={() => router.replace("/(home)/training-quiz")}
            t={t}
          />
        </ScrollView>
      </View>
    );
  }

  if (showLevelIntro) {
    const levelInfo = chapter.levels.find((l) => l.stage === currentLevel);
    if (levelInfo) {
      return (
        <View style={styles.root}>
          <ModuleHeader
            title={chapter.title}
            onBack={() => moduleBack(router)}
            topInset={insets.top}
          />
          <LevelIntro
            chapter={chapter}
            level={levelInfo}
            onStart={handleStartLevel}
            onBack={() => router.replace("/(home)/training-quiz")}
            starting={startingLevel}
            t={t}
          />
        </View>
      );
    }
  }

  if (!question) {
    return null;
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={chapter.title}
        subtitle={t("trainingQuiz.chapter.missionLabel")
          .replace("{current}", String(currentIndex + 1))
          .replace("{total}", String(levelQuestions.length))}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="training-quiz-chapter-header"
      />

      <ScrollView contentContainerStyle={styles.chapterScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.levelTabsScroll}
          contentContainerStyle={styles.levelTabsRow}
        >
          {chapter.levels.map((level) => {
            if (level.totalQuestions === 0) return null;
            const isCurrent = level.stage === currentLevel;
            const levelStageKey = level.stage.toLowerCase();
            return (
              <TouchableOpacity
                key={level.stage}
                disabled={!level.unlocked}
                onPress={() => level.unlocked && goToLevel(level.stage)}
                style={[
                  styles.levelTab,
                  !level.unlocked
                    ? styles.levelTabLocked
                    : isCurrent
                      ? styles.levelTabActive
                      : styles.levelTabInactive,
                ]}
              >
                {!level.unlocked ? (
                  <Ionicons
                    name="lock-closed"
                    size={12}
                    color={colors.textSecondary}
                  />
                ) : level.solvedQuestions === level.totalQuestions ? (
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={isCurrent ? colors.white : colors.textSecondary}
                  />
                ) : null}
                <Text
                  style={[
                    styles.levelTabText,
                    !level.unlocked
                      ? styles.levelTabTextLocked
                      : isCurrent
                        ? styles.levelTabTextActive
                        : styles.levelTabTextInactive,
                  ]}
                >
                  {t(`trainingQuiz.chapter.stage.${levelStageKey}`)}{" "}
                  {t("trainingQuiz.chapter.levelProgress")
                    .replace("{solved}", String(level.solvedQuestions))
                    .replace("{total}", String(level.totalQuestions))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.missionTrailScroll}
          contentContainerStyle={styles.missionTrailRow}
        >
          {levelQuestions.map((q: QuizQuestion, index) => {
            const isCurrent = index === currentIndex;
            return (
              <TouchableOpacity
                key={q.id}
                onPress={() => goToIndex(index)}
                style={[
                  styles.missionDot,
                  q.solved
                    ? styles.missionDotSolved
                    : isCurrent
                      ? styles.missionDotCurrent
                      : styles.missionDotDefault,
                ]}
              >
                {q.solved ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.missionDotText,
                      isCurrent ? { color: colors.primary } : null,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.questionCard}>
          {question.imageUrl ? (
            <QuestionImage imageUrl={question.imageUrl} />
          ) : null}

          <Text style={styles.questionText}>{question.text}</Text>

          {question.type === "MCQ_MULTI" ? (
            <Text style={styles.multiHint}>
              {t("trainingQuiz.chapter.multiHint")}
            </Text>
          ) : null}

          <View style={styles.optionsList}>
            {displayedOptions.map((option) => {
              const isSelected = selected.includes(option.id);
              const isCorrectOption = result?.correctOptionIds.includes(
                option.id,
              );
              let optionStyle = styles.optionDefault;
              if (result) {
                if (isCorrectOption) optionStyle = styles.optionCorrect;
                else if (isSelected && !isCorrectOption)
                  optionStyle = styles.optionIncorrect;
                else optionStyle = styles.optionDimmed;
              } else if (isSelected) {
                optionStyle = styles.optionSelected;
              }

              return (
                <TouchableOpacity
                  key={option.id}
                  disabled={!!result}
                  onPress={() => toggleOption(option.id)}
                  style={[styles.optionButton, optionStyle]}
                  testID={`training-quiz-option-${option.id}`}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  {result && isCorrectOption ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.accentTeal}
                    />
                  ) : result && isSelected && !isCorrectOption ? (
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.notification}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {question.stage !== "DISCOVERY" && question.hint ? (
            <View style={{ marginTop: 12 }}>
              {!result ? (
                <TouchableOpacity
                  onPress={() => setHintOpen((prev) => !prev)}
                  style={styles.hintToggle}
                >
                  <Ionicons
                    name="bulb-outline"
                    size={14}
                    color={colors.warmAccent}
                  />
                  <Text style={styles.hintToggleText}>
                    {hintOpen
                      ? t("trainingQuiz.chapter.hintHideCta")
                      : t("trainingQuiz.chapter.hintShowCta")}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {hintOpen ? (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>{question.hint}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {result ? (
            <View
              style={[
                styles.resultBox,
                result.correct
                  ? styles.resultBoxCorrect
                  : styles.resultBoxIncorrect,
              ]}
              testID="training-quiz-result"
            >
              <Text style={styles.resultTitle}>
                {result.correct
                  ? t("trainingQuiz.chapter.correctTitle")
                  : t("trainingQuiz.chapter.incorrectTitle")}
              </Text>
              <Text style={styles.resultExplanation}>{result.explanation}</Text>
              {!result.correct ? (
                <Text style={styles.resultHint}>
                  {isPracticeStage
                    ? t("trainingQuiz.chapter.findAnswerInApp")
                    : question.stage === "DISCOVERY"
                      ? t("trainingQuiz.chapter.discoveryRetryHint")
                      : result.attemptsCount >= 2
                        ? t("trainingQuiz.chapter.hintAutoSuggest")
                        : t("trainingQuiz.chapter.retryHint")}
                </Text>
              ) : null}

              <View style={styles.resultActions}>
                {result.correct ? (
                  <TouchableOpacity
                    style={styles.primaryButtonFull}
                    onPress={handleNext}
                    testID="training-quiz-next-button"
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLast
                        ? t("trainingQuiz.chapter.finish")
                        : t("trainingQuiz.chapter.next")}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.secondaryButtonFull,
                      cooldownSecondsLeft > 0 ||
                      (isPracticeStage && !hasVisitedDeepLink)
                        ? styles.buttonDisabled
                        : null,
                    ]}
                    disabled={
                      cooldownSecondsLeft > 0 ||
                      (isPracticeStage && !hasVisitedDeepLink)
                    }
                    onPress={handleRetry}
                    testID="training-quiz-retry-button"
                  >
                    <Text style={styles.secondaryButtonText}>
                      {cooldownSecondsLeft > 0
                        ? t("trainingQuiz.chapter.retryCooldown").replace(
                            "{time}",
                            formatCooldown(cooldownSecondsLeft),
                          )
                        : t("trainingQuiz.chapter.retry")}
                    </Text>
                  </TouchableOpacity>
                )}
                {resolvedDeepLink ? (
                  <TouchableOpacity
                    style={
                      !result.correct && isPracticeStage
                        ? styles.primaryButtonFull
                        : styles.ghostButtonFull
                    }
                    onPress={() => {
                      setHasVisitedDeepLink(true);
                      router.push(resolvedDeepLink as never);
                    }}
                    testID="training-quiz-deeplink-button"
                  >
                    {hasVisitedDeepLink ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={
                          !result.correct && isPracticeStage
                            ? colors.white
                            : colors.textPrimary
                        }
                        style={{ marginRight: 6 }}
                      />
                    ) : null}
                    <Text
                      style={
                        !result.correct && isPracticeStage
                          ? styles.primaryButtonText
                          : styles.ghostButtonText
                      }
                    >
                      {hasVisitedDeepLink
                        ? t("trainingQuiz.chapter.deepLinkVisited")
                        : t("trainingQuiz.chapter.deepLinkCta")}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {!result.correct &&
              isPracticeStage &&
              cooldownSecondsLeft === 0 &&
              !hasVisitedDeepLink ? (
                <Text style={styles.retryNeedsDeepLinkHint}>
                  {t("trainingQuiz.chapter.retryNeedsDeepLinkHint")}
                </Text>
              ) : null}
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryButtonFull,
                { marginTop: 14 },
                selected.length === 0 || submitting
                  ? styles.buttonDisabled
                  : null,
              ]}
              disabled={selected.length === 0 || submitting}
              onPress={handleValidate}
              testID="training-quiz-validate-button"
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {t("trainingQuiz.chapter.validate")}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: colors.notification, fontSize: 14, textAlign: "center" },
  chapterScroll: { padding: 16, gap: 10 },
  levelTabsScroll: { flexGrow: 0 },
  levelTabsRow: { gap: 8, paddingBottom: 4 },
  levelTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  levelTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  levelTabInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  levelTabLocked: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  levelTabText: { fontSize: 12, fontWeight: "700" },
  levelTabTextActive: { color: colors.white },
  levelTabTextInactive: { color: colors.textSecondary },
  levelTabTextLocked: { color: colors.textSecondary, opacity: 0.6 },
  missionTrailScroll: { flexGrow: 0 },
  missionTrailRow: { gap: 8, paddingBottom: 4 },
  missionDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  missionDotSolved: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  missionDotCurrent: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  missionDotDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  missionDotText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    shadowColor: "#1F2933",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
    color: colors.textPrimary,
  },
  multiHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  optionsList: { marginTop: 16, gap: 10 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionDefault: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: "#D5EDE8" },
  optionCorrect: { borderColor: colors.accentTeal, backgroundColor: "#EAF5F3" },
  optionIncorrect: {
    borderColor: colors.notification,
    backgroundColor: "#FBEAE8",
  },
  optionDimmed: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    opacity: 0.55,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
    color: colors.textPrimary,
  },
  hintToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  hintToggleText: { fontSize: 12, fontWeight: "700", color: colors.warmAccent },
  hintBox: {
    marginTop: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  hintText: { fontSize: 12, color: colors.textSecondary },
  resultBox: { marginTop: 12, borderRadius: 6, borderWidth: 1, padding: 12 },
  resultBoxCorrect: { backgroundColor: "#EAF5F3", borderColor: "#BFE0DA" },
  resultBoxIncorrect: {
    backgroundColor: colors.warmSurface,
    borderColor: colors.warmBorder,
  },
  resultTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  resultExplanation: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  resultHint: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
  resultActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  retryNeedsDeepLinkHint: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
  primaryButtonFull: {
    flexDirection: "row",
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  secondaryButtonFull: {
    flexDirection: "row",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  ghostButtonFull: {
    flexDirection: "row",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  buttonDisabled: { opacity: 0.5 },
  completeContainer: { padding: 16 },
  completeCard: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  completeBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  completeTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  completeSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },
  completeScorePill: {
    marginTop: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFE0DA",
    backgroundColor: "#EAF5F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  completeScoreText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  nextModuleCard: {
    marginTop: 16,
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#D5EDE8",
    padding: 14,
  },
  nextModuleLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.primary,
  },
  nextModuleTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
