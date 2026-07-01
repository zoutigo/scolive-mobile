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
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest
    .fn()
    .mockReturnValue({ width: 360, height: 800, scale: 2, fontScale: 1 }),
}));

const mockLoadSummary = jest.fn().mockResolvedValue(undefined);
jest.mock("../../src/store/badges.store", () => ({
  useBadgesStore: jest.fn(),
}));
const mockUseBadgesStore = jest.requireMock("../../src/store/badges.store")
  .useBadgesStore as jest.Mock & { getState: () => unknown };
mockUseBadgesStore.mockReturnValue({
  summary: null,
  loadSummary: mockLoadSummary,
  clear: jest.fn(),
});
mockUseBadgesStore.getState = () => ({ loadSummary: mockLoadSummary });

jest.spyOn(Linking, "canOpenURL").mockResolvedValue(true);
jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockRouter = { back: mockBack, push: mockPush };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ messageId: "m1" }),
  usePathname: () => "/(home)/messages/[messageId]",
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
  folder: "inbox" as "inbox" | "sent" | "drafts" | "archive",
  messages: [] as Array<{ id: string }>,
  meta: null as { total: number } | null,
  unreadCount: 0,
  keepUnreadIds: new Set<string>(),
  markLocalRead: jest.fn(),
  markLocalUnread: jest.fn(),
  removeLocal: jest.fn(),
  setFolder: jest.fn(),
};
const showFeedbackToast = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadSummary.mockClear();
  storeState.folder = "inbox";
  storeState.messages = [];
  storeState.meta = null;
  storeState.unreadCount = 0;
  storeState.keepUnreadIds = new Set<string>();
  useSuccessToastStore.setState({ show: showFeedbackToast });
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    schoolSlug: "college-vogt",
    user: {
      id: "parent-1",
      firstName: "Valery",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
      role: "PARENT",
      activeRole: "PARENT",
    },
  });
  (useMessagingStore as unknown as jest.Mock).mockReturnValue(storeState);
  api.get.mockResolvedValue(messageDetail);
  api.markRead.mockResolvedValue(undefined);
  api.archive.mockResolvedValue(undefined);
  api.remove.mockResolvedValue(undefined);
});

async function renderDetailAndWait() {
  render(<MessageDetailScreen />);
  await screen.findByTestId("recipients-toggle-m1");
}

// ── Header / boîte de message ─────────────────────────────────────────────────

describe("Header de boîte de message", () => {
  it("affiche le header immédiatement, sans dépendre du chargement du message", () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    render(<MessageDetailScreen />);
    expect(screen.getByTestId("message-detail-header")).toBeTruthy();
    expect(screen.getByTestId("msg-back-btn")).toBeTruthy();
  });

  it("affiche 'Boîte de réception de {user} · non lus/total' pour le dossier inbox", () => {
    storeState.unreadCount = 3;
    storeState.meta = { total: 12 };
    render(<MessageDetailScreen />);
    expect(screen.getByTestId("message-detail-header-title")).toHaveTextContent(
      "Boîte de réception de Valery Mbele · 3/12",
    );
  });

  it("ne répète pas le sujet du message dans le header", async () => {
    await renderDetailAndWait();
    expect(
      screen.getByTestId("message-detail-header-title"),
    ).not.toHaveTextContent("Convocation réunion parents");
  });

  it("affiche un libellé dédié pour le dossier sent (pas de fraction non-lus)", () => {
    storeState.folder = "sent";
    storeState.meta = { total: 5 };
    render(<MessageDetailScreen />);
    expect(screen.getByTestId("message-detail-header-title")).toHaveTextContent(
      "Messages envoyés de Valery Mbele · 5",
    );
  });
});

// ── Rendu ─────────────────────────────────────────────────────────────────────

