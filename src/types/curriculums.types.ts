export type CurriculumAcademicLevel = {
  id: string;
  code: string;
  label: string;
  _count?: {
    classes: number;
    curriculums: number;
  };
};

export type CurriculumTrack = {
  id: string;
  code: string;
  label: string;
  _count?: {
    classes: number;
    curriculums: number;
  };
};

export type CurriculumSubjectCatalogItem = {
  id: string;
  name: string;
  branches?: Array<{
    id: string;
    name: string;
  }>;
  _count?: {
    assignments: number;
    studentGrades: number;
    curriculumSubjects: number;
    classOverrides: number;
  };
};

export type CurriculumRow = {
  id: string;
  name: string;
  academicLevelId: string;
  trackId: string | null;
  academicLevel: {
    id: string;
    code: string;
    label: string;
  };
  track: {
    id: string;
    code: string;
    label: string;
  } | null;
  _count: {
    classes: number;
    subjects: number;
  };
};

export type CurriculumSubjectRow = {
  id: string;
  subjectId: string;
  isMandatory: boolean;
  coefficient: number | null;
  weeklyHours: number | null;
  subject: {
    id: string;
    name: string;
  };
};

export type CreateAcademicLevelPayload = {
  code: string;
  label: string;
};

export type UpdateAcademicLevelPayload = Partial<CreateAcademicLevelPayload>;

export type CreateTrackPayload = {
  code: string;
  label: string;
};

export type UpdateTrackPayload = Partial<CreateTrackPayload>;

export type CreateCurriculumPayload = {
  academicLevelId: string;
  trackId?: string;
};

export type UpdateCurriculumPayload = Partial<CreateCurriculumPayload>;

export type UpsertCurriculumSubjectPayload = {
  subjectId: string;
  isMandatory?: boolean;
  coefficient?: number;
  weeklyHours?: number;
};

export type CreateSubjectPayload = {
  name: string;
};
