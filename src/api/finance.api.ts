import { apiFetch } from "./client";
import type { WalletSummary } from "../types/finance.types";
import type {
  FeeScheduleRow,
  FinanceSettings,
  RecordDirectPaymentPayload,
  RecordDirectPaymentResponse,
  StudentFinanceSummary,
  UpsertFeeSchedulePayload,
} from "../types/finance-admin.types";

function buildAdminPath(schoolSlug: string, path: string) {
  return `/schools/${schoolSlug}/admin/${path}`;
}

export const financeApi = {
  getWalletSummary(schoolSlug: string): Promise<WalletSummary> {
    return apiFetch(`/schools/${schoolSlug}/me/finance/wallet`, {}, true);
  },

  getFinanceSettings(schoolSlug: string): Promise<FinanceSettings> {
    return apiFetch(buildAdminPath(schoolSlug, "finance/settings"), {}, true);
  },

  updateFinanceSettings(
    schoolSlug: string,
    payload: FinanceSettings,
  ): Promise<FinanceSettings> {
    return apiFetch(
      buildAdminPath(schoolSlug, "finance/settings"),
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  listFeeSchedules(
    schoolSlug: string,
    params: { schoolYearId?: string; academicLevelId?: string } = {},
  ): Promise<FeeScheduleRow[]> {
    const q = new URLSearchParams();
    if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
    if (params.academicLevelId)
      q.set("academicLevelId", params.academicLevelId);
    const query = q.toString();
    return apiFetch(
      buildAdminPath(
        schoolSlug,
        `finance/fee-schedules${query ? `?${query}` : ""}`,
      ),
      {},
      true,
    );
  },

  upsertFeeSchedule(
    schoolSlug: string,
    payload: UpsertFeeSchedulePayload,
  ): Promise<FeeScheduleRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, "finance/fee-schedules"),
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteFeeSchedule(
    schoolSlug: string,
    feeScheduleId: string,
  ): Promise<{ success: boolean }> {
    return apiFetch(
      buildAdminPath(schoolSlug, `finance/fee-schedules/${feeScheduleId}`),
      { method: "DELETE" },
      true,
    );
  },

  getStudentFinanceSummary(
    schoolSlug: string,
    studentId: string,
    schoolYearId: string,
  ): Promise<StudentFinanceSummary> {
    return apiFetch(
      buildAdminPath(
        schoolSlug,
        `finance/students/${studentId}/summary?schoolYearId=${schoolYearId}`,
      ),
      {},
      true,
    );
  },

  recordDirectPayment(
    schoolSlug: string,
    payload: RecordDirectPaymentPayload,
  ): Promise<RecordDirectPaymentResponse> {
    return apiFetch(
      buildAdminPath(schoolSlug, "finance/payments"),
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  topUpWallet(
    schoolSlug: string,
    amount: number,
  ): Promise<{ walletId: string; balance: number }> {
    return apiFetch(
      `/schools/${schoolSlug}/me/finance/wallet/top-up`,
      { method: "POST", body: JSON.stringify({ amount }) },
      true,
    );
  },

  payAndReinscribe(
    schoolSlug: string,
    studentId: string,
    schoolYearId: string,
  ): Promise<{ requiredAmount: number; reinscriptionConfirmed: boolean }> {
    return apiFetch(
      `/schools/${schoolSlug}/me/finance/wallet/pay-and-reinscribe`,
      { method: "POST", body: JSON.stringify({ studentId, schoolYearId }) },
      true,
    );
  },
};