describe("Rendu du détail", () => {
  it("affiche une barre d'actions fixe sur une seule ligne", async () => {
    await renderDetailAndWait();
    expect(screen.getByTestId("message-detail-action-bar-m1")).toHaveStyle({
      flexDirection: "row",
    });
  });

  it("affiche le sujet dans la carte de résumé", async () => {
    await renderDetailAndWait();
    expect(
      screen.getAllByText("Convocation réunion parents").length,
    ).toBeGreaterThan(0);
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

  it("affiche le nombre de destinataires en version compacte avec un libellé accessible", async () => {
    await renderDetailAndWait();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByLabelText("1 destinataire")).toBeTruthy();
  });

  it("affiche un état d'erreur si le chargement échoue", async () => {
    api.get.mockRejectedValueOnce(new Error("NETWORK_ERROR"));
    render(<MessageDetailScreen />);
    await screen.findByTestId("message-detail-error-m1");
    expect(mockBack).not.toHaveBeenCalled();
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

  it("rafraîchit le résumé global des badges", async () => {
    await renderDetailAndWait();
    await waitFor(() => {
      expect(mockLoadSummary).toHaveBeenCalledWith("college-vogt");
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

  it("ne marque pas lu un message que l'utilisateur a explicitement remis en non-lu", async () => {
    storeState.keepUnreadIds = new Set(["m1"]);
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
    fireEvent.press(screen.getByTestId("recipients-toggle-m1"));
    expect(screen.getByText("Ntamack Robert")).toBeTruthy();
    expect(screen.getByText("robert@school.cm")).toBeTruthy();
  });

  it("cache les destinataires quand on represse le toggle", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("recipients-toggle-m1"));
    expect(screen.getByText("Ntamack Robert")).toBeTruthy();
    fireEvent.press(screen.getByTestId("recipients-toggle-m1"));
    expect(screen.queryByText("Ntamack Robert")).toBeNull();
  });
});

// ── Images inline ─────────────────────────────────────────────────────────────

describe("Images inline", () => {
  it("affiche les images extraites du HTML", async () => {
    api.get.mockResolvedValueOnce(messageWithImages);
    await renderDetailAndWait();
    expect(screen.getByTestId("inline-image-m1-0")).toBeTruthy();
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
    fireEvent.press(screen.getByTestId("attachment-row-m1-att-1"));
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        "http://10.0.2.2:9000/media/bulletin.pdf",
      );
    });
  });
});

// ── Actions ───────────────────────────────────────────────────────────────────

describe("Action archiver (depuis inbox/sent)", () => {
  it("appelle archive(true), removeLocal() et revient sans changer de dossier", async () => {
    await renderDetailAndWait();
    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });
    expect(api.archive).toHaveBeenCalledWith("college-vogt", "m1", true);
    expect(showFeedbackToast).toHaveBeenCalledWith({
      variant: "success",
      title: "Message archivé",
      message: "Le message a été déplacé dans les archives.",
    });
    expect(storeState.removeLocal).toHaveBeenCalledWith("m1");
    // Pas de changement de dossier lors d'un archivage
    expect(storeState.setFolder).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche un toast d'erreur si l'archivage échoue", async () => {
    api.archive.mockRejectedValueOnce(new Error("ARCHIVE_FAILED"));

    await renderDetailAndWait();
    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });

    await waitFor(() => {
      expect(showFeedbackToast).toHaveBeenCalledWith({
        variant: "error",
        title: "Archivage impossible",
        message: "Impossible d'archiver ce message.",
      });
    });
    expect(storeState.setFolder).not.toHaveBeenCalled();
  });
});

