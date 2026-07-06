export interface SchoolDashboardKpis {
  academicYear: { id: string; label: string } | null;
  classesCount: number;
  studentsCount: number;
  teachersCount: number;
  subjectsCount: number;
  parentsCount: number;
  roomsCount: number;
}
