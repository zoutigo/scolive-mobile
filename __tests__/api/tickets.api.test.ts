import { ticketsApi } from "../../src/api/tickets.api";
import { apiFetch, tokenStorage } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
  tokenStorage: { getAccessToken: jest.fn() },
  BASE_URL: "http://10.0.2.2:3001/api",
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockGetToken = tokenStorage.getAccessToken as jest.MockedFunction<
  typeof tokenStorage.getAccessToken
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue("test-token");
});

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

describe("ticketsApi.list()", () => {
  it("appelle /tickets sans paramètre", async () => {
    const payload = {
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
    mockApiFetch.mockResolvedValue(payload);

    await ticketsApi.list();

    expect(mockApiFetch).toHaveBeenCalledWith("/tickets", {}, true);
  });

  it("ajoute les query params de filtrage", async () => {
    mockApiFetch.mockResolvedValue({ data: [], meta: {} });

    await ticketsApi.list({
      page: 2,
      limit: 10,
      status: "OPEN",
      type: "BUG",
      q: "crash",
    });

    const url = (mockApiFetch.mock.calls[0] as unknown[])[0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
    expect(url).toContain("status=OPEN");
    expect(url).toContain("type=BUG");
    expect(url).toContain("q=crash");
  });

  it("retourne les données du serveur", async () => {
    const payload = {
      data: [{ id: "t1", title: "Bug login", type: "BUG", status: "OPEN" }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    mockApiFetch.mockResolvedValue(payload);

    const result = await ticketsApi.list();

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// get
// ---------------------------------------------------------------------------

describe("ticketsApi.get()", () => {
  it("appelle /tickets/:id", async () => {
    const ticket = { id: "t1", title: "Bug login", responses: [] };
    mockApiFetch.mockResolvedValue(ticket);

    const result = await ticketsApi.get("t1");

    expect(mockApiFetch).toHaveBeenCalledWith("/tickets/t1", {}, true);
    expect(result).toEqual(ticket);
  });
});

// ---------------------------------------------------------------------------
// create (multipart)
// ---------------------------------------------------------------------------

describe("ticketsApi.create()", () => {
  it("envoie un FormData multipart avec les champs requis", async () => {
    mockGetToken.mockResolvedValue("tok");
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: "t2" }),
      text: async () => '{"id":"t2"}',
    });

    const result = await ticketsApi.create({
      type: "BUG",
      title: "Interface plantée",
      description: "Le bouton enregistrer ne répond pas depuis hier.",
      schoolSlug: "lycee-test",
      platform: "mobile",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://10.0.2.2:3001/api/tickets",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
        body: expect.any(FormData),
      }),
    );
    expect(result).toEqual({ id: "t2" });
  });

  it("lève une erreur si le serveur retourne une erreur", async () => {
    mockGetToken.mockResolvedValue("tok");
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Titre trop court" }),
      text: async () => '{"message":"Titre trop court"}',
    });

    await expect(
      ticketsApi.create({
        type: "BUG",
        title: "Ab",
        description: "Trop court.",
      }),
    ).rejects.toThrow("Titre trop court");
  });

  it("lève une erreur générique si pas de message serveur", async () => {
    mockGetToken.mockResolvedValue("tok");
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => "",
    });

    await expect(
      ticketsApi.create({
        type: "BUG",
        title: "Test",
        description: "Desc longue.",
      }),
    ).rejects.toThrow("Impossible de créer le ticket");
  });
});

// ---------------------------------------------------------------------------
// updateStatus
// ---------------------------------------------------------------------------

describe("ticketsApi.updateStatus()", () => {
  it("appelle PATCH /tickets/:id/status", async () => {
    mockApiFetch.mockResolvedValue({ id: "t1", status: "IN_PROGRESS" });

    await ticketsApi.updateStatus("t1", "IN_PROGRESS");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/tickets/t1/status",
      { method: "PATCH", body: JSON.stringify({ status: "IN_PROGRESS" }) },
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// addResponse
// ---------------------------------------------------------------------------

describe("ticketsApi.addResponse()", () => {
  it("envoie la réponse externe par défaut", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await ticketsApi.addResponse("t1", "Problème identifié.");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/tickets/t1/responses",
      {
        method: "POST",
        body: JSON.stringify({
          body: "Problème identifié.",
          isInternal: false,
        }),
      },
      true,
    );
  });

  it("envoie une note interne quand isInternal=true", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await ticketsApi.addResponse("t1", "Note interne.", true);

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/tickets/t1/responses",
      {
        method: "POST",
        body: JSON.stringify({ body: "Note interne.", isInternal: true }),
      },
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// toggleVote
// ---------------------------------------------------------------------------

describe("ticketsApi.toggleVote()", () => {
  it("appelle POST /tickets/:id/votes et retourne { voted }", async () => {
    mockApiFetch.mockResolvedValue({ voted: true });

    const result = await ticketsApi.toggleVote("t1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/tickets/t1/votes",
      { method: "POST" },
      true,
    );
    expect(result).toEqual({ voted: true });
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------

describe("ticketsApi.remove()", () => {
  it("appelle DELETE /tickets/:id", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await ticketsApi.remove("t1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/tickets/t1",
      { method: "DELETE" },
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// myCount
// ---------------------------------------------------------------------------

describe("ticketsApi.myCount()", () => {
  it("retourne le compteur de tickets ouverts", async () => {
    mockApiFetch.mockResolvedValue({ open: 3 });

    const result = await ticketsApi.myCount();

    expect(mockApiFetch).toHaveBeenCalledWith("/tickets/my-count", {}, true);
    expect(result).toEqual({ open: 3 });
  });
});
