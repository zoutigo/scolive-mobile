import { apiFetch } from "./client";
import type {
  RoomAvailability,
  RoomCalendarEntry,
  RoomPayload,
  RoomRow,
  RoomsListParams,
  RoomsListResult,
} from "../types/room.types";

export const ROOMS_PAGE_SIZE = 20;

function toQuery(params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const roomsApi = {
  listRooms(
    schoolSlug: string,
    params: RoomsListParams = {},
  ): Promise<RoomsListResult> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/rooms${toQuery({
        search: params.search?.trim() || undefined,
        status: params.status,
        simultaneity: params.simultaneity,
        availabilityFromDate: params.availabilityFromDate,
        availabilityToDate: params.availabilityToDate,
        availabilityStartMinute: params.availabilityStartMinute,
        availabilityEndMinute: params.availabilityEndMinute,
        page: params.page ?? 1,
        limit: params.limit ?? ROOMS_PAGE_SIZE,
      })}`,
      {},
      true,
    );
  },

  getRoom(schoolSlug: string, roomId: string): Promise<RoomRow> {
    return apiFetch(`/schools/${schoolSlug}/admin/rooms/${roomId}`, {}, true);
  },

  createRoom(schoolSlug: string, payload: RoomPayload): Promise<RoomRow> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/rooms`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  updateRoom(
    schoolSlug: string,
    roomId: string,
    payload: RoomPayload,
  ): Promise<RoomRow> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/rooms/${roomId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  deleteRoom(schoolSlug: string, roomId: string) {
    return apiFetch(
      `/schools/${schoolSlug}/admin/rooms/${roomId}`,
      {
        method: "DELETE",
      },
      true,
    );
  },

  getRoomCalendar(
    schoolSlug: string,
    roomId: string,
    fromDate: string,
    toDate: string,
  ): Promise<RoomCalendarEntry[]> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/rooms/${roomId}/calendar${toQuery({
        fromDate,
        toDate,
      })}`,
      {},
      true,
    );
  },

  listAvailableRooms(
    schoolSlug: string,
    input: {
      weekday: number;
      startMinute: number;
      endMinute: number;
      occurrenceDate?: string;
      excludeSlotId?: string;
      excludeOneOffSlotId?: string;
      excludeExceptionId?: string;
    },
  ): Promise<RoomAvailability[]> {
    return apiFetch(
      `/schools/${schoolSlug}/admin/rooms/available${toQuery({
        weekday: input.weekday,
        startMinute: input.startMinute,
        endMinute: input.endMinute,
        occurrenceDate: input.occurrenceDate,
        excludeSlotId: input.excludeSlotId,
        excludeOneOffSlotId: input.excludeOneOffSlotId,
        excludeExceptionId: input.excludeExceptionId,
      })}`,
      {},
      true,
    );
  },
};
