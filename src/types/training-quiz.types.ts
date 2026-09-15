export type QuizQuestionType = "MCQ_SINGLE" | "MCQ_MULTI" | "TRUE_FALSE";
export type QuizStage = "DISCOVERY" | "PRACTICE" | "MASTERY";

export type QuizChapterCurrentStage = {
  stage: QuizStage;
  totalQuestions: number;
  solvedQuestions: number;
};

export type QuizChapterSummary = {
  id: string;
  moduleKey: string;
  order: number;
  icon: string;
  colorFrom: string;
  colorTo: string;
  title: string;
  description: string;
  totalQuestions: number;
  solvedQuestions: number;
  currentStage: QuizChapterCurrentStage | null;
};

export type QuizAnswerOption = { id: string; order: number; text: string };

export type QuizQuestion = {
  id: string;
  order: number;
  type: QuizQuestionType;
  stage: QuizStage;
  text: string;
  // Not populated for DISCOVERY questions.
  hint: string | null;
  imageUrl: string | null;
  deepLinkRoute: string | null;
  solved: boolean;
  attemptsCount: number;
  options: QuizAnswerOption[];
};

export type QuizStageProgress = {
  stage: QuizStage;
  totalQuestions: number;
  solvedQuestions: number;
  unlocked: boolean;
  objective: string;
  introSeen: boolean;
};

export type QuizChapterDetail = QuizChapterSummary & {
  levels: QuizStageProgress[];
  questions: QuizQuestion[];
};

export type QuizAnswerResult = {
  correct: boolean;
  alreadySolved: boolean;
  explanation: string;
  correctOptionIds: string[];
  attemptsCount: number;
};

export type QuizScoreSummary = {
  globalPercent: number;
  totalQuestions: number;
  solvedQuestions: number;
  chapters: Array<{
    chapterId: string;
    moduleKey: string;
    title: string;
    percent: number;
    totalQuestions: number;
    solvedQuestions: number;
  }>;
};
