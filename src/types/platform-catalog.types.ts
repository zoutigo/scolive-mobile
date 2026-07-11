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

export type NationalAcademicLevelRow = {
  id: string;
  code: string;
  label: string;
  isNational: true;
  _count?: {
    classes: number;
    curriculums: number;
  };
};

export type CreateNationalAcademicLevelPayload = {
  code: string;
  label: string;
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
