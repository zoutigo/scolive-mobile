import React from "react";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { TestsSummaryKpis } from "../../src/components/tests/TestsSummaryKpis";
import { ALL_CAMPAIGNS_FILTER } from "../../src/components/tests/TestsCampaignsTab";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const DATA = {
  totalCampaigns: 5,
  inProgressCampaigns: 2,
  completedCampaigns: 1,
  upcomingCampaigns: 2,
  totalCases: 12,
  pendingCases: 4,
};

const LABELS = {
  totalCampaigns: "Campagnes",
  inProgress: "En cours",
  completed: "Terminées",
  upcoming: "À venir",
  totalCases: "Cas de test",
  pending: "Tests restants",
};

describe("TestsSummaryKpis", () => {
  it("renders every KPI count", () => {
    render(<TestsSummaryKpis data={DATA} labels={LABELS} />);

    expect(
      within(screen.getByTestId("tests-kpi-total-campaigns")).getByText("5"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("tests-kpi-in-progress")).getByText("2"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("tests-kpi-pending")).getByText("4"),
    ).toBeTruthy();
  });

  it("calls onCampaignsFilterPress with the matching filter for each card", () => {
    const onCampaignsFilterPress = jest.fn();
    render(
      <TestsSummaryKpis
        data={DATA}
        labels={LABELS}
        onCampaignsFilterPress={onCampaignsFilterPress}
      />,
    );

    fireEvent.press(screen.getByTestId("tests-kpi-in-progress"));
    expect(onCampaignsFilterPress).toHaveBeenLastCalledWith("IN_PROGRESS");

    fireEvent.press(screen.getByTestId("tests-kpi-upcoming"));
    expect(onCampaignsFilterPress).toHaveBeenLastCalledWith("UPCOMING");

    fireEvent.press(screen.getByTestId("tests-kpi-completed"));
    expect(onCampaignsFilterPress).toHaveBeenLastCalledWith("COMPLETED");

    fireEvent.press(screen.getByTestId("tests-kpi-total-campaigns"));
    expect(onCampaignsFilterPress).toHaveBeenLastCalledWith(
      ALL_CAMPAIGNS_FILTER,
    );

    fireEvent.press(screen.getByTestId("tests-kpi-total-cases"));
    expect(onCampaignsFilterPress).toHaveBeenLastCalledWith(
      ALL_CAMPAIGNS_FILTER,
    );

    fireEvent.press(screen.getByTestId("tests-kpi-pending"));
    expect(onCampaignsFilterPress).toHaveBeenLastCalledWith(
      ALL_CAMPAIGNS_FILTER,
    );
  });
});
