import { apiFetch } from "./client";
import type {
  AddSchoolAdminPayload,
  AddSchoolAdminResult,
  CreateSchoolPayload,
  CreateSchoolResult,
  SchoolDetails,
  SchoolRow,
  SchoolsListParams,
  SchoolsListResult,
  SchoolsOverview,
  UpdateSchoolPayload,
} from "../types/schools.types";

const SCHOOLS_PAGE_LIMIT = 20;

function buildSchoolsQuery(params: SchoolsListParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.cycle) q.set("cycle", params.cycle);
  if (params.languageSystem) q.set("languageSystem", params.languageSystem);
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? SCHOOLS_PAGE_LIMIT));
  return `?${q.toString()}`;
}

export const schoolsApi = {
  listSchools(params: SchoolsListParams = {}): Promise<SchoolsListResult> {
    const query = buildSchoolsQuery(params);
    return apiFetch(`/system/schools${query}`, {}, true);
  },

  getSchoolsOverview(): Promise<SchoolsOverview> {
    return apiFetch("/system/schools/overview", {}, true);
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

  removeSchoolAdmin(
    schoolId: string,
    adminUserId: string,
  ): Promise<{ success: boolean }> {
    return apiFetch(
      `/system/schools/${schoolId}/admins/${adminUserId}`,
      { method: "DELETE" },
      true,
    );
  },
};
