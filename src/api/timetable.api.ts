import { apiFetch } from "./client";
import { buildDefaultDateRange } from "../utils/timetable";
import { teacherClassNavApi } from "./teacher-class-nav.api";
import type {
  ClassTimetableContextResponse,
  ClassTimetableResponse,
  MyTimetableResponse,
  TimetableClassOptionsResponse,
  TimetableCalendarEvent,
  TimetableOneOffSlot,
  TimetableRecurringSlot,
  UpsertCalendarEventInput,
  UpsertOneOffSlotInput,
  UpsertRecurringSlotInput,
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

export const timetableApi = {
  async getMyTimetable(
    schoolSlug: string,
    input: {
      childId?: string;
      schoolYearId?: string;
      fromDate?: string;
      toDate?: string;
    } = {},
  ): Promise<MyTimetableResponse> {
    const range = buildDefaultDateRange();
    return apiFetch(
      `/schools/${schoolSlug}/timetable/me${toQuery({
        childId: input.childId,
        schoolYearId: input.schoolYearId,
        fromDate: input.fromDate ?? range.fromDate,
        toDate: input.toDate ?? range.toDate,
      })}`,
      {},
      true,
    );
  },

  async getClassOptions(
    schoolSlug: string,
    schoolYearId?: string,
  ): Promise<TimetableClassOptionsResponse> {
    return teacherClassNavApi.getClassOptions(schoolSlug, schoolYearId);
  },

  async getAdminClassList(
    schoolSlug: string,
    schoolYearId?: string,
  ): Promise<TimetableClassOptionsResponse> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/classes${toQuery({ schoolYearId })}`,
      {},
      true,
    );
  },

  getClassContext(
    schoolSlug: string,
    classId: string,
    schoolYearId?: string,
  ): Promise<ClassTimetableContextResponse> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/classes/${classId}/context${toQuery({
        schoolYearId,
      })}`,
      {},
      true,
    );
  },

  getClassTimetable(
    schoolSlug: string,
    classId: string,
    input: {
      schoolYearId?: string;
      fromDate?: string;
      toDate?: string;
    } = {},
  ): Promise<ClassTimetableResponse> {
    const range = buildDefaultDateRange();
    return apiFetch(
      `/schools/${schoolSlug}/timetable/classes/${classId}${toQuery({
        schoolYearId: input.schoolYearId,
        fromDate: input.fromDate ?? range.fromDate,
        toDate: input.toDate ?? range.toDate,
      })}`,
      {},
      true,
    );
  },

  createRecurringSlot(
    schoolSlug: string,
    classId: string,
    payload: UpsertRecurringSlotInput,
  ): Promise<TimetableRecurringSlot> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/classes/${classId}/slots`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateRecurringSlot(
    schoolSlug: string,
    slotId: string,
    payload: Partial<UpsertRecurringSlotInput>,
  ): Promise<TimetableRecurringSlot> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/slots/${slotId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteRecurringSlot(schoolSlug: string, slotId: string): Promise<void> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/slots/${slotId}`,
      { method: "DELETE" },
      true,
    );
  },

  createOneOffSlot(
    schoolSlug: string,
    classId: string,
    payload: UpsertOneOffSlotInput,
  ): Promise<TimetableOneOffSlot> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/classes/${classId}/one-off-slots`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateOneOffSlot(
    schoolSlug: string,
    oneOffSlotId: string,
    payload: Partial<UpsertOneOffSlotInput>,
  ): Promise<TimetableOneOffSlot> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/one-off-slots/${oneOffSlotId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteOneOffSlot(schoolSlug: string, oneOffSlotId: string): Promise<void> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/one-off-slots/${oneOffSlotId}`,
      { method: "DELETE" },
      true,
    );
  },

  createCalendarEvent(
    schoolSlug: string,
    payload: UpsertCalendarEventInput,
  ): Promise<TimetableCalendarEvent> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/calendar-events`,
      {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          scope: payload.scope ?? "SCHOOL",
          type: payload.type ?? "HOLIDAY",
        }),
      },
      true,
    );
  },

  updateCalendarEvent(
    schoolSlug: string,
    eventId: string,
    payload: Partial<UpsertCalendarEventInput>,
  ): Promise<TimetableCalendarEvent> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/calendar-events/${eventId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteCalendarEvent(schoolSlug: string, eventId: string): Promise<void> {
    return apiFetch(
      `/schools/${schoolSlug}/timetable/calendar-events/${eventId}`,
      { method: "DELETE" },
      true,
    );
  },
};
