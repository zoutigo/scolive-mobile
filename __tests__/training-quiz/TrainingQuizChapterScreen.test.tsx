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
import { useFamilyStore } from "../../src/store/family.store";
import { useAuthStore } from "../../src/store/auth.store";
import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";
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
function defaultAuthState() {
  return {
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
}
function defaultFamilyState() {
  return {
    children: [{ id: "child-1", firstName: "Ela", lastName: "Ngo" }] as Array<{
      id: string;
      firstName: string;
      lastName: string;
      classId?: string;
    }>,
    loadChildren: jest.fn(),
    clearChildren: jest.fn(),
  };
}
function defaultTeacherClassNavState() {
  return {
    classOptions: null as {
      schoolYears: unknown[];
      selectedSchoolYearId: string | null;
      classes: Array<{ classId: string }>;
    } | null,
    loadClassOptions: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
  };
}

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));
jest.mock("../../src/store/family.store", () => ({
  useFamilyStore: jest.fn(),
}));
jest.mock("../../src/store/teacher-class-nav.store", () => ({
  useTeacherClassNavStore: jest.fn(),
}));
jest.mock("../../src/api/training-quiz.api");

const api = trainingQuizApi as jest.Mocked<typeof trainingQuizApi>;

function mockAuthState(state: ReturnType<typeof defaultAuthState>) {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector?: (s: unknown) => unknown) =>
      selector ? selector(state) : state,
  );
}
function mockFamilyState(state: ReturnType<typeof defaultFamilyState>) {
  (useFamilyStore as unknown as jest.Mock).mockImplementation(
    (selector?: (s: unknown) => unknown) =>
      selector ? selector(state) : state,
  );
}
function mockTeacherClassNavState(
  state: ReturnType<typeof defaultTeacherClassNavState>,
) {
  (useTeacherClassNavStore as unknown as jest.Mock).mockImplementation(
    (selector?: (s: unknown) => unknown) =>
      selector ? selector(state) : state,
  );
}

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
  mockAuthState(defaultAuthState());
  mockFamilyState(defaultFamilyState());
  mockTeacherClassNavState(defaultTeacherClassNavState());
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

  it("résout le deep-link du module Devoirs vers l'écran natif classes/[classId]/homework", async () => {
    mockFamilyState({
      ...defaultFamilyState(),
      children: [
        {
          id: "child-1",
          firstName: "Ela",
          lastName: "Ngo",
          classId: "class-1",
        },
      ],
    });

    const chapter = makeChapter({
      moduleKey: "devoirs",
      questions: [
        {
          id: "question-1",
          order: 1,
          type: "MCQ_SINGLE",
          stage: "DISCOVERY",
          text: "Où consultez-vous les devoirs de votre enfant ?",
          hint: null,
          imageUrl: null,
          deepLinkRoute: "/children/{childId}/cahier-de-texte",
          solved: false,
          attemptsCount: 0,
          options: [
            { id: "opt-correct", order: 1, text: "Onglet Devoirs" },
            { id: "opt-wrong", order: 2, text: "Onglet Messagerie" },
          ],
        },
      ],
    });
    api.getChapter.mockResolvedValue(chapter);
    api.submitAnswer.mockResolvedValue({
      correct: true,
      alreadySolved: false,
      explanation: "Les devoirs sont visibles dans l'onglet Devoirs.",
      correctOptionIds: ["opt-correct"],
      attemptsCount: 1,
    });
    api.listChapters.mockResolvedValue([]);

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Où consultez-vous les devoirs de votre enfant ?"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-option-opt-correct"));
    fireEvent.press(screen.getByTestId("training-quiz-validate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("training-quiz-deeplink-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-deeplink-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/homework",
      params: { classId: "class-1", childId: "child-1" },
    });
  });

  it("résout le deep-link {classId} d'un enseignant vers l'écran natif de saisie des notes de sa classe", async () => {
    mockAuthState({
      ...defaultAuthState(),
      user: {
        id: "teacher-1",
        firstName: "Awa",
        lastName: "Ngo",
        activeRole: "TEACHER",
        role: "TEACHER",
      },
    });
    mockTeacherClassNavState({
      ...defaultTeacherClassNavState(),
      classOptions: {
        schoolYears: [],
        selectedSchoolYearId: null,
        classes: [{ classId: "class-6a" }],
      },
    });

    const chapter = makeChapter({
      moduleKey: "notes",
      questions: [
        {
          id: "question-1",
          order: 1,
          type: "MCQ_SINGLE",
          stage: "DISCOVERY",
          text: "Où saisissez-vous les notes de votre classe ?",
          hint: null,
          imageUrl: null,
          deepLinkRoute: "/classes/{classId}/notes",
          solved: false,
          attemptsCount: 0,
          options: [
            { id: "opt-correct", order: 1, text: "Onglet Notes" },
            { id: "opt-wrong", order: 2, text: "Onglet Messagerie" },
          ],
        },
      ],
    });
    api.getChapter.mockResolvedValue(chapter);
    api.submitAnswer.mockResolvedValue({
      correct: true,
      alreadySolved: false,
      explanation: "Les notes se saisissent dans l'onglet Notes.",
      correctOptionIds: ["opt-correct"],
      attemptsCount: 1,
    });
    api.listChapters.mockResolvedValue([]);

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Où saisissez-vous les notes de votre classe ?"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-option-opt-correct"));
    fireEvent.press(screen.getByTestId("training-quiz-validate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("training-quiz-deeplink-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-deeplink-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/notes",
      params: { classId: "class-6a" },
    });
  });

  it("résout le deep-link {classId} du module Emploi du temps vers l'écran natif d'agenda de classe", async () => {
    mockAuthState({
      ...defaultAuthState(),
      user: {
        id: "teacher-1",
        firstName: "Awa",
        lastName: "Ngo",
        activeRole: "TEACHER",
        role: "TEACHER",
      },
    });
    mockTeacherClassNavState({
      ...defaultTeacherClassNavState(),
      classOptions: {
        schoolYears: [],
        selectedSchoolYearId: null,
        classes: [{ classId: "class-6a" }],
      },
    });

    const chapter = makeChapter({
      moduleKey: "emploi-du-temps",
      questions: [
        {
          id: "question-1",
          order: 1,
          type: "MCQ_SINGLE",
          stage: "DISCOVERY",
          text: "Où gérez-vous les créneaux de votre classe ?",
          hint: null,
          imageUrl: null,
          deepLinkRoute: "/classes/{classId}/agenda",
          solved: false,
          attemptsCount: 0,
          options: [
            { id: "opt-correct", order: 1, text: "Onglet Emploi du temps" },
            { id: "opt-wrong", order: 2, text: "Onglet Messagerie" },
          ],
        },
      ],
    });
    api.getChapter.mockResolvedValue(chapter);
    api.submitAnswer.mockResolvedValue({
      correct: true,
      alreadySolved: false,
      explanation: "Les créneaux se gèrent dans l'onglet Emploi du temps.",
      correctOptionIds: ["opt-correct"],
      attemptsCount: 1,
    });
    api.listChapters.mockResolvedValue([]);

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(
        screen.getByText("Où gérez-vous les créneaux de votre classe ?"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-option-opt-correct"));
    fireEvent.press(screen.getByTestId("training-quiz-validate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("training-quiz-deeplink-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-deeplink-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/timetable",
      params: { classId: "class-6a" },
    });
  });

  it("résout le deep-link general /fil (sans {classId}) vers l'écran natif du fil d'actualité", async () => {
    const chapter = makeChapter({
      moduleKey: "fil",
      questions: [
        {
          id: "question-1",
          order: 1,
          type: "MCQ_SINGLE",
          stage: "DISCOVERY",
          text: "Où publiez-vous une information pour toute l'école ?",
          hint: null,
          imageUrl: null,
          deepLinkRoute: "/fil",
          solved: false,
          attemptsCount: 0,
          options: [
            { id: "opt-correct", order: 1, text: "Le fil général de l'école" },
            { id: "opt-wrong", order: 2, text: "La messagerie" },
          ],
        },
      ],
    });
    api.getChapter.mockResolvedValue(chapter);
    api.submitAnswer.mockResolvedValue({
      correct: true,
      alreadySolved: false,
      explanation: "Le fil général de l'école.",
      correctOptionIds: ["opt-correct"],
      attemptsCount: 1,
    });
    api.listChapters.mockResolvedValue([]);

    render(<TrainingQuizChapterScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Où publiez-vous une information pour toute l'école ?",
        ),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-option-opt-correct"));
    fireEvent.press(screen.getByTestId("training-quiz-validate-button"));

    await waitFor(() => {
      expect(screen.getByTestId("training-quiz-deeplink-button")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("training-quiz-deeplink-button"));

    expect(mockPush).toHaveBeenCalledWith({ pathname: "/(home)/feed" });
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
