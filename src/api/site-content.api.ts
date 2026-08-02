import { apiFetch } from "./client";
import type {
  ContactInfo,
  ContactSubmission,
  ContactSubmissionsPage,
  LegalDocumentItem,
  LegalDocumentSlug,
  PublicLegalDocument,
  SiteContentLocale,
} from "../types/site-content.types";

export function formatContactAddress(contact: ContactInfo): string {
  return [
    contact.addressStreet,
    contact.addressDistrict,
    contact.addressCity,
    contact.addressCountry,
  ]
    .filter((part) => part.trim().length > 0)
    .join(", ");
}

export const siteContentApi = {
  async getContactInfo() {
    return apiFetch<ContactInfo>("/public/site-content/contact", {}, false);
  },

  async getLegalDocument(slug: LegalDocumentSlug, locale: SiteContentLocale) {
    return apiFetch<PublicLegalDocument>(
      `/public/site-content/legal/${slug}/${locale}`,
      {},
      false,
    );
  },

  async getAdminContactInfo() {
    return apiFetch<ContactInfo>("/site-content/admin/contact", {}, true);
  },

  async updateContactInfo(payload: ContactInfo) {
    return apiFetch<ContactInfo>(
      "/site-content/admin/contact",
      { method: "PUT", body: JSON.stringify(payload) },
      true,
    );
  },

  async listLegalDocuments(params: {
    slug: LegalDocumentSlug;
    locale: SiteContentLocale;
  }) {
    const query = new URLSearchParams(params).toString();
    return apiFetch<LegalDocumentItem[]>(
      `/site-content/admin/legal-documents?${query}`,
      {},
      true,
    );
  },

  async createLegalDocument(payload: {
    slug: LegalDocumentSlug;
    locale: SiteContentLocale;
    title: string;
    contentHtml: string;
  }) {
    return apiFetch<LegalDocumentItem>(
      "/site-content/admin/legal-documents",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  async updateLegalDocument(
    id: string,
    payload: { title: string; contentHtml: string },
  ) {
    return apiFetch<LegalDocumentItem>(
      `/site-content/admin/legal-documents/${id}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async publishLegalDocument(id: string) {
    return apiFetch<LegalDocumentItem>(
      `/site-content/admin/legal-documents/${id}/publish`,
      { method: "POST" },
      true,
    );
  },

  async deleteLegalDocument(id: string) {
    return apiFetch<void>(
      `/site-content/admin/legal-documents/${id}`,
      { method: "DELETE" },
      true,
    );
  },

  async listContactSubmissions(params: { page: number; limit: number }) {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    }).toString();
    return apiFetch<ContactSubmissionsPage>(
      `/site-content/admin/contact-submissions?${query}`,
      {},
      true,
    );
  },

  async getContactSubmission(id: string) {
    return apiFetch<ContactSubmission>(
      `/site-content/admin/contact-submissions/${id}`,
      {},
      true,
    );
  },
};
