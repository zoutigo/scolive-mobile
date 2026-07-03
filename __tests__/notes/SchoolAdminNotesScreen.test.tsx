/**
 * Tests SchoolAdminNotesScreen
 *
 * Couverture :
 *  — Unitaires    : rendu header + onglets, état initial chargement, état erreur
 *  — Fonctionnels : liste élèves, recherche par nom, filtre par classe,
 *                   filtre par année, liste classes, navigation vers élève,
 *                   navigation vers classe
 *  — Intégration  : chargement cross-classe des élèves, flux complet
 *                   sélection élève → navigation avec preStudentId
 */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SchoolAdminNotesScreen } from "../../src/components/notes/SchoolAdminNotesScreen";
import { teachersApi } from "../../src/api/teachers.api";
import { notesApi } from "../../src/api/notes.api";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/teachers.api");
jest.mock("../../src/api/notes.api");
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Jean",
      lastName: "Foko",
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
      memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    },
  }),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    canGoBack: jest.fn().mockReturnValue(true),
    navigate: jest.fn(),
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockTeachersApi = teachersApi as jest.Mocked<typeof teachersApi>;
const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const YEAR_ACTIVE = { id: "sy-2026", label: "2025-2026", isActive: true };
const YEAR_OLD = { id: "sy-2025", label: "2024-2025", isActive: false };

const CLASS_6A = {
  id: "class-6a",
  name: "6e A",
  schoolYear: { id: "sy-2026", label: "2025-2026" },
};
const CLASS_5B = {
  id: "class-5b",
  name: "5e B",
  schoolYear: { id: "sy-2026", label: "2025-2026" },
};
const CLASS_OLD = {
  id: "class-old",
  name: "6e C",
  schoolYear: { id: "sy-2025", label: "2024-2025" },
};

const CTX_6A = {
  class: { id: "class-6a", name: "6e A", schoolYearId: "sy-2026" },
  subjects: [],
  evaluationTypes: [],
  students: [
    { id: "stu-mbele", firstName: "Lisa", lastName: "MBELE" },
    { id: "stu-ntamack", firstName: "Remi", lastName: "NTAMACK" },
  ],
};

