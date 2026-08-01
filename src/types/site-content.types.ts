export type LegalDocumentSlug = "cgu" | "mentions-legales" | "confidentialite";
export type SiteContentLocale = "fr" | "en";

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

export interface PublicLegalDocument {
  slug: string;
  locale: string;
  title: string;
  contentHtml: string;
  updatedAt: string;
}
