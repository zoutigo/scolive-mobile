import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { CreateTicketScreen } from "../../src/components/tickets/CreateTicketScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTicketsStore } from "../../src/store/tickets.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));
jest.mock("../../src/store/tickets.store", () => ({
  useTicketsStore: jest.fn(),
}));
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(() => ({ show: jest.fn() })),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseTicketsStore = useTicketsStore as jest.MockedFunction<
  typeof useTicketsStore
>;

describe("CreateTicketScreen", () => {
  const createTicket = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ schoolSlug: "ecole-pilote" } as never);
    mockUseTicketsStore.mockReturnValue({ createTicket } as never);
    createTicket.mockResolvedValue({});
  });

  it("affiche le formulaire de création de ticket", () => {
    render(<CreateTicketScreen />);
    expect(screen.getByTestId("create-ticket-screen")).toBeTruthy();
    expect(screen.getByTestId("ticket-title-input")).toBeTruthy();
    expect(screen.getByTestId("ticket-description-input")).toBeTruthy();
  });

  it("validation : submit vide affiche les erreurs titre et description sans appeler l'API", async () => {
    render(<CreateTicketScreen />);
    fireEvent.press(screen.getByTestId("create-ticket-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("ticket-title-error")).toBeTruthy();
      expect(screen.getByTestId("ticket-description-error")).toBeTruthy();
    });
    expect(createTicket).not.toHaveBeenCalled();
  });

  it("câblage scroll-vers-erreur : onLayout sur les groupes titre/description ne crashe pas", async () => {
    render(<CreateTicketScreen />);

    const titleGroup = screen.getByTestId("ticket-title-input").parent;
    const descriptionGroup = screen.getByTestId(
      "ticket-description-input",
    ).parent;

    expect(() =>
      fireEvent(titleGroup!, "layout", {
        nativeEvent: { layout: { x: 0, y: 80, width: 320, height: 60 } },
      }),
    ).not.toThrow();
    expect(() =>
      fireEvent(descriptionGroup!, "layout", {
        nativeEvent: { layout: { x: 0, y: 260, width: 320, height: 60 } },
      }),
    ).not.toThrow();

    fireEvent.press(screen.getByTestId("create-ticket-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("ticket-title-error")).toBeTruthy(),
    );
  });

  it("succès : soumet un ticket valide et appelle createTicket", async () => {
    render(<CreateTicketScreen />);

    fireEvent.changeText(
      screen.getByTestId("ticket-title-input"),
      "Impossible de sauvegarder une note",
    );
    fireEvent.changeText(
      screen.getByTestId("ticket-description-input"),
      "Voici les étapes pour reproduire le problème rencontré.",
    );

    fireEvent.press(screen.getByTestId("create-ticket-submit"));

    await waitFor(() => expect(createTicket).toHaveBeenCalled());
  });
});
