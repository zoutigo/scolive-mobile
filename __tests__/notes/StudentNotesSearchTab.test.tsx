import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StudentNotesSearchTab } from "../../src/components/notes/StudentNotesSearchTab";
import { useNotesStore } from "../../src/store/notes.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

// ─── Fixtures ────────────────────────────────────────────────────────────────
//
// Deux homonymes ("Fouda Kevin") dans deux classes différentes : c'est
// exactement le cas que la recherche multi-classes du school admin doit
// désambiguïser via `className`.

const STUDENTS_CROSS_CLASS = [
  { id: "stu-1", firstName: "Kevin", lastName: "Fouda", className: "6e A" },
  { id: "stu-2", firstName: "Kevin", lastName: "Fouda", className: "6e B" },
  { id: "stu-3", firstName: "Paul", lastName: "Abega", className: "5e A" },
];

const SUBJECTS = [
  { id: "sub-1", name: "Mathématiques" },
  { id: "sub-2", name: "Anglais" },
];

const makeSnapshot = (
  term: "TERM_1" | "TERM_2" | "TERM_3",
  avg: number | null,
) => ({
  term,
  label: "1er Trimestre",
  councilLabel: "",
  generatedAtLabel: "",
  generalAverage: { student: avg, class: avg, min: 8, max: 18 },
  sequences: [],
  subjects: [],
});

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setupStore(
  overrides: Partial<ReturnType<typeof useNotesStore.getState>> = {},
) {
  useNotesStore.setState({
    studentNotes: {
      "stu-1": [makeSnapshot("TERM_1", 14.5)],
      "stu-2": [makeSnapshot("TERM_1", 9)],
      "stu-3": [makeSnapshot("TERM_1", 12)],
    },
    isLoadingStudentNotes: false,
    errorMessage: null,
    loadStudentNotes: jest.fn().mockResolvedValue([]),
    clearError: jest.fn(),
    ...overrides,
  } as never);
}

const DEFAULT_PROPS = {
  students: STUDENTS_CROSS_CLASS,
  subjects: SUBJECTS,
  schoolSlug: "college-vogt",
  bottomInset: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  setupStore();
});

// ─── Désambiguïsation homonymes (school admin) ───────────────────────────────

describe("Désambiguïsation homonymes multi-classes", () => {
  it("affiche la classe sous le nom de chaque élève dans les résultats de recherche", async () => {
    render(<StudentNotesSearchTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-search-input"),
      "Fouda",
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-notes-search-result-stu-1"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-search-result-stu-2"),
      ).toBeTruthy();
    });
    expect(
      screen.getByTestId("teacher-notes-search-result-class-stu-1"),
    ).toHaveTextContent("6e A");
    expect(
      screen.getByTestId("teacher-notes-search-result-class-stu-2"),
    ).toHaveTextContent("6e B");
  });

  it("inclut la classe dans le libellé une fois l'élève sélectionné", async () => {
    render(<StudentNotesSearchTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-search-input"),
      "Fouda",
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-search-result-stu-2"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-notes-search-result-stu-2"));

    await waitFor(() =>
      expect(screen.getByTestId("teacher-notes-search-input").props.value).toBe(
        "Fouda Kevin • 6e B",
      ),
    );
  });

  it("ne montre pas de sous-texte classe quand className est absent (vue prof mono-classe)", async () => {
    render(
      <StudentNotesSearchTab
        {...DEFAULT_PROPS}
        students={STUDENTS_CROSS_CLASS.map((entry) => ({
          id: entry.id,
          firstName: entry.firstName,
          lastName: entry.lastName,
        }))}
      />,
    );
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("teacher-notes-search-input"),
      "Fouda",
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-notes-search-result-stu-1"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("teacher-notes-search-result-class-stu-1"),
    ).toBeNull();
  });
});

// ─── Filtre matière piloté par la prop `subjects` ────────────────────────────

describe("Filtre matière générique", () => {
  it("liste les matières fournies en prop, indépendamment d'un contexte de classe unique", async () => {
    render(<StudentNotesSearchTab {...DEFAULT_PROPS} />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("teacher-notes-filter-toggle"));

    await waitFor(() => {
      expect(
        screen.getByTestId("teacher-notes-filter-subject-sub-1"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("teacher-notes-filter-subject-sub-2"),
      ).toBeTruthy();
    });
  });
});

// ─── Chargement multi-classes (school admin) ─────────────────────────────────

describe("État de chargement", () => {
  it("affiche un indicateur de chargement tant que la liste école n'est pas prête", async () => {
    render(
      <StudentNotesSearchTab
        {...DEFAULT_PROPS}
        students={[]}
        isLoadingStudents
      />,
    );
    await flushAsync();

    expect(screen.getByTestId("teacher-notes-tab")).toBeTruthy();
    expect(screen.getByText("Chargement des élèves…")).toBeTruthy();
    expect(screen.queryByText("Aucun élève")).toBeNull();
  });

  it("affiche l'état vide une fois le chargement terminé sans élève", async () => {
    render(
      <StudentNotesSearchTab
        {...DEFAULT_PROPS}
        students={[]}
        isLoadingStudents={false}
      />,
    );
    await flushAsync();

    expect(screen.getByText("Aucun élève")).toBeTruthy();
  });
});
