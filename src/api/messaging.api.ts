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

type MultipartResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

export class MessagingMultipartError extends Error {
  statusCode?: number;
  responseBody?: string;
  constructor(
    message: string,
    options?: { statusCode?: number; responseBody?: string },
  ) {
    super(message);
    this.name = "MessagingMultipartError";
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

  throw new MessagingMultipartError(message, {
    statusCode: response.status,
    responseBody: responseText,
  });
}

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

    const response = await postMultipart(
      `/schools/${schoolSlug}/messages`,
      formData,
    );

    if (!response.ok) {
      await throwMultipartError(response, "SEND_MESSAGE_FAILED");
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
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob);

    const response = await postMultipart(
      `/schools/${schoolSlug}/messages/uploads/inline-image`,
      formData,
    );

    if (!response.ok) {
      await throwMultipartError(response, "IMAGE_UPLOAD_FAILED");
    }

    const data = (await response.json()) as { url: string };
    return normalizeMediaUrl(data.url);
  },
};
