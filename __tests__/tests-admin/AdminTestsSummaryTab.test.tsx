import React from "react";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { AdminTestsSummaryTab } from "../../src/components/tests-admin/AdminTestsSummaryTab";
import { EMPTY_EXECUTIONS_FILTER } from "../../src/components/tests-admin/AdminTestsExecutionsTab";
import { EMPTY_CAMPAIGNS_FILTER } from "../../src/components/tests-admin/AdminTestsCampaignsTab";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const SYNTHESIS = {
  campaigns: { draft: 1, active: 2, archived: 0, total: 3 },
  totalCases: 10,
  executions: {
    total: 8,
    passed: 6,
    failed: 2,
    blocked: 0,
    successRate: 0.75,
    pendingReview: 1,
  },
  testersCount: 4,
};

describe("AdminTestsSummaryTab", () => {
  it("renders every KPI value", () => {
    render(<AdminTestsSummaryTab data={SYNTHESIS} />);

    expect(
      within(screen.getByTestId("admin-tests-kpi-campaignsActive")).getByText(
        "2",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("admin-tests-kpi-campaignsTotal")).getByText(
        "3",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("admin-tests-kpi-totalCases")).getByText("10"),
    ).toBeTruthy();
  });

  it("navigates to active campaigns when the campaignsActive card is pressed", () => {
    const onCampaignsKpiPress = jest.fn();
    render(
      <AdminTestsSummaryTab
        data={SYNTHESIS}
        onCampaignsKpiPress={onCampaignsKpiPress}
      />,
    );

    fireEvent.press(screen.getByTestId("admin-tests-kpi-campaignsActive"));

    expect(onCampaignsKpiPress).toHaveBeenCalledWith("ACTIVE");
  });

  it("navigates to all campaigns when the campaignsTotal or totalCases card is pressed", () => {
    const onCampaignsKpiPress = jest.fn();
    render(
      <AdminTestsSummaryTab
        data={SYNTHESIS}
        onCampaignsKpiPress={onCampaignsKpiPress}
      />,
    );

    fireEvent.press(screen.getByTestId("admin-tests-kpi-campaignsTotal"));
    fireEvent.press(screen.getByTestId("admin-tests-kpi-totalCases"));

    expect(onCampaignsKpiPress).toHaveBeenNthCalledWith(
      1,
      EMPTY_CAMPAIGNS_FILTER,
    );
    expect(onCampaignsKpiPress).toHaveBeenNthCalledWith(
      2,
      EMPTY_CAMPAIGNS_FILTER,
    );
  });

  it("navigates to failed executions when the failed card is pressed", () => {
    const onKpiPress = jest.fn();
    render(<AdminTestsSummaryTab data={SYNTHESIS} onKpiPress={onKpiPress} />);

    fireEvent.press(screen.getByTestId("admin-tests-kpi-failed"));

    expect(onKpiPress).toHaveBeenCalledWith({
      ...EMPTY_EXECUTIONS_FILTER,
      status: "FAILED",
    });
  });
});
