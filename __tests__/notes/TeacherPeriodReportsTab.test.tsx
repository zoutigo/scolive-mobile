import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherPeriodReportsTab } from "../../src/components/notes/TeacherPeriodReportsTab";
import { useNotesStore } from "../../src/store/notes.store";
import type { CouncilDrafts } from "../../src/types/notes.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const TEACHER_CONTEXT = {
  class: { id: "c1", name: "6e A", schoolYearId: "y1" },
  subjects: [
    { id: "sub-1", name: "Mathématiques", branches: [] },
    { id: "sub-2", name: "Physique", branches: [] },
  ],
  evaluationTypes: [],
  students: [
    { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
    { id: "stu-2", firstName: "Paul", lastName: "Abega" },
  ],
};

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setupStore() {
  useNotesStore.setState({
    studentNotes: {
      "stu-1": [],
      "stu-2": [],
    },
    scoresVersion: 0,
    isLoadingStudentNotes: false,
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue([]),
    clearError: jest.fn(),
  } as never);
}

function baseProps(overrides: Partial<CouncilDrafts> = {}) {
  const onSaveAppreciation = jest.fn().mockResolvedValue(undefined);
  const onTermChange = jest.fn();
  return {
    teacherContext: TEACHER_CONTEXT,
    schoolSlug: "college-vogt",
    bottomInset: 0,
    term: "TERM_1" as const,
    onTermChange,
    drafts: overrides as CouncilDrafts,
    onSaveAppreciation,
    isSubmitting: false,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
});

describe("Liste des bulletins", () => {
  it("affiche les élèves triés alphabétiquement", async () => {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();

    expect(screen.getByTestId("teacher-reports-row-stu-2")).toBeTruthy();
    expect(screen.getByTestId("teacher-reports-row-stu-1")).toBeTruthy();
  });

  it("filtre la liste via la recherche", async () => {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-reports-search-input"),
      "Nta",
    );

    expect(screen.getByTestId("teacher-reports-row-stu-1")).toBeTruthy();
    expect(screen.queryByTestId("teacher-reports-row-stu-2")).toBeNull();
  });

  it("ouvre le panneau de filtre trimestre", async () => {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-reports-filter-toggle"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-reports-filter-panel")).toBeTruthy(),
    );
    expect(
      screen.getByTestId("teacher-reports-filter-term-TERM_2"),
    ).toBeTruthy();
  });

  it("applique le changement de trimestre via onTermChange", async () => {
    const props = baseProps();
    render(<TeacherPeriodReportsTab {...props} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-reports-filter-toggle"));
    fireEvent.press(screen.getByTestId("teacher-reports-filter-term-TERM_2"));
    fireEvent.press(screen.getByTestId("teacher-reports-filter-apply"));

    expect(props.onTermChange).toHaveBeenCalledWith("TERM_2");
  });

  it("affiche EmptyState quand la classe n'a pas d'élève", async () => {
    render(
      <TeacherPeriodReportsTab
        {...baseProps()}
        teacherContext={{ ...TEACHER_CONTEXT, students: [] }}
      />,
    );
    await flushAsync();

    expect(screen.getByText("Aucun bulletin")).toBeTruthy();
  });
});

describe("Détail bulletin + appréciations inline", () => {
  it("ouvre le bulletin d'un élève au tap", async () => {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-reports-detail")).toBeTruthy(),
    );
  });

  it("revient à la liste via le bouton retour", async () => {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-reports-detail")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-reports-detail-back"));

    expect(screen.getByTestId("teacher-reports-list")).toBeTruthy();
  });

  it("affiche l'appréciation générale existante", async () => {
    render(
      <TeacherPeriodReportsTab
        {...baseProps()}
        drafts={{
          "stu-1": {
            generalAppreciation: "Très bon élève",
            subjects: {},
          },
        }}
      />,
    );
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));

    expect(screen.getByText("Très bon élève")).toBeTruthy();
  });

  it("édite et sauvegarde l'appréciation générale inline", async () => {
    const props = baseProps();
    render(<TeacherPeriodReportsTab {...props} />);
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));

    fireEvent.press(screen.getByTestId("teacher-reports-general-display"));
    await waitFor(() =>
      expect(screen.getByTestId("teacher-reports-general-input")).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-reports-general-input"),
      "Excellent trimestre",
    );
    fireEvent.press(screen.getByTestId("teacher-reports-general-save"));

    await waitFor(() =>
      expect(props.onSaveAppreciation).toHaveBeenCalledWith("stu-1", {
        generalAppreciation: "Excellent trimestre",
      }),
    );
  });

  it("édite et sauvegarde l'appréciation d'une matière inline", async () => {
    const props = baseProps();
    render(<TeacherPeriodReportsTab {...props} />);
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));

    fireEvent.press(
      screen.getByTestId("teacher-reports-subject-sub-1-display"),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-reports-subject-sub-1-input"),
      ).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("teacher-reports-subject-sub-1-input"),
      "Bons progrès en calcul",
    );
    fireEvent.press(screen.getByTestId("teacher-reports-subject-sub-1-save"));

    await waitFor(() =>
      expect(props.onSaveAppreciation).toHaveBeenCalledWith("stu-1", {
        subject: { subjectId: "sub-1", value: "Bons progrès en calcul" },
      }),
    );
  });

  it("annule l'édition sans appeler onSaveAppreciation", async () => {
    const props = baseProps();
    render(<TeacherPeriodReportsTab {...props} />);
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));

    fireEvent.press(screen.getByTestId("teacher-reports-general-display"));
    fireEvent.changeText(
      screen.getByTestId("teacher-reports-general-input"),
      "Texte annulé",
    );
    fireEvent.press(screen.getByTestId("teacher-reports-general-cancel"));

    expect(screen.queryByTestId("teacher-reports-general-input")).toBeNull();
    expect(props.onSaveAppreciation).not.toHaveBeenCalled();
  });
});
