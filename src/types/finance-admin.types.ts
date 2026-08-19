export type ReinscriptionThresholdPolicy =
  | "FIRST_INSTALLMENT"
  | "FULL_PAYMENT";

export type FinanceSettings = {
  reinscriptionThresholdPolicy: ReinscriptionThresholdPolicy;
};

export type FeeInstallmentRow = {
  id: string;
  rank: number;
  label: string;
  amount: number;
  dueDate: string | null;
};

export type FeeScheduleRow = {
  id: string;
  academicLevel: { id: string; label: string; code: string };
  track: { id: string; label: string; code: string } | null;
  schoolYear: { id: string; label: string };
  installments: FeeInstallmentRow[];
};

export type UpsertFeeScheduleInstallmentPayload = {
  rank: number;
  label: string;
  amount: number;
  dueDate?: string;
};

export type UpsertFeeSchedulePayload = {
  schoolYearId: string;
  academicLevelId: string;
  trackId?: string;
  installments: UpsertFeeScheduleInstallmentPayload[];
};

export type StudentFinanceSummary = {
  student: { id: string; firstName: string; lastName: string };
  decision: {
    decision: string;
    nextAcademicLevelId: string;
    nextTrackId: string | null;
  };
  feeSchedule: {
    academicLevel?: { label: string };
    track?: { label: string } | null;
    installments: FeeInstallmentRow[];
  };
  totalPaid: number;
  thresholdAmount: number;
  reinscriptionEligible: boolean;
};

export type RecordDirectPaymentPayload = {
  studentId: string;
  schoolYearId: string;
  amount: number;
  paidAt: string;
  note?: string;
};

export type RecordDirectPaymentResponse = {
  payment: { id: string };
  totalPaid: number;
  thresholdAmount: number;
  reinscriptionConfirmed: boolean;
};
