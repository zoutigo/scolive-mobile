import { apiFetch } from "./client";
import type { ChildSupplyList } from "../types/supply-lists.types";

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
};
