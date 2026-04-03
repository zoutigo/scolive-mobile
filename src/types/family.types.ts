export type ParentChild = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

export type ParentMeResponse = {
  linkedStudents?: ParentChild[];
};
