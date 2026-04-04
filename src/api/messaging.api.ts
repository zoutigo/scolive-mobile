import { apiFetch, BASE_URL, tokenStorage } from "./client";

/**
 * In development the media service (MinIO) returns URLs with "localhost"
 * as hostname. From an Android emulator localhost != host machine — it must
 * be 10.0.2.2. We derive the correct host from EXPO_PUBLIC_API_URL so that
 * the fix is automatic and disappears in production (where URLs are real domains).
 */
function normalizeMediaUrl(url: string): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  const match = apiUrl.match(/^https?:\/\/([^:/]+)/);
  const apiHost = match?.[1] ?? "";
  if (apiHost && apiHost !== "localhost") {
    return url.replace(/\blocalhost\b/g, apiHost);
  }
  return url;
}
import type {
  FolderKey,
  MessageDetail,
  MessageListItem,
  MessagesMeta,
  MessagingRecipients,
} from "../types/messaging.types";

type ListParams = {
  folder: FolderKey;
  q?: string;
  page?: number;
  limit?: number;
};

type ListResponse = {
  items: MessageListItem[];
  meta: MessagesMeta;
};

type SendPayload = {
  subject: string;
  body: string;
  recipientUserIds: string[];
  isDraft?: boolean;
  attachments?: Array<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  }>;
};

export const messagingApi = {
  async list(schoolSlug: string, params: ListParams): Promise<ListResponse> {
    const query = new URLSearchParams({ folder: params.folder });
    if (params.q) query.set("q", params.q);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const response = await apiFetch<ListResponse>(
      `/schools/${schoolSlug}/messages?${query.toString()}`,
      {},
      true,
    );
    return {
      ...response,
      items: response.items.map((item) => ({
        ...item,
        attachments: (item.attachments ?? []).map((attachment) => ({
          ...attachment,
          url: normalizeMediaUrl(attachment.url),
        })),
      })),
    };
  },

  async get(schoolSlug: string, messageId: string): Promise<MessageDetail> {
    const response = await apiFetch<MessageDetail>(
      `/schools/${schoolSlug}/messages/${messageId}`,
      {},
      true,
    );
    return {
      ...response,
      attachments: (response.attachments ?? []).map((attachment) => ({
        ...attachment,
        url: normalizeMediaUrl(attachment.url),
      })),
    };
  },

  async unreadCount(schoolSlug: string): Promise<number> {
    const res = await apiFetch<{ unread: number }>(
      `/schools/${schoolSlug}/messages/unread-count`,
      {},
      true,
    );
    return res.unread;
  },

  async send(schoolSlug: string, payload: SendPayload): Promise<void> {
    const token = await tokenStorage.getAccessToken();
    const formData = new FormData();
    formData.append("subject", payload.subject);
    formData.append("body", payload.body);
    for (const recipientUserId of payload.recipientUserIds) {
      formData.append("recipientUserIds", recipientUserId);
    }
    if (payload.isDraft !== undefined) {
      formData.append("isDraft", String(payload.isDraft));
    }
    for (const attachment of payload.attachments ?? []) {
      formData.append("attachments", {
        uri: attachment.uri,
        type: attachment.mimeType,
        name: attachment.name,
      } as unknown as Blob);
    }

    const response = await fetch(`${BASE_URL}/schools/${schoolSlug}/messages`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      throw new Error("SEND_MESSAGE_FAILED");
    }
  },

  async markRead(
    schoolSlug: string,
    messageId: string,
    read: boolean,
  ): Promise<void> {
    await apiFetch(
      `/schools/${schoolSlug}/messages/${messageId}/read`,
      { method: "PATCH", body: JSON.stringify({ read }) },
      true,
    );
  },

  async archive(
    schoolSlug: string,
    messageId: string,
    archived: boolean,
  ): Promise<void> {
    await apiFetch(
      `/schools/${schoolSlug}/messages/${messageId}/archive`,
      { method: "PATCH", body: JSON.stringify({ archived }) },
      true,
    );
  },

  async remove(schoolSlug: string, messageId: string): Promise<void> {
    await apiFetch(
      `/schools/${schoolSlug}/messages/${messageId}`,
      { method: "DELETE" },
      true,
    );
  },

  async getRecipients(schoolSlug: string): Promise<MessagingRecipients> {
    return apiFetch<MessagingRecipients>(
      `/schools/${schoolSlug}/messaging/recipients`,
      {},
      true,
    );
  },

  /**
   * Upload an inline image for a message body.
   * Uses raw fetch with FormData (not JSON) — Content-Type is set automatically
   * by the runtime with the correct multipart boundary.
   */
  async uploadInlineImage(
    schoolSlug: string,
    fileUri: string,
    mimeType: string,
    fileName: string,
  ): Promise<string> {
    const token = await tokenStorage.getAccessToken();

    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob);

    const response = await fetch(
      `${BASE_URL}/schools/${schoolSlug}/messages/uploads/inline-image`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("IMAGE_UPLOAD_FAILED");
    }

    const data = (await response.json()) as { url: string };
    return normalizeMediaUrl(data.url);
  },
};
