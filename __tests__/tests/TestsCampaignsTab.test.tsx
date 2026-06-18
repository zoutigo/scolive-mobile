import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { TestsCampaignsTab } from "../../src/components/tests/TestsCampaignsTab";
import type { TestCampaignSummary } from "../../src/types/tests.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const CAMPAIGNS: TestCampaignSummary[] = [
  {
    id: "completed-1",
    title: "Campagne terminée",
    description: null,
    targetVersion: null,
    startsAt: null,
    dueAt: null,
    status: "ACTIVE",
    summary: { totalCases: 2, completedCases: 2, totalExecutions: 2 },
  },
  {
    id: "progress-1",
    title: "Campagne en cours",
    description: null,
    targetVersion: null,
    startsAt: "2020-01-01T00:00:00.000Z",
    dueAt: null,
    status: "ACTIVE",
    summary: { totalCases: 4, completedCases: 1, totalExecutions: 1 },
  },
  {
    id: "upcoming-1",
    title: "Campagne à venir",
    description: null,
    targetVersion: null,
    startsAt: "2099-01-01T00:00:00.000Z",
    dueAt: null,
    status: "ACTIVE",
    summary: { totalCases: 3, completedCases: 0, totalExecutions: 0 },
  },
];

describe("TestsCampaignsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all campaigns with the in-progress one first", () => {
    render(<TestsCampaignsTab campaigns={CAMPAIGNS} />);

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.getByText("Campagne à venir")).toBeTruthy();
    expect(screen.getByText("Campagne terminée")).toBeTruthy();
  });

  it("filters to only show in-progress campaigns when selected", () => {
    render(<TestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.press(screen.getByTestId("tests-campaigns-filter-IN_PROGRESS"));

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.queryByText("Campagne à venir")).toBeNull();
    expect(screen.queryByText("Campagne terminée")).toBeNull();
  });

  it("navigates to the campaign screen when a card is pressed", () => {
    render(<TestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.press(screen.getByTestId("test-campaign-card-progress-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/[campaignId]",
      params: { campaignId: "progress-1" },
    });
  });
});
