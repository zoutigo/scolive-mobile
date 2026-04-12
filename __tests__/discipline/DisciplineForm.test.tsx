import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DisciplineForm } from "../../src/components/discipline/DisciplineForm";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("DisciplineForm", () => {
  it("affiche les erreurs zod de validation et n'appelle pas onSubmit", () => {
    const onSubmit = jest.fn();

    render(<DisciplineForm onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByTestId("input-reason"), "   ");
    fireEvent.changeText(screen.getByTestId("input-occurred-at"), "bad-date");
    fireEvent.changeText(screen.getByTestId("input-duration"), "abc");
    fireEvent.press(screen.getByTestId("btn-submit"));

    expect(screen.getByText("Le motif est obligatoire.")).toBeOnTheScreen();
    expect(screen.getByText("La date est invalide.")).toBeOnTheScreen();
    expect(
      screen.getByText("La durée doit être un entier positif."),
    ).toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("soumet un payload nettoye et converti", () => {
    const onSubmit = jest.fn();

    render(<DisciplineForm onSubmit={onSubmit} />);

    fireEvent.changeText(
      screen.getByTestId("input-reason"),
      "  Retard portail ",
    );
    fireEvent.changeText(
      screen.getByTestId("input-occurred-at"),
      "2026-04-09T08:30",
    );
    fireEvent.changeText(screen.getByTestId("input-duration"), "15");
    fireEvent.changeText(screen.getByTestId("input-comment"), "  Billet recu ");
    fireEvent.press(screen.getByTestId("btn-submit"));

    expect(onSubmit).toHaveBeenCalledWith({
      type: "ABSENCE",
      occurredAt: new Date("2026-04-09T08:30").toISOString(),
      reason: "Retard portail",
      durationMinutes: 15,
      justified: false,
      comment: "Billet recu",
    });
  });

  it("masque le switch justifie pour les sanctions et omet justified du payload", () => {
    const onSubmit = jest.fn();

    render(<DisciplineForm onSubmit={onSubmit} />);

    fireEvent.press(screen.getByTestId("type-chip-SANCTION"));
    expect(screen.queryByTestId("switch-justified")).toBeNull();

    fireEvent.changeText(screen.getByTestId("input-reason"), "Sanction eleve");
    fireEvent.changeText(
      screen.getByTestId("input-occurred-at"),
      "2026-04-09T08:30",
    );
    fireEvent.press(screen.getByTestId("btn-submit"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SANCTION",
        justified: undefined,
      }),
    );
  });

  it("pre-remplit les valeurs en edition", () => {
    render(
      <DisciplineForm
        editing={makeLifeEvent({
          type: "RETARD",
          reason: "Retard en cours",
          durationMinutes: 10,
          justified: true,
          comment: "Trafic",
        })}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Retard en cours")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("10")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Trafic")).toBeOnTheScreen();
    expect(screen.getByTestId("switch-justified").props.value).toBe(true);
  });

  it("appelle onCancel et affiche une erreur globale si fournie", () => {
    const onCancel = jest.fn();

    render(
      <DisciplineForm
        onSubmit={jest.fn()}
        onCancel={onCancel}
        error="Erreur API"
      />,
    );

    expect(screen.getByTestId("form-error")).toBeOnTheScreen();
    expect(screen.getByText("Erreur API")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("btn-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("desactive les actions pendant la sauvegarde", () => {
    render(<DisciplineForm onSubmit={jest.fn()} isSaving />);

    expect(screen.queryByText("Enregistrer l'événement")).toBeNull();
  });
});
