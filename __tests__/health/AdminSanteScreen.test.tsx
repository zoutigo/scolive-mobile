import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import AdminSanteScreenRoute from "../../app/(home)/admin-sante";
import { healthApi } from "../../src/api/health.api";
import { familyApi } from "../../src/api/family.api";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/health.api");
jest.mock("../../src/api/family.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
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

const health = healthApi as jest.Mocked<typeof healthApi>;
const family = familyApi as jest.Mocked<typeof familyApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "health-1",
      firstName: "Marie",
      lastName: "Ateba",
      onboardingHelpEnabled: false,
      activeRole: "SCHOOL_HEALTH_OFFICER",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_HEALTH_OFFICER" }],
      profileCompleted: true,
    },
  } as never);
  family.listAdminStudents.mockResolvedValue({
    students: [
      {
        id: "student-1",
        firstName: "Nathan",
        lastName: "Mbele",
        currentEnrollment: null,
      },
    ],
    total: 1,
    page: 1,
    hasMore: false,
  });
  health.getUrgencySummary.mockResolvedValue({
    student: { id: "student-1", firstName: "Nathan", lastName: "Mbele" },
    conditions: [
      {
        id: "cond-1",
        type: "ALLERGY",
        alertLevel: "URGENT",
        label: "Allergie arachides",
        description: null,
        active: true,
        isVisibleToAllTeachers: false,
        publicAlertLabel: null,
        createdAt: new Date().toISOString(),
      },
    ],
    emergencyContacts: [
      { id: "parent-1", fullName: "Jean Mbele", phone: "699001122" },
    ],
  });
  health.listCareEvents.mockResolvedValue([]);
  health.listReports.mockResolvedValue([]);
  health.createCareEvent.mockResolvedValue({
    id: "care-1",
    summary: "Chute dans la cour",
    description: null,
    occurredAt: new Date().toISOString(),
    alertLevel: "INFO",
    authorUser: null,
  });
});

describe("AdminSanteScreen (vue école)", () => {
  it("recherche un élève puis affiche le bandeau d'urgence", async () => {
    render(<AdminSanteScreenRoute />);

    await waitFor(() => expect(family.listAdminStudents).toHaveBeenCalled());

    fireEvent.press(await screen.findByTestId("admin-sante-student-student-1"));

    await waitFor(() => {
      expect(screen.getByText("Allergie arachides")).toBeOnTheScreen();
    });
  });

  it("enregistre un soin pour l'élève sélectionné", async () => {
    render(<AdminSanteScreenRoute />);
    fireEvent.press(await screen.findByTestId("admin-sante-student-student-1"));

    const summaryInput = await screen.findByTestId("admin-care-summary-input");
    fireEvent.changeText(summaryInput, "Chute dans la cour");
    fireEvent.press(screen.getByTestId("admin-care-submit"));

    await waitFor(() => {
      expect(health.createCareEvent).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        expect.objectContaining({ summary: "Chute dans la cour" }),
      );
    });
  });
});
