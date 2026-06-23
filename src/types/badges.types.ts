export type BadgeScope = "NOTES" | "FEED" | "TICKETS" | "DISCIPLINE";

export type ChildBadgeSummary = {
  studentId: string;
  firstName: string;
  lastName: string;
  homeworkPending: number;
  notesUnread: number;
  disciplineUnread: number;
};

export type TeacherClassBadgeSummary = {
  classId: string;
  className: string;
  evaluationsToGrade: number;
};

export type UnreadSummary = {
  messagesUnread: number;
  feedUnread: number;
  ticketsNeedingResponse: number;
  ticketsUnreadReplies: number;
  children: ChildBadgeSummary[];
  teacherClasses: TeacherClassBadgeSummary[];
  total: number;
};
