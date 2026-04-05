import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SuccessToastHost } from "../../src/components/feedback/SuccessToastHost";
import {
  SUCCESS_TOAST_DURATION_MS,
  useSuccessToastStore,
} from "../../src/store/success-toast.store";

jest.useFakeTimers();
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("SuccessToastHost", () => {
  beforeEach(() => {
    useSuccessToastStore.getState().hide();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("affiche le toast quand le store est alimenté", () => {
    useSuccessToastStore.getState().show({
      title: "Message envoyé",
      message: "Votre message a bien été envoyé.",
    });

    render(<SuccessToastHost />);

    expect(screen.getByTestId("success-toast-card")).toBeOnTheScreen();
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Message envoyé",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Votre message a bien été envoyé.",
    );
    expect(screen.getByTestId("success-toast-variant")).toHaveTextContent(
      "Succès",
    );
  });

  it("affiche la variante erreur au milieu de l'écran", () => {
    useSuccessToastStore.getState().show({
      variant: "error",
      title: "Envoi impossible",
      message: "Impossible d'envoyer le message. Réessayez.",
    });

    render(<SuccessToastHost />);

    expect(screen.getByTestId("success-toast-card")).toBeOnTheScreen();
    expect(screen.getByTestId("success-toast-variant")).toHaveTextContent(
      "Échec",
    );
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Envoi impossible",
    );
  });

  it("masque automatiquement le toast après 7 secondes", () => {
    useSuccessToastStore.getState().show({
      title: "Brouillon enregistré",
      message: "Votre brouillon a bien été sauvegardé.",
    });

    render(<SuccessToastHost />);

    act(() => {
      jest.advanceTimersByTime(SUCCESS_TOAST_DURATION_MS);
    });

    expect(screen.queryByTestId("success-toast-card")).toBeNull();
  });

  it("permet à l'utilisateur de fermer le toast manuellement", () => {
    useSuccessToastStore.getState().show({
      title: "Message envoyé",
      message: "Votre message a bien été envoyé.",
    });

    render(<SuccessToastHost />);

    fireEvent.press(screen.getByTestId("success-toast-close"));

    expect(screen.queryByTestId("success-toast-card")).toBeNull();
  });
});
