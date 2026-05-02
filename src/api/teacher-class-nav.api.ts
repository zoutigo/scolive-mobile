import { apiFetch } from "./client";
import { buildTimetableClassOptions } from "../utils/timetable";
import type {
  TimetableClassOptionsContext,
  TimetableClassOptionsResponse,
} from "../types/timetable.types";

function toQuery(params: Record<string, string | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, value);
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const teacherClassNavApi = {
  // Canonical teacher-class source shared by drawer and class-scoped modules.
  async getClassOptions(
    schoolSlug: string,
    schoolYearId?: string,
  ): Promise<TimetableClassOptionsResponse> {
    const payload = await apiFetch<TimetableClassOptionsContext>(
      `/schools/${schoolSlug}/student-grades/context${toQuery({ schoolYearId })}`,
      {},
      true,
    );

    return {
      schoolYears: payload.schoolYears,
      selectedSchoolYearId: payload.selectedSchoolYearId,
      classes: buildTimetableClassOptions(payload),
    };
  },
};
