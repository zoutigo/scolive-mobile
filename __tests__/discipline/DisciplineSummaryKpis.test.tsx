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

  it("declenche les callbacks de navigation des KPI", () => {
    const onAbsencesPress = jest.fn();
    const onSanctionsPress = jest.fn();

    render(
      <DisciplineSummaryKpis
        summary={makeSummary()}
        onAbsencesPress={onAbsencesPress}
        onSanctionsPress={onSanctionsPress}
      />,
    );

    fireEvent.press(screen.getByTestId("kpi-absences"));
    fireEvent.press(screen.getByTestId("kpi-sanctions"));

    expect(onAbsencesPress).toHaveBeenCalledTimes(1);
    expect(onSanctionsPress).toHaveBeenCalledTimes(1);
  });
});
