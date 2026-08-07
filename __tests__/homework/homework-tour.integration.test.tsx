/**
 * Tour d'aide guidée "homework" — vue élève.
 * Vérifie le point délicat : un élève sans devoir à venir voit l'état vide
 * ("No homework") sur l'onglet Liste, donc il n'y a normalement aucune carte
 * à cibler pour les étapes "card"/"markDone" du tour. Une carte de
 * démonstration (fallback, non liée à une vraie donnée) doit apparaître
 * uniquement pendant que le tour est actif et la liste réelle vide, et
 * disparaître dès que le tour se termine.
 */
import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react-native";
import { ClassHomeworkScreen } from "../../src/components/homework/ClassHomeworkScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useHomeworkStore } from "../../src/store/homework.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import { homeworkApi } from "../../src/api/homework.api";
import { notesApi } from "../../src/api/notes.api";
import { timetableApi } from "../../src/api/timetable.api";
import { HOMEWORK_TOUR_ID } from "../../src/components/homework/homework-tour.config";
import { translate } from "../../src/i18n/useTranslation";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/homework.api");
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/timetable.api");
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => callback(), [callback]);
  },
}));

const mockHomeworkApi = homeworkApi as jest.Mocked<typeof homeworkApi>;
const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;

const STUDENT_USER: AuthUser = {
  id: "student-1",
  firstName: "Lisa",
  lastName: "Mbele",
  role: "STUDENT",
  activeRole: "STUDENT",
  schoolName: "Collège Vogt",
  platformRoles: [],
  memberships: [{ schoolId: "school-1", role: "STUDENT" }],
  profileCompleted: true,
} as unknown as AuthUser;

const MY_TIMETABLE = {
  student: { id: "student-1", firstName: "Lisa", lastName: "Mbele" },
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
  commentsCount: 0,
  summary: { totalStudents: 20, doneStudents: 5, pendingStudents: 15 },
  myDoneAt: null,
};

function resetOnboardingTourStore() {
  useOnboardingTourStore.setState({
    completedTours: {},
    activeTourId: null,
    activeRole: null,
    steps: [],
    stepIndex: 0,
    targetLayout: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetOnboardingTourStore();
  useHomeworkStore.getState().reset();

  useAuthStore.setState({
    user: STUDENT_USER,
    schoolSlug: "college-vogt",
    isLoading: false,
    isAuthenticated: true,
    accessToken: "token",
  } as never);
  useFamilyStore.setState({
    children: [],
    activeChildId: null,
  } as never);

  mockTimetableApi.getClassContext.mockRejectedValue(new Error("forbidden"));
  mockTimetableApi.getMyTimetable.mockResolvedValue(MY_TIMETABLE as never);
  mockNotesApi.getTeacherContext.mockRejectedValue(new Error("forbidden"));
  mockHomeworkApi.getHomeworkDetail.mockResolvedValue({
    ...BASE_HOMEWORK,
    comments: [],
    completionStatuses: [],
  } as never);
});

describe("Tour homework — vue élève", () => {
  it("liste vide + tour actif : affiche une carte de démonstration ciblable, pas l'état vide", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([]);

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        HOMEWORK_TOUR_ID,
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-card-shell-homework-tour-fallback"),
      ).toBeTruthy(),
    );
    expect(
      screen.getByText(translate("fr", "homework.tourFallback.title")),
    ).toBeTruthy();
    expect(
      screen.queryByText(translate("fr", "homework.empty.title")),
    ).toBeNull();
  });

  it("le tour se termine : la carte de démonstration disparaît et l'état vide réel réapparaît", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([]);

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(
        screen.getByTestId("class-homework-card-shell-homework-tour-fallback"),
      ).toBeTruthy(),
    );

    act(() => {
      useOnboardingTourStore.getState().finish();
    });

    await waitFor(() =>
      expect(
        screen.queryByTestId(
          "class-homework-card-shell-homework-tour-fallback",
        ),
      ).toBeNull(),
    );
    expect(
      screen.getByText(translate("fr", "homework.empty.title")),
    ).toBeTruthy();
  });

  it("liste non vide : pas de carte de démonstration, la vraie première carte porte les cibles du tour", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([
      BASE_HOMEWORK,
    ] as never);

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-card-shell-hw-1")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("class-homework-card-shell-homework-tour-fallback"),
    ).toBeNull();
  });

  it("onboardingHelpEnabled=false : le tour ne démarre jamais, donc jamais de carte de démonstration même liste vide", async () => {
    useAuthStore.setState({
      user: { ...STUDENT_USER, onboardingHelpEnabled: false },
    } as never);
    mockHomeworkApi.listClassHomework.mockResolvedValue([]);

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(
        screen.getByText(translate("fr", "homework.empty.title")),
      ).toBeTruthy(),
    );
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
    expect(
      screen.queryByTestId("class-homework-card-shell-homework-tour-fallback"),
    ).toBeNull();
  });
});

describe("Aide (modale) — vue élève", () => {
  it("l'entrée « Aide » du menu ouvre la modale avec ses sous-chapitres, et se ferme au tap sur Fermer", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue([BASE_HOMEWORK]);

    render(<ClassHomeworkScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("class-homework-card-shell-hw-1")).toBeTruthy(),
    );

    expect(screen.queryByTestId("class-homework-help-modal-title")).toBeNull();

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("class-homework-help-menu-item"));

    expect(screen.getByTestId("class-homework-help-modal-title")).toBeTruthy();
    expect(
      screen.getByText(translate("fr", "homework.help.list.title")),
    ).toBeTruthy();
    expect(
      screen.getByText(translate("fr", "homework.help.list.section1Title")),
    ).toBeTruthy();
    expect(
      screen.getByText(translate("fr", "homework.help.section2Title")),
    ).toBeTruthy();
    expect(
      screen.getByText(translate("fr", "homework.help.section3Title")),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("class-homework-help-modal-close"));

    expect(screen.queryByTestId("class-homework-help-modal-title")).toBeNull();
  });
});
