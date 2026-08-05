import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { useTimetableStore } from "../../store/timetable.store";
import type { SlotEditContext } from "../../store/timetable.store";
import type { TimetableOccurrence } from "../../types/timetable.types";
import {
  addDays,
  addMonths,
  buildCompactMonthCalendarCells,
  formatMonthLabel,
  formatWeekRangeLabel,
  sameDate,
  startOfWeek,
  toIsoDateString,
  TimetableCalendarViewMode,
} from "../../utils/timetable";
import {
  buildWeekDays,
  DayCard,
  findInitialMonthSelection,
  findInitialWeekSelection,
  formatDayNavLabel,
  getModeOptions,
  MonthAgenda,
  MonthGrid,
  WeekGrid,
  WeekSelection,
} from "./StudentTimetableScreen";
import { EmptyState, ErrorBanner, LoadingBlock } from "./TimetableCommon";
import { useTranslation } from "../../i18n/useTranslation";

// Context metadata attached to each occurrence at aggregation time
export type OccurrenceContext = {
  classId: string;
  className: string;
  schoolYearId: string;
};

export interface TimetablePaneProps {
  testIDPrefix: string;
  isLoading: boolean;
  hasData: boolean;
  errorMessage: string | null;
  occurrences: TimetableOccurrence[];
  subjectColorById: Record<string, string>;
  showSaturday: boolean;
  showSunday: boolean;
  viewMode: TimetableCalendarViewMode;
  setViewMode: (mode: TimetableCalendarViewMode) => void;
  cursorDate: Date;
  setCursorDate: (date: Date) => void;
  selectedWeekCell: WeekSelection | null;
  setSelectedWeekCell: (cell: WeekSelection | null) => void;
  selectedMonthDate: Date | null;
  setSelectedMonthDate: (date: Date | null) => void;
  today: Date;
  insetBottom: number;
  onRefresh: () => void;
  emptyTitle: string;
  emptyMessage: string;
  // Edit panel props
  teacherUserId?: string;
  /** En mode admin : toutes les occurrences sont éditables */
  isAdminMode?: boolean;
  getOccurrenceContext?: (occId: string) => OccurrenceContext | undefined;
  schoolSlug?: string;
  canCreate?: boolean;
  prefilledClassId?: string;
  /** En mode admin user pane : pré-sélectionne cet enseignant dans le formulaire de création */
  prefilledTeacherId?: string;
}

