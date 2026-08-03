import { z } from "zod";
import type { TranslateFn } from "../i18n/useTranslation";

export const HEALTH_ALERT_LEVELS = ["INFO", "ATTENTION", "URGENT"] as const;
export type HealthAlertLevel = (typeof HEALTH_ALERT_LEVELS)[number];

export const HEALTH_CONDITION_TYPES = [
  "ALLERGY",
  "PATHOLOGY",
  "TREATMENT",
  "INSTRUCTION",
  "OTHER",
] as const;
export type HealthConditionType = (typeof HEALTH_CONDITION_TYPES)[number];

export const HEALTH_REPORT_TYPES = [
  "MALADIE",
  "TRAITEMENT",
  "ACCIDENT",
  "CONSULTATION",
  "HOSPITALISATION",
  "VACCINATION",
  "RESTRICTION_SPORT",
  "AUTRE",
] as const;
export type HealthReportType = (typeof HEALTH_REPORT_TYPES)[number];

export interface StudentHealthCondition {
  id: string;
  type: HealthConditionType;
  alertLevel: HealthAlertLevel;
  label: string;
  description: string | null;
  active: boolean;
  isVisibleToAllTeachers: boolean;
  publicAlertLabel: string | null;
  createdAt: string;
}

export interface StudentHealthCareEvent {
  id: string;
  summary: string;
  description: string | null;
  occurredAt: string;
  alertLevel: HealthAlertLevel;
  authorUser: { firstName: string; lastName: string } | null;
}

export interface StudentHealthReport {
  id: string;
  type: HealthReportType;
  alertLevel: HealthAlertLevel;
  description: string;
  sportRestriction: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
}

export interface CreateHealthConditionPayload {
  type: HealthConditionType;
  alertLevel: HealthAlertLevel;
  label: string;
  description?: string;
}

export interface CreateHealthCareEventPayload {
  summary: string;
  alertLevel: HealthAlertLevel;
  description?: string;
}

export interface CreateHealthReportPayload {
  type: HealthReportType;
  alertLevel: HealthAlertLevel;
  description: string;
  sportRestriction?: boolean;
}

export interface HealthEmergencyContact {
  id: string;
  fullName: string;
  phone: string | null;
}

export interface StudentHealthUrgencySummary {
  student: { id: string; firstName: string; lastName: string };
  conditions: StudentHealthCondition[];
  emergencyContacts: HealthEmergencyContact[];
}

export const ALERT_LEVEL_COLORS: Record<
  HealthAlertLevel,
  { bg: string; text: string }
> = {
  INFO: { bg: "#EAF3FF", text: "#1E5FAF" },
  ATTENTION: { bg: "#FFF2E8", text: "#C15600" },
  URGENT: { bg: "#FFF0F0", text: "#C0392B" },
};

export function alertLevelLabel(t: TranslateFn, level: HealthAlertLevel) {
  return t(`health.alertLevel.${level}`);
}

export function conditionTypeLabel(t: TranslateFn, type: HealthConditionType) {
  return t(`health.conditionType.${type}`);
}

export function reportTypeLabel(t: TranslateFn, type: HealthReportType) {
  return t(`health.reportType.${type}`);
}

export function createConditionFormSchema(t: TranslateFn) {
  return z.object({
    type: z.enum(HEALTH_CONDITION_TYPES),
    alertLevel: z.enum(HEALTH_ALERT_LEVELS),
    label: z.string().trim().min(1, t("health.validation.labelRequired")),
    description: z.string(),
  });
}

export function createReportFormSchema(t: TranslateFn) {
  return z.object({
    type: z.enum(HEALTH_REPORT_TYPES),
    alertLevel: z.enum(HEALTH_ALERT_LEVELS),
    description: z
      .string()
      .trim()
      .min(1, t("health.validation.descriptionRequired")),
    sportRestriction: z.boolean(),
  });
}

export function createCareEventFormSchema(t: TranslateFn) {
  return z.object({
    summary: z.string().trim().min(1, t("health.validation.labelRequired")),
    alertLevel: z.enum(HEALTH_ALERT_LEVELS),
    description: z.string(),
  });
}
