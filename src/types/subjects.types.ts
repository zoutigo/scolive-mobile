export type SubjectBranch = {
  id: string;
  subjectId: string;
  name: string;
  code: string | null;
};

export type SubjectCurriculumAssignment = {
  id: string;
  curriculumId: string;
  isMandatory: boolean;
  coefficient: number | null;
  weeklyHours: number | null;
  curriculum: {
    id: string;
    name: string;
    academicLevel: { id: string; code: string; label: string };
    track: { id: string; code: string; label: string } | null;
  };
};

export type SubjectRow = {
  id: string;
  schoolId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  branches: SubjectBranch[];
  curriculumSubjects: SubjectCurriculumAssignment[];
  _count: {
    assignments: number;
    studentGrades: number;
    curriculumSubjects: number;
    classOverrides: number;
  };
};

export type SubjectPayload = {
  name?: string;
};

export type SubjectBranchPayload = {
  name?: string;
  code?: string;
};