export function TimetablePane({
  testIDPrefix,
  isLoading,
  hasData,
  errorMessage,
  occurrences,
  subjectColorById,
  showSaturday,
  showSunday,
  viewMode,
  setViewMode,
  cursorDate,
  setCursorDate,
  selectedWeekCell,
  setSelectedWeekCell,
  selectedMonthDate,
  setSelectedMonthDate,
  today,
  insetBottom,
  onRefresh,
  emptyTitle,
  emptyMessage,
  teacherUserId,
  isAdminMode,
  getOccurrenceContext,
  schoolSlug,
  canCreate,
  prefilledClassId,
  prefilledTeacherId,
}: TimetablePaneProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { setPendingSlotEdit } = useTimetableStore();

  // Refs pour le scroll automatique vers le détail semaine / agenda mois
  const scrollRef = useRef<import("react-native").ScrollView>(null);
  const weekDetailY = useRef(0);
  const monthAgendaY = useRef(0);

  // Vue semaine : scroll vers le détail quand un créneau est sélectionné
  useEffect(() => {
    if (viewMode !== "week" || !selectedWeekCell) return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: weekDetailY.current - 12,
        animated: true,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedWeekCell, viewMode]);

  // Vue mois : scroll vers l'agenda du jour quand une date est sélectionnée
  useEffect(() => {
    if (viewMode !== "month" || !selectedMonthDate) return;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: monthAgendaY.current - 12,
        animated: true,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedMonthDate, viewMode]);
  const isTeacherOcc = useCallback(
    (occ: TimetableOccurrence) => {
      if (isAdminMode) return true;
      return !!teacherUserId && occ.teacherUser.id === teacherUserId;
    },
    [isAdminMode, teacherUserId],
  );

  const openEdit = useCallback(
    (occ: TimetableOccurrence) => {
      const occCtx = getOccurrenceContext?.(occ.id);
      if (!occCtx || !schoolSlug) return;
      const editCtx: SlotEditContext = {
        occurrence: occ,
        className: occCtx.className,
        classId: occCtx.classId,
        schoolYearId: occCtx.schoolYearId,
        adminMode: isAdminMode,
      };
      setPendingSlotEdit(editCtx);
      router.push("/(home)/agenda/slot-edit");
    },
    [getOccurrenceContext, schoolSlug, isAdminMode, setPendingSlotEdit, router],
  );

  const openCreate = useCallback(() => {
    const params = new URLSearchParams();
    if (prefilledClassId) params.set("classId", prefilledClassId);
    if (prefilledTeacherId) params.set("teacherId", prefilledTeacherId);
    params.set("date", toIsoDateString(cursorDate));
    const href =
      `/(home)/agenda/slot-create?${params.toString()}` as Parameters<
        typeof router.push
      >[0];
    router.push(href);
  }, [prefilledClassId, prefilledTeacherId, cursorDate, router]);
  const modeOptions = useMemo(() => getModeOptions(t), [t]);
  const weekDays = useMemo(
    () => buildWeekDays(cursorDate, t),
    [cursorDate, locale],
  );
  const visibleWeekDays = useMemo(
    () =>
      weekDays.filter((entry) => {
        if (entry.weekday <= 5) return true;
        if (entry.weekday === 6) return showSaturday;
        if (entry.weekday === 7) return showSunday;
        return false;
      }),
    [showSaturday, showSunday, weekDays],
  );

  useEffect(() => {
    if (viewMode !== "week") return;
    setSelectedWeekCell(
      findInitialWeekSelection(occurrences, visibleWeekDays, cursorDate),
    );
  }, [cursorDate, occurrences, viewMode, visibleWeekDays, setSelectedWeekCell]);

  const compactMonthCells = useMemo(
    () =>
      buildCompactMonthCalendarCells(
        cursorDate,
        occurrences,
        showSaturday,
        showSunday,
      ),
    [cursorDate, occurrences, showSaturday, showSunday],
  );

  useEffect(() => {
    if (viewMode !== "month") return;
    setSelectedMonthDate(
      findInitialMonthSelection(compactMonthCells, occurrences, cursorDate),
    );
  }, [
    compactMonthCells,
    cursorDate,
    occurrences,
    viewMode,
    setSelectedMonthDate,
  ]);

  const daySlots = useMemo(
    () =>
      occurrences.filter(
        (o) => o.occurrenceDate === toIsoDateString(cursorDate),
      ),
    [cursorDate, occurrences],
  );

  const monthAgenda = useMemo(() => {
    if (!selectedMonthDate) return [];
    return occurrences.filter(
      (o) => o.occurrenceDate === toIsoDateString(selectedMonthDate),
    );
  }, [occurrences, selectedMonthDate]);

  const periodLabel = useMemo(() => {
    if (viewMode === "day")
      return formatDayNavLabel(cursorDate, today, t, locale);
    if (viewMode === "week") {
      return sameDate(startOfWeek(cursorDate), startOfWeek(today))
        ? t("timetable.common.thisWeek")
        : formatWeekRangeLabel(cursorDate);
    }
    return cursorDate.getMonth() === today.getMonth() &&
      cursorDate.getFullYear() === today.getFullYear()
      ? t("timetable.common.thisMonth")
      : formatMonthLabel(cursorDate);
  }, [cursorDate, today, viewMode, t, locale]);

  function moveCursor(direction: -1 | 1) {
    if (viewMode === "day") {
      setCursorDate(addDays(cursorDate, direction));
      return;
    }
    if (viewMode === "week") {
      setCursorDate(addDays(cursorDate, direction * 7));
      return;
    }
    setCursorDate(addMonths(cursorDate, direction));
  }

  function resetToToday() {
    setCursorDate(today);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.root}
        contentContainerStyle={[
          styles.paneContent,
          { paddingBottom: insetBottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        testID={`${testIDPrefix}-pane`}
      >
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        {isLoading && !hasData ? (
          <View style={styles.moduleCard}>
            <LoadingBlock label={t("timetable.common.loadingAgenda")} />
          </View>
        ) : (
          <View style={styles.moduleCard}>
            {/* Mode tabs */}
            <View style={styles.modeTabs} testID={`${testIDPrefix}-mode-tabs`}>
              {modeOptions.map((entry) => {
                const active = viewMode === entry.value;
                return (
                  <TouchableOpacity
                    key={entry.value}
                    style={[styles.modeTab, active && styles.modeTabActive]}
                    onPress={() => setViewMode(entry.value)}
                    testID={`${testIDPrefix}-mode-${entry.value}`}
                  >
                    <Text
                      style={[
                        styles.modeTabText,
                        active && styles.modeTabTextActive,
                      ]}
                    >
                      {entry.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Period navigation */}
            <View style={styles.periodNavRow}>
              <TouchableOpacity
                style={styles.periodNavButton}
                onPress={() => moveCursor(-1)}
                testID={`${testIDPrefix}-nav-prev`}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.periodLabelButton}
                onPress={resetToToday}
                testID={`${testIDPrefix}-nav-label`}
              >
                <Text style={styles.periodLabelText}>{periodLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.periodNavButton}
                onPress={() => moveCursor(1)}
                testID={`${testIDPrefix}-nav-next`}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Day view */}
            {viewMode === "day" ? (
              <View style={styles.dayList} testID={`${testIDPrefix}-day-list`}>
                {daySlots.length === 0 ? (
                  <EmptyState
                    icon="calendar-clear-outline"
                    title={emptyTitle}
                    message={emptyMessage}
                  />
                ) : (
                  daySlots.map((occurrence) => (
                    <DayCard
                      key={occurrence.id}
                      occurrence={occurrence}
                      colorHex={subjectColorById[occurrence.subject.id]}
                      testIDPrefix={testIDPrefix}
                      className={
                        getOccurrenceContext?.(occurrence.id)?.className
                      }
                      onEditPress={
                        isTeacherOcc(occurrence)
                          ? () => openEdit(occurrence)
                          : undefined
                      }
                    />
                  ))
                )}
              </View>
            ) : null}

            {/* Week view */}
            {viewMode === "week" ? (
              <View style={styles.weekSection}>
                <WeekGrid
                  visibleWeekDays={visibleWeekDays}
                  occurrences={occurrences}
                  selectedWeekCell={selectedWeekCell}
                  setSelectedWeekCell={setSelectedWeekCell}
                  subjectColorById={subjectColorById}
                  today={today}
                  testIDPrefix={testIDPrefix}
                />
                <View
                  style={styles.weekSelectedSlotSection}
                  testID={`${testIDPrefix}-week-detail`}
                  onLayout={(e) => {
                    weekDetailY.current = e.nativeEvent.layout.y;
                  }}
                >
                  <Text style={styles.weekSelectedSlotLabel}>
                    {t("timetable.common.weekSelectedSlotLabel")}
                  </Text>
                  {selectedWeekCell ? (
                    <DayCard
                      occurrence={selectedWeekCell.occurrence}
                      colorHex={
                        subjectColorById[selectedWeekCell.occurrence.subject.id]
                      }
                      testIDPrefix={testIDPrefix}
                      className={
                        getOccurrenceContext?.(selectedWeekCell.occurrence.id)
                          ?.className
                      }
                      onEditPress={
                        isTeacherOcc(selectedWeekCell.occurrence)
                          ? () => openEdit(selectedWeekCell.occurrence)
                          : undefined
                      }
                    />
                  ) : (
                    <Text style={styles.weekSelectedSlotPlaceholder}>
                      {t("timetable.common.weekSelectedSlotPlaceholder")}
                    </Text>
                  )}
                </View>
              </View>
            ) : null}

            {/* Month view */}
            {viewMode === "month" ? (
              <View style={styles.monthSection}>
                <MonthGrid
                  cells={compactMonthCells}
                  selectedDate={selectedMonthDate}
                  onSelectDate={setSelectedMonthDate}
                  showSaturday={showSaturday}
                  showSunday={showSunday}
                  testIDPrefix={testIDPrefix}
                />
                <View
                  onLayout={(e) => {
                    monthAgendaY.current = e.nativeEvent.layout.y;
                  }}
                >
                  <MonthAgenda
                    selectedDate={selectedMonthDate}
                    agenda={monthAgenda}
                    subjectColorById={subjectColorById}
                    testIDPrefix={testIDPrefix}
                    getClassName={(occId) =>
                      getOccurrenceContext?.(occId)?.className
                    }
                    onEditPress={(occ) => {
                      if (isTeacherOcc(occ)) openEdit(occ);
                    }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* FAB — création d'un nouveau créneau */}
      {canCreate ? (
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: insetBottom + 20 + BOTTOM_TAB_BAR_HEIGHT },
          ]}
          onPress={openCreate}
          testID={`${testIDPrefix}-fab-create`}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  paneContent: { paddingHorizontal: 16, gap: 12 },
  moduleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0D9BF",
    backgroundColor: "#FFF9F1",
    padding: 8,
    gap: 12,
  },

  modeTabs: {
    flexDirection: "row",
    gap: 1,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: "#F8FBFF",
  },
  modeTab: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modeTabText: { fontSize: 12, fontWeight: "700", color: "#2B4A74" },
  modeTabTextActive: { color: colors.white },

  periodNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  periodNavButton: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  periodLabelButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  periodLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#163158",
  },

  dayList: { gap: 10 },
  weekSection: { gap: 12 },
  weekSelectedSlotSection: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: "#F9FCFF",
    padding: 12,
    gap: 10,
  },
  weekSelectedSlotLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#4C6284",
    textTransform: "uppercase",
  },
  weekSelectedSlotPlaceholder: {
    fontSize: 12,
    color: "#8192A8",
  },
  monthSection: { gap: 12 },

  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
