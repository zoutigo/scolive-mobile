import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  ALL_CAMPAIGNS_FILTER,
  TestsCampaignsTab,
  type TestsCampaignsFilter,
} from "../../src/components/tests/TestsCampaignsTab";
import type { TestCampaignSummary } from "../../src/types/tests.types";

function ControlledTestsCampaignsTab({
  campaigns,
}: {
  campaigns: TestCampaignSummary[];
}) {
  const [filter, setFilter] =
    useState<TestsCampaignsFilter>(ALL_CAMPAIGNS_FILTER);
  return (
    <TestsCampaignsTab
      campaigns={campaigns}
      filter={filter}
      onFilterChange={setFilter}
    />
  );
}

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
    assignedToMe: false,
    summary: { totalCases: 2, completedCases: 2, totalExecutions: 2 },
  },
  {
    id: "progress-1",
    title: "Campagne en cours",
    description: "Messagerie enseignant",
    targetVersion: null,
    startsAt: "2020-01-01T00:00:00.000Z",
    dueAt: "2026-06-26T00:00:00.000Z",
    status: "ACTIVE",
    assignedToMe: false,
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
    assignedToMe: false,
    summary: { totalCases: 3, completedCases: 0, totalExecutions: 0 },
  },
];

function openFilterPanel() {
  fireEvent.press(screen.getByTestId("tests-campaigns-filter-toggle"));
}

