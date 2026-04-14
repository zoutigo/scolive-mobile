import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ClassNotesManagerScreen } from "../../src/components/notes/ClassNotesManagerScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useNotesStore } from "../../src/store/notes.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ classId: "class-1", schoolYearId: "y1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("ClassNotesManagerScreen", () => {
  async function flushAsyncEffects() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Valery",
        lastName: "Mbele",
        platformRoles: [],
        memberships: [{ schoolId: "s1", role: "TEACHER" }],
        profileCompleted: true,
        role: "TEACHER",
        activeRole: "TEACHER",
      },
    } as never);

    const teacherContext = {
      class: { id: "class-1", name: "6e A", schoolYearId: "y1" },
      subjects: [
        {
          id: "sub-1",
          name: "Mathématiques",
          branches: [{ id: "branch-1", name: "Algèbre" }],
        },
      ],
      evaluationTypes: [
        { id: "type-1", code: "COMP", label: "Composition", isDefault: true },
      ],
      students: [{ id: "stu-1", firstName: "Lisa", lastName: "Ntamack" }],
    };

    const evaluations = [
      {
        id: "eval-1",
        title: "Composition 1",
        description: "",
        coefficient: 2,
        maxScore: 20,
        term: "TERM_1",
        status: "PUBLISHED",
        scheduledAt: "2026-04-12T08:00:00.000Z",
        createdAt: "2026-04-10T08:00:00.000Z",
        updatedAt: "2026-04-10T08:00:00.000Z",
        subject: { id: "sub-1", name: "Mathématiques" },
        subjectBranch: { id: "branch-1", name: "Algèbre" },
        evaluationType: { id: "type-1", code: "COMP", label: "Composition" },
        attachments: [],
        _count: { scores: 1 },
      },
    ];

    const evaluationDetail = {
      ...evaluations[0],
      students: [
        {
          id: "stu-1",
          firstName: "Lisa",
          lastName: "Ntamack",
          score: 15,
          scoreStatus: "ENTERED",
          comment: "Très bien",
        },
      ],
    };

    useNotesStore.setState({
      teacherContext,
      evaluations,
      termReports: {
        TERM_1: {
          term: "TERM_1",
          status: "DRAFT",
          councilHeldAt: "2026-04-18T15:00:00.000Z",
          students: [
            {
              studentId: "stu-1",
              firstName: "Lisa",
              lastName: "Ntamack",
              generalAppreciation: "",
              subjects: [{ subjectId: "sub-1", appreciation: "" }],
            },
          ],
        },
        TERM_2: null,
        TERM_3: null,
      },
      isLoadingTeacherContext: false,
      isLoadingEvaluations: false,
      isLoadingEvaluationDetail: false,
      isLoadingTermReports: false,
      isSubmitting: false,
      errorMessage: null,
      loadTeacherContext: jest.fn().mockResolvedValue(teacherContext),
      loadEvaluations: jest.fn().mockResolvedValue([]),
      loadEvaluationDetail: jest.fn().mockResolvedValue(evaluationDetail),
      createEvaluation: jest.fn(),
      updateEvaluation: jest.fn(),
      saveScores: jest.fn(),
      loadTermReports: jest.fn().mockResolvedValue([
        {
          term: "TERM_1",
          status: "DRAFT",
          councilHeldAt: "2026-04-18T15:00:00.000Z",
          students: [
            {
              studentId: "stu-1",
              firstName: "Lisa",
              lastName: "Ntamack",
              generalAppreciation: "",
              subjects: [{ subjectId: "sub-1", appreciation: "" }],
            },
          ],
        },
      ]),
      saveTermReports: jest.fn(),
      clearError: jest.fn(),
    } as never);
  });

  it("affiche le header et la liste des évaluations", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsyncEffects();
    await waitFor(() => expect(screen.getByText("Composition 1")).toBeTruthy());

    expect(screen.getByTestId("class-notes-header")).toBeTruthy();
    expect(screen.getByText("6e A")).toBeTruthy();
    expect(screen.getByText("Composition 1")).toBeTruthy();
    expect(screen.getByTestId("class-notes-tab-evaluations")).toBeTruthy();
  });

  it("bascule vers la saisie quand on sélectionne une évaluation", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsyncEffects();
    await waitFor(() =>
      expect(screen.getByTestId("class-evaluation-row-eval-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-evaluation-row-eval-1"));
    await flushAsyncEffects();

    await waitFor(() => {
      expect(screen.getByText("Saisie des notes")).toBeTruthy();
      expect(screen.getByText("Ntamack Lisa")).toBeTruthy();
    });
  });

  it("déclenche le retour via le bouton back", async () => {
    render(<ClassNotesManagerScreen />);
    await flushAsyncEffects();
    await waitFor(() =>
      expect(screen.getByTestId("class-notes-back")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-notes-back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
