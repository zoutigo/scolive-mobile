export type TimetableSubjectRef = {
  id: string;
  name: string;
};

export type TimetableTeacherRef = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

export type TimetableSchoolYear = {
  id: string;
  label: string;
  isActive: boolean;
};

export type TimetableSubjectStyle = {
  subjectId: string;
  colorHex: string;
};

export type TimetableRecurringSlot = {
  id: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  room: string | null;
  activeFromDate?: string | null;
  activeToDate?: string | null;
  subject: TimetableSubjectRef;
  teacherUser: TimetableTeacherRef;
};

export type TimetableOneOffSlot = {
  id: string;
  occurrenceDate: string;
  startMinute: number;
  endMinute: number;
  room: string | null;
  status: "PLANNED" | "CANCELLED";
  sourceSlotId?: string | null;
  subject: TimetableSubjectRef;
  teacherUser: TimetableTeacherRef;
};

export type TimetableSlotException = {
  id: string;
  slotId: string;
  occurrenceDate: string;
  type: "OVERRIDE" | "CANCEL";
  startMinute?: number | null;
  endMinute?: number | null;
  room?: string | null;
  reason?: string | null;
  subject?: TimetableSubjectRef | null;
  teacherUser?: TimetableTeacherRef | null;
};

export type TimetableOccurrence = {
  id: string;
  source: "RECURRING" | "EXCEPTION_OVERRIDE" | "ONE_OFF";
  status: "PLANNED" | "CANCELLED";
  occurrenceDate: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  room: string | null;
  reason: string | null;
  subject: TimetableSubjectRef;
  teacherUser: TimetableTeacherRef;
  slotId?: string;
  exceptionId?: string;
  oneOffSlotId?: string;
};

export type TimetableCalendarEvent = {
  id: string;
  type: "HOLIDAY";
  scope: "SCHOOL" | "ACADEMIC_LEVEL" | "CLASS";
  label: string;
  startDate: string;
  endDate: string;
  schoolYearId: string;
  academicLevelId?: string | null;
  classId?: string | null;
};

export type TimetableClassSummary = {
  id: string;
  name: string;
  schoolYearId: string;
  academicLevelId: string | null;
};

export type TimetableStudentSummary = {
  id: string;
  firstName: string;
  lastName: string;
};

export type MyTimetableResponse = {
  student: TimetableStudentSummary;
  class: TimetableClassSummary;
  slots: TimetableRecurringSlot[];
  oneOffSlots: TimetableOneOffSlot[];
  slotExceptions: TimetableSlotException[];
  occurrences: TimetableOccurrence[];
  calendarEvents: TimetableCalendarEvent[];
  subjectStyles: TimetableSubjectStyle[];
};

export type ClassTimetableResponse = {
  class: Pick<TimetableClassSummary, "id" | "schoolYearId" | "academicLevelId">;
  slots: TimetableRecurringSlot[];
  oneOffSlots: TimetableOneOffSlot[];
  slotExceptions: TimetableSlotException[];
  occurrences: TimetableOccurrence[];
  calendarEvents: TimetableCalendarEvent[];
  subjectStyles: TimetableSubjectStyle[];
};

export type ClassTimetableContextResponse = {
  class: {
    id: string;
    name: string;
    schoolId: string;
    schoolYearId: string;
    academicLevelId: string | null;
    curriculumId: string | null;
    referentTeacherUserId: string | null;
  };
  allowedSubjects: TimetableSubjectRef[];
  assignments: Array<{
    teacherUserId: string;
    subjectId: string;
    subject: TimetableSubjectRef;
    teacherUser: TimetableTeacherRef;
  }>;
  subjectStyles: TimetableSubjectStyle[];
  schoolYears: TimetableSchoolYear[];
  selectedSchoolYearId: string | null;
};

export type TimetableClassOption = {
  classId: string;
  className: string;
  schoolYearId: string;
  schoolYearLabel: string;
  subjects: TimetableSubjectRef[];
  studentCount: number;
};

export type TimetableClassOptionsResponse = {
  schoolYears: TimetableSchoolYear[];
  selectedSchoolYearId: string | null;
  classes: TimetableClassOption[];
};

export type TimetableClassOptionsContext = {
  schoolYears: TimetableSchoolYear[];
  selectedSchoolYearId: string | null;
  assignments: Array<{
    classId: string;
    subjectId: string;
    className: string;
    subjectName: string;
    schoolYearId: string;
  }>;
  students: Array<{
    classId: string;
    className: string;
    studentId: string;
    studentFirstName: string;
    studentLastName: string;
  }>;
};

export type UpsertRecurringSlotInput = {
  schoolYearId?: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  subjectId: string;
  teacherUserId: string;
  room?: string | null;
  activeFromDate?: string | null;
  activeToDate?: string | null;
  effectiveFromDate?: string | null;
};

export type UpsertOneOffSlotInput = {
  schoolYearId?: string;
  occurrenceDate: string;
  startMinute: number;
  endMinute: number;
  subjectId: string;
  teacherUserId: string;
  room?: string | null;
  status?: "PLANNED" | "CANCELLED";
  sourceSlotId?: string | null;
};

export type UpsertCalendarEventInput = {
  schoolYearId: string;
  label: string;
  startDate: string;
  endDate: string;
  scope?: "SCHOOL" | "ACADEMIC_LEVEL" | "CLASS";
  classId?: string | null;
  academicLevelId?: string | null;
  type?: "HOLIDAY";
};
