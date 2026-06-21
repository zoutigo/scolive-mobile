import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AdminExecutionDetailCard } from "../../src/components/tests-admin/AdminExecutionDetailCard";
import { testsAdminApi } from "../../src/api/tests-admin.api";
import { messagingApi } from "../../src/api/messaging.api";

jest.mock("../../src/api/tests-admin.api");
jest.mock("../../src/api/messaging.api");

const EXECUTION_DETAIL = {
  id: "exec-1",
  status: "FAILED" as const,
  resultText: "Erreur 500",
  comment: null,
  executedAt: new Date().toISOString(),
  adminReviewedAt: null,
  adminReviewNote: null,
  user: { id: "tester-1", fullName: "MBELE Valery" },
  adminReviewedBy: null,
  testCase: { id: "case-1", title: "Connexion email" },
  campaign: { id: "camp-1", title: "Recette mobile v1" },
  deviceInfo: null,
  appVersion: null,
  createdAt: new Date().toISOString(),
  attachments: [],
};

const CASE_DETAIL = {
  id: "case-1",
  reference: 1,
  title: "Connexion email",
  module: "Auth",
  objective: "Vérifier la connexion",
  preconditions: "Compte créé",
  expectedResult: "L'utilisateur est connecté",
  priority: "MEDIUM" as const,
  dueAt: null,
  evidenceRequired: false,
  recycledAt: null,
  audienceRoles: [],
  executionsCount: 4,
  campaign: { id: "camp-1", title: "Recette mobile v1" },
};

const TESTER_1 = {
  id: "tester-1",
  fullName: "MBELE Valery",
  email: "valery@example.com",
  schools: [{ id: "school-1", name: "College Vogt", slug: "college-vogt" }],
  stats: {
    campaignsCount: 1,
    executionsCount: 4,
    passedCount: 3,
    failedCount: 1,
  },
};

describe("AdminExecutionDetailCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (testsAdminApi.getExecution as jest.Mock).mockResolvedValue(
      EXECUTION_DETAIL,
    );
    (testsAdminApi.getCase as jest.Mock).mockResolvedValue(CASE_DETAIL);
    (messagingApi.send as jest.Mock).mockResolvedValue(undefined);
  });

  it("shows the full test case content when 'view case' is pressed", async () => {
    render(
      <AdminExecutionDetailCard
        executionId="exec-1"
        isActive
        testers={[TESTER_1]}
      />,
    );

    fireEvent.press(
      await screen.findByTestId("admin-execution-view-case-exec-1"),
    );

    expect(await screen.findByTestId("test-case-content-sheet")).toBeTruthy();
    expect(testsAdminApi.getCase).toHaveBeenCalledWith("case-1");
    expect(await screen.findByText("Vérifier la connexion")).toBeTruthy();
    expect(screen.getByText("Compte créé")).toBeTruthy();
    expect(screen.getByText("L'utilisateur est connecté")).toBeTruthy();
  });

  it("sends a quick message to the tester, prefilled with the test case title", async () => {
    render(
      <AdminExecutionDetailCard
        executionId="exec-1"
        isActive
        testers={[TESTER_1]}
      />,
    );

    fireEvent.press(
      await screen.findByTestId("admin-execution-quick-message-exec-1"),
    );

    expect(await screen.findByTestId("quick-message-sheet")).toBeTruthy();
    expect(screen.getByTestId("quick-message-subject").props.value).toBe(
      "Connexion email",
    );

    fireEvent.changeText(
      screen.getByTestId("quick-message-body"),
      "Pouvez-vous rejouer ce test ?",
    );
    fireEvent.press(screen.getByTestId("quick-message-send"));

    await waitFor(() => {
      expect(messagingApi.send).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          subject: "Connexion email",
          recipientUserIds: ["tester-1"],
        }),
      );
    });
  });

  it("hides the quick message button when the tester is not in the provided list", async () => {
    render(
      <AdminExecutionDetailCard executionId="exec-1" isActive testers={[]} />,
    );

    expect(
      await screen.findByTestId("admin-execution-view-case-exec-1"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("admin-execution-quick-message-exec-1"),
    ).toBeNull();
  });
});
