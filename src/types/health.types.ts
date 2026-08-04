import { z } from "zod";
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { TranslateFn } from "../i18n/useTranslation";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

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
  followUpNeeded: boolean;
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
  reportedByUser: { firstName: string; lastName: string } | null;
  acknowledgedByUser: { firstName: string; lastName: string } | null;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export type HealthHistoryOrigin = "CARE_EVENT" | "REPORT";

export type HealthHistoryItem =
  | { kind: "CARE_EVENT"; at: string; payload: StudentHealthCareEvent }
  | { kind: "REPORT"; at: string; payload: StudentHealthReport };

export interface HealthConditionsFilters {
  type: HealthConditionType | null;
  alertLevel: HealthAlertLevel | null;
  active: boolean | null;
}

export const NO_CONDITION_FILTERS: HealthConditionsFilters = {
  type: null,
  alertLevel: null,
  active: null,
};

export function hasActiveConditionFilters(filters: HealthConditionsFilters) {
  return (
    filters.type != null || filters.alertLevel != null || filters.active != null
  );
}

export interface HealthHistoryFilters {
  alertLevel: HealthAlertLevel | null;
  origin: HealthHistoryOrigin | null;
  reportType: HealthReportType | null;
}

export const NO_HISTORY_FILTERS: HealthHistoryFilters = {
  alertLevel: null,
  origin: null,
  reportType: null,
};

export function hasActiveHistoryFilters(filters: HealthHistoryFilters) {
  return (
    filters.alertLevel != null ||
    filters.origin != null ||
    filters.reportType != null
  );
}

export interface CreateHealthConditionPayload {
  type: HealthConditionType;
  alertLevel: HealthAlertLevel;
  label: string;
  description?: string;
}

export interface UpdateHealthConditionPayload {
  type: HealthConditionType;
  alertLevel: HealthAlertLevel;
  label: string;
  description?: string;
  active: boolean;
}

export interface CreateHealthCareEventPayload {
  summary: string;
  alertLevel: HealthAlertLevel;
  description?: string;
}

export interface UpdateHealthCareEventPayload {
  summary?: string;
  alertLevel?: HealthAlertLevel;
  description?: string;
}

export interface SchoolHealthClassSummary {
  id: string;
  name: string;
}

export interface SchoolHealthStudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  class: SchoolHealthClassSummary | null;
  birthDate: string | null;
  age: number | null;
}

export interface SchoolHealthReportItem {
  id: string;
  type: HealthReportType;
  alertLevel: HealthAlertLevel;
  description: string;
  sportRestriction: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    class: SchoolHealthClassSummary | null;
  };
  reportedByUser: { firstName: string; lastName: string } | null;
  acknowledgedByUser: { firstName: string; lastName: string } | null;
}

export interface SchoolHealthStats {
  scope: "SCHOOL" | "CLASS";
  classId: string | null;
  activeConditionsByAlertLevel: Record<HealthAlertLevel, number>;
  activeConditionsTotal: number;
  studentsWithActiveConditions: number;
  careEventsLast7Days: number;
  careEventsLast30Days: number;
  reportsPendingAcknowledgement: number;
}

export interface SchoolHealthStudentsFilters {
  classId: string | null;
}

export const NO_SCHOOL_HEALTH_STUDENTS_FILTERS: SchoolHealthStudentsFilters = {
  classId: null,
};

export function hasActiveSchoolHealthStudentsFilters(
  filters: SchoolHealthStudentsFilters,
) {
  return filters.classId != null;
}

export interface SchoolHealthReportsFilters {
  alertLevel: HealthAlertLevel | null;
  reportType: HealthReportType | null;
  acknowledged: boolean | null;
}

export const NO_SCHOOL_HEALTH_REPORTS_FILTERS: SchoolHealthReportsFilters = {
  alertLevel: null,
  reportType: null,
  acknowledged: null,
};

export function hasActiveSchoolHealthReportsFilters(
  filters: SchoolHealthReportsFilters,
) {
  return (
    filters.alertLevel != null ||
    filters.reportType != null ||
    filters.acknowledged != null
  );
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

export const ALERT_LEVEL_ICONS: Record<HealthAlertLevel, IoniconName> = {
  INFO: "information-circle",
  ATTENTION: "warning",
  URGENT: "alert-circle",
};

export const CONDITION_TYPE_ICONS: Record<HealthConditionType, IoniconName> = {
  ALLERGY: "nutrition-outline",
  PATHOLOGY: "pulse-outline",
  TREATMENT: "medkit-outline",
  INSTRUCTION: "clipboard-outline",
  OTHER: "ellipsis-horizontal-circle-outline",
};

export const HISTORY_ORIGIN_ICONS: Record<HealthHistoryOrigin, IoniconName> = {
  CARE_EVENT: "school-outline",
  REPORT: "person-outline",
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

export function editConditionFormSchema(t: TranslateFn) {
  return z.object({
    type: z.enum(HEALTH_CONDITION_TYPES),
    alertLevel: z.enum(HEALTH_ALERT_LEVELS),
    label: z.string().trim().min(1, t("health.validation.labelRequired")),
    description: z.string(),
    active: z.boolean(),
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
