export interface RecoveryQuestion {
  key: string;
  label: string;
}

// ── PIN Recovery ──────────────────────────────────────────────────────────────

export interface ForgotPinOptionsRequest {
  email?: string;
  phone?: string;
}

export interface ForgotPinOptionsResponse {
  success: boolean;
  principalHint: string;
  questions: RecoveryQuestion[];
  schoolSlug: string | null;
}

export interface ForgotPinVerifyRequest {
  email?: string;
  phone?: string;
  birthDate: string;
  answers: Array<{ questionKey: string; answer: string }>;
}

export interface ForgotPinVerifyResponse {
  success: boolean;
  recoveryToken: string;
  schoolSlug: string | null;
}

export interface ForgotPinCompleteRequest {
  recoveryToken: string;
  newPin: string;
}

export interface ForgotPinCompleteResponse {
  success: boolean;
  schoolSlug: string | null;
}

// ── Password Recovery ─────────────────────────────────────────────────────────

export interface ForgotPasswordRequestRequest {
  email: string;
}

export interface ForgotPasswordRequestResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ForgotPasswordOptionsRequest {
  token: string;
}

export interface ForgotPasswordOptionsResponse {
  success: boolean;
  emailHint: string;
  schoolSlug: string | null;
  questions: RecoveryQuestion[];
}

export interface ForgotPasswordVerifyRequest {
  token: string;
  birthDate: string;
  answers: Array<{ questionKey: string; answer: string }>;
}

export interface ForgotPasswordVerifyResponse {
  success: boolean;
  verified: boolean;
}

export interface ForgotPasswordCompleteRequest {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordCompleteResponse {
  success: boolean;
}
