/**
 * Tests du composant ConfirmDialog.
 * Unitaires  : rendu, props, variantes, accessibilité
 * Fonctionnels : interactions (confirmer, annuler, clic overlay)
 */
import React from "react";
import { Keyboard, StyleSheet, Text } from "react-native";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
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

// ── Anti double-tap ───────────────────────────────────────────────────────────
// Régression : un double-tap sur "confirmer" déclenchait deux appels de
// l'action (ex: deux DELETE concurrents), le second échouant et écrasant le
// toast de succès du premier — donnant l'impression que l'action a échoué
// alors qu'elle a réussi.

describe("Anti double-tap sur confirmer", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("n'appelle onConfirm qu'une seule fois lors de deux presses rapprochées", () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    const confirmBtn = screen.getByTestId("confirm-dialog-confirm");
    fireEvent.press(confirmBtn);
    fireEvent.press(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("désactive le bouton confirmer juste après le premier press", () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    const confirmBtn = screen.getByTestId("confirm-dialog-confirm");
    fireEvent.press(confirmBtn);
    expect(confirmBtn.props.accessibilityState.disabled).toBe(true);
  });

  it("réactive le bouton confirmer après le délai anti double-tap", () => {
    const onConfirm = jest.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    const confirmBtn = screen.getByTestId("confirm-dialog-confirm");
    fireEvent.press(confirmBtn);
    act(() => {
      jest.advanceTimersByTime(900);
    });
    fireEvent.press(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("réactive le bouton confirmer quand le dialog est rouvert (visible repasse à true)", () => {
    const onConfirm = jest.fn();
    const { rerender } = render(
      <ConfirmDialog {...baseProps} onConfirm={onConfirm} />,
    );
    const confirmBtn = screen.getByTestId("confirm-dialog-confirm");
    fireEvent.press(confirmBtn);
    rerender(
      <ConfirmDialog {...baseProps} onConfirm={onConfirm} visible={false} />,
    );
    rerender(<ConfirmDialog {...baseProps} onConfirm={onConfirm} visible />);
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it("n'affecte pas le bouton annuler : il reste utilisable après un press sur confirmer", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ── Clavier (champ de saisie en `children`) ───────────────────────────────────

describe("Clavier", () => {
  type KeyboardHandler = (event?: {
    endCoordinates?: { height: number };
  }) => void;
  let handlers: Record<string, KeyboardHandler>;
  let removers: jest.Mock[];

  beforeEach(() => {
    handlers = {};
    removers = [];
    jest
      .spyOn(Keyboard, "addListener")
      .mockImplementation((eventName, handler) => {
        handlers[eventName] = handler as KeyboardHandler;
        const remove = jest.fn();
        removers.push(remove);
        return { remove } as never;
      });
  });

  afterEach(() => jest.restoreAllMocks());

  function wrapperPaddingBottom(): number | undefined {
    const card = screen.getByTestId("confirm-dialog-card");
    // card -> Animated.View ; son parent est le ScrollView, puis le wrapper centré.
    let node = card.parent;
    while (node) {
      const style = StyleSheet.flatten(node.props?.style);
      if (style && "paddingBottom" in style && style.position === "absolute") {
        return style.paddingBottom as number;
      }
      node = node.parent;
    }
    return undefined;
  }

  it("la carte est dans un conteneur défilable qui garde les boutons atteignables", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByTestId("confirm-dialog-scroll")).toBeOnTheScreen();
    expect(
      screen.getByTestId("confirm-dialog-scroll").props
        .keyboardShouldPersistTaps,
    ).toBe("handled");
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("réserve la hauteur du clavier à son ouverture puis la libère", () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(wrapperPaddingBottom()).toBe(0);

    act(() => {
      handlers.keyboardDidShow({ endCoordinates: { height: 420 } });
    });
    expect(wrapperPaddingBottom()).toBe(420);

    act(() => {
      handlers.keyboardDidHide();
    });
    expect(wrapperPaddingBottom()).toBe(0);
  });

  it("tolère un événement clavier sans coordonnées", () => {
    render(<ConfirmDialog {...baseProps} />);
    act(() => {
      handlers.keyboardDidShow({});
    });
    expect(wrapperPaddingBottom()).toBe(0);
  });

  it("n'écoute le clavier que dialogue visible et nettoie ses écouteurs", () => {
    const hidden = render(<ConfirmDialog {...baseProps} visible={false} />);
    expect(Keyboard.addListener).not.toHaveBeenCalled();
    hidden.unmount();

    const shown = render(<ConfirmDialog {...baseProps} />);
    expect(Keyboard.addListener).toHaveBeenCalledWith(
      "keyboardDidShow",
      expect.any(Function),
    );
    expect(Keyboard.addListener).toHaveBeenCalledWith(
      "keyboardDidHide",
      expect.any(Function),
    );
    shown.unmount();
    expect(removers).toHaveLength(2);
    removers.forEach((remove) => expect(remove).toHaveBeenCalledTimes(1));
  });

  it("remet la réserve à zéro quand le dialogue se ferme clavier ouvert", () => {
    const view = render(<ConfirmDialog {...baseProps} />);
    act(() => {
      handlers.keyboardDidShow({ endCoordinates: { height: 300 } });
    });
    expect(wrapperPaddingBottom()).toBe(300);
    view.rerender(<ConfirmDialog {...baseProps} visible={false} />);
    view.rerender(<ConfirmDialog {...baseProps} visible />);
    expect(wrapperPaddingBottom()).toBe(0);
  });

  it("garde les enfants (champ motif) dans la carte", () => {
    render(
      <ConfirmDialog {...baseProps}>
        <Text testID="extra-field">Motif</Text>
      </ConfirmDialog>,
    );
    expect(screen.getByTestId("extra-field")).toBeOnTheScreen();
  });
});
