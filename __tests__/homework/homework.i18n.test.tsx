import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react-native";
import { ClassHomeworkScreen } from "../../src/components/homework/ClassHomeworkScreen";
import { useHomeworkStore } from "../../src/store/homework.store";
import { homeworkApi } from "../../src/api/homework.api";
import { notesApi } from "../../src/api/notes.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useLocaleStore } from "../../src/store/locale.store";
import { DEFAULT_LOCALE, translations } from "../../src/i18n/translations";
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
  comments: [],
  completionStatuses: [],
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
});

afterEach(() => {
  useLocaleStore.setState({ locale: DEFAULT_LOCALE });
});

describe("Homework — traduction selon la locale du compte (mobile)", () => {
  it("a un namespace homework.* avec des clés fr/en alignées et non vides", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("homework."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("homework."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });

  describe("Vue enseignant", () => {
    it("affiche les onglets en français par défaut", async () => {
      setupTeacher();
      render(<ClassHomeworkScreen />);

      await waitFor(() =>
        expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy(),
      );

      expect(
        within(screen.getByTestId("class-homework-tab-list")).getByText(
          translate("fr", "homework.tabs.list"),
        ),
      ).toBeTruthy();
      expect(
        within(screen.getByTestId("class-homework-tab-agenda")).getByText(
          translate("fr", "homework.tabs.agenda"),
        ),
      ).toBeTruthy();
    });

    it("affiche les onglets en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupTeacher();
      render(<ClassHomeworkScreen />);

      await waitFor(() =>
        expect(screen.getByTestId("class-homework-tab-list")).toBeTruthy(),
      );

      expect(
        within(screen.getByTestId("class-homework-tab-list")).getByText(
          translate("en", "homework.tabs.list"),
        ),
      ).toBeTruthy();
      expect(
        within(screen.getByTestId("class-homework-tab-agenda")).getByText(
          translate("en", "homework.tabs.agenda"),
        ),
      ).toBeTruthy();
      expect(screen.queryByText(translate("fr", "homework.tabs.list"))).toBeNull();
    });

    it("traduit le message d'erreur de contexte en anglais", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupTeacher();
      mockTimetableApi.getClassContext.mockRejectedValue(
        new Error("Network error"),
      );

      render(<ClassHomeworkScreen />);

      await waitFor(() =>
        expect(screen.getByTestId("homework-tab-error")).toBeTruthy(),
      );

      expect(
        screen.getByText(translate("en", "homework.errors.loadContext")),
      ).toBeTruthy();
    });
  });

  describe("Vue parent", () => {
    it("affiche le bouton 'Marquer fait' en français par défaut", async () => {
      setupParent();
      render(<ClassHomeworkScreen />);

      await waitFor(() =>
        expect(
          screen.getByTestId("class-homework-toggle-done-hw-1"),
        ).toBeTruthy(),
      );

      expect(
        screen.getByText(translate("fr", "homework.card.markDone")),
      ).toBeTruthy();
    });

    it("affiche le bouton 'Mark done' en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupParent();
      render(<ClassHomeworkScreen />);

      await waitFor(() =>
        expect(
          screen.getByTestId("class-homework-toggle-done-hw-1"),
        ).toBeTruthy(),
      );

      expect(
        screen.getByText(translate("en", "homework.card.markDone")),
      ).toBeTruthy();
      expect(
        screen.queryByText(translate("fr", "homework.card.markDone")),
      ).toBeNull();
    });
  });
});
