import { create } from "zustand";
import {
  getMessagingClient,
  type MessagingScope,
} from "../api/messaging-client";
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
  /** Messages explicitement remis en "non lu" par l'utilisateur pendant la
   * session courante. Empêche le marquage automatique en lu (déclenché par
   * l'affichage du message, ex: navigation swipe) d'écraser ce choix
   * explicite. */
  keepUnreadIds: Set<string>;

  setFolder: (folder: FolderKey) => void;
  setSearch: (search: string) => void;
  loadMessages: (scope: MessagingScope) => Promise<void>;
  refreshMessages: (scope: MessagingScope) => Promise<void>;
  loadMoreMessages: (scope: MessagingScope) => Promise<void>;
  loadUnreadCount: (scope: MessagingScope) => Promise<void>;
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
  keepUnreadIds: new Set<string>(),

  setFolder(folder) {
    set({ folder, messages: [], meta: null, search: "" });
  },

  setSearch(search) {
    set({ search, messages: [], meta: null });
  },

  async loadMessages(scope) {
    const { folder, search } = get();
    set({ isLoading: true });
    try {
      const res = await getMessagingClient(scope).list({
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

  async refreshMessages(scope) {
    const { folder, search } = get();
    set({ isRefreshing: true });
    try {
      const res = await getMessagingClient(scope).list({
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

  async loadMoreMessages(scope) {
    const { folder, search, messages, meta, isLoading } = get();
    if (isLoading || !meta || messages.length >= meta.total) return;
    set({ isLoading: true });
    try {
      const nextPage = Math.floor(messages.length / 25) + 1;
      const res = await getMessagingClient(scope).list({
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

  async loadUnreadCount(scope) {
    try {
      const count = await getMessagingClient(scope).unreadCount();
      set({ unreadCount: count });
    } catch {
      // silently ignore
    }
  },

  markLocalRead(messageId) {
    set((state) => {
      const nextKeepUnread = new Set(state.keepUnreadIds);
      nextKeepUnread.delete(messageId);
      return {
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, unread: false } : m,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        keepUnreadIds: nextKeepUnread,
      };
    });
  },

  markLocalUnread(messageId) {
    set((state) => {
      const target = state.messages.find((message) => message.id === messageId);
      const shouldIncrement = !!target && !target.unread;
      const nextKeepUnread = new Set(state.keepUnreadIds);
      nextKeepUnread.add(messageId);

      return {
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, unread: true } : m,
        ),
        unreadCount: shouldIncrement
          ? state.unreadCount + 1
          : state.unreadCount,
        keepUnreadIds: nextKeepUnread,
      };
    });
  },

  removeLocal(messageId) {
    set((state) => {
      const nextKeepUnread = new Set(state.keepUnreadIds);
      nextKeepUnread.delete(messageId);
      return {
        messages: state.messages.filter((m) => m.id !== messageId),
        keepUnreadIds: nextKeepUnread,
      };
    });
  },

  reset() {
    set({
      folder: "inbox",
      messages: [],
      meta: null,
      search: "",
      unreadCount: 0,
      keepUnreadIds: new Set<string>(),
    });
  },
}));
