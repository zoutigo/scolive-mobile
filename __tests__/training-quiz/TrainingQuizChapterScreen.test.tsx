import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TrainingQuizChapterScreen } from "../../src/components/training-quiz/TrainingQuizChapterScreen";
import { trainingQuizApi } from "../../src/api/training-quiz.api";
import type { QuizChapterDetail } from "../../src/types/training-quiz.types";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({ chapterId: "chapter-1" }),
  usePathname: () => "/(home)/training-quiz/chapter-1",
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => callback(), [callback]);
  },
}));
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Awa",
        lastName: "Ngo",
        activeRole: "PARENT",
        role: "PARENT",
      },
      logout: jest.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock("../../src/store/family.store", () => ({
  useFamilyStore: jest.fn((selector?: (s: unknown) => unknown) => {
    const state = {
      children: [{ id: "child-1", firstName: "Ela", lastName: "Ngo" }],
      loadChildren: jest.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock("../../src/api/training-quiz.api");

const api = trainingQuizApi as jest.Mocked<typeof trainingQuizApi>;

function makeChapter(
  overrides: Partial<QuizChapterDetail> = {},
): QuizChapterDetail {
  return {
    id: "chapter-1",
    moduleKey: "notes",
    order: 1,
    icon: "BookOpen",
    colorFrom: "#0C5FA8",
    colorTo: "#08467D",
    title: "Notes",
    description: "Suivez les notes de votre enfant.",
    currentStage: null,
    totalQuestions: 1,
    solvedQuestions: 0,
    levels: [
      {
        stage: "DISCOVERY",
        totalQuestions: 1,
        solvedQuestions: 0,
        unlocked: true,
        objective: "Découvrez le module Notes.",
        introSeen: true,
      },
      {
        stage: "PRACTICE",
        totalQuestions: 0,
        solvedQuestions: 0,
        unlocked: false,
        objective: "",
        introSeen: false,
      },
      {
        stage: "MASTERY",
        totalQuestions: 0,
        solvedQuestions: 0,
        unlocked: false,
        objective: "",
        introSeen: false,
      },
    ],
    questions: [
      {
        id: "question-1",
        order: 1,
        type: "MCQ_SINGLE",
        stage: "DISCOVERY",
        text: "Où trouve-t-on les notes de son enfant ?",
        hint: null,
        imageUrl: null,
        deepLinkRoute: null,
        solved: false,
        attemptsCount: 0,
        options: [
          { id: "opt-correct", order: 1, text: "Onglet Notes" },
          { id: "opt-wrong", order: 2, text: "Onglet Messagerie" },
        ],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TrainingQuizChapterScreen", () => {
  it("affiche l'intro de niveau quand elle n'a pas encore été vue, puis démarre le niveau", async () => {
    const chapter = makeChapter({
      levels: [
        {
          stage: "DISCOVERY",
          totalQuestions: 1,
          solvedQuestions: 0,
          unlocked: true,
          objective: "Découvrez le module Notes.",
          introSeen: false,
        },
        {
          stage: "PRACTICE",
          totalQuestions: 0,
          solvedQuestions: 0,
          unlocked: false,
          objective: "",
          introSeen: false,
        },
        {
          stage: "MASTERY",
          totalQuestions: 0,
          solvedQuestions: 0,
          unlocked: false,
          objective: "",
          introSeen: false,
        },
      ],
    });
    api.getChapter.mockResolvedValue(chapter);
    api.markLevelIntroSeen.mockResolvedValue(undefined);

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("training-quiz-level-intro-start"),
      ).toBeTruthy();
    });
    expect(screen.getByText("Découvrez le module Notes.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("training-quiz-level-intro-start"));

    await waitFor(() => {
      expect(api.markLevelIntroSeen).toHaveBeenCalledWith(
        "chapter-1",
        "DISCOVERY",
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText("Où trouve-t-on les notes de son enfant ?"),
      ).toBeTruthy();
    });
  });

  it("valide une bonne réponse et termine le chapitre (dernier niveau)", async () => {
    const chapter = makeChapter();
    api.getChapter.mockResolvedValue(chapter);
    api.submitAnswer.mockResolvedValue({
      correct: true,
      alreadySolved: false,
      explanation: "Les notes sont visibles dans l'onglet Notes.",
      correctOptionIds: ["opt-correct"],
      attemptsCount: 1,
    });
    api.listChapters.mockResolvedValue([]);

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Où trouve-t-on les notes de son enfant ?"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-option-opt-correct"));
    fireEvent.press(screen.getByTestId("training-quiz-validate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("training-quiz-result")).toBeTruthy();
    });
    expect(screen.getByText("Bonne réponse !")).toBeTruthy();

    fireEvent.press(screen.getByTestId("training-quiz-next-button"));

    await waitFor(() => {
      expect(
        screen.getByTestId("training-quiz-level-complete-continue"),
      ).toBeTruthy();
    });

    fireEvent.press(
      screen.getByTestId("training-quiz-level-complete-continue"),
    );

    await waitFor(() => {
      expect(screen.getByTestId("training-quiz-chapter-complete")).toBeTruthy();
    });
  });

  it("applique un compte à rebours avant de réactiver Réessayer après une mauvaise réponse", async () => {
    jest.useFakeTimers();
    const chapter = makeChapter();
    api.getChapter.mockResolvedValue(chapter);
    api.submitAnswer.mockResolvedValue({
      correct: false,
      alreadySolved: false,
      explanation: "Ce n'est pas la bonne réponse.",
      correctOptionIds: [],
      attemptsCount: 2,
    });

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Où trouve-t-on les notes de son enfant ?"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-option-opt-wrong"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("training-quiz-validate-button"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("training-quiz-retry-button")).toBeTruthy();
    });
    expect(screen.getByText("Réessayer dans 2min 00s")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(120000);
    });

    expect(screen.getByText("Réessayer")).toBeTruthy();

    jest.useRealTimers();
  });

  it("affiche un message d'erreur si le chapitre ne charge pas", async () => {
    api.getChapter.mockRejectedValue(new Error("Chapitre introuvable"));

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(screen.getByText("Chapitre introuvable")).toBeTruthy();
    });
  });

  it("reprend directement sur la mission en cours d'un niveau déjà démarré, sans revenir à la première question", async () => {
    const chapter = makeChapter({
      levels: [
        {
          stage: "DISCOVERY",
          totalQuestions: 1,
          solvedQuestions: 1,
          unlocked: true,
          objective: "Découvrez le module Notes.",
          introSeen: true,
        },
        {
          stage: "PRACTICE",
          totalQuestions: 2,
          solvedQuestions: 1,
          unlocked: true,
          objective: "Entraînez-vous.",
          introSeen: true,
        },
        {
          stage: "MASTERY",
          totalQuestions: 0,
          solvedQuestions: 0,
          unlocked: false,
          objective: "",
          introSeen: false,
        },
      ],
      questions: [
        {
          id: "question-discovery",
          order: 1,
          type: "MCQ_SINGLE",
          stage: "DISCOVERY",
          text: "Où trouve-t-on les notes de son enfant ?",
          hint: null,
          imageUrl: null,
          deepLinkRoute: null,
          solved: true,
          attemptsCount: 1,
          options: [
            { id: "opt-correct", order: 1, text: "Onglet Notes" },
            { id: "opt-wrong", order: 2, text: "Onglet Messagerie" },
          ],
        },
        {
          id: "question-practice-1",
          order: 1,
          type: "MCQ_SINGLE",
          stage: "PRACTICE",
          text: "Question de pratique déjà résolue",
          hint: null,
          imageUrl: null,
          deepLinkRoute: null,
          solved: true,
          attemptsCount: 1,
          options: [
            { id: "opt-a", order: 1, text: "Réponse A" },
            { id: "opt-b", order: 2, text: "Réponse B" },
          ],
        },
        {
          id: "question-practice-2",
          order: 2,
          type: "MCQ_SINGLE",
          stage: "PRACTICE",
          text: "Question de pratique non résolue",
          hint: null,
          imageUrl: null,
          deepLinkRoute: null,
          solved: false,
          attemptsCount: 0,
          options: [
            { id: "opt-c", order: 1, text: "Réponse C" },
            { id: "opt-d", order: 2, text: "Réponse D" },
          ],
        },
      ],
    });
    api.getChapter.mockResolvedValue(chapter);

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(screen.getByText("Question de pratique non résolue")).toBeTruthy();
    });
    expect(screen.queryByText("Question de pratique déjà résolue")).toBeNull();
  });
});
