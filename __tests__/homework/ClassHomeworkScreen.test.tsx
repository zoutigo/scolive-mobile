import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ClassHomeworkScreen } from "../../src/components/homework/ClassHomeworkScreen";
import { useHomeworkStore } from "../../src/store/homework.store";
import { homeworkApi } from "../../src/api/homework.api";
import { notesApi } from "../../src/api/notes.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { translate } from "../../src/i18n/useTranslation";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/homework.api");
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/store/auth.store");
jest.mock("../../src/store/family.store");
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

// DatePickerField : appuyer déclenche onChange avec une date fixe de test.
jest.mock("../../src/components/DatePickerField", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    DatePickerField: ({
      value,
      onChange,
      testID,
    }: {
      value: string;
      onChange: (v: string) => void;
      testID?: string;
    }) => (
      <TouchableOpacity testID={testID} onPress={() => onChange("2099-06-01")}>
        <Text testID={testID ? `${testID}-value` : undefined}>
          {value || "date-vide"}
        </Text>
      </TouchableOpacity>
    ),
  };
});

// TimePickerField : appuyer déclenche onChange avec une heure fixe de test.
jest.mock("../../src/components/TimePickerField", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    TimePickerField: ({
      value,
      onChange,
      testID,
    }: {
      value: string;
      onChange: (v: string) => void;
      testID?: string;
    }) => (
      <TouchableOpacity testID={testID} onPress={() => onChange("09:00")}>
        <Text testID={testID ? `${testID}-value` : undefined}>
          {value || "heure-vide"}
        </Text>
      </TouchableOpacity>
    ),
  };
});

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseFamilyStore = useFamilyStore as jest.MockedFunction<
  typeof useFamilyStore
>;
const mockHomeworkApi = homeworkApi as jest.Mocked<typeof homeworkApi>;
const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;

const TEACHER_USER = {
  id: "teacher-1",
  firstName: "Valery",
  lastName: "Mbele",
  role: "TEACHER" as const,
  activeRole: "TEACHER" as const,
  schoolName: "Collège Vogt",
  platformRoles: [] as never[],
  memberships: [{ schoolId: "school-1", role: "TEACHER" as const }],
  profileCompleted: true,
};

const PARENT_USER = {
  id: "parent-1",
  firstName: "Robert",
  lastName: "Ntamack",
  role: "PARENT" as const,
  activeRole: "PARENT" as const,
  schoolName: "Collège Vogt",
  platformRoles: [] as never[],
  memberships: [{ schoolId: "school-1", role: "PARENT" as const }],
  profileCompleted: true,
};

const CHILD_RECORD = {
  id: "child-1",
  firstName: "Lisa",
  lastName: "Mbele",
  classId: "class-1",
  className: "6e C",
};

const BASE_HOMEWORK = {
  id: "hw-1",
  classId: "class-1",
  title: "Exercices 1 à 3",
  contentHtml: "<p>Faire le travail</p>",
  expectedAt: "2099-05-10T18:00:00.000Z",
  createdAt: "2099-05-09T08:00:00.000Z",
  updatedAt: "2099-05-09T08:00:00.000Z",
  authorUserId: "teacher-1",
  authorDisplayName: "Mme Mbele",
  subject: { id: "math", name: "Mathématiques", colorHex: "#2563EB" },
  attachments: [],
  commentsCount: 2,
  summary: { totalStudents: 12, doneStudents: 3, pendingStudents: 9 },
  myDoneAt: null,
};

const BASE_DETAIL = {
  ...BASE_HOMEWORK,
  comments: [
    {
      id: "comment-1",
      authorUserId: "teacher-1",
      authorDisplayName: "Mme Mbele",
      body: "Commencez par relire la leçon.",
      createdAt: "2026-05-02T10:00:00.000Z",
      updatedAt: "2026-05-02T10:00:00.000Z",
    },
  ],
  completionStatuses: [
    {
      studentId: "student-1",
      firstName: "Ariane",
      lastName: "Mebe",
      doneAt: "2026-05-02T17:10:00.000Z",
    },
  ],
};

