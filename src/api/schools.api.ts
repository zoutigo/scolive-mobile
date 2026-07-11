import { apiFetch } from "./client";
import type {
  AddSchoolAdminPayload,
  AddSchoolAdminResult,
  CreateSchoolPayload,
  CreateSchoolResult,
  SchoolRow,
  UpdateSchoolPayload,
} from "../types/schools.types";

export const schoolsApi = {
  listSchools(): Promise<SchoolRow[]> {
    return apiFetch("/system/schools", {}, true);
  },

  createSchool(payload: CreateSchoolPayload): Promise<CreateSchoolResult> {
    return apiFetch(
      "/system/schools",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  updateSchool(
    schoolId: string,
    payload: UpdateSchoolPayload,
  ): Promise<SchoolRow> {
    return apiFetch(
      `/system/schools/${schoolId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteSchool(schoolId: string) {
    return apiFetch(`/system/schools/${schoolId}`, { method: "DELETE" }, true);
  },

  addSchoolAdmin(
    schoolId: string,
    payload: AddSchoolAdminPayload,
  ): Promise<AddSchoolAdminResult> {
    return apiFetch(
      `/system/schools/${schoolId}/admins`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },
};
