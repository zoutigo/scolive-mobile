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

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  classId: string;
  email?: string;
  password?: string;
}

export interface CreateStudentResponse {
  id: string;
  user?: { id: string } | null;
}

export interface CreateParentPayload {
  studentId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  pin?: string;
}

export interface CreateParentResponse {
  parentUserId: string;
  studentId: string;
}

export const familyApi = {
  getParentMe(schoolSlug: string): Promise<{ linkedStudents?: ParentChild[] }> {
    return apiFetch(`/schools/${schoolSlug}/me`, {}, true);
  },

  async listAdminStudents(
    schoolSlug: string,
    params: {
      search?: string;
      page?: number;
      limit?: number;
      classId?: string;
      status?: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "GRADUATED";
    } = {},
  ): Promise<AdminStudentsPage> {
    const q = new URLSearchParams();
    if (params.search?.trim()) q.set("search", params.search.trim());
    q.set("page", String(params.page ?? 1));
    q.set("limit", String(params.limit ?? 20));
    if (params.classId) q.set("classId", params.classId);
    if (params.status) q.set("status", params.status);
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

  async createStudent(
    schoolSlug: string,
    payload: CreateStudentPayload,
  ): Promise<CreateStudentResponse> {
    const raw = await apiFetch<{
      id?: string;
      user?: { id: string };
      student?: { id: string };
    }>(
      `/schools/${schoolSlug}/admin/students`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
    if (raw.student) {
      return { id: raw.student.id, user: raw.user ?? null };
    }
    return { id: raw.id!, user: raw.user ?? null };
  },

  async createParent(
    schoolSlug: string,
    payload: CreateParentPayload,
  ): Promise<CreateParentResponse> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/parent-students`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },
};
