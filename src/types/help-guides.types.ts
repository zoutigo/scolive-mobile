export type HelpGuideAudience =
  | "PARENT"
  | "TEACHER"
  | "STUDENT"
  | "SCHOOL_ADMIN"
  | "STAFF";

export type HelpPublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type HelpContentType = "RICH_TEXT" | "VIDEO";

export interface HelpGuideItem {
  id: string;
  schoolId: string | null;
  audience: HelpGuideAudience;
  title: string;
  slug: string;
  description: string | null;
  status: HelpPublicationStatus;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HelpPlanNode {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  orderIndex: number;
  depth: number;
  contentType: HelpContentType;
  status: HelpPublicationStatus;
  children: HelpPlanNode[];
}

export interface HelpChapterItem {
  id: string;
  guideId: string;
  parentId: string | null;
  orderIndex: number;
  title: string;
  slug: string;
  summary: string | null;
  contentType: HelpContentType;
  contentHtml: string | null;
  contentJson: Record<string, unknown> | null;
  videoUrl: string | null;
  contentText: string;
  status: HelpPublicationStatus;
  createdAt: string;
  updatedAt: string;
  breadcrumb?: string[];
}

export interface CurrentGuideResponse {
  canManage: boolean;
  guide: HelpGuideItem | null;
  resolvedAudience: HelpGuideAudience;
}
