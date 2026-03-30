export type PlatformRole = "SUPER_ADMIN" | "ADMIN" | "SALES" | "SUPPORT";

export type SchoolRole =
  | "SCHOOL_ADMIN"
  | "SCHOOL_MANAGER"
  | "SUPERVISOR"
  | "SCHOOL_ACCOUNTANT"
  | "SCHOOL_STAFF"
  | "TEACHER"
  | "PARENT"
  | "STUDENT";

export type AppRole = PlatformRole | SchoolRole;

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: "M" | "F" | "OTHER" | null;
  platformRoles: PlatformRole[];
  memberships: Array<{ schoolId: string; role: SchoolRole }>;
  profileCompleted: boolean;
  activationStatus?: "PENDING" | "ACTIVE" | "SUSPENDED";
  role: AppRole | null;
  activeRole: AppRole | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface LoginResponse extends AuthTokens {
  tokenType: "Bearer";
  schoolSlug: string | null;
  csrfToken?: string;
}

export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  schoolSlug?: string | null;
  email?: string | null;
  setupToken?: string | null;
}

export type SsoProvider = "GOOGLE" | "APPLE";