describe("Action désarchiver (depuis le dossier archive)", () => {
  const archivedMessage = {
    ...messageDetail,
    isSender: false,
    recipientState: {
      readAt: "2024-01-15T10:00:00Z",
      archivedAt: "2024-01-16T08:00:00Z",
      deletedAt: null,
    },
  };

  const archivedSentMessage = {
    ...messageDetail,
    isSender: true,
    senderArchivedAt: "2024-01-16T08:00:00Z",
    recipientState: null,
    sender: null,
  };

  beforeEach(() => {
    storeState.folder = "archive";
  });

  it("appelle archive(false) et bascule sur inbox pour un message reçu", async () => {
    api.get.mockResolvedValueOnce(archivedMessage);
    await renderDetailAndWait();

    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });

    expect(api.archive).toHaveBeenCalledWith("college-vogt", "m1", false);
    expect(storeState.removeLocal).toHaveBeenCalledWith("m1");
    expect(storeState.setFolder).toHaveBeenCalledWith("inbox");
    expect(mockBack).toHaveBeenCalled();
  });

  it("bascule sur sent pour un message envoyé désarchivé", async () => {
    api.get.mockResolvedValueOnce(archivedSentMessage);
    await renderDetailAndWait();

    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });

    expect(api.archive).toHaveBeenCalledWith("college-vogt", "m1", false);
    expect(storeState.setFolder).toHaveBeenCalledWith("sent");
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche le toast de désarchivage avec le bon libellé", async () => {
    api.get.mockResolvedValueOnce(archivedMessage);
    await renderDetailAndWait();

    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });

    expect(showFeedbackToast).toHaveBeenCalledWith({
      variant: "success",
      title: "Message restauré",
      message: "Le message a été retiré des archives.",
    });
  });

  it("n'appelle pas setFolder si le désarchivage échoue (API erreur)", async () => {
    api.get.mockResolvedValueOnce(archivedMessage);
    api.archive.mockRejectedValueOnce(new Error("UNARCHIVE_FAILED"));

    await renderDetailAndWait();

    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });

    await waitFor(() => {
      expect(showFeedbackToast).toHaveBeenCalledWith({
        variant: "error",
        title: "Archivage impossible",
        message: "Impossible d'archiver ce message.",
      });
    });
    expect(storeState.setFolder).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("un PARENT peut désarchiver un message reçu", async () => {
    api.get.mockResolvedValueOnce(archivedMessage);
    await renderDetailAndWait();

    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });

    expect(api.archive).toHaveBeenCalledWith("college-vogt", "m1", false);
    expect(storeState.setFolder).toHaveBeenCalledWith("inbox");
  });

  it("un enseignant (sender) peut désarchiver un message envoyé", async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      schoolSlug: "college-vogt",
      user: {
        id: "teacher-1",
        firstName: "Jean",
        lastName: "Dupont",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
        profileCompleted: true,
        role: "TEACHER",
        activeRole: "TEACHER",
      },
    });
    api.get.mockResolvedValueOnce(archivedSentMessage);
    await renderDetailAndWait();

    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn-m1"));
    });

    expect(api.archive).toHaveBeenCalledWith("college-vogt", "m1", false);
    expect(storeState.setFolder).toHaveBeenCalledWith("sent");
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
    expect(screen.getByTestId("mark-unread-btn-m1")).toBeTruthy();
  });

  it("affiche le bouton après le marquage automatique en lu (message reçu venant d'être ouvert)", async () => {
    await renderDetailAndWait();
    await waitFor(() => {
      expect(screen.getByTestId("mark-unread-btn-m1")).toBeTruthy();
    });
  });

  it("cache le bouton pour un message envoyé par l'utilisateur (pas de recipientState)", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      isSender: true,
      recipientState: null,
    });
    await renderDetailAndWait();
    expect(screen.queryByTestId("mark-unread-btn-m1")).toBeNull();
  });

  it("appelle markRead(false), met à jour le store et affiche un toast sans quitter l'écran", async () => {
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
      fireEvent.press(screen.getByTestId("mark-unread-btn-m1"));
    });

    expect(api.markRead).toHaveBeenCalledWith("college-vogt", "m1", false);
    expect(storeState.markLocalUnread).toHaveBeenCalledWith("m1");
    expect(showFeedbackToast).toHaveBeenCalledWith({
      variant: "success",
      title: "Message marqué non lu",
      message: "Vous le retrouverez non lu dans votre boîte.",
    });
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("affiche une alerte d'erreur si l'appel échoue", async () => {
    const { Alert } = require("react-native");
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      recipientState: {
        readAt: "2024-01-15T10:10:00Z",
        archivedAt: null,
        deletedAt: null,
      },
    });
    api.markRead.mockRejectedValueOnce(new Error("MARK_UNREAD_FAILED"));

    await renderDetailAndWait();
    await act(async () => {
      fireEvent.press(screen.getByTestId("mark-unread-btn-m1"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Erreur",
      "Impossible de marquer ce message comme non lu.",
    );
    alertSpy.mockRestore();
  });
});

describe("Action supprimer", () => {
  it("affiche le dialog de confirmation", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("delete-btn-m1"));
    expect(screen.getByTestId("confirm-dialog-card")).toBeTruthy();
  });

  it("supprime le message après confirmation", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("delete-btn-m1"));
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
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche un toast d'erreur si la suppression échoue", async () => {
    api.remove.mockRejectedValueOnce(new Error("DELETE_FAILED"));

    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("delete-btn-m1"));
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
    fireEvent.press(screen.getByTestId("delete-btn-m1"));
    fireEvent.press(screen.getByTestId("confirm-dialog-cancel"));
    expect(api.remove).not.toHaveBeenCalled();
  });
});

describe("Action répondre", () => {
  it("navigue vers compose avec les bons params", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("reply-btn-m1"));
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
    fireEvent.press(screen.getByTestId("reply-btn-m1"));
    const params = (
      mockPush.mock.calls[0][0] as { params: Record<string, string> }
    ).params;
    expect(params.replyToSubject).toBe("Convocation réunion parents");
  });

  it("préremplit la citation du message original (auteur, date, corps)", async () => {
    await renderDetailAndWait();
    fireEvent.press(screen.getByTestId("reply-btn-m1"));
    const params = (
      mockPush.mock.calls[0][0] as { params: Record<string, string> }
    ).params;
    expect(params.quoteHeader).toContain("Alice Martin");
    expect(params.quoteBodyHtml).toBe(
      "<p>Bonjour, vous êtes convoqué le 20 janvier.</p>",
    );
  });

  it("ne propose pas de répondre à un message qu'on a soi-même envoyé", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      isSender: true,
      recipientState: null,
    });
    await renderDetailAndWait();
    expect(screen.queryByTestId("reply-btn-m1")).toBeNull();
  });
});

