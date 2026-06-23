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
