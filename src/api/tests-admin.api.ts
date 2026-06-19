import { apiFetch } from "./client";
import type {
  AdminAssignmentRow,
  AdminCampaignDetail,
  AdminCampaignRow,
  AdminTesterRow,
  AdminTestsSynthesis,
  UpdateCaseInstructionsPayload,
} from "../types/tests-admin.types";
import type { TestCampaignStatus } from "../types/tests.types";

type ListCampaignsParams = {
  search?: string;
  status?: TestCampaignStatus | "";
  page?: number;
  limit?: number;
};

type ListTestersParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export const testsAdminApi = {
  getSynthesis(): Promise<AdminTestsSynthesis> {
    return apiFetch(`/admin/tests/synthesis`, {}, true);
  },

  async listCampaigns(
    params: ListCampaignsParams = {},
  ): Promise<{ items: AdminCampaignRow[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiFetch(`/admin/tests/campaigns?${query.toString()}`, {}, true);
  },

  getCampaign(campaignId: string): Promise<AdminCampaignDetail> {
    return apiFetch(`/admin/tests/campaigns/${campaignId}`, {}, true);
  },

  recycleCase(testCaseId: string): Promise<void> {
    return apiFetch(
      `/admin/tests/cases/${testCaseId}/recycle`,
      { method: "POST" },
      true,
    );
  },

  updateCaseInstructions(
    testCaseId: string,
    payload: UpdateCaseInstructionsPayload,
  ): Promise<void> {
    return apiFetch(
      `/admin/tests/cases/${testCaseId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      true,
    );
  },

  async listTesters(
    params: ListTestersParams = {},
  ): Promise<{ items: AdminTesterRow[] }> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return apiFetch(`/admin/tests/testers?${query.toString()}`, {}, true);
  },

  listAssignments(campaignId: string): Promise<AdminAssignmentRow[]> {
    return apiFetch(
      `/admin/tests/campaigns/${campaignId}/assignments`,
      {},
      true,
    );
  },

  assignCampaign(
    campaignId: string,
    payload: { testerId: string; note?: string },
  ): Promise<AdminAssignmentRow> {
    return apiFetch(
      `/admin/tests/campaigns/${campaignId}/assignments`,
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  unassignCampaign(assignmentId: string): Promise<void> {
    return apiFetch(
      `/admin/tests/assignments/${assignmentId}`,
      { method: "DELETE" },
      true,
    );
  },
};
