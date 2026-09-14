import { apiFetch } from "./client";
import type {
  QuizAnswerResult,
  QuizChapterDetail,
  QuizChapterSummary,
  QuizScoreSummary,
  QuizStage,
} from "../types/training-quiz.types";

export const trainingQuizApi = {
  async listChapters(): Promise<QuizChapterSummary[]> {
    return apiFetch<QuizChapterSummary[]>("/training-quiz/chapters", {}, true);
  },

  async getChapter(chapterId: string): Promise<QuizChapterDetail> {
    return apiFetch<QuizChapterDetail>(
      `/training-quiz/chapters/${chapterId}`,
      {},
      true,
    );
  },

  async submitAnswer(
    questionId: string,
    optionIds: string[],
  ): Promise<QuizAnswerResult> {
    return apiFetch<QuizAnswerResult>(
      `/training-quiz/questions/${questionId}/answer`,
      {
        method: "POST",
        body: JSON.stringify({ optionIds }),
      },
      true,
    );
  },

  async markLevelIntroSeen(chapterId: string, stage: QuizStage): Promise<void> {
    await apiFetch<{ ok: true }>(
      `/training-quiz/chapters/${chapterId}/levels/${stage}/intro-seen`,
      { method: "POST" },
      true,
    );
  },

  async getScore(): Promise<QuizScoreSummary> {
    return apiFetch<QuizScoreSummary>("/training-quiz/score", {}, true);
  },
};
