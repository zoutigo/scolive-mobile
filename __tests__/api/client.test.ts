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

    await expect(
      apiFetch("/schools/test/messages", {}, true),
    ).rejects.toMatchObject({
      message: "Votre session a expiré. Veuillez vous reconnecter.",
      statusCode: 401,
    });

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

  it("extrait le message texte d'un body NestJS string", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        message:
          "Only class referent teacher can manage timetable for this class",
        statusCode: 403,
      }),
    });

    await expect(
      apiFetch("/schools/test/timetable/slots/s1", {}, true),
    ).rejects.toMatchObject({
      message:
        "Only class referent teacher can manage timetable for this class",
      statusCode: 403,
    });
  });

  it("joint les messages d'un tableau (NestJS class-validator)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: ["startMinute must be a number", "endMinute must be a number"],
        statusCode: 400,
      }),
    });

    await expect(
      apiFetch("/schools/test/timetable/slots", {}, true),
    ).rejects.toMatchObject({
      message: "startMinute must be a number, endMinute must be a number",
      statusCode: 400,
    });
  });

  it("retourne un message générique 403 si body vide", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    });

    await expect(
      apiFetch("/schools/test/slots", {}, true),
    ).rejects.toMatchObject({
      message: "Vous n'avez pas les droits pour effectuer cette action.",
      statusCode: 403,
    });
  });

  it("retourne un message générique 404 si body vide", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    await expect(
      apiFetch("/schools/test/unknown", {}, true),
    ).rejects.toMatchObject({
      message: "Ressource introuvable.",
      statusCode: 404,
    });
  });

  it("retourne un message générique 409 si body vide", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({}),
    });

    await expect(
      apiFetch("/schools/test/duplicate", {}, true),
    ).rejects.toMatchObject({
      message: expect.stringContaining("Conflit"),
      statusCode: 409,
    });
  });

  it("retourne un message générique avec code HTTP pour les autres erreurs", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(
      apiFetch("/schools/test/crash", {}, true),
    ).rejects.toMatchObject({
      message: "Erreur serveur (500).",
      statusCode: 500,
    });
  });
});
