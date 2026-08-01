import { apiFetch } from "./client";
import type {
  ContactInfo,
  LegalDocumentSlug,
  PublicLegalDocument,
  SiteContentLocale,
} from "../types/site-content.types";

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
};
