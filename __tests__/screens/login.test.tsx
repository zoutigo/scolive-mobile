import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import LoginScreen from "../../app/login";

jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

describe("LoginScreen", () => {
  it("affiche le formulaire téléphone par défaut", () => {
    render(<LoginScreen />);

    expect(screen.getByText("Connexion")).toBeOnTheScreen();
    expect(screen.getByTestId("tab-phone")).toBeOnTheScreen();
    expect(screen.getByTestId("input-phone")).toBeOnTheScreen();
    expect(screen.getByTestId("input-pin")).toBeOnTheScreen();
    expect(screen.queryByTestId("input-email")).toBeNull();
  });

  it("bascule vers le formulaire email", () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByTestId("tab-email"));

    expect(screen.getByTestId("input-email")).toBeOnTheScreen();
    expect(screen.getByTestId("input-password")).toBeOnTheScreen();
    expect(screen.queryByTestId("input-phone")).toBeNull();
  });

  it("conserve les saisies quand on change d'onglet", () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
    fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
    fireEvent.press(screen.getByTestId("tab-email"));
    fireEvent.changeText(screen.getByTestId("input-email"), "marie@ecole.fr");
    fireEvent.changeText(screen.getByTestId("input-password"), "secret");
    fireEvent.press(screen.getByTestId("tab-phone"));

    expect(screen.getByDisplayValue("612345678")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("123456")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("tab-email"));

    expect(screen.getByDisplayValue("marie@ecole.fr")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("secret")).toBeOnTheScreen();
  });

  it("affiche les éléments de statut de build dev", () => {
    render(<LoginScreen />);

    expect(screen.getByTestId("submit-login")).toBeOnTheScreen();
    expect(screen.getByTestId("dev-badge")).toBeOnTheScreen();
    expect(screen.getByText("Build dev Android opérationnel")).toBeOnTheScreen();
  });
});
