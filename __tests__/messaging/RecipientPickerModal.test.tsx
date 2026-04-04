/**
 * Tests composant — RecipientPickerModal
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { RecipientPickerModal } from "../../src/components/messaging/RecipientPickerModal";
import type { RecipientOption } from "../../src/types/messaging.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const recipients: RecipientOption[] = [
  {
    value: "u1",
    label: "Alice Martin",
    email: "alice@school.cm",
    subtitle: "Mathématiques",
  },
  {
    value: "u2",
    label: "Bob Dupont",
    email: "bob@school.cm",
    subtitle: "Français",
  },
  {
    value: "u3",
    label: "Carol Nguessi",
    email: "carol@school.cm",
    subtitle: "Sciences",
  },
];

const onClose = jest.fn();
const onConfirm = jest.fn();

beforeEach(() => jest.clearAllMocks());

function renderModal(
  visible = true,
  selected: RecipientOption[] = [],
  recs = recipients,
) {
  return render(
    <RecipientPickerModal
      visible={visible}
      recipients={recs}
      selected={selected}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
}

// ── Visibilité ────────────────────────────────────────────────────────────────

describe("Visibilité", () => {
  it("affiche le modal quand visible=true", () => {
    renderModal(true);
    expect(screen.getByText("Destinataires")).toBeTruthy();
  });
});

// ── Liste des destinataires ───────────────────────────────────────────────────

describe("Liste des destinataires", () => {
  it("affiche tous les destinataires disponibles", () => {
    renderModal();
    expect(screen.getByTestId("recipient-option-u1")).toBeTruthy();
    expect(screen.getByTestId("recipient-option-u2")).toBeTruthy();
    expect(screen.getByTestId("recipient-option-u3")).toBeTruthy();
  });

  it("affiche le label de chaque destinataire", () => {
    renderModal();
    expect(screen.getByText("Alice Martin")).toBeTruthy();
    expect(screen.getByText("Bob Dupont")).toBeTruthy();
  });

  it("affiche le sous-titre (matière / fonction)", () => {
    renderModal();
    expect(screen.getByText("Mathématiques")).toBeTruthy();
    expect(screen.getByText("Français")).toBeTruthy();
  });

  it("affiche un message vide si aucun résultat", () => {
    renderModal(true, [], []);
    expect(screen.getByText("Aucun destinataire trouvé")).toBeTruthy();
  });
});

// ── Sélection ─────────────────────────────────────────────────────────────────

describe("Sélection de destinataires", () => {
  it("sélectionne un destinataire au clic", () => {
    renderModal();
    fireEvent.press(screen.getByTestId("recipient-option-u1"));
    // Confirmer la sélection
    fireEvent.press(screen.getByTestId("recipient-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ value: "u1" })]),
    );
  });

  it("désélectionne un destinataire déjà sélectionné", () => {
    renderModal(true, [recipients[0]]);
    fireEvent.press(screen.getByTestId("recipient-option-u1"));
    fireEvent.press(screen.getByTestId("recipient-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledWith([]);
  });

  it("permet la sélection multiple", () => {
    renderModal();
    fireEvent.press(screen.getByTestId("recipient-option-u1"));
    fireEvent.press(screen.getByTestId("recipient-option-u2"));
    fireEvent.press(screen.getByTestId("recipient-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: "u1" }),
        expect.objectContaining({ value: "u2" }),
      ]),
    );
  });

  it("le bouton OK affiche le nombre de sélectionnés", () => {
    renderModal(true, [recipients[0]]);
    // L'état initial a déjà 1 sélectionné
    expect(screen.getByText("OK (1)")).toBeTruthy();
  });
});

// ── Recherche ─────────────────────────────────────────────────────────────────

describe("Recherche", () => {
  it("filtre les destinataires par nom", () => {
    renderModal();
    fireEvent.changeText(screen.getByTestId("recipient-search"), "Alice");
    expect(screen.getByTestId("recipient-option-u1")).toBeTruthy();
    expect(screen.queryByTestId("recipient-option-u2")).toBeNull();
  });

  it("filtre par sous-titre (matière)", () => {
    renderModal();
    fireEvent.changeText(screen.getByTestId("recipient-search"), "Sciences");
    expect(screen.getByTestId("recipient-option-u3")).toBeTruthy();
    expect(screen.queryByTestId("recipient-option-u1")).toBeNull();
  });

  it("insensible à la casse", () => {
    renderModal();
    fireEvent.changeText(screen.getByTestId("recipient-search"), "alice");
    expect(screen.getByTestId("recipient-option-u1")).toBeTruthy();
  });

  it("affiche 'Aucun destinataire trouvé' si aucun résultat", () => {
    renderModal();
    fireEvent.changeText(screen.getByTestId("recipient-search"), "zzzzzz");
    expect(screen.getByText("Aucun destinataire trouvé")).toBeTruthy();
  });
});

// ── Fermeture ─────────────────────────────────────────────────────────────────

describe("Fermeture", () => {
  it("appelle onClose quand on presse 'Annuler'", () => {
    renderModal();
    fireEvent.press(screen.getByText("Annuler"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("appelle onConfirm et onClose quand on presse OK", () => {
    renderModal(true, [recipients[0]]);
    fireEvent.press(screen.getByTestId("recipient-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