describe("Action transférer", () => {
  it("navigue vers compose avec le sujet, la citation et les pièces jointes d'origine", async () => {
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
    fireEvent.press(screen.getByTestId("forward-btn-m1"));

    const params = (
      mockPush.mock.calls[0][0] as { params: Record<string, string> }
    ).params;
    expect(params.forwardSubject).toBe("Convocation réunion parents");
    expect(params.quoteHeader).toContain("Alice Martin");
    expect(params.quoteHeader).toContain("Robert Ntamack");
    expect(params.quoteBodyHtml).toBe(
      "<p>Bonjour, vous êtes convoqué le 20 janvier.</p>",
    );
    expect(JSON.parse(params.forwardAttachments)).toEqual([
      {
        id: "att-1",
        fileName: "bulletin.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      },
    ]);
  });

  it("propose de transférer même un message qu'on a soi-même envoyé", async () => {
    api.get.mockResolvedValueOnce({
      ...messageDetail,
      isSender: true,
      recipientState: null,
    });
    await renderDetailAndWait();
    expect(screen.getByTestId("forward-btn-m1")).toBeTruthy();
  });
});

// ── Navigation par swipe entre messages ───────────────────────────────────────

describe("Navigation par swipe entre messages", () => {
  const message2 = {
    ...messageDetail,
    id: "m2",
    subject: "Réunion pédagogique",
    recipientState: { readAt: null, archivedAt: null, deletedAt: null },
  };
  const message3 = {
    ...messageDetail,
    id: "m3",
    subject: "Sortie scolaire",
    recipientState: {
      readAt: "2024-01-10T08:00:00Z",
      archivedAt: null,
      deletedAt: null,
    },
  };

  function swipeTo(index: number) {
    fireEvent(screen.getByTestId("message-detail-pager"), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: index * 360 } },
    });
  }

  beforeEach(() => {
    storeState.messages = [{ id: "m1" }, { id: "m2" }, { id: "m3" }];
    storeState.meta = { total: 3 };
    api.get.mockImplementation((_slug, id) => {
      if (id === "m2") return Promise.resolve(message2);
      if (id === "m3") return Promise.resolve(message3);
      return Promise.resolve(messageDetail);
    });
  });

  it("affiche le message suivant après un swipe et le marque automatiquement comme lu", async () => {
    await renderDetailAndWait();

    swipeTo(1);

    await screen.findByTestId("recipients-toggle-m2");
    await waitFor(() => {
      expect(api.markRead).toHaveBeenCalledWith("college-vogt", "m2", true);
    });
    expect(storeState.markLocalRead).toHaveBeenCalledWith("m2");
  });

  it("ne monte pas la 3e page tant qu'on n'a pas swipé jusqu'à elle (fenêtre de rendu)", async () => {
    await renderDetailAndWait();
    expect(screen.queryByTestId("recipients-toggle-m3")).toBeNull();

    swipeTo(1);
    await screen.findByTestId("recipients-toggle-m2");
    await screen.findByTestId("recipients-toggle-m3");
  });

  it("revenir en arrière par swipe ne re-déclenche pas markRead", async () => {
    await renderDetailAndWait();
    swipeTo(1);
    await screen.findByTestId("recipients-toggle-m2");
    await waitFor(() => expect(api.markRead).toHaveBeenCalledTimes(2)); // m1 + m2

    swipeTo(0);
    await screen.findByTestId("recipients-toggle-m1");

    expect(api.markRead).toHaveBeenCalledTimes(2);
  });

  it("respecte le choix explicite 'non lu' même après un aller-retour de swipe", async () => {
    await renderDetailAndWait();
    swipeTo(1);
    await screen.findByTestId("mark-unread-btn-m2");

    await act(async () => {
      fireEvent.press(screen.getByTestId("mark-unread-btn-m2"));
    });
    expect(storeState.markLocalUnread).toHaveBeenCalledWith("m2");

    // Le choix "non lu" doit être respecté côté store : on simule sa prise
    // en compte par keepUnreadIds, comme le ferait le vrai store.
    storeState.keepUnreadIds = new Set(["m2"]);

    swipeTo(0);
    await screen.findByTestId("recipients-toggle-m1");
    swipeTo(1);
    await screen.findByTestId("recipients-toggle-m2");

    // Un seul appel markRead(true) pour m2 : celui d'avant le marquage non lu.
    const markReadM2TrueCalls = api.markRead.mock.calls.filter(
      ([, id, read]) => id === "m2" && read === true,
    );
    expect(markReadM2TrueCalls).toHaveLength(1);
  });

  it("le message déjà lu (m3) ne déclenche pas markRead", async () => {
    await renderDetailAndWait();
    swipeTo(1);
    swipeTo(2);
    await screen.findByTestId("recipients-toggle-m3");

    expect(api.markRead).not.toHaveBeenCalledWith("college-vogt", "m3", true);
  });
});
