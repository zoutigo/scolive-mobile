import React from "react";
import { StyleSheet } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { ChildHomeScreen } from "../../src/components/home/ChildHomeScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { notesApi } from "../../src/api/notes.api";
import { disciplineApi } from "../../src/api/discipline.api";
import { timetableApi } from "../../src/api/timetable.api";
import { messagingApi } from "../../src/api/messaging.api";
import { colors } from "../../src/theme";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/api/messaging.api");

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockDisciplineApi = disciplineApi as jest.Mocked<typeof disciplineApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockMessagingApi = messagingApi as jest.Mocked<typeof messagingApi>;
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
    isDrawerOpen: false,
  });
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    isAuthenticated: true,
    isLoading: false,
    accessToken: "token",
  } as never);
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
    activeChildId: null,
    isLoading: false,
  });

  mockNotesApi.listStudentNotes.mockResolvedValue([
    {
      term: "TERM_3",
      label: "Trimestre 3",
      councilLabel: "6e C • Conseil du 15 avril",
      generatedAtLabel: "Données publiées le 15/04/2026",
      generalAverage: {
        student: 13.4,
        class: 12.1,
        min: 8.5,
        max: 17.8,
      },
      subjects: [
        {
          id: "math",
          subjectLabel: "Mathématiques",
          teachers: [],
          coefficient: 4,
          studentAverage: 15.2,
          classAverage: 12,
          classMin: 8,
          classMax: 18,
          appreciation: "Bonne progression.",
          evaluations: [],
        },
      ],
    },
  ]);
  mockDisciplineApi.list.mockResolvedValue([
    {
      id: "evt-1",
      schoolId: "school-1",
      studentId: "child-1",
      classId: "class-1",
      schoolYearId: "sy-1",
      authorUserId: "teacher-1",
      type: "ABSENCE",
      occurredAt: "2026-04-17T08:00:00.000Z",
      durationMinutes: 60,
      justified: false,
      reason: "Absence non justifiée",
      comment: null,
      createdAt: "2026-04-17T08:00:00.000Z",
      updatedAt: "2026-04-17T08:00:00.000Z",
      class: { id: "class-1", name: "6e C" },
      schoolYear: { id: "sy-1", label: "2025-2026" },
      authorUser: {
        id: "teacher-1",
        firstName: "Albert",
        lastName: "Mvondo",
        email: "albert@test.cm",
      },
    },
  ]);
  mockTimetableApi.getMyTimetable.mockResolvedValue({
    student: { id: "child-1", firstName: "Remi", lastName: "Ntamack" },
    class: {
      id: "class-1",
      name: "6e C",
      schoolYearId: "sy-1",
      academicLevelId: null,
    },
    slots: [],
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: [
      {
        id: "occ-1",
        source: "RECURRING",
        status: "PLANNED",
        occurrenceDate: "2099-04-17",
        weekday: 5,
        startMinute: 525,
        endMinute: 600,
        room: "B45",
        reason: null,
        subject: { id: "ang", name: "Anglais" },
        teacherUser: {
          id: "t1",
          firstName: "Albert",
          lastName: "Mvondo",
        },
      },
    ],
    calendarEvents: [],
    subjectStyles: [],
  });
  mockMessagingApi.unreadCount.mockResolvedValue(4);
  mockMessagingApi.list.mockResolvedValue({
    items: [
      {
        id: "msg-1",
        folder: "inbox",
        status: "SENT",
        subject: "Rappel de composition",
        preview: "La composition de mathématiques est maintenue.",
        createdAt: "2026-04-17T07:30:00.000Z",
        sentAt: "2026-04-17T07:30:00.000Z",
        unread: true,
        sender: null,
        recipientsCount: 1,
        mailboxEntryId: "box-1",
        attachments: [],
      },
    ],
    meta: { page: 1, limit: 1, total: 1, totalPages: 1 },
  });
});

describe("ChildHomeScreen", () => {
  it("affiche une synthèse enfant avec header homogène et liens rapides", async () => {
    render(<ChildHomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Accueil enfant")).toBeTruthy();
    });

    const header = screen.getByTestId("child-home-header");
    const headerStyle = StyleSheet.flatten(header.props.style);

    expect(screen.getByText("Remi Ntamack • 6e C")).toBeTruthy();
    expect(screen.getByText("Moyenne générale")).toBeTruthy();
    expect(
      within(screen.getByTestId("child-home-stat-average")).getByText("13,40"),
    ).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("1 absence non justifiée")).toBeTruthy();
    expect(screen.getByText("08:45 - 10:00 · Anglais")).toBeTruthy();
    expect(screen.getByText("Mathématiques · 15,20")).toBeTruthy();
    expect(screen.getByTestId("child-home-link-class-life")).toBeTruthy();
    expect(headerStyle.backgroundColor).toBe(colors.primary);
    expect(headerStyle.marginHorizontal).toBe(-16);
  });

  it("met à jour le contexte enfant et navigue vers les bons modules", async () => {
    render(<ChildHomeScreen />);

    await waitFor(() => {
      expect(useFamilyStore.getState().activeChildId).toBe("child-1");
    });
    expect(
      useFamilyStore
        .getState()
        .children.find((entry) => entry.id === "child-1"),
    ).toEqual(
      expect.objectContaining({
        classId: "class-1",
        className: "6e C",
      }),
    );

    fireEvent.press(screen.getByTestId("child-home-link-class-life"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]/vie-de-classe",
      params: { childId: "child-1" },
    });
  });

  it("revient à l'accueil famille via le bouton retour", async () => {
    render(<ChildHomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-home-back")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("child-home-back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("ouvre le menu de navigation enfant via l'icone droite du header", async () => {
    render(<ChildHomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-home-menu")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-home-menu"));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it("affiche le lien Devoirs quand l'enfant a une classe et navigue vers le bon écran", async () => {
    render(<ChildHomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-home-link-homework")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-home-link-homework"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/homework",
      params: { classId: "class-1", childId: "child-1" },
    });
  });

  it("n'affiche pas le lien Devoirs quand l'enfant n'a pas de classe connue", async () => {
    useFamilyStore.setState({
      children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
      activeChildId: null,
      isLoading: false,
    });
    mockTimetableApi.getMyTimetable.mockRejectedValue(new Error("not found"));

    render(<ChildHomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-home-links-card")).toBeTruthy();
    });

    expect(screen.queryByTestId("child-home-link-homework")).toBeNull();
  });
});
