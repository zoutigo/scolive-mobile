import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherClassAttendanceScreen } from "../../src/components/attendance/TeacherClassAttendanceScreen";
import { attendanceApi } from "../../src/api/attendance.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/components/DatePickerField", () => ({
  DatePickerField: (props: {
    value: string;
    onChange: (v: string) => void;
    testID?: string;
  }) => {
    const { TextInput } = require("react-native");
    return (
      <TextInput
        testID={props.testID ?? "date-picker"}
        value={props.value}
        onChangeText={props.onChange}
      />
    );
  },
}));
jest.mock("../../src/api/attendance.api");
jest.mock("../../src/store/auth.store", () => {
  const authState = {
    schoolSlug: "college-vogt",
    user: {
      id: "teacher-1",
      firstName: "Valery",
      lastName: "Mbele",
      role: "TEACHER",
      activeRole: "TEACHER",
      platformRoles: [] as never[],
      memberships: [{ schoolId: "s1", role: "TEACHER" as const }],
      schoolName: "Collège Vogt",
    },
  };
  const useAuthStore = (selector?: (state: typeof authState) => unknown) =>
    selector ? selector(authState) : authState;
  useAuthStore.getState = () => authState;
  return { useAuthStore };
});
jest.mock("expo-router", () => {
  const back = jest.fn();
  const navigate = jest.fn();
  return {
    __back: back,
    __navigate: navigate,
    useRouter: () => ({
      back,
      canGoBack: jest.fn().mockReturnValue(true),
      navigate,
    }),
    useLocalSearchParams: () => ({ classId: "class-1" }),
    useFocusEffect: (callback: () => void) => {
      const { useEffect } = require("react");
      useEffect(() => {
        callback();
      }, [callback]);
    },
  };
});
jest.mock("../../src/store/success-toast.store", () => {
  const showSuccess = jest.fn();
  const showError = jest.fn();
  return {
    __showSuccess: showSuccess,
    __showError: showError,
    useSuccessToastStore: (selector: (state: unknown) => unknown) =>
      selector({ showSuccess, showError }),
  };
});
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockAttendanceApi = attendanceApi as jest.Mocked<typeof attendanceApi>;
const toast = require("../../src/store/success-toast.store") as {
  __showSuccess: jest.Mock;
  __showError: jest.Mock;
};

function roster(absentIds: string[] = []) {
  return {
    classId: "class-1",
    className: "6eC",
    date: "2026-09-16",
    students: [
      {
        id: "student-2",
        firstName: "Alice",
        lastName: "Ateba",
        present: !absentIds.includes("student-2"),
      },
      {
        id: "student-1",
        firstName: "Remi",
        lastName: "Ntamack",
        present: !absentIds.includes("student-1"),
      },
    ],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAttendanceApi.getRoster.mockResolvedValue(roster());
  mockAttendanceApi.saveRollCall.mockResolvedValue(roster(["student-2"]));
});

describe("TeacherClassAttendanceScreen", () => {
  it("loads the roster with everyone present by default and toggles a student to absent", async () => {
    render(<TeacherClassAttendanceScreen />);

    await screen.findByText("Ateba Alice");
    expect(
      screen.getByTestId("teacher-class-attendance-summary"),
    ).toHaveTextContent("2/2 présents");

    fireEvent.press(
      screen.getByTestId("teacher-class-attendance-absent-student-2"),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("teacher-class-attendance-summary"),
      ).toHaveTextContent("1/2 présents"),
    );
  });

  it("fetches the roster only once per date, no re-render loop", async () => {
    render(<TeacherClassAttendanceScreen />);

    await screen.findByText("Ateba Alice");

    expect(mockAttendanceApi.getRoster).toHaveBeenCalledTimes(1);
  });

  it("saves only the absent student ids and shows a success toast", async () => {
    render(<TeacherClassAttendanceScreen />);

    await screen.findByText("Ateba Alice");
    fireEvent.press(
      screen.getByTestId("teacher-class-attendance-absent-student-2"),
    );
    fireEvent.press(screen.getByTestId("teacher-class-attendance-save"));

    await waitFor(() =>
      expect(mockAttendanceApi.saveRollCall).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "2026-09-16",
        ["student-2"],
      ),
    );
    expect(toast.__showSuccess).toHaveBeenCalled();
  });

  it("shows an error toast when saving fails", async () => {
    mockAttendanceApi.saveRollCall.mockRejectedValue(new Error("boom"));

    render(<TeacherClassAttendanceScreen />);

    await screen.findByText("Ateba Alice");
    fireEvent.press(screen.getByTestId("teacher-class-attendance-save"));

    await waitFor(() => expect(toast.__showError).toHaveBeenCalled());
  });
});