const CLASS_CONTEXT = {
  class: {
    id: "class-1",
    name: "6e A",
    schoolId: "school-1",
    schoolYearId: "sy-1",
    academicLevelId: null,
    curriculumId: null,
    referentTeacherUserId: "teacher-1",
  },
  allowedSubjects: [],
  assignments: [
    {
      teacherUserId: "teacher-1",
      subjectId: "math",
      subject: { id: "math", name: "Mathématiques" },
      teacherUser: { id: "teacher-1", firstName: "Valery", lastName: "Mbele" },
    },
  ],
  subjectStyles: [{ subjectId: "math", colorHex: "#2563EB" }],
  schoolYears: [{ id: "sy-1", label: "2025-2026", isActive: true }],
  selectedSchoolYearId: "sy-1",
};

const MY_TIMETABLE = {
  student: { id: "child-1", firstName: "Lisa", lastName: "Mbele" },
  class: {
    id: "class-1",
    name: "6e C",
    schoolYearId: "sy-1",
    academicLevelId: null,
  },
  slots: [],
  oneOffSlots: [],
  slotExceptions: [],
  occurrences: [],
  calendarEvents: [],
  subjectStyles: [],
};

function setupTeacher() {
  mockUseAuthStore.mockReturnValue({
    schoolSlug: "college-vogt",
    user: TEACHER_USER,
  } as never);
  mockUseFamilyStore.mockReturnValue({
    children: [],
    activeChildId: null,
  } as never);
}

function setupParent() {
  mockUseAuthStore.mockReturnValue({
    schoolSlug: "college-vogt",
    user: PARENT_USER,
  } as never);
  mockUseFamilyStore.mockReturnValue({
    children: [CHILD_RECORD],
    activeChildId: "child-1",
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  useHomeworkStore.getState().reset();

  mockTimetableApi.getClassContext.mockResolvedValue(CLASS_CONTEXT);
  mockTimetableApi.getMyTimetable.mockResolvedValue(MY_TIMETABLE);
  mockNotesApi.getTeacherContext.mockResolvedValue({
    class: { id: "class-1", name: "6e A", schoolYearId: "sy-1" },
    subjects: [{ id: "math", name: "Mathématiques", branches: [] }],
    evaluationTypes: [],
    students: [],
  });
  mockHomeworkApi.listClassHomework.mockResolvedValue([BASE_HOMEWORK]);
  mockHomeworkApi.getHomeworkDetail.mockResolvedValue(BASE_DETAIL);
  mockHomeworkApi.addComment.mockResolvedValue(BASE_DETAIL);
  mockHomeworkApi.setCompletion.mockResolvedValue(BASE_DETAIL);

  setupTeacher();
});

// ─── Structure de la card ──────────────────────────────────────────────────────

describe("HomeworkCard — structure d'affichage", () => {
  it("affiche le titre, la matière et les initiales de l'auteur sur la même ligne que la matière", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    expect(screen.getByText("Mathématiques")).toBeTruthy();
    expect(
      within(screen.getByTestId("class-homework-author-hw-1")).getByText("MM"),
    ).toBeTruthy();
  });

  it("n'affiche pas le label 'Homeworks' dans l'entête de liste", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    expect(screen.queryByText("Homeworks")).toBeNull();
  });

  it("affiche le bouton commentaires avec icône et le compteur dans le footer principal", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-comments-hw-1")).toBeTruthy(),
    );

    expect(screen.getByText("2")).toBeTruthy();
  });

  it("affiche le bouton Détails dans le footer principal", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-details-hw-1")).toBeTruthy(),
    );
  });
});

// ─── Onglets sans conteneur carte ────────────────────────────────────────────

describe("ClassHomeworkScreen — onglets sans conteneur carte", () => {
  it("affiche les deux onglets Liste et Agenda", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy(),
    );

    expect(screen.getByTestId("class-homework-tab-agenda")).toBeTruthy();
  });

  it("le conteneur des onglets n'a pas de style de carte (pas de borderRadius ni de backgroundColor crème)", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tabs-section")).toBeTruthy(),
    );

    const section = screen.getByTestId("class-homework-tabs-section");
    const style = StyleSheet.flatten(section.props.style ?? {});

    // Le conteneur des onglets ne doit pas avoir de style de carte arrondie
    expect(style.borderRadius).toBeUndefined();
    expect(style.borderWidth).toBeUndefined();
    expect(style.backgroundColor).toBeUndefined();
  });

  it("l'onglet Liste est actif par défaut", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy(),
    );

    expect(screen.getByTestId("class-homework-list")).toBeTruthy();
  });

  it("l'onglet forms n'apparaît pas dans les UnderlineTabs", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-hero")).toBeTruthy(),
    );

    expect(screen.queryByTestId("class-homework-tabs-section")).toBeNull();
  });

  it("passer à l'onglet Agenda affiche les sous-onglets semaine/mois", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tab-agenda")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-tab-agenda"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-agenda-mode-tabs"),
      ).toBeTruthy(),
    );

    expect(screen.getByTestId("class-homework-agenda-mode-week")).toBeTruthy();
    expect(screen.getByTestId("class-homework-agenda-mode-month")).toBeTruthy();
  });

  it("revenir à l'onglet Liste depuis l'Agenda masque les sous-onglets agenda", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tab-agenda")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-tab-agenda"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-agenda-mode-tabs"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-tab-list"));

    await waitFor(() =>
      expect(
        screen.queryByTestId("class-homework-agenda-mode-tabs"),
      ).toBeNull(),
    );

    expect(screen.getByTestId("class-homework-list")).toBeTruthy();
  });
});

