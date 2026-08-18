import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import TestCampaignScreen from "../../app/(home)/tests/[campaignId]";
import { useAuthStore } from "../../src/store/auth.store";
import { testsApi } from "../../src/api/tests.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({ campaignId: "camp-1" }),
  usePathname: () => "/tests/camp-1",
}));
jest.mock("../../src/store/auth.store");
jest.mock("../../src/api/tests.api");

const TESTER_USER = {
  schoolSlug: null,
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
};

function makeCampaign(testCases: Array<Record<string, unknown>>) {
  return {
    id: "camp-1",
    title: "Devoirs — Enseignant",
    description: "Campagne de recette",
    targetVersion: null,
    startsAt: null,
    dueAt: null,
    status: "ACTIVE",
    summary: { totalCases: testCases.length, completedCases: 0 },
    testCases,
  };
}

const CASE_NOT_STARTED = {
  id: "case-1",
  title: "Prérequis : adresse email renseignée",
  module: "Devoirs",
  expectedResult: "Le profil affiche une adresse email valide",
  priority: "MEDIUM",
  dueAt: null,
  evidenceRequired: false,
  totalExecutions: 0,
  latestExecution: null,
};

const CASE_ALREADY_DONE = {
  id: "case-2",
  title: "Création d'un devoir complet",
  module: "Devoirs",
  expectedResult: "Le devoir est créé",
  priority: "CRITICAL",
  dueAt: null,
  evidenceRequired: false,
  totalExecutions: 1,
  latestExecution: {
    id: "exec-1",
    status: "PASSED",
    executedAt: "2026-06-01T10:00:00.000Z",
  },
};

describe("TestCampaignScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue(TESTER_USER);
  });

  it("renders the campaign hero and test case cards", async () => {
    (testsApi.getCampaign as jest.Mock).mockResolvedValue(
      makeCampaign([CASE_NOT_STARTED, CASE_ALREADY_DONE]),
    );

    render(<TestCampaignScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("campaign-hero")).toBeTruthy();
    });
    expect(
      screen.getByText("Prérequis : adresse email renseignée"),
    ).toBeTruthy();
    expect(screen.getByText("Création d'un devoir complet")).toBeTruthy();
  });

  it("shows a Start action on a test case with no own result yet", async () => {
    (testsApi.getCampaign as jest.Mock).mockResolvedValue(
      makeCampaign([CASE_NOT_STARTED]),
    );

    render(<TestCampaignScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("test-case-action-case-1")).toBeTruthy();
    });
    expect(screen.getByText("Démarrer")).toBeTruthy();
  });

  it("shows a Review action on a test case the user already completed", async () => {
    (testsApi.getCampaign as jest.Mock).mockResolvedValue(
      makeCampaign([CASE_ALREADY_DONE]),
    );

    render(<TestCampaignScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("test-case-action-case-2")).toBeTruthy();
    });
    expect(screen.getByText("Consulter")).toBeTruthy();
  });

  it("navigates to the test case screen when the action button is pressed", async () => {
    (testsApi.getCampaign as jest.Mock).mockResolvedValue(
      makeCampaign([CASE_NOT_STARTED]),
    );

    render(<TestCampaignScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("test-case-action-case-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("test-case-action-case-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/cases/[testCaseId]",
      params: { testCaseId: "case-1" },
    });
  });

  it("navigates to the test case screen when the whole card is pressed", async () => {
    (testsApi.getCampaign as jest.Mock).mockResolvedValue(
      makeCampaign([CASE_NOT_STARTED]),
    );

    render(<TestCampaignScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("test-case-card-case-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("test-case-card-case-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/cases/[testCaseId]",
      params: { testCaseId: "case-1" },
    });
  });
});
