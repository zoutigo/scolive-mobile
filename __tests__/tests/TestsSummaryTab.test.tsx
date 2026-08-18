import React from "react";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { TestsSummaryTab } from "../../src/components/tests/TestsSummaryTab";
import { ALL_CAMPAIGNS_FILTER } from "../../src/components/tests/TestsCampaignsTab";
import type { TestCampaignSummary } from "../../src/types/tests.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const CAMPAIGNS: TestCampaignSummary[] = [
  {
    id: "progress-1",
    title: "Campagne en cours",
    description: null,
    targetVersion: null,
    startsAt: "2020-01-01T00:00:00.000Z",
    dueAt: null,
    status: "ACTIVE",
    assignedToMe: false,
    summary: { totalCases: 4, completedCases: 1, totalExecutions: 1 },
  },
];

describe("TestsSummaryTab", () => {
  beforeEach(() => jest.clearAllMocks());

  it("forwards the campaigns filter when a KPI card is pressed", () => {
    const onCampaignsFilterPress = jest.fn();
    render(
      <TestsSummaryTab
        campaigns={CAMPAIGNS}
        onCampaignsFilterPress={onCampaignsFilterPress}
      />,
    );

    fireEvent.press(screen.getByTestId("tests-kpi-total-campaigns"));

    expect(onCampaignsFilterPress).toHaveBeenCalledWith(ALL_CAMPAIGNS_FILTER);
  });

  it("navigates to the highlighted campaign when its CTA is pressed", () => {
    render(<TestsSummaryTab campaigns={CAMPAIGNS} />);

    fireEvent.press(screen.getByTestId("tests-highlight-cta"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/[campaignId]",
      params: { campaignId: "progress-1" },
    });
  });

  it("renders the CTA as a real button labelled 'Faire le test'", () => {
    render(<TestsSummaryTab campaigns={CAMPAIGNS} />);

    expect(screen.getByText("Faire le test")).toBeTruthy();
  });

  it("renders the campaign badge next to the 'To do today' title", () => {
    render(<TestsSummaryTab campaigns={CAMPAIGNS} />);

    expect(screen.getByText("Campagne")).toBeTruthy();
    expect(screen.getByText("À faire aujourd'hui")).toBeTruthy();
  });

  it("does not render a mine caption on the KPI cards when the user has no assigned campaigns", () => {
    render(<TestsSummaryTab campaigns={CAMPAIGNS} />);

    expect(screen.queryByTestId("tests-kpi-total-campaigns-mine")).toBeNull();
  });

  it("renders a mine caption on the KPI cards when the user has assigned campaigns", () => {
    const withAssignment = [{ ...CAMPAIGNS[0], assignedToMe: true }];
    render(<TestsSummaryTab campaigns={withAssignment} />);

    expect(
      within(screen.getByTestId("tests-kpi-total-campaigns")).getByText(
        "dont 1 pour moi",
      ),
    ).toBeTruthy();
  });

  it("does not render the campaign badge or CTA when there is nothing to do today", () => {
    const noPendingCampaigns: TestCampaignSummary[] = [
      {
        ...CAMPAIGNS[0],
        summary: { totalCases: 4, completedCases: 4, totalExecutions: 4 },
      },
    ];
    render(<TestsSummaryTab campaigns={noPendingCampaigns} />);

    expect(screen.queryByText("Campagne")).toBeNull();
    expect(screen.queryByTestId("tests-highlight-cta")).toBeNull();
  });
});
