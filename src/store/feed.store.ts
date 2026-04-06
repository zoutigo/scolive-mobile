import { create } from "zustand";
import { feedApi } from "../api/feed.api";
import type {
  FeedComment,
  FeedFilter,
  FeedListMeta,
  FeedPost,
} from "../types/feed.types";

const PAGE_SIZE = 12;

type FeedState = {
  posts: FeedPost[];
  meta: FeedListMeta | null;
  filter: FeedFilter;
  search: string;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;

  setFilter: (filter: FeedFilter) => void;
  setSearch: (search: string) => void;
  loadFeed: (schoolSlug: string) => Promise<void>;
  refreshFeed: (schoolSlug: string) => Promise<void>;
  loadMoreFeed: (schoolSlug: string) => Promise<void>;
  prependPost: (post: FeedPost) => void;
  replacePost: (post: FeedPost) => void;
  removePost: (postId: string) => void;
  applyLike: (postId: string, liked: boolean, likesCount: number) => void;
  appendComment: (postId: string, comment: FeedComment) => void;
  applyPollVote: (
    postId: string,
    votedOptionId: string,
    options: Array<{ id: string; label: string; votes: number }>,
  ) => void;
  reset: () => void;
};

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  meta: null,
  filter: "all",
  search: "",
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,

  setFilter(filter) {
    set({ filter, posts: [], meta: null });
  },

  setSearch(search) {
    set({ search, posts: [], meta: null });
  },

  async loadFeed(schoolSlug) {
    const { filter, search } = get();
    set({ isLoading: true });
    try {
      const response = await feedApi.list(schoolSlug, {
        filter,
        q: search || undefined,
        page: 1,
        limit: PAGE_SIZE,
      });
      set({ posts: response.items, meta: response.meta });
    } finally {
      set({ isLoading: false });
    }
  },

  async refreshFeed(schoolSlug) {
    const { filter, search } = get();
    set({ isRefreshing: true });
    try {
      const response = await feedApi.list(schoolSlug, {
        filter,
        q: search || undefined,
        page: 1,
        limit: PAGE_SIZE,
      });
      set({ posts: response.items, meta: response.meta });
    } finally {
      set({ isRefreshing: false });
    }
  },

  async loadMoreFeed(schoolSlug) {
    const { filter, search, posts, meta, isLoadingMore } = get();
    if (!meta || isLoadingMore || posts.length >= meta.total) {
      return;
    }

    set({ isLoadingMore: true });
    try {
      const nextPage = meta.page + 1;
      const response = await feedApi.list(schoolSlug, {
        filter,
        q: search || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      const byId = new Map(posts.map((post) => [post.id, post]));
      response.items.forEach((post) => byId.set(post.id, post));
      set({
        posts: Array.from(byId.values()),
        meta: response.meta,
      });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  prependPost(post) {
    set((state) => ({
      posts: [post, ...state.posts.filter((entry) => entry.id !== post.id)],
      meta: state.meta
        ? { ...state.meta, total: state.meta.total + 1 }
        : state.meta,
    }));
  },

  replacePost(post) {
    set((state) => ({
      posts: state.posts.map((entry) => (entry.id === post.id ? post : entry)),
    }));
  },

  removePost(postId) {
    set((state) => ({
      posts: state.posts.filter((entry) => entry.id !== postId),
      meta: state.meta
        ? { ...state.meta, total: Math.max(0, state.meta.total - 1) }
        : state.meta,
    }));
  },

  applyLike(postId, liked, likesCount) {
    set((state) => ({
      posts: state.posts.map((entry) =>
        entry.id === postId ? { ...entry, likedByViewer: liked, likesCount } : entry,
      ),
    }));
  },

  appendComment(postId, comment) {
    set((state) => ({
      posts: state.posts.map((entry) =>
        entry.id === postId
          ? { ...entry, comments: [...entry.comments, comment] }
          : entry,
      ),
    }));
  },

  applyPollVote(postId, votedOptionId, options) {
    set((state) => ({
      posts: state.posts.map((entry) => {
        if (entry.id !== postId || entry.type !== "POLL" || !entry.poll) {
          return entry;
        }
        return {
          ...entry,
          poll: {
            ...entry.poll,
            votedOptionId,
            options,
          },
        };
      }),
    }));
  },

  reset() {
    set({
      posts: [],
      meta: null,
      filter: "all",
      search: "",
      isLoading: false,
      isRefreshing: false,
      isLoadingMore: false,
    });
  },
}));
