/**
 * Tests du composant FormHero.
 * Unitaires : rendu (icône, titre, sous-titre), palettes (teal, warm, primary, slate).
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { FormHero } from "../../src/components/forms/FormHero";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("FormHero — rendu", () => {
  it("affiche le titre et le sous-titre", () => {
    render(
      <FormHero
        icon="calendar-outline"
        title="Créer un créneau"
        subtitle="Définir la date, l'heure et la salle"
        palette="teal"
      />,
    );

    expect(screen.getByText("Créer un créneau")).toBeTruthy();
    expect(
      screen.getByText("Définir la date, l'heure et la salle"),
    ).toBeTruthy();
  });

  it("n'affiche pas de sous-titre quand il est omis", () => {
    render(
      <FormHero icon="calendar-outline" title="Titre seul" palette="teal" />,
    );

    expect(screen.getByText("Titre seul")).toBeTruthy();
  });

  it("utilise le testID fourni, sinon 'form-hero' par défaut", () => {
    render(<FormHero icon="calendar-outline" title="Titre" palette="teal" />);
    expect(screen.getByTestId("form-hero")).toBeTruthy();
  });

  it("utilise le testID personnalisé quand fourni", () => {
    render(
      <FormHero
        icon="people-outline"
        title="Suivi"
        palette="slate"
        testID="homework-control-hero"
      />,
    );
    expect(screen.getByTestId("homework-control-hero")).toBeTruthy();
  });

  it("rend le contenu 'trailing' et 'footer' fournis", () => {
    render(
      <FormHero
        icon="calendar-outline"
        title="Titre"
        palette="teal"
        trailing={<Text>Trailing</Text>}
        footer={<Text>Footer</Text>}
      />,
    );
    expect(screen.getByText("Trailing")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
  });
});

describe("FormHero — palettes", () => {
  it.each([["teal"], ["warm"], ["primary"], ["slate"]] as const)(
    "accepte la palette %s sans planter et applique une couleur de fond",
    (palette) => {
      render(
        <FormHero
          icon="calendar-outline"
          title="Titre"
          palette={palette}
          testID={`hero-${palette}`}
        />,
      );
      const hero = screen.getByTestId(`hero-${palette}`);
      const backgroundColor = Array.isArray(hero.props.style)
        ? hero.props.style.find(
            (s: { backgroundColor?: string }) => s?.backgroundColor,
          )?.backgroundColor
        : hero.props.style?.backgroundColor;
      expect(backgroundColor).toBeTruthy();
    },
  );

  it("utilise une couleur de fond différente pour chaque palette", () => {
    const palettes = ["teal", "warm", "primary", "slate"] as const;
    const colorsUsed = palettes.map((palette) => {
      render(
        <FormHero
          icon="calendar-outline"
          title="Titre"
          palette={palette}
          testID={`hero-color-${palette}`}
        />,
      );
      const hero = screen.getByTestId(`hero-color-${palette}`);
      const style = Array.isArray(hero.props.style)
        ? hero.props.style.find(
            (s: { backgroundColor?: string }) => s?.backgroundColor,
          )
        : hero.props.style;
      return style?.backgroundColor;
    });

    expect(new Set(colorsUsed).size).toBe(palettes.length);
  });
});
