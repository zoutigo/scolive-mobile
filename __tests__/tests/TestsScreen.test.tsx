import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import TestsScreen from "../../app/(home)/tests/index";
import { useAuthStore } from "../../src/store/auth.store";
import { testsApi } from "../../src/api/tests.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/tests",
}));
jest.mock("../../src/store/auth.store");
jest.mock("../../src/api/tests.api");

describe("Tests screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the restricted state for non-tester users", () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Valery",
        lastName: "MBELE",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "PARENT" }],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
        isTester: false,
      },
    });

    render(<TestsScreen />);
    expect(screen.getByText("Accès restreint")).toBeTruthy();
  });

  it("loads and renders test campaigns for tester users", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Valery",
        lastName: "MBELE",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "PARENT" }],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
        isTester: true,
      },
    });
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([
      {
        id: "camp-1",
        title: "Messagerie mobile",
        description: "Parcours parent",
        targetVersion: "1.2.0",
        startsAt: null,
        dueAt: "2026-06-20T08:00:00.000Z",
        status: "ACTIVE",
        summary: {
          totalCases: 4,
          completedCases: 1,
          totalExecutions: 2,
        },
      },
    ]);

    render(<TestsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-home-tab-tests")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("tests-home-tab-tests"));

    await waitFor(() => {
      expect(screen.getByText("Messagerie mobile")).toBeTruthy();
      expect(screen.getByText("Parcours parent")).toBeTruthy();
    });
  });

  it("shows summary KPIs and the highlighted campaign by default", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Valery",
        lastName: "MBELE",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "PARENT" }],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
        isTester: true,
      },
    });
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([
      {
        id: "camp-1",
        title: "Messagerie mobile",
        description: "Parcours parent",
        targetVersion: "1.2.0",
        startsAt: null,
        dueAt: "2026-06-20T08:00:00.000Z",
        status: "ACTIVE",
        summary: {
          totalCases: 4,
          completedCases: 1,
          totalExecutions: 2,
        },
      },
    ]);

    render(<TestsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-summary-tab")).toBeTruthy();
      expect(screen.getByTestId("tests-highlight-cta")).toBeTruthy();
      expect(
        screen.getByTestId("tests-kpi-total-campaigns-count"),
      ).toHaveTextContent("1");
    });
  });
});
