/**
 * Tests unitaires : CredentialDisplaySheet
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { CredentialDisplaySheet } from "../../src/components/users/CredentialDisplaySheet";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockClipboard = Clipboard as jest.Mocked<typeof Clipboard>;

const DEFAULT_PROPS = {
  visible: true,
  onClose: jest.fn(),
  username: "amina42",
  temporaryPassword: "Temp@1234",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CredentialDisplaySheet — affichage", () => {
  it("affiche le username", () => {
    render(<CredentialDisplaySheet {...DEFAULT_PROPS} />);
    expect(screen.getByText("amina42")).toBeOnTheScreen();
  });

  it("affiche le temporaryPassword", () => {
    render(<CredentialDisplaySheet {...DEFAULT_PROPS} />);
    expect(screen.getByText("Temp@1234")).toBeOnTheScreen();
  });

  it("affiche le titre par défaut 'Accès créé'", () => {
    render(<CredentialDisplaySheet {...DEFAULT_PROPS} />);
    expect(screen.getByText("Accès créé")).toBeOnTheScreen();
  });

  it("affiche un titre personnalisé si fourni", () => {
    render(
      <CredentialDisplaySheet {...DEFAULT_PROPS} title="Compte réinitialisé" />,
    );
    expect(screen.getByText("Compte réinitialisé")).toBeOnTheScreen();
  });

  it("affiche le bouton Fermer", () => {
    render(<CredentialDisplaySheet {...DEFAULT_PROPS} />);
    expect(screen.getByTestId("credential-close")).toBeOnTheScreen();
  });
});

describe("CredentialDisplaySheet — copier username", () => {
  it("appelle Clipboard.setStringAsync avec le username quand on copie l'identifiant", async () => {
    render(<CredentialDisplaySheet {...DEFAULT_PROPS} />);

    fireEvent.press(screen.getByTestId("copy-identifiant"));

    await waitFor(() =>
      expect(mockClipboard.setStringAsync).toHaveBeenCalledWith("amina42"),
    );
  });
});

describe("CredentialDisplaySheet — copier password", () => {
  it("appelle Clipboard.setStringAsync avec le mot de passe quand on copie le mot de passe", async () => {
    render(<CredentialDisplaySheet {...DEFAULT_PROPS} />);

    fireEvent.press(screen.getByTestId("copy-mot de passe"));

    await waitFor(() =>
      expect(mockClipboard.setStringAsync).toHaveBeenCalledWith("Temp@1234"),
    );
  });
});

describe("CredentialDisplaySheet — fermer", () => {
  it("appelle onClose quand on presse le bouton Fermer", () => {
    const onClose = jest.fn();
    render(<CredentialDisplaySheet {...DEFAULT_PROPS} onClose={onClose} />);

    fireEvent.press(screen.getByTestId("credential-close"));
    expect(onClose).toHaveBeenCalled();
  });
});
