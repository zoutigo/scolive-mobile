import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherClassDisciplineScreen } from "../../src/components/discipline/TeacherClassDisciplineScreen";
import { notesApi } from "../../src/api/notes.api";
import { timetableApi } from "../../src/api/timetable.api";
import { disciplineApi } from "../../src/api/discipline.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useTeacherClassDisciplineDraftStore } from "../../src/store/teacher-class-discipline-draft.store";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: "college-vogt",
    user: {
      id: "teacher-1",
      firstName: "Valery",
      lastName: "Mbele",
      role: "TEACHER",
      activeRole: "TEACHER",
      schoolName: "Collège Vogt",
    },
  }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockDisciplineApi = disciplineApi as jest.Mocked<typeof disciplineApi>;

const student1 = { id: "student-1", firstName: "Lisa", lastName: "MBELE" };
const student2 = { id: "student-2", firstName: "Remi", lastName: "NTAMACK" };

beforeEach(() => {
  jest.clearAllMocks();
  useDisciplineStore.getState().reset();
  useTeacherClassDisciplineDraftStore.getState().reset();

  mockNotesApi.getTeacherContext.mockResolvedValue({
    class: { id: "class-1", name: "6e A", schoolYearId: "sy-1" },
    subjects: [],
    evaluationTypes: [],
    students: [student1, student2],
  });
  mockTimetableApi.getClassContext.mockResolvedValue({
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
    assignments: [],
    subjectStyles: [],
    schoolYears: [{ id: "sy-1", label: "2025-2026", isActive: true }],
    selectedSchoolYearId: "sy-1",
  });
  mockDisciplineApi.list.mockImplementation(async (_slug, studentId) => {
    if (studentId === "student-1") {
      return [
        makeLifeEvent({
          id: "event-1",
          studentId: "student-1",
          classId: "class-1",
          reason: "Bus arrivé en retard",
          type: "RETARD",
          authorUserId: "teacher-2",
        }),
      ];
    }
    return [
      makeLifeEvent({
        id: "event-2",
        studentId: "student-2",
        classId: "class-1",
        reason: "[DEMO] Sanction signée",
        type: "SANCTION",
        authorUserId: "teacher-2",
      }),
    ];
  });
  mockDisciplineApi.create.mockImplementation(
    async (_slug, studentId, payload) =>
      makeLifeEvent({
        id: "created-1",
        studentId,
        classId: payload.classId ?? "class-1",
        reason: payload.reason,
        type: payload.type,
        authorUserId: "teacher-1",
        justified: payload.justified ?? null,
        durationMinutes: payload.durationMinutes ?? null,
        occurredAt: payload.occurredAt ?? "2026-05-01T08:00:00.000Z",
        comment: payload.comment ?? null,
      }),
  );
  mockDisciplineApi.remove.mockResolvedValue(undefined);
});

describe("TeacherClassDisciplineScreen", () => {
  it("charge le contexte de classe et l'historique agrégé des élèves", async () => {
    render(<TeacherClassDisciplineScreen />);

    await waitFor(() => {
      expect(mockNotesApi.getTeacherContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
      );
    });
    await waitFor(() => {
      expect(mockDisciplineApi.list).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        expect.objectContaining({ classId: "class-1" }),
      );
    });

    expect(
      screen.getByTestId("teacher-class-discipline-events-list"),
    ).toBeTruthy();
    expect(screen.getByText("MBELE Lisa")).toBeTruthy();
    expect(screen.getByText("NTAMACK Remi")).toBeTruthy();
  });

  it("filtre les événements par élève via la liste déroulante", async () => {
    render(<TeacherClassDisciplineScreen />);

    await waitFor(() =>
      expect(screen.getByText("Bus arrivé en retard")).toBeTruthy(),
    );
    expect(screen.getByText("[DEMO] Sanction signée")).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("teacher-class-discipline-events-student-trigger"),
    );
    fireEvent.press(
      screen.getByTestId(
        "teacher-class-discipline-events-student-option-student-1",
      ),
    );

    expect(screen.getByText("Bus arrivé en retard")).toBeTruthy();
    expect(screen.queryByText("[DEMO] Sanction signée")).toBeNull();
  });

  it("ouvre le formulaire, crée un événement et persiste le brouillon pendant la saisie", async () => {
    render(<TeacherClassDisciplineScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("teacher-class-discipline-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("teacher-class-discipline-fab"));
    fireEvent.press(screen.getByTestId("discipline-form-student-trigger"));
    fireEvent.press(
      screen.getByTestId("discipline-form-student-option-student-1"),
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-reason"),
      "Retard portail",
    );
    fireEvent.changeText(
      screen.getByTestId("discipline-form-occurred-at"),
      "2026-05-02T07:10",
    );

    expect(
      useTeacherClassDisciplineDraftStore.getState().getDraft("class-1")
        ?.reason,
    ).toBe("Retard portail");

    fireEvent.press(screen.getByTestId("discipline-form-submit"));

    await waitFor(() => {
      expect(mockDisciplineApi.create).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        expect.objectContaining({
          classId: "class-1",
          reason: "Retard portail",
        }),
      );
    });

    expect(screen.getByText("Retard portail")).toBeTruthy();
  });

  it("affiche l'onglet Carnets et réutilise la synthèse vie scolaire de l'élève sélectionné", async () => {
    render(<TeacherClassDisciplineScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-class-discipline-tab-carnets"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("teacher-class-discipline-tab-carnets"));

    expect(screen.getByText("Choisissez un élève")).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("teacher-class-discipline-carnets-student-trigger"),
    );
    fireEvent.press(
      screen.getByTestId(
        "teacher-class-discipline-carnets-student-option-student-2",
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-class-discipline-carnet-summary"),
      ).toBeTruthy(),
    );
    expect(screen.getByTestId("discipline-summary-kpis")).toBeTruthy();
    expect(screen.getByText("[DEMO] Sanction signée")).toBeTruthy();
  });
});
