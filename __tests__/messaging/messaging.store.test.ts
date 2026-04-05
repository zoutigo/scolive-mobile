/**
 * Tests unitaires — messaging.store.ts
 * Vérifie les transitions d'état du store Zustand.
 */
import { useMessagingStore } from "../../src/store/messaging.store";
import { messagingApi } from "../../src/api/messaging.api";

jest.mock("../../src/api/messaging.api");

const api = messagingApi as jest.Mocked<typeof messagingApi>;

const metaPage1 = { page: 1, limit: 25, total: 50, totalPages: 2 };
const metaPage2 = { page: 2, limit: 25, total: 50, totalPages: 2 };

const message1 = {
  id: "m1",
  folder: "inbox" as const,
  status: "SENT" as const,
  subject: "Bonjour",
  preview: "Texte du message",
  createdAt: "2024-01-15T10:00:00Z",
  sentAt: "2024-01-15T10:00:00Z",
  unread: true,
  sender: { id: "u1", firstName: "Alice", lastName: "Martin" },
  recipientsCount: 1,
  mailboxEntryId: "me1",
  attachments: [],
};

const message2 = { ...message1, id: "m2", subject: "Deuxième" };

beforeEach(() => {
  jest.clearAllMocks();
  useMessagingStore.setState({
    folder: "inbox",
    messages: [],
    meta: null,
    isLoading: false,
    isRefreshing: false,
    search: "",
    unreadCount: 0,
  });
});

// ── setFolder ────────────────────────────────────────────────────────────────

describe("setFolder()", () => {
  it("change le dossier actif", () => {
    useMessagingStore.getState().setFolder("sent");
    expect(useMessagingStore.getState().folder).toBe("sent");
  });

  it("vide la liste de messages", () => {
    useMessagingStore.setState({ messages: [message1] });
    useMessagingStore.getState().setFolder("archive");
    expect(useMessagingStore.getState().messages).toHaveLength(0);
  });

  it("réinitialise la meta", () => {
    useMessagingStore.setState({ meta: metaPage1 });
    useMessagingStore.getState().setFolder("drafts");
    expect(useMessagingStore.getState().meta).toBeNull();
  });

  it("réinitialise la recherche", () => {
    useMessagingStore.setState({ search: "bulletin" });
    useMessagingStore.getState().setFolder("inbox");
    expect(useMessagingStore.getState().search).toBe("");
  });
});

// ── setSearch ────────────────────────────────────────────────────────────────

describe("setSearch()", () => {
  it("met à jour le terme de recherche", () => {
    useMessagingStore.getState().setSearch("convocation");
    expect(useMessagingStore.getState().search).toBe("convocation");
  });

  it("vide les messages pour forcer un rechargement", () => {
    useMessagingStore.setState({ messages: [message1] });
    useMessagingStore.getState().setSearch("test");
    expect(useMessagingStore.getState().messages).toHaveLength(0);
  });
});

// ── loadMessages ─────────────────────────────────────────────────────────────

describe("loadMessages()", () => {
  it("charge les messages et met à jour l'état", async () => {
    api.list.mockResolvedValueOnce({ items: [message1], meta: metaPage1 });
    await useMessagingStore.getState().loadMessages("college-vogt");
    const state = useMessagingStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].id).toBe("m1");
    expect(state.meta).toEqual(metaPage1);
    expect(state.isLoading).toBe(false);
  });

  it("appelle list() avec le bon dossier et la recherche", async () => {
    useMessagingStore.setState({ folder: "sent", search: "bulletin" });
    api.list.mockResolvedValueOnce({ items: [], meta: metaPage1 });
    await useMessagingStore.getState().loadMessages("college-vogt");
    expect(api.list).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ folder: "sent", q: "bulletin" }),
    );
  });

  it("réinitialise isLoading à false même si l'API échoue", async () => {
    api.list.mockRejectedValueOnce(new Error("réseau"));
    await useMessagingStore
      .getState()
      .loadMessages("college-vogt")
      .catch(() => {});
    expect(useMessagingStore.getState().isLoading).toBe(false);
  });

  it("passe q=undefined si la recherche est vide", async () => {
    api.list.mockResolvedValueOnce({ items: [], meta: metaPage1 });
    await useMessagingStore.getState().loadMessages("college-vogt");
    const callParams = api.list.mock.calls[0][1];
    expect(callParams.q).toBeUndefined();
  });
});

// ── refreshMessages ───────────────────────────────────────────────────────────

describe("refreshMessages()", () => {
  it("utilise isRefreshing (pas isLoading)", async () => {
    let refreshingDuring = false;
    api.list.mockImplementationOnce(async () => {
      refreshingDuring = useMessagingStore.getState().isRefreshing;
      return { items: [], meta: metaPage1 };
    });
    await useMessagingStore.getState().refreshMessages("college-vogt");
    expect(refreshingDuring).toBe(true);
    expect(useMessagingStore.getState().isRefreshing).toBe(false);
  });

  it("remplace les messages (pas d'ajout)", async () => {
    useMessagingStore.setState({ messages: [message1] });
    api.list.mockResolvedValueOnce({ items: [message2], meta: metaPage1 });
    await useMessagingStore.getState().refreshMessages("college-vogt");
    expect(useMessagingStore.getState().messages).toHaveLength(1);
    expect(useMessagingStore.getState().messages[0].id).toBe("m2");
  });
});

