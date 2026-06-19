import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import TestCaseScreen from "../../app/(home)/tests/cases/[testCaseId]";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { testsApi } from "../../src/api/tests.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ testCaseId: "case-1" }),
  usePathname: () => "/tests/cases/case-1",
}));
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));
jest.mock("../../src/store/auth.store");
jest.mock("../../src/api/tests.api");

const TESTER_USER = {
  schoolSlug: null,
  user: {
    id: "u1",
    firstName: "Valery",
    lastName: "MBELE",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    profileCompleted: true,
    role: "PARENT",
    activeRole: "PARENT",
    isTester: true,
  },
};

const DETAIL = {
  id: "case-1",
  title: "Connexion email",
  module: null,
  objective: "Vérifier la connexion",
  preconditions: null,
  steps: [],
  expectedResult: "L'utilisateur est connecté",
  orderIndex: 0,
  priority: "MEDIUM",
  evidenceRequired: false,
  dueAt: null,
  campaign: {
    id: "camp-1",
    title: "Campagne v1",
    dueAt: null,
    targetVersion: null,
  },
  audienceRoles: [],
  latestOwnExecution: null,
  executionSummary: { totalExecutions: 0, passed: 0, failed: 0, blocked: 0 },
  completedByUsers: [],
  executions: [],
};

describe("TestCaseScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSuccessToastStore.getState().hide();
    (useAuthStore as unknown as jest.Mock).mockReturnValue(TESTER_USER);
    (testsApi.getTestCase as jest.Mock).mockResolvedValue(DETAIL);
  });

  it("closes the form and shows a success toast after a successful submission", async () => {
    (testsApi.createExecution as jest.Mock).mockResolvedValue({
      id: "exec-1",
      status: "PASSED",
      resultText: "ok",
      comment: null,
      deviceInfo: null,
      appVersion: null,
      executedAt: new Date().toISOString(),
      attachments: [],
    });

    render(<TestCaseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-fab-add")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("tests-fab-add"));

    await waitFor(() => {
      expect(screen.getByTestId("test-execution-form-sheet")).toBeTruthy();
    });
    fireEvent.changeText(
      screen.getByTestId("tests-result-input"),
      "Tout fonctionne",
    );
    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(testsApi.createExecution).toHaveBeenCalled();
      expect(useSuccessToastStore.getState().visible).toBe(true);
      expect(useSuccessToastStore.getState().variant).toBe("success");
    });
  });

  it("shows an error toast and keeps the form open when submission fails", async () => {
    (testsApi.createExecution as jest.Mock).mockRejectedValue(
      new Error("Network down"),
    );

    render(<TestCaseScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("tests-fab-add")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("tests-fab-add"));

    await waitFor(() => {
      expect(screen.getByTestId("test-execution-form-sheet")).toBeTruthy();
    });
    fireEvent.changeText(
      screen.getByTestId("tests-result-input"),
      "Ca ne marche pas",
    );
    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(useSuccessToastStore.getState().visible).toBe(true);
      expect(useSuccessToastStore.getState().variant).toBe("error");
    });
    expect(screen.getByTestId("test-execution-form-sheet")).toBeTruthy();
  });
});
