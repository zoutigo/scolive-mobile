import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DisciplineSummaryKpis } from "../../src/components/discipline/DisciplineSummaryKpis";
import { makeSummary } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("DisciplineSummaryKpis", () => {
  it("affiche les compteurs et le point d'alerte", () => {
    render(<DisciplineSummaryKpis summary={makeSummary()} />);

    expect(screen.getByTestId("discipline-summary-kpis")).toBeOnTheScreen();
    expect(screen.getByTestId("kpi-absences")).toHaveStyle({
      width: "48%",
      minHeight: 96,
    });
    expect(screen.getByText("ABSENCES")).toBeOnTheScreen();
    expect(screen.getByText("RETARDS")).toBeOnTheScreen();
    expect(screen.getByText("SANCTIONS")).toBeOnTheScreen();
    expect(screen.getByText("PUNITIONS")).toBeOnTheScreen();
    expect(screen.getByText("2")).toBeOnTheScreen();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByTestId("warn-dot-kpi-absences")).toBeOnTheScreen();
  });

  it("declenche onFilterPress avec le bon type au clic sur chaque KPI", () => {
    const onFilterPress = jest.fn();

    render(
      <DisciplineSummaryKpis
        summary={makeSummary()}
        onFilterPress={onFilterPress}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-absences"));
    expect(onFilterPress).toHaveBeenCalledWith("ABSENCE");

    fireEvent.press(screen.getByTestId("kpi-retards"));
    expect(onFilterPress).toHaveBeenCalledWith("RETARD");

    fireEvent.press(screen.getByTestId("kpi-sanctions"));
    expect(onFilterPress).toHaveBeenCalledWith("SANCTION");

    fireEvent.press(screen.getByTestId("kpi-punitions"));
    expect(onFilterPress).toHaveBeenCalledWith("PUNITION");

    expect(onFilterPress).toHaveBeenCalledTimes(4);
  });

  it("les cartes sont non-interactives sans onFilterPress", () => {
    render(<DisciplineSummaryKpis summary={makeSummary()} />);
    // pas d'erreur — les cartes sont de simples View
    fireEvent.press(screen.getByTestId("kpi-absences"));
  });

  it("aucune carte n'a d'opacite modifiee — ni avant ni apres un clic", () => {
    const onFilterPress = jest.fn();
    render(
      <DisciplineSummaryKpis
        summary={makeSummary()}
        onFilterPress={onFilterPress}
      />,
    );

    // Avant clic
    expect(screen.getByTestId("kpi-absences")).not.toHaveStyle({
      opacity: expect.any(Number),
    });
    expect(screen.getByTestId("kpi-retards")).not.toHaveStyle({
      opacity: expect.any(Number),
    });

    // Après clic sur RETARDS
    fireEvent.press(screen.getByTestId("kpi-retards"));

    // Aucune des 4 cartes ne doit avoir d'opacité modifiée
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

  it("utilise Pressable et non TouchableOpacity pour eviter la corruption d'opacite Fabric", () => {
    const onFilterPress = jest.fn();
    render(
      <DisciplineSummaryKpis
        summary={makeSummary()}
        onFilterPress={onFilterPress}
      />,
    );

    // Pressable n'a pas de prop activeOpacity — vérifier qu'aucune carte
    // n'a de style opacity lié à un activeOpacity de TouchableOpacity
    const absCard = screen.getByTestId("kpi-absences");
    const retCard = screen.getByTestId("kpi-retards");
    expect(absCard.props).not.toHaveProperty("activeOpacity");
    expect(retCard.props).not.toHaveProperty("activeOpacity");
  });
});
