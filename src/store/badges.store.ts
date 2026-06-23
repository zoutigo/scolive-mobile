import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { badgesApi } from "../api/badges.api";
import type { UnreadSummary } from "../types/badges.types";

export const BADGES_STORAGE_KEY = "scolive-badges-summary";

interface BadgesState {
  schoolSlug: string | null;
  summary: UnreadSummary | null;
  loadSummary: (schoolSlug: string) => Promise<void>;
  clear: () => void;
}

export const useBadgesStore = create<BadgesState>()(
  persist(
    (set, get) => ({
      schoolSlug: null,
      summary: null,

      // Connectivity in the field (Cameroon) is unreliable: a failed fetch
      // keeps the last known summary (persisted from a previous successful
      // fetch) instead of collapsing every badge back to zero.
      async loadSummary(schoolSlug: string) {
        try {
          const summary = await badgesApi.getUnreadSummary(schoolSlug);
          set({ schoolSlug, summary });
        } catch {
          if (get().schoolSlug !== schoolSlug) {
            set({ schoolSlug, summary: null });
          }
        }
      },

      clear() {
        set({ schoolSlug: null, summary: null });
      },
    }),
    {
      name: BADGES_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
