import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TrainingQuizListScreen } from "../../src/components/training-quiz/TrainingQuizListScreen";
import { trainingQuizApi } from "../../src/api/training-quiz.api";

const mockPush = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  usePathname: () => "/(home)/training-quiz",
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
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
jest.mock("../../src/api/training-quiz.api");

const api = trainingQuizApi as jest.Mocked<typeof trainingQuizApi>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("TrainingQuizListScreen", () => {
  it("affiche le score global et les chapitres après chargement", async () => {
    api.listChapters.mockResolvedValue([
      {
        id: "chapter-1",
        moduleKey: "notes",
        order: 1,
        icon: "BookOpen",
        colorFrom: "#0C5FA8",
        colorTo: "#08467D",
        title: "Notes",
        description: "Suivez les notes de votre enfant.",
        totalQuestions: 4,
        solvedQuestions: 2,
        currentStage: {
          stage: "PRACTICE",
          totalQuestions: 2,
          solvedQuestions: 0,
        },
      },
      {
        id: "chapter-2",
        moduleKey: "messagerie",
        order: 2,
        icon: "MessageSquare",
        colorFrom: "#D89B5B",
        colorTo: "#B7793A",
        title: "Messagerie",
        description: "Échangez avec l'école.",
        totalQuestions: 3,
        solvedQuestions: 0,
        currentStage: {
          stage: "DISCOVERY",
          totalQuestions: 3,
          solvedQuestions: 0,
        },
      },
    ]);
    api.getScore.mockResolvedValue({
      globalPercent: 29,
      totalQuestions: 7,
      solvedQuestions: 2,
      chapters: [],
    });

    render(<TrainingQuizListScreen />);

    await waitFor(() => {
      expect(screen.getByText("Notes")).toBeTruthy();
    });
    expect(screen.getByText("29%")).toBeTruthy();
    expect(
      screen.getByTestId("training-quiz-chapter-card-chapter-2"),
    ).toBeTruthy();
    expect(screen.getByText("Reprendre où vous en étiez")).toBeTruthy();
    expect(screen.getByText("Pratique : 2 missions")).toBeTruthy();
    expect(screen.queryByText("4 missions")).toBeNull();
  });

  it("affiche le message vide quand aucun chapitre n'est disponible", async () => {
    api.listChapters.mockResolvedValue([]);
    api.getScore.mockResolvedValue({
      globalPercent: 0,
      totalQuestions: 0,
      solvedQuestions: 0,
      chapters: [],
    });

    render(<TrainingQuizListScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Aucun chapitre de formation n'est disponible pour votre rôle pour le moment.",
        ),
      ).toBeTruthy();
    });
  });

  it("navigue vers le détail du chapitre au clic", async () => {
    api.listChapters.mockResolvedValue([
      {
        id: "chapter-1",
        moduleKey: "notes",
        order: 1,
        icon: "BookOpen",
        colorFrom: "#0C5FA8",
        colorTo: "#08467D",
        title: "Notes",
        description: "Suivez les notes de votre enfant.",
        totalQuestions: 4,
        solvedQuestions: 0,
        currentStage: null,
      },
    ]);
    api.getScore.mockResolvedValue({
      globalPercent: 0,
      totalQuestions: 4,
      solvedQuestions: 0,
      chapters: [],
    });

    render(<TrainingQuizListScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("training-quiz-chapter-card-chapter-1"),
      ).toBeTruthy();
    });
    expect(screen.getByText("4 missions")).toBeTruthy();
    fireEvent.press(screen.getByTestId("training-quiz-chapter-card-chapter-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/training-quiz/[chapterId]",
      params: { chapterId: "chapter-1" },
    });
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    api.listChapters.mockRejectedValue(new Error("Erreur réseau"));
    api.getScore.mockResolvedValue({
      globalPercent: 0,
      totalQuestions: 0,
      solvedQuestions: 0,
      chapters: [],
    });

    render(<TrainingQuizListScreen />);

    await waitFor(() => {
      expect(screen.getByText("Erreur réseau")).toBeTruthy();
    });
  });
});
