import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { AppInstallGuideModal } from "../../src/components/AppInstallGuideModal";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const baseProps = {
  visible: true,
  onClose: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Rendu ─────────────────────────────────────────────────────────────────────

describe("Rendu", () => {
  it("affiche la carte", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-card")).toBeTruthy();
  });

  it("affiche la barre d'accent", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-accent")).toBeTruthy();
  });

  it("affiche l'icône", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-icon")).toBeTruthy();
  });

  it("affiche le badge 'Installation sécurisée'", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-badge")).toHaveTextContent(
      "Installation sécurisée",
    );
  });

  it("affiche le titre", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-title")).toBeTruthy();
  });

  it("affiche le sous-titre d'explication", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-subtitle")).toBeTruthy();
  });

  it("affiche les 4 étapes", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-steps")).toBeTruthy();
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`install-guide-step-${i}`)).toBeTruthy();
    }
  });

  it("affiche le bouton 'J'ai compris'", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(screen.getByTestId("install-guide-close")).toBeTruthy();
  });

  it("n'affiche pas la carte si visible=false", () => {
    render(<AppInstallGuideModal {...baseProps} visible={false} />);
    expect(screen.queryByTestId("install-guide-card")).toBeNull();
  });
});

// ── Accessibilité ─────────────────────────────────────────────────────────────

describe("Accessibilité", () => {
  it("le bouton fermer a accessibilityRole='button'", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(
      screen.getByTestId("install-guide-close").props.accessibilityRole,
    ).toBe("button");
  });

  it("le bouton fermer a le bon accessibilityLabel", () => {
    render(<AppInstallGuideModal {...baseProps} />);
    expect(
      screen.getByTestId("install-guide-close").props.accessibilityLabel,
    ).toBe("J'ai compris");
  });
});

// ── Interactions ──────────────────────────────────────────────────────────────

describe("Interactions", () => {
  it("appelle onClose au clic sur 'J'ai compris'", () => {
    const onClose = jest.fn();
    render(<AppInstallGuideModal {...baseProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("install-guide-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("appelle onClose en cliquant sur l'overlay", () => {
    const onClose = jest.fn();
    render(<AppInstallGuideModal {...baseProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("install-guide-overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("n'appelle onClose qu'une fois par clic", () => {
    const onClose = jest.fn();
    render(<AppInstallGuideModal {...baseProps} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("install-guide-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
