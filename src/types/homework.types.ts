export type HomeworkAttachment = {
  id?: string;
  fileName: string;
  fileUrl?: string | null;
  sizeLabel?: string | null;
  mimeType?: string | null;
};

export type HomeworkComment = {
  id: string;
  authorUserId: string;
  authorDisplayName: string;
  authorRole?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  mine?: boolean;
};

export type HomeworkCompletionStatus = {
  studentId: string;
  firstName: string;
  lastName: string;
  doneAt?: string | null;
};

export type HomeworkSummary = {
  totalStudents: number;
  doneStudents: number;
  pendingStudents: number;
};

export type HomeworkRow = {
  id: string;
  classId: string;
  title: string;
  contentHtml?: string | null;
  expectedAt: string;
  createdAt: string;
  updatedAt: string;
  authorUserId: string;
  authorDisplayName: string;
  subject: {
    id: string;
    name: string;
    colorHex?: string | null;
  };
  attachments: HomeworkAttachment[];
  commentsCount: number;
  summary?: HomeworkSummary | null;
  myDoneAt?: string | null;
};

export type HomeworkDetail = HomeworkRow & {
  comments: HomeworkComment[];
  completionStatuses: HomeworkCompletionStatus[];
};

export type HomeworkListQuery = {
  fromDate?: string;
  toDate?: string;
  studentId?: string;
};

export type HomeworkCommentPayload = {
  body: string;
  studentId?: string;
};

export type HomeworkCompletionPayload = {
  done: boolean;
  studentId?: string;
};

export type UpsertHomeworkPayload = {
  subjectId: string;
  title: string;
  contentHtml?: string;
  expectedAt: string;
  attachments?: HomeworkAttachment[];
};
