import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { CampaignFormSheet } from "../../src/components/tests-admin/CampaignFormSheet";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const CAMPAIGN = {
  id: "camp-1",
  reference: 1,
  title: "Recette mobile v1",
  description: "Parcours parent",
  targetVersion: "1.2.0",
  startsAt: null,
  dueAt: null,
  status: "ACTIVE" as const,
  school: null,
  testCasesCount: 2,
};

describe("CampaignFormSheet", () => {
  it("shows the create title and submits a new campaign", async () => {
    const onSubmit = jest.fn();
    render(
      <CampaignFormSheet
        saving={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Nouvelle campagne")).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId("campaign-form-title"),
      "Recette mobile v4",
    );
    fireEvent.press(screen.getByTestId("campaign-form-save-btn"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Recette mobile v4",
          status: "DRAFT",
        }),
      );
    });
  });

  it("does not submit when the title is empty", async () => {
    const onSubmit = jest.fn();
    render(
      <CampaignFormSheet
        saving={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("campaign-form-save-btn"));

    await waitFor(() => {
      expect(screen.getByText("Le titre est obligatoire.")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("pre-fills the form and shows the edit title when editing a campaign", () => {
    render(
      <CampaignFormSheet
        campaign={CAMPAIGN}
        saving={false}
        error={null}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Modifier la campagne")).toBeTruthy();
    expect(screen.getByDisplayValue("Recette mobile v1")).toBeTruthy();
    expect(screen.getByDisplayValue("Parcours parent")).toBeTruthy();
  });

  it("calls onCancel when the cancel button is pressed", () => {
    const onCancel = jest.fn();
    render(
      <CampaignFormSheet
        saving={false}
        error={null}
        onSubmit={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.press(screen.getByTestId("campaign-form-cancel-btn"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("shows the submit error when provided", () => {
    render(
      <CampaignFormSheet
        saving={false}
        error="Impossible d'enregistrer."
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByText("Impossible d'enregistrer.")).toBeTruthy();
  });
});
