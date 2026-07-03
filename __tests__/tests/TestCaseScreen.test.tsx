import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react-native";
import TestCaseScreen from "../../app/(home)/tests/cases/[testCaseId]";
import { useAuthStore } from "../../src/store/auth.store";
import { testsApi } from "../../src/api/tests.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({ testCaseId: "case-1" }),
  usePathname: () => "/tests/cases/case-1",
  useFocusEffect: () => {},
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

const EXECUTION = {
  id: "exec-1",
  status: "PASSED" as const,
  executedAt: "2024-06-01T10:00:00.000Z",
  user: { id: "u1", fullName: "Valery MBELE" },
  resultText: "OK",
  comment: null,
  attachments: [],
};

const DETAIL_NO_RESULTS = {
  id: "case-1",
  title: "Connexion email",
  module: null,
  objective: "Vérifier la connexion",
  preconditions: null,
  steps: [],
  expectedResult: "L'utilisateur est connecté",
  orderIndex: 0,
  priority: "MEDIUM",
  evidenceRequired: false,
  dueAt: null,
  campaign: {
    id: "camp-1",
    title: "Campagne v1",
    dueAt: null,
    targetVersion: null,
  },
  audienceRoles: [],
  latestOwnExecution: null,
  executionSummary: { totalExecutions: 0, passed: 0, failed: 0, blocked: 0 },
  completedByUsers: [],
  executions: [],
};

const DETAIL_WITH_RESULTS = {
  ...DETAIL_NO_RESULTS,
  executions: [EXECUTION],
};

describe("TestCaseScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as unknown as jest.Mock).mockReturnValue(TESTER_USER);
  });

  it("renders the hero with campaign title and test title", async () => {
    (testsApi.getTestCase as jest.Mock).mockResolvedValue(DETAIL_NO_RESULTS);
    render(<TestCaseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("test-case-hero")).toBeTruthy();
    });
  });

  it("navigates to the submit screen when the FAB is pressed", async () => {
    (testsApi.getTestCase as jest.Mock).mockResolvedValue(DETAIL_NO_RESULTS);
    render(<TestCaseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-fab-add")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("tests-fab-add"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/cases/[testCaseId]/submit",
      params: { testCaseId: "case-1", evidenceRequired: "0" },
    });
  });

  it("does not show the view results button when there are no executions", async () => {
    (testsApi.getTestCase as jest.Mock).mockResolvedValue(DETAIL_NO_RESULTS);
    render(<TestCaseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-fab-add")).toBeTruthy();
    });

    expect(screen.queryByTestId("tests-view-results-btn")).toBeNull();
  });

  it("shows the view results button when executions exist", async () => {
    (testsApi.getTestCase as jest.Mock).mockResolvedValue(DETAIL_WITH_RESULTS);
    render(<TestCaseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-view-results-btn")).toBeTruthy();
    });
  });

  it("navigates to the execution detail page when view results is pressed", async () => {
    (testsApi.getTestCase as jest.Mock).mockResolvedValue(DETAIL_WITH_RESULTS);
    render(<TestCaseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-view-results-btn")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("tests-view-results-btn"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/executions/[executionId]",
      params: { executionId: "exec-1", campaignId: "camp-1" },
    });
  });
});
