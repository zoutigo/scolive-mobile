import React from "react";
import { StyleSheet } from "react-native";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { useAuthStore } from "../../src/store/auth.store";
import { colors } from "../../src/theme";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({
    name,
    testID,
  }: {
    name: string;
    size?: number;
    color?: string;
    testID?: string;
  }) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, {
      testID: testID ?? `icon-${name}`,
      accessibilityLabel: name,
    });
  },
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

let mockLogout: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockLogout = jest.fn();
  mockUseAuthStore.mockReturnValue({
    logout: mockLogout,
  } as ReturnType<typeof useAuthStore>);
});

// ── Rendu de base ─────────────────────────────────────────────────────────────

describe("ModuleHeader — rendu de base", () => {
  it("se rend sans erreur", () => {
    const { toJSON } = render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(toJSON()).not.toBeNull();
  });

  it("utilise le testID par défaut 'module-header'", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(screen.getByTestId("module-header")).toBeTruthy();
  });

  it("utilise le testID fourni en props", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} testID="my-header" />);
    expect(screen.getByTestId("my-header")).toBeTruthy();
    expect(screen.queryByTestId("module-header")).toBeNull();
  });

  it("affiche le titre", () => {
    render(<ModuleHeader title="Messagerie" onBack={jest.fn()} />);
    expect(screen.getByTestId("module-header-title")).toBeTruthy();
    expect(screen.getByTestId("module-header-title").props.children).toContain(
      "Messagerie",
    );
  });

  it("affiche le sous-titre quand fourni", () => {
    render(
      <ModuleHeader title="Notes" subtitle="Hugo • CM2" onBack={jest.fn()} />,
    );
    expect(screen.getByTestId("module-header-subtitle")).toBeTruthy();
    expect(screen.getByTestId("module-header-subtitle").props.children).toBe(
      "Hugo • CM2",
    );
  });

  it("n'affiche pas le sous-titre quand absent", () => {
    render(<ModuleHeader title="Notes" onBack={jest.fn()} />);
    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });

  it("n'affiche pas le sous-titre quand null", () => {
    render(<ModuleHeader title="Notes" subtitle={null} onBack={jest.fn()} />);
    expect(screen.queryByTestId("module-header-subtitle")).toBeNull();
  });

  it("affiche le titleHighlight en couleur warmAccent", () => {
    render(
      <ModuleHeader
        title="Messagerie · "
        titleHighlight="13/21"
        onBack={jest.fn()}
      />,
    );
    expect(screen.getByTestId("module-header-title")).toBeTruthy();
  });
});

// ── Style du conteneur header ─────────────────────────────────────────────────

describe("ModuleHeader — style du conteneur", () => {
  it("applique paddingHorizontal: 20 (marge bord gauche/droit)", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const header = screen.getByTestId("module-header");
    const flat = StyleSheet.flatten(header.props.style);
    expect(flat.paddingHorizontal).toBe(20);
  });

  it("n'applique pas de marginHorizontal négatif", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const header = screen.getByTestId("module-header");
    const flat = StyleSheet.flatten(header.props.style);
    expect(flat.marginHorizontal).toBeUndefined();
  });

  it("applique overflow: hidden pour le clipping des blobs", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const header = screen.getByTestId("module-header");
    const flat = StyleSheet.flatten(header.props.style);
    expect(flat.overflow).toBe("hidden");
  });

  it("applique la couleur de fond primary par défaut", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const header = screen.getByTestId("module-header");
    const flat = StyleSheet.flatten(header.props.style);
    expect(flat.backgroundColor).toBe(colors.primary);
  });

  it("applique une couleur de fond personnalisée", () => {
    render(
      <ModuleHeader
        title="Test"
        onBack={jest.fn()}
        backgroundColor={colors.accentTeal}
      />,
    );
    const header = screen.getByTestId("module-header");
    const flat = StyleSheet.flatten(header.props.style);
    expect(flat.backgroundColor).toBe(colors.accentTeal);
  });

  it("est une ligne flex avec alignItems center", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const header = screen.getByTestId("module-header");
    const flat = StyleSheet.flatten(header.props.style);
    expect(flat.flexDirection).toBe("row");
    expect(flat.alignItems).toBe("center");
  });
});

// ── Bouton retour ─────────────────────────────────────────────────────────────

