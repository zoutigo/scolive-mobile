import React from "react";
import { Alert } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AdminCaseDetailScreen } from "../../src/components/tests-admin/AdminCaseDetailScreen";
import { testsAdminApi } from "../../src/api/tests-admin.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({
    campaignId: "camp-1",
    testCaseId: "case-2",
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));
jest.mock("../../src/api/tests-admin.api");

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

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
  testCasesCount: 2,
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
    {
      id: "case-2",
      reference: 2,
      title: "Mot de passe oublié",
      module: "Auth",
      objective: "Vérifier la réinitialisation",
      preconditions: "Compte existant",
      expectedResult: "Le lien est envoyé",
      priority: "HIGH" as const,
      dueAt: null,
      evidenceRequired: true,
      recycledAt: null,
      audienceRoles: ["PARENT"],
      executionsCount: 1,
    },
  ],
};

const CASE_2_DETAIL = {
  ...CAMPAIGN_DETAIL.testCases[1],
  campaign: { id: "camp-1", title: "Recette mobile v1" },
};

describe("AdminCaseDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (testsAdminApi.getCampaign as jest.Mock).mockResolvedValue(CAMPAIGN_DETAIL);
    (testsAdminApi.getCase as jest.Mock).mockImplementation((id: string) =>
      Promise.resolve(
        id === "case-2"
          ? CASE_2_DETAIL
          : {
              ...CAMPAIGN_DETAIL.testCases[0],
              campaign: CASE_2_DETAIL.campaign,
            },
      ),
    );
    (testsAdminApi.updateCase as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.recycleCase as jest.Mock).mockResolvedValue(undefined);
    (testsAdminApi.deleteCase as jest.Mock).mockResolvedValue(undefined);
  });

  it("loads the campaign's case ids and shows the full content of the active test case", async () => {
    render(<AdminCaseDetailScreen />);

    expect(await screen.findByText("Mot de passe oublié")).toBeTruthy();
    expect(screen.getByText("Vérifier la réinitialisation")).toBeTruthy();
    expect(screen.getByText("Compte existant")).toBeTruthy();
    expect(screen.getByText("Le lien est envoyé")).toBeTruthy();
  });

  it("edits the active test case, shows a success toast and stays on the detail page", async () => {
    render(<AdminCaseDetailScreen />);

    fireEvent.press(await screen.findByTestId("admin-case-detail-edit-case-2"));
    expect(await screen.findByTestId("edit-case-sheet")).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId("edit-case-expected-result"),
      "Le lien est envoyé instantanément",
    );
    fireEvent.press(screen.getByTestId("edit-case-save-btn"));

    await waitFor(() => {
      expect(testsAdminApi.updateCase).toHaveBeenCalledWith(
        "case-2",
        expect.objectContaining({
          expectedResult: "Le lien est envoyé instantanément",
        }),
      );
    });
    expect(mockShowSuccess).toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("recycles the active test case and shows a success toast", async () => {
    render(<AdminCaseDetailScreen />);

    fireEvent.press(
      await screen.findByTestId("admin-case-detail-recycle-case-2"),
    );

    await waitFor(() => {
      expect(testsAdminApi.recycleCase).toHaveBeenCalledWith("case-2");
    });
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  it("deletes the active test case after confirmation and navigates back", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const destructive = buttons?.find((b) => b.style === "destructive");
        destructive?.onPress?.();
      });

    render(<AdminCaseDetailScreen />);

    fireEvent.press(
      await screen.findByTestId("admin-case-detail-delete-case-2"),
    );

    await waitFor(() => {
      expect(testsAdminApi.deleteCase).toHaveBeenCalledWith("case-2");
    });
    expect(mockShowSuccess).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
