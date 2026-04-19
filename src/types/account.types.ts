import type { AppRole } from "./auth.types";
import type { RecoveryQuestion } from "./recovery.types";

export type AccountGender = "M" | "F" | "OTHER";

export interface AccountProfileResponse {
  firstName: string;
  lastName: string;
  gender?: AccountGender | null;
  email?: string | null;
  phone?: string | null;
  role: AppRole;
  schoolSlug: string | null;
}

export interface UpdateAccountProfilePayload {
  firstName: string;
  lastName: string;
  gender: AccountGender;
  phone: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
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
