import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { LifeEventCard } from "../../src/components/discipline/LifeEventCard";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("LifeEventCard", () => {
  it("affiche le motif et l'auteur", () => {
    render(
      <LifeEventCard event={makeLifeEvent({ reason: "Retard en classe" })} />,
    );

    expect(screen.getByText("Retard en classe")).toBeOnTheScreen();
    expect(screen.getByText("Rousselot Anne")).toBeOnTheScreen();
  });

  it("affiche et masque les details expansibles", () => {
    const event = makeLifeEvent({
      comment: "Observation detaillee",
      schoolYear: { id: "year-1", label: "2025-2026" },
    });

    render(<LifeEventCard event={event} />);

    fireEvent.press(screen.getByTestId(`expand-event-${event.id}`));
    expect(screen.getByText("Observation detaillee")).toBeOnTheScreen();
    expect(screen.getByText("2025-2026")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId(`expand-event-${event.id}`));
    expect(screen.queryByText("Observation detaillee")).toBeNull();
  });

  it("declenche les callbacks d'action quand autorises", () => {
    const event = makeLifeEvent();
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
      <LifeEventCard
        event={event}
        showActions
        canEdit
        canDelete
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(screen.getByTestId(`edit-event-${event.id}`));
    fireEvent.press(screen.getByTestId(`delete-event-${event.id}`));

    expect(onEdit).toHaveBeenCalledWith(event);
    expect(onDelete).toHaveBeenCalledWith(event);
  });
});
