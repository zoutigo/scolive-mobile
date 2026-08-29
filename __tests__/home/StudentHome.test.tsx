/**
 * Tests — StudentHome
 *
 * Régression : cet écran était entièrement statique (aucun useState,
 * useEffect ni appel API dans tout le fichier) — "Moyenne", "Matières" et
 * "Homework" affichaient des tirets en dur, "Cours du jour" et "Dernières
 * notes" ne chargeaient jamais rien, et aucun bouton/lien ne naviguait
 * réellement. Constat remonté en test réel : "Aucun lien rapide ne
 * fonctionne". Ce fichier verrouille le câblage avec de vraies données.
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StudentHome } from "../../src/components/home/StudentHome";
import { notesApi } from "../../src/api/notes.api";
import { timetableApi } from "../../src/api/timetable.api";
import { homeworkApi } from "../../src/api/homework.api";
import { useSelfStudentContext } from "../../src/hooks/useSelfStudentContext";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/api/homework.api");
jest.mock("../../src/hooks/useSelfStudentContext");
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({ schoolSlug: "college-vogt" }),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockHomeworkApi = homeworkApi as jest.Mocked<typeof homeworkApi>;
const mockUseSelfStudentContext = useSelfStudentContext as jest.MockedFunction<
  typeof useSelfStudentContext
>;

const STUDENT_USER: AuthUser = {
  id: "u1",
  firstName: "Lisa",
  lastName: "Mbele",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "STUDENT" }],
  profileCompleted: true,
  role: "STUDENT",
  activeRole: "STUDENT",
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const SELF_CONTEXT_FIXTURE = {
  studentId: "student-1",
  firstName: "Lisa",
  lastName: "Mbele",
  classId: "class-1",
  className: "6eB",
  isLoading: false,
  error: null,
  refresh: jest.fn(),
};

const NOTES_FIXTURE = [
  {
    term: "TERM_1" as const,
    label: "Trimestre 1",
    councilLabel: "",
    generatedAtLabel: "",
    generalAverage: { student: 14.5, class: 12.1, min: 8.5, max: 17.8 },
    sequences: [],
    subjects: [
      {
        id: "math",
        subjectLabel: "Mathématiques",
        coefficient: 3,
        average: { student: 14, class: 12 },
        evaluations: [
          {
            id: "ev-1",
            title: "Devoir 1",
            score: 15,
            maxScore: 20,
            recordedAt: "2026-08-20T00:00:00.000Z",
          },
        ],
      },
    ],
  },
];

const TIMETABLE_FIXTURE = {
  student: { id: "student-1", firstName: "Lisa", lastName: "Mbele" },
  class: { id: "class-1", name: "6eB", schoolYearId: "sy-1" },
  slots: [],
  oneOffSlots: [],
  slotExceptions: [],
  occurrences: [
    {
      id: "occ-1",
      source: "RECURRING" as const,
      status: "PLANNED" as const,
      occurrenceDate: todayIso(),
      weekday: 1,
      startMinute: 480,
      endMinute: 540,
      room: "C12",
      reason: null,
      subject: { id: "math", name: "Mathématiques" },
      teacherUser: { id: "t1", firstName: "Jean", lastName: "Kamga" },
    },
    {
      id: "occ-2",
      source: "RECURRING" as const,
      status: "PLANNED" as const,
      occurrenceDate: "2020-01-01",
      weekday: 1,
      startMinute: 480,
      endMinute: 540,
      room: "C12",
      reason: null,
      subject: { id: "math", name: "Mathématiques" },
      teacherUser: { id: "t1", firstName: "Jean", lastName: "Kamga" },
    },
  ],
  calendarEvents: [],
  subjectStyles: [],
};

const HOMEWORK_FIXTURE = [
  { id: "hw-1", myDoneAt: null } as never,
  { id: "hw-2", myDoneAt: "2026-08-20T00:00:00.000Z" } as never,
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSelfStudentContext.mockReturnValue(SELF_CONTEXT_FIXTURE as never);
  mockNotesApi.listStudentNotes.mockResolvedValue(NOTES_FIXTURE as never);
  mockTimetableApi.getMyTimetable.mockResolvedValue(TIMETABLE_FIXTURE as never);
  mockHomeworkApi.listClassHomework.mockResolvedValue(HOMEWORK_FIXTURE);
});

async function waitForLoaded() {
  await waitFor(() =>
    expect(screen.queryByTestId("student-home-loading")).toBeNull(),
  );
}

describe("StudentHome — données réelles", () => {
  it("affiche la vraie moyenne, le nombre de matières et les devoirs non faits", async () => {
    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    expect(screen.getByTestId("student-home-stat-average")).toHaveTextContent(
      /^14,50Moyenne$/,
    );
    expect(screen.getByTestId("student-home-stat-subjects")).toHaveTextContent(
      /^1Matières$/,
    );
    expect(screen.getByTestId("student-home-stat-homework")).toHaveTextContent(
      /^1Homework$/,
    );
  });

  it("affiche les cours du jour, en excluant les occurrences d'un autre jour", async () => {
    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    expect(screen.getByTestId("student-home-today-row-0")).toHaveTextContent(
      /Mathématiques/,
    );
    expect(screen.queryByTestId("student-home-today-row-1")).toBeNull();
    expect(screen.queryByTestId("student-home-today-empty")).toBeNull();
  });

  it("affiche les dernières notes réelles", async () => {
    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    expect(screen.getByTestId("student-home-grade-row-0")).toHaveTextContent(
      /Mathématiques/,
    );
    expect(screen.getByTestId("student-home-grade-row-0")).toHaveTextContent(
      /15\/20/,
    );
  });

  it("navigue vers /notes/me au tap sur la carte Moyenne", async () => {
    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    fireEvent.press(screen.getByTestId("student-home-stat-average"));
    expect(mockPush).toHaveBeenCalledWith("/notes/me");
  });

  it("navigue vers /homework/me au tap sur la carte Homework et l'accès rapide Homework", async () => {
    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    fireEvent.press(screen.getByTestId("student-home-stat-homework"));
    expect(mockPush).toHaveBeenCalledWith("/homework/me");

    fireEvent.press(screen.getByTestId("student-home-quick-homework"));
    expect(mockPush).toHaveBeenCalledWith("/homework/me");
  });

  it("navigue vers /timetable/me depuis le lien Emploi du temps et une ligne de cours", async () => {
    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    fireEvent.press(screen.getByTestId("student-home-today-row-0"));
    expect(mockPush).toHaveBeenCalledWith("/timetable/me");
  });

  it("navigue vers /messages depuis l'accès rapide Messages", async () => {
    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    fireEvent.press(screen.getByTestId("student-home-quick-messages"));
    expect(mockPush).toHaveBeenCalledWith("/messages");
  });

  it("affiche les états vides quand il n'y a ni cours ni notes", async () => {
    mockNotesApi.listStudentNotes.mockResolvedValue([]);
    mockTimetableApi.getMyTimetable.mockResolvedValue({
      ...TIMETABLE_FIXTURE,
      occurrences: [],
    } as never);

    render(<StudentHome user={STUDENT_USER} schoolSlug="college-vogt" />);
    await waitForLoaded();

    expect(screen.getByTestId("student-home-today-empty")).toBeTruthy();
    expect(screen.getByTestId("student-home-grades-empty")).toBeTruthy();
    expect(screen.getByTestId("student-home-stat-average")).toHaveTextContent(
      /^-Moyenne$/,
    );
  });
});
