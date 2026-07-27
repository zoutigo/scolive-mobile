import { apiFetch } from "./client";
import type {
  ClassroomAdminRow,
  CreateClassroomPayload,
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
};
