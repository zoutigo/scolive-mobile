export type ResourceKind = "ASSESSMENT" | "EXAM";
export type ResourceExamType = "SEQUENCE_TEST" | "POP_QUIZ" | "MOCK_EXAM";
export type ResourceApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ResourcePart = "statement" | "correction";
export type ResourceSubmissionStatus =
  | "DRAFT"
  | "AWAITING"
  | "APPROVED"
  | "REJECTED"
  | "DISCARDED";
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
  trackId: string | null;
  subjectId: string;
  examType: ResourceExamType;
  sequence: ResourceSequence | null;
  academicYearLabel: string;
  title: string;
  authorUserId: string;
  statementContent: string | null;
  statementStatus: ResourceApprovalStatus;
  correctionContent: string | null;
  correctionStatus: ResourceApprovalStatus;
  createdAt: string;
  updatedAt: string;
  school: { id: string; name: string } | null;
  academicLevel: { id: string; code: string; label: string };
  track: { id: string; code: string; label: string } | null;
  subject: { id: string; name: string };
  authorUser: { id: string; firstName: string; lastName: string };
  isFavorite?: boolean;
};

export type ResourceDetail = ResourceRow & {
  attachments: ResourceAttachment[];
};

export type ResourceListQuery = {
  kind: ResourceKind;
  academicLevelId?: string;
  trackId?: string;
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
  trackId?: string;
  subjectId: string;
  examType: ResourceExamType;
  sequence?: ResourceSequence;
  academicYearLabel: string;
  title: string;
  confirmDuplicate?: boolean;
};

export type ResourceDuplicateCandidate = {
  id: string;
  title: string;
  score: number;
};

export type ResourceDuplicateWarning = {
  warning: true;
  candidates: ResourceDuplicateCandidate[];
};

export type SaveSubmissionDraftPayload = {
  content: string;
  attachments?: ResourceAttachment[];
};

export type ResourceSubmission = {
  id: string;
  resourceId: string;
  part: "STATEMENT" | "CORRECTION";
  status: ResourceSubmissionStatus;
  content: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  authorUser: { id: string; firstName: string; lastName: string };
  attachments: ResourceAttachment[];
};

export type ResourceAdminSubmission = ResourceSubmission & {
  resource: {
    id: string;
    kind: ResourceKind;
    title: string;
    examType: ResourceExamType;
    sequence: ResourceSequence | null;
    academicYearLabel: string;
    school: { id: string; name: string } | null;
    academicLevel: { id: string; label: string };
    subject: { id: string; name: string };
  };
};

export type ResourceCatalog = {
  cycles: Array<{ id: string; code: string; label: string }>;
  academicLevels: Array<{
    id: string;
    code: string;
    label: string;
    cycleId: string | null;
  }>;
  tracks: Array<{ id: string; code: string; label: string }>;
  curriculums: Array<{
    id: string;
    academicLevelId: string;
    trackId: string | null;
  }>;
  curriculumSubjects: Array<{ curriculumId: string; subjectId: string }>;
  subjects: Array<{ id: string; code: string | null; name: string }>;
};

export type ResourceSchoolOption = { id: string; name: string };

export type ListAdminResourcesQuery = {
  kind?: ResourceKind;
  part?: ResourcePart;
  status?: ResourceSubmissionStatus;
  page?: number;
  limit?: number;
};

export type ListAdminSubmissionsResult = {
  items: ResourceAdminSubmission[];
  total: number;
  page: number;
  limit: number;
};