// ─── Vue ENSEIGNANT ────────────────────────────────────────────────────────────

describe("ClassHomeworkScreen — vue enseignant", () => {
  it("affiche les boutons de gestion enseignant", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    expect(screen.getByTestId("class-homework-fab")).toBeTruthy();
    expect(screen.getByTestId("class-homework-edit-hw-1")).toBeTruthy();
    expect(screen.getByTestId("class-homework-delete-hw-1")).toBeTruthy();
    expect(screen.getByTestId("class-homework-control-hw-1")).toBeTruthy();
    expect(screen.getByText("3/12")).toBeTruthy();
  });

  it("n'affiche pas le bouton toggle-done pour l'enseignant", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    expect(screen.queryByTestId("class-homework-toggle-done-hw-1")).toBeNull();
  });

  it("ouvre le panel commentaires et affiche le formulaire d'ajout", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-comments-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-comments-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-comments-panel-hw-1"),
      ).toBeTruthy(),
    );

    expect(screen.getByText("Commencez par relire la leçon.")).toBeTruthy();
    expect(
      screen.getByTestId("class-homework-inline-comment-input-hw-1"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("class-homework-inline-comment-submit-hw-1"),
    ).toBeTruthy();
  });

  it("soumet un commentaire inline depuis la card enseignant", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-comments-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-comments-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-inline-comment-input-hw-1"),
      ).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("class-homework-inline-comment-input-hw-1"),
      "Super exercice !",
    );
    fireEvent.press(
      screen.getByTestId("class-homework-inline-comment-submit-hw-1"),
    );

    await waitFor(() =>
      expect(mockHomeworkApi.addComment).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "hw-1",
        expect.objectContaining({ body: "Super exercice !" }),
      ),
    );
  });

  it("le bouton modifier ne déclenche pas getHomeworkDetail", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-edit-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-edit-hw-1"));

    expect(mockHomeworkApi.getHomeworkDetail).not.toHaveBeenCalled();
  });
});

// ─── Vue PARENT ────────────────────────────────────────────────────────────────

