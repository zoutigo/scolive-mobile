import type { SchoolRole } from "./auth.types";

export type { SchoolRole };

export type UserActivationStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type UserItem = {
  type: "user";
  id: string;
  studentId: string | null;
  hasAccount: true;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: "M" | "F" | "OTHER" | null;
  avatarUrl: string | null;
  roles: SchoolRole[];
  activationStatus: UserActivationStatus;
  profileCompleted: boolean;
  createdAt: string;
};

export type StudentOnlyItem = {
  type: "student-only";
  id: string; // = studentId
  studentId: string;
  hasAccount: false;
  firstName: string;
  lastName: string;
  email: null;
  phone: null;
  gender: null;
  avatarUrl: null;
  roles: ["STUDENT"];
  activationStatus: null;
  profileCompleted: false;
  createdAt: string;
};

export type SchoolMember = UserItem | StudentOnlyItem;

// Alias pour compatibilité avec les composants existants
export type SchoolUser = SchoolMember;

export interface SchoolUserEnrollment {
  id: string;
  classId: string;
  className: string;
  schoolYear: string;
}

export interface SchoolUserChild {
  id: string;
  firstName: string;
  lastName: string;
  className?: string | null;
}

export interface SchoolUserTeachingClass {
  classId: string;
  className: string;
  subjects: { id: string; name: string }[];
}

export interface SchoolUserParent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface SchoolUserStaffFunction {
  id: string;
  name: string;
}

export interface SchoolUserDetail extends UserItem {
  lastLoginAt: string | null;
  enrollments: SchoolUserEnrollment[];
  children: SchoolUserChild[];
  updatedAt: string;
  teachingClasses: SchoolUserTeachingClass[];
  studentParents: SchoolUserParent[];
  staffFunctions: SchoolUserStaffFunction[];
}

// Profil student-only (pas de compte utilisateur)
export interface StudentOnlyDetail {
  type: "student-only";
  studentId: string;
  firstName: string;
  lastName: string;
  enrollments: SchoolUserEnrollment[];
  studentParents: SchoolUserParent[];
}

export type SchoolUserRoleFilter =
  | "ALL"
  | "TEACHER"
  | "PARENT"
  | "STUDENT"
  | "SCHOOL_ADMIN"
  | "SCHOOL_MANAGER"
  | "SCHOOL_STAFF";

export interface SchoolUsersFilters {
  search: string;
  role: SchoolUserRoleFilter;
}

export interface PaginatedSchoolUsers {
  data: SchoolMember[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PromoteStudentResponse {
  username: string;
  temporaryPassword: string;
}

export interface ResetStudentPasswordResponse {
  temporaryPassword: string;
}
