/**
 * Tests unitaires — ImageEditPanel
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import {
  ImageEditPanel,
  type ImageSize,
  type ImageAlign,
} from "../../src/components/editor/ImageEditPanel";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const onSizePress = jest.fn();
const onAlignPress = jest.fn();
const onDelete = jest.fn();
const onClose = jest.fn();

function renderPanel(
  overrides: {
    currentSize?: ImageSize | null;
    currentAlign?: ImageAlign | null;
  } = {},
) {
  return render(
    <ImageEditPanel
      onSizePress={onSizePress}
      onAlignPress={onAlignPress}
      onDelete={onDelete}
      onClose={onClose}
      currentSize={overrides.currentSize}
      currentAlign={overrides.currentAlign}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ImageEditPanel — rendu", () => {
  it("affiche le panel avec le testID", () => {
    renderPanel();
    expect(screen.getByTestId("image-edit-panel")).toBeTruthy();
  });

  it("affiche tous les boutons de taille", () => {
    renderPanel();
    expect(screen.getByTestId("image-size-25")).toBeTruthy();
    expect(screen.getByTestId("image-size-50")).toBeTruthy();
    expect(screen.getByTestId("image-size-75")).toBeTruthy();
    expect(screen.getByTestId("image-size-100")).toBeTruthy();
  });

  it("affiche tous les boutons d'alignement", () => {
    renderPanel();
    expect(screen.getByTestId("image-align-left")).toBeTruthy();
    expect(screen.getByTestId("image-align-center")).toBeTruthy();
    expect(screen.getByTestId("image-align-right")).toBeTruthy();
  });

  it("affiche le bouton supprimer", () => {
    renderPanel();
    expect(screen.getByTestId("image-delete-btn")).toBeTruthy();
  });

  it("affiche le bouton fermer", () => {
    renderPanel();
    expect(screen.getByTestId("image-edit-close")).toBeTruthy();
  });
});

describe("ImageEditPanel — callbacks", () => {
  it("appelle onSizePress(25) au clic sur le bouton 25%", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-size-25"));
    expect(onSizePress).toHaveBeenCalledWith(25);
  });

  it("appelle onSizePress(50) au clic sur le bouton 50%", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-size-50"));
    expect(onSizePress).toHaveBeenCalledWith(50);
  });

  it("appelle onSizePress(75) au clic sur le bouton 75%", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-size-75"));
    expect(onSizePress).toHaveBeenCalledWith(75);
  });

  it("appelle onSizePress(100) au clic sur le bouton 100%", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-size-100"));
    expect(onSizePress).toHaveBeenCalledWith(100);
  });

  it("appelle onAlignPress('left') au clic gauche", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-align-left"));
    expect(onAlignPress).toHaveBeenCalledWith("left");
  });

  it("appelle onAlignPress('center') au clic centre", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-align-center"));
    expect(onAlignPress).toHaveBeenCalledWith("center");
  });

  it("appelle onAlignPress('right') au clic droite", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-align-right"));
    expect(onAlignPress).toHaveBeenCalledWith("right");
  });

  it("appelle onDelete au clic sur le bouton supprimer", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-delete-btn"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("appelle onClose au clic sur le bouton fermer", () => {
    renderPanel();
    fireEvent.press(screen.getByTestId("image-edit-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ImageEditPanel — état actif", () => {
  it("ne plante pas sans currentSize ni currentAlign", () => {
    expect(() => renderPanel()).not.toThrow();
  });

  it("accepte currentSize=50 sans erreur", () => {
    expect(() => renderPanel({ currentSize: 50 })).not.toThrow();
  });

  it("accepte currentAlign='center' sans erreur", () => {
    expect(() => renderPanel({ currentAlign: "center" })).not.toThrow();
  });

  it("accepte currentSize=100 et currentAlign='right' sans erreur", () => {
    expect(() =>
      renderPanel({ currentSize: 100, currentAlign: "right" }),
    ).not.toThrow();
  });
});
