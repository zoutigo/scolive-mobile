import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import DisciplineStudentScreen from "../../app/(home)/discipline-student/[studentId]";
import VieScolaireScreen from "../../app/(home)/vie-scolaire/[childId]";
import { disciplineApi } from "../../src/api/discipline.api";
import { SuccessToastHost } from "../../src/components/feedback/SuccessToastHost";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useFamilyStore } from "../../src/store/family.store";
import { makeLifeEvent, makeUser } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;
const { useAuthStore } = jest.requireMock("../../src/store/auth.store") as {
  useAuthStore: jest.Mock;
};

let mockRouteParams: Record<string, string> = {
  studentId: "student-1",
  studentName: "Remi Ntamack",
  childId: "child-1",
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams,
  usePathname: () => "/(home)/vie-scolaire/[childId]",
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = {
    studentId: "student-1",
    studentName: "Remi Ntamack",
    childId: "child-1",
  };
  useDisciplineStore.getState().reset();
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
    isLoading: false,
    activeChildId: null,
  });
  api.list.mockResolvedValue([]);
  api.create.mockResolvedValue(
    makeLifeEvent({
      id: "created-1",
      studentId: "student-1",
      reason: "Retard",
    }),
  );
  useAuthStore.mockReturnValue({
    schoolSlug: "college-vogt",
    user: makeUser({
      id: "teacher-1",
      role: "TEACHER",
      activeRole: "TEACHER",
      memberships: [{ schoolId: "school-1", role: "TEACHER" }],
    }),
  });
});

describe("Discipline integration", () => {
  it("cree un evenement, alimente le vrai store et affiche un toast global", async () => {
    render(
      <>
        <DisciplineStudentScreen />
        <SuccessToastHost />
      </>,
    );

    fireEvent.changeText(screen.getByTestId("input-reason"), "Retard");
    fireEvent.changeText(
      screen.getByTestId("input-occurred-at"),
      "2026-04-09T08:30",
    );
    fireEvent.press(screen.getByTestId("btn-submit"));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeOnTheScreen();
    });

    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Événement enregistré",
    );
    expect(useDisciplineStore.getState().getEvents("student-1")[0]?.id).toBe(
      "created-1",
    );
  });

  it("charge la vue parent lecture seule dans le vrai store", async () => {
    useAuthStore.mockReturnValue({
      schoolSlug: "college-vogt",
      user: makeUser(),
    });
    mockRouteParams = { childId: "child-1" };
    api.list.mockResolvedValueOnce([
      makeLifeEvent({
        id: "abs-1",
        studentId: "child-1",
        type: "ABSENCE",
        justified: false,
      }),
    ]);

    render(<VieScolaireScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("unjustified-banner")).toBeOnTheScreen();
    });
    expect(useDisciplineStore.getState().getEvents("child-1")).toHaveLength(1);
  });
});
