import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TeacherClassHealthScreen } from "../../src/components/health/TeacherClassHealthScreen";
import { healthApi } from "../../src/api/health.api";
import { useAuthStore } from "../../src/store/auth.store";
import type { TeacherClassHealthRoster } from "../../src/types/health.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/health.api");

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: mockPush,
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = healthApi as jest.Mocked<typeof healthApi>;

const ROSTER: TeacherClassHealthRoster = {
  class: { id: "class-1", name: "6e B" },
  items: [
    {
      id: "student-1",
      firstName: "Romuald",
      lastName: "Mboutman",
      age: 11,
      activeConditionsCount: 1,
      highestActiveAlertLevel: "URGENT",
    },
    {
      id: "student-2",
      firstName: "Aline",
      lastName: "Talla",
      age: 12,
      activeConditionsCount: 0,
      highestActiveAlertLevel: null,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "teacher-1",
      firstName: "William",
      lastName: "Tagal",
      onboardingHelpEnabled: false,
      activeRole: "TEACHER",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "TEACHER" }],
      profileCompleted: true,
    },
  } as never);
});

describe("TeacherClassHealthScreen", () => {
  it("charge et affiche la liste des élèves de la classe avec leur niveau d'alerte", async () => {
    api.getTeacherClassRoster.mockResolvedValueOnce(ROSTER);
    render(<TeacherClassHealthScreen />);

    await waitFor(() => screen.getByText("Mboutman Romuald"));
    expect(api.getTeacherClassRoster).toHaveBeenCalledWith(
      "college-vogt",
      "class-1",
    );
    expect(screen.getByText("Talla Aline")).toBeTruthy();
    expect(
      screen.getByTestId("teacher-class-health-student-student-1-alert"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("teacher-class-health-student-student-2-alert"),
    ).toBeNull();
  });

  it("navigue vers la fiche santé complète de l'élève sélectionné", async () => {
    api.getTeacherClassRoster.mockResolvedValueOnce(ROSTER);
    render(<TeacherClassHealthScreen />);

    await waitFor(() => screen.getByText("Mboutman Romuald"));
    fireEvent.press(
      screen.getByTestId("teacher-class-health-student-student-1"),
    );

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(home)/admin-sante/[studentId]",
        params: expect.objectContaining({
          studentId: "student-1",
          firstName: "Romuald",
          lastName: "Mboutman",
          className: "6e B",
          age: "11",
        }),
      }),
    );
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    api.getTeacherClassRoster.mockRejectedValueOnce(new Error("boom"));
    render(<TeacherClassHealthScreen />);

    await waitFor(() => screen.getByTestId("teacher-class-health-error"));
  });

  it("affiche un état vide quand la classe n'a aucun élève", async () => {
    api.getTeacherClassRoster.mockResolvedValueOnce({
      class: { id: "class-1", name: "6e B" },
      items: [],
    });
    render(<TeacherClassHealthScreen />);

    await waitFor(() => screen.getByText("Aucun élève"));
  });
});
