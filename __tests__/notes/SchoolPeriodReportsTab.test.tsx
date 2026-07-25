import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import {
  SchoolPeriodReportsTab,
  type SchoolPeriodReportsHandle,
  type SchoolWideReportsStudent,
} from "../../src/components/notes/SchoolPeriodReportsTab";
import { useNotesStore } from "../../src/store/notes.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const LEVEL_6E = { id: "level-6e", code: "6E", label: "6ème" };
const LEVEL_5E = { id: "level-5e", code: "5E", label: "5ème" };

const CLASSROOM_6A = {
  id: "class-1",
  name: "6e A",
  schoolYear: { id: "y1", label: "2025-2026" },
  academicLevel: LEVEL_6E,
};
const CLASSROOM_6B = {
  id: "class-2",
  name: "6e B",
  schoolYear: { id: "y1", label: "2025-2026" },
  academicLevel: LEVEL_6E,
};
const CLASSROOM_5A = {
  id: "class-3",
  name: "5e A",
  schoolYear: { id: "y1", label: "2025-2026" },
  academicLevel: LEVEL_5E,
};

const STUDENTS: SchoolWideReportsStudent[] = [
  {
    id: "stu-1",
    firstName: "Lisa",
    lastName: "Ntamack",
    className: "6e A",
    classId: "class-1",
    academicLevelId: "level-6e",
  },
  {
    id: "stu-2",
    firstName: "Paul",
    lastName: "Abega",
    className: "6e B",
    classId: "class-2",
    academicLevelId: "level-6e",
  },
  {
    id: "stu-3",
    firstName: "Kevin",
    lastName: "Fouda",
    className: "5e A",
    classId: "class-3",
    academicLevelId: "level-5e",
  },
];

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
          evaluations: [],
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
      rank: 3,
      classSize: 24,
      appreciation: "Bon trimestre.",
      evaluations: [],
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
      "stu-3": [],
    },
    isLoadingStudentNotes: false,
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue([]),
    clearError: jest.fn(),
    ...overrides,
  } as never);
}

function baseProps(
  overrides: Partial<Parameters<typeof SchoolPeriodReportsTab>[0]> = {},
) {
  return {
    students: STUDENTS,
    classrooms: [CLASSROOM_6A, CLASSROOM_6B, CLASSROOM_5A] as never,
    schoolSlug: "college-vogt",
    bottomInset: 0,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
});

describe("Liste des élèves à l'échelle de l'école", () => {
  it("affiche tous les élèves des classes agrégées avec leur classe en face du nom", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    expect(screen.getByTestId("school-reports-row-stu-1")).toBeTruthy();
    expect(screen.getByTestId("school-reports-row-stu-2")).toBeTruthy();
    expect(screen.getByTestId("school-reports-row-stu-3")).toBeTruthy();
    expect(
      screen.getByTestId("school-reports-row-class-stu-1"),
    ).toHaveTextContent("6e A");
    expect(
      screen.getByTestId("school-reports-row-class-stu-2"),
    ).toHaveTextContent("6e B");
  });

  it("filtre par recherche de nom", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.changeText(
      screen.getByTestId("school-reports-search-input"),
      "Fouda",
    );

    expect(screen.getByTestId("school-reports-row-stu-3")).toBeTruthy();
    expect(screen.queryByTestId("school-reports-row-stu-1")).toBeNull();
    expect(screen.queryByTestId("school-reports-row-stu-2")).toBeNull();
  });

  it("affiche l'état vide quand aucun élève ne correspond aux filtres", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.changeText(
      screen.getByTestId("school-reports-search-input"),
      "Introuvable",
    );

    expect(screen.getByText("Aucun bulletin")).toBeTruthy();
  });
});

