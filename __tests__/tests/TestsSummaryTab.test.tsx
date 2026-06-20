import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
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
});
