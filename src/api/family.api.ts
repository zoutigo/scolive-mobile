import { apiFetch } from "./client";
import type { ParentChild } from "../types/family.types";

export const familyApi = {
  getParentMe(schoolSlug: string): Promise<{ linkedStudents?: ParentChild[] }> {
    return apiFetch(`/schools/${schoolSlug}/me`, {}, true);
  },
};
