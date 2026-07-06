/**
 * Tests unitaires — messaging-client.ts
 * Vérifie que getMessagingClient() route vers messagingApi (schoolSlug réel)
 * ou vers adminMessagingApi (PLATFORM_SCOPE), sans jamais mélanger les deux.
 */
import {
  getMessagingClient,
  PLATFORM_SCOPE,
} from "../../src/api/messaging-client";
import { messagingApi } from "../../src/api/messaging.api";
import { adminMessagingApi } from "../../src/api/admin-messaging.api";

jest.mock("../../src/api/messaging.api");
jest.mock("../../src/api/admin-messaging.api");

const api = messagingApi as jest.Mocked<typeof messagingApi>;
const adminApi = adminMessagingApi as jest.Mocked<typeof adminMessagingApi>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getMessagingClient(schoolSlug)", () => {
  const client = getMessagingClient("college-vogt");

  it("list() délègue à messagingApi.list(schoolSlug, params)", async () => {
    api.list.mockResolvedValueOnce({
      items: [],
      meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    await client.list({ folder: "inbox" });
    expect(api.list).toHaveBeenCalledWith("college-vogt", { folder: "inbox" });
  });

  it("get() délègue à messagingApi.get(schoolSlug, id)", async () => {
    await client.get("msg-1");
    expect(api.get).toHaveBeenCalledWith("college-vogt", "msg-1");
  });

  it("expose getRecipients mais pas searchRecipients", () => {
    expect(client.getRecipients).toBeDefined();
    expect(client.searchRecipients).toBeUndefined();
  });

  it("n'appelle jamais adminMessagingApi", async () => {
    await client.get("msg-1");
    expect(adminApi.get).not.toHaveBeenCalled();
  });
});

describe("getMessagingClient(PLATFORM_SCOPE)", () => {
  const client = getMessagingClient(PLATFORM_SCOPE);

  it("list() délègue à adminMessagingApi.list(params) sans schoolSlug", async () => {
    adminApi.list.mockResolvedValueOnce({
      items: [],
      meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    await client.list({ folder: "inbox" });
    expect(adminApi.list).toHaveBeenCalledWith({ folder: "inbox" });
  });

  it("get() délègue à adminMessagingApi.get(id)", async () => {
    await client.get("msg-1");
    expect(adminApi.get).toHaveBeenCalledWith("msg-1");
  });

  it("expose searchRecipients mais pas getRecipients", () => {
    expect(client.searchRecipients).toBeDefined();
    expect(client.getRecipients).toBeUndefined();
  });

  it("n'appelle jamais messagingApi", async () => {
    await client.get("msg-1");
    expect(api.get).not.toHaveBeenCalled();
  });
});
