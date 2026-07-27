export type RoomStatus = "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE";
export type RoomSimultaneity = "SINGLE" | "MULTIPLE";

export type RoomOption = {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  maxConcurrentSlots: number;
  status: RoomStatus;
};

export type RoomsListFilters = {
  status: RoomStatus | null;
  simultaneity: RoomSimultaneity | null;
  availabilityFromDate: string | null;
  availabilityToDate: string | null;
  availabilityStartMinute: number | null;
  availabilityEndMinute: number | null;
};

export type RoomsListParams = {
  search?: string;
  status?: RoomStatus;
  simultaneity?: RoomSimultaneity;
  availabilityFromDate?: string;
  availabilityToDate?: string;
  availabilityStartMinute?: number;
  availabilityEndMinute?: number;
  page?: number;
  limit?: number;
};

export type RoomsListMeta = {
  page: number;
  limit: number;
  total: number;
};

export type RoomsListResult = {
  items: RoomRow[];
  page: number;
  limit: number;
  total: number;
};

export type RoomAvailability = RoomOption & {
  occupiedSlots: number;
  isAvailable: boolean;
};

export type RoomRow = RoomOption & {
  schoolId: string;
  createdAt: string;
  updatedAt: string;
};

export type RoomCalendarEntry = {
  id: string;
  occurrenceDate: string;
  startMinute: number;
  endMinute: number;
  className: string;
  subjectName: string;
  teacherName: string;
};

export type RoomPayload = {
  name?: string;
  description?: string;
  capacity?: number;
  maxConcurrentSlots?: number;
  status?: RoomStatus;
};
