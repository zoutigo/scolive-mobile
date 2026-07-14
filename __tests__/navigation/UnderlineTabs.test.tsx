import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { UnderlineTabs } from "../../src/components/navigation/UnderlineTabs";

describe("UnderlineTabs", () => {
  it("affiche les onglets et leurs badges éventuels", () => {
    render(
      <UnderlineTabs
        items={[
          { key: "events", label: "Événements", badge: 4 },
          { key: "carnets", label: "Carnets" },
        ]}
        activeKey="events"
        onSelect={jest.fn()}
        testIDPrefix="discipline-tab"
      />,
    );

    expect(screen.getByTestId("discipline-tab-events")).toBeTruthy();
    expect(screen.getByTestId("discipline-tab-carnets")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("appelle onSelect avec la clé sélectionnée", () => {
    const onSelect = jest.fn();
    render(
      <UnderlineTabs
        items={[
          { key: "events", label: "Événements" },
          { key: "carnets", label: "Carnets" },
        ]}
        activeKey="events"
        onSelect={onSelect}
        testIDPrefix="discipline-tab"
      />,
    );

    fireEvent.press(screen.getByTestId("discipline-tab-carnets"));
    expect(onSelect).toHaveBeenCalledWith("carnets");
  });

  it("affiche tous les onglets sans ScrollView quand fitWidth est activé", () => {
    render(
      <UnderlineTabs
        items={[
          { key: "overview", label: "Aperçu" },
          { key: "cycles", label: "Cycles" },
          { key: "levels", label: "Niveaux" },
          { key: "tracks", label: "Filières" },
          { key: "curriculums", label: "Curr." },
          { key: "subjects", label: "Matières" },
          { key: "help", label: "Aide" },
        ]}
        activeKey="overview"
        onSelect={jest.fn()}
        testIDPrefix="national-catalog-tab"
        fitWidth
      />,
    );

    expect(screen.getByTestId("national-catalog-tab-overview")).toBeTruthy();
    expect(screen.getByTestId("national-catalog-tab-cycles")).toBeTruthy();
    expect(screen.getByTestId("national-catalog-tab-levels")).toBeTruthy();
    expect(screen.getByTestId("national-catalog-tab-tracks")).toBeTruthy();
    expect(screen.getByTestId("national-catalog-tab-curriculums")).toBeTruthy();
    expect(screen.getByTestId("national-catalog-tab-subjects")).toBeTruthy();
    expect(screen.getByTestId("national-catalog-tab-help")).toBeTruthy();
  });

  it("appelle onSelect avec la clé sélectionnée même en mode fitWidth", () => {
    const onSelect = jest.fn();
    render(
      <UnderlineTabs
        items={[
          { key: "overview", label: "Aperçu" },
          { key: "help", label: "Aide" },
        ]}
        activeKey="overview"
        onSelect={onSelect}
        testIDPrefix="national-catalog-tab"
        fitWidth
      />,
    );

    fireEvent.press(screen.getByTestId("national-catalog-tab-help"));
    expect(onSelect).toHaveBeenCalledWith("help");
  });
});
