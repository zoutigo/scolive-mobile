import { apiFetch } from "./client";
import type { BadgeScope, UnreadSummary } from "../types/badges.types";

export const badgesApi = {
  getUnreadSummary(schoolSlug: string): Promise<UnreadSummary> {
    return apiFetch<UnreadSummary>(
      `/schools/${schoolSlug}/me/unread-summary`,
      {},
      true,
    );
  },

  async markRead(
    schoolSlug: string,
    scope: BadgeScope,
    scopeRefId?: string,
  ): Promise<void> {
    await apiFetch<{ ok: boolean }>(
      `/schools/${schoolSlug}/me/read-markers`,
      {
        method: "PATCH",
        body: JSON.stringify({ scope, scopeRefId }),
      },
      true,
    );
  },
};
