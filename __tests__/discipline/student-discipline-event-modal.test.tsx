/**
 * Tests unitaires — StudentDisciplineEventModal
 *
 * Couvre :
 *  - rendu en mode création (champs vides, titre "Nouvel événement")
 *  - rendu en mode édition (valeurs pré-remplies, titre "Modification")
 *  - sélection du type via la liste déroulante
 *  - masquage du champ "Justifié" pour SANCTION et PUNITION
 *  - affichage du champ "Justifié" pour ABSENCE et RETARD
 *  - soumission valide → onSubmit appelé avec le bon payload
 *  - validation : motif vide → erreur, date vide → erreur
 *  - bouton Annuler → onClose appelé
 *  - affichage d'une erreur globale passée en prop
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StudentDisciplineEventModal } from "../../src/components/discipline/StudentDisciplineEventModal";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const onClose = jest.fn();
const onSubmit = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
});

function renderModal(props: Partial<React.ComponentProps<typeof StudentDisciplineEventModal>> = {}) {
  return render(
    <StudentDisciplineEventModal
      visible
      onClose={onClose}
      onSubmit={onSubmit}
      {...props}
    />,
  );
}

describe("StudentDisciplineEventModal — mode création", () => {
  it("affiche le titre Nouvel événement", () => {
    renderModal();
    expect(screen.getByText("Nouvel événement")).toBeTruthy();
  });

  it("affiche le type ABSENCE par défaut dans le trigger", () => {
    renderModal();
    expect(screen.getByTestId("modal-type-trigger")).toBeTruthy();
    expect(screen.getByText("Absence")).toBeTruthy();
  });

  it("affiche le champ Justifié pour le type ABSENCE (défaut)", () => {
    renderModal();
    expect(screen.getByTestId("modal-justified")).toBeTruthy();
  });

  it("cache le champ Justifié quand on sélectionne SANCTION", async () => {
    renderModal();

    fireEvent.press(screen.getByTestId("modal-type-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("modal-type-picker")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("modal-type-option-SANCTION"));

    await waitFor(() => {
      expect(screen.queryByTestId("modal-justified")).toBeNull();
    });
  });

  it("cache le champ Justifié quand on sélectionne PUNITION", async () => {
    renderModal();

    fireEvent.press(screen.getByTestId("modal-type-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("modal-type-picker")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("modal-type-option-PUNITION"));

    await waitFor(() => {
      expect(screen.queryByTestId("modal-justified")).toBeNull();
    });
  });

  it("affiche le champ Justifié quand on sélectionne RETARD", async () => {
    renderModal();

    fireEvent.press(screen.getByTestId("modal-type-trigger"));
    await waitFor(() =>
      expect(screen.getByTestId("modal-type-picker")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("modal-type-option-RETARD"));

    await waitFor(() => {
      expect(screen.getByTestId("modal-justified")).toBeTruthy();
    });
  });

  it("appelle onSubmit avec le bon payload quand les champs sont valides", async () => {
    renderModal();

    fireEvent.changeText(screen.getByTestId("modal-occurred-at"), "2026-04-09T08:30");
    fireEvent.changeText(screen.getByTestId("modal-reason"), "Absence injustifiée");
    fireEvent.press(screen.getByTestId("modal-submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ABSENCE",
          reason: "Absence injustifiée",
          occurredAt: expect.any(String),
        }),
      );
    });
  });

  it("affiche l'erreur de motif si le champ est vide au submit", async () => {
    renderModal();

    fireEvent.changeText(screen.getByTestId("modal-occurred-at"), "2026-04-09T08:30");
    fireEvent.press(screen.getByTestId("modal-submit"));

    await waitFor(() => {
      expect(screen.getByText("Le motif est obligatoire.")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("affiche l'erreur de date si la date est vide au submit", async () => {
    renderModal();

    fireEvent.changeText(screen.getByTestId("modal-occurred-at"), "");
    fireEvent.changeText(screen.getByTestId("modal-reason"), "Test motif");
    fireEvent.press(screen.getByTestId("modal-submit"));

    await waitFor(() => {
      expect(screen.getByText("La date est obligatoire.")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("appelle onClose quand on appuie sur Annuler", () => {
    renderModal();
    fireEvent.press(screen.getByTestId("modal-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("appelle onClose quand on appuie sur le bouton fermer", () => {
    renderModal();
    fireEvent.press(screen.getByTestId("modal-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("affiche une erreur globale passée en prop", () => {
    renderModal({ error: "Impossible d'enregistrer." });
    expect(screen.getByTestId("modal-error")).toBeTruthy();
    expect(screen.getByText("Impossible d'enregistrer.")).toBeTruthy();
  });

  it("désactive les boutons quand isSaving est true", () => {
    renderModal({ isSaving: true });
    const submit = screen.getByTestId("modal-submit");
    const cancel = screen.getByTestId("modal-cancel");
    expect(submit).toBeDisabled();
    expect(cancel).toBeDisabled();
  });

  it("n'affiche pas le modal quand visible est false", () => {
    renderModal({ visible: false });
    expect(screen.queryByTestId("student-discipline-modal")).toBeNull();
  });
});

describe("StudentDisciplineEventModal — mode édition", () => {
  const existingEvent = makeLifeEvent({
    id: "event-edit",
    type: "RETARD",
    reason: "Bus en retard",
    occurredAt: "2026-04-09T08:15:00.000Z",
    durationMinutes: 20,
    justified: true,
    comment: "Couvert",
  });

  it("affiche le titre Modification", () => {
    renderModal({ editing: existingEvent });
    expect(screen.getByText("Modification")).toBeTruthy();
  });

  it("pré-remplit le type RETARD", () => {
    renderModal({ editing: existingEvent });
    expect(screen.getByText("Retard")).toBeTruthy();
  });

  it("pré-remplit le motif", () => {
    renderModal({ editing: existingEvent });
    const reasonInput = screen.getByTestId("modal-reason");
    expect(reasonInput.props.value).toBe("Bus en retard");
  });

  it("appelle onSubmit avec les valeurs modifiées", async () => {
    renderModal({ editing: existingEvent });

    fireEvent.changeText(screen.getByTestId("modal-reason"), "Bus très en retard");
    fireEvent.press(screen.getByTestId("modal-submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "RETARD",
          reason: "Bus très en retard",
        }),
      );
    });
  });

  it("affiche le label Enregistrer les modifications au submit", () => {
    renderModal({ editing: existingEvent });
    expect(screen.getByText("Enregistrer les modifications")).toBeTruthy();
  });
});

describe("StudentDisciplineEventModal — picker de type", () => {
  it("ouvre le picker au clic sur le trigger", async () => {
    renderModal();
    fireEvent.press(screen.getByTestId("modal-type-trigger"));
    await waitFor(() => {
      expect(screen.getByTestId("modal-type-picker")).toBeTruthy();
    });
  });

  it("liste les 4 types dans le picker", async () => {
    renderModal();
    fireEvent.press(screen.getByTestId("modal-type-trigger"));
    await waitFor(() =>
      expect(screen.getByTestId("modal-type-picker")).toBeTruthy(),
    );

    expect(screen.getByTestId("modal-type-option-ABSENCE")).toBeTruthy();
    expect(screen.getByTestId("modal-type-option-RETARD")).toBeTruthy();
    expect(screen.getByTestId("modal-type-option-SANCTION")).toBeTruthy();
    expect(screen.getByTestId("modal-type-option-PUNITION")).toBeTruthy();
  });

  it("sélectionner SANCTION met à jour le trigger et ferme le picker", async () => {
    renderModal();
    fireEvent.press(screen.getByTestId("modal-type-trigger"));
    await waitFor(() =>
      expect(screen.getByTestId("modal-type-picker")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("modal-type-option-SANCTION"));

    await waitFor(() => {
      expect(screen.queryByTestId("modal-type-picker")).toBeNull();
    });
    expect(screen.getByText("Sanction")).toBeTruthy();
  });
});
