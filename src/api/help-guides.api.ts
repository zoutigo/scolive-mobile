import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  CurrentGuideResponse,
  HelpChapterItem,
  HelpContentType,
  HelpGuideAudience,
  HelpGuideItem,
  HelpPlanNode,
  HelpPublicationStatus,
} from "../types/help-guides.types";

export const helpGuidesApi = {
  async getCurrent(params?: {
    guideId?: string;
    audience?: HelpGuideAudience;
  }) {
    const query = new URLSearchParams();
    if (params?.guideId) query.set("guideId", params.guideId);
    if (params?.audience) query.set("audience", params.audience);
    const qs = query.toString();
    return apiFetch<CurrentGuideResponse>(
      `/help-guides/current${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async getPlan(params?: { guideId?: string; audience?: HelpGuideAudience }) {
    const query = new URLSearchParams();
    if (params?.guideId) query.set("guideId", params.guideId);
    if (params?.audience) query.set("audience", params.audience);
    const qs = query.toString();
    return apiFetch<{ guide: HelpGuideItem | null; items: HelpPlanNode[] }>(
      `/help-guides/current/plan${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async getChapter(
    chapterId: string,
    params?: { guideId?: string; audience?: HelpGuideAudience },
  ) {
    const query = new URLSearchParams();
    if (params?.guideId) query.set("guideId", params.guideId);
    if (params?.audience) query.set("audience", params.audience);
    const qs = query.toString();
    return apiFetch<{ guide: HelpGuideItem | null; chapter: HelpChapterItem }>(
      `/help-guides/current/chapters/${chapterId}${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async search(
    q: string,
    params?: { guideId?: string; audience?: HelpGuideAudience },
  ) {
    const query = new URLSearchParams();
    query.set("q", q);
    if (params?.guideId) query.set("guideId", params.guideId);
    if (params?.audience) query.set("audience", params.audience);
    return apiFetch<{ guide: HelpGuideItem | null; items: HelpChapterItem[] }>(
      `/help-guides/current/search?${query.toString()}`,
      {},
      true,
    );
  },

  async listAdmin(params?: {
    audience?: HelpGuideAudience;
    status?: HelpPublicationStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.audience) query.set("audience", params.audience);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<{ items: HelpGuideItem[] }>(
      `/help-guides/admin/guides${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async createGuide(payload: {
    title: string;
    audience: HelpGuideAudience;
    status?: HelpPublicationStatus;
    description?: string;
    schoolId?: string;
  }) {
    return apiFetch<HelpGuideItem>(
      "/help-guides/admin/guides",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async createChapter(
    guideId: string,
    payload: {
      title: string;
      parentId?: string;
      orderIndex?: number;
      summary?: string;
      contentType: HelpContentType;
      contentHtml?: string;
      contentJson?: Record<string, unknown>;
      videoUrl?: string;
      status?: HelpPublicationStatus;
    },
  ) {
    return apiFetch<HelpChapterItem>(
      `/help-guides/admin/guides/${guideId}/chapters`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async uploadInlineImage(file: {
    uri: string;
    name: string;
    mimeType: string;
  }) {
    const token = await tokenStorage.getAccessToken();
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.name,
    } as unknown as Blob);

    const response = await fetch(
      `${BASE_URL}/help-guides/admin/uploads/inline-image`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
          : "GUIDE_INLINE_UPLOAD_FAILED";
      throw new Error(message);
    }

    return (await response.json()) as { url: string };
  },

  async uploadInlineVideo(file: {
    uri: string;
    name: string;
    mimeType: string;
  }) {
    const token = await tokenStorage.getAccessToken();
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      type: file.mimeType,
      name: file.name,
    } as unknown as Blob);

    const response = await fetch(
      `${BASE_URL}/help-guides/admin/uploads/inline-video`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
          : "GUIDE_INLINE_UPLOAD_FAILED";
      throw new Error(message);
    }

    return (await response.json()) as { url: string };
  },
};
