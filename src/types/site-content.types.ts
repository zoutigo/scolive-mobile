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

export type LegalDocumentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface LegalDocumentItem {
  id: string;
  slug: LegalDocumentSlug;
  locale: SiteContentLocale;
  version: number;
  title: string;
  contentHtml: string;
  status: LegalDocumentStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