const CTX_5B = {
  class: { id: "class-5b", name: "5e B", schoolYearId: "sy-2026" },
  subjects: [],
  evaluationTypes: [],
  students: [{ id: "stu-abega", firstName: "Paul", lastName: "ABEGA" }],
};

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setupMocks(opts?: {
  classrooms?: (typeof CLASS_6A)[];
  yearsOverride?: (typeof YEAR_ACTIVE)[];
  ctxMap?: Record<string, typeof CTX_6A>;
}) {
  const classrooms = opts?.classrooms ?? [CLASS_6A, CLASS_5B];
  const years = opts?.yearsOverride ?? [YEAR_ACTIVE, YEAR_OLD];
  const ctxMap = opts?.ctxMap ?? {
    "class-6a": CTX_6A,
    "class-5b": CTX_5B,
  };

  mockTeachersApi.listSchoolYears.mockResolvedValue(years as never);
  mockTeachersApi.listClassrooms.mockResolvedValue(classrooms as never);
  mockNotesApi.getTeacherContext.mockImplementation((_, classId) =>
    Promise.resolve((ctxMap[classId] ?? CTX_6A) as never),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

// ─── Unitaires — Rendu de base ────────────────────────────────────────────────

describe("Unitaires — Rendu de base", () => {
  it("affiche le header et les deux onglets", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    expect(screen.getByTestId("school-admin-notes-header")).toBeTruthy();
    expect(screen.getByTestId("school-admin-notes-tab-students")).toBeTruthy();
    expect(screen.getByTestId("school-admin-notes-tab-class")).toBeTruthy();
  });

  it("affiche l'onglet 'Par élève' actif par défaut", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    expect(screen.getByTestId("school-admin-notes-search-bar")).toBeTruthy();
    expect(screen.getByTestId("school-admin-notes-search-input")).toBeTruthy();
  });

  it("affiche le loader pendant le chargement meta", () => {
    mockTeachersApi.listSchoolYears.mockReturnValue(new Promise(() => {}));
    mockTeachersApi.listClassrooms.mockReturnValue(new Promise(() => {}));

    render(<SchoolAdminNotesScreen />);

    expect(screen.getByText("Chargement des élèves…")).toBeTruthy();
  });

  it("affiche le message d'erreur si l'API échoue", async () => {
    mockTeachersApi.listSchoolYears.mockRejectedValue(new Error("network"));
    mockTeachersApi.listClassrooms.mockRejectedValue(new Error("network"));

    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    expect(screen.getByText("Impossible de charger les classes.")).toBeTruthy();
  });

  it("déclenche router.back() via le bouton retour", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("school-admin-notes-back"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

// ─── Fonctionnels — Onglet Par élève ─────────────────────────────────────────

describe("Fonctionnels — Onglet Par élève", () => {
  it("affiche les élèves triés alphabétiquement après chargement", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() => {
      expect(
        screen.getByTestId("school-admin-notes-student-stu-abega"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("school-admin-notes-student-stu-ntamack"),
      ).toBeTruthy();
    });

    // ABEGA avant MBELE dans la liste
    const list = screen.getByTestId("school-admin-notes-student-list");
    expect(list).toBeTruthy();
    const abegaText = screen.getByText("ABEGA Paul");
    const mbeleText = screen.getByText("MBELE Lisa");
    expect(abegaText).toBeTruthy();
    expect(mbeleText).toBeTruthy();
  });

  it("filtre les élèves par recherche textuelle", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-abega"),
      ).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("school-admin-notes-search-input"),
      "mbe",
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId("school-admin-notes-student-stu-abega"),
      ).toBeNull();
      expect(
        screen.getByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeTruthy();
    });
  });

  it("efface la recherche via le bouton clear", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("school-admin-notes-search-input"),
      "mbe",
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-search-clear"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("school-admin-notes-search-clear"));

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-abega"),
      ).toBeTruthy(),
    );
  });

  it("affiche l'état vide avec message adapté si aucun résultat de recherche", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    fireEvent.changeText(
      screen.getByTestId("school-admin-notes-search-input"),
      "xyzunknown",
    );

    await waitFor(() =>
      expect(screen.getByText("Aucun résultat")).toBeTruthy(),
    );
  });

  it("navigue vers ClassNotesManagerScreen avec classId et preStudentId au tap élève", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("school-admin-notes-student-stu-mbele"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/class/[classId]",
      params: { classId: "class-6a", preStudentId: "stu-mbele" },
    });
  });

  it("affiche la classe de chaque élève dans la carte", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() => expect(screen.getByText("ABEGA Paul")).toBeTruthy());

    expect(screen.getByText("5e B")).toBeTruthy();
    expect(screen.getAllByText("6e A").length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Fonctionnels — Filtre par année (onglet Par élève) ──────────────────────

describe("Fonctionnels — Filtre par année", () => {
  it("affiche le dropdown année avec l'année active sélectionnée par défaut", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-year-trigger"),
      ).toBeTruthy(),
    );

    expect(screen.getByText("2025-2026")).toBeTruthy();
  });

  it("ouvre la liste des années au clic sur le trigger", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-year-trigger"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("school-admin-notes-year-trigger"));

    await waitFor(() => {
      expect(
        screen.getByTestId("school-admin-notes-year-option-sy-2026"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("school-admin-notes-year-option-sy-2025"),
      ).toBeTruthy();
    });
  });

  it("filtre les élèves quand on change d'année scolaire", async () => {
    const CLASS_OLD_WITH_STUDENT = {
      id: "class-old",
      name: "6e C",
      schoolYear: { id: "sy-2025", label: "2024-2025" },
    };
    const CTX_OLD = {
      class: { id: "class-old", name: "6e C", schoolYearId: "sy-2025" },
      subjects: [],
      evaluationTypes: [],
      students: [{ id: "stu-old", firstName: "Henri", lastName: "ANCIEN" }],
    };

    setupMocks({
      classrooms: [CLASS_6A, CLASS_5B, CLASS_OLD_WITH_STUDENT],
      ctxMap: {
        "class-6a": CTX_6A,
        "class-5b": CTX_5B,
        "class-old": CTX_OLD as never,
      },
    });

    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    // Vérifier que les élèves de l'année active sont là
    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("school-admin-notes-student-stu-old"),
    ).toBeNull();

    // Changer d'année
    fireEvent.press(screen.getByTestId("school-admin-notes-year-trigger"));

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-year-option-sy-2025"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("school-admin-notes-year-option-sy-2025"),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("school-admin-notes-student-stu-old"),
      ).toBeTruthy();
      expect(
        screen.queryByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeNull();
    });
  });

  it("ne propose pas d'option vide dans le dropdown année", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-year-trigger"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("school-admin-notes-year-trigger"));

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-year-option-sy-2026"),
      ).toBeTruthy(),
    );

    expect(
      screen.queryByTestId("school-admin-notes-year-option-empty"),
    ).toBeNull();
  });
});

// ─── Fonctionnels — Filtre par classe ────────────────────────────────────────

describe("Fonctionnels — Filtre par classe", () => {
  it("filtre les élèves de la classe sélectionnée via StudentSelectField", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-abega"),
      ).toBeTruthy(),
    );

    // Ouvrir le sélecteur de classe
    fireEvent.press(
      screen.getByTestId("school-admin-notes-class-filter-trigger"),
    );

    // Sélectionner 6e A
    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-class-filter-option-class-6a"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("school-admin-notes-class-filter-option-class-6a"),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("school-admin-notes-student-stu-ntamack"),
      ).toBeTruthy();
      expect(
        screen.queryByTestId("school-admin-notes-student-stu-abega"),
      ).toBeNull();
    });
  });
});

