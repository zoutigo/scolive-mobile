import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { colors } from "../../src/theme";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("ModuleHeader", () => {
  it("rend le bouton droit quand rightIcon et onRightPress sont fournis", () => {
    const onRightPress = jest.fn();
    render(
      <ModuleHeader
        title="Titre"
        subtitle="Sous-titre"
        onBack={jest.fn()}
        rightIcon="menu-outline"
        onRightPress={onRightPress}
        rightTestID="module-header-menu"
      />,
    );

    expect(screen.getByTestId("module-header-menu")).toBeTruthy();
    fireEvent.press(screen.getByTestId("module-header-menu"));
    expect(onRightPress).toHaveBeenCalledTimes(1);
  });

  it("affiche un spacer droit quand aucun bouton droit n'est fourni", () => {
    render(<ModuleHeader title="Titre" onBack={jest.fn()} />);

    expect(screen.queryByTestId("module-header-right")).toBeNull();
  });

  it("supporte une couleur de fond personnalisée", () => {
    render(
      <ModuleHeader
        title="Mon compte"
        onBack={jest.fn()}
        backgroundColor={colors.primaryDark}
      />,
    );

    const header = screen.getByTestId("module-header");
    const headerStyle = StyleSheet.flatten(header.props.style);
    expect(headerStyle.backgroundColor).toBe(colors.primaryDark);
  });
});
