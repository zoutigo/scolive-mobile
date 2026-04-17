import type {
  TimetableClassOption,
  TimetableClassOptionsContext,
  TimetableOccurrence,
  TimetableSubjectStyle,
} from "../types/timetable.types";

export type TimetableCalendarViewMode = "day" | "week" | "month";

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

export function addMonths(date: Date, amount: number): Date {
  const clone = new Date(date);
  clone.setMonth(clone.getMonth() + amount);
  return clone;
}

export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toIsoDateString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toWeekdayMondayFirst(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function parseOccurrenceDate(value: string): Date | null {
  const dateOnly = value.includes("T") ? value.slice(0, 10) : value;
  return parseDateInput(dateOnly);
}

export function formatWeekRangeLabel(currentDate: Date): string {
  const from = startOfWeek(currentDate);
  const to = addDays(from, 6);
  const startLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(from);
  const endLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(to);
  return `${startLabel} - ${endLabel}`;
}

export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildTimetableRangeForView(
  viewMode: TimetableCalendarViewMode,
  cursorDate: Date,
): { fromDate: string; toDate: string } {
  if (viewMode === "day") {
    const day = stripTime(cursorDate);
    return {
      fromDate: toIsoDateString(day),
      toDate: toIsoDateString(day),
    };
  }

  if (viewMode === "week") {
    const from = startOfWeek(cursorDate);
    const to = addDays(from, 6);
    return {
      fromDate: toIsoDateString(from),
      toDate: toIsoDateString(to),
    };
  }

  const from = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
  const to = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 0);
  return {
    fromDate: toIsoDateString(from),
    toDate: toIsoDateString(to),
  };
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`.toUpperCase();
}

function mixHex(base: string, target: string, ratio: number) {
  const a = hexToRgb(base);
  const b = hexToRgb(target);
  if (!a || !b) return base;
  return rgbToHex({
    r: a.r * (1 - ratio) + b.r * ratio,
    g: a.g * (1 - ratio) + b.g * ratio,
    b: a.b * (1 - ratio) + b.b * ratio,
  });
}

export function subjectVisualTone(subjectColorHex: string | undefined) {
  const base =
    subjectColorHex && /^#[0-9A-Fa-f]{6}$/.test(subjectColorHex)
      ? subjectColorHex.toUpperCase()
      : "#2563EB";
  return {
    chip: base,
    background: mixHex(base, "#FFFFFF", 0.9),
    border: mixHex(base, "#FFFFFF", 0.68),
    text: mixHex(base, "#0F172A", 0.3),
  };
}

export function subjectShortLabel(subjectName: string): string {
  const firstWord = subjectName.split(" ")[0] ?? subjectName;
  return firstWord.slice(0, 3).toUpperCase();
}

export function getCompactWeekendVisibility(
  occurrences: TimetableOccurrence[],
  range: { from: Date; to: Date },
): { showSaturday: boolean; showSunday: boolean } {
  let hasSaturday = false;
  let hasSunday = false;

  for (const occurrence of occurrences) {
    if ((occurrence.status ?? "PLANNED") !== "PLANNED") continue;
    const occurrenceDate = parseOccurrenceDate(occurrence.occurrenceDate);
    if (!occurrenceDate) continue;
    if (occurrenceDate < range.from || occurrenceDate > range.to) continue;
    const weekday = toWeekdayMondayFirst(occurrenceDate);
    if (weekday === 6) hasSaturday = true;
    if (weekday === 7) hasSunday = true;
    if (hasSaturday && hasSunday) break;
  }

  return { showSaturday: hasSaturday, showSunday: hasSunday };
}

export function buildCompactMonthCalendarCells(
  cursorDate: Date,
  occurrences: TimetableOccurrence[],
  showSaturday: boolean,
  showSunday: boolean,
): Array<{ date: Date | null; slotsCount: number }> {
  const daysInMonth = new Date(
    cursorDate.getFullYear(),
    cursorDate.getMonth() + 1,
    0,
  ).getDate();

  // Ordered list of visible weekdays (1=Mon … 7=Sun)
  const visibleWeekdays: number[] = [1, 2, 3, 4, 5];
  if (showSaturday) visibleWeekdays.push(6);
  if (showSunday) visibleWeekdays.push(7);
  const columns = visibleWeekdays.length;

  // First day of the month that belongs to a visible column
  let firstVisibleDay: Date | null = null;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), day);
    if (visibleWeekdays.includes(toWeekdayMondayFirst(date))) {
      firstVisibleDay = date;
      break;
    }
  }
  if (!firstVisibleDay) {
    firstVisibleDay = new Date(
      cursorDate.getFullYear(),
      cursorDate.getMonth(),
      1,
    );
  }

  // Number of empty cells before the first visible day
  const colIndexOfFirst = visibleWeekdays.indexOf(
    toWeekdayMondayFirst(firstVisibleDay),
  );
  const leadingEmpty = Math.max(0, colIndexOfFirst);

  const cells: Array<{ date: Date | null; slotsCount: number }> = [];
  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push({ date: null, slotsCount: 0 });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), day);
    if (!visibleWeekdays.includes(toWeekdayMondayFirst(date))) continue;
    cells.push({
      date,
      slotsCount: occurrences.filter(
        (occurrence) =>
          (occurrence.status ?? "PLANNED") === "PLANNED" &&
          occurrence.occurrenceDate === toIsoDateString(date),
      ).length,
    });
  }

  while (cells.length % columns !== 0) {
    cells.push({ date: null, slotsCount: 0 });
  }

  return cells;
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
