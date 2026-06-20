import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TestCaseFormSheet } from "../../src/components/tests-admin/TestCaseFormSheet";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const TEST_CASE = {
  id: "case-1",
  reference: 1,
  title: "Connexion email",
  module: "Auth",
  objective: "Vérifier la connexion",
  preconditions: null,
  expectedResult: "L'utilisateur est connecté",
  priority: "HIGH" as const,
  dueAt: null,
  evidenceRequired: true,
  recycledAt: null,
  audienceRoles: [],
  executionsCount: 0,
};

describe("TestCaseFormSheet", () => {
  it("renders the create sheet and submits a new test case", async () => {
    const onSubmit = jest.fn();
    render(
      <TestCaseFormSheet
        saving={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByTestId("create-case-sheet")).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId("edit-case-title"),
      "Mot de passe oublié",
    );
    fireEvent.changeText(
      screen.getByTestId("edit-case-expected-result"),
      "Le lien est envoyé par email",
    );
    fireEvent.press(screen.getByTestId("edit-case-save-btn"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Mot de passe oublié",
          expectedResult: "Le lien est envoyé par email",
          priority: "MEDIUM",
          evidenceRequired: false,
        }),
      );
    });
  });

  it("does not submit when title or expected result are missing", async () => {
    const onSubmit = jest.fn();
    render(
      <TestCaseFormSheet
        saving={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("edit-case-save-btn"));

    await waitFor(() => {
      expect(screen.getByText("Le titre est obligatoire.")).toBeTruthy();
      expect(
        screen.getByText("Le résultat attendu est obligatoire."),
      ).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("pre-fills the form and uses the edit sheet testID when editing", () => {
    render(
      <TestCaseFormSheet
        testCase={TEST_CASE}
        saving={false}
        error={null}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByTestId("edit-case-sheet")).toBeTruthy();
    expect(screen.getByDisplayValue("Connexion email")).toBeTruthy();
    expect(screen.getByDisplayValue("Auth")).toBeTruthy();
  });

  it("toggles the evidence required switch", async () => {
    const onSubmit = jest.fn();
    render(
      <TestCaseFormSheet
        saving={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    fireEvent(
      screen.getByTestId("edit-case-evidence-required"),
      "valueChange",
      true,
    );
    fireEvent.changeText(screen.getByTestId("edit-case-title"), "Cas X");
    fireEvent.changeText(
      screen.getByTestId("edit-case-expected-result"),
      "Résultat X",
    );
    fireEvent.press(screen.getByTestId("edit-case-save-btn"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ evidenceRequired: true }),
      );
    });
  });

  it("calls onCancel when cancel is pressed", () => {
    const onCancel = jest.fn();
    render(
      <TestCaseFormSheet
        saving={false}
        error={null}
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByTestId("edit-case-cancel-btn"));

    expect(onCancel).toHaveBeenCalled();
  });
});
