export type NationalSubjectRow = {
  id: string;
  code: string;
  name: string;
  isNational: true;
  _count: {
    assignments: number;
    studentGrades: number;
    curriculumSubjects: number;
    classOverrides: number;
  };
};

export type CreateNationalSubjectPayload = {
  code: string;
  name: string;
};

export type UpdateNationalSubjectPayload =
  Partial<CreateNationalSubjectPayload>;

export type SchoolLanguageSystem = "FRANCOPHONE" | "ANGLOPHONE" | "BILINGUAL";

export type NationalCycleRow = {
  id: string;
  code: string;
  label: string;
  _count?: {
    academicLevels: number;
  };
};

export type CreateNationalCyclePayload = {
  code: string;
  label: string;
};

export type UpdateNationalCyclePayload = Partial<CreateNationalCyclePayload>;

export type NationalAcademicLevelRow = {
  id: string;
  code: string;
  label: string;
  cycleId: string | null;
  cycle: NationalCycleRow | null;
  languageSystem: SchoolLanguageSystem | null;
  isNational: true;
  _count?: {
    classes: number;
    curriculums: number;
  };
};

export type CreateNationalAcademicLevelPayload = {
  code: string;
  label: string;
  cycleId?: string;
  languageSystem?: SchoolLanguageSystem;
};

export type UpdateNationalAcademicLevelPayload =
  Partial<CreateNationalAcademicLevelPayload>;

export type NationalCurriculumRow = {
  id: string;
  name: string;
  academicLevelId: string;
  academicLevel: { id: string; code: string; label: string };
  isNational: true;
  _count: {
    classes: number;
    subjects: number;
  };
};

export type CreateNationalCurriculumPayload = {
  academicLevelId: string;
};

export type UpdateNationalCurriculumPayload =
  Partial<CreateNationalCurriculumPayload>;

export type NationalCurriculumSubjectRow = {
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

export type UpsertNationalCurriculumSubjectPayload = {
  subjectId: string;
  isMandatory?: boolean;
  coefficient?: number;
  weeklyHours?: number;
};
