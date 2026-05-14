import { apiFetch } from "./client";
import type {
  CreateTeacherPayload,
  TeacherAssignmentPayload,
  TeacherAssignmentRow,
  TeacherClassroomOption,
  TeacherRow,
  TeacherSchoolYearOption,
  TeacherSubjectOption,
} from "../types/teachers.types";

function buildAdminPath(schoolSlug: string, path: string) {
  return `/schools/${schoolSlug}/admin/${path}`;
}

export const teachersApi = {
  listTeachers(schoolSlug: string): Promise<TeacherRow[]> {
    return apiFetch(buildAdminPath(schoolSlug, "teachers"), {}, true);
  },

  createTeacher(
    schoolSlug: string,
    payload: CreateTeacherPayload,
  ): Promise<unknown> {
    return apiFetch(
      buildAdminPath(schoolSlug, "teachers"),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  listSchoolYears(schoolSlug: string): Promise<TeacherSchoolYearOption[]> {
    return apiFetch(buildAdminPath(schoolSlug, "school-years"), {}, true);
  },

  listClassrooms(schoolSlug: string): Promise<TeacherClassroomOption[]> {
    return apiFetch(buildAdminPath(schoolSlug, "classrooms"), {}, true);
  },

  listSubjects(schoolSlug: string): Promise<TeacherSubjectOption[]> {
    return apiFetch(buildAdminPath(schoolSlug, "subjects"), {}, true);
  },

  listAssignments(schoolSlug: string): Promise<TeacherAssignmentRow[]> {
    return apiFetch(
      buildAdminPath(schoolSlug, "teacher-assignments"),
      {},
      true,
    );
  },

  createAssignment(
    schoolSlug: string,
    payload: TeacherAssignmentPayload,
  ): Promise<TeacherAssignmentRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, "teacher-assignments"),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateAssignment(
    schoolSlug: string,
    assignmentId: string,
    payload: TeacherAssignmentPayload,
  ): Promise<TeacherAssignmentRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, `teacher-assignments/${assignmentId}`),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteAssignment(schoolSlug: string, assignmentId: string) {
    return apiFetch(
      buildAdminPath(schoolSlug, `teacher-assignments/${assignmentId}`),
      {
        method: "DELETE",
      },
      true,
    );
  },
};
