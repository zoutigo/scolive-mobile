import { apiFetch } from "./client";
import type { AttendanceRoster } from "../types/attendance.types";

export const attendanceApi = {
  /**
   * Récupère le roster d'une classe pour une date, avec le statut
   * présent/absent de chaque élève.
   */
  async getRoster(
    schoolSlug: string,
    classId: string,
    date: string,
  ): Promise<AttendanceRoster> {
    return apiFetch<AttendanceRoster>(
      `/schools/${schoolSlug}/classes/${classId}/attendance?date=${encodeURIComponent(
        date,
      )}`,
      {},
      true,
    );
  },

  /**
   * Enregistre l'appel du jour : seuls les élèves absents sont transmis,
   * tous les autres sont considérés présents.
   */
  async saveRollCall(
    schoolSlug: string,
    classId: string,
    date: string,
    absentStudentIds: string[],
  ): Promise<AttendanceRoster> {
    return apiFetch<AttendanceRoster>(
      `/schools/${schoolSlug}/classes/${classId}/attendance`,
      {
        method: "POST",
        body: JSON.stringify({ date, absentStudentIds }),
      },
      true,
    );
  },
};
