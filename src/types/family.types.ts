export type ParentChild = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  className?: string | null;
  classId?: string | null;
  currentEnrollment?: {
    class?: {
      id?: string | null;
      name?: string | null;
    } | null;
  } | null;
};

export type ParentMeResponse = {
  linkedStudents?: ParentChild[];
};
