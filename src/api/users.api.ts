import { apiFetch } from "./client";
import type {
  PaginatedSchoolUsers,
  SchoolUserDetail,
  SchoolUserRoleFilter,
  SchoolRole,
  StudentOnlyDetail,
  PromoteStudentResponse,
  ResetStudentPasswordResponse,
} from "../types/users.types";

const USERS_PAGE_LIMIT = 20;

function buildUsersQuery(params: {
  search?: string;
  role?: SchoolUserRoleFilter;
  page?: number;
}): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.role && params.role !== "ALL") q.set("role", params.role);
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(USERS_PAGE_LIMIT));
  return `?${q.toString()}`;
}

export const usersApi = {
  async list(
    schoolSlug: string,
    params: { search?: string; role?: SchoolUserRoleFilter; page?: number },
  ): Promise<PaginatedSchoolUsers> {
    const query = buildUsersQuery(params);
    return apiFetch(`/schools/${schoolSlug}/users${query}`, {}, true);
  },

  async get(schoolSlug: string, userId: string): Promise<SchoolUserDetail> {
    return apiFetch(`/schools/${schoolSlug}/users/${userId}`, {}, true);
  },

  async updateRoles(
    schoolSlug: string,
    userId: string,
    roles: SchoolRole[],
  ): Promise<{ roles: SchoolRole[] }> {
    return apiFetch(
      `/schools/${schoolSlug}/users/${userId}/roles`,
      { method: "PATCH", body: JSON.stringify({ roles }) },
      true,
    );
  },

  async suggestUsername(
    schoolSlug: string,
    studentId: string,
  ): Promise<{ username: string }> {
    return apiFetch(
      `/schools/${schoolSlug}/students/${studentId}/suggest-username`,
      {},
      true,
    );
  },

  async promoteStudent(
    schoolSlug: string,
    studentId: string,
    username?: string,
  ): Promise<PromoteStudentResponse> {
    return apiFetch(
      `/schools/${schoolSlug}/students/${studentId}/promote`,
      {
        method: "POST",
        body: JSON.stringify(username ? { username } : {}),
      },
      true,
    );
  },

  async resetStudentPassword(
    schoolSlug: string,
    studentId: string,
  ): Promise<ResetStudentPasswordResponse> {
    return apiFetch(
      `/schools/${schoolSlug}/students/${studentId}/reset-password`,
      { method: "POST", body: JSON.stringify({}) },
      true,
    );
  },

  async getStudentProfile(
    schoolSlug: string,
    studentId: string,
  ): Promise<StudentOnlyDetail> {
    return apiFetch(
      `/schools/${schoolSlug}/students/${studentId}/profile`,
      {},
      true,
    );
  },
};
