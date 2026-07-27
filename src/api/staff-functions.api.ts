import { apiFetch } from "./client";

export interface StaffFunctionOption {
  id: string;
  name: string;
  description: string | null;
}

export const staffFunctionsApi = {
  listStaffFunctions(schoolSlug: string): Promise<StaffFunctionOption[]> {
    return apiFetch(`/schools/${schoolSlug}/admin/staff-functions`, {}, true);
  },
};
