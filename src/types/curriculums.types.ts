export type CurriculumLanguageSystem = "FRANCOPHONE" | "ANGLOPHONE" | "BILINGUAL";

export type CurriculumAcademicLevel = {
  id: string;
  code: string;
  label: string;
  order?: number | null;
  isNational?: boolean;
  isActivated?: boolean;
  languageSystem?: CurriculumLanguageSystem | null;
  _count?: {
    classes: number;
    curriculums: number;
  };
};

export type CurriculumTrack = {
  id: string;
  code: string;
  label: string;
  languageSystem?: CurriculumLanguageSystem | null;
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
    languageSystem?: CurriculumLanguageSystem | null;
  };
  track: {
    id: string;
    code: string;
    label: string;
    languageSystem?: CurriculumLanguageSystem | null;
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
  isNational: boolean;
  isCustomized: boolean;
};

export type CreateAcademicLevelPayload = {
  code: string;
  label: string;
};

export type UpdateAcademicLevelPayload = Partial<
  CreateAcademicLevelPayload & { order: number }
>;

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
