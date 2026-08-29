/**
 * Tests unitaires : StaffCreateFormContent — création de fonction à la volée
 *
 * Contexte du bug corrigé : aucune école sur la plateforme n'avait encore de
 * "fonction" configurée (SchoolStaffFunction), rendant le sélecteur de
 * fonction du formulaire de création systématiquement vide, pour tout type
 * de compte staff — sans qu'il existe de moyen d'en créer une depuis mobile
 * (seul le web l'exposait, dans Paramètres). Ce fichier verrouille l'ajout
 * d'une création inline de fonction directement dans ce formulaire.
 */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StaffCreateFormContent } from "../../src/components/users/UserCreateForms";
import type { StaffFunctionOption } from "../../src/api/staff-functions.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

function renderForm(
  overrides: Partial<
    React.ComponentProps<typeof StaffCreateFormContent>
  > = {},
) {
  return render(
    <StaffCreateFormContent
      role="SCHOOL_STAFF"
      functionOptions={overrides.functionOptions ?? []}
      onCancel={jest.fn()}
      onSubmit={jest.fn()}
      {...overrides}
    />,
  );
}

describe("StaffCreateFormContent — création de fonction à la volée", () => {
  it("n'affiche pas l'affordance de création si onCreateFunction n'est pas fourni", () => {
    renderForm();
    expect(
      screen.queryByTestId("users-create-staff-new-function-input"),
    ).toBeNull();
  });

  it("affiche un champ + bouton Ajouter désactivé tant qu'aucun nom n'est saisi", () => {
    renderForm({ onCreateFunction: jest.fn() });

    expect(
      screen.getByTestId("users-create-staff-new-function-input"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("users-create-staff-new-function-submit"),
    ).toBeDisabled();
  });

  it("crée une fonction, la sélectionne automatiquement et vide le champ", async () => {
    const created: StaffFunctionOption = {
      id: "fn-1",
      name: "Bibliothécaire",
      description: null,
    };
    const onCreateFunction = jest.fn().mockResolvedValue(created);
    renderForm({ onCreateFunction });

    fireEvent.changeText(
      screen.getByTestId("users-create-staff-new-function-input"),
      "Bibliothécaire",
    );
    expect(
      screen.getByTestId("users-create-staff-new-function-submit"),
    ).not.toBeDisabled();

    await act(async () => {
      fireEvent.press(
        screen.getByTestId("users-create-staff-new-function-submit"),
      );
    });

    await waitFor(() =>
      expect(onCreateFunction).toHaveBeenCalledWith("Bibliothécaire"),
    );
    expect(
      (screen.getByTestId("users-create-staff-new-function-input") as never as {
        props: { value: string };
      }).props.value,
    ).toBe("");
  });

  it("affiche un message d'erreur si la création échoue, sans planter", async () => {
    const onCreateFunction = jest.fn().mockRejectedValue(new Error("boom"));
    renderForm({ onCreateFunction });

    fireEvent.changeText(
      screen.getByTestId("users-create-staff-new-function-input"),
      "Bibliothécaire",
    );

    await act(async () => {
      fireEvent.press(
        screen.getByTestId("users-create-staff-new-function-submit"),
      );
    });

    await waitFor(() =>
      expect(
        screen.getByTestId("users-create-staff-new-function-error"),
      ).toBeTruthy(),
    );
  });

  it("propose les fonctions existantes dans le sélecteur", () => {
    renderForm({
      functionOptions: [
        { id: "fn-1", name: "Bibliothécaire", description: null },
        { id: "fn-2", name: "Surveillant général", description: null },
      ],
    });

    fireEvent.press(screen.getByTestId("users-create-staff-function"));
    expect(screen.getByText("Bibliothécaire")).toBeTruthy();
    expect(screen.getByText("Surveillant général")).toBeTruthy();
  });
});
