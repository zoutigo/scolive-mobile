import React, { useState } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import {
  AdminTestsCampaignsTab,
  EMPTY_CAMPAIGNS_FILTER,
  type AdminCampaignsFilter,
} from "../../src/components/tests-admin/AdminTestsCampaignsTab";
import { testsAdminApi } from "../../src/api/tests-admin.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("../../src/api/tests-admin.api");

const CAMPAIGN_1 = {
  id: "camp-1",
  reference: 1,
  title: "Recette mobile v1",
  description: null,
  targetVersion: null,
  startsAt: null,
  dueAt: null,
  status: "ACTIVE" as const,
  school: { id: "school-1", name: "College Vogt", slug: "college-vogt" },
  testCasesCount: 2,
};

function ControlledAdminTestsCampaignsTab() {
  const [filter, setFilter] = useState<AdminCampaignsFilter>(
    EMPTY_CAMPAIGNS_FILTER,
  );
  return <AdminTestsCampaignsTab filter={filter} onFilterChange={setFilter} />;
}

describe("AdminTestsCampaignsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (testsAdminApi.listCampaigns as jest.Mock).mockResolvedValue({
      items: [CAMPAIGN_1],
    });
    (testsAdminApi.createCampaign as jest.Mock).mockResolvedValue(CAMPAIGN_1);
  });

  it("loads and displays campaigns", async () => {
    render(<ControlledAdminTestsCampaignsTab />);

    await waitFor(() => {
      expect(screen.getByText("Recette mobile v1")).toBeTruthy();
    });
    expect(testsAdminApi.listCampaigns).toHaveBeenCalledWith({
      search: undefined,
      status: undefined,
    });
  });

  it("reloads with the status filter when a chip is pressed", async () => {
    render(<ControlledAdminTestsCampaignsTab />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-tests-filter-ACTIVE")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("admin-tests-filter-ACTIVE"));

    await waitFor(() => {
      expect(testsAdminApi.listCampaigns).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ACTIVE" }),
      );
    });
  });

  it("navigates to the campaign detail screen when a card is pressed", async () => {
    render(<ControlledAdminTestsCampaignsTab />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-campaign-card-camp-1")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("admin-campaign-card-camp-1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/admin-tests/[campaignId]",
      params: { campaignId: "camp-1" },
    });
  });

  it("creates a new campaign and reloads the list", async () => {
    render(<ControlledAdminTestsCampaignsTab />);

    fireEvent.press(
      await screen.findByTestId("admin-open-create-campaign-btn"),
    );
    expect(await screen.findByTestId("campaign-form-sheet")).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId("campaign-form-title"),
      "Recette mobile v3",
    );
    fireEvent.press(screen.getByTestId("campaign-form-save-btn"));

    await waitFor(() => {
      expect(testsAdminApi.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Recette mobile v3" }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByTestId("campaign-form-sheet")).toBeNull();
    });
  });
});
