import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { TrainingQuizIcon } from "./TrainingQuizIcon";
import type {
  QuizChapterDetail,
  QuizStage,
  QuizStageProgress,
} from "../../types/training-quiz.types";

const STAGE_ICONS: Record<QuizStage, keyof typeof Ionicons.glyphMap> = {
  DISCOVERY: "compass-outline",
  PRACTICE: "locate-outline",
  MASTERY: "sparkles-outline",
};

const STAGE_RULE_KEYS: Record<QuizStage, string[]> = {
  DISCOVERY: [
    "trainingQuiz.levelIntro.rules.discovery.retry",
    "trainingQuiz.levelIntro.rules.discovery.noHint",
    "trainingQuiz.levelIntro.rules.discovery.noReveal",
  ],
  PRACTICE: [
    "trainingQuiz.levelIntro.rules.practice.hint",
    "trainingQuiz.levelIntro.rules.practice.appVisit",
    "trainingQuiz.levelIntro.rules.practice.cooldown",
  ],
  MASTERY: [
    "trainingQuiz.levelIntro.rules.mastery.hint",
    "trainingQuiz.levelIntro.rules.mastery.reveal",
    "trainingQuiz.levelIntro.rules.mastery.cooldown",
  ],
};

export function LevelIntro({
  chapter,
  level,
  onStart,
  onBack,
  starting,
  t,
}: {
  chapter: QuizChapterDetail;
  level: QuizStageProgress;
  onStart: () => void;
  onBack: () => void;
  starting: boolean;
  t: (key: string) => string;
}) {
  const stageKey = level.stage.toLowerCase();
  const iconName = STAGE_ICONS[level.stage];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={[styles.badge, { backgroundColor: chapter.colorFrom }]}>
          <TrainingQuizIcon name={chapter.icon} size={30} />
        </View>

        <Text style={styles.chapterTitle}>{chapter.title}</Text>
        <View style={styles.stageTitleRow}>
          <Ionicons name={iconName} size={18} color={colors.primary} />
          <Text style={styles.stageTitle}>
            {t(`trainingQuiz.chapter.stage.${stageKey}`)}
          </Text>
        </View>

        <View style={[styles.section, styles.objectiveSection]}>
          <Text style={[styles.sectionLabel, { color: colors.accentTealDark }]}>
            {t("trainingQuiz.levelIntro.objectiveLabel")}
          </Text>
          <Text style={styles.sectionBody}>{level.objective}</Text>
        </View>

        <View style={[styles.section, styles.rulesSection]}>
          <Text style={[styles.sectionLabel, { color: colors.warmAccent }]}>
            {t("trainingQuiz.levelIntro.rulesLabel")}
          </Text>
          {STAGE_RULE_KEYS[level.stage].map((key) => (
            <View key={key} style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>{t(key)}</Text>
            </View>
          ))}
          <Text style={styles.questionsCount}>
            {t("trainingQuiz.levelIntro.questionsCount").replace(
              "{count}",
              String(level.totalQuestions),
            )}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onBack}
            testID="training-quiz-level-intro-back"
          >
            <Text style={styles.secondaryButtonText}>
              {t("trainingQuiz.chapter.back")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onStart}
            disabled={starting}
            testID="training-quiz-level-intro-start"
          >
            {starting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {level.solvedQuestions > 0
                  ? t("trainingQuiz.levelIntro.continueCta")
                  : t("trainingQuiz.levelIntro.startCta")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: "center",
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  chapterTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  stageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  stageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  section: {
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  objectiveSection: {
    backgroundColor: "#EAF5F3",
    borderColor: "#BFE0DA",
  },
  rulesSection: {
    backgroundColor: colors.warmSurface,
    borderColor: colors.warmBorder,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  ruleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.warmAccent,
    marginTop: 7,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  questionsCount: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
});
