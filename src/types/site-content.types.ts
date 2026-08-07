export type LegalDocumentSlug = "cgu" | "mentions-legales" | "confidentialite";
export type SiteContentLocale = "fr" | "en";

export interface ContactInfo {
  email: string;
  phone: string;
  addressStreet: string;
  addressDistrict: string;
  addressCity: string;
  addressCountry: string;
  legalRepresentativeFirstName: string;
  legalRepresentativeLastName: string;
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

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  readAt: string | null;
  readById: string | null;
  createdAt: string;
}

export interface ContactSubmissionsPage {
  items: ContactSubmission[];
  total: number;
  page: number;
  limit: number;
}
