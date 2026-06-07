import { apiFetch } from "./client";
import type { ParentChild } from "../types/family.types";

export interface AdminStudentRow {
  id: string;
  firstName: string;
  lastName: string;
  currentEnrollment: {
    id: string;
    class: { id: string; name: string };
    schoolYear: { id: string; label: string };
  } | null;
}

export interface AdminStudentsPage {
  students: AdminStudentRow[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface LinkExistingParentPayload {
  studentId: string;
  parentUserId: string;
}

export const familyApi = {
  getParentMe(schoolSlug: string): Promise<{ linkedStudents?: ParentChild[] }> {
    return apiFetch(`/schools/${schoolSlug}/me`, {}, true);
  },

  async listAdminStudents(
    schoolSlug: string,
    params: { search?: string; page?: number } = {},
  ): Promise<AdminStudentsPage> {
    const q = new URLSearchParams();
    if (params.search?.trim()) q.set("search", params.search.trim());
    q.set("page", String(params.page ?? 1));
    q.set("limit", "20");
    return apiFetch(
      `/schools/${schoolSlug}/admin/students?${q.toString()}`,
      {},
      true,
    );
  },

  async linkExistingParent(
    schoolSlug: string,
    payload: LinkExistingParentPayload,
  ): Promise<void> {
    await apiFetch(
      `/schools/${schoolSlug}/admin/parent-students`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },
};
