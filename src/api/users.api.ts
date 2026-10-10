import { apiFetch } from "./client";
import type {
  PaginatedSchoolUsers,
  SchoolUserAccountFilter,
  SchoolUserDetail,
  SchoolUserRoleFilter,
  SchoolRole,
  SchoolUserMembershipFilter,
  SchoolYearOption,
  StudentOnlyDetail,
  PromoteStudentResponse,
  ResetStudentPasswordResponse,
} from "../types/users.types";

export type CreatableStaffRole =
  | "SCHOOL_MANAGER"
  | "SUPERVISOR"
  | "SCHOOL_ACCOUNTANT"
  | "SCHOOL_STAFF"
  | "SCHOOL_HEALTH_OFFICER";

export interface CreateStaffMemberPayload {
  role: CreatableStaffRole;
  email?: string;
  phone?: string;
  password?: string;
  pin?: string;
  functionId?: string;
}

export interface CreateStaffMemberResponse {
  user: { id: string };
  userExisted: boolean;
  onboardingEmailSent: boolean;
  activationRequired: boolean;
  activationCode?: string;
}

const USERS_PAGE_LIMIT = 20;

function buildUsersQuery(params: {
  search?: string;
  role?: SchoolUserRoleFilter;
  hasAccount?: SchoolUserAccountFilter;
  schoolYearId?: string | null;
  membershipStatus?: SchoolUserMembershipFilter;
  page?: number;
}): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.role && params.role !== "ALL") q.set("role", params.role);
  if (params.hasAccount === "WITH_ACCOUNT") q.set("hasAccount", "true");
  if (params.hasAccount === "WITHOUT_ACCOUNT") q.set("hasAccount", "false");
  if (params.membershipStatus === "excluded") {
    q.set("membershipStatus", "excluded");
  }
  if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(USERS_PAGE_LIMIT));
  return `?${q.toString()}`;
}

export const usersApi = {
  async list(
    schoolSlug: string,
    params: {
      search?: string;
      role?: SchoolUserRoleFilter;
      hasAccount?: SchoolUserAccountFilter;
      schoolYearId?: string | null;
      membershipStatus?: SchoolUserMembershipFilter;
      page?: number;
    },
  ): Promise<PaginatedSchoolUsers> {
    const query = buildUsersQuery(params);
    return apiFetch(`/schools/${schoolSlug}/users${query}`, {}, true);
  },

  async listSchoolYears(schoolSlug: string): Promise<SchoolYearOption[]> {
    return apiFetch(`/schools/${schoolSlug}/admin/school-years`, {}, true);
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

  async resetPin(
    schoolSlug: string,
    userId: string,
  ): Promise<{ temporaryPin: string }> {
    return apiFetch(
      `/schools/${schoolSlug}/users/${userId}/reset-pin`,
      { method: "POST", body: JSON.stringify({}) },
      true,
    );
  },

  async removeMember(
    schoolSlug: string,
    userId: string,
  ): Promise<{
    action: "EXCLUDED" | "UNASSIGNED_FROM_CLASS";
    remainingRoles: string[];
  }> {
    return apiFetch(
      `/schools/${schoolSlug}/users/${userId}`,
      { method: "DELETE" },
      true,
    );
  },

  /** Sortie complète de l'école (tous rôles) : trace conservée, réinvitation possible. */
  async excludeMember(
    schoolSlug: string,
    userId: string,
    reason?: string,
  ): Promise<{ action: "EXCLUDED"; roles: string[]; excludedAt: string }> {
    return apiFetch(
      `/schools/${schoolSlug}/users/${userId}/exclude`,
      {
        method: "POST",
        body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
      },
      true,
    );
  },

  /** Exclusion d'un élève sans compte (identifié par son studentId). */
  async excludeStudent(
    schoolSlug: string,
    studentId: string,
    reason?: string,
  ): Promise<{ action: "EXCLUDED"; roles: string[]; excludedAt: string }> {
    return apiFetch(
      `/schools/${schoolSlug}/users/students/${studentId}/exclude`,
      {
        method: "POST",
        body: JSON.stringify(reason?.trim() ? { reason: reason.trim() } : {}),
      },
      true,
    );
  },

  async reinviteMember(
    schoolSlug: string,
    userId: string,
  ): Promise<{ action: "REINVITED"; roles: string[] }> {
    return apiFetch(
      `/schools/${schoolSlug}/users/${userId}/reinvite`,
      { method: "POST", body: JSON.stringify({}) },
      true,
    );
  },

  async reinviteStudent(
    schoolSlug: string,
    studentId: string,
  ): Promise<{ action: "REINVITED"; roles: string[] }> {
    return apiFetch(
      `/schools/${schoolSlug}/users/students/${studentId}/reinvite`,
      { method: "POST", body: JSON.stringify({}) },
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

  async createStaffMember(
    schoolSlug: string,
    payload: CreateStaffMemberPayload,
  ): Promise<CreateStaffMemberResponse> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/staff-members`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },
};