describe("ClassHomeworkScreen — vue parent", () => {
  beforeEach(() => {
    setupParent();
    mockTimetableApi.getClassContext.mockRejectedValue(new Error("forbidden"));
  });

  it("n'affiche pas les boutons de gestion enseignant", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    expect(screen.queryByTestId("class-homework-edit-hw-1")).toBeNull();
    expect(screen.queryByTestId("class-homework-delete-hw-1")).toBeNull();
    expect(screen.queryByTestId("class-homework-control-hw-1")).toBeNull();
    expect(screen.queryByTestId("class-homework-fab")).toBeNull();
  });

  it("affiche le bouton 'Marquer fait' pour le parent", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-toggle-done-hw-1"),
      ).toBeTruthy(),
    );

    expect(screen.getByText("Marquer fait")).toBeTruthy();
  });

  it("appuyer sur 'Marquer fait' appelle setCompletion avec done=true", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-toggle-done-hw-1"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-toggle-done-hw-1"));

    await waitFor(() =>
      expect(mockHomeworkApi.setCompletion).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "hw-1",
        expect.objectContaining({ done: true }),
      ),
    );
  });

  it("affiche 'Fait' dans le bouton toggle quand myDoneAt est renseigné", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([
      { ...BASE_HOMEWORK, myDoneAt: "2026-05-02T20:00:00.000Z" },
    ]);

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-toggle-done-hw-1"),
      ).toBeTruthy(),
    );

    const toggleBtn = screen.getByTestId("class-homework-toggle-done-hw-1");
    expect(within(toggleBtn).getByText("Fait")).toBeTruthy();
    expect(screen.queryByText("Marquer fait")).toBeNull();
  });

  it("appuyer sur 'Fait ✓' appelle setCompletion avec done=false", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([
      { ...BASE_HOMEWORK, myDoneAt: "2026-05-02T20:00:00.000Z" },
    ]);

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-toggle-done-hw-1"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-toggle-done-hw-1"));

    await waitFor(() =>
      expect(mockHomeworkApi.setCompletion).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "hw-1",
        expect.objectContaining({ done: false }),
      ),
    );
  });

  it("le parent peut ouvrir les commentaires avec formulaire inline", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-comments-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-comments-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-comments-panel-hw-1"),
      ).toBeTruthy(),
    );

    expect(
      screen.getByTestId("class-homework-inline-comment-input-hw-1"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("class-homework-inline-comment-submit-hw-1"),
    ).toBeTruthy();
  });

  it("le parent peut soumettre un commentaire avec studentId", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-comments-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-comments-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-inline-comment-input-hw-1"),
      ).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("class-homework-inline-comment-input-hw-1"),
      "Mon enfant a bien compris.",
    );
    fireEvent.press(
      screen.getByTestId("class-homework-inline-comment-submit-hw-1"),
    );

    await waitFor(() =>
      expect(mockHomeworkApi.addComment).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "hw-1",
        expect.objectContaining({
          body: "Mon enfant a bien compris.",
          studentId: "child-1",
        }),
      ),
    );
  });
});

// ─── Comportements transversaux ────────────────────────────────────────────────

describe("ClassHomeworkScreen — comportements transversaux", () => {
  it("ouvre le détail via tap sur la card", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(mockHomeworkApi.getHomeworkDetail).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "hw-1",
        undefined,
      ),
    );
  });

  it("affiche l'image insérée dans le devoir comme une image visible dans le détail", async () => {
    mockHomeworkApi.getHomeworkDetail.mockResolvedValue({
      ...BASE_DETAIL,
      contentHtml:
        '<p>Faire le travail</p><img src="https://cdn.example.com/homework/img-1.jpg" />',
    });

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-detail-inline-image-0"),
      ).toBeTruthy(),
    );
  });

  it("ferme le panel commentaires en re-appuyant sur le bouton", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-comments-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-comments-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-comments-panel-hw-1"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-comments-hw-1"));

    await waitFor(() =>
      expect(
        screen.queryByTestId("class-homework-comments-panel-hw-1"),
      ).toBeNull(),
    );
  });

  it("ne charge le détail qu'une seule fois si déjà en cache", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-comments-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-comments-hw-1"));

    await waitFor(() =>
      expect(mockHomeworkApi.getHomeworkDetail).toHaveBeenCalledTimes(1),
    );

    fireEvent.press(screen.getByTestId("class-homework-control-hw-1"));

    expect(mockHomeworkApi.getHomeworkDetail).toHaveBeenCalledTimes(1);
  });

  it("passe à l'onglet agenda mode semaine", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-tab-agenda"));
    fireEvent.press(screen.getByTestId("class-homework-agenda-mode-week"));

    expect(screen.getByTestId("class-homework-week-columns")).toBeTruthy();
  });
});

// ─── Header du détail ─────────────────────────────────────────────────────────

