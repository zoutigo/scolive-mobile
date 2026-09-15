import { trainingQuizApi } from "../../src/api/training-quiz.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("trainingQuizApi", () => {
  it("liste les chapitres avec authentification", async () => {
    mockApiFetch.mockResolvedValueOnce([]);

    await trainingQuizApi.listChapters();

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/training-quiz/chapters",
      {},
      true,
    );
  });

  it("récupère le détail d'un chapitre", async () => {
    mockApiFetch.mockResolvedValueOnce({});

    await trainingQuizApi.getChapter("chapter-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/training-quiz/chapters/chapter-1",
      {},
      true,
    );
  });

  it("soumet une réponse avec les optionIds en JSON", async () => {
    mockApiFetch.mockResolvedValueOnce({
      correct: true,
      alreadySolved: false,
      explanation: "ok",
      correctOptionIds: ["opt-1"],
      attemptsCount: 1,
    });

    await trainingQuizApi.submitAnswer("question-1", ["opt-1"]);

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/training-quiz/questions/question-1/answer",
      { method: "POST", body: JSON.stringify({ optionIds: ["opt-1"] }) },
      true,
    );
  });

  it("marque une intro de niveau comme vue", async () => {
    mockApiFetch.mockResolvedValueOnce({ ok: true });

    await trainingQuizApi.markLevelIntroSeen("chapter-1", "PRACTICE");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/training-quiz/chapters/chapter-1/levels/PRACTICE/intro-seen",
      { method: "POST" },
      true,
    );
  });

  it("récupère le score global", async () => {
    mockApiFetch.mockResolvedValueOnce({
      globalPercent: 50,
      totalQuestions: 4,
      solvedQuestions: 2,
      chapters: [],
    });

    await trainingQuizApi.getScore();

    expect(mockApiFetch).toHaveBeenCalledWith("/training-quiz/score", {}, true);
  });
});
