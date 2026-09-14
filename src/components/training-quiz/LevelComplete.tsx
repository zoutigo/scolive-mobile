import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { ConfettiBurst } from "./ConfettiBurst";
import type {
  QuizChapterDetail,
  QuizStage,
  QuizStageProgress,
} from "../../types/training-quiz.types";

const ENCOURAGEMENT_KEYS = [
  "trainingQuiz.levelComplete.encouragement.one",
  "trainingQuiz.levelComplete.encouragement.two",
  "trainingQuiz.levelComplete.encouragement.three",
  "trainingQuiz.levelComplete.encouragement.four",
];

function pickEncouragementKey(seed: string): string {
  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ENCOURAGEMENT_KEYS[hash % ENCOURAGEMENT_KEYS.length];
}

export function LevelComplete({
  chapter,
  level,
  nextStage,
  onContinue,
  onBackToHome,
  t,
}: {
  chapter: QuizChapterDetail;
  level: QuizStageProgress;
  nextStage: QuizStage | null;
  onContinue: () => void;
  onBackToHome: () => void;
  t: (key: string) => string;
}) {
  const stageKey = level.stage.toLowerCase();
  const encouragement = t(pickEncouragementKey(`${chapter.id}-${level.stage}`));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ConfettiBurst />

        <View style={styles.badge}>
          <Ionicons name="sparkles" size={40} color={colors.white} />
        </View>

        <Text style={styles.title}>
          {t("trainingQuiz.levelComplete.title").replace(
            "{stage}",
            t(`trainingQuiz.chapter.stage.${stageKey}`),
          )}
        </Text>
        <Text style={styles.chapterTitle}>{chapter.title}</Text>

        <View style={styles.scorePill}>
          <Text style={styles.scorePillText}>
            {t("trainingQuiz.levelComplete.scoreLabel")
              .replace("{solved}", String(level.solvedQuestions))
              .replace("{total}", String(level.totalQuestions))}
          </Text>
        </View>

        <Text style={styles.encouragement}>{encouragement}</Text>

        <Text style={styles.nextHint}>
          {nextStage
            ? t("trainingQuiz.levelComplete.nextLevelHint").replace(
                "{stage}",
                t(`trainingQuiz.chapter.stage.${nextStage.toLowerCase()}`),
              )
            : t("trainingQuiz.levelComplete.chapterAlmostDoneHint")}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onBackToHome}
            testID="training-quiz-level-complete-back"
          >
            <Text style={styles.secondaryButtonText}>
              {t("trainingQuiz.chapter.back")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onContinue}
            testID="training-quiz-level-complete-continue"
          >
            <Text style={styles.primaryButtonText}>
              {nextStage
                ? t("trainingQuiz.levelComplete.continueCta").replace(
                    "{stage}",
                    t(`trainingQuiz.chapter.stage.${nextStage.toLowerCase()}`),
                  )
                : t("trainingQuiz.levelComplete.finishChapterCta")}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={colors.white}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  chapterTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  scorePill: {
    marginTop: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BFE0DA",
    backgroundColor: "#EAF5F3",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scorePillText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  encouragement: {
    marginTop: 14,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: "center",
  },
  nextHint: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
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
    flexDirection: "row",
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