describe("ClassHomeworkScreen — header du détail homework", () => {
  it("affiche le ModuleHeader avec testID homework-detail-header au clic sur la card", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-detail-header")).toBeTruthy(),
    );

    expect(screen.getByTestId("homework-detail-header-title")).toBeTruthy();
    expect(screen.getByTestId("homework-detail-header-subtitle")).toBeTruthy();
  });

  it("affiche 'Détail homework' comme titre dans le header", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-detail-header-title")).toBeTruthy(),
    );

    expect(
      within(screen.getByTestId("homework-detail-header-title")).getByText(
        "Détail homework",
      ),
    ).toBeTruthy();
  });

  it("affiche le nom de la matière en sous-titre du header", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("homework-detail-header-subtitle"),
      ).toBeTruthy(),
    );

    expect(
      within(screen.getByTestId("homework-detail-header-subtitle")).getByText(
        "Mathématiques",
      ),
    ).toBeTruthy();
  });

  it("ferme le détail via le bouton retour du header", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-detail-close")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("homework-detail-close"));

    await waitFor(() =>
      expect(screen.queryByTestId("homework-detail-header")).toBeNull(),
    );
  });

  it("le header du détail est cohérent avec le style des autres pages (testID homework-detail-header présent)", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-details-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-detail-header")).toBeTruthy(),
    );
  });

  it("le header du détail n'est pas rendu à l'intérieur du ScrollView (pleine largeur)", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-detail-header")).toBeTruthy(),
    );

    const scrollView = screen.UNSAFE_getByType(
      require("react-native").ScrollView,
    );
    expect(
      within(scrollView).queryByTestId("homework-detail-header"),
    ).toBeNull();
  });

  it("le bouton retour du header de détail ramène à l'onglet liste", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-detail-header")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("homework-detail-close"));

    await waitFor(() =>
      expect(screen.queryByTestId("homework-detail-header")).toBeNull(),
    );

    expect(screen.getByTestId("class-homework-list")).toBeTruthy();
    expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy();
    expect(screen.getByText("Exercices 1 à 3")).toBeTruthy();
  });
});

// ─── Écran de suivi (devoirs faits / à faire) ─────────────────────────────────

describe("ClassHomeworkScreen — écran de suivi (control)", () => {
  it("n'est pas une modale : ouvrir le suivi remplace la liste par le header et le hero de suivi", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-control-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-control-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-control-header")).toBeTruthy(),
    );

    expect(screen.getByTestId("homework-control-hero")).toBeTruthy();
    expect(screen.queryByTestId("class-homework-list")).toBeNull();
    expect(screen.queryByTestId("class-homework-tab-list")).toBeNull();
  });

  it("le header de suivi n'est pas rendu à l'intérieur du ScrollView (pleine largeur)", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-control-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-control-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-control-header")).toBeTruthy(),
    );

    const scrollView = screen.UNSAFE_getByType(
      require("react-native").ScrollView,
    );
    expect(
      within(scrollView).queryByTestId("homework-control-header"),
    ).toBeNull();
  });

  it("affiche dans le hero le libellé des élèves ayant terminé et le ratio", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-control-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-control-hw-1"));

    const hero = await screen.findByTestId("homework-control-hero");

    expect(
      within(hero).getByText("Élèves ayant déjà fait le devoir"),
    ).toBeTruthy();
    expect(within(hero).getByText(/3\/12/)).toBeTruthy();
  });

  it("ferme le suivi via le bouton retour du header et revient à la liste", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-control-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-control-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-control-close")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("homework-control-close"));

    await waitFor(() =>
      expect(screen.queryByTestId("homework-control-header")).toBeNull(),
    );

    expect(screen.getByTestId("class-homework-list")).toBeTruthy();
    expect(screen.getByText("Exercices 1 à 3")).toBeTruthy();
  });

  it("liste les élèves ayant déjà terminé le devoir", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-control-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-control-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-control-header")).toBeTruthy(),
    );

    await waitFor(() => expect(screen.getByText("Mebe Ariane")).toBeTruthy());
  });
});

// ─── Suivi des élèves (toggle repliable dans le détail) ───────────────────────

describe("ClassHomeworkScreen — suivi des élèves dans le détail (toggle)", () => {
  it("affiche un bouton replié par défaut avec le résumé x/y et masque la liste des élèves", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-detail-students-toggle"),
      ).toBeTruthy(),
    );

    expect(screen.getByText("3/12 homework faits")).toBeTruthy();
    expect(screen.queryByText("Mebe Ariane")).toBeNull();
  });

  it("affiche la liste des élèves avec leur statut après avoir appuyé sur le bouton toggle", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-detail-students-toggle"),
      ).toBeTruthy(),
    );

    fireEvent.press(
      screen.getByTestId("class-homework-detail-students-toggle"),
    );

    await waitFor(() => expect(screen.getByText("Mebe Ariane")).toBeTruthy());
  });

  it("replie de nouveau la liste des élèves si on rappuie sur le bouton toggle", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-detail-students-toggle"),
      ).toBeTruthy(),
    );

    fireEvent.press(
      screen.getByTestId("class-homework-detail-students-toggle"),
    );
    await waitFor(() => expect(screen.getByText("Mebe Ariane")).toBeTruthy());

    fireEvent.press(
      screen.getByTestId("class-homework-detail-students-toggle"),
    );
    await waitFor(() => expect(screen.queryByText("Mebe Ariane")).toBeNull());
  });

  it("replie la liste des élèves quand on rouvre le détail d'un autre homework", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([
      BASE_HOMEWORK,
      { ...BASE_HOMEWORK, id: "hw-2", title: "Exercices 4 à 6" },
    ]);
    mockHomeworkApi.getHomeworkDetail.mockImplementation(
      async (_slug, _classId, homeworkId) =>
        homeworkId === "hw-2"
          ? { ...BASE_DETAIL, id: "hw-2", title: "Exercices 4 à 6" }
          : BASE_DETAIL,
    );

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-1"));
    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-detail-students-toggle"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("class-homework-detail-students-toggle"),
    );
    await waitFor(() => expect(screen.getByText("Mebe Ariane")).toBeTruthy());

    fireEvent.press(screen.getByTestId("homework-detail-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("homework-detail-header")).toBeNull(),
    );

    fireEvent.press(screen.getByTestId("class-homework-card-hw-2"));
    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-detail-students-toggle"),
      ).toBeTruthy(),
    );

    expect(screen.queryByText("Mebe Ariane")).toBeNull();
  });
});

