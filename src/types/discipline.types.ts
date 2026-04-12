import { z } from "zod";

// ── Enum ─────────────────────────────────────────────────────────────────────

export const STUDENT_LIFE_EVENT_TYPES = [
  "ABSENCE",
  "RETARD",
  "SANCTION",
  "PUNITION",
] as const;

export type StudentLifeEventType = (typeof STUDENT_LIFE_EVENT_TYPES)[number];

// ── Auteur ───────────────────────────────────────────────────────────────────

export interface LifeEventAuthor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// ── Entité principale ─────────────────────────────────────────────────────────

export interface StudentLifeEvent {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string | null;
  schoolYearId: string | null;
  authorUserId: string;
  type: StudentLifeEventType;
  occurredAt: string; // ISO 8601
  durationMinutes: number | null;
  justified: boolean | null;
  reason: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  class?: { id: string; name: string } | null;
  schoolYear?: { id: string; label: string } | null;
  authorUser: LifeEventAuthor;
}

// ── Paramètres de liste ───────────────────────────────────────────────────────

export type LifeEventsScope = "current" | "all";

export interface ListLifeEventsParams {
  scope?: LifeEventsScope;
  type?: StudentLifeEventType;
  schoolYearId?: string;
  classId?: string;
  limit?: number;
}

// ── Payloads CRUD ─────────────────────────────────────────────────────────────

export interface CreateLifeEventPayload {
  type: StudentLifeEventType;
  occurredAt?: string; // ISO 8601
  reason: string;
  durationMinutes?: number;
  justified?: boolean;
  comment?: string;
  classId?: string;
}

export interface UpdateLifeEventPayload {
  type?: StudentLifeEventType;
  occurredAt?: string;
  reason?: string;
  durationMinutes?: number;
  justified?: boolean;
  comment?: string;
  classId?: string;
}

// ── Validation formulaire ────────────────────────────────────────────────────

export interface DisciplineFormInput {
  type: StudentLifeEventType;
  occurredAt: string;
  reason: string;
  durationMinutes: string;
  justified: boolean;
  comment: string;
}

export const disciplineFormSchema = z.object({
  type: z.enum(STUDENT_LIFE_EVENT_TYPES),
  occurredAt: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La date est obligatoire.",
        });
        return;
      }

      if (Number.isNaN(new Date(value).getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La date est invalide.",
        });
      }
    }),
  reason: z.string().trim().min(1, "Le motif est obligatoire."),
  durationMinutes: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 0),
      "La durée doit être un entier positif.",
    ),
  justified: z.boolean(),
  comment: z.string(),
});

export function buildLifeEventPayload(
  values: DisciplineFormInput,
): CreateLifeEventPayload {
  const parsed = disciplineFormSchema.parse(values);
  const duration = parsed.durationMinutes.trim();
  const comment = parsed.comment.trim();

  return {
    type: parsed.type,
    occurredAt: new Date(parsed.occurredAt).toISOString(),
    reason: parsed.reason.trim(),
    durationMinutes: duration ? parseInt(duration, 10) : undefined,
    justified: typeHasJustified(parsed.type) ? parsed.justified : undefined,
    comment: comment || undefined,
  };
}

// ── Synthèse calculée ─────────────────────────────────────────────────────────

export interface DisciplineSummary {
  absences: number;
  retards: number;
  sanctions: number;
  punitions: number;
  lastAbsence: StudentLifeEvent | null;
  lastRetard: StudentLifeEvent | null;
  lastSanction: StudentLifeEvent | null;
  lastPunition: StudentLifeEvent | null;
  unjustifiedAbsences: number;
}

// ── Couleurs et labels par type ───────────────────────────────────────────────

export interface TypeConfig {
  label: string;
  bg: string;
  text: string;
  accent: string;
  icon: string;
}

export const DISCIPLINE_TYPE_CONFIG: Record<StudentLifeEventType, TypeConfig> =
  {
    ABSENCE: {
      label: "Absence",
      bg: "#EAF3FF",
      text: "#1E5FAF",
      accent: "#1E5FAF",
      icon: "time-outline",
    },
    RETARD: {
      label: "Retard",
      bg: "#FFF2E8",
      text: "#C15600",
      accent: "#C15600",
      icon: "alert-circle-outline",
    },
    SANCTION: {
      label: "Sanction",
      bg: "#FFF0F0",
      text: "#C0392B",
      accent: "#C0392B",
      icon: "shield-outline",
    },
    PUNITION: {
      label: "Punition",
      bg: "#F5F0FF",
      text: "#6B5EA8",
      accent: "#6B5EA8",
      icon: "shield-half-outline",
    },
  };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Calcule la synthèse discipline à partir d'une liste d'événements. */
export function computeDisciplineSummary(
  events: StudentLifeEvent[],
): DisciplineSummary {
  const absences = events.filter((e) => e.type === "ABSENCE");
  const retards = events.filter((e) => e.type === "RETARD");
  const sanctions = events.filter((e) => e.type === "SANCTION");
  const punitions = events.filter((e) => e.type === "PUNITION");

  return {
    absences: absences.length,
    retards: retards.length,
    sanctions: sanctions.length,
    punitions: punitions.length,
    lastAbsence: absences[0] ?? null,
    lastRetard: retards[0] ?? null,
    lastSanction: sanctions[0] ?? null,
    lastPunition: punitions[0] ?? null,
    unjustifiedAbsences: absences.filter((e) => e.justified === false).length,
  };
}

/** Indique si le type nécessite un champ "justifié". */
export function typeHasJustified(type: StudentLifeEventType): boolean {
  return type === "ABSENCE" || type === "RETARD";
}