describe("TestsCampaignsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all campaigns with the in-progress one first", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.getByText("Campagne à venir")).toBeTruthy();
    expect(screen.getByText("Campagne terminée")).toBeTruthy();
  });

  it("filters to only show in-progress campaigns when applied from the filter panel", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    openFilterPanel();
    fireEvent.press(
      screen.getByTestId("tests-campaigns-filter-status-IN_PROGRESS"),
    );
    fireEvent.press(screen.getByTestId("tests-campaigns-filter-apply"));

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.queryByText("Campagne à venir")).toBeNull();
    expect(screen.queryByText("Campagne terminée")).toBeNull();
  });

  it("shows the filter toggle as active once a status filter is applied", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    const toggle = () => screen.getByTestId("tests-campaigns-filter-toggle");
    expect(
      StyleSheet_flatten(toggle().props.style).backgroundColor,
    ).not.toBe("#247C72");

    openFilterPanel();
    fireEvent.press(
      screen.getByTestId("tests-campaigns-filter-status-IN_PROGRESS"),
    );
    fireEvent.press(screen.getByTestId("tests-campaigns-filter-apply"));

    expect(StyleSheet_flatten(toggle().props.style).backgroundColor).toBe(
      "#247C72",
    );
  });

  it("does not apply a draft filter when the panel is closed instead of applied", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    openFilterPanel();
    fireEvent.press(
      screen.getByTestId("tests-campaigns-filter-status-IN_PROGRESS"),
    );
    fireEvent.press(screen.getByTestId("tests-campaigns-filter-close"));

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.getByText("Campagne à venir")).toBeTruthy();
    expect(screen.getByText("Campagne terminée")).toBeTruthy();
  });

  it("resets applied filters when Reset is pressed", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    openFilterPanel();
    fireEvent.press(
      screen.getByTestId("tests-campaigns-filter-status-IN_PROGRESS"),
    );
    fireEvent.press(screen.getByTestId("tests-campaigns-filter-apply"));
    expect(screen.queryByText("Campagne terminée")).toBeNull();

    openFilterPanel();
    fireEvent.press(screen.getByTestId("tests-campaigns-filter-reset"));
    fireEvent.press(screen.getByTestId("tests-campaigns-filter-close"));

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.getByText("Campagne à venir")).toBeTruthy();
    expect(screen.getByText("Campagne terminée")).toBeTruthy();
  });

  it("navigates to the campaign screen when a card is pressed", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.press(screen.getByTestId("test-campaign-card-progress-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/[campaignId]",
      params: { campaignId: "progress-1" },
    });
  });

  it("shows a compact progress label and due date on the card", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    expect(screen.getByText("1/4 testés")).toBeTruthy();
    expect(screen.getByText("Échéance 26/06/2026")).toBeTruthy();
  });

  it("shows a Start button for a campaign the user has not completed anything on", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    expect(screen.getByTestId("test-campaign-action-upcoming-1")).toBeTruthy();
    expect(screen.getAllByText("Démarrer").length).toBeGreaterThan(0);
  });

  it("shows a Review button once the user has completed at least one case", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    expect(screen.getAllByText("Consulter").length).toBeGreaterThan(0);
  });

  it("navigates to the campaign when the action button is pressed", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.press(screen.getByTestId("test-campaign-action-completed-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/tests/[campaignId]",
      params: { campaignId: "completed-1" },
    });
  });

  it("filters campaigns by search text on title and description", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.changeText(
      screen.getByTestId("tests-campaigns-search-input"),
      "messagerie",
    );

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.queryByText("Campagne à venir")).toBeNull();
    expect(screen.queryByText("Campagne terminée")).toBeNull();
  });

  it("clears the search when the clear button is pressed", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.changeText(
      screen.getByTestId("tests-campaigns-search-input"),
      "messagerie",
    );
    fireEvent.press(screen.getByTestId("tests-campaigns-search-clear"));

    expect(screen.getByText("Campagne à venir")).toBeTruthy();
    expect(screen.getByText("Campagne terminée")).toBeTruthy();
  });

  it("shows a dedicated empty state when no campaign matches the search", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.changeText(
      screen.getByTestId("tests-campaigns-search-input"),
      "inexistant",
    );

    expect(screen.getByTestId("tests-campaigns-no-results")).toBeTruthy();
    expect(screen.queryByText("Campagne en cours")).toBeNull();
  });

  it("resets search and filters from the empty-search state", () => {
    render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

    fireEvent.changeText(
      screen.getByTestId("tests-campaigns-search-input"),
      "inexistant",
    );
    fireEvent.press(screen.getByTestId("tests-campaigns-reset-search"));

    expect(screen.getByText("Campagne en cours")).toBeTruthy();
    expect(screen.getByText("Campagne à venir")).toBeTruthy();
    expect(screen.getByText("Campagne terminée")).toBeTruthy();
  });

  it("shows the empty module state when there are no campaigns at all", () => {
    render(<ControlledTestsCampaignsTab campaigns={[]} />);

    expect(screen.getByText("Aucune campagne active")).toBeTruthy();
  });

  describe("mine-only filter", () => {
    it("defaults to showing only assigned campaigns when the user has assignments", () => {
      const withAssignment: TestCampaignSummary[] = [
        { ...CAMPAIGNS[0], assignedToMe: true },
        CAMPAIGNS[1],
        CAMPAIGNS[2],
      ];
      render(<ControlledTestsCampaignsTab campaigns={withAssignment} />);

      expect(screen.getByText("Campagne terminée")).toBeTruthy();
      expect(screen.queryByText("Campagne en cours")).toBeNull();
      expect(screen.queryByText("Campagne à venir")).toBeNull();
    });

    it("defaults to showing all campaigns when the user has no assignments", () => {
      render(<ControlledTestsCampaignsTab campaigns={CAMPAIGNS} />);

      expect(screen.getByText("Campagne en cours")).toBeTruthy();
      expect(screen.getByText("Campagne à venir")).toBeTruthy();
      expect(screen.getByText("Campagne terminée")).toBeTruthy();
    });

    it("toggles mine-only filtering from the filter panel", () => {
      const withAssignment: TestCampaignSummary[] = [
        { ...CAMPAIGNS[0], assignedToMe: true },
        CAMPAIGNS[1],
        CAMPAIGNS[2],
      ];
      render(<ControlledTestsCampaignsTab campaigns={withAssignment} />);

      expect(screen.queryByText("Campagne en cours")).toBeNull();

      openFilterPanel();
      fireEvent.press(screen.getByTestId("tests-campaigns-filter-mine"));
      fireEvent.press(screen.getByTestId("tests-campaigns-filter-apply"));

      expect(screen.getByText("Campagne en cours")).toBeTruthy();
      expect(screen.getByText("Campagne à venir")).toBeTruthy();
      expect(screen.getByText("Campagne terminée")).toBeTruthy();
    });
  });
});

function StyleSheet_flatten(style: unknown) {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]));
}
