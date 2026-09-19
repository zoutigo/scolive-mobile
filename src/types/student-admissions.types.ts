export type CreateStudentAdmissionPayload = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  academicLevelId: string;
  trackId?: string;
  schoolYearId?: string;
};

export type StudentAdmissionResult = {
  student: { id: string; firstName: string; lastName: string };
  admission: {
    id: string;
    schoolYearId: string;
    academicLevelId: string;
    trackId: string | null;
  };
};

export type UnassignedPoolEntry = {
  id: string;
  studentId: string;
  confirmedAt: string | null;
  confirmationSource: string | null;
  student: { id: string; firstName: string; lastName: string };
  academicLevel: { id: string; label: string; code: string } | null;
  track: { id: string; label: string; code: string } | null;
};
