import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { AppUpdateModal } from "../../src/components/AppUpdateModal";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const baseProps = {
  visible: true,
  currentVersionName: "1.0.0",
  latestVersionName: "1.1.0",
  onDismiss: jest.fn(),
  onDownload: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Rendu — mode facultatif (défaut) ──────────────────────────────────────────

describe("Rendu — mode facultatif", () => {
  it("affiche la carte principale", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-card")).toBeTruthy();
  });

  it("affiche la barre d'accent", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-accent")).toBeTruthy();
  });

  it("affiche l'icône", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-icon")).toBeTruthy();
  });

  it("affiche le badge 'Mise à jour disponible'", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-badge")).toHaveTextContent(
      "Mise à jour disponible",
    );
  });

  it("affiche le titre 'Nouvelle version'", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-title")).toHaveTextContent(
      "Nouvelle version",
    );
  });

  it("affiche la version actuelle avec le préfixe v", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-current")).toHaveTextContent(
      "v1.0.0",
    );
  });

  it("affiche la dernière version avec le préfixe v", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-latest")).toHaveTextContent("v1.1.0");
  });

  it("affiche le message d'information", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-message")).toBeTruthy();
  });

  it("affiche le bouton 'Plus tard'", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-dismiss")).toHaveTextContent(
      "Plus tard",
    );
  });

  it("affiche le bouton 'Télécharger'", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(screen.getByTestId("app-update-download")).toHaveTextContent(
      "Télécharger",
    );
  });

  it("affiche '—' si currentVersionName est null", () => {
    render(<AppUpdateModal {...baseProps} currentVersionName={null} />);
    expect(screen.getByTestId("app-update-current")).toHaveTextContent("v—");
  });

  it("affiche '—' si latestVersionName est null", () => {
    render(<AppUpdateModal {...baseProps} latestVersionName={null} />);
    expect(screen.getByTestId("app-update-latest")).toHaveTextContent("v—");
  });

  it("n'affiche pas la carte si visible=false", () => {
    render(<AppUpdateModal {...baseProps} visible={false} />);
    expect(screen.queryByTestId("app-update-card")).toBeNull();
  });
});

// ── Rendu — mode obligatoire ──────────────────────────────────────────────────

describe("Rendu — mode obligatoire (mandatory=true)", () => {
  const mandatoryProps = { ...baseProps, mandatory: true };

  it("affiche le badge 'Mise à jour obligatoire'", () => {
    render(<AppUpdateModal {...mandatoryProps} />);
    expect(screen.getByTestId("app-update-badge")).toHaveTextContent(
      "Mise à jour obligatoire",
    );
  });

  it("affiche le titre 'Mise à jour requise'", () => {
    render(<AppUpdateModal {...mandatoryProps} />);
    expect(screen.getByTestId("app-update-title")).toHaveTextContent(
      "Mise à jour requise",
    );
  });

  it("n'affiche pas le bouton 'Plus tard'", () => {
    render(<AppUpdateModal {...mandatoryProps} />);
    expect(screen.queryByTestId("app-update-dismiss")).toBeNull();
  });

  it("affiche le bouton 'Télécharger et installer'", () => {
    render(<AppUpdateModal {...mandatoryProps} />);
    expect(screen.getByTestId("app-update-download")).toHaveTextContent(
      "Télécharger et installer",
    );
  });

  it("le message mentionne le repli désinstallation en cas d'échec", () => {
    render(<AppUpdateModal {...mandatoryProps} />);
    const message = screen.getByTestId("app-update-message");
    expect(message).toHaveTextContent(/sinstallez/);
  });
});

// ── Accessibilité ─────────────────────────────────────────────────────────────

describe("Accessibilité — mode facultatif", () => {
  it("le bouton 'Plus tard' a accessibilityRole='button'", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(
      screen.getByTestId("app-update-dismiss").props.accessibilityRole,
    ).toBe("button");
  });

  it("le bouton 'Télécharger' a accessibilityRole='button'", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(
      screen.getByTestId("app-update-download").props.accessibilityRole,
    ).toBe("button");
  });

  it("le bouton 'Plus tard' a le bon accessibilityLabel", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(
      screen.getByTestId("app-update-dismiss").props.accessibilityLabel,
    ).toBe("Plus tard");
  });

  it("le bouton 'Télécharger' a le bon accessibilityLabel", () => {
    render(<AppUpdateModal {...baseProps} />);
    expect(
      screen.getByTestId("app-update-download").props.accessibilityLabel,
    ).toBe("Télécharger");
  });
});

describe("Accessibilité — mode obligatoire", () => {
  it("le bouton 'Télécharger et installer' a le bon accessibilityLabel", () => {
    render(<AppUpdateModal {...baseProps} mandatory />);
    expect(
      screen.getByTestId("app-update-download").props.accessibilityLabel,
    ).toBe("Télécharger et installer");
  });
});

// ── Interactions — mode facultatif ────────────────────────────────────────────

describe("Interactions — mode facultatif", () => {
  it("appelle onDismiss au clic sur 'Plus tard'", () => {
    const onDismiss = jest.fn();
    render(<AppUpdateModal {...baseProps} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByTestId("app-update-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onDownload en cliquant 'Plus tard'", () => {
    const onDownload = jest.fn();
    render(<AppUpdateModal {...baseProps} onDownload={onDownload} />);
    fireEvent.press(screen.getByTestId("app-update-dismiss"));
    expect(onDownload).not.toHaveBeenCalled();
  });

  it("appelle onDownload au clic sur 'Télécharger'", () => {
    const onDownload = jest.fn();
    render(<AppUpdateModal {...baseProps} onDownload={onDownload} />);
    fireEvent.press(screen.getByTestId("app-update-download"));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onDismiss en cliquant 'Télécharger'", () => {
    const onDismiss = jest.fn();
    render(<AppUpdateModal {...baseProps} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByTestId("app-update-download"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("appelle onDismiss en cliquant sur l'overlay", () => {
    const onDismiss = jest.fn();
    render(<AppUpdateModal {...baseProps} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByTestId("app-update-overlay"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onDownload en cliquant sur l'overlay", () => {
    const onDownload = jest.fn();
    render(<AppUpdateModal {...baseProps} onDownload={onDownload} />);
    fireEvent.press(screen.getByTestId("app-update-overlay"));
    expect(onDownload).not.toHaveBeenCalled();
  });
});

// ── Interactions — mode obligatoire ───────────────────────────────────────────

describe("Interactions — mode obligatoire", () => {
  const mandatoryProps = { ...baseProps, mandatory: true };

  it("appelle onDownload au clic sur 'Aller sur le site'", () => {
    const onDownload = jest.fn();
    render(<AppUpdateModal {...mandatoryProps} onDownload={onDownload} />);
    fireEvent.press(screen.getByTestId("app-update-download"));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("ne ferme pas la modale en cliquant sur l'overlay", () => {
    const onDismiss = jest.fn();
    render(<AppUpdateModal {...mandatoryProps} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByTestId("app-update-overlay"));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