// ── loadMoreMessages ──────────────────────────────────────────────────────────

describe("loadMoreMessages()", () => {
  it("ajoute les messages à la liste existante", async () => {
    useMessagingStore.setState({ messages: [message1], meta: metaPage1 });
    api.list.mockResolvedValueOnce({ items: [message2], meta: metaPage2 });
    await useMessagingStore.getState().loadMoreMessages("college-vogt");
    expect(useMessagingStore.getState().messages).toHaveLength(2);
  });

  it("ne charge pas si déjà au bout de la liste", async () => {
    const fullMeta = { page: 1, limit: 25, total: 1, totalPages: 1 };
    useMessagingStore.setState({ messages: [message1], meta: fullMeta });
    await useMessagingStore.getState().loadMoreMessages("college-vogt");
    expect(api.list).not.toHaveBeenCalled();
  });

  it("ne charge pas si meta est null", async () => {
    useMessagingStore.setState({ messages: [], meta: null });
    await useMessagingStore.getState().loadMoreMessages("college-vogt");
    expect(api.list).not.toHaveBeenCalled();
  });
});

// ── loadUnreadCount ───────────────────────────────────────────────────────────

describe("loadUnreadCount()", () => {
  it("met à jour unreadCount", async () => {
    api.unreadCount.mockResolvedValueOnce(7);
    await useMessagingStore.getState().loadUnreadCount("college-vogt");
    expect(useMessagingStore.getState().unreadCount).toBe(7);
  });

  it("ignore les erreurs silencieusement", async () => {
    api.unreadCount.mockRejectedValueOnce(new Error("réseau"));
    await useMessagingStore.getState().loadUnreadCount("college-vogt");
    expect(useMessagingStore.getState().unreadCount).toBe(0);
  });
});

// ── markLocalRead ─────────────────────────────────────────────────────────────

describe("markLocalRead()", () => {
  it("passe unread=false sur le message ciblé", () => {
    useMessagingStore.setState({ messages: [message1], unreadCount: 3 });
    useMessagingStore.getState().markLocalRead("m1");
    expect(useMessagingStore.getState().messages[0].unread).toBe(false);
  });

  it("décrémente unreadCount", () => {
    useMessagingStore.setState({ messages: [message1], unreadCount: 3 });
    useMessagingStore.getState().markLocalRead("m1");
    expect(useMessagingStore.getState().unreadCount).toBe(2);
  });

  it("ne passe pas unreadCount en dessous de 0", () => {
    useMessagingStore.setState({ messages: [message1], unreadCount: 0 });
    useMessagingStore.getState().markLocalRead("m1");
    expect(useMessagingStore.getState().unreadCount).toBe(0);
  });
});

// ── markLocalUnread ───────────────────────────────────────────────────────────

describe("markLocalUnread()", () => {
  it("passe unread=true sur le message ciblé", () => {
    useMessagingStore.setState({
      messages: [{ ...message1, unread: false }],
      unreadCount: 0,
    });
    useMessagingStore.getState().markLocalUnread("m1");
    expect(useMessagingStore.getState().messages[0].unread).toBe(true);
  });

  it("incrémente unreadCount quand le message était lu", () => {
    useMessagingStore.setState({
      messages: [{ ...message1, unread: false }],
      unreadCount: 2,
    });
    useMessagingStore.getState().markLocalUnread("m1");
    expect(useMessagingStore.getState().unreadCount).toBe(3);
  });

  it("n'incrémente pas unreadCount si le message est déjà non lu", () => {
    useMessagingStore.setState({ messages: [message1], unreadCount: 2 });
    useMessagingStore.getState().markLocalUnread("m1");
    expect(useMessagingStore.getState().unreadCount).toBe(2);
  });
});

// ── removeLocal ───────────────────────────────────────────────────────────────

describe("removeLocal()", () => {
  it("supprime le message de la liste", () => {
    useMessagingStore.setState({ messages: [message1, message2] });
    useMessagingStore.getState().removeLocal("m1");
    expect(useMessagingStore.getState().messages).toHaveLength(1);
    expect(useMessagingStore.getState().messages[0].id).toBe("m2");
  });

  it("ne fait rien si l'id n'existe pas", () => {
    useMessagingStore.setState({ messages: [message1] });
    useMessagingStore.getState().removeLocal("inexistant");
    expect(useMessagingStore.getState().messages).toHaveLength(1);
  });
});

// ── reset ─────────────────────────────────────────────────────────────────────

describe("reset()", () => {
  it("réinitialise tout l'état", () => {
    useMessagingStore.setState({
      folder: "archive",
      messages: [message1],
      meta: metaPage1,
      search: "test",
      unreadCount: 5,
    });
    useMessagingStore.getState().reset();
    const state = useMessagingStore.getState();
    expect(state.folder).toBe("inbox");
    expect(state.messages).toHaveLength(0);
    expect(state.meta).toBeNull();
    expect(state.search).toBe("");
    expect(state.unreadCount).toBe(0);
  });
});