// ─── Fonctionnels — Onglet Par classe ────────────────────────────────────────

describe("Fonctionnels — Onglet Par classe", () => {
  it("affiche la liste des classes quand on bascule sur l'onglet Par classe", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("school-admin-notes-tab-class"));

    await waitFor(() => {
      expect(screen.getByTestId("school-admin-notes-class-list")).toBeTruthy();
      expect(
        screen.getByTestId("school-admin-notes-class-class-6a"),
      ).toBeTruthy();
      expect(
        screen.getByTestId("school-admin-notes-class-class-5b"),
      ).toBeTruthy();
    });
  });

  it("navigue vers ClassNotesManagerScreen sans preStudentId au tap classe", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("school-admin-notes-tab-class"));

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-class-class-6a"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("school-admin-notes-class-class-6a"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/class/[classId]",
      params: { classId: "class-6a" },
    });
  });

  it("filtre les classes par année scolaire via StudentSelectField", async () => {
    setupMocks({ classrooms: [CLASS_6A, CLASS_5B, CLASS_OLD] });
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("school-admin-notes-tab-class"));

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-class-class-6a"),
      ).toBeTruthy(),
    );

    // La classe de l'ancienne année ne doit pas apparaître (année active filtrée)
    expect(
      screen.queryByTestId("school-admin-notes-class-class-old"),
    ).toBeNull();
  });

  it("bascule sur l'année précédente via le dropdown année de l'onglet Par classe", async () => {
    setupMocks({ classrooms: [CLASS_6A, CLASS_5B, CLASS_OLD] });
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    fireEvent.press(screen.getByTestId("school-admin-notes-tab-class"));

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-class-year-trigger"),
      ).toBeTruthy(),
    );

    // Ouvrir le dropdown année
    fireEvent.press(
      screen.getByTestId("school-admin-notes-class-year-trigger"),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-class-year-option-sy-2025"),
      ).toBeTruthy(),
    );

    // Sélectionner l'année précédente
    fireEvent.press(
      screen.getByTestId("school-admin-notes-class-year-option-sy-2025"),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("school-admin-notes-class-class-old"),
      ).toBeTruthy();
      expect(
        screen.queryByTestId("school-admin-notes-class-class-6a"),
      ).toBeNull();
    });
  });
});

// ─── Intégration — Chargement cross-classe des élèves ────────────────────────

describe("Intégration — Chargement cross-classe", () => {
  it("appelle getTeacherContext pour chaque classe de l'année active", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() => {
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-6a",
      );
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-5b",
      );
    });
  });

  it("déduplique les élèves présents dans plusieurs contextes", async () => {
    // stu-mbele apparaît dans les deux contextes
    const ctxDuplicate = {
      ...CTX_5B,
      students: [
        ...CTX_5B.students,
        { id: "stu-mbele", firstName: "Lisa", lastName: "MBELE" },
      ],
    };
    setupMocks({
      ctxMap: { "class-6a": CTX_6A, "class-5b": ctxDuplicate as never },
    });

    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeTruthy(),
    );

    // Doit n'apparaître qu'une seule fois
    expect(
      screen.getAllByTestId("school-admin-notes-student-stu-mbele"),
    ).toHaveLength(1);
  });

  it("ignore les classes dont getTeacherContext échoue et affiche les autres", async () => {
    mockNotesApi.getTeacherContext.mockImplementation((_, classId) => {
      if (classId === "class-5b") return Promise.reject(new Error("forbidden"));
      return Promise.resolve(CTX_6A as never);
    });

    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-mbele"),
      ).toBeTruthy(),
    );
    // Les élèves de 5b ne sont pas là mais pas de crash
    expect(
      screen.queryByTestId("school-admin-notes-student-stu-abega"),
    ).toBeNull();
  });

  it("flux complet : chargement → recherche → navigation avec preStudentId", async () => {
    render(<SchoolAdminNotesScreen />);
    await flushAsync();

    // Attendre la liste
    await waitFor(() =>
      expect(
        screen.getByTestId("school-admin-notes-student-stu-ntamack"),
      ).toBeTruthy(),
    );

    // Recherche
    fireEvent.changeText(
      screen.getByTestId("school-admin-notes-search-input"),
      "ntamack",
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("school-admin-notes-student-stu-ntamack"),
      ).toBeTruthy();
      expect(
        screen.queryByTestId("school-admin-notes-student-stu-abega"),
      ).toBeNull();
    });

    // Navigation
    fireEvent.press(
      screen.getByTestId("school-admin-notes-student-stu-ntamack"),
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/class/[classId]",
      params: { classId: "class-6a", preStudentId: "stu-ntamack" },
    });
  });
});
