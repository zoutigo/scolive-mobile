import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { badgesApi } from "../api/badges.api";
import { adminMessagingApi } from "../api/admin-messaging.api";
import { PLATFORM_SCOPE, type MessagingScope } from "../api/messaging-client";
import type { UnreadSummary } from "../types/badges.types";
import {
  getNotifications,
  isRunningInExpoGo,
} from "../notifications/push-registration";

// Synchronise le badge natif de l'icône de l'app avec le total non-lu déjà
// calculé pour le badge in-app — sans ça, le compteur de l'icône n'était
// jamais remis à zéro après consultation (aucune autre remise à zéro n'est
// implémentée ailleurs).
function syncAppIconBadge(total: number) {
  if (isRunningInExpoGo()) return;
  getNotifications()
    .setBadgeCountAsync(total)
    .catch(() => {});
}

export const BADGES_STORAGE_KEY = "scolive-badges-summary";

const EMPTY_SUMMARY: Omit<UnreadSummary, "messagesUnread" | "total"> = {
  feedUnread: 0,
  ticketsNeedingResponse: 0,
  ticketsUnreadReplies: 0,
  reinscriptionPending: 0,
  children: [],
  teacherClasses: [],
};

interface BadgesState {
  schoolSlug: string | null;
  summary: UnreadSummary | null;
  loadSummary: (scope: MessagingScope) => Promise<void>;
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
      async loadSummary(scope: MessagingScope) {
        try {
          const summary =
            scope === PLATFORM_SCOPE
              ? await loadPlatformSummary()
              : await badgesApi.getUnreadSummary(scope);
          set({ schoolSlug: scope, summary });
          syncAppIconBadge(summary.total);
        } catch {
          if (get().schoolSlug !== scope) {
            set({ schoolSlug: scope, summary: null });
          }
        }
      },

      clear() {
        set({ schoolSlug: null, summary: null });
        syncAppIconBadge(0);
      },
    }),
    {
      name: BADGES_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

async function loadPlatformSummary(): Promise<UnreadSummary> {
  // Platform roles (SUPER_ADMIN/ADMIN) have no per-school summary endpoint —
  // only the aggregated messaging mailbox exposes an unread count for them.
  const messagesUnread = await adminMessagingApi.unreadCount();
  return { ...EMPTY_SUMMARY, messagesUnread, total: messagesUnread };
}
