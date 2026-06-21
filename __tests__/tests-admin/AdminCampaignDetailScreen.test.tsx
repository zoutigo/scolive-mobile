import React from "react";
import { Alert } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AdminCampaignDetailScreen } from "../../src/components/tests-admin/AdminCampaignDetailScreen";
import { testsAdminApi } from "../../src/api/tests-admin.api";
import { messagingApi } from "../../src/api/messaging.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ campaignId: "camp-1" }),
}));
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, []);
  },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));
jest.mock("../../src/api/tests-admin.api");
jest.mock("../../src/api/messaging.api");

const CAMPAIGN_DETAIL = {
  id: "camp-1",
  reference: 1,
  title: "Recette mobile v1",
  description: null,
  targetVersion: null,
  startsAt: null,
  dueAt: null,
  status: "ACTIVE" as const,
  school: null,
  testCasesCount: 1,
  testCases: [
    {
      id: "case-1",
      reference: 1,
      title: "Connexion email",
      module: "Auth",
      objective: "Vérifier la connexion",
      preconditions: null,
      expectedResult: "L'utilisateur est connecté",
      priority: "MEDIUM" as const,
      dueAt: null,
      evidenceRequired: false,
      recycledAt: null,
      audienceRoles: [],
      executionsCount: 3,
    },
  ],
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

const ASSIGNMENT_1 = {
  id: "assign-1",
  note: "Prioritaire avant vendredi",
  createdAt: new Date().toISOString(),
  user: {
    id: "tester-1",
    firstName: "Valery",
    lastName: "MBELE",
    email: "valery@example.com",
  },
  assignedBy: { id: "admin-1", firstName: "Admin", lastName: "Scolive" },
};

describe("AdminCampaignDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (testsAdminApi.getCampaign as jest.Mock).mockResolvedValue(CAMPAIGN_DETAIL);
    (testsAdminApi.listAssignments as jest.Mock).mockResolvedValue([]);
    (testsAdminApi.listTesters as jest.Mock).mockResolvedValue({
      items: [TESTER_1],
    });
    (testsAdminApi.recycleCase as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.updateCase as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.createCase as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.deleteCase as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.updateCampaign as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.deleteCampaign as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.assignCampaign as jest.Mock).mockResolvedValue(ASSIGNMENT_1);
    (testsAdminApi.unassignCampaign as jest.Mock).mockResolvedValue(undefined);
    (messagingApi.send as jest.Mock).mockResolvedValue(undefined);
  });

  it("renders the campaign's test cases and recycles one", async () => {
    render(<AdminCampaignDetailScreen />);

    expect(await screen.findByText("Connexion email")).toBeTruthy();

    fireEvent.press(screen.getByTestId("admin-case-recycle-case-1"));

    await waitFor(() => {
      expect(testsAdminApi.recycleCase).toHaveBeenCalledWith("case-1");
    });
  });

  it("edits a test case", async () => {
    render(<AdminCampaignDetailScreen />);

    fireEvent.press(await screen.findByTestId("admin-case-edit-case-1"));

    expect(await screen.findByTestId("edit-case-sheet")).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId("edit-case-expected-result"),
      "Le mot de passe est réinitialisé",
    );
    fireEvent.press(screen.getByTestId("edit-case-save-btn"));

    await waitFor(() => {
      expect(testsAdminApi.updateCase).toHaveBeenCalledWith(
        "case-1",
        expect.objectContaining({
          expectedResult: "Le mot de passe est réinitialisé",
        }),
      );
    });
  });

  it("creates a new test case from the campaign detail screen", async () => {
    render(<AdminCampaignDetailScreen />);

    fireEvent.press(await screen.findByTestId("admin-open-create-case-btn"));
    expect(await screen.findByTestId("create-case-sheet")).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId("edit-case-title"),
      "Mot de passe oublié",
    );
    fireEvent.changeText(
      screen.getByTestId("edit-case-expected-result"),
      "Le lien de réinitialisation est envoyé",
    );
    fireEvent.press(screen.getByTestId("edit-case-save-btn"));

    await waitFor(() => {
      expect(testsAdminApi.createCase).toHaveBeenCalledWith(
        "camp-1",
        expect.objectContaining({
          title: "Mot de passe oublié",
          expectedResult: "Le lien de réinitialisation est envoyé",
        }),
      );
    });
  });

  it("deletes a test case after confirmation", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const destructive = buttons?.find((b) => b.style === "destructive");
        destructive?.onPress?.();
      });

    render(<AdminCampaignDetailScreen />);

    fireEvent.press(await screen.findByTestId("admin-case-delete-case-1"));

    await waitFor(() => {
      expect(testsAdminApi.deleteCase).toHaveBeenCalledWith("case-1");
    });

    alertSpy.mockRestore();
  });

  it("edits the campaign", async () => {
    render(<AdminCampaignDetailScreen />);

    fireEvent.press(await screen.findByTestId("admin-edit-campaign-btn"));
    expect(await screen.findByTestId("campaign-form-sheet")).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId("campaign-form-title"),
      "Recette mobile v2",
    );
    fireEvent.press(screen.getByTestId("campaign-form-save-btn"));

    await waitFor(() => {
      expect(testsAdminApi.updateCampaign).toHaveBeenCalledWith(
        "camp-1",
        expect.objectContaining({ title: "Recette mobile v2" }),
      );
    });
  });

  it("deletes the campaign after confirmation", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const destructive = buttons?.find((b) => b.style === "destructive");
        destructive?.onPress?.();
      });

    render(<AdminCampaignDetailScreen />);

    fireEvent.press(await screen.findByTestId("admin-delete-campaign-btn"));

    await waitFor(() => {
      expect(testsAdminApi.deleteCampaign).toHaveBeenCalledWith("camp-1");
    });

    alertSpy.mockRestore();
  });

  it("assigns a tester to the campaign", async () => {
    render(<AdminCampaignDetailScreen />);

    fireEvent.press(await screen.findByTestId("admin-open-assign-btn"));
    expect(await screen.findByTestId("assign-campaign-sheet")).toBeTruthy();

    fireEvent.press(screen.getByTestId("assign-tester-select-trigger"));
    fireEvent.press(
      await screen.findByTestId("assign-tester-select-option-tester-1"),
    );
    fireEvent.press(screen.getByTestId("assign-save-btn"));

    await waitFor(() => {
      expect(testsAdminApi.assignCampaign).toHaveBeenCalledWith("camp-1", {
        testerId: "tester-1",
        note: undefined,
      });
    });
  });

  it("unassigns a tester and sends a quick message", async () => {
    (testsAdminApi.listAssignments as jest.Mock).mockResolvedValue([
      ASSIGNMENT_1,
    ]);

    render(<AdminCampaignDetailScreen />);

    expect(await screen.findByTestId("admin-assignment-assign-1")).toBeTruthy();

    fireEvent.press(screen.getByTestId("admin-assignment-message-assign-1"));
    expect(await screen.findByTestId("quick-message-sheet")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("quick-message-subject"), "Merci");
    fireEvent.changeText(screen.getByTestId("quick-message-body"), "Test");
    fireEvent.press(screen.getByTestId("quick-message-send"));

    await waitFor(() => {
      expect(messagingApi.send).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ recipientUserIds: ["tester-1"] }),
      );
    });

    fireEvent.press(screen.getByTestId("quick-message-close"));

    fireEvent.press(screen.getByTestId("admin-assignment-unassign-assign-1"));

    await waitFor(() => {
      expect(testsAdminApi.unassignCampaign).toHaveBeenCalledWith("assign-1");
    });
  });
});
