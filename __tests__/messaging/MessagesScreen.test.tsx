/**
 * Tests fonctionnels — écran de liste des messages (messages/index.tsx)
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import MessagesScreen from "../../app/(home)/messages/index";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useAuthStore } from "../../src/store/auth.store";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRouter = { push: mockPush, back: mockBack };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/messages",
  useLocalSearchParams: () => ({}),
}));

jest.mock("../../src/store/messaging.store");
jest.mock("../../src/store/auth.store");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockMessage = {
  id: "m1",
  folder: "inbox",
  status: "SENT",
  subject: "Convocation parents",
  preview: "Texte de prévisualisation",
  createdAt: "2024-01-15T10:00:00Z",
  sentAt: "2024-01-15T10:00:00Z",
  unread: true,
  sender: { id: "u1", firstName: "Alice", lastName: "Martin" },
  recipientsCount: 1,
  mailboxEntryId: "me1",
  attachments: [],
};

const defaultStoreState = {
  folder: "inbox" as const,
  messages: [],
  meta: null,
  isLoading: false,
  isRefreshing: false,
  search: "",
  unreadCount: 0,
  setFolder: jest.fn(),
  setSearch: jest.fn(),
  loadMessages: jest.fn().mockResolvedValue(undefined),
  refreshMessages: jest.fn().mockResolvedValue(undefined),
  loadMoreMessages: jest.fn().mockResolvedValue(undefined),
  loadUnreadCount: jest.fn().mockResolvedValue(undefined),
  markLocalRead: jest.fn(),
  removeLocal: jest.fn(),
  reset: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useMessagingStore as unknown as jest.Mock).mockReturnValue(
    defaultStoreState,
  );
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    schoolSlug: "college-vogt",
  });
});

// ── Rendu initial ─────────────────────────────────────────────────────────────

describe("Rendu initial", () => {
  it("affiche le titre Messagerie", () => {
    render(<MessagesScreen />);
    expect(screen.getByText("Messagerie")).toBeTruthy();
  });

  it("affiche les onglets de dossiers", () => {
    render(<MessagesScreen />);
    expect(screen.getByTestId("folder-tab-inbox")).toBeTruthy();
    expect(screen.getByTestId("folder-tab-sent")).toBeTruthy();
  });

  it("affiche le FAB de composition", () => {
    render(<MessagesScreen />);
    expect(screen.getByTestId("compose-fab")).toBeTruthy();
  });
});

// ── État de chargement ────────────────────────────────────────────────────────

describe("État de chargement", () => {
  it("affiche un spinner quand isLoading=true et messages vides", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      isLoading: true,
      messages: [],
    });
    render(<MessagesScreen />);
    // Le spinner est présent (ActivityIndicator)
    expect(screen.queryByTestId("messages-list")).toBeNull();
  });
});

// ── Liste de messages ─────────────────────────────────────────────────────────

describe("Liste de messages", () => {
  it("affiche les messages chargés", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
    });
    render(<MessagesScreen />);
    expect(screen.getByTestId("message-row-m1")).toBeTruthy();
  });

  it("affiche l'état vide inbox quand il n'y a pas de messages", () => {
    render(<MessagesScreen />);
    expect(screen.getByText("Aucun message reçu")).toBeTruthy();
  });

  it("affiche l'état vide adapté au dossier envoyés", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "sent",
      messages: [],
    });
    render(<MessagesScreen />);
    expect(screen.getByText("Aucun message envoyé")).toBeTruthy();
  });

  it("affiche l'état vide adapté aux brouillons", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "drafts",
      messages: [],
    });
    render(<MessagesScreen />);
    expect(screen.getByText("Aucun brouillon")).toBeTruthy();
  });

  it("affiche l'état vide adapté aux archives", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      folder: "archive",
      messages: [],
    });
    render(<MessagesScreen />);
    expect(screen.getByText("Archives vides")).toBeTruthy();
  });
});

// ── Changement de dossier ─────────────────────────────────────────────────────

describe("Changement de dossier", () => {
  it("appelle setFolder quand on presse un onglet", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("folder-tab-sent"));
    expect(defaultStoreState.setFolder).toHaveBeenCalledWith("sent");
  });
});

// ── Recherche ─────────────────────────────────────────────────────────────────

describe("Recherche", () => {
  it("affiche le champ de recherche quand on presse le bouton", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("messages-search-btn"));
    expect(screen.getByTestId("messages-search-input")).toBeTruthy();
  });

  it("appelle setSearch quand on tape dans le champ", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("messages-search-btn"));
    fireEvent.changeText(
      screen.getByTestId("messages-search-input"),
      "convocation",
    );
    expect(defaultStoreState.setSearch).toHaveBeenCalledWith("convocation");
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe("Navigation", () => {
  it("navigue vers le détail quand on presse un message", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
    });
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("message-row-m1"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ params: { messageId: "m1" } }),
    );
  });

  it("navigue vers compose quand on presse le FAB", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("compose-fab"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/messages/compose");
  });

  it("appelle router.back() quand on presse la flèche retour", () => {
    render(<MessagesScreen />);
    fireEvent.press(screen.getByTestId("back-btn"));
    expect(mockBack).toHaveBeenCalled();
  });
});

// ── Rafraîchissement ──────────────────────────────────────────────────────────

describe("Chargement initial", () => {
  it("appelle loadMessages au montage", () => {
    render(<MessagesScreen />);
    expect(defaultStoreState.loadMessages).toHaveBeenCalledWith("college-vogt");
  });

  it("intercepte les erreurs de chargement pour eviter un Uncaught Promise", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(jest.fn());

    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      loadMessages: jest.fn().mockRejectedValue(new Error("Unauthorized")),
    });

    render(<MessagesScreen />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "MESSAGES_LOAD_FAILED",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});

describe("Infinite scroll", () => {
  it.each([
    ["inbox"],
    ["sent"],
    ["drafts"],
    ["archive"],
  ] as const)(
    "charge la page suivante quand on atteint la fin pour le dossier %s",
    (folder) => {
      (useMessagingStore as unknown as jest.Mock).mockReturnValue({
        ...defaultStoreState,
        folder,
        messages: [mockMessage],
        meta: { page: 1, limit: 25, total: 40, totalPages: 2 },
      });

      render(<MessagesScreen />);

      fireEvent(screen.getByTestId("messages-list"), "onEndReached", {
        distanceFromEnd: 24,
      });

      expect(defaultStoreState.loadMoreMessages).toHaveBeenCalledWith(
        "college-vogt",
      );
    },
  );

  it("affiche un indicateur de fin quand tous les messages sont chargés", () => {
    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });

    render(<MessagesScreen />);

    expect(screen.getByText("Tous les messages ont été chargés")).toBeTruthy();
  });

  it("intercepte les erreurs de chargement additionnel", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(jest.fn());

    (useMessagingStore as unknown as jest.Mock).mockReturnValue({
      ...defaultStoreState,
      messages: [mockMessage],
      meta: { page: 1, limit: 25, total: 40, totalPages: 2 },
      loadMoreMessages: jest.fn().mockRejectedValue(new Error("timeout")),
    });

    render(<MessagesScreen />);

    fireEvent(screen.getByTestId("messages-list"), "onEndReached", {
      distanceFromEnd: 24,
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "MESSAGES_LOAD_MORE_FAILED",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
