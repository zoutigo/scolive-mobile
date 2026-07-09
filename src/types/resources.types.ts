export type ResourceKind = "ASSESSMENT" | "EXAM";
export type ResourceExamType = "SEQUENCE_TEST" | "POP_QUIZ" | "MOCK_EXAM";
export type ResourceApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ResourceSequence =
  | "SEQ_1"
  | "SEQ_2"
  | "SEQ_3"
  | "SEQ_4"
  | "SEQ_5"
  | "SEQ_6";

export type ResourceAttachment = {
  id?: string;
  part?: "STATEMENT" | "CORRECTION";
  fileName: string;
  fileUrl?: string | null;
  sizeLabel?: string | null;
  mimeType?: string | null;
};

export type ResourceRow = {
  id: string;
  kind: ResourceKind;
  schoolId: string | null;
  academicLevelId: string;
  subjectId: string;
  examType: ResourceExamType;
  sequence: ResourceSequence | null;
  academicYearLabel: string;
  title: string;
  authorUserId: string;
  statementStatus: ResourceApprovalStatus;
  correctionContent: string | null;
  correctionStatus: ResourceApprovalStatus;
  createdAt: string;
  updatedAt: string;
  school: { id: string; name: string } | null;
  academicLevel: { id: string; code: string; label: string };
  subject: { id: string; name: string };
  authorUser: { id: string; firstName: string; lastName: string };
  isFavorite?: boolean;
};

export type ResourceDetail = ResourceRow & {
  statementContent: string;
  attachments: ResourceAttachment[];
};

export type ResourceListQuery = {
  kind: ResourceKind;
  academicLevelId?: string;
  subjectId?: string;
  examType?: ResourceExamType;
  sequence?: ResourceSequence;
  schoolId?: string;
  academicYearLabel?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type ResourceListResult = {
  items: ResourceRow[];
  total: number;
  page: number;
  limit: number;
};

export type UpsertResourcePayload = {
  kind: ResourceKind;
  schoolId?: string;
  academicLevelId: string;
  subjectId: string;
  examType: ResourceExamType;
  sequence?: ResourceSequence;
  academicYearLabel: string;
  title: string;
  statementContent: string;
  statementAttachments?: ResourceAttachment[];
  correctionContent?: string;
  correctionAttachments?: ResourceAttachment[];
};

export type ResourceCatalog = {
  academicLevels: Array<{ id: string; code: string; label: string }>;
  subjects: Array<{ id: string; code: string | null; name: string }>;
};

export type ResourceSchoolOption = { id: string; name: string };

export type ListAdminResourcesQuery = {
  kind?: ResourceKind;
  part?: "statement" | "correction";
  status?: ResourceApprovalStatus;
  page?: number;
  limit?: number;
};