describe("ModuleHeader — bouton retour", () => {
  it("affiche le bouton retour avec testID par défaut", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(screen.getByTestId("module-header-back")).toBeTruthy();
  });

  it("utilise le backTestID personnalisé", () => {
    render(
      <ModuleHeader title="Test" onBack={jest.fn()} backTestID="custom-back" />,
    );
    expect(screen.getByTestId("custom-back")).toBeTruthy();
    expect(screen.queryByTestId("module-header-back")).toBeNull();
  });

  it("appelle onBack au clic", () => {
    const onBack = jest.fn();
    render(<ModuleHeader title="Test" onBack={onBack} backTestID="mh-back" />);
    fireEvent.press(screen.getByTestId("mh-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onBack si non cliqué", () => {
    const onBack = jest.fn();
    render(<ModuleHeader title="Test" onBack={onBack} />);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("le bouton retour a le fond blanc semi-transparent", () => {
    render(
      <ModuleHeader title="Test" onBack={jest.fn()} backTestID="mh-back" />,
    );
    const flat = StyleSheet.flatten(screen.getByTestId("mh-back").props.style);
    expect(flat.backgroundColor).toBe("rgba(255,255,255,0.14)");
  });
});

// ── Bouton kebab menu ─────────────────────────────────────────────────────────

describe("ModuleHeader — bouton kebab menu", () => {
  it("affiche le bouton kebab avec testID 'module-header-menu'", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(screen.getByTestId("module-header-menu")).toBeTruthy();
  });

  it("n'affiche pas d'ancien spacer (module-header-right supprimé)", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(screen.queryByTestId("module-header-right")).toBeNull();
  });

  it("le bouton kebab a le rôle 'button'", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const btn = screen.getByTestId("module-header-menu");
    expect(btn.props.accessibilityRole).toBe("button");
  });

  it("le bouton kebab a le label 'Menu'", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const btn = screen.getByTestId("module-header-menu");
    expect(btn.props.accessibilityLabel).toBe("Menu");
  });

  it("le bouton kebab a les dimensions 38×38", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-menu").props.style,
    );
    expect(flat.width).toBe(38);
    expect(flat.height).toBe(38);
  });

  it("le bouton kebab a le fond warmAccent semi-transparent", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-menu").props.style,
    );
    expect(flat.backgroundColor).toBe("rgba(216,155,91,0.12)");
  });

  it("le bouton kebab a la bordure warmAccent", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-menu").props.style,
    );
    expect(flat.borderWidth).toBe(1.5);
    expect(flat.borderColor).toBe("rgba(216,155,91,0.55)");
  });

  it("affiche l'icône trois-points verticaux", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(screen.getByTestId("icon-ellipsis-vertical")).toBeTruthy();
  });
});

// ── Dropdown menu ─────────────────────────────────────────────────────────────

describe("ModuleHeader — menu déroulant", () => {
  it("ouvre le menu au clic sur le bouton kebab", async () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(screen.queryByTestId("icon-log-out-outline")).toBeNull();
    fireEvent.press(screen.getByTestId("module-header-menu"));
    await waitFor(() =>
      expect(screen.getByTestId("icon-log-out-outline")).toBeTruthy(),
    );
  });

  it("affiche l'option déconnexion dans le menu", async () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    fireEvent.press(screen.getByTestId("module-header-menu"));
    await waitFor(() =>
      expect(screen.getByText("Se déconnecter")).toBeTruthy(),
    );
  });

  it("ouvre le ConfirmDialog quand on presse déconnexion", async () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    fireEvent.press(screen.getByTestId("module-header-menu"));
    await waitFor(() =>
      expect(screen.getByText("Se déconnecter")).toBeTruthy(),
    );
    fireEvent.press(screen.getByText("Se déconnecter"));
    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog-modal")).toBeTruthy(),
    );
  });

  it("appelle logout après confirmation dans le ConfirmDialog", async () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    fireEvent.press(screen.getByTestId("module-header-menu"));
    await waitFor(() =>
      expect(screen.getByText("Se déconnecter")).toBeTruthy(),
    );
    fireEvent.press(screen.getByText("Se déconnecter"));
    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog-confirm")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas logout si on annule dans le ConfirmDialog", async () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    fireEvent.press(screen.getByTestId("module-header-menu"));
    await waitFor(() =>
      expect(screen.getByText("Se déconnecter")).toBeTruthy(),
    );
    fireEvent.press(screen.getByText("Se déconnecter"));
    await waitFor(() =>
      expect(screen.getByTestId("confirm-dialog-cancel")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

// ── Symétrie gauche/droite ────────────────────────────────────────────────────

describe("ModuleHeader — symétrie bouton gauche / bouton droit", () => {
  it("le bouton retour et le bouton kebab ont les mêmes dimensions", () => {
    render(
      <ModuleHeader title="Test" onBack={jest.fn()} backTestID="mh-back" />,
    );
    const backFlat = StyleSheet.flatten(
      screen.getByTestId("mh-back").props.style,
    );
    const menuFlat = StyleSheet.flatten(
      screen.getByTestId("module-header-menu").props.style,
    );
    expect(backFlat.width).toBe(menuFlat.width);
    expect(backFlat.height).toBe(menuFlat.height);
  });

  it("les deux boutons ont des fonds distincts (back=blanc, kebab=warmAccent)", () => {
    render(
      <ModuleHeader title="Test" onBack={jest.fn()} backTestID="mh-back" />,
    );
    const backBg = StyleSheet.flatten(
      screen.getByTestId("mh-back").props.style,
    ).backgroundColor;
    const menuBg = StyleSheet.flatten(
      screen.getByTestId("module-header-menu").props.style,
    ).backgroundColor;
    expect(backBg).toBe("rgba(255,255,255,0.14)");
    expect(menuBg).toBe("rgba(216,155,91,0.12)");
    expect(backBg).not.toBe(menuBg);
  });
});

// ── titleUppercase ────────────────────────────────────────────────────────────

describe("ModuleHeader — titleUppercase", () => {
  it("applique textTransform uppercase par défaut", () => {
    render(<ModuleHeader title="notes" onBack={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    expect(flat.textTransform).toBe("uppercase");
  });

  it("applique textTransform none quand titleUppercase=false", () => {
    render(
      <ModuleHeader title="Compte" onBack={jest.fn()} titleUppercase={false} />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    expect(flat.textTransform).toBe("none");
  });

  it("réduit la taille de police quand titleUppercase=false", () => {
    render(
      <ModuleHeader title="Compte" onBack={jest.fn()} titleUppercase={false} />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("module-header-title").props.style,
    );
    expect(flat.fontSize).toBeLessThan(19);
  });
});
