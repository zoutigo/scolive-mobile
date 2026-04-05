/**
 * Tests unitaires — messaging.api.ts
 * Vérifie la construction des URLs, méthodes HTTP, corps des requêtes
 * et la normalisation des URLs médias (localhost → 10.0.2.2).
 */
import { messagingApi } from "../../src/api/messaging.api";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("test-token"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

let xhrScenario = {
  status: 204,
  responseText: "",
  networkError: false,
};
const mockXhrOpen = jest.fn();
const mockXhrSetRequestHeader = jest.fn();
const mockXhrSend = jest.fn(function send(this: {
  onload?: () => void;
  onerror?: () => void;
  status: number;
  response: string;
  responseText: string;
}) {
  if (xhrScenario.networkError) {
    this.onerror?.();
    return;
  }

  this.status = xhrScenario.status;
  this.response = xhrScenario.responseText;
  this.responseText = xhrScenario.responseText;
  this.onload?.();
});

global.XMLHttpRequest = jest.fn(() => ({
  open: mockXhrOpen,
  setRequestHeader: mockXhrSetRequestHeader,
  send: mockXhrSend,
  status: 0,
  response: "",
  responseText: "",
  onload: undefined,
  onerror: undefined,
})) as unknown as typeof XMLHttpRequest;

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

function errorResponse(status: number, message = "Error") {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(JSON.stringify({ message })),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001/api";
  xhrScenario = {
    status: 204,
    responseText: "",
    networkError: false,
  };
});

// ── list() ────────────────────────────────────────────────────────────────────

describe("messagingApi.list()", () => {
  const mockResponse = {
    items: [],
    meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
  };

  it("appelle GET /schools/:slug/messages avec le bon dossier", async () => {
    mockFetch.mockResolvedValueOnce(okJson(mockResponse));
    await messagingApi.list("college-vogt", { folder: "inbox" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/schools/college-vogt/messages"),
      expect.any(Object),
    );
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("folder=inbox");
  });

  it("inclut le paramètre q si search fourni", async () => {
    mockFetch.mockResolvedValueOnce(okJson(mockResponse));
    await messagingApi.list("college-vogt", { folder: "inbox", q: "bulletin" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("q=bulletin");
  });

  it("inclut page et limit dans l'URL", async () => {
    mockFetch.mockResolvedValueOnce(okJson(mockResponse));
    await messagingApi.list("college-vogt", {
      folder: "sent",
      page: 2,
      limit: 10,
    });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
  });

  it("retourne les items et la meta", async () => {
    const response = {
      items: [{ id: "m1", subject: "Test", attachments: [] }],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    };
    mockFetch.mockResolvedValueOnce(okJson(response));
    const result = await messagingApi.list("college-vogt", { folder: "inbox" });
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it("normalise les URLs des pièces jointes dans la liste", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        items: [
          {
            id: "m1",
            attachments: [
              {
                id: "att-1",
                fileName: "bulletin.pdf",
                url: "http://localhost:9000/media/bulletin.pdf",
                mimeType: "application/pdf",
                sizeBytes: 1234,
              },
            ],
          },
        ],
        meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
      }),
    );

    const result = await messagingApi.list("college-vogt", { folder: "inbox" });
    expect(result.items[0].attachments[0].url).toBe(
      "http://10.0.2.2:9000/media/bulletin.pdf",
    );
  });

  it("ajoute le token d'authentification", async () => {
    mockFetch.mockResolvedValueOnce(okJson(mockResponse));
    await messagingApi.list("college-vogt", { folder: "inbox" });
    const options = mockFetch.mock.calls[0][1];
    expect(options.headers?.Authorization).toBe("Bearer test-token");
  });
});

// ── get() ─────────────────────────────────────────────────────────────────────

describe("messagingApi.get()", () => {
  it("appelle GET /schools/:slug/messages/:id", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ id: "m1", subject: "Test" }));
    await messagingApi.get("college-vogt", "m1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/schools/college-vogt/messages/m1"),
      expect.any(Object),
    );
  });

  it("retourne les détails du message", async () => {
    const detail = {
      id: "m1",
      subject: "Test",
      body: "<p>Hello</p>",
      attachments: [],
    };
    mockFetch.mockResolvedValueOnce(okJson(detail));
    const result = await messagingApi.get("college-vogt", "m1");
    expect(result.subject).toBe("Test");
  });

  it("normalise les URLs des pièces jointes du détail", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        id: "m1",
        subject: "Test",
        body: "<p>Hello</p>",
        attachments: [
          {
            id: "att-1",
            fileName: "bulletin.pdf",
            url: "http://localhost:9000/media/bulletin.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1234,
          },
        ],
      }),
    );
    const result = await messagingApi.get("college-vogt", "m1");
    expect(result.attachments[0].url).toBe(
      "http://10.0.2.2:9000/media/bulletin.pdf",
    );
  });
});

// ── unreadCount() ─────────────────────────────────────────────────────────────

describe("messagingApi.unreadCount()", () => {
  it("appelle GET .../unread-count", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ unread: 5 }));
    await messagingApi.unreadCount("college-vogt");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("unread-count"),
      expect.any(Object),
    );
  });

  it("retourne le nombre de non-lus", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ unread: 12 }));
    const count = await messagingApi.unreadCount("college-vogt");
    expect(count).toBe(12);
  });
});

// ── send() ────────────────────────────────────────────────────────────────────

