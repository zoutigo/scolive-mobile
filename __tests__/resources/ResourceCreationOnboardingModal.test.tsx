import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ResourceCreationOnboardingModal } from "../../src/components/resources/ResourceCreationOnboardingModal";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("ResourceCreationOnboardingModal", () => {
  it("n'affiche rien quand visible est faux", () => {
    render(
      <ResourceCreationOnboardingModal
        visible={false}
        dontShowAgain={false}
        onToggleDontShowAgain={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByTestId("resources-onboarding-modal")).toBeNull();
  });

  it("affiche les 3 étapes et déclenche onClose au clic sur Commencer", () => {
    const onClose = jest.fn();
    render(
      <ResourceCreationOnboardingModal
        visible
        dontShowAgain={false}
        onToggleDontShowAgain={() => {}}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("1. Créer la fiche")).toBeTruthy();
    expect(screen.getByText("2. Proposer un énoncé")).toBeTruthy();
    expect(screen.getByText("3. Proposer un corrigé")).toBeTruthy();

    fireEvent.press(screen.getByTestId("resources-onboarding-start"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("bascule dontShowAgain au tap sur la case à cocher", () => {
    const onToggle = jest.fn();
    render(
      <ResourceCreationOnboardingModal
        visible
        dontShowAgain={false}
        onToggleDontShowAgain={onToggle}
        onClose={() => {}}
      />,
    );

    fireEvent.press(screen.getByTestId("resources-onboarding-dont-show-again"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});
