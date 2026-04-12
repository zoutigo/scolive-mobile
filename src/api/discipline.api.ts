import { apiFetch } from "./client";
import type {
  CreateLifeEventPayload,
  ListLifeEventsParams,
  StudentLifeEvent,
  UpdateLifeEventPayload,
} from "../types/discipline.types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuery(params: ListLifeEventsParams): string {
  const q = new URLSearchParams();
  if (params.scope) q.set("scope", params.scope);
  if (params.type) q.set("type", params.type);
  if (params.schoolYearId) q.set("schoolYearId", params.schoolYearId);
  if (params.classId) q.set("classId", params.classId);
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

// ── API ───────────────────────────────────────────────────────────────────────

export const disciplineApi = {
  /**
   * Récupère les événements de vie scolaire d'un élève.
   * Accessible aux parents (lecture seule) et aux rôles staff/teacher.
   */
  async list(
    schoolSlug: string,
    studentId: string,
    params: ListLifeEventsParams = {},
  ): Promise<StudentLifeEvent[]> {
    const query = buildQuery({ scope: "current", limit: 200, ...params });
    return apiFetch<StudentLifeEvent[]>(
      `/schools/${schoolSlug}/students/${studentId}/life-events${query}`,
      {},
      true,
    );
  },

  /**
   * Crée un événement de vie scolaire.
   * Réservé aux rôles teacher / school_admin / school_manager / supervisor.
   */
  async create(
    schoolSlug: string,
    studentId: string,
    payload: CreateLifeEventPayload,
  ): Promise<StudentLifeEvent> {
    return apiFetch<StudentLifeEvent>(
      `/schools/${schoolSlug}/students/${studentId}/life-events`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  /**
   * Modifie un événement existant.
   * Les teachers ne peuvent modifier que leurs propres événements.
   */
  async update(
    schoolSlug: string,
    studentId: string,
    eventId: string,
    payload: UpdateLifeEventPayload,
  ): Promise<StudentLifeEvent> {
    return apiFetch<StudentLifeEvent>(
      `/schools/${schoolSlug}/students/${studentId}/life-events/${eventId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  },

  /**
   * Supprime un événement.
   * Les teachers ne peuvent supprimer que leurs propres événements.
   */
  async remove(
    schoolSlug: string,
    studentId: string,
    eventId: string,
  ): Promise<void> {
    await apiFetch<{ id: string; deleted: true }>(
      `/schools/${schoolSlug}/students/${studentId}/life-events/${eventId}`,
      { method: "DELETE" },
      true,
    );
  },
};
