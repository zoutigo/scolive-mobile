import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ClassTimetableManagerScreen } from "../../src/components/timetable/ClassTimetableManagerScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { useTimetableStore } from "../../src/store/timetable.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockBack = jest.fn();
const mockLoadClassContext = jest.fn();
const mockLoadClassTimetable = jest.fn();
const mockCreateRecurringSlot = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ classId: "class-1", schoolYearId: "sy1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useSuccessToastStore.getState().hide();
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Valery",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });

  useTimetableStore.setState({
    classContext: {
      class: {
        id: "class-1",
        name: "6e A",
        schoolId: "s1",
        schoolYearId: "sy1",
        academicLevelId: null,
        curriculumId: null,
        referentTeacherUserId: "u1",
      },
      allowedSubjects: [{ id: "math", name: "Maths" }],
      assignments: [
        {
          teacherUserId: "t1",
          subjectId: "math",
          subject: { id: "math", name: "Maths" },
          teacherUser: {
            id: "t1",
            firstName: "Paul",
            lastName: "Manga",
            email: null,
          },
        },
      ],
      subjectStyles: [],
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
    },
    classTimetable: {
      class: { id: "class-1", schoolYearId: "sy1", academicLevelId: null },
      slots: [],
      oneOffSlots: [],
      slotExceptions: [],
      occurrences: [],
      calendarEvents: [],
      subjectStyles: [],
    },
    isLoadingClassContext: false,
    isLoadingClassTimetable: false,
    isSubmitting: false,
    errorMessage: null,
    loadClassContext: mockLoadClassContext.mockResolvedValue({
      selectedSchoolYearId: "sy1",
      class: { schoolYearId: "sy1" },
      assignments: [{ subjectId: "math", teacherUserId: "t1" }],
    }),
    loadClassTimetable: mockLoadClassTimetable.mockResolvedValue(undefined),
    createRecurringSlot: mockCreateRecurringSlot,
    updateRecurringSlot: jest.fn(),
    deleteRecurringSlot: jest.fn(),
    createOneOffSlot: jest.fn(),
    updateOneOffSlot: jest.fn(),
    deleteOneOffSlot: jest.fn(),
    createCalendarEvent: jest.fn(),
    updateCalendarEvent: jest.fn(),
    deleteCalendarEvent: jest.fn(),
    clearError: jest.fn(),
  } as never);
});

describe("ClassTimetableManagerScreen", () => {
  it("charge le contexte et l'agenda de classe au montage", async () => {
    render(<ClassTimetableManagerScreen />);

    await waitFor(() => {
      expect(mockLoadClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "sy1",
      );
    });
  });

  it("permet d'ajouter un créneau récurrent", async () => {
    render(<ClassTimetableManagerScreen />);

    await waitFor(() => {
      expect(mockLoadClassContext).toHaveBeenCalled();
    });
    fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));
    fireEvent.press(screen.getByTestId("slot-form-submit"));

    await waitFor(() => {
      expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        expect.objectContaining({
          subjectId: "math",
          teacherUserId: "t1",
          weekday: 1,
        }),
      );
    });
  });

  it("utilise le sélecteur d'heure réutilisable pour le formulaire récurrent", async () => {
    render(<ClassTimetableManagerScreen />);

    await waitFor(() => {
      expect(mockLoadClassContext).toHaveBeenCalled();
    });
    fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));
    fireEvent.press(screen.getByTestId("slot-form-start"));
    await waitFor(() =>
      expect(screen.getByTestId("slot-form-start-modal")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("slot-form-start-hour-09"));
    fireEvent.press(screen.getByTestId("slot-form-start-minute-15"));
    fireEvent.press(screen.getByTestId("slot-form-start-confirm"));

    fireEvent.press(screen.getByTestId("slot-form-end"));
    await waitFor(() =>
      expect(screen.getByTestId("slot-form-end-modal")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("slot-form-end-hour-10"));
    fireEvent.press(screen.getByTestId("slot-form-end-minute-05"));
    fireEvent.press(screen.getByTestId("slot-form-end-confirm"));
    fireEvent.press(screen.getByTestId("slot-form-submit"));

    await waitFor(() => {
      expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        expect.objectContaining({
          startMinute: 555,
          endMinute: 605,
        }),
      );
    });
  });
});
