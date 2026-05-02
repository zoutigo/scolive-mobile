import {
  parseDateInput,
  toIsoDateString,
  toWeekdayMondayFirst,
} from "./timetable";
import type { HomeworkDetail, HomeworkRow } from "../types/homework.types";

export function parseHomeworkExpectedDate(value: string): Date | null {
  if (!value) return null;
  const candidate = new Date(value);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

export function sortHomework(items: HomeworkRow[]): HomeworkRow[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.expectedAt).getTime() - new Date(b.expectedAt).getTime() ||
      a.title.localeCompare(b.title),
  );
}

export function sortHomeworkComments(detail: HomeworkDetail): HomeworkDetail {
  return {
    ...detail,
    comments: [...detail.comments].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
    completionStatuses: [...detail.completionStatuses].sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    ),
  };
}

export function homeworkDateKey(expectedAt: string): string {
  const date = parseHomeworkExpectedDate(expectedAt);
  if (!date) {
    return expectedAt.slice(0, 10);
  }
  return toIsoDateString(date);
}

export function formatHomeworkDateTime(value: string): string {
  const date = parseHomeworkExpectedDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatHomeworkShortDate(value: string): string {
  const date = parseHomeworkExpectedDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function buildHomeworkMonthCells(
  cursorDate: Date,
  items: HomeworkRow[],
  showSaturday: boolean,
  showSunday: boolean,
): Array<{ date: Date | null; slotsCount: number }> {
  const daysInMonth = new Date(
    cursorDate.getFullYear(),
    cursorDate.getMonth() + 1,
    0,
  ).getDate();

  const visibleWeekdays: number[] = [1, 2, 3, 4, 5];
  if (showSaturday) visibleWeekdays.push(6);
  if (showSunday) visibleWeekdays.push(7);
  const columns = visibleWeekdays.length;

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

  const leadingEmpty = Math.max(
    0,
    visibleWeekdays.indexOf(toWeekdayMondayFirst(firstVisibleDay)),
  );
  const cells: Array<{ date: Date | null; slotsCount: number }> = [];
  for (let index = 0; index < leadingEmpty; index += 1) {
    cells.push({ date: null, slotsCount: 0 });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), day);
    if (!visibleWeekdays.includes(toWeekdayMondayFirst(date))) continue;
    const dateKey = toIsoDateString(date);
    cells.push({
      date,
      slotsCount: items.filter(
        (item) => homeworkDateKey(item.expectedAt) === dateKey,
      ).length,
    });
  }

  while (cells.length % columns !== 0) {
    cells.push({ date: null, slotsCount: 0 });
  }

  return cells;
}

export function getHomeworkWeekendVisibility(items: HomeworkRow[]) {
  let showSaturday = false;
  let showSunday = false;

  for (const item of items) {
    const date = parseHomeworkExpectedDate(item.expectedAt);
    if (!date) continue;
    const weekday = toWeekdayMondayFirst(date);
    if (weekday === 6) showSaturday = true;
    if (weekday === 7) showSunday = true;
    if (showSaturday && showSunday) break;
  }

  return { showSaturday, showSunday };
}

export function isHomeworkDone(item: HomeworkRow | HomeworkDetail): boolean {
  return Boolean(item.myDoneAt);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function extractImageUrls(html: string): string[] {
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    if (match[1]) {
      urls.push(match[1]);
    }
    match = regex.exec(html);
  }
  return urls;
}

export function isoToLocalInput(value: string): string {
  const date = parseHomeworkExpectedDate(value);
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function localInputToIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const candidate = new Date(trimmed);
  return Number.isNaN(candidate.getTime()) ? trimmed : candidate.toISOString();
}

export function formatHomeworkDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

export function parseHomeworkDateOnly(value: string): Date | null {
  return parseDateInput(value);
}
