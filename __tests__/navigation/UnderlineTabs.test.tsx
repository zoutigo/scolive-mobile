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
});
