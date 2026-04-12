import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DisciplineList } from "../../src/components/discipline/DisciplineList";
import { makeEventsByTypes } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("DisciplineList", () => {
  it("affiche un loader pendant le chargement initial", () => {
    render(<DisciplineList events={[]} isLoading />);
    expect(screen.getByTestId("discipline-list-loading")).toBeOnTheScreen();
  });

  it("affiche l'etat vide personnalise", () => {
    render(
      <DisciplineList
        events={[]}
        emptyTitle="Aucun incident"
        emptySub="RAS sur la periode"
      />,
    );

    expect(screen.getByTestId("discipline-list-empty")).toBeOnTheScreen();
    expect(screen.getByText("Aucun incident")).toBeOnTheScreen();
    expect(screen.getByText("RAS sur la periode")).toBeOnTheScreen();
  });

  it("rend les cartes et les actions autorisees", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const [absence, sanction] = makeEventsByTypes(["ABSENCE", "SANCTION"]);

    render(
      <DisciplineList
        events={[absence, sanction]}
        showActions
        canEdit={(event) => event.id === absence.id}
        canDelete={() => true}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(
      screen.getByTestId(`life-event-card-${absence.id}`),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId(`life-event-card-${sanction.id}`),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId(`edit-event-${absence.id}`));
    fireEvent.press(screen.getByTestId(`delete-event-${absence.id}`));

    expect(screen.queryByTestId(`edit-event-${sanction.id}`)).toBeNull();
    expect(onEdit).toHaveBeenCalledWith(absence);
    expect(onDelete).toHaveBeenCalledWith(absence);
  });
});
