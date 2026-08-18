import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { TestsToRedoTab } from "../../src/components/tests/TestsToRedoTab";
import type {
  TestCampaignSummary,
  TestCaseToRedo,
} from "../../src/types/tests.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

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

const ITEMS: TestCaseToRedo[] = [
  {
    id: "case-1",
    title: "Connexion",
    module: null,
    priority: "HIGH",
    evidenceRequired: false,
    campaign: { id: "camp-1", title: "Devoirs — Enseignant" },
    reworkRequestedAt: "2026-06-10T10:00:00.000Z",
    reworkNote: null,
    reworkRequestedByName: "Admin",
    lastExecutedAt: "2026-06-09T10:00:00.000Z",
  },
  {
    id: "case-2",
    title: "Envoi de message",
    module: null,
    priority: "MEDIUM",
    evidenceRequired: false,
    campaign: { id: "camp-2", title: "Discipline — Admin" },
    reworkRequestedAt: "2026-06-11T10:00:00.000Z",
    reworkNote: "Reproduire sur Android",
    reworkRequestedByName: "Admin",
    lastExecutedAt: "2026-06-08T10:00:00.000Z",
  },
];

describe("TestsToRedoTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all items", () => {
    render(<TestsToRedoTab items={ITEMS} campaigns={CAMPAIGNS} />);

    expect(screen.getByText("Connexion")).toBeTruthy();
    expect(screen.getByText("Envoi de message")).toBeTruthy();
  });

  it("shows the empty state when there is nothing to redo", () => {
    render(<TestsToRedoTab items={[]} campaigns={CAMPAIGNS} />);

    expect(screen.getByTestId("tests-to-redo-empty")).toBeTruthy();
  });

  it("navigates to the test case screen when a card is pressed", () => {
    render(<TestsToRedoTab items={ITEMS} campaigns={CAMPAIGNS} />);

    fireEvent.press(screen.getByTestId("tests-to-redo-card-case-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/cases/[testCaseId]",
      params: { testCaseId: "case-1", evidenceRequired: "0" },
    });
  });

  it("filters items by search text on title and campaign title", () => {
    render(<TestsToRedoTab items={ITEMS} campaigns={CAMPAIGNS} />);

    fireEvent.changeText(
      screen.getByTestId("tests-to-redo-search-input"),
      "discipline",
    );

    expect(screen.queryByText("Connexion")).toBeNull();
    expect(screen.getByText("Envoi de message")).toBeTruthy();
  });

  it("clears the search when the clear button is pressed", () => {
    render(<TestsToRedoTab items={ITEMS} campaigns={CAMPAIGNS} />);

    fireEvent.changeText(
      screen.getByTestId("tests-to-redo-search-input"),
      "discipline",
    );
    fireEvent.press(screen.getByTestId("tests-to-redo-search-clear"));

    expect(screen.getByText("Connexion")).toBeTruthy();
    expect(screen.getByText("Envoi de message")).toBeTruthy();
  });

  it("shows a dedicated empty state when the search matches nothing", () => {
    render(<TestsToRedoTab items={ITEMS} campaigns={CAMPAIGNS} />);

    fireEvent.changeText(
      screen.getByTestId("tests-to-redo-search-input"),
      "inexistant",
    );

    expect(screen.getByTestId("tests-to-redo-no-results")).toBeTruthy();
  });

  it("filters by campaign using the campaign select", () => {
    render(<TestsToRedoTab items={ITEMS} campaigns={CAMPAIGNS} />);

    fireEvent.press(
      screen.getByTestId("tests-to-redo-filter-campaign-trigger"),
    );
    fireEvent.press(
      screen.getByTestId("tests-to-redo-filter-campaign-option-camp-2"),
    );

    expect(screen.queryByText("Connexion")).toBeNull();
    expect(screen.getByText("Envoi de message")).toBeTruthy();
  });

  it("does not show the campaign filter when items span a single campaign", () => {
    render(
      <TestsToRedoTab items={[ITEMS[0]]} campaigns={CAMPAIGNS} />,
    );

    expect(
      screen.queryByTestId("tests-to-redo-filter-campaign-trigger"),
    ).toBeNull();
  });

  it("defaults the mine-only toggle to on when the user has assigned campaigns", () => {
    render(
      <TestsToRedoTab items={ITEMS} campaigns={CAMPAIGNS_WITH_ASSIGNMENT} />,
    );

    expect(screen.queryByText("Connexion")).toBeNull();
    expect(screen.getByText("Envoi de message")).toBeTruthy();

    fireEvent.press(screen.getByTestId("tests-to-redo-mine-toggle"));

    expect(screen.getByText("Connexion")).toBeTruthy();
  });
});
