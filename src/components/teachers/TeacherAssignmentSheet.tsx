import { z } from "zod";

export const teacherAssignmentFormSchema = z.object({
  schoolYearId: z.string().trim().min(1, "L'année scolaire est obligatoire."),
  teacherUserId: z.string().trim().min(1, "L'enseignant est obligatoire."),
  classId: z.string().trim().min(1, "La classe est obligatoire."),
  subjectId: z.string().trim().min(1, "La matière est obligatoire."),
});

export type TeacherAssignmentFormValues = z.infer<
  typeof teacherAssignmentFormSchema
>;
