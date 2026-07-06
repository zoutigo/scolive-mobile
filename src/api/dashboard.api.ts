import { apiFetch } from "./client";
import type { SchoolDashboardKpis } from "../types/dashboard.types";

export const dashboardApi = {
  getSchoolKpis(schoolSlug: string): Promise<SchoolDashboardKpis> {
    return apiFetch(`/schools/${schoolSlug}/admin/dashboard-kpis`, {}, true);
  },
};
