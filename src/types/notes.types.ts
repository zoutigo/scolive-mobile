import type {
  TimetableClassOption,
  TimetableClassOptionsContext,
  TimetableSchoolYear,
} from "./timetable.types";

export type StudentNotesTerm = "TERM_1" | "TERM_2" | "TERM_3";

export type StudentNotesView = "evaluations" | "averages" | "charts";

export type StudentEvaluationStatus =
  | "ENTERED"
  | "ABSENT"
  | "EXCUSED"
  | "NOT_GRADED";

export type StudentEvaluation = {
  id: string;
  label: string;
  score: number | null;
  maxScore: number;
  weight?: number;
  recordedAt: string;
  status?: StudentEvaluationStatus;
};

export type StudentSubjectNotes = {
  id: string;
  subjectLabel: string;
  teachers: string[];
  coefficient: number;
  studentAverage: number | null;
  classAverage: number | null;
  classMin: number | null;
  classMax: number | null;
  appreciation?: string | null;
  evaluations: StudentEvaluation[];
};

export type StudentNotesTermSnapshot = {
  term: StudentNotesTerm;
  label: string;
  councilLabel: string;
  generatedAtLabel: string;
  generalAverage: {
    student: number | null;
    class: number | null;
    min: number | null;
    max: number | null;
  };
  subjects: StudentSubjectNotes[];
};

export type StudentNotesResponse = StudentNotesTermSnapshot[];

export type EvaluationAttachmentDraft = {
  id?: string;
  fileName: string;
  fileUrl?: string | null;
  sizeLabel?: string | null;
  mimeType?: string | null;
};

export type NotesTeacherContext = {
  class: {
    id: string;
    name: string;
    schoolYearId: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    branches: Array<{ id: string; name: string; code?: string | null }>;
  }>;
  evaluationTypes: Array<{
    id: string;
    code: string;
    label: string;
    isDefault: boolean;
  }>;
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
};

export type EvaluationRow = {
  id: string;
  title: string;
  description?: string | null;
  coefficient: number;
  maxScore: number;
  term: StudentNotesTerm;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  subject: { id: string; name: string };
  subjectBranch?: { id: string; name: string } | null;
  evaluationType: { id: string; code: string; label: string };
  attachments: EvaluationAttachmentDraft[];
  _count: { scores: number };
};

export type EvaluationStudentScore = {
  id: string;
  firstName: string;
  lastName: string;
  score: number | null;
  scoreStatus: StudentEvaluationStatus;
  comment?: string | null;
};

export type EvaluationDetail = EvaluationRow & {
  students: EvaluationStudentScore[];
};

export type TermReportStudentEntry = {
  studentId: string;
  firstName: string;
  lastName: string;
  generalAppreciation?: string | null;
  subjects: Array<{
    subjectId: string;
    appreciation: string;
  }>;
};

export type TermReport = {
  term: StudentNotesTerm;
  status: "DRAFT" | "PUBLISHED";
  councilHeldAt?: string | null;
  students: TermReportStudentEntry[];
};

export type NotesClassOptionsContext = TimetableClassOptionsContext;

export type NotesClassOption = TimetableClassOption;

export type NotesClassOptionsResponse = {
  schoolYears: TimetableSchoolYear[];
  selectedSchoolYearId: string | null;
  classes: NotesClassOption[];
};

export type UpsertEvaluationPayload = {
  subjectId: string;
  subjectBranchId?: string;
  evaluationTypeId: string;
  title: string;
  description?: string;
  coefficient: number;
  maxScore: number;
  term: StudentNotesTerm;
  scheduledAt: string;
  status: "DRAFT" | "PUBLISHED";
  attachments?: EvaluationAttachmentDraft[];
};

export type UpsertEvaluationScorePayload = {
  scores: Array<{
    studentId: string;
    score?: number | null;
    comment?: string | null;
    status: StudentEvaluationStatus;
  }>;
};

export type UpsertTermReportsPayload = {
  status: "DRAFT" | "PUBLISHED";
  councilHeldAt?: string | null;
  students: Array<{
    studentId: string;
    generalAppreciation?: string | null;
    subjects: Array<{
      subjectId: string;
      appreciation: string;
    }>;
  }>;
};
