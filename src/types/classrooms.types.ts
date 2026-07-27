export type CreateClassroomPayload = {
  name: string;
  schoolYearId?: string;
  academicLevelId?: string;
  trackId?: string;
  referentTeacherUserId?: string;
  curriculumId: string;
  capacity?: number;
};

export type ClassroomAdminRow = {
  id: string;
  name: string;
  capacity: number | null;
  schoolYear: { id: string; label: string };
  academicLevel: { id: string; code: string; label: string } | null;
  track: { id: string; code: string; label: string } | null;
  curriculum: { id: string; name: string } | null;
  referentTeacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  _count?: { enrollments: number };
};

export type UpdateClassroomPayload = Partial<CreateClassroomPayload>;

export type CreateEnrollmentPayload = {
  classId: string;
  status?: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "GRADUATED";
};

export type EnrollmentRow = {
  id: string;
  schoolYearId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  schoolYear: { id: string; label: string };
  class: { id: string; name: string };
};
