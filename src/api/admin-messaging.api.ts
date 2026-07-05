import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  FolderKey,
  MessageDetail,
  MessageListItem,
  MessagesMeta,
  RecipientOption,
} from "../types/messaging.types";

/**
 * Platform-admin (SUPER_ADMIN/ADMIN) mailbox: aggregates every school the
 * caller is sender or recipient in, since they aren't scoped to one school
 * themselves. Method shapes mirror `messagingApi` but drop the `schoolSlug`
 * argument — see `messaging-client.ts` for the adapter that lets the shared
 * screens (index/compose/[messageId]) call either transparently.
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
  forwardAttachmentIds?: string[];
};

type MultipartResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

export class AdminMessagingMultipartError extends Error {
  statusCode?: number;
  responseBody?: string;
  constructor(
    message: string,
    options?: { statusCode?: number; responseBody?: string },
  ) {
    super(message);
    this.name = "AdminMessagingMultipartError";
    this.statusCode = options?.statusCode;
    this.responseBody = options?.responseBody;
  }
}

function canRetryMultipart(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      /network request failed/i.test(error.message || ""))
  );
}

function xhrMultipart(
  url: string,
  formData: FormData,
  token: string | null,
): Promise<MultipartResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "text";
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      const responseText =
        typeof xhr.response === "string"
          ? xhr.response
          : (xhr.responseText ?? "");

      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        async json() {
          return responseText ? JSON.parse(responseText) : {};
        },
        async text() {
          return responseText;
        },
      });
    };

    xhr.onerror = () => {
      reject(new TypeError("Network request failed"));
    };

    xhr.send(formData);
  });
}

async function postMultipart(
  path: string,
  formData: FormData,
): Promise<MultipartResponse> {
  const token = await tokenStorage.getAccessToken();
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    return {
      ok: response.ok,
      status: response.status,
      json: () => response.json(),
      text: () => response.text(),
    };
  } catch (error) {
    if (!canRetryMultipart(error)) {
      throw error;
    }

    return xhrMultipart(url, formData, token);
  }
}

async function throwMultipartError(
  response: MultipartResponse,
  fallbackMessage: string,
): Promise<never> {
  const responseText = await response.text().catch(() => "");
  let message = fallbackMessage;

  if (responseText) {
    try {
      const parsed = JSON.parse(responseText) as {
        message?: string | string[];
      };
      if (Array.isArray(parsed.message)) {
        message = parsed.message.join(", ");
      } else if (typeof parsed.message === "string" && parsed.message.trim()) {
        message = parsed.message.trim();
      }
    } catch {
      message = responseText;
    }
  }

  throw new AdminMessagingMultipartError(message, {
    statusCode: response.status,
    responseBody: responseText,
  });
}

type SystemUserSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  school: { slug: string; name: string } | null;
};

export const adminMessagingApi = {
  async list(params: ListParams): Promise<ListResponse> {
    const query = new URLSearchParams({ folder: params.folder });
    if (params.q) query.set("q", params.q);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const response = await apiFetch<ListResponse>(
      `/admin/messages?${query.toString()}`,
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

  async get(messageId: string): Promise<MessageDetail> {
    const response = await apiFetch<MessageDetail>(
      `/admin/messages/${messageId}`,
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

  async unreadCount(): Promise<number> {
    const res = await apiFetch<{ unread: number }>(
      `/admin/messages/unread-count`,
      {},
      true,
    );
    return res.unread;
  },

  async send(payload: SendPayload): Promise<void> {
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
    for (const attachmentId of payload.forwardAttachmentIds ?? []) {
      formData.append("forwardAttachmentIds", attachmentId);
    }

    const response = await postMultipart(`/admin/messages`, formData);

    if (!response.ok) {
      await throwMultipartError(response, "SEND_MESSAGE_FAILED");
    }
  },

  async updateDraft(
    messageId: string,
    payload: {
      subject?: string;
      body?: string;
      recipientUserIds?: string[];
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        mimeType: string;
        sizeBytes: number;
      }>;
    },
  ): Promise<MessageDetail> {
    const response = await apiFetch<MessageDetail>(
      `/admin/messages/${messageId}/draft`,
      { method: "PATCH", body: JSON.stringify(payload) },
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

  async uploadAttachment(file: {
    uri: string;
    mimeType: string;
    fileName: string;
  }): Promise<{
    fileName: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes: number;
  }> {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/admin/messages/uploads/attachment`,
      formData,
    );

    if (!response.ok) {
      await throwMultipartError(response, "ATTACHMENT_UPLOAD_FAILED");
    }

    const data = (await response.json()) as {
      url: string;
      size: number;
      mimeType: string;
    };

    return {
      fileName: file.fileName,
      fileUrl: normalizeMediaUrl(data.url),
      mimeType: data.mimeType ?? file.mimeType,
      sizeBytes: data.size,
    };
  },

  async sendDraft(messageId: string): Promise<void> {
    await apiFetch(
      `/admin/messages/${messageId}/send`,
      { method: "POST" },
      true,
    );
  },

  async markRead(messageId: string, read: boolean): Promise<void> {
    await apiFetch(
      `/admin/messages/${messageId}/read`,
      { method: "PATCH", body: JSON.stringify({ read }) },
      true,
    );
  },

  async archive(messageId: string, archived: boolean): Promise<void> {
    await apiFetch(
      `/admin/messages/${messageId}/archive`,
      { method: "PATCH", body: JSON.stringify({ archived }) },
      true,
    );
  },

  async remove(messageId: string): Promise<void> {
    await apiFetch(`/admin/messages/${messageId}`, { method: "DELETE" }, true);
  },

  /**
   * Admin composer has no preloaded recipient pool (candidates span the
   * whole platform) — search by name/email instead, reusing the existing
   * admin-only `/system/users` endpoint (already used by the web console).
   */
  async searchRecipients(query: string): Promise<RecipientOption[]> {
    const params = new URLSearchParams({ search: query, page: "1", limit: "20" });
    const response = await apiFetch<{ items: SystemUserSearchResult[] }>(
      `/system/users?${params.toString()}`,
      {},
      true,
    );
    return response.items.map((entry) => ({
      value: entry.id,
      label: `${entry.lastName} ${entry.firstName}`.trim() || entry.email || entry.id,
      email: entry.email ?? undefined,
      subtitle: entry.school?.name ?? undefined,
      schoolSlug: entry.school?.slug ?? null,
    }));
  },

  async uploadInlineImage(
    fileUri: string,
    mimeType: string,
    fileName: string,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/admin/messages/uploads/inline-image`,
      formData,
    );

    if (!response.ok) {
      await throwMultipartError(response, "IMAGE_UPLOAD_FAILED");
    }

    const data = (await response.json()) as { url: string };
    return normalizeMediaUrl(data.url);
  },
};
