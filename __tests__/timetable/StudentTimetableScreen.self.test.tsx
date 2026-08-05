/**
 * Vérifie le mode "self" de StudentTimetableScreen (route /timetable/me,
 * utilisée par le rôle STUDENT) : pas de childId, chargement sans childId,
 * retour vers l'accueil (`/`) plutôt que vers l'accueil d'un enfant.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StudentTimetableScreen } from "../../src/components/timetable/StudentTimetableScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest
    .fn()
    .mockReturnValue({ width: 360, height: 800, scale: 2, fontScale: 1 }),
}));

const mockPush = jest.fn();
const mockLoadMyTimetable = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  }),
}));

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-14T12:00:00Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Lisa",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "STUDENT" }],
      profileCompleted: true,
      role: "STUDENT",
      activeRole: "STUDENT",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });
  useTimetableStore.setState({
    myTimetable: {
      student: { id: "stu-1", firstName: "Lisa", lastName: "Mbele" },
      class: {
        id: "class-1",
        name: "6e A",
        schoolYearId: "sy1",
        academicLevelId: null,
      },
      slots: [],
      oneOffSlots: [],
      slotExceptions: [],
      occurrences: [],
      calendarEvents: [],
      subjectStyles: [],
    },
    isLoadingMyTimetable: false,
    errorMessage: null,
    loadMyTimetable: mockLoadMyTimetable,
    clearError: jest.fn(),
  } as never);
});

describe("StudentTimetableScreen — mode self (élève)", () => {
  it("charge son propre planning sans childId", () => {
    render(<StudentTimetableScreen />);
    expect(mockLoadMyTimetable).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ childId: undefined }),
    );
  });

  it("revient à l'accueil (pas à l'accueil d'un enfant) via le bouton retour", () => {
    render(<StudentTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
