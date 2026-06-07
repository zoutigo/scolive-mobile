import { create } from "zustand";
import type { SchoolUser, SchoolUsersFilters } from "../types/users.types";

interface UsersState {
  users: SchoolUser[];
  page: number;
  hasMore: boolean;
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  filters: SchoolUsersFilters;

  setFilters: (filters: Partial<SchoolUsersFilters>) => void;
  setUsers: (
    users: SchoolUser[],
    hasMore: boolean,
    page: number,
    total: number,
  ) => void;
  appendUsers: (users: SchoolUser[], hasMore: boolean, page: number) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const INITIAL_FILTERS: SchoolUsersFilters = {
  search: "",
  role: "ALL",
};

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  page: 1,
  hasMore: false,
  total: 0,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  filters: INITIAL_FILTERS,

  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),

  setUsers: (users, hasMore, page, total) =>
    set({ users, hasMore, page, total, error: null }),

  appendUsers: (newUsers, hasMore, page) =>
    set((s) => ({
      users: [...s.users, ...newUsers],
      hasMore,
      page,
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      users: [],
      page: 1,
      hasMore: false,
      total: 0,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
      filters: INITIAL_FILTERS,
    }),
}));
