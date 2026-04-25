import { useTicketsStore } from "../../src/store/tickets.store";
import { ticketsApi } from "../../src/api/tickets.api";

jest.mock("../../src/api/tickets.api");

const api = ticketsApi as jest.Mocked<typeof ticketsApi>;

function makeTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    type: "BUG" as const,
    status: "OPEN" as const,
    title: "Bug carte notes",
    description: "La carte des notes disparaît après rechargement.",
    platform: "mobile",
    author: {
      id: "u1",
      firstName: "Jean",
      lastName: "D",
      email: null,
      avatarUrl: null,
    },
    school: null,
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    _count: { votes: 0, responses: 0 },
    ...overrides,
  };
}

function resetStore() {
  useTicketsStore.getState().reset();
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ---------------------------------------------------------------------------
// loadTickets
// ---------------------------------------------------------------------------

describe("loadTickets()", () => {
  it("charge les tickets et les stocke", async () => {
    const ticket = makeTicket();
    api.list.mockResolvedValue({
      data: [ticket],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    await useTicketsStore.getState().loadTickets();

    const state = useTicketsStore.getState();
    expect(state.tickets).toHaveLength(1);
    expect(state.tickets[0].id).toBe("t1");
    expect(state.meta?.total).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it("remet isLoading à false même en cas d'erreur", async () => {
    api.list.mockRejectedValue(new Error("Network error"));

    await expect(useTicketsStore.getState().loadTickets()).rejects.toThrow();

    expect(useTicketsStore.getState().isLoading).toBe(false);
  });

  it("passe les filtres actifs à l'API", async () => {
    api.list.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
    useTicketsStore.getState().setFilterStatus("OPEN");
    useTicketsStore.getState().setFilterType("BUG");

    await useTicketsStore.getState().loadTickets();

    expect(api.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: "OPEN", type: "BUG" }),
    );
  });
});

// ---------------------------------------------------------------------------
// refreshTickets
// ---------------------------------------------------------------------------

describe("refreshTickets()", () => {
  it("réinitialise la liste et recharge depuis la page 1", async () => {
    useTicketsStore.setState({
      tickets: [makeTicket()],
      meta: { total: 1, page: 2, limit: 20, totalPages: 2 },
    });
    api.list.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });

    await useTicketsStore.getState().refreshTickets();

    expect(api.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    expect(useTicketsStore.getState().isRefreshing).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loadMoreTickets
// ---------------------------------------------------------------------------

describe("loadMoreTickets()", () => {
  it("ajoute les tickets à la liste existante", async () => {
    const first = makeTicket({ id: "t1" });
    const second = makeTicket({ id: "t2" });
    useTicketsStore.setState({
      tickets: [first],
      meta: { total: 2, page: 1, limit: 1, totalPages: 2 },
    });
    api.list.mockResolvedValue({
      data: [second],
      meta: { total: 2, page: 2, limit: 1, totalPages: 2 },
    });

    await useTicketsStore.getState().loadMoreTickets();

    expect(useTicketsStore.getState().tickets).toHaveLength(2);
    expect(api.list).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("ne charge pas si tous les tickets sont déjà chargés", async () => {
    useTicketsStore.setState({
      tickets: [makeTicket()],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    await useTicketsStore.getState().loadMoreTickets();

    expect(api.list).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createTicket
// ---------------------------------------------------------------------------

describe("createTicket()", () => {
  it("ajoute le ticket créé en tête de liste", async () => {
    const newTicket = makeTicket({ id: "t-new" });
    api.create.mockResolvedValue(newTicket as never);

    await useTicketsStore.getState().createTicket({
      type: "BUG",
      title: "Nouveau bug",
      description: "Description longue du bug rencontré.",
    });

    const state = useTicketsStore.getState();
    expect(state.tickets[0].id).toBe("t-new");
    expect(state.openCount).toBe(1);
  });

  it("propage l'erreur en cas d'échec", async () => {
    api.create.mockRejectedValue(new Error("Serveur indisponible"));

    await expect(
      useTicketsStore.getState().createTicket({
        type: "BUG",
        title: "Test",
        description: "Description.",
      }),
    ).rejects.toThrow("Serveur indisponible");
  });
});

// ---------------------------------------------------------------------------
// updateStatus
// ---------------------------------------------------------------------------

describe("updateStatus()", () => {
  it("met à jour le statut dans la liste locale", async () => {
    useTicketsStore.setState({ tickets: [makeTicket()], openCount: 1 });
    api.updateStatus.mockResolvedValue(
      makeTicket({ status: "IN_PROGRESS" }) as never,
    );

    await useTicketsStore.getState().updateStatus("t1", "IN_PROGRESS");

    const state = useTicketsStore.getState();
    expect(state.tickets[0].status).toBe("IN_PROGRESS");
    expect(state.openCount).toBe(1);
  });

  it("décrémente openCount quand le statut devient RESOLVED", async () => {
    useTicketsStore.setState({ tickets: [makeTicket()], openCount: 2 });
    api.updateStatus.mockResolvedValue(
      makeTicket({ status: "RESOLVED" }) as never,
    );

    await useTicketsStore.getState().updateStatus("t1", "RESOLVED");

    expect(useTicketsStore.getState().openCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// toggleVote
// ---------------------------------------------------------------------------

describe("toggleVote()", () => {
  it("délègue à l'API et retourne le résultat", async () => {
    api.toggleVote.mockResolvedValue({ voted: true });

    const result = await useTicketsStore.getState().toggleVote("t1");

    expect(api.toggleVote).toHaveBeenCalledWith("t1");
    expect(result).toEqual({ voted: true });
  });
});

// ---------------------------------------------------------------------------
// removeTicket
// ---------------------------------------------------------------------------

describe("removeTicket()", () => {
  it("supprime le ticket de la liste locale", async () => {
    useTicketsStore.setState({
      tickets: [makeTicket(), makeTicket({ id: "t2" })],
      openCount: 2,
    });
    api.remove.mockResolvedValue(undefined);

    await useTicketsStore.getState().removeTicket("t1");

    const state = useTicketsStore.getState();
    expect(state.tickets).toHaveLength(1);
    expect(state.tickets[0].id).toBe("t2");
    expect(state.openCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------

describe("filtres", () => {
  it("setFilterStatus réinitialise la liste", () => {
    useTicketsStore.setState({
      tickets: [makeTicket()],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    useTicketsStore.getState().setFilterStatus("OPEN");

    const state = useTicketsStore.getState();
    expect(state.tickets).toHaveLength(0);
    expect(state.filterStatus).toBe("OPEN");
  });

  it("setFilterType réinitialise la liste", () => {
    useTicketsStore.setState({ tickets: [makeTicket()] });

    useTicketsStore.getState().setFilterType("FEATURE_REQUEST");

    expect(useTicketsStore.getState().tickets).toHaveLength(0);
    expect(useTicketsStore.getState().filterType).toBe("FEATURE_REQUEST");
  });

  it("setSearch réinitialise la liste", () => {
    useTicketsStore.setState({ tickets: [makeTicket()] });

    useTicketsStore.getState().setSearch("notes");

    expect(useTicketsStore.getState().tickets).toHaveLength(0);
    expect(useTicketsStore.getState().search).toBe("notes");
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe("reset()", () => {
  it("remet l'état initial", () => {
    useTicketsStore.setState({
      tickets: [makeTicket()],
      openCount: 5,
      filterStatus: "OPEN",
    });

    useTicketsStore.getState().reset();

    const state = useTicketsStore.getState();
    expect(state.tickets).toHaveLength(0);
    expect(state.openCount).toBe(0);
    expect(state.filterStatus).toBeUndefined();
  });
});
