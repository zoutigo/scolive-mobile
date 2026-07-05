/**
 * Tests unitaires — admin-messaging.api.ts
 * Vérifie que les appels ciblent bien /admin/messages (sans schoolSlug),
 * et que la recherche de destinataires plateforme mappe correctement
 * /system/users vers des RecipientOption.
 */
import { adminMessagingApi } from "../../src/api/admin-messaging.api";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("test-token"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001/api";
});

describe("adminMessagingApi.list()", () => {
  it("appelle GET /admin/messages sans schoolSlug dans l'URL", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        items: [],
        meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
      }),
    );

    await adminMessagingApi.list({ folder: "inbox" });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/admin/messages?folder=inbox");
    expect(url).not.toContain("/schools/");
  });
});

describe("adminMessagingApi.unreadCount()", () => {
  it("appelle GET /admin/messages/unread-count", async () => {
    mockFetch.mockReturnValueOnce(okJson({ unread: 4 }));
    const result = await adminMessagingApi.unreadCount();

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/admin/messages/unread-count",
    );
    expect(result).toBe(4);
  });
});

describe("adminMessagingApi.get()", () => {
  it("appelle GET /admin/messages/:id", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        id: "msg-1",
        subject: "Sujet",
        body: "<p>Bonjour</p>",
        status: "SENT",
        createdAt: "2026-01-01T00:00:00Z",
        sentAt: "2026-01-01T00:00:00Z",
        senderArchivedAt: null,
        isSender: false,
        recipientState: null,
        sender: { id: "u-1", firstName: "A", lastName: "B" },
        school: { slug: "ecole-a", name: "École A" },
        recipients: [],
        attachments: [],
      }),
    );

    const result = await adminMessagingApi.get("msg-1");

    expect(mockFetch.mock.calls[0][0]).toBe(
      "http://10.0.2.2:3001/api/admin/messages/msg-1",
    );
    expect(result.school).toEqual({ slug: "ecole-a", name: "École A" });
  });
});

describe("adminMessagingApi.markRead() / archive() / remove()", () => {
  it("PATCH .../read sans schoolSlug", async () => {
    mockFetch.mockReturnValueOnce(okJson({ success: true }));
    await adminMessagingApi.markRead("msg-1", true);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://10.0.2.2:3001/api/admin/messages/msg-1/read");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(init!.body as string)).toEqual({ read: true });
  });

  it("PATCH .../archive sans schoolSlug", async () => {
    mockFetch.mockReturnValueOnce(okJson({ success: true }));
    await adminMessagingApi.archive("msg-1", false);

    expect(mockFetch.mock.calls[0][0]).toBe(
      "http://10.0.2.2:3001/api/admin/messages/msg-1/archive",
    );
  });

  it("DELETE /admin/messages/:id", async () => {
    mockFetch.mockReturnValueOnce(okJson({ success: true }));
    await adminMessagingApi.remove("msg-1");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://10.0.2.2:3001/api/admin/messages/msg-1");
    expect(init?.method).toBe("DELETE");
  });
});

describe("adminMessagingApi.searchRecipients()", () => {
  it("appelle /system/users?search= et mappe les résultats en RecipientOption", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        items: [
          {
            id: "u-directeur-a",
            firstName: "Prisca",
            lastName: "Directeur",
            email: "prisca@ecole-a.cm",
            school: { slug: "ecole-a", name: "École A" },
          },
        ],
      }),
    );

    const results = await adminMessagingApi.searchRecipients("prisca");

    expect(mockFetch.mock.calls[0][0]).toContain("/system/users?search=prisca");
    expect(results).toEqual([
      {
        value: "u-directeur-a",
        label: "Directeur Prisca",
        email: "prisca@ecole-a.cm",
        subtitle: "École A",
        schoolSlug: "ecole-a",
      },
    ]);
  });

  it("retourne schoolSlug=null quand le destinataire n'a aucune école (autre admin plateforme)", async () => {
    mockFetch.mockReturnValueOnce(
      okJson({
        items: [
          {
            id: "u-admin-2",
            firstName: "Root",
            lastName: "Admin",
            email: "root@scolive.cm",
            school: null,
          },
        ],
      }),
    );

    const results = await adminMessagingApi.searchRecipients("root");
    expect(results[0].schoolSlug).toBeNull();
  });
});
