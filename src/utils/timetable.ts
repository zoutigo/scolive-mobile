import type {
  TimetableClassOption,
  TimetableClassOptionsContext,
  TimetableOccurrence,
  TimetableSubjectStyle,
} from "../types/timetable.types";

export const WEEKDAY_LABELS = [
  "",
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
] as const;

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function minuteToTimeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${pad2(hours)}:${pad2(mins)}`;
}

export function timeLabelToMinute(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

export function startOfWeek(date: Date): Date {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setHours(0, 0, 0, 0);
  clone.setDate(clone.getDate() + diff);
  return clone;
}

export function addDays(date: Date, amount: number): Date {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
}

export function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatHumanDate(dateIso: string): string {
  const date = parseDateInput(dateIso);
  if (!date) return dateIso;
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function buildDefaultDateRange() {
  const today = new Date();
  const from = startOfWeek(today);
  const to = addDays(from, 20);
  return {
    fromDate: formatDateInput(from),
    toDate: formatDateInput(to),
  };
}

export function getOccurrenceTone(
  occurrence: TimetableOccurrence,
  styles: TimetableSubjectStyle[],
): string {
  const subjectStyle = styles.find(
    (entry) => entry.subjectId === occurrence.subject.id,
  );
  return subjectStyle?.colorHex ?? "#0C5FA8";
}

export function groupOccurrencesByDate(
  occurrences: TimetableOccurrence[],
): Array<{ date: string; items: TimetableOccurrence[] }> {
  const map = new Map<string, TimetableOccurrence[]>();
  occurrences.forEach((occurrence) => {
    const date = occurrence.occurrenceDate;
    const existing = map.get(date) ?? [];
    existing.push(occurrence);
    map.set(date, existing);
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, items]) => ({
      date,
      items: [...items].sort((a, b) => a.startMinute - b.startMinute),
    }));
}

export function buildTimetableClassOptions(
  payload: TimetableClassOptionsContext,
): TimetableClassOption[] {
  const yearLabelById = new Map(
    payload.schoolYears.map((entry) => [entry.id, entry.label] as const),
  );
  const classMap = new Map<
    string,
    {
      classId: string;
      className: string;
      schoolYearId: string;
      subjects: Map<string, { id: string; name: string }>;
      studentIds: Set<string>;
    }
  >();

  payload.assignments.forEach((assignment) => {
    const existing = classMap.get(assignment.classId) ?? {
      classId: assignment.classId,
      className: assignment.className,
      schoolYearId: assignment.schoolYearId,
      subjects: new Map<string, { id: string; name: string }>(),
      studentIds: new Set<string>(),
    };
    existing.subjects.set(assignment.subjectId, {
      id: assignment.subjectId,
      name: assignment.subjectName,
    });
    classMap.set(assignment.classId, existing);
  });

  payload.students.forEach((student) => {
    const existing = classMap.get(student.classId);
    if (!existing) return;
    existing.studentIds.add(student.studentId);
  });

  return Array.from(classMap.values())
    .map((entry) => ({
      classId: entry.classId,
      className: entry.className,
      schoolYearId: entry.schoolYearId,
      schoolYearLabel:
        yearLabelById.get(entry.schoolYearId) ?? "Année non définie",
      subjects: Array.from(entry.subjects.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
      studentCount: entry.studentIds.size,
    }))
    .sort((a, b) =>
      `${a.schoolYearLabel}-${a.className}`.localeCompare(
        `${b.schoolYearLabel}-${b.className}`,
      ),
    );
}

export function initials(fullName?: string | null): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

export function fullTeacherName(input: {
  firstName?: string | null;
  lastName?: string | null;
}): string {
  return `${input.lastName ?? ""} ${input.firstName ?? ""}`.trim();
}
