export type TeacherRow = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone?: string | null;
};

export type TeacherSchoolYearOption = {
  id: string;
  label: string;
  isActive: boolean;
};

export type TeacherClassroomOption = {
  id: string;
  name: string;
  schoolYear: {
    id: string;
    label: string;
  };
};

export type TeacherSubjectOption = {
  id: string;
  name: string;
};

export type TeacherAssignmentRow = {
  id: string;
  schoolYearId: string;
  teacherUserId: string;
  classId: string;
  subjectId: string;
  createdAt: string;
  schoolYear: {
    id: string;
    label: string;
  };
  teacherUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
};

export type CreateTeacherByPhonePayload = {
  phone: string;
  pin: string;
};

export type CreateTeacherByEmailPayload = {
  email: string;
  password: string;
};

export type CreateTeacherPayload =
  | CreateTeacherByPhonePayload
  | CreateTeacherByEmailPayload;

export type TeacherAssignmentPayload = {
  schoolYearId: string;
  teacherUserId: string;
  classId: string;
  subjectId: string;
};
