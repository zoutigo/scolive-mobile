import { apiFetch } from "./client";
import type {
  CreateStudentAdmissionPayload,
  StudentAdmissionResult,
  UnassignedPoolEntry,
} from "../types/student-admissions.types";

function buildAdminPath(schoolSlug: string, path: string) {
  return `/schools/${schoolSlug}/admin/${path}`;
}

export const studentAdmissionsApi = {
  createAdmission(
    schoolSlug: string,
    payload: CreateStudentAdmissionPayload,
  ): Promise<StudentAdmissionResult> {
    return apiFetch(
      buildAdminPath(schoolSlug, "students/admissions"),
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  listUnassignedPool(
    schoolSlug: string,
    schoolYearId?: string,
  ): Promise<UnassignedPoolEntry[]> {
    const query = schoolYearId
      ? `?schoolYearId=${encodeURIComponent(schoolYearId)}`
      : "";
    return apiFetch(
      buildAdminPath(schoolSlug, `enrollments/pool${query}`),
      {},
      true,
    );
  },
};
