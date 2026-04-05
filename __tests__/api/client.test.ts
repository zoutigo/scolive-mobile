import { apiFetch, tokenStorage } from "../../src/api/client";
import { registerSessionExpiredHandler } from "../../src/auth/session-events";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("apiFetch()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registerSessionExpiredHandler(null);
    jest.spyOn(tokenStorage, "getAccessToken").mockResolvedValue("token-123");
  });

  it("notifies the global session handler on authenticated 401 responses", async () => {
    const onExpired = jest.fn().mockResolvedValue(undefined);
    registerSessionExpiredHandler(onExpired);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      }),
    });

    await expect(apiFetch("/schools/test/messages", {}, true)).rejects.toMatchObject(
      {
        message: "Votre session a expiré. Veuillez vous reconnecter.",
        statusCode: 401,
      },
    );

    expect(onExpired).toHaveBeenCalledWith({
      message: "Votre session a expiré. Veuillez vous reconnecter.",
      statusCode: 401,
    });
  });

  it("does not notify the session handler for unauthenticated requests", async () => {
    const onExpired = jest.fn().mockResolvedValue(undefined);
    registerSessionExpiredHandler(onExpired);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    });

    await expect(apiFetch("/auth/login", {}, false)).rejects.toMatchObject({
      message: "Unauthorized",
      statusCode: 401,
    });

    expect(onExpired).not.toHaveBeenCalled();
  });
});
