import { apiFetch } from "./client";
import type {
  AddSchoolAdminPayload,
  AddSchoolAdminResult,
  CreateSchoolPayload,
  CreateSchoolResult,
  SchoolDetails,
  SchoolRow,
  UpdateSchoolPayload,
} from "../types/schools.types";

export const schoolsApi = {
  listSchools(): Promise<SchoolRow[]> {
    return apiFetch("/system/schools", {}, true);
  },

  getSchoolDetails(schoolId: string): Promise<SchoolDetails> {
    return apiFetch(`/system/schools/${schoolId}`, {}, true);
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

  resendSchoolAdminInvite(
    schoolId: string,
    adminUserId: string,
  ): Promise<{ success: boolean }> {
    return apiFetch(
      `/system/schools/${schoolId}/admins/${adminUserId}/resend-invite`,
      { method: "POST" },
      true,
    );
  },
};
