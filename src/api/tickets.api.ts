import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  CreateTicketPayload,
  TicketDetail,
  TicketsMeta,
  TicketListItem,
  TicketStatus,
} from "../types/tickets.types";

type ListParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: TicketStatus;
  type?: string;
};

type ListResponse = {
  data: TicketListItem[];
  meta: TicketsMeta;
};

type MultipartResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
};

async function postMultipart(
  path: string,
  formData: FormData,
): Promise<MultipartResponse> {
  const token = await tokenStorage.getAccessToken();
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

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
}

async function throwMultipartError(
  response: MultipartResponse,
  fallback: string,
): Promise<never> {
  const text = await response.text().catch(() => "");
  let message = fallback;
  if (text) {
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      if (Array.isArray(parsed.message)) message = parsed.message.join(", ");
      else if (typeof parsed.message === "string" && parsed.message.trim())
        message = parsed.message.trim();
    } catch {
      message = text;
    }
  }
  throw new Error(message);
}

export const ticketsApi = {
  async list(params?: ListParams): Promise<ListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.q) query.set("q", params.q);
    if (params?.status) query.set("status", params.status);
    if (params?.type) query.set("type", params.type);
    const qs = query.toString();
    return apiFetch<ListResponse>(`/tickets${qs ? `?${qs}` : ""}`, {}, true);
  },

  async get(ticketId: string): Promise<TicketDetail> {
    return apiFetch<TicketDetail>(`/tickets/${ticketId}`, {}, true);
  },

  async create(payload: CreateTicketPayload): Promise<TicketDetail> {
    const formData = new FormData();
    formData.append("type", payload.type);
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    if (payload.schoolSlug) formData.append("schoolSlug", payload.schoolSlug);
    if (payload.platform) formData.append("platform", payload.platform);
    if (payload.appVersion) formData.append("appVersion", payload.appVersion);
    if (payload.screenPath) formData.append("screenPath", payload.screenPath);

    for (const file of payload.attachments ?? []) {
      formData.append("attachments", {
        uri: file.uri,
        type: file.mimeType,
        name: file.name,
      } as unknown as Blob);
    }

    const response = await postMultipart("/tickets", formData);
    if (!response.ok) {
      await throwMultipartError(response, "Impossible de créer le ticket");
    }
    return response.json() as Promise<TicketDetail>;
  },

  async updateStatus(
    ticketId: string,
    status: TicketStatus,
  ): Promise<TicketDetail> {
    return apiFetch<TicketDetail>(
      `/tickets/${ticketId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      true,
    );
  },

  async addResponse(
    ticketId: string,
    body: string,
    isInternal = false,
  ): Promise<void> {
    await apiFetch(
      `/tickets/${ticketId}/responses`,
      { method: "POST", body: JSON.stringify({ body, isInternal }) },
      true,
    );
  },

  async toggleVote(ticketId: string): Promise<{ voted: boolean }> {
    return apiFetch<{ voted: boolean }>(
      `/tickets/${ticketId}/votes`,
      { method: "POST" },
      true,
    );
  },

  async remove(ticketId: string): Promise<void> {
    await apiFetch(`/tickets/${ticketId}`, { method: "DELETE" }, true);
  },

  async myCount(): Promise<{ open: number }> {
    return apiFetch<{ open: number }>("/tickets/my-count", {}, true);
  },
};
