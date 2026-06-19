import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { AdminTestsScreen } from "../../src/components/tests-admin/AdminTestsScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { testsAdminApi } from "../../src/api/tests-admin.api";
import { messagingApi } from "../../src/api/messaging.api";
import { useLocaleStore } from "../../src/store/locale.store";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));
jest.mock("../../src/store/auth.store");
jest.mock("../../src/api/tests-admin.api");
jest.mock("../../src/api/messaging.api");

const SUPER_ADMIN_USER = {
  schoolSlug: null,
  user: {
    id: "admin-1",
    firstName: "Admin",
    lastName: "Scolive",
    platformRoles: ["SUPER_ADMIN"],
    memberships: [],
    profileCompleted: true,
    role: "SUPER_ADMIN",
    activeRole: "SUPER_ADMIN",
  },
};

const SYNTHESIS = {
  campaigns: { draft: 1, active: 2, archived: 0, total: 3 },
  totalCases: 10,
  executions: { total: 8, passed: 6, failed: 2, blocked: 0, successRate: 0.75 },
  testersCount: 4,
};

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

const TESTER_1 = {
  id: "tester-1",
  fullName: "MBELE Valery",
  email: "valery@example.com",
  schools: [{ id: "school-1", name: "College Vogt", slug: "college-vogt" }],
  stats: {
    campaignsCount: 2,
    executionsCount: 5,
    passedCount: 4,
    failedCount: 1,
  },
};

describe("AdminTestsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
    (testsAdminApi.getSynthesis as jest.Mock).mockResolvedValue(SYNTHESIS);
    (testsAdminApi.listCampaigns as jest.Mock).mockResolvedValue({
      items: [CAMPAIGN_1],
    });
    (testsAdminApi.listTesters as jest.Mock).mockResolvedValue({
      items: [TESTER_1],
    });
    (messagingApi.send as jest.Mock).mockResolvedValue(undefined);
  });

  it("shows a restricted message for users without ADMIN/SUPER_ADMIN platform roles", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Valery",
        lastName: "MBELE",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "PARENT" }],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
      },
    });

    render(<AdminTestsScreen />);

    expect(await screen.findByText("Accès restreint")).toBeTruthy();
    expect(testsAdminApi.getSynthesis).not.toHaveBeenCalled();
  });

  it("loads and displays the synthesis KPIs for a SUPER_ADMIN", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(SUPER_ADMIN_USER);

    render(<AdminTestsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-tests-summary")).toBeTruthy();
    });
    expect(
      within(screen.getByTestId("admin-tests-kpi-campaignsTotal")).getByText(
        "3",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("admin-tests-kpi-successRate")).getByText(
        "75%",
      ),
    ).toBeTruthy();
  });

  it("lists campaigns in the campaigns tab and searches by query", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(SUPER_ADMIN_USER);

    render(<AdminTestsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-tests-tab-campaigns")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("admin-tests-tab-campaigns"));

    await waitFor(() => {
      expect(screen.getByText("Recette mobile v1")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId("admin-tests-search"), "1");

    await waitFor(() => {
      expect(testsAdminApi.listCampaigns).toHaveBeenCalledWith(
        expect.objectContaining({ search: "1" }),
      );
    });
  });

  it("shows testers with stats and sends a quick message", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue(SUPER_ADMIN_USER);

    render(<AdminTestsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-tests-tab-testers")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("admin-tests-tab-testers"));

    await waitFor(() => {
      expect(screen.getByTestId("admin-tester-row-tester-1")).toBeTruthy();
    });
    expect(screen.getByText("MBELE Valery")).toBeTruthy();

    fireEvent.press(screen.getByTestId("admin-tester-message-tester-1"));

    await waitFor(() => {
      expect(screen.getByTestId("quick-message-sheet")).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByTestId("quick-message-subject"),
      "Merci de tester",
    );
    fireEvent.changeText(
      screen.getByTestId("quick-message-body"),
      "Pouvez-vous rejouer la campagne ?",
    );
    fireEvent.press(screen.getByTestId("quick-message-send"));

    await waitFor(() => {
      expect(messagingApi.send).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          subject: "Merci de tester",
          body: "Pouvez-vous rejouer la campagne ?",
          recipientUserIds: ["tester-1"],
        }),
      );
    });
    expect(await screen.findByTestId("quick-message-sent")).toBeTruthy();
  });

  it("renders the restricted state in English when locale=en", async () => {
    useLocaleStore.setState({ locale: "en" });
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      schoolSlug: "college-vogt",
      user: {
        id: "u1",
        firstName: "Valery",
        lastName: "MBELE",
        platformRoles: [],
        memberships: [],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
      },
    });

    render(<AdminTestsScreen />);

    expect(await screen.findByText("Restricted access")).toBeTruthy();
    expect(screen.queryByText("Accès restreint")).toBeNull();
  });
});
