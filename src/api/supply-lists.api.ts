import { apiFetch } from "./client";
import type {
  ChildSupplyList,
  SupplyListRow,
  UpsertSupplyListPayload,
} from "../types/supply-lists.types";

function buildAdminPath(schoolSlug: string, path: string) {
  return `/schools/${schoolSlug}/admin/${path}`;
}

export const supplyListsApi = {
  getMyChildSupplyList(
    schoolSlug: string,
    studentId: string,
  ): Promise<ChildSupplyList> {
    return apiFetch(
      `/schools/${schoolSlug}/me/supply-lists/students/${studentId}`,
      {},
      true,
    );
  },

  listSupplyLists(
    schoolSlug: string,
    params: { schoolYearId?: string; academicLevelId?: string } = {},
  ): Promise<SupplyListRow[]> {
    const q = new URLSearchParams();
    if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
    if (params.academicLevelId)
      q.set("academicLevelId", params.academicLevelId);
    const query = q.toString();
    return apiFetch(
      buildAdminPath(schoolSlug, `supply-lists${query ? `?${query}` : ""}`),
      {},
      true,
    );
  },

  upsertSupplyList(
    schoolSlug: string,
    payload: UpsertSupplyListPayload,
  ): Promise<SupplyListRow> {
    return apiFetch(
      buildAdminPath(schoolSlug, "supply-lists"),
      { method: "POST", body: JSON.stringify(payload) },
      true,
    );
  },

  deleteSupplyList(
    schoolSlug: string,
    supplyListId: string,
  ): Promise<{ success: boolean }> {
    return apiFetch(
      buildAdminPath(schoolSlug, `supply-lists/${supplyListId}`),
      { method: "DELETE" },
      true,
    );
  },
};
