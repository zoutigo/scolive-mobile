import { apiFetch } from "./client";
import type {
  ClassroomAdminRow,
  CreateClassroomPayload,
  CreateEnrollmentPayload,
  EnrollmentRow,
  UpdateClassroomPayload,
} from "../types/classrooms.types";

function buildAdminPath(schoolSlug: string, path: string) {
  return `/schools/${schoolSlug}/admin/${path}`;
}

export const classroomsApi = {
  createClassroom(
    schoolSlug: string,
    payload: CreateClassroomPayload,
  ): Promise<ClassroomAdminRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, "classrooms"),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  getClassroom(
    schoolSlug: string,
    classId: string,
  ): Promise<ClassroomAdminRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, `classrooms/${classId}`),
      {},
      true,
    );
  },

  updateClassroom(
    schoolSlug: string,
    classId: string,
    payload: UpdateClassroomPayload,
  ): Promise<ClassroomAdminRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, `classrooms/${classId}`),
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  createEnrollment(
    schoolSlug: string,
    studentId: string,
    payload: CreateEnrollmentPayload,
  ): Promise<EnrollmentRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, `students/${studentId}/enrollments`),
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },
};
