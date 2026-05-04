import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DisciplineSummaryOverview } from "../../src/components/discipline/DisciplineSummaryOverview";
import {
  makeEventsByTypes,
  makeSummary,
} from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mixedEvents = makeEventsByTypes([
  "ABSENCE",
  "RETARD",
  "SANCTION",
  "PUNITION",
  "ABSENCE",
]).map((e, i) => ({ ...e, reason: `Raison ${e.type} ${i + 1}` }));

describe("DisciplineSummaryOverview — filtrage par KPI", () => {
  it("affiche tous les evenements quand aucun filtre n'est actif", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    expect(screen.getByText("Raison ABSENCE 1")).toBeOnTheScreen();
    expect(screen.getByText("Raison RETARD 2")).toBeOnTheScreen();
    expect(screen.getByText("Raison SANCTION 3")).toBeOnTheScreen();
    expect(screen.getByText("Raison PUNITION 4")).toBeOnTheScreen();
    expect(screen.getByText("Raison ABSENCE 5")).toBeOnTheScreen();
  });

  it("le titre de section est Derniers evenements sans filtre et pas de bouton Tout voir", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements",
    );
    expect(screen.queryByTestId("btn-see-all")).toBeNull();
  });

  it("filtre les evenements au clic sur la KPI ABSENCES", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-absences"));

    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : ABSENCES",
    );
    expect(screen.getByText("Raison ABSENCE 1")).toBeOnTheScreen();
    expect(screen.getByText("Raison ABSENCE 5")).toBeOnTheScreen();
    expect(screen.queryByText("Raison RETARD 2")).toBeNull();
    expect(screen.queryByText("Raison SANCTION 3")).toBeNull();
    expect(screen.queryByText("Raison PUNITION 4")).toBeNull();
  });

  it("filtre les evenements au clic sur la KPI RETARDS", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-retards"));

    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : RETARDS",
    );
    expect(screen.getByText("Raison RETARD 2")).toBeOnTheScreen();
    expect(screen.queryByText("Raison ABSENCE 1")).toBeNull();
  });

  it("filtre les evenements au clic sur la KPI SANCTIONS", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-sanctions"));

    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : SANCTIONS",
    );
    expect(screen.getByText("Raison SANCTION 3")).toBeOnTheScreen();
    expect(screen.queryByText("Raison RETARD 2")).toBeNull();
  });

  it("filtre les evenements au clic sur la KPI PUNITIONS", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-punitions"));

    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : PUNITIONS",
    );
    expect(screen.getByText("Raison PUNITION 4")).toBeOnTheScreen();
    expect(screen.queryByText("Raison RETARD 2")).toBeNull();
  });

  it("les cartes KPI n'ont aucun effet visuel apres le clic", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-absences"));

    // Aucune carte ne doit avoir d'opacité modifiée
    expect(screen.getByTestId("kpi-absences")).not.toHaveStyle({
      opacity: 0.45,
    });
    expect(screen.getByTestId("kpi-retards")).not.toHaveStyle({
      opacity: 0.45,
    });
    expect(screen.getByTestId("kpi-sanctions")).not.toHaveStyle({
      opacity: 0.45,
    });
    expect(screen.getByTestId("kpi-punitions")).not.toHaveStyle({
      opacity: 0.45,
    });
  });

  it("affiche le bouton Tout voir uniquement quand un filtre est actif", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    expect(screen.queryByTestId("btn-see-all")).toBeNull();

    fireEvent.press(screen.getByTestId("kpi-sanctions"));
    expect(screen.getByTestId("btn-see-all")).toBeOnTheScreen();
  });

  it("le bouton Tout voir reinitialise le filtre et affiche tous les evenements", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-absences"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : ABSENCES",
    );

    fireEvent.press(screen.getByTestId("btn-see-all"));

    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements",
    );
    expect(screen.queryByTestId("btn-see-all")).toBeNull();
    expect(screen.getByText("Raison RETARD 2")).toBeOnTheScreen();
    expect(screen.getByText("Raison SANCTION 3")).toBeOnTheScreen();
  });

  it("recliquer sur le meme KPI desactive le filtre", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary()}
        events={mixedEvents}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-retards"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : RETARDS",
    );

    fireEvent.press(screen.getByTestId("kpi-retards"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements",
    );
    expect(screen.getByText("Raison ABSENCE 1")).toBeOnTheScreen();
  });

  it("affiche un etat vide quand le filtre n'a aucun resultat", () => {
    const onlyAbsence = makeEventsByTypes(["ABSENCE"]).map((e) => ({
      ...e,
      reason: "Absence seule",
    }));

    render(
      <DisciplineSummaryOverview
        summary={makeSummary({ sanctions: 0, punitions: 0 })}
        events={onlyAbsence}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-sanctions"));

    expect(screen.getByTestId("filter-empty")).toBeOnTheScreen();
    expect(screen.queryByText("Absence seule")).toBeNull();
  });

  it("affiche l'etat vide global quand il n'y a aucun evenement", () => {
    render(
      <DisciplineSummaryOverview
        summary={makeSummary({
          absences: 0,
          retards: 0,
          sanctions: 0,
          punitions: 0,
        })}
        events={[]}
      />,
    );

    expect(screen.getByTestId("synthese-empty")).toBeOnTheScreen();
    expect(screen.queryByTestId("events-section-title")).toBeNull();
  });
});