describe("Filtres niveau/classe (listes liées)", () => {
  it("ouvre le panneau de filtres avec les niveaux et classes disponibles", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.press(screen.getByTestId("school-reports-filter-toggle"));

    expect(
      screen.getByTestId("school-reports-filter-level-trigger"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("school-reports-filter-class-trigger"),
    ).toBeTruthy();
  });

  it("filtre les élèves par niveau sélectionné", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.press(screen.getByTestId("school-reports-filter-toggle"));
    fireEvent.press(screen.getByTestId("school-reports-filter-level-trigger"));
    fireEvent.press(
      screen.getByTestId(`school-reports-filter-level-option-${LEVEL_5E.id}`),
    );

    expect(screen.getByTestId("school-reports-row-stu-3")).toBeTruthy();
    expect(screen.queryByTestId("school-reports-row-stu-1")).toBeNull();
    expect(screen.queryByTestId("school-reports-row-stu-2")).toBeNull();
  });

  it("limite les classes proposées au niveau sélectionné", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.press(screen.getByTestId("school-reports-filter-toggle"));
    fireEvent.press(screen.getByTestId("school-reports-filter-level-trigger"));
    fireEvent.press(
      screen.getByTestId(`school-reports-filter-level-option-${LEVEL_6E.id}`),
    );

    fireEvent.press(screen.getByTestId("school-reports-filter-class-trigger"));
    expect(
      screen.getByTestId(
        `school-reports-filter-class-option-${CLASSROOM_6A.id}`,
      ),
    ).toBeTruthy();
    expect(
      screen.getByTestId(
        `school-reports-filter-class-option-${CLASSROOM_6B.id}`,
      ),
    ).toBeTruthy();
    expect(
      screen.queryByTestId(
        `school-reports-filter-class-option-${CLASSROOM_5A.id}`,
      ),
    ).toBeNull();
  });

  it("filtre les élèves par classe précise", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.press(screen.getByTestId("school-reports-filter-toggle"));
    fireEvent.press(screen.getByTestId("school-reports-filter-class-trigger"));
    fireEvent.press(
      screen.getByTestId(
        `school-reports-filter-class-option-${CLASSROOM_6B.id}`,
      ),
    );

    expect(screen.getByTestId("school-reports-row-stu-2")).toBeTruthy();
    expect(screen.queryByTestId("school-reports-row-stu-1")).toBeNull();
    expect(screen.queryByTestId("school-reports-row-stu-3")).toBeNull();
  });

  it("Reset ramène à la liste complète", () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.press(screen.getByTestId("school-reports-filter-toggle"));
    fireEvent.press(screen.getByTestId("school-reports-filter-class-trigger"));
    fireEvent.press(
      screen.getByTestId(
        `school-reports-filter-class-option-${CLASSROOM_6B.id}`,
      ),
    );
    expect(screen.queryByTestId("school-reports-row-stu-1")).toBeNull();

    fireEvent.press(screen.getByTestId("school-reports-filter-reset"));

    expect(screen.getByTestId("school-reports-row-stu-1")).toBeTruthy();
    expect(screen.getByTestId("school-reports-row-stu-2")).toBeTruthy();
    expect(screen.getByTestId("school-reports-row-stu-3")).toBeTruthy();
  });
});

describe("Détail du bulletin (lecture seule)", () => {
  it("ouvre le bulletin d'un élève sur un trimestre et affiche les matières sans édition possible", async () => {
    render(<SchoolPeriodReportsTab {...baseProps()} />);

    fireEvent.press(screen.getByTestId("school-reports-row-stu-1"));
    await flushAsync();

    fireEvent.press(screen.getByTestId("school-reports-bulletin-stu-1-TERM_1"));

    expect(await screen.findByTestId("school-reports-detail")).toBeTruthy();
    expect(
      screen.getByTestId("school-reports-subject-card-sub-1"),
    ).toBeTruthy();
    // Lecture seule : l'appréciation est affichée en texte, sans éditeur.
    expect(
      screen.getByTestId("school-reports-subject-sub-1-readonly"),
    ).toHaveTextContent("Bon trimestre.");
    expect(
      screen.queryByTestId("school-reports-subject-sub-1-display"),
    ).toBeNull();
  });

  it("notifie le parent via onDetailChange à l'ouverture et à la fermeture du détail", async () => {
    const onDetailChange = jest.fn();
    render(<SchoolPeriodReportsTab {...baseProps({ onDetailChange })} />);

    fireEvent.press(screen.getByTestId("school-reports-row-stu-1"));
    await flushAsync();
    fireEvent.press(screen.getByTestId("school-reports-bulletin-stu-1-TERM_1"));

    expect(onDetailChange).toHaveBeenCalledWith({
      studentName: "Ntamack Lisa",
      className: "6e A",
      term: "TERM_1",
    });

    fireEvent.press(screen.getByTestId("school-reports-subject-card-sub-1"));
  });

  it("expose goBackFromDetail pour fermer le détail depuis le header", async () => {
    const ref = React.createRef<SchoolPeriodReportsHandle>();
    render(<SchoolPeriodReportsTab ref={ref} {...baseProps()} />);

    expect(ref.current?.goBackFromDetail()).toBe(false);

    fireEvent.press(screen.getByTestId("school-reports-row-stu-1"));
    await flushAsync();
    fireEvent.press(screen.getByTestId("school-reports-bulletin-stu-1-TERM_1"));
    expect(await screen.findByTestId("school-reports-detail")).toBeTruthy();

    let consumed = false;
    act(() => {
      consumed = ref.current?.goBackFromDetail() ?? false;
    });
    expect(consumed).toBe(true);
    await waitFor(() => {
      expect(screen.getByTestId("school-reports-tab")).toBeTruthy();
    });
  });
});
