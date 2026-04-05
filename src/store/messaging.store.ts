import { create } from "zustand";
import { messagingApi } from "../api/messaging.api";
import type {
  FolderKey,
  MessageListItem,
  MessagesMeta,
} from "../types/messaging.types";

interface MessagingState {
  folder: FolderKey;
  messages: MessageListItem[];
  meta: MessagesMeta | null;
  isLoading: boolean;
  isRefreshing: boolean;
  search: string;
  unreadCount: number;

  setFolder: (folder: FolderKey) => void;
  setSearch: (search: string) => void;
  loadMessages: (schoolSlug: string) => Promise<void>;
  refreshMessages: (schoolSlug: string) => Promise<void>;
  loadMoreMessages: (schoolSlug: string) => Promise<void>;
  loadUnreadCount: (schoolSlug: string) => Promise<void>;
  markLocalRead: (messageId: string) => void;
  markLocalUnread: (messageId: string) => void;
  removeLocal: (messageId: string) => void;
  reset: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  folder: "inbox",
  messages: [],
  meta: null,
  isLoading: false,
  isRefreshing: false,
  search: "",
  unreadCount: 0,

  setFolder(folder) {
    set({ folder, messages: [], meta: null, search: "" });
  },

  setSearch(search) {
    set({ search, messages: [], meta: null });
  },

  async loadMessages(schoolSlug) {
    const { folder, search } = get();
    set({ isLoading: true });
    try {
      const res = await messagingApi.list(schoolSlug, {
        folder,
        q: search || undefined,
        page: 1,
        limit: 25,
      });
      set({ messages: res.items, meta: res.meta });
    } finally {
      set({ isLoading: false });
    }
  },

  async refreshMessages(schoolSlug) {
    const { folder, search } = get();
    set({ isRefreshing: true });
    try {
      const res = await messagingApi.list(schoolSlug, {
        folder,
        q: search || undefined,
        page: 1,
        limit: 25,
      });
      set({ messages: res.items, meta: res.meta });
    } finally {
      set({ isRefreshing: false });
    }
  },

  async loadMoreMessages(schoolSlug) {
    const { folder, search, messages, meta, isLoading } = get();
    if (isLoading || !meta || messages.length >= meta.total) return;
    set({ isLoading: true });
    try {
      const nextPage = Math.floor(messages.length / 25) + 1;
      const res = await messagingApi.list(schoolSlug, {
        folder,
        q: search || undefined,
        page: nextPage,
        limit: 25,
      });
      set({ messages: [...messages, ...res.items], meta: res.meta });
    } finally {
      set({ isLoading: false });
    }
  },

  async loadUnreadCount(schoolSlug) {
    try {
      const count = await messagingApi.unreadCount(schoolSlug);
      set({ unreadCount: count });
    } catch {
      // silently ignore
    }
  },

  markLocalRead(messageId) {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, unread: false } : m,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markLocalUnread(messageId) {
    set((state) => {
      const target = state.messages.find((message) => message.id === messageId);
      const shouldIncrement = !!target && !target.unread;

      return {
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, unread: true } : m,
        ),
        unreadCount: shouldIncrement
          ? state.unreadCount + 1
          : state.unreadCount,
      };
    });
  },

  removeLocal(messageId) {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
  },

  reset() {
    set({
      folder: "inbox",
      messages: [],
      meta: null,
      search: "",
      unreadCount: 0,
    });
  },
}));
