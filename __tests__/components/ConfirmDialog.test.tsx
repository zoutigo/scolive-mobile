/**
 * Tests du composant ConfirmDialog.
 * Unitaires  : rendu, props, variantes, accessibilité
 * Fonctionnels : interactions (confirmer, annuler, clic overlay)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const baseProps = {
  visible: true,
  title: "Supprimer l'élément ?",
  message: "Cette action est irréversible.",
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Rendu de base ─────────────────────────────────────────────────────────────

describe("Rendu", () => {
  it("affiche le titre", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByTestId("confirm-dialog-title")).toHaveTextContent(
      "Supprimer l'élément ?",
    );
  });

  it("affiche le message", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByTestId("confirm-dialog-message")).toHaveTextContent(
      "Cette action est irréversible.",
    );
  });

  it("affiche le sous-titre quand il est fourni", () => {
    render(
      <ConfirmDialog
        {...baseProps}
        subtitle="Veuillez confirmer votre choix"
      />,
    );
    expect(screen.getByTestId("confirm-dialog-subtitle")).toHaveTextContent(
      "Veuillez confirmer votre choix",
    );
  });

  it("affiche le bouton de confirmation avec le label par défaut", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Confirmer",
    );
  });

  it("affiche le bouton d'annulation avec le label par défaut", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByTestId("confirm-dialog-cancel")).toHaveTextContent(
      "Annuler",
    );
  });

  it("affiche la carte du dialog", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy();
  });

  it("affiche les éléments visuels de mise en valeur", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByTestId("confirm-dialog-accent")).toBeTruthy();
    expect(screen.getByTestId("confirm-dialog-badge")).toBeTruthy();
  });

  it("n'affiche rien quand visible=false", () => {
    render(<ConfirmDialog {...baseProps} visible={false} />);
    expect(screen.queryByTestId("confirm-dialog-card")).toBeNull();
  });
});

// ── Labels personnalisés ──────────────────────────────────────────────────────

describe("Labels personnalisés", () => {
  it("affiche un label de confirmation personnalisé", () => {
    render(<ConfirmDialog {...baseProps} confirmLabel="Oui, supprimer" />);
    expect(screen.getByTestId("confirm-dialog-confirm")).toHaveTextContent(
      "Oui, supprimer",
    );
  });

  it("affiche un label d'annulation personnalisé", () => {
    render(<ConfirmDialog {...baseProps} cancelLabel="Non, garder" />);
    expect(screen.getByTestId("confirm-dialog-cancel")).toHaveTextContent(
      "Non, garder",
    );
  });

  it("masque le bouton annuler quand hideCancel=true", () => {
    render(<ConfirmDialog {...baseProps} hideCancel />);
    expect(screen.queryByTestId("confirm-dialog-cancel")).toBeNull();
    expect(screen.getByTestId("confirm-dialog-confirm")).toBeTruthy();
  });
});

// ── Variantes ─────────────────────────────────────────────────────────────────

describe("Variantes", () => {
  const variants = ["danger", "warning", "info"] as const;

  variants.forEach((variant) => {
    it(`rend correctement la variante "${variant}"`, () => {
      render(<ConfirmDialog {...baseProps} variant={variant} />);
      expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy();
    });
  });

  it("utilise la variante 'info' par défaut", () => {
    render(<ConfirmDialog {...baseProps} />);
    // La carte est rendue sans erreur avec la variante par défaut
    expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy();
  });
});

// ── Accessibilité ─────────────────────────────────────────────────────────────

describe("Accessibilité", () => {
  it("le bouton confirmer a un accessibilityRole='button'", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(
      screen.getByTestId("confirm-dialog-confirm").props.accessibilityRole,
    ).toBe("button");
  });

  it("le bouton annuler a un accessibilityRole='button'", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(
      screen.getByTestId("confirm-dialog-cancel").props.accessibilityRole,
    ).toBe("button");
  });

  it("le bouton confirmer a le bon accessibilityLabel", () => {
    render(<ConfirmDialog {...baseProps} confirmLabel="Oui, supprimer" />);
    expect(
      screen.getByTestId("confirm-dialog-confirm").props.accessibilityLabel,
    ).toBe("Oui, supprimer");
  });

  it("le bouton annuler a le bon accessibilityLabel", () => {
    render(<ConfirmDialog {...baseProps} cancelLabel="Non, garder" />);
    expect(
      screen.getByTestId("confirm-dialog-cancel").props.accessibilityLabel,
    ).toBe("Non, garder");
  });
});

// ── Interactions — confirmation ───────────────────────────────────────────────

describe("Interaction — confirmer", () => {
  it("appelle onConfirm au clic sur le bouton de confirmation", () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onCancel lors de la confirmation", () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(onCancel).not.toHaveBeenCalled();
  });
});

// ── Interactions — annulation ─────────────────────────────────────────────────

describe("Interaction — annuler", () => {
  it("appelle onCancel au clic sur le bouton d'annulation", () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onConfirm lors de l'annulation", () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("appelle onCancel en cliquant sur l'overlay", () => {
    const onCancel = jest.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId("confirm-dialog-overlay"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onConfirm en cliquant sur l'overlay", () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId("confirm-dialog-overlay"));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
