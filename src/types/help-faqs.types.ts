export type HelpFaqAudience =
  | "PARENT"
  | "TEACHER"
  | "STUDENT"
  | "SCHOOL_ADMIN"
  | "STAFF";

export type HelpPublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface HelpFaqItem {
  id: string;
  themeId: string;
  orderIndex: number;
  question: string;
  answerHtml: string;
  answerJson: Record<string, unknown> | null;
  answerText: string;
  status: HelpPublicationStatus;
  createdAt: string;
  updatedAt: string;
  themeTitle?: string;
}

export interface HelpFaqTheme {
  id: string;
  faqId: string;
  orderIndex: number;
  title: string;
  slug: string;
  description: string | null;
  status: HelpPublicationStatus;
  createdAt: string;
  updatedAt: string;
  items: HelpFaqItem[];
}

export interface HelpFaq {
  id: string;
  schoolId: string | null;
  schoolName: string | null;
  audience: HelpFaqAudience;
  title: string;
  slug: string;
  description: string | null;
  status: HelpPublicationStatus;
  themeCount: number;
  createdAt: string;
  updatedAt: string;
}

export type HelpFaqScopeType = "GLOBAL" | "SCHOOL";

export interface HelpFaqSource {
  key: string;
  scopeType: HelpFaqScopeType;
  scopeLabel: string;
  schoolId: string | null;
  schoolName: string | null;
  faq: HelpFaq;
}

export interface HelpFaqSourceWithThemes extends HelpFaqSource {
  themes: HelpFaqTheme[];
}

export interface CurrentHelpFaqResponse {
  permissions: {
    canManageGlobal: boolean;
    canManageSchool: boolean;
  };
  schoolScope: {
    schoolId: string;
    schoolName: string;
  } | null;
  sources: HelpFaqSource[];
  defaultSourceKey: string | null;
  resolvedAudience: HelpFaqAudience;
}
