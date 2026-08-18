import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TestsExecutionsTab } from "../../src/components/tests/TestsExecutionsTab";
import { testsApi } from "../../src/api/tests.api";
import type {
  TestCampaignSummary,
  TestExecutionRow,
} from "../../src/types/tests.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("../../src/api/tests.api");

const CAMPAIGNS: TestCampaignSummary[] = [
  {
    id: "camp-1",
    title: "Devoirs — Enseignant",
    description: null,
    targetVersion: null,
    startsAt: null,
    dueAt: null,
    status: "ACTIVE",
    assignedToMe: false,
    summary: { totalCases: 2, completedCases: 1, totalExecutions: 1 },
  },
  {
    id: "camp-2",
    title: "Discipline — Admin",
    description: null,
    targetVersion: null,
    startsAt: null,
    dueAt: null,
    status: "ACTIVE",
    assignedToMe: false,
    summary: { totalCases: 1, completedCases: 1, totalExecutions: 1 },
  },
];

const CAMPAIGNS_WITH_ASSIGNMENT: TestCampaignSummary[] = [
  CAMPAIGNS[0],
  { ...CAMPAIGNS[1], assignedToMe: true },
];

function makeExecution(
  overrides: Partial<TestExecutionRow> = {},
): TestExecutionRow {
  return {
    id: "exec-1",
    status: "PASSED",
    resultText: "OK",
    comment: null,
    executedAt: "2026-06-11T10:00:00.000Z",
    adminReviewedAt: null,
    adminReviewNote: null,
    reworkRequestedAt: null,
    reworkNote: null,
    user: { id: "user-1", fullName: "Valery MBELE" },
    adminReviewedBy: null,
    reworkRequestedBy: null,
    testCase: { id: "case-1", title: "Connexion" },
    campaign: { id: "camp-1", title: "Devoirs — Enseignant" },
    ...overrides,
  };
}

describe("TestsExecutionsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders fetched executions", async () => {
    (testsApi.listExecutions as jest.Mock).mockResolvedValue({
      items: [makeExecution()],
    });

    render(<TestsExecutionsTab campaigns={CAMPAIGNS} />);

    expect(await screen.findByText("Connexion")).toBeTruthy();
  });

  it("shows the API error message when the request fails", async () => {
    (testsApi.listExecutions as jest.Mock).mockRejectedValue(
      new Error("Network down"),
    );

    render(<TestsExecutionsTab campaigns={CAMPAIGNS} />);

    expect(await screen.findByText("Network down")).toBeTruthy();
  });

  it("shows the empty state when there are no executions at all", async () => {
    (testsApi.listExecutions as jest.Mock).mockResolvedValue({ items: [] });

    render(<TestsExecutionsTab campaigns={CAMPAIGNS} />);

    expect(await screen.findByText("Aucun test réalisé")).toBeTruthy();
  });

  it("filters executions by search text on test case and campaign title", async () => {
    (testsApi.listExecutions as jest.Mock).mockResolvedValue({
      items: [
        makeExecution({
          id: "exec-1",
          testCase: { id: "c1", title: "Connexion" },
        }),
        makeExecution({
          id: "exec-2",
          testCase: { id: "c2", title: "Envoi de message" },
          campaign: { id: "camp-2", title: "Discipline — Admin" },
        }),
      ],
    });

    render(<TestsExecutionsTab campaigns={CAMPAIGNS} />);
    await screen.findByText("Connexion");

    fireEvent.changeText(
      screen.getByTestId("tests-executions-search-input"),
      "discipline",
    );

    await waitFor(() => {
      expect(screen.queryByText("Connexion")).toBeNull();
      expect(screen.getByText("Envoi de message")).toBeTruthy();
    });
  });

  it("shows a dedicated empty state when the search matches nothing", async () => {
    (testsApi.listExecutions as jest.Mock).mockResolvedValue({
      items: [makeExecution()],
    });

    render(<TestsExecutionsTab campaigns={CAMPAIGNS} />);
    await screen.findByText("Connexion");

    fireEvent.changeText(
      screen.getByTestId("tests-executions-search-input"),
      "inexistant",
    );

    await waitFor(() => {
      expect(screen.getByTestId("tests-executions-no-results")).toBeTruthy();
    });
  });

  it("defaults the mine-only toggle to on when the user has assigned campaigns", async () => {
    (testsApi.listExecutions as jest.Mock).mockResolvedValue({
      items: [
        makeExecution({
          id: "exec-1",
          testCase: { id: "c1", title: "Connexion" },
        }),
        makeExecution({
          id: "exec-2",
          testCase: { id: "c2", title: "Envoi de message" },
          campaign: { id: "camp-2", title: "Discipline — Admin" },
        }),
      ],
    });

    render(<TestsExecutionsTab campaigns={CAMPAIGNS_WITH_ASSIGNMENT} />);
    await screen.findByText("Envoi de message");

    expect(screen.queryByText("Connexion")).toBeNull();

    fireEvent.press(screen.getByTestId("tests-executions-mine-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Connexion")).toBeTruthy();
    });
  });
});
