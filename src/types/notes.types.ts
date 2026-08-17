import type {
  TimetableClassOption,
  TimetableClassOptionsContext,
  TimetableSchoolYear,
} from "./timetable.types";

export type StudentNotesTerm = "TERM_1" | "TERM_2" | "TERM_3";
/** Term réel (persisté / envoyé à l'API) ou synthèse annuelle calculée côté client. */
export type StudentNotesTermOrYearly = StudentNotesTerm | "YEARLY";
export type StudentNotesSequence =
  | "SEQ_1"
  | "SEQ_2"
  | "SEQ_3"
  | "SEQ_4"
  | "SEQ_5"
  | "SEQ_6";

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
  countsForAverage?: boolean;
  isFinalExam?: boolean;
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
  /** Rang de l'élève dans la matière pour la période (1 = meilleure moyenne). */
  rank?: number | null;
  /** Nombre d'élèves ayant une moyenne dans la matière pour la période. */
  classSize?: number | null;
  appreciation?: string | null;
  evaluations: StudentEvaluation[];
};

export type StudentNotesSequenceSnapshot = {
  sequence: StudentNotesSequence;
  sequenceLabel: string;
  isFirstSeq: boolean;
  generalAverage: {
    student: number | null;
    class: number | null;
    min: number | null;
    max: number | null;
  };
  subjects: StudentSubjectNotes[];
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
  sequences: StudentNotesSequenceSnapshot[];
  subjects: StudentSubjectNotes[];
};

export type StudentNotesResponse = StudentNotesTermSnapshot[];

/**
 * Synthèse annuelle : calculée côté client à partir des 3 bulletins de
 * trimestre déjà chargés (jamais persistée, jamais éditable) — voir
 * `computeYearlySnapshot` dans `utils/notes.ts`.
 */
export type YearlySubjectNotes = StudentSubjectNotes & {
  termAverages: Partial<Record<StudentNotesTerm, number | null>>;
};

export type YearlyNotesSnapshot = {
  term: "YEARLY";
  label: string;
  councilLabel: string;
  generatedAtLabel: string;
  generalAverage: {
    student: number | null;
    class: number | null;
    min: number | null;
    max: number | null;
  };
  subjects: YearlySubjectNotes[];
};

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
    /** true si l'utilisateur courant est l'enseignant référent de cette classe. */
    isReferentTeacher: boolean;
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
  sequence: StudentNotesSequence;
  isFinalExam: boolean;
  countsForAverage: boolean;
  term: StudentNotesTerm;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  subject: { id: string; name: string };
  subjectBranch?: { id: string; name: string } | null;
  evaluationType: { id: string; code: string; label: string };
  class: { id: string; name: string; studentsCount?: number };
  author: { id: string; firstName: string; lastName: string };
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
  sequence: StudentNotesSequence;
  isFinalExam?: boolean;
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

export type CouncilDrafts = Record<
  string,
  {
    generalAppreciation: string;
    subjects: Record<string, string>;
  }
>;

export type UpsertTermReportsPayload = {
  status: "DRAFT" | "PUBLISHED";
  councilHeldAt?: string | null;
  reports: Array<{
    studentId: string;
    generalAppreciation?: string | null;
    subjects: Array<{
      subjectId: string;
      appreciation: string;
    }>;
  }>;
};
