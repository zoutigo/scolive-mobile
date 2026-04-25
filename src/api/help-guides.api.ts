import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  CurrentGuideResponse,
  HelpChapterItem,
  HelpContentType,
  HelpGuideAudience,
  HelpGuideItem,
  HelpGuideSource,
  HelpGuideSourceWithPlan,
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
    return apiFetch<{ sources: HelpGuideSourceWithPlan[] }>(
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
    return apiFetch<{ source?: HelpGuideSource; chapter: HelpChapterItem }>(
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
    return apiFetch<{
      sources: HelpGuideSource[];
      items: Array<
        HelpChapterItem & {
          guideId: string;
          sourceKey: string;
          scopeType: "GLOBAL" | "SCHOOL";
          scopeLabel: string;
          schoolId: string | null;
          schoolName: string | null;
        }
      >;
    }>(`/help-guides/current/search?${query.toString()}`, {}, true);
  },

  async listGlobalAdmin(params?: {
    audience?: HelpGuideAudience;
    status?: HelpPublicationStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.audience) query.set("audience", params.audience);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<{ items: HelpGuideItem[] }>(
      `/help-guides/admin/global/guides${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async listSchoolAdmin(params?: {
    audience?: HelpGuideAudience;
    status?: HelpPublicationStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.audience) query.set("audience", params.audience);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<{ items: HelpGuideItem[] }>(
      `/help-guides/admin/school/guides${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async createGlobalGuide(payload: {
    title: string;
    audience: HelpGuideAudience;
    status?: HelpPublicationStatus;
    description?: string;
  }) {
    return apiFetch<HelpGuideItem>(
      "/help-guides/admin/global/guides",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async createSchoolGuide(payload: {
    title: string;
    audience: HelpGuideAudience;
    status?: HelpPublicationStatus;
    description?: string;
  }) {
    return apiFetch<HelpGuideItem>(
      "/help-guides/admin/school/guides",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateGlobalGuide(
    guideId: string,
    payload: Partial<{
      title: string;
      audience: HelpGuideAudience;
      status: HelpPublicationStatus;
      description: string;
    }>,
  ) {
    return apiFetch<HelpGuideItem>(
      `/help-guides/admin/global/guides/${guideId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateSchoolGuide(
    guideId: string,
    payload: Partial<{
      title: string;
      audience: HelpGuideAudience;
      status: HelpPublicationStatus;
      description: string;
    }>,
  ) {
    return apiFetch<HelpGuideItem>(
      `/help-guides/admin/school/guides/${guideId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async deleteGlobalGuide(guideId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-guides/admin/global/guides/${guideId}`,
      { method: "DELETE" },
      true,
    );
  },

  async deleteSchoolGuide(guideId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-guides/admin/school/guides/${guideId}`,
      { method: "DELETE" },
      true,
    );
  },

  async createGlobalChapter(
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
      `/help-guides/admin/global/guides/${guideId}/chapters`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async createSchoolChapter(
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
      `/help-guides/admin/school/guides/${guideId}/chapters`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateGlobalChapter(
    chapterId: string,
    payload: Partial<{
      title: string;
      parentId: string | null;
      orderIndex: number;
      summary: string;
      contentType: HelpContentType;
      contentHtml: string;
      contentJson: Record<string, unknown>;
      videoUrl: string;
      status: HelpPublicationStatus;
    }>,
  ) {
    return apiFetch<HelpChapterItem>(
      `/help-guides/admin/global/chapters/${chapterId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateSchoolChapter(
    chapterId: string,
    payload: Partial<{
      title: string;
      parentId: string | null;
      orderIndex: number;
      summary: string;
      contentType: HelpContentType;
      contentHtml: string;
      contentJson: Record<string, unknown>;
      videoUrl: string;
      status: HelpPublicationStatus;
    }>,
  ) {
    return apiFetch<HelpChapterItem>(
      `/help-guides/admin/school/chapters/${chapterId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async deleteGlobalChapter(chapterId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-guides/admin/global/chapters/${chapterId}`,
      { method: "DELETE" },
      true,
    );
  },

  async deleteSchoolChapter(chapterId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-guides/admin/school/chapters/${chapterId}`,
      { method: "DELETE" },
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
