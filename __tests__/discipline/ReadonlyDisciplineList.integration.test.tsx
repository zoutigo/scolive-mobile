import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ReadonlyDisciplineList } from "../../src/components/discipline/ReadonlyDisciplineList";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

function makeReadonlyEvents(count: number) {
  return Array.from({ length: count }, (_, index) =>
    makeLifeEvent({
      id: `readonly-${index + 1}`,
      studentId: "child-1",
      type: index % 3 === 0 ? "RETARD" : "ABSENCE",
      reason: `Evenement lecture seule ${index + 1}`,
      occurredAt: `2026-04-${String((index % 9) + 1).padStart(2, "0")}T08:${String(index).padStart(2, "0")}:00.000Z`,
    }),
  );
}

describe("ReadonlyDisciplineList integration", () => {
  it("charge progressivement les evenements avec InfiniteScrollList", () => {
    const events = makeReadonlyEvents(10);

    render(
      <ReadonlyDisciplineList
        events={events}
        pageSize={4}
        testID="readonly-discipline-list"
      />,
    );

    expect(screen.getByText("Evenement lecture seule 1")).toBeOnTheScreen();
    expect(screen.getByText("Evenement lecture seule 4")).toBeOnTheScreen();
    expect(screen.queryByText("Evenement lecture seule 5")).toBeNull();

    fireEvent(
      screen.getByTestId("readonly-discipline-list"),
      "onMomentumScrollBegin",
    );
    fireEvent(screen.getByTestId("readonly-discipline-list"), "onEndReached", {
      distanceFromEnd: 20,
    });

    expect(screen.getByText("Evenement lecture seule 8")).toBeOnTheScreen();
    expect(screen.queryByText("Evenement lecture seule 9")).toBeNull();

    fireEvent(
      screen.getByTestId("readonly-discipline-list"),
      "onMomentumScrollBegin",
    );
    fireEvent(screen.getByTestId("readonly-discipline-list"), "onEndReached", {
      distanceFromEnd: 20,
    });

    expect(screen.getByText("Evenement lecture seule 10")).toBeOnTheScreen();
    expect(screen.getByTestId("infinite-scroll-end-footer")).toBeOnTheScreen();
    expect(
      screen.getByText("Tous les événements ont été chargés"),
    ).toBeOnTheScreen();
  });

  it("propage le refresh et conserve l'etat vide personnalise", () => {
    const onRefresh = jest.fn();

    render(
      <ReadonlyDisciplineList
        events={[]}
        onRefresh={onRefresh}
        emptyTitle="Aucun historique"
        emptySub="Rien a afficher"
        testID="readonly-discipline-list"
      />,
    );

    expect(screen.getByTestId("discipline-list-empty")).toBeOnTheScreen();
    expect(screen.getByText("Aucun historique")).toBeOnTheScreen();
    expect(screen.getByText("Rien a afficher")).toBeOnTheScreen();

    fireEvent(screen.getByTestId("readonly-discipline-list"), "refresh");
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
