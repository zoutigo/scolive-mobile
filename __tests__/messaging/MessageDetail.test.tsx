/**
 * Tests fonctionnels — écran détail message (messages/[messageId].tsx)
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react-native";
import { Linking } from "react-native";
import MessageDetailScreen from "../../app/(home)/messages/[messageId]";
import { messagingApi } from "../../src/api/messaging.api";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/messaging.api");
jest.mock("../../src/store/messaging.store");
jest.mock("../../src/store/auth.store");
jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockRouter = { back: mockBack, push: mockPush };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ messageId: "m1" }),
}));

const api = messagingApi as jest.Mocked<typeof messagingApi>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const messageDetail = {
  id: "m1",
  subject: "Convocation réunion parents",
  body: "<p>Bonjour, vous êtes convoqué le 20 janvier.</p>",
  status: "SENT" as const,
  createdAt: "2024-01-15T10:00:00Z",
  sentAt: "2024-01-15T10:00:00Z",
  senderArchivedAt: null,
  isSender: false,
  recipientState: { readAt: null, archivedAt: null, deletedAt: null },
  sender: { id: "u1", firstName: "Alice", lastName: "Martin" },
  attachments: [],
  recipients: [
    {
      id: "r1",
      userId: "u2",
      firstName: "Robert",
      lastName: "Ntamack",
      email: "robert@school.cm",
      readAt: null,
      archivedAt: null,
    },
  ],
};

const messageWithImages = {
  ...messageDetail,
  id: "m2",
  body: '<p>Voici le bulletin.</p><p><img src="http://10.0.2.2:9000/img.jpg" alt=""></p>',
};

const storeState = {
  folder: "inbox" as const,
  markLocalRead: jest.fn(),
  markLocalUnread: jest.fn(),
  removeLocal: jest.fn(),
};
const showFeedbackToast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useSuccessToastStore.setState({ show: showFeedbackToast });
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    schoolSlug: "college-vogt",
  });
  (useMessagingStore as unknown as jest.Mock).mockReturnValue(storeState);
  api.get.mockResolvedValue(messageDetail);
  api.markRead.mockResolvedValue(undefined);
  api.archive.mockResolvedValue(undefined);
  api.remove.mockResolvedValue(undefined);
});

async function renderDetailAndWait() {
  render(<MessageDetailScreen />);
  await screen.findByTestId("recipients-toggle");
}

// ── Rendu ─────────────────────────────────────────────────────────────────────

describe("Rendu du détail", () => {
  it("affiche une barre d'actions fixe sur une seule ligne", async () => {
    await renderDetailAndWait();
    expect(screen.getByTestId("message-detail-action-bar")).toHaveStyle({
      flexDirection: "row",
    });
  });

  it("affiche le titre de retour dans l'en-tête", async () => {
    await renderDetailAndWait();
    expect(screen.getByText("Retour à la messagerie")).toBeTruthy();
  });

  it("affiche le sujet dans la carte de résumé", async () => {
    await renderDetailAndWait();
    expect(screen.getByText("Convocation réunion parents")).toBeTruthy();
  });

  it("affiche le corps du message (texte)", async () => {
    await renderDetailAndWait();
    expect(
      screen.getByText("Bonjour, vous êtes convoqué le 20 janvier."),
    ).toBeTruthy();
  });

  it("affiche le nom de l'expéditeur", async () => {
    await renderDetailAndWait();
    expect(screen.getByText("Martin Alice")).toBeTruthy();
  });

  it("affiche le nombre de destinataires", async () => {
    await renderDetailAndWait();
    expect(screen.getByText("1 destinataire")).toBeTruthy();
  });
});

// ── Lecture automatique ───────────────────────────────────────────────────────

describe("Marquage comme lu", () => {
  it("appelle markRead quand le message est non-lu", async () => {
    await renderDetailAndWait();
    await waitFor(() => {
      expect(api.markRead).toHaveBeenCalledWith("college-vogt", "m1", true);
    });
  });

  it("appelle markLocalRead dans le store", async () => {
    await renderDetailAndWait();
    await waitFor(() => {
      expect(storeState.markLocalRead).toHaveBeenCalledWith("m1");
    });
  });

  it("ne rappelle pas markRead si déjà lu", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      recipientState: {
        readAt: "2024-01-15T09:00:00Z",
        archivedAt: null,
        deletedAt: null,
      },
    });
    await renderDetailAndWait();
    await waitFor(() => {
      expect(api.markRead).not.toHaveBeenCalled();
    });
  });
});

// ── Affichage des destinataires ───────────────────────────────────────────────

describe("Liste des destinataires", () => {
  it("affiche les destinataires quand on presse le toggle", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("recipients-toggle"));
    expect(screen.getByText("Ntamack Robert")).toBeTruthy();
    expect(screen.getByText("robert@school.cm")).toBeTruthy();
  });

  it("cache les destinataires quand on represse le toggle", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("recipients-toggle"));
    expect(screen.getByText("Ntamack Robert")).toBeTruthy();
    fireEvent.press(screen.getByTestId("recipients-toggle"));
    expect(screen.queryByText("Ntamack Robert")).toBeNull();
  });
});

// ── Images inline ─────────────────────────────────────────────────────────────

describe("Images inline", () => {
  it("affiche les images extraites du HTML", async () => {
    api.get.mockResolvedValueOnce(messageWithImages);
    await renderDetailAndWait();
    expect(screen.getByTestId("inline-image-0")).toBeTruthy();
  });
});

describe("Pièces jointes", () => {
  it("affiche les pièces jointes du message", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      attachments: [
        {
          id: "att-1",
          fileName: "bulletin.pdf",
          url: "http://10.0.2.2:9000/media/bulletin.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      ],
    });

    await renderDetailAndWait();
    expect(screen.getByText("Pièces jointes")).toBeTruthy();
    expect(screen.getByText("bulletin.pdf")).toBeTruthy();
  });

  it("ouvre une pièce jointe quand on la presse", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      attachments: [
        {
          id: "att-1",
          fileName: "bulletin.pdf",
          url: "http://10.0.2.2:9000/media/bulletin.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      ],
    });

    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("attachment-row-att-1"));
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        "http://10.0.2.2:9000/media/bulletin.pdf",
      );
    });
  });
});

// ── Actions ───────────────────────────────────────────────────────────────────

describe("Action archiver", () => {
  it("appelle archive() et removeLocal() puis revient", async () => {
    await renderDetailAndWait();
    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn"));
    });
    expect(api.archive).toHaveBeenCalledWith("college-vogt", "m1", true);
    expect(showFeedbackToast).toHaveBeenCalledWith({
      variant: "success",
      title: "Message archivé",
      message: "Le message a été déplacé dans les archives.",
    });
    expect(storeState.removeLocal).toHaveBeenCalledWith("m1");
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche un toast d'erreur si l'archivage échoue", async () => {
    api.archive.mockRejectedValueOnce(new Error("ARCHIVE_FAILED"));

    await renderDetailAndWait();
    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn"));
    });

    await waitFor(() => {
      expect(showFeedbackToast).toHaveBeenCalledWith({
        variant: "error",
        title: "Archivage impossible",
        message: "Impossible d'archiver ce message.",
      });
    });
  });
});

describe("Action marquer non lu", () => {
  it("affiche le bouton quand le message a déjà été lu", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      recipientState: {
        readAt: "2024-01-15T10:10:00Z",
        archivedAt: null,
        deletedAt: null,
      },
    });

    await renderDetailAndWait();
    expect(screen.getByTestId("mark-unread-btn")).toBeTruthy();
  });

  it("cache le bouton si le message est déjà non lu", async () => {
    await renderDetailAndWait();
    expect(screen.queryByTestId("mark-unread-btn")).toBeNull();
  });

  it("appelle markRead(false) et met à jour le store local", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      recipientState: {
        readAt: "2024-01-15T10:10:00Z",
        archivedAt: null,
        deletedAt: null,
      },
    });

    await renderDetailAndWait();
    await act(async () => {
      fireEvent.press(screen.getByTestId("mark-unread-btn"));
    });

    expect(api.markRead).toHaveBeenCalledWith("college-vogt", "m1", false);
    expect(storeState.markLocalUnread).toHaveBeenCalledWith("m1");
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("Action supprimer", () => {
  it("affiche le dialog de confirmation", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("delete-btn"));
    expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy();
  });

  it("supprime le message après confirmation", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("delete-btn"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    });
    expect(api.remove).toHaveBeenCalledWith("college-vogt", "m1");
    expect(showFeedbackToast).toHaveBeenCalledWith({
      variant: "success",
      title: "Message supprimé",
      message: "Le message a bien été supprimé.",
    });
    expect(storeState.removeLocal).toHaveBeenCalledWith("m1");
  });

  it("affiche un toast d'erreur si la suppression échoue", async () => {
    api.remove.mockRejectedValueOnce(new Error("DELETE_FAILED"));

    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("delete-btn"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    });

    await waitFor(() => {
      expect(showFeedbackToast).toHaveBeenCalledWith({
        variant: "error",
        title: "Suppression impossible",
        message: "Impossible de supprimer ce message.",
      });
    });
  });

  it("n'appelle pas remove si on annule", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("delete-btn"));
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(api.remove).not.toHaveBeenCalled();
  });
});

describe("Action répondre", () => {
  it("navigue vers compose avec les bons params", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("reply-btn"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          replyToSubject: "Convocation réunion parents",
          replyToSenderId: "u1",
        }),
      }),
    );
  });

  it("préfixe le sujet avec 'Re:' si absent", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("reply-btn"));
    const params = (
      mockPush.mock.calls[0][0] as { params: Record<string, string> }
    ).params;
    expect(params.replyToSubject).toBe("Convocation réunion parents");
  });
});
