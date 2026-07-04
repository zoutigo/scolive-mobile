import { apiFetch, BASE_URL, tokenStorage } from "./client";
import type {
  CurrentHelpFaqResponse,
  HelpFaq,
  HelpFaqAudience,
  HelpFaqItem,
  HelpFaqSource,
  HelpFaqSourceWithThemes,
  HelpFaqTheme,
  HelpPublicationStatus,
} from "../types/help-faqs.types";

export const helpFaqsApi = {
  async getCurrent(params?: { faqId?: string; audience?: HelpFaqAudience }) {
    const query = new URLSearchParams();
    if (params?.faqId) query.set("faqId", params.faqId);
    if (params?.audience) query.set("audience", params.audience);
    const qs = query.toString();
    return apiFetch<CurrentHelpFaqResponse>(
      `/help-faqs/current${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async getThemes(params?: { faqId?: string; audience?: HelpFaqAudience }) {
    const query = new URLSearchParams();
    if (params?.faqId) query.set("faqId", params.faqId);
    if (params?.audience) query.set("audience", params.audience);
    const qs = query.toString();
    return apiFetch<{ sources: HelpFaqSourceWithThemes[] }>(
      `/help-faqs/current/themes${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async search(
    q: string,
    params?: { faqId?: string; audience?: HelpFaqAudience },
  ) {
    const query = new URLSearchParams();
    query.set("q", q);
    if (params?.faqId) query.set("faqId", params.faqId);
    if (params?.audience) query.set("audience", params.audience);
    return apiFetch<{
      sources: HelpFaqSource[];
      items: Array<
        HelpFaqItem & {
          faqId: string;
          sourceKey: string;
          scopeType: "GLOBAL" | "SCHOOL";
          scopeLabel: string;
          schoolId: string | null;
          schoolName: string | null;
        }
      >;
    }>(`/help-faqs/current/search?${query.toString()}`, {}, true);
  },

  async listGlobalAdmin(params?: {
    audience?: HelpFaqAudience;
    status?: HelpPublicationStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.audience) query.set("audience", params.audience);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<{ items: HelpFaq[] }>(
      `/help-faqs/admin/global/faqs${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async listSchoolAdmin(params?: {
    audience?: HelpFaqAudience;
    status?: HelpPublicationStatus;
  }) {
    const query = new URLSearchParams();
    if (params?.audience) query.set("audience", params.audience);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return apiFetch<{ items: HelpFaq[] }>(
      `/help-faqs/admin/school/faqs${qs ? `?${qs}` : ""}`,
      {},
      true,
    );
  },

  async createGlobalFaq(payload: {
    title: string;
    audience: HelpFaqAudience;
    status?: HelpPublicationStatus;
    description?: string;
  }) {
    return apiFetch<HelpFaq>(
      "/help-faqs/admin/global/faqs",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async createSchoolFaq(payload: {
    title: string;
    audience: HelpFaqAudience;
    status?: HelpPublicationStatus;
    description?: string;
  }) {
    return apiFetch<HelpFaq>(
      "/help-faqs/admin/school/faqs",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateGlobalFaq(
    faqId: string,
    payload: Partial<{
      title: string;
      audience: HelpFaqAudience;
      status: HelpPublicationStatus;
      description: string;
    }>,
  ) {
    return apiFetch<HelpFaq>(
      `/help-faqs/admin/global/faqs/${faqId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateSchoolFaq(
    faqId: string,
    payload: Partial<{
      title: string;
      audience: HelpFaqAudience;
      status: HelpPublicationStatus;
      description: string;
    }>,
  ) {
    return apiFetch<HelpFaq>(
      `/help-faqs/admin/school/faqs/${faqId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async deleteGlobalFaq(faqId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-faqs/admin/global/faqs/${faqId}`,
      { method: "DELETE" },
      true,
    );
  },

  async deleteSchoolFaq(faqId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-faqs/admin/school/faqs/${faqId}`,
      { method: "DELETE" },
      true,
    );
  },

  async createGlobalTheme(
    faqId: string,
    payload: {
      title: string;
      orderIndex?: number;
      description?: string;
      status?: HelpPublicationStatus;
    },
  ) {
    return apiFetch<HelpFaqTheme>(
      `/help-faqs/admin/global/faqs/${faqId}/themes`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async createSchoolTheme(
    faqId: string,
    payload: {
      title: string;
      orderIndex?: number;
      description?: string;
      status?: HelpPublicationStatus;
    },
  ) {
    return apiFetch<HelpFaqTheme>(
      `/help-faqs/admin/school/faqs/${faqId}/themes`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateGlobalTheme(
    themeId: string,
    payload: Partial<{
      title: string;
      orderIndex: number;
      description: string;
      status: HelpPublicationStatus;
    }>,
  ) {
    return apiFetch<HelpFaqTheme>(
      `/help-faqs/admin/global/themes/${themeId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateSchoolTheme(
    themeId: string,
    payload: Partial<{
      title: string;
      orderIndex: number;
      description: string;
      status: HelpPublicationStatus;
    }>,
  ) {
    return apiFetch<HelpFaqTheme>(
      `/help-faqs/admin/school/themes/${themeId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async deleteGlobalTheme(themeId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-faqs/admin/global/themes/${themeId}`,
      { method: "DELETE" },
      true,
    );
  },

  async deleteSchoolTheme(themeId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-faqs/admin/school/themes/${themeId}`,
      { method: "DELETE" },
      true,
    );
  },

  async createGlobalItem(
    themeId: string,
    payload: {
      question: string;
      orderIndex?: number;
      answerHtml: string;
      answerJson?: Record<string, unknown>;
      status?: HelpPublicationStatus;
    },
  ) {
    return apiFetch<HelpFaqItem>(
      `/help-faqs/admin/global/themes/${themeId}/items`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async createSchoolItem(
    themeId: string,
    payload: {
      question: string;
      orderIndex?: number;
      answerHtml: string;
      answerJson?: Record<string, unknown>;
      status?: HelpPublicationStatus;
    },
  ) {
    return apiFetch<HelpFaqItem>(
      `/help-faqs/admin/school/themes/${themeId}/items`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateGlobalItem(
    itemId: string,
    payload: Partial<{
      question: string;
      orderIndex: number;
      answerHtml: string;
      answerJson: Record<string, unknown>;
      status: HelpPublicationStatus;
    }>,
  ) {
    return apiFetch<HelpFaqItem>(
      `/help-faqs/admin/global/items/${itemId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateSchoolItem(
    itemId: string,
    payload: Partial<{
      question: string;
      orderIndex: number;
      answerHtml: string;
      answerJson: Record<string, unknown>;
      status: HelpPublicationStatus;
    }>,
  ) {
    return apiFetch<HelpFaqItem>(
      `/help-faqs/admin/school/items/${itemId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async deleteGlobalItem(itemId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-faqs/admin/global/items/${itemId}`,
      { method: "DELETE" },
      true,
    );
  },

  async deleteSchoolItem(itemId: string) {
    return apiFetch<{ deleted: boolean }>(
      `/help-faqs/admin/school/items/${itemId}`,
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
      `${BASE_URL}/help-faqs/admin/uploads/inline-image`,
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
          : "FAQ_INLINE_UPLOAD_FAILED";
      throw new Error(message);
    }

    return (await response.json()) as { url: string };
  },
};