// ─── Erreurs dans l'onglet ────────────────────────────────────────────────────

describe("ClassHomeworkScreen — erreurs dans l'onglet (dismissibles)", () => {
  it("n'affiche pas de bannière d'erreur quand tout va bien", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByText("Exercices 1 à 3")).toBeTruthy(),
    );

    expect(screen.queryByTestId("homework-tab-error")).toBeNull();
  });

  it("affiche l'erreur de contexte dans l'onglet liste (pas au-dessus des onglets)", async () => {
    mockTimetableApi.getClassContext.mockRejectedValue(
      new Error("Erreur réseau"),
    );

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("homework-tab-error")).toBeTruthy(),
    );

    expect(
      screen.getByText(translate("fr", "homework.errors.loadContext")),
    ).toBeTruthy();
    expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy();
  });

  it("affiche le bouton de fermeture sur la bannière d'erreur", async () => {
    mockTimetableApi.getClassContext.mockRejectedValue(
      new Error("Erreur réseau"),
    );

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("homework-tab-error")).toBeTruthy(),
    );

    expect(screen.getByTestId("homework-tab-error-dismiss")).toBeTruthy();
  });

  it("ferme la bannière d'erreur au clic sur le bouton de fermeture", async () => {
    mockTimetableApi.getClassContext.mockRejectedValue(
      new Error("Erreur réseau"),
    );

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("homework-tab-error-dismiss")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("homework-tab-error-dismiss"));

    await waitFor(() =>
      expect(screen.queryByTestId("homework-tab-error")).toBeNull(),
    );
  });

  it("réaffiche la bannière quand une NOUVELLE erreur (message différent) survient après fermeture", async () => {
    setupParent();
    // Contexte échoue (getMyTimetable pour le parent)
    mockTimetableApi.getMyTimetable.mockRejectedValue(
      new Error("Erreur réseau"),
    );
    // setCompletion échoue avec un message différent
    mockHomeworkApi.setCompletion.mockRejectedValue(new Error("Echec serveur"));

    render(<ClassHomeworkScreen />);

    // Erreur de contexte apparaît
    await waitFor(() =>
      expect(screen.getByTestId("homework-tab-error")).toBeTruthy(),
    );

    // On la ferme
    fireEvent.press(screen.getByTestId("homework-tab-error-dismiss"));
    await waitFor(() =>
      expect(screen.queryByTestId("homework-tab-error")).toBeNull(),
    );

    // On déclenche setCompletion → nouvelle erreur (message différent de contextError)
    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-toggle-done-hw-1"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-homework-toggle-done-hw-1"));

    // La nouvelle erreur (store) ré-ouvre la bannière
    await waitFor(() =>
      expect(screen.getByTestId("homework-tab-error")).toBeTruthy(),
    );
  });

  it("l'erreur de l'onglet agenda est aussi dans le contenu (pas au-dessus des onglets)", async () => {
    mockTimetableApi.getClassContext.mockRejectedValue(
      new Error("Erreur réseau"),
    );

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-tab-agenda"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-tab-error")).toBeTruthy(),
    );

    expect(screen.getByTestId("class-homework-tab-agenda")).toBeTruthy();
  });
});

