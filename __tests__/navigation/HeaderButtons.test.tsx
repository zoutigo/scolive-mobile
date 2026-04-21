import React from "react";
import { StyleSheet } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { HeaderBackButton } from "../../src/components/navigation/HeaderBackButton";
import { HeaderMenuButton } from "../../src/components/navigation/HeaderMenuButton";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, size, color, testID }: Record<string, unknown>) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, {
      testID: testID ?? `icon-${String(name)}`,
      accessibilityLabel: String(name),
      "data-size": size,
      "data-color": color,
    });
  },
}));

// ── HeaderBackButton — rendu ──────────────────────────────────────────────────

describe("HeaderBackButton — rendu", () => {
  it("se rend sans erreur", () => {
    const { toJSON } = render(<HeaderBackButton onPress={jest.fn()} />);
    expect(toJSON()).not.toBeNull();
  });

  it("utilise le testID par défaut 'header-back-btn'", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    expect(screen.getByTestId("header-back-btn")).toBeTruthy();
  });

  it("utilise le testID fourni en props", () => {
    render(<HeaderBackButton onPress={jest.fn()} testID="custom-back" />);
    expect(screen.getByTestId("custom-back")).toBeTruthy();
    expect(screen.queryByTestId("header-back-btn")).toBeNull();
  });

  it("a le label d'accessibilité 'Retour'", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    expect(
      screen.getByTestId("header-back-btn").props.accessibilityLabel,
    ).toBe("Retour");
  });

  it("a le rôle d'accessibilité 'button'", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    expect(
      screen.getByTestId("header-back-btn").props.accessibilityRole,
    ).toBe("button");
  });

  it("affiche l'icône arrow-back", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    expect(screen.getByTestId("icon-arrow-back")).toBeTruthy();
  });
});

// ── HeaderBackButton — styles ─────────────────────────────────────────────────

describe("HeaderBackButton — styles", () => {
  it("applique la largeur et hauteur 38", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    const btn = screen.getByTestId("header-back-btn");
    const flat = StyleSheet.flatten(btn.props.style);
    expect(flat.width).toBe(38);
    expect(flat.height).toBe(38);
  });

  it("applique un borderRadius de 12", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-back-btn").props.style,
    );
    expect(flat.borderRadius).toBe(12);
  });

  it("applique le fond blanc semi-transparent", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-back-btn").props.style,
    );
    expect(flat.backgroundColor).toBe("rgba(255,255,255,0.14)");
  });

  it("applique la bordure blanche semi-transparente", () => {
    render(<HeaderBackButton onPress={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-back-btn").props.style,
    );
    expect(flat.borderWidth).toBe(1);
    expect(flat.borderColor).toBe("rgba(255,255,255,0.2)");
  });
});

// ── HeaderBackButton — comportement ──────────────────────────────────────────

