import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import SanteScreenRoute from "../../app/(home)/sante/[childId]";
import { healthApi } from "../../src/api/health.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/health.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
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

const api = healthApi as jest.Mocked<typeof healthApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "parent-1",
      firstName: "Jean",
      lastName: "Mbele",
      onboardingHelpEnabled: false,
      activeRole: "PARENT",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
    },
  } as never);
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Nathan", lastName: "Mbele" }],
  } as never);
  api.listConditions.mockResolvedValue([]);
  api.listCareEvents.mockResolvedValue([]);
  api.listReports.mockResolvedValue([]);
  api.createCondition.mockResolvedValue({
    id: "cond-1",
    type: "ALLERGY",
    alertLevel: "URGENT",
    label: "Allergie arachides",
    description: null,
    active: true,
    isVisibleToAllTeachers: false,
    publicAlertLabel: null,
    createdAt: new Date().toISOString(),
  });
  api.createReport.mockResolvedValue({
    id: "report-1",
    type: "ACCIDENT",
    alertLevel: "ATTENTION",
    description: "Crise d'asthme",
    sportRestriction: false,
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
  });
});

describe("SanteScreen (vue parent)", () => {
  it("charge les informations de santé au montage", async () => {
    api.listConditions.mockResolvedValueOnce([
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
    ]);

    render(<SanteScreenRoute />);

    await waitFor(() => {
      expect(screen.getByText("Allergie arachides")).toBeOnTheScreen();
    });
  });

  it("signale un événement de santé", async () => {
    render(<SanteScreenRoute />);

    await waitFor(() => expect(api.listConditions).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("sante-tab-reports"));

    const descriptionInput = await screen.findByTestId(
      "report-description-input",
    );
    fireEvent.changeText(descriptionInput, "Crise d'asthme");
    fireEvent.press(screen.getByTestId("report-submit"));

    await waitFor(() => {
      expect(api.createReport).toHaveBeenCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({ description: "Crise d'asthme" }),
      );
    });
  });
});
