import { create } from "zustand";
import { ticketsApi } from "../api/tickets.api";
import type {
  CreateTicketPayload,
  TicketDetail,
  TicketListItem,
  TicketsMeta,
  TicketStatus,
  TicketType,
} from "../types/tickets.types";

interface TicketsState {
  tickets: TicketListItem[];
  meta: TicketsMeta | null;
  isLoading: boolean;
  isRefreshing: boolean;
  openCount: number;

  filterStatus: TicketStatus | undefined;
  filterType: TicketType | undefined;
  search: string;

  setFilterStatus: (status: TicketStatus | undefined) => void;
  setFilterType: (type: TicketType | undefined) => void;
  setSearch: (search: string) => void;

  loadTickets: () => Promise<void>;
  refreshTickets: () => Promise<void>;
  loadMoreTickets: () => Promise<void>;
  loadOpenCount: () => Promise<void>;

  createTicket: (payload: CreateTicketPayload) => Promise<TicketDetail>;
  updateStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  toggleVote: (ticketId: string) => Promise<{ voted: boolean }>;
  removeTicket: (ticketId: string) => Promise<void>;
  addResponse: (
    ticketId: string,
    body: string,
    isInternal?: boolean,
  ) => Promise<void>;

  reset: () => void;
}

const INITIAL_STATE = {
  tickets: [] as TicketListItem[],
  meta: null as TicketsMeta | null,
  isLoading: false,
  isRefreshing: false,
  openCount: 0,
  filterStatus: undefined as TicketStatus | undefined,
  filterType: undefined as TicketType | undefined,
  search: "",
};

export const useTicketsStore = create<TicketsState>((set, get) => ({
  ...INITIAL_STATE,

  setFilterStatus(status) {
    set({ filterStatus: status, tickets: [], meta: null });
  },

  setFilterType(type) {
    set({ filterType: type, tickets: [], meta: null });
  },

  setSearch(search) {
    set({ search, tickets: [], meta: null });
  },

  async loadTickets() {
    const { filterStatus, filterType, search } = get();
    set({ isLoading: true });
    try {
      const res = await ticketsApi.list({
        page: 1,
        limit: 20,
        status: filterStatus,
        type: filterType,
        q: search || undefined,
      });
      set({ tickets: res.data, meta: res.meta });
    } finally {
      set({ isLoading: false });
    }
  },

  async refreshTickets() {
    const { filterStatus, filterType, search } = get();
    set({ isRefreshing: true });
    try {
      const res = await ticketsApi.list({
        page: 1,
        limit: 20,
        status: filterStatus,
        type: filterType,
        q: search || undefined,
      });
      set({ tickets: res.data, meta: res.meta });
    } finally {
      set({ isRefreshing: false });
    }
  },

  async loadMoreTickets() {
    const {
      tickets,
      meta,
      isLoading,
      isRefreshing,
      filterStatus,
      filterType,
      search,
    } = get();
    if (isLoading || isRefreshing) return;
    if (meta && tickets.length >= meta.total) return;

    const nextPage = meta ? meta.page + 1 : 2;
    set({ isLoading: true });
    try {
      const res = await ticketsApi.list({
        page: nextPage,
        limit: 20,
        status: filterStatus,
        type: filterType,
        q: search || undefined,
      });
      set({ tickets: [...tickets, ...res.data], meta: res.meta });
    } finally {
      set({ isLoading: false });
    }
  },

  async loadOpenCount() {
    try {
      const res = await ticketsApi.myCount();
      set({ openCount: res.open });
    } catch {
      // silently ignore — sidebar badge is non-critical
    }
  },

  async createTicket(payload) {
    const ticket = await ticketsApi.create(payload);
    set((state) => ({
      tickets: [ticket as unknown as TicketListItem, ...state.tickets],
      openCount: state.openCount + 1,
    }));
    return ticket;
  },

  async updateStatus(ticketId, status) {
    const ticket = await ticketsApi.updateStatus(ticketId, status);
    const isResolved = status === "RESOLVED" || status === "CLOSED";
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, status: ticket.status } : t,
      ),
      openCount: isResolved
        ? Math.max(0, state.openCount - 1)
        : state.openCount,
    }));
  },

  async toggleVote(ticketId) {
    return ticketsApi.toggleVote(ticketId);
  },

  async removeTicket(ticketId) {
    await ticketsApi.remove(ticketId);
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== ticketId),
      openCount: Math.max(0, state.openCount - 1),
    }));
  },

  async addResponse(ticketId, body, isInternal = false) {
    await ticketsApi.addResponse(ticketId, body, isInternal);
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, status: "ANSWERED" as TicketStatus } : t,
      ),
    }));
  },

  reset() {
    set(INITIAL_STATE);
  },
}));
