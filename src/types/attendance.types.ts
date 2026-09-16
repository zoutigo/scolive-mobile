export type AttendanceStudent = {
  id: string;
  firstName: string;
  lastName: string;
  present: boolean;
};

export type AttendanceRoster = {
  classId: string;
  className: string;
  date: string;
  students: AttendanceStudent[];
};
