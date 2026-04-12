import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ChildTimetableScreen } from "../../src/components/timetable/ChildTimetableScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockBack = jest.fn();
const mockLoadMyTimetable = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ childId: "stu-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Robert",
      lastName: "Ntamack",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "PARENT" }],
      profileCompleted: true,
      role: "PARENT",
      activeRole: "PARENT",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });
  useTimetableStore.setState({
    myTimetable: {
      student: { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
      class: {
        id: "class-1",
        name: "6e A",
        schoolYearId: "sy1",
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
          occurrenceDate: "2026-04-13",
          weekday: 1,
          startMinute: 450,
          endMinute: 510,
          room: "A1",
          reason: null,
          subject: { id: "math", name: "Maths" },
          teacherUser: { id: "t1", firstName: "Paul", lastName: "Manga" },
        },
      ],
      calendarEvents: [],
      subjectStyles: [],
    },
    isLoadingMyTimetable: false,
    errorMessage: null,
    loadMyTimetable: mockLoadMyTimetable,
    clearError: jest.fn(),
  } as never);
});

describe("ChildTimetableScreen", () => {
  it("charge le planning au montage", async () => {
    render(<ChildTimetableScreen />);

    await waitFor(() => {
      expect(mockLoadMyTimetable).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ childId: "stu-1" }),
      );
    });
  });

  it("affiche l'agenda consolidé de l'enfant", () => {
    render(<ChildTimetableScreen />);

    expect(screen.getAllByText("Ntamack Lisa").length).toBeGreaterThan(0);
    expect(screen.getByText("Maths")).toBeTruthy();
  });

  it("revient à l'écran précédent via le bouton retour", () => {
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-back"));
    expect(mockBack).toHaveBeenCalled();
  });
});