// ─── Onglet formulaires (création / édition inline) ────────────────────────────

describe("ClassHomeworkScreen — onglet formulaires", () => {
  it("le FAB ouvre l'onglet forms avec le hero de création", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-hero")).toBeTruthy(),
    );

    expect(
      screen.getByText(translate("fr", "homework.form.createHeroTitle")),
    ).toBeTruthy();
    expect(screen.getByTestId("homework-form-title")).toBeTruthy();
    expect(screen.queryByTestId("class-homework-fab")).toBeNull();
  });

  it("le bouton édition d'une card ouvre l'onglet forms pré-rempli", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-edit-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-edit-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-hero")).toBeTruthy(),
    );

    expect(screen.getByDisplayValue("Exercices 1 à 3")).toBeTruthy();
  });

  it("Annuler revient au tab liste sans appeler l'API", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-cancel")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("homework-form-cancel"));

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-list")).toBeTruthy(),
    );

    expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy();
    expect(mockHomeworkApi.createHomework).not.toHaveBeenCalled();
  });

  it("la flèche du ModuleHeader depuis forms revient au tab d'origine sans router.back()", async () => {
    const backSpy = jest.fn();
    jest.spyOn(require("expo-router"), "useRouter").mockReturnValue({
      back: backSpy,
    });

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tab-agenda")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-tab-agenda"));

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-back")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-back"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-agenda-mode-tabs"),
      ).toBeTruthy(),
    );

    expect(backSpy).not.toHaveBeenCalled();
  });

  it("affiche les erreurs de validation sous les champs sans appeler l'API", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-title")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("homework-form-title"), "");
    fireEvent.press(screen.getByTestId("homework-form-submit"));

    await waitFor(() =>
      expect(
        screen.getByText(
          translate("fr", "homework.form.validation.titleRequired"),
        ),
      ).toBeTruthy(),
    );

    expect(mockHomeworkApi.createHomework).not.toHaveBeenCalled();
  });

  it("succès : appelle l'API, affiche le toast puis revient au tab d'origine après 2s", async () => {
    jest.useFakeTimers();
    mockHomeworkApi.createHomework.mockResolvedValue({
      ...BASE_HOMEWORK,
      id: "hw-2",
    });

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-title")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("homework-form-title"),
      "Nouveau devoir",
    );
    fireEvent.press(screen.getByTestId("homework-form-expected-date"));
    fireEvent.press(screen.getByTestId("homework-form-expected-time"));
    fireEvent.press(screen.getByTestId("homework-form-submit"));

    await waitFor(() =>
      expect(mockHomeworkApi.createHomework).toHaveBeenCalled(),
    );

    expect(screen.getByTestId("homework-form-hero")).toBeTruthy();

    await jest.advanceTimersByTimeAsync(2000);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-list")).toBeTruthy(),
    );
    expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy();

    jest.useRealTimers();
  });

  it("erreur : affiche le toast d'erreur et reste sur l'onglet forms", async () => {
    mockHomeworkApi.createHomework.mockRejectedValue(
      new Error("Erreur serveur"),
    );

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-title")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("homework-form-title"),
      "Nouveau devoir",
    );
    fireEvent.press(screen.getByTestId("homework-form-expected-date"));
    fireEvent.press(screen.getByTestId("homework-form-expected-time"));
    fireEvent.press(screen.getByTestId("homework-form-submit"));

    await waitFor(() =>
      expect(mockHomeworkApi.createHomework).toHaveBeenCalled(),
    );

    expect(screen.getByTestId("homework-form-hero")).toBeTruthy();
  });

  it("origine correcte : ouverture depuis l'agenda ramène à l'agenda après Annuler", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-tab-agenda")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-tab-agenda"));

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-fab"));

    await waitFor(() =>
      expect(screen.getByTestId("homework-form-cancel")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("homework-form-cancel"));

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-agenda-mode-tabs"),
      ).toBeTruthy(),
    );

    expect(screen.getByTestId("class-homework-tab-agenda")).toBeTruthy();
  });

  it("le module header affiche le titre de mise à jour en mode édition", async () => {
    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-edit-hw-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("class-homework-edit-hw-1"));

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-header-title")).toBeTruthy(),
    );

    expect(
      within(screen.getByTestId("class-homework-header-title")).getByText(
        translate("fr", "homework.form.editModuleTitle"),
      ),
    ).toBeTruthy();
  });
});
