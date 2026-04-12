import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DisciplineDeleteDialog } from "../../src/components/discipline/DisciplineDeleteDialog";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("DisciplineDeleteDialog", () => {
  it("ne rend rien sans evenement", () => {
    const { toJSON } = render(
      <DisciplineDeleteDialog
        event={null}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(toJSON()).toBeNull();
  });

  it("affiche le libelle tronque et gere confirmer/annuler", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <DisciplineDeleteDialog
        event={makeLifeEvent({
          reason:
            "Motif tres long qui doit etre tronque pour rester lisible dans la modale",
        })}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Supprimer cet événement ?")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("delete-dialog-cancel"));
    fireEvent.press(screen.getByTestId("delete-dialog-confirm"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
