import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import { useLocaleStore } from "../../src/store/locale.store";
import { DisciplineForm } from "../../src/components/discipline/DisciplineForm";
import { LifeEventCard } from "../../src/components/discipline/LifeEventCard";
import { DisciplineList } from "../../src/components/discipline/DisciplineList";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("Discipline — traduction selon la locale du compte", () => {
  afterEach(() => {
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
  });

  describe("DisciplineForm", () => {
    it("affiche les messages de validation en francais par defaut", async () => {
      render(<DisciplineForm onSubmit={jest.fn()} />);

      fireEvent.changeText(screen.getByTestId("input-reason"), "   ");
      fireEvent.changeText(screen.getByTestId("input-occurred-at"), "bad-date");
      fireEvent.press(screen.getByTestId("btn-submit"));

      await waitFor(() => {
        expect(screen.getByText("Le motif est obligatoire.")).toBeOnTheScreen();
        expect(screen.getByText("La date est invalide.")).toBeOnTheScreen();
      });

      expect(screen.getByText("Type d'événement *")).toBeOnTheScreen();
      expect(screen.getByText("Créer l'événement")).toBeOnTheScreen();
    });

    it("affiche les messages de validation et les libelles en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });

      render(<DisciplineForm onSubmit={jest.fn()} />);

      fireEvent.changeText(screen.getByTestId("input-reason"), "   ");
      fireEvent.changeText(screen.getByTestId("input-occurred-at"), "bad-date");
      fireEvent.press(screen.getByTestId("btn-submit"));

      await waitFor(() => {
        expect(screen.getByText("Reason is required.")).toBeOnTheScreen();
        expect(screen.getByText("Date is invalid.")).toBeOnTheScreen();
      });

      expect(screen.getByText("Event type *")).toBeOnTheScreen();
      expect(screen.getByText("Create event")).toBeOnTheScreen();

      // Aucun texte francais residuel
      expect(screen.queryByText("Le motif est obligatoire.")).toBeNull();
      expect(screen.queryByText("Type d'événement *")).toBeNull();
    });

    it("traduit les libelles de type d'evenement en anglais", () => {
      useLocaleStore.setState({ locale: "en" });

      render(<DisciplineForm onSubmit={jest.fn()} />);

      expect(screen.getByText("Late arrival")).toBeOnTheScreen();
      expect(screen.getByText("Punishment")).toBeOnTheScreen();
      expect(screen.queryByText("Retard")).toBeNull();
      expect(screen.queryByText("Punition")).toBeNull();
    });
  });

  describe("LifeEventCard", () => {
    it("affiche les details en francais par defaut", () => {
      const event = makeLifeEvent({
        type: "RETARD",
        justified: false,
        durationMinutes: 15,
      });
      render(<LifeEventCard event={event} />);

      fireEvent.press(screen.getByTestId(`expand-event-${event.id}`));

      expect(screen.getByText("Durée")).toBeOnTheScreen();
      expect(screen.getByText("Non")).toBeOnTheScreen();
      expect(screen.getByText("Classe")).toBeOnTheScreen();
      expect(screen.getByText("Année scolaire")).toBeOnTheScreen();
    });

    it("affiche les details en anglais quand locale=en", () => {
      useLocaleStore.setState({ locale: "en" });

      const event = makeLifeEvent({
        type: "RETARD",
        justified: false,
        durationMinutes: 15,
      });
      render(<LifeEventCard event={event} />);

      fireEvent.press(screen.getByTestId(`expand-event-${event.id}`));

      expect(screen.getByText("Duration")).toBeOnTheScreen();
      expect(screen.getByText("No")).toBeOnTheScreen();
      expect(screen.getByText("Class")).toBeOnTheScreen();
      expect(screen.getByText("School year")).toBeOnTheScreen();

      expect(screen.queryByText("Durée")).toBeNull();
      expect(screen.queryByText("Non")).toBeNull();
    });
  });

  describe("DisciplineList — etat vide", () => {
    it("affiche le titre et le sous-titre par defaut en francais", () => {
      render(
        <DisciplineList
          events={[]}
          isLoading={false}
          isRefreshing={false}
          onRefresh={jest.fn()}
          testID="empty-list"
        />,
      );

      expect(screen.getByText("Aucun événement")).toBeOnTheScreen();
    });

    it("affiche le titre et le sous-titre par defaut en anglais", () => {
      useLocaleStore.setState({ locale: "en" });

      render(
        <DisciplineList
          events={[]}
          isLoading={false}
          isRefreshing={false}
          onRefresh={jest.fn()}
          testID="empty-list"
        />,
      );

      expect(screen.getByText("No events")).toBeOnTheScreen();
      expect(screen.queryByText("Aucun événement")).toBeNull();
    });
  });
});
