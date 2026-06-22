import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { colors } from "../../src/theme";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("ModuleHeader", () => {
  it("n'affiche plus de bouton menu à droite (déplacé vers la bottom tab bar)", () => {
    render(<ModuleHeader title="Titre" subtitle="Sous-titre" onBack={jest.fn()} />);
    expect(screen.queryByTestId("module-header-right")).toBeNull();
  });

  it("affiche un spacer droit pour garder le titre centré", () => {
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
