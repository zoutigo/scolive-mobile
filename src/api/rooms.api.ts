import { apiFetch } from "./client";
import type { RoomAvailability, RoomOption } from "../types/room.types";

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
  listRooms(schoolSlug: string): Promise<RoomOption[]> {
    return apiFetch(`/schools/${schoolSlug}/admin/rooms`, {}, true);
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
