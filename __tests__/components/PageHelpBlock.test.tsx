/**
 * Tests du composant PageHelpBlock.
 * Unitaires  : rendu par défaut (replié), props, accessibilité
 * Fonctionnels : bascule ouverture/fermeture au tap, libellés dynamiques
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { PageHelpBlock } from "../../src/components/help/PageHelpBlock";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const baseProps = {
  title: "Comment utiliser cette page",
  body: [
    "Premier paragraphe : basculez entre les vues.",
    "Second paragraphe : touchez une carte de cours pour voir son détail.",
  ],
  toggleOpenLabel: "Besoin d'aide sur cette page ?",
  toggleCloseLabel: "Masquer l'aide",
};

describe("Rendu par défaut", () => {
  it("est replié par défaut", () => {
    render(<PageHelpBlock {...baseProps} />);
    expect(screen.queryByTestId("page-help-block-content")).toBeNull();
  });

  it("affiche le libellé d'ouverture quand replié", () => {
    render(<PageHelpBlock {...baseProps} />);
    expect(screen.getByTestId("page-help-block-toggle")).toHaveTextContent(
      baseProps.toggleOpenLabel,
    );
  });

  it("expose accessibilityState.expanded=false quand replié", () => {
    render(<PageHelpBlock {...baseProps} />);
    expect(
      screen.getByTestId("page-help-block-toggle").props.accessibilityState,
    ).toEqual({ expanded: false });
  });

  it("s'ouvre directement si defaultOpen est vrai", () => {
    render(<PageHelpBlock {...baseProps} defaultOpen />);
    expect(screen.getByTestId("page-help-block-content")).toBeTruthy();
  });

  it("respecte un testID personnalisé", () => {
    render(<PageHelpBlock {...baseProps} testID="agenda-help" />);
    expect(screen.getByTestId("agenda-help")).toBeTruthy();
    expect(screen.getByTestId("agenda-help-toggle")).toBeTruthy();
  });
});

describe("Interactions", () => {
  it("affiche le titre et chaque paragraphe du corps une fois ouvert", () => {
    render(<PageHelpBlock {...baseProps} />);
    fireEvent.press(screen.getByTestId("page-help-block-toggle"));
    expect(screen.getByText(baseProps.title)).toBeTruthy();
    for (const paragraph of baseProps.body) {
      expect(screen.getByText(paragraph)).toBeTruthy();
    }
  });

  it("bascule le libellé du toggle vers la version fermeture une fois ouvert", () => {
    render(<PageHelpBlock {...baseProps} />);
    fireEvent.press(screen.getByTestId("page-help-block-toggle"));
    expect(screen.getByTestId("page-help-block-toggle")).toHaveTextContent(
      baseProps.toggleCloseLabel,
    );
  });

  it("referme le contenu si on retouche le toggle", () => {
    render(<PageHelpBlock {...baseProps} />);
    const toggle = screen.getByTestId("page-help-block-toggle");
    fireEvent.press(toggle);
    fireEvent.press(toggle);
    expect(screen.queryByTestId("page-help-block-content")).toBeNull();
  });

  it("met accessibilityState.expanded=true une fois ouvert", () => {
    render(<PageHelpBlock {...baseProps} />);
    fireEvent.press(screen.getByTestId("page-help-block-toggle"));
    expect(
      screen.getByTestId("page-help-block-toggle").props.accessibilityState,
    ).toEqual({ expanded: true });
  });
});
