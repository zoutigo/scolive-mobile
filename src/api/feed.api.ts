import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  CreateFeedPayload,
  FeedListMeta,
  FeedListParams,
  FeedPost,
} from "../types/feed.types";

type ApiFeedPost = Omit<FeedPost, "schoolSlug">;

type FeedListResponse = {
  items: ApiFeedPost[];
  meta: FeedListMeta;
};

function toUiPost(post: ApiFeedPost, schoolSlug: string): FeedPost {
  return {
    ...post,
    schoolSlug,
    attachments: (post.attachments ?? []).map((attachment) => ({
      ...attachment,
      fileUrl: attachment.fileUrl ?? undefined,
      sizeLabel: attachment.sizeLabel ?? "",
    })),
    comments: post.comments ?? [],
  };
}

async function authHeaders() {
  const token = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export const feedApi = {
  async list(schoolSlug: string, params: FeedListParams = {}) {
    const query = new URLSearchParams({
      viewScope: params.viewScope ?? "GENERAL",
    });

    if (params.classId) query.set("classId", params.classId);
    if (params.levelId) query.set("levelId", params.levelId);
    if (params.filter && params.filter !== "all") {
      query.set("filter", params.filter);
    }
    if (params.q?.trim()) query.set("q", params.q.trim());
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const payload = await apiFetch<FeedListResponse>(
      `/schools/${schoolSlug}/feed?${query.toString()}`,
      {},
      true,
    );

    return {
      ...payload,
      items: payload.items.map((post) => toUiPost(post, schoolSlug)),
    };
  },

  async create(schoolSlug: string, payload: CreateFeedPayload) {
    const created = await apiFetch<ApiFeedPost>(
      `/schools/${schoolSlug}/feed`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
    return toUiPost(created, schoolSlug);
  },

  async update(schoolSlug: string, postId: string, payload: CreateFeedPayload) {
    const updated = await apiFetch<ApiFeedPost>(
      `/schools/${schoolSlug}/feed/${postId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
    return toUiPost(updated, schoolSlug);
  },

  async remove(schoolSlug: string, postId: string): Promise<void> {
    await apiFetch(
      `/schools/${schoolSlug}/feed/${postId}`,
      { method: "DELETE" },
      true,
    );
  },

  async toggleLike(schoolSlug: string, postId: string) {
    return apiFetch<{ liked: boolean; likesCount: number }>(
      `/schools/${schoolSlug}/feed/${postId}/likes/toggle`,
      {
        method: "POST",
      },
      true,
    );
  },

  async addComment(schoolSlug: string, postId: string, text: string) {
    return apiFetch<{
      comment: {
        id: string;
        authorName: string;
        text: string;
        createdAt: string;
      };
      commentsCount: number;
    }>(
      `/schools/${schoolSlug}/feed/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      },
      true,
    );
  },

  async votePoll(schoolSlug: string, postId: string, optionId: string) {
    return apiFetch<{
      votedOptionId: string;
      options: Array<{ id: string; label: string; votes: number }>;
    }>(
      `/schools/${schoolSlug}/feed/${postId}/polls/${optionId}/vote`,
      {
        method: "POST",
      },
      true,
    );
  },

  async uploadInlineImage(schoolSlug: string, file: {
    uri: string;
    name: string;
    mimeType: string;
  }) {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.name,
    } as unknown as Blob);

    const response = await fetch(
      `${BASE_URL}/schools/${schoolSlug}/feed/uploads/inline-image`,
      {
        method: "POST",
        headers: {
          ...(await authHeaders()),
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string | string[];
      } | null;
      const message = Array.isArray(payload?.message)
        ? payload.message.join(", ")
        : typeof payload?.message === "string"
          ? payload.message
          : "FEED_INLINE_UPLOAD_FAILED";
      throw new Error(message);
    }

    return (await response.json()) as { url: string };
  },
};
