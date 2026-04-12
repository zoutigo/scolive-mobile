import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TimetableClassesScreen } from "../../src/components/timetable/TimetableClassesScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
const mockLoadClassOptions = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Paul",
      lastName: "Manga",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "TEACHER" }],
      profileCompleted: true,
      role: "TEACHER",
      activeRole: "TEACHER",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });

  useTimetableStore.setState({
    classOptions: {
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      classes: [
        {
          classId: "class-1",
          className: "6e A",
          schoolYearId: "sy1",
          schoolYearLabel: "2025-2026",
          subjects: [{ id: "math", name: "Maths" }],
          studentCount: 18,
        },
      ],
    },
    isLoadingClassOptions: false,
    errorMessage: null,
    loadClassOptions: mockLoadClassOptions,
    clearError: jest.fn(),
  } as never);
});

describe("TimetableClassesScreen", () => {
  it("charge les classes au montage", async () => {
    render(<TimetableClassesScreen />);

    await waitFor(() => {
      expect(mockLoadClassOptions).toHaveBeenCalledWith(
        "college-vogt",
        undefined,
      );
    });
  });

  it("ouvre la classe sélectionnée", () => {
    render(<TimetableClassesScreen />);

    fireEvent.press(screen.getByTestId("timetable-class-row-class-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/timetable/class/[classId]",
      params: { classId: "class-1", schoolYearId: "sy1" },
    });
  });
});
