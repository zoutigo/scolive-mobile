import type { RecoveryQuestion } from "./recovery.types";

export type Gender = "M" | "F" | "OTHER";

export type OnboardingQuestionKey =
  | "MOTHER_MAIDEN_NAME"
  | "FATHER_FIRST_NAME"
  | "FAVORITE_SPORT"
  | "FAVORITE_TEACHER"
  | "BIRTH_CITY"
  | "CHILDHOOD_NICKNAME"
  | "FAVORITE_BOOK";

export interface OnboardingClassOption {
  id: string;
  name: string;
  year: string;
  schoolYearLabel?: string;
}

export interface OnboardingStudentOption {
  id: string;
  firstName: string;
  lastName: string;
}

export interface OnboardingOptionsResponse {
  schoolSlug: string | null;
  schoolRoles: string[];
  questions: RecoveryQuestion[];
  classes: OnboardingClassOption[];
  students: OnboardingStudentOption[];
}

export interface OnboardingCompletePayload {
  email?: string;
  setupToken?: string;
  temporaryPassword?: string;
  newPassword?: string;
  newPin?: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  answers: Array<{ questionKey: string; answer: string }>;
  parentClassId?: string;
  parentStudentId?: string;
}
