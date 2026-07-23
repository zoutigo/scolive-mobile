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

const SNAPSHOT_TERM_1 = {
  term: "TERM_1" as const,
  label: "1er trimestre",
  councilLabel: "6e A • 1er trimestre",
  generatedAtLabel: "12/12/2025",
  generalAverage: { student: 14.5, class: 12.3, min: 6, max: 18 },
  sequences: [
    {
      sequence: "SEQ_1" as const,
      sequenceLabel: "Séquence 1",
      isFirstSeq: true,
      generalAverage: { student: 14, class: 12, min: 5, max: 17 },
      subjects: [
        {
          id: "sub-1",
          subjectLabel: "Mathématiques",
          teachers: ["M. Dupont"],
          coefficient: 4,
          studentAverage: 15,
          classAverage: 12,
          classMin: 5,
          classMax: 18,
          evaluations: [
            {
              id: "ev-1",
              label: "Contrôle 1",
              score: 15,
              maxScore: 20,
              recordedAt: "2025-10-01",
            },
          ],
        },
      ],
    },
  ],
  subjects: [
    {
      id: "sub-1",
      subjectLabel: "Mathématiques",
      teachers: ["M. Dupont"],
      coefficient: 4,
      studentAverage: 14.5,
      classAverage: 12,
      classMin: 5,
      classMax: 18,
      evaluations: [
        {
          id: "ev-1",
          label: "Contrôle 1",
          score: 15,
          maxScore: 20,
          recordedAt: "2025-10-01",
        },
      ],
    },
  ],
};

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setupStore(overrides: Record<string, unknown> = {}) {
  useNotesStore.setState({
    studentNotes: {
      "stu-1": [SNAPSHOT_TERM_1],
      "stu-2": [],
    },
    scoresVersion: 0,
    isLoadingStudentNotes: false,
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue([]),
    clearError: jest.fn(),
    ...overrides,
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

describe("Liste des élèves", () => {
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

describe("Accordéon des 3 bulletins", () => {
  it("déplie les 3 bulletins au tap sur un élève", async () => {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();

    expect(screen.queryByTestId("teacher-reports-bulletins-stu-1")).toBeNull();

    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));
    await flushAsync();

    expect(screen.getByTestId("teacher-reports-bulletins-stu-1")).toBeTruthy();
    expect(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_1"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_2"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_3"),
    ).toBeTruthy();
  });

  it("replie l'accordéon si on tape à nouveau sur l'élève", async () => {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));

    expect(screen.queryByTestId("teacher-reports-bulletins-stu-1")).toBeNull();
  });
});

describe("Détail bulletin + appréciations inline", () => {
  async function openDetail() {
    render(<TeacherPeriodReportsTab {...baseProps()} />);
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));
    await flushAsync();
    fireEvent.press(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_1"),
    );
    await flushAsync();
  }

  it("ouvre le bulletin complet au tap sur un bulletin", async () => {
    await openDetail();

    expect(screen.getByTestId("teacher-reports-detail")).toBeTruthy();
    expect(screen.getByTestId("notes-period-hero")).toBeTruthy();
    expect(
      screen.getByTestId("teacher-reports-subject-card-sub-1"),
    ).toBeTruthy();
  });

  it("informe le parent du changement de trimestre via onTermChange", async () => {
    const props = baseProps();
    render(<TeacherPeriodReportsTab {...props} />);
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));
    await flushAsync();
    fireEvent.press(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_2"),
    );

    expect(props.onTermChange).toHaveBeenCalledWith("TERM_2");
  });

  it("affiche les notes groupées par séquence avec la moyenne de séquence", async () => {
    await openDetail();

    expect(
      screen.getByTestId("teacher-reports-subject-sub-1-sequence-SEQ_1"),
    ).toBeTruthy();
    expect(screen.getByText("Séquence 1")).toBeTruthy();
  });

  it("revient à la liste (élève toujours déplié) via le bouton retour", async () => {
    await openDetail();

    fireEvent.press(screen.getByTestId("teacher-reports-detail-back"));

    expect(screen.getByTestId("teacher-reports-list")).toBeTruthy();
    expect(screen.getByTestId("teacher-reports-bulletins-stu-1")).toBeTruthy();
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
    await flushAsync();
    fireEvent.press(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_1"),
    );

    expect(screen.getByText("Très bon élève")).toBeTruthy();
  });

  it("édite et sauvegarde l'appréciation générale inline", async () => {
    const props = baseProps();
    render(<TeacherPeriodReportsTab {...props} />);
    await flushAsync();
    fireEvent.press(screen.getByTestId("teacher-reports-row-stu-1"));
    await flushAsync();
    fireEvent.press(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_1"),
    );

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
    await flushAsync();
    fireEvent.press(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_1"),
    );

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
    await flushAsync();
    fireEvent.press(
      screen.getByTestId("teacher-reports-bulletin-stu-1-TERM_1"),
    );

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
