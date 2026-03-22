import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import HomeScreen from "../app/index";

// Mock expo-router — jest.mock est hoisted, on accède au mock via jest.requireMock
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

const mockRouter = jest.requireMock("expo-router").router as {
  push: jest.Mock;
};

describe("Landing page (HomeScreen)", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    render(<HomeScreen />);
  });

  // --- Header ---
  describe("Header", () => {
    it('affiche "Sco" (partie accent du titre)', () => {
      expect(screen.getByText("Sco")).toBeOnTheScreen();
    });

    it('affiche "live" (partie principale du titre)', () => {
      expect(screen.getByText("live")).toBeOnTheScreen();
    });

    it("affiche le sous-titre", () => {
      expect(
        screen.getByText("La vie scolaire, simplifiée."),
      ).toBeOnTheScreen();
    });
  });

  // --- Feature cards ---
  describe("Feature cards", () => {
    it("affiche les 4 icônes des cartes", () => {
      expect(screen.getByText("📊")).toBeOnTheScreen();
      expect(screen.getByText("💬")).toBeOnTheScreen();
      expect(screen.getByText("📖")).toBeOnTheScreen();
      expect(screen.getByText("📅")).toBeOnTheScreen();
    });

    it('affiche le label "Suivi des notes en temps réel"', () => {
      expect(
        screen.getByText("Suivi des notes en temps réel"),
      ).toBeOnTheScreen();
    });

    it('affiche le label "Messagerie école-famille"', () => {
      expect(screen.getByText("Messagerie école-famille")).toBeOnTheScreen();
    });

    it('affiche le label "Cahier de vie numérique"', () => {
      expect(screen.getByText("Cahier de vie numérique")).toBeOnTheScreen();
    });

    it('affiche le label "Gestion des absences"', () => {
      expect(screen.getByText("Gestion des absences")).toBeOnTheScreen();
    });
  });

  // --- Banner ---
  describe("Banner", () => {
    it("affiche le texte du banner", () => {
      expect(
        screen.getByText(
          "Connectez école, enseignants et familles en un seul endroit.",
        ),
      ).toBeOnTheScreen();
    });
  });

  // --- Bouton CTA ---
  describe('Bouton "Se connecter"', () => {
    it("est présent sur la page", () => {
      expect(screen.getByText("Se connecter")).toBeOnTheScreen();
    });

    it("navigue vers /login au clic", () => {
      fireEvent.press(screen.getByText("Se connecter"));
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });

  // --- Footer ---
  describe("Footer", () => {
    it("affiche le copyright", () => {
      expect(
        screen.getByText("© 2026 Scolive — Tous droits réservés"),
      ).toBeOnTheScreen();
    });
  });
});
