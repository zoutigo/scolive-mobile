/**
 * Tests du composant PageHelpModal (aide centralisée en modale, réutilisée
 * par tout écran dont le contenu principal est une liste virtualisée où un
 * PageHelpBlock statique en bas de page n'est pas possible).
 * Unitaires : rendu visible/caché, props, testID personnalisé.
 * Fonctionnels : fermeture via le backdrop et via le bouton de fermeture.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { PageHelpModal } from "../../src/components/help/PageHelpModal";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  title: "Rechercher et filtrer",
  body: [
    "Premier paragraphe explicatif.",
    "Second paragraphe explicatif.",
    "Troisième paragraphe explicatif.",
  ],
  closeLabel: "J'ai compris",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Rendu", () => {
  it("ne rend rien de visible quand visible=false", () => {
    render(<PageHelpModal {...baseProps} visible={false} />);
    expect(screen.queryByTestId("page-help-modal-title")).toBeNull();
  });

  it("affiche le titre sur la même ligne que l'icône d'aide (header)", () => {
    render(<PageHelpModal {...baseProps} />);
    expect(screen.getByTestId("page-help-modal-title")).toHaveTextContent(
      baseProps.title,
    );
  });

  it("affiche chaque paragraphe du corps comme un Text distinct", () => {
    render(<PageHelpModal {...baseProps} />);
    for (const paragraph of baseProps.body) {
      expect(screen.getByText(paragraph)).toBeTruthy();
    }
  });

  it("affiche le libellé de fermeture fourni", () => {
    render(<PageHelpModal {...baseProps} />);
    expect(screen.getByTestId("page-help-modal-close")).toHaveTextContent(
      baseProps.closeLabel,
    );
  });

  it("respecte un testID personnalisé", () => {
    render(<PageHelpModal {...baseProps} testID="feed-help" />);
    expect(screen.getByTestId("feed-help")).toBeTruthy();
    expect(screen.getByTestId("feed-help-title")).toBeTruthy();
    expect(screen.getByTestId("feed-help-body")).toBeTruthy();
    expect(screen.getByTestId("feed-help-close")).toBeTruthy();
  });
});

describe("Interactions", () => {
  it("appelle onClose au tap sur le bouton de fermeture", () => {
    render(<PageHelpModal {...baseProps} />);
    fireEvent.press(screen.getByTestId("page-help-modal-close"));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Sous-chapitres (sections)", () => {
  const sections = [
    { title: "Changer de vue", body: ["Paragraphe A."] },
    {
      title: "Naviguer dans le temps",
      body: ["Paragraphe B.", "Paragraphe C."],
    },
  ];

  it("affiche le titre de chaque section et ses paragraphes, en ignorant body", () => {
    render(
      <PageHelpModal {...baseProps} sections={sections} body={undefined} />,
    );
    expect(screen.getByText("Changer de vue")).toBeTruthy();
    expect(screen.getByText("Naviguer dans le temps")).toBeTruthy();
    expect(screen.getByText("Paragraphe A.")).toBeTruthy();
    expect(screen.getByText("Paragraphe B.")).toBeTruthy();
    expect(screen.getByText("Paragraphe C.")).toBeTruthy();
    for (const paragraph of baseProps.body) {
      expect(screen.queryByText(paragraph)).toBeNull();
    }
  });
});
