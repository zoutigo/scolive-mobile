import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TestExecutionFormSheet } from "../../src/components/tests/TestExecutionFormSheet";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

describe("TestExecutionFormSheet", () => {
  it("does not call onSubmit and shows an inline error when the result text is empty", async () => {
    const onSubmit = jest.fn();
    render(
      <TestExecutionFormSheet
        visible
        evidenceRequired={false}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(
        screen.getByText("Décrivez le résultat observé avant d'enregistrer."),
      ).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the filled-in values when valid", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <TestExecutionFormSheet
        visible
        evidenceRequired={false}
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("tests-result-input"),
      "Le formulaire fonctionne correctement",
    );
    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "PASSED",
          resultText: "Le formulaire fonctionne correctement",
          attachments: [],
        }),
      );
    });
  });

  it("blocks submission when evidence is required and no attachment was added", async () => {
    const onSubmit = jest.fn();
    render(
      <TestExecutionFormSheet
        visible
        evidenceRequired
        isSubmitting={false}
        onClose={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("tests-result-input"),
      "Résultat observé",
    );
    fireEvent.press(screen.getByTestId("tests-submit-btn"));

    await waitFor(() => {
      expect(
        screen.getByText("Ce test exige au moins une capture en preuve."),
      ).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    render(
      <TestExecutionFormSheet
        visible
        evidenceRequired={false}
        isSubmitting={false}
        onClose={onClose}
        onSubmit={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("test-execution-form-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
