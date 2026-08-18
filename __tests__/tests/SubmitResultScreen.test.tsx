import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import SubmitResultRoute from "../../app/(home)/tests/cases/[testCaseId]/submit";
import { testsApi } from "../../src/api/tests.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "1",
}));

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({
    testCaseId: "case-1",
    evidenceRequired: "0",
  }),
  usePathname: () => "/tests/cases/case-1/submit",
}));
jest.mock("../../src/api/tests.api");
jest.mock("../../src/store/success-toast.store");

describe("SubmitResultScreen", () => {
  const showSuccess = jest.fn();
  const showError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSuccessToastStore as unknown as jest.Mock).mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ showSuccess, showError }),
    );
  });

  it("does not preselect any status by default", () => {
    render(<SubmitResultRoute />);

    expect(screen.getByText("Sélectionnez le statut du test")).toBeTruthy();
  });

  it("blocks submission and shows an inline error when no status is selected", async () => {
    render(<SubmitResultRoute />);

    fireEvent.changeText(
      screen.getByTestId("tests-result-input"),
      "Tout fonctionne comme prévu",
    );
    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(
        screen.getByText("Sélectionnez un statut avant d'enregistrer."),
      ).toBeTruthy();
    });
    expect(testsApi.createExecution).not.toHaveBeenCalled();
  });

  it("submits the selected status once picked from the dropdown", async () => {
    (testsApi.createExecution as jest.Mock).mockResolvedValue(undefined);
    render(<SubmitResultRoute />);

    fireEvent.press(screen.getByTestId("tests-submit-status"));
    fireEvent.press(screen.getByTestId("tests-submit-status-option-PASSED"));
    fireEvent.changeText(
      screen.getByTestId("tests-result-input"),
      "Tout fonctionne comme prévu",
    );
    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(testsApi.createExecution).toHaveBeenCalledWith(
        "case-1",
        expect.objectContaining({ status: "PASSED" }),
      );
    });
    expect(showSuccess).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it("blocks submission when the status is selected but the result text is empty", async () => {
    render(<SubmitResultRoute />);

    fireEvent.press(screen.getByTestId("tests-submit-status"));
    fireEvent.press(screen.getByTestId("tests-submit-status-option-FAILED"));
    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(
        screen.getByText("Décrivez le résultat observé avant d'enregistrer."),
      ).toBeTruthy();
    });
    expect(testsApi.createExecution).not.toHaveBeenCalled();
  });
});