describe("messagingApi.send()", () => {
  it("appelle POST /schools/:slug/messages", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.send("college-vogt", {
      subject: "Test",
      body: "<p>Bonjour</p>",
      recipientUserIds: ["u1", "u2"],
    });
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/schools/college-vogt/messages");
    expect(options.method).toBe("POST");
  });

  it("envoie le payload en multipart/form-data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.send("college-vogt", {
      subject: "Bulletin trimestriel",
      body: "<p>Veuillez trouver ci-joint</p>",
      recipientUserIds: ["user-1"],
      attachments: [
        {
          uri: "file:///tmp/bulletin.pdf",
          name: "bulletin.pdf",
          mimeType: "application/pdf",
        },
      ],
    });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeInstanceOf(FormData);
    const formData = options.body as FormData;
    expect(formData.get("subject")).toBe("Bulletin trimestriel");
    expect(formData.get("body")).toBe("<p>Veuillez trouver ci-joint</p>");
    expect(formData.getAll("recipientUserIds")).toEqual(["user-1"]);
    expect(formData.getAll("attachments")).toHaveLength(1);
  });

  it("inclut isDraft=true pour enregistrer un brouillon", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.send("college-vogt", {
      subject: "Brouillon sans objet",
      body: "<p>&nbsp;</p>",
      recipientUserIds: [],
      isDraft: true,
    });
    const [, options] = mockFetch.mock.calls[0];
    const formData = options.body as FormData;
    expect(formData.get("isDraft")).toBe("true");
  });

  it("retente via XMLHttpRequest quand fetch échoue au niveau réseau", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));

    await messagingApi.send("college-vogt", {
      subject: "Test",
      body: "<p>Bonjour</p>",
      recipientUserIds: ["u1"],
    });

    expect(global.XMLHttpRequest).toHaveBeenCalledTimes(1);
    expect(mockXhrOpen).toHaveBeenCalledWith(
      "POST",
      "http://10.0.2.2:3001/api/schools/college-vogt/messages",
    );
    expect(mockXhrSetRequestHeader).toHaveBeenCalledWith(
      "Authorization",
      "Bearer test-token",
    );
    expect(mockXhrSend).toHaveBeenCalledWith(expect.any(FormData));
  });
});

// ── markRead() ────────────────────────────────────────────────────────────────

describe("messagingApi.markRead()", () => {
  it("appelle PATCH .../read avec read=true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.markRead("college-vogt", "m1", true);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/messages/m1/read");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ read: true });
  });

  it("appelle PATCH .../read avec read=false pour marquer non-lu", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.markRead("college-vogt", "m1", false);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      read: false,
    });
  });
});

// ── archive() ─────────────────────────────────────────────────────────────────

describe("messagingApi.archive()", () => {
  it("appelle PATCH .../archive avec archived=true", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.archive("college-vogt", "m1", true);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/messages/m1/archive");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ archived: true });
  });

  it("appelle PATCH .../archive avec archived=false pour désarchiver", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.archive("college-vogt", "m1", false);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      archived: false,
    });
  });
});

// ── remove() ─────────────────────────────────────────────────────────────────

describe("messagingApi.remove()", () => {
  it("appelle DELETE /schools/:slug/messages/:id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });
    await messagingApi.remove("college-vogt", "m1");
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/schools/college-vogt/messages/m1");
    expect(options.method).toBe("DELETE");
  });
});

// ── getRecipients() ───────────────────────────────────────────────────────────

describe("messagingApi.getRecipients()", () => {
  it("appelle GET /schools/:slug/messaging/recipients", async () => {
    const data = { teachers: [], staffFunctions: [], staffPeople: [] };
    mockFetch.mockResolvedValueOnce(okJson(data));
    await messagingApi.getRecipients("college-vogt");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/schools/college-vogt/messaging/recipients"),
      expect.any(Object),
    );
  });
});

// ── uploadInlineImage() — normalisation URL ───────────────────────────────────

describe("messagingApi.uploadInlineImage()", () => {
  it("remplace localhost par l'hôte API (10.0.2.2) dans l'URL retournée", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({ url: "http://localhost:9000/school-live-media/img.jpg" }),
    );
    const url = await messagingApi.uploadInlineImage(
      "college-vogt",
      "file:///tmp/photo.jpg",
      "image/jpeg",
      "photo.jpg",
    );
    expect(url).toBe("http://10.0.2.2:9000/school-live-media/img.jpg");
    expect(url).not.toContain("localhost");
  });

  it("ne modifie pas une URL déjà absolue (production)", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({ url: "https://media.scolive.cm/school-live-media/img.jpg" }),
    );
    const url = await messagingApi.uploadInlineImage(
      "college-vogt",
      "file:///tmp/photo.jpg",
      "image/jpeg",
      "photo.jpg",
    );
    expect(url).toBe("https://media.scolive.cm/school-live-media/img.jpg");
  });

  it("utilise FormData avec le champ 'file'", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({ url: "http://localhost:9000/img.jpg" }),
    );
    await messagingApi.uploadInlineImage(
      "college-vogt",
      "file:///tmp/photo.jpg",
      "image/jpeg",
      "photo.jpg",
    );
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("lance une erreur si le serveur répond avec une erreur", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(400, "Type invalide"));
    await expect(
      messagingApi.uploadInlineImage(
        "college-vogt",
        "file:///tmp/doc.pdf",
        "application/pdf",
        "doc.pdf",
      ),
    ).rejects.toThrow("Type invalide");
  });
});