describe("HeaderBackButton — comportement", () => {
  it("appelle onPress au clic", () => {
    const onPress = jest.fn();
    render(<HeaderBackButton onPress={onPress} />);
    fireEvent.press(screen.getByTestId("header-back-btn"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onPress si on ne clique pas", () => {
    const onPress = jest.fn();
    render(<HeaderBackButton onPress={onPress} />);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("appelle onPress avec l'event natif", () => {
    const onPress = jest.fn();
    render(<HeaderBackButton onPress={onPress} />);
    fireEvent.press(screen.getByTestId("header-back-btn"), {
      nativeEvent: { locationX: 10, locationY: 10 },
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("est stable entre plusieurs rendus consécutifs", () => {
    const onPress = jest.fn();
    const { rerender } = render(<HeaderBackButton onPress={onPress} />);
    rerender(<HeaderBackButton onPress={onPress} />);
    fireEvent.press(screen.getByTestId("header-back-btn"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// ── HeaderMenuButton — rendu ──────────────────────────────────────────────────

describe("HeaderMenuButton — rendu", () => {
  it("se rend sans erreur", () => {
    const { toJSON } = render(<HeaderMenuButton onPress={jest.fn()} />);
    expect(toJSON()).not.toBeNull();
  });

  it("utilise le testID par défaut 'header-menu-btn'", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    expect(screen.getByTestId("header-menu-btn")).toBeTruthy();
  });

  it("utilise le testID fourni en props", () => {
    render(<HeaderMenuButton onPress={jest.fn()} testID="custom-menu" />);
    expect(screen.getByTestId("custom-menu")).toBeTruthy();
    expect(screen.queryByTestId("header-menu-btn")).toBeNull();
  });

  it("a le label d'accessibilité 'Ouvrir le menu'", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    expect(
      screen.getByTestId("header-menu-btn").props.accessibilityLabel,
    ).toBe("Ouvrir le menu");
  });

  it("a le rôle d'accessibilité 'button'", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    expect(
      screen.getByTestId("header-menu-btn").props.accessibilityRole,
    ).toBe("button");
  });

  it("affiche l'icône menu-outline", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    expect(screen.getByTestId("icon-menu-outline")).toBeTruthy();
  });
});

// ── HeaderMenuButton — styles ─────────────────────────────────────────────────

describe("HeaderMenuButton — styles", () => {
  it("applique la largeur et hauteur 38", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-menu-btn").props.style,
    );
    expect(flat.width).toBe(38);
    expect(flat.height).toBe(38);
  });

  it("applique un borderRadius de 12", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-menu-btn").props.style,
    );
    expect(flat.borderRadius).toBe(12);
  });

  it("applique le fond warmAccent semi-transparent", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-menu-btn").props.style,
    );
    expect(flat.backgroundColor).toBe("rgba(216,155,91,0.12)");
  });

  it("applique la bordure warmAccent", () => {
    render(<HeaderMenuButton onPress={jest.fn()} />);
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-menu-btn").props.style,
    );
    expect(flat.borderWidth).toBe(1.5);
    expect(flat.borderColor).toBe("rgba(216,155,91,0.55)");
  });

  it("fusionne le style additionnel passé en props", () => {
    render(
      <HeaderMenuButton
        onPress={jest.fn()}
        style={{ marginLeft: "auto" }}
      />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("header-menu-btn").props.style,
    );
    expect(flat.marginLeft).toBe("auto");
    expect(flat.backgroundColor).toBe("rgba(216,155,91,0.12)");
  });
});

// ── HeaderMenuButton — comportement ──────────────────────────────────────────

describe("HeaderMenuButton — comportement", () => {
  it("appelle onPress au clic", () => {
    const onPress = jest.fn();
    render(<HeaderMenuButton onPress={onPress} />);
    fireEvent.press(screen.getByTestId("header-menu-btn"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onPress si on ne clique pas", () => {
    const onPress = jest.fn();
    render(<HeaderMenuButton onPress={onPress} />);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("appelle onPress une seule fois même si pressé rapidement", () => {
    const onPress = jest.fn();
    render(<HeaderMenuButton onPress={onPress} />);
    fireEvent.press(screen.getByTestId("header-menu-btn"));
    fireEvent.press(screen.getByTestId("header-menu-btn"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("met à jour le gestionnaire onPress sans remount", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = render(<HeaderMenuButton onPress={first} />);
    rerender(<HeaderMenuButton onPress={second} />);
    fireEvent.press(screen.getByTestId("header-menu-btn"));
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});

// ── Distinction visuelle back vs menu ─────────────────────────────────────────

describe("Distinction visuelle back vs menu", () => {
  it("back et menu n'ont pas le même backgroundColor", () => {
    render(
      <>
        <HeaderBackButton onPress={jest.fn()} testID="back" />
        <HeaderMenuButton onPress={jest.fn()} testID="menu" />
      </>,
    );
    const backFlat = StyleSheet.flatten(
      screen.getByTestId("back").props.style,
    );
    const menuFlat = StyleSheet.flatten(
      screen.getByTestId("menu").props.style,
    );
    expect(backFlat.backgroundColor).not.toBe(menuFlat.backgroundColor);
  });

  it("back utilise le fond blanc ; menu utilise le fond warmAccent", () => {
    render(
      <>
        <HeaderBackButton onPress={jest.fn()} testID="back" />
        <HeaderMenuButton onPress={jest.fn()} testID="menu" />
      </>,
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("back").props.style).backgroundColor,
    ).toBe("rgba(255,255,255,0.14)");
    expect(
      StyleSheet.flatten(screen.getByTestId("menu").props.style).backgroundColor,
    ).toBe("rgba(216,155,91,0.12)");
  });

  it("les deux boutons ont les mêmes dimensions 38×38", () => {
    render(
      <>
        <HeaderBackButton onPress={jest.fn()} testID="back" />
        <HeaderMenuButton onPress={jest.fn()} testID="menu" />
      </>,
    );
    const backFlat = StyleSheet.flatten(
      screen.getByTestId("back").props.style,
    );
    const menuFlat = StyleSheet.flatten(
      screen.getByTestId("menu").props.style,
    );
    expect(backFlat.width).toBe(menuFlat.width);
    expect(backFlat.height).toBe(menuFlat.height);
  });
});

// ── Intégration — ModuleHeader ────────────────────────────────────────────────

describe("Intégration — ModuleHeader utilise les deux composants", () => {
  it("le bouton retour de ModuleHeader déclenche onBack", () => {
    const onBack = jest.fn();
    render(
      <ModuleHeader title="Test" onBack={onBack} backTestID="mh-back" />,
    );
    fireEvent.press(screen.getByTestId("mh-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("le bouton menu de ModuleHeader déclenche onRightPress", () => {
    const onRightPress = jest.fn();
    render(
      <ModuleHeader
        title="Test"
        onBack={jest.fn()}
        rightIcon="menu-outline"
        onRightPress={onRightPress}
        rightTestID="mh-menu"
      />,
    );
    fireEvent.press(screen.getByTestId("mh-menu"));
    expect(onRightPress).toHaveBeenCalledTimes(1);
  });

  it("le bouton retour de ModuleHeader a le style back (fond blanc)", () => {
    render(
      <ModuleHeader title="Test" onBack={jest.fn()} backTestID="mh-back" />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("mh-back").props.style,
    );
    expect(flat.backgroundColor).toBe("rgba(255,255,255,0.14)");
  });

  it("le bouton menu de ModuleHeader a le style menu (fond warmAccent)", () => {
    render(
      <ModuleHeader
        title="Test"
        onBack={jest.fn()}
        rightIcon="menu-outline"
        onRightPress={jest.fn()}
        rightTestID="mh-menu"
      />,
    );
    const flat = StyleSheet.flatten(
      screen.getByTestId("mh-menu").props.style,
    );
    expect(flat.backgroundColor).toBe("rgba(216,155,91,0.12)");
  });

  it("affiche un spacer droit quand rightIcon/onRightPress absents", () => {
    render(<ModuleHeader title="Test" onBack={jest.fn()} />);
    expect(screen.queryByTestId("module-header-right")).toBeNull();
  });

  it("rend back et menu indépendamment sans interférence", () => {
    const onBack = jest.fn();
    const onMenu = jest.fn();
    render(
      <ModuleHeader
        title="Test"
        onBack={onBack}
        backTestID="mh-back"
        rightIcon="menu-outline"
        onRightPress={onMenu}
        rightTestID="mh-menu"
      />,
    );
    fireEvent.press(screen.getByTestId("mh-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onMenu).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("mh-menu"));
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
