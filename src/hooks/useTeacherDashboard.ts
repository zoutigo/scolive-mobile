import { useCallback, useEffect, useState } from "react";
import { homeworkApi } from "../api/homework.api";
import { messagingApi } from "../api/messaging.api";
import { notesApi } from "../api/notes.api";
import { teacherClassNavApi } from "../api/teacher-class-nav.api";
import { timetableApi } from "../api/timetable.api";
import type { HomeworkRow } from "../types/homework.types";
import type { MessageListItem, MessagesMeta } from "../types/messaging.types";
import type { EvaluationRow } from "../types/notes.types";
import type {
  TimetableClassOption,
  TimetableOccurrence,
} from "../types/timetable.types";
import { stripTime, toIsoDateString } from "../utils/timetable";

const EMPTY_META: MessagesMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export type DashboardClass = TimetableClassOption & {
  openHomeworkCount: number;
  pendingEvalCount: number;
};

export type DashboardTimetableSlot = TimetableOccurrence & {
  classId: string;
  className: string;
};

export type DashboardEvaluation = {
  evaluation: EvaluationRow;
  classId: string;
  className: string;
  studentCount: number;
};

export type DashboardHomework = {
  homework: HomeworkRow;
  classId: string;
  className: string;
  totalStudents: number;
};

export type TeacherDashboardData = {
  classes: DashboardClass[];
  unreadCount: number;
  unreadMessages: MessageListItem[];
  todaySlots: DashboardTimetableSlot[];
  pendingEvaluations: DashboardEvaluation[];
  openHomework: DashboardHomework[];
};

export function useTeacherDashboard(schoolSlug: string | null, userId: string) {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const classOptionsResponse =
        await teacherClassNavApi.getClassOptions(schoolSlug);
      const classes = classOptionsResponse.classes;
      const today = toIsoDateString(stripTime(new Date()));

      const [
        timetables,
        unreadCount,
        messagesResponse,
        evaluationsByClass,
        homeworkByClass,
      ] = await Promise.all([
        classes.length > 0
          ? Promise.all(
              classes.map((cls) =>
                timetableApi
                  .getClassTimetable(schoolSlug, cls.classId, {
                    fromDate: today,
                    toDate: today,
                  })
                  .catch(() => null),
              ),
            )
          : Promise.resolve([] as null[]),
        messagingApi.unreadCount(schoolSlug).catch(() => 0),
        messagingApi
          .list(schoolSlug, { folder: "inbox", limit: 10 })
          .catch(() => ({ items: [] as MessageListItem[], meta: EMPTY_META })),
        classes.length > 0
          ? Promise.all(
              classes.map((cls) =>
                notesApi
                  .listClassEvaluations(schoolSlug, cls.classId)
                  .catch((): EvaluationRow[] => []),
              ),
            )
          : Promise.resolve([] as EvaluationRow[][]),
        classes.length > 0
          ? Promise.all(
              classes.map((cls) =>
                homeworkApi
                  .listClassHomework(schoolSlug, cls.classId)
                  .catch((): HomeworkRow[] => []),
              ),
            )
          : Promise.resolve([] as HomeworkRow[][]),
      ]);

      const todaySlots: DashboardTimetableSlot[] = [];
      for (let i = 0; i < classes.length; i++) {
        const timetable = timetables[i];
        if (!timetable) continue;
        const cls = classes[i]!;
        for (const occ of timetable.occurrences) {
          if (
            occ.teacherUser.id === userId &&
            occ.occurrenceDate === today &&
            (occ.status ?? "PLANNED") === "PLANNED"
          ) {
            todaySlots.push({
              ...occ,
              classId: cls.classId,
              className: cls.className,
            });
          }
        }
      }
      todaySlots.sort((a, b) => a.startMinute - b.startMinute);

      const unreadMessages = (messagesResponse.items ?? [])
        .filter((m) => m.unread)
        .slice(0, 2);

      const pendingEvaluations: DashboardEvaluation[] = [];
      for (let i = 0; i < classes.length; i++) {
        const cls = classes[i]!;
        const evals = evaluationsByClass[i] ?? [];
        for (const evaluation of evals) {
          if (
            cls.studentCount > 0 &&
            evaluation._count.scores < cls.studentCount
          ) {
            pendingEvaluations.push({
              evaluation,
              classId: cls.classId,
              className: cls.className,
              studentCount: cls.studentCount,
            });
          }
        }
      }

      const openHomework: DashboardHomework[] = [];
      for (let i = 0; i < classes.length; i++) {
        const cls = classes[i]!;
        const hwList = homeworkByClass[i] ?? [];
        for (const hw of hwList) {
          const dueDate = hw.expectedAt.slice(0, 10);
          if (dueDate >= today) {
            openHomework.push({
              homework: hw,
              classId: cls.classId,
              className: cls.className,
              totalStudents: cls.studentCount,
            });
          }
        }
      }
      openHomework.sort((a, b) =>
        a.homework.expectedAt.localeCompare(b.homework.expectedAt),
      );

      // Per-class stats derived from the built arrays
      const dashboardClasses: DashboardClass[] = classes.map((cls) => ({
        ...cls,
        openHomeworkCount: openHomework.filter((h) => h.classId === cls.classId)
          .length,
        pendingEvalCount: pendingEvaluations.filter(
          (e) => e.classId === cls.classId,
        ).length,
      }));

      setData({
        classes: dashboardClasses,
        unreadCount,
        unreadMessages,
        todaySlots,
        pendingEvaluations: pendingEvaluations.slice(0, 2),
        openHomework: openHomework.slice(0, 2),
      });
    } catch {
      setError("Impossible de charger le tableau de bord.");
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug, userId]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  return { data, isLoading, error, refresh: load };
}
