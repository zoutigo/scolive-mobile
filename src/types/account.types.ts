import type { AppRole } from "./auth.types";
import type { RecoveryQuestion } from "./recovery.types";

export type AccountGender = "M" | "F" | "OTHER";

export type AccountLocale = "FR" | "EN";

export interface AccountProfileResponse {
  firstName: string;
  lastName: string;
  gender?: AccountGender | null;
  preferredLocale: AccountLocale;
  email?: string | null;
  phone?: string | null;
  role: AppRole;
  activeRole?: AppRole | null;
  platformRoles?: Array<"SUPER_ADMIN" | "ADMIN" | "SALES" | "SUPPORT">;
  memberships?: Array<{
    schoolId: string;
    role:
      | "SCHOOL_ADMIN"
      | "SCHOOL_MANAGER"
      | "SUPERVISOR"
      | "SCHOOL_ACCOUNTANT"
      | "SCHOOL_STAFF"
      | "TEACHER"
      | "PARENT"
      | "STUDENT";
  }>;
  schoolSlug: string | null;
  hasPassword: boolean;
  hasPhoneCredential: boolean;
}

export interface UpdateAccountProfilePayload {
  firstName: string;
  lastName: string;
  gender: AccountGender;
  phone: string;
}

export interface UpdatePreferredLocalePayload {
  preferredLocale: AccountLocale;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface CreatePasswordPayload {
  newPassword: string;
}

export interface AddEmailPayload {
  email: string;
}

export interface AddPhoneCredentialPayload {
  phone: string;
  pin: string;
}

export interface ChangePinPayload {
  currentPin: string;
  newPin: string;
}

export interface RecoveryOptionClass {
  id: string;
  name: string;
  schoolYearLabel: string;
}

export interface RecoveryOptionStudent {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AccountRecoveryOptionsResponse {
  schoolRoles: AppRole[];
  questions: RecoveryQuestion[];
  classes: RecoveryOptionClass[];
  students: RecoveryOptionStudent[];
  selectedQuestions: string[];
  birthDate: string;
  parentClassId: string | null;
  parentStudentId: string | null;
}

export interface UpdateAccountRecoveryPayload {
  birthDate: string;
  answers: Array<{ questionKey: string; answer: string }>;
  parentClassId?: string;
  parentStudentId?: string;
}

export interface SetActiveRolePayload {
  role: AppRole;
}

export interface SetActiveRoleResponse {
  activeRole: AppRole;
}

export interface RequestEmailChangePayload {
  email: string;
}

export interface LinkSsoPayload {
  provider: "GOOGLE" | "APPLE";
  providerAccountId: string;
  email: string;
}
