export type RoomStatus = "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE";

export type RoomOption = {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  maxConcurrentSlots: number;
  status: RoomStatus;
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
