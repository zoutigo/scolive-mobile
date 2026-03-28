import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import LoginScreen from "../../app/login";

jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

describe("LoginScreen", () => {
  describe("En-tête", () => {
    it("affiche la marque en deux parties", () => {
      render(<LoginScreen />);

      expect(screen.getByText("SCO")).toBeOnTheScreen();
      expect(screen.getByText("LIVE")).toBeOnTheScreen();
    });

    it("affiche le tagline", () => {
      render(<LoginScreen />);

      expect(
        screen.getByText("Votre école en temps réel."),
      ).toBeOnTheScreen();
    });
  });

  describe("Onglets", () => {
    it("affiche les trois onglets", () => {
      render(<LoginScreen />);

      expect(screen.getByTestId("tab-phone")).toBeOnTheScreen();
      expect(screen.getByTestId("tab-email")).toBeOnTheScreen();
      expect(screen.getByTestId("tab-google")).toBeOnTheScreen();
    });

    it("active l'onglet Téléphone par défaut", () => {
      render(<LoginScreen />);

      expect(screen.getByTestId("panel-phone")).toBeOnTheScreen();
      expect(screen.queryByTestId("panel-email")).toBeNull();
      expect(screen.queryByTestId("panel-google")).toBeNull();
    });

    it("bascule vers le formulaire email", () => {
      render(<LoginScreen />);

      fireEvent.press(screen.getByTestId("tab-email"));

      expect(screen.getByTestId("panel-email")).toBeOnTheScreen();
      expect(screen.queryByTestId("panel-phone")).toBeNull();
      expect(screen.queryByTestId("panel-google")).toBeNull();
    });

    it("bascule vers le panneau Google", () => {
      render(<LoginScreen />);

      fireEvent.press(screen.getByTestId("tab-google"));

      expect(screen.getByTestId("panel-google")).toBeOnTheScreen();
      expect(screen.queryByTestId("panel-phone")).toBeNull();
      expect(screen.queryByTestId("panel-email")).toBeNull();
    });
  });

  describe("Formulaire Téléphone", () => {
    it("affiche le préfixe +237", () => {
      render(<LoginScreen />);

      expect(screen.getByText("+237")).toBeOnTheScreen();
    });

    it("affiche le champ téléphone et le champ PIN", () => {
      render(<LoginScreen />);

      expect(screen.getByTestId("input-phone")).toBeOnTheScreen();
      expect(screen.getByTestId("input-pin")).toBeOnTheScreen();
    });

    it("affiche le bouton Se connecter", () => {
      render(<LoginScreen />);

      expect(screen.getByTestId("submit-login")).toBeOnTheScreen();
      expect(screen.getByText("Se connecter")).toBeOnTheScreen();
    });

    it("accepte la saisie du numéro et du PIN", () => {
      render(<LoginScreen />);

      fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
      fireEvent.changeText(screen.getByTestId("input-pin"), "123456");

      expect(screen.getByDisplayValue("612345678")).toBeOnTheScreen();
      expect(screen.getByDisplayValue("123456")).toBeOnTheScreen();
    });
  });

  describe("Formulaire Email", () => {
    it("affiche les champs email et mot de passe", () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByTestId("tab-email"));

      expect(screen.getByTestId("input-email")).toBeOnTheScreen();
      expect(screen.getByTestId("input-password")).toBeOnTheScreen();
    });

    it("affiche le bouton Se connecter", () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByTestId("tab-email"));

      expect(screen.getByTestId("submit-login")).toBeOnTheScreen();
    });

    it("accepte la saisie de l'email et du mot de passe", () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByTestId("tab-email"));

      fireEvent.changeText(
        screen.getByTestId("input-email"),
        "directeur@lycee-cm.cm",
      );
      fireEvent.changeText(screen.getByTestId("input-password"), "motdepasse");

      expect(
        screen.getByDisplayValue("directeur@lycee-cm.cm"),
      ).toBeOnTheScreen();
      expect(screen.getByDisplayValue("motdepasse")).toBeOnTheScreen();
    });
  });

  describe("Panneau SSO", () => {
    it("affiche les boutons Google et Apple", () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByTestId("tab-google"));

      expect(screen.getByTestId("sso-google")).toBeOnTheScreen();
      expect(screen.getByTestId("sso-apple")).toBeOnTheScreen();
    });

    it("affiche le texte informatif SSO", () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByTestId("tab-google"));

      expect(
        screen.getByText("Accès instantané avec votre compte existant."),
      ).toBeOnTheScreen();
    });

    it("indique que Apple n'est pas encore disponible", () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByTestId("tab-google"));

      expect(screen.getByText("BIENTÔT")).toBeOnTheScreen();
    });
  });

  describe("Persistance des saisies entre onglets", () => {
    it("conserve les valeurs téléphone/PIN après changement d'onglet", () => {
      render(<LoginScreen />);

      fireEvent.changeText(screen.getByTestId("input-phone"), "612345678");
      fireEvent.changeText(screen.getByTestId("input-pin"), "123456");
      fireEvent.press(screen.getByTestId("tab-email"));
      fireEvent.press(screen.getByTestId("tab-phone"));

      expect(screen.getByDisplayValue("612345678")).toBeOnTheScreen();
      expect(screen.getByDisplayValue("123456")).toBeOnTheScreen();
    });

    it("conserve les valeurs email/password après changement d'onglet", () => {
      render(<LoginScreen />);

      fireEvent.press(screen.getByTestId("tab-email"));
      fireEvent.changeText(
        screen.getByTestId("input-email"),
        "marie@ecole.fr",
      );
      fireEvent.changeText(screen.getByTestId("input-password"), "secret");
      fireEvent.press(screen.getByTestId("tab-phone"));
      fireEvent.press(screen.getByTestId("tab-email"));

      expect(screen.getByDisplayValue("marie@ecole.fr")).toBeOnTheScreen();
      expect(screen.getByDisplayValue("secret")).toBeOnTheScreen();
    });
  });

  describe("Pied de page", () => {
    it("affiche le copyright en bas de page", () => {
      render(<LoginScreen />);

      expect(
        screen.getByText("© 2026 Scolive. Tous droits réservés."),
      ).toBeOnTheScreen();
    });
  });
});
