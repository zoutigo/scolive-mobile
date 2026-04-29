import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { buildChildHomeTarget } from "../navigation/nav-config";
import { useDrawer } from "../navigation/drawer-context";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { useTimetableStore } from "../../store/timetable.store";
import type { TimetableOccurrence } from "../../types/timetable.types";
import {
  addDays,
  addMonths,
  buildCompactMonthCalendarCells,
  buildTimetableRangeForView,
  formatMonthLabel,
  formatWeekRangeLabel,
  fullTeacherName,
  minuteToTimeLabel,
  parseOccurrenceDate,
  sameDate,
  startOfWeek,
  stripTime,
  subjectShortLabel,
  subjectVisualTone,
  TimetableCalendarViewMode,
  toIsoDateString,
  toWeekdayMondayFirst,
} from "../../utils/timetable";
import { EmptyState, ErrorBanner, LoadingBlock } from "./TimetableCommon";

export const MODE_OPTIONS: Array<{
  value: TimetableCalendarViewMode;
  label: string;
}> = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
];

const WEEKDAY_LABELS_FULL = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

const WEEKDAY_LABELS_COMPACT = ["L", "M", "M", "J", "V", "S", "D"] as const;

export type WeekSelection = {
  occurrence: TimetableOccurrence;
  date: Date;
};

function teacherLabel(occurrence: TimetableOccurrence): string {
  return fullTeacherName(occurrence.teacherUser);
}

export function buildWeekDays(cursorDate: Date) {
  const weekStart = startOfWeek(cursorDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      weekday: index + 1,
      date,
      label: WEEKDAY_LABELS_FULL[index] ?? "",
      compactLabel: WEEKDAY_LABELS_COMPACT[index] ?? "",
    };
  });
}

export function formatDayNavLabel(cursorDate: Date, today: Date) {
  const full = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(cursorDate);
  const label = full.charAt(0).toUpperCase() + full.slice(1);
  return sameDate(cursorDate, today) ? `Aujourd'hui · ${label}` : label;
}

export function formatDetailDay(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function findInitialWeekSelection(
  occurrences: TimetableOccurrence[],
  visibleWeekDays: ReturnType<typeof buildWeekDays>,
  cursorDate: Date,
): WeekSelection | null {
  const byDate = visibleWeekDays.flatMap((entry) =>
    occurrences
      .filter(
        (occurrence) =>
          occurrence.occurrenceDate === toIsoDateString(entry.date) &&
          (occurrence.status ?? "PLANNED") === "PLANNED",
      )
      .sort((a, b) => a.startMinute - b.startMinute)
      .map((occurrence) => ({ occurrence, date: entry.date })),
  );

  return (
    byDate.find((entry) => sameDate(entry.date, cursorDate)) ??
    byDate[0] ??
    null
  );
}

export function findInitialMonthSelection(
  monthCells: Array<{ date: Date | null; slotsCount: number }>,
  occurrences: TimetableOccurrence[],
  cursorDate: Date,
): Date | null {
  const activeCursorCell = monthCells.find(
    (entry) => entry.date && sameDate(entry.date, cursorDate),
  );
  if (activeCursorCell?.date) {
    return activeCursorCell.date;
  }

  const firstPlannedOccurrence = occurrences
    .filter((occurrence) => (occurrence.status ?? "PLANNED") === "PLANNED")
    .map((occurrence) => parseOccurrenceDate(occurrence.occurrenceDate))
    .find(
      (date): date is Date =>
        date instanceof Date &&
        date.getMonth() === cursorDate.getMonth() &&
        date.getFullYear() === cursorDate.getFullYear(),
    );

  return (
    firstPlannedOccurrence ??
    monthCells.find((entry) => entry.date)?.date ??
    null
  );
}

export function ChildTimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = typeof params.childId === "string" ? params.childId : "";
  const { schoolSlug } = useAuthStore();
  const { setActiveChild, updateChild } = useFamilyStore();
  const {
    myTimetable,
    isLoadingMyTimetable,
    errorMessage,
    loadMyTimetable,
    clearError,
  } = useTimetableStore();

  const today = useMemo(() => stripTime(new Date()), []);
  const [viewMode, setViewMode] = useState<TimetableCalendarViewMode>("day");
  const [cursorDate, setCursorDate] = useState(today);
  const [selectedWeekCell, setSelectedWeekCell] =
    useState<WeekSelection | null>(null);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | null>(
    today,
  );

  const range = useMemo(
    () => buildTimetableRangeForView(viewMode, cursorDate),
    [cursorDate, viewMode],
  );

  const load = useCallback(async () => {
    if (!schoolSlug || !childId) return;
    await loadMyTimetable(schoolSlug, {
      childId,
      fromDate: range.fromDate,
      toDate: range.toDate,
    });
  }, [childId, loadMyTimetable, range.fromDate, range.toDate, schoolSlug]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!childId) return;
    setActiveChild(childId);
  }, [childId, setActiveChild]);

  useEffect(() => {
    if (!childId || !myTimetable?.class.name) return;
    updateChild(childId, {
      className: myTimetable.class.name,
      firstName: myTimetable.student.firstName,
      lastName: myTimetable.student.lastName,
    });
  }, [childId, myTimetable, updateChild]);

  const subtitle = useMemo(() => {
    if (!myTimetable) return "";
    return `${myTimetable.student.firstName} ${myTimetable.student.lastName} • ${myTimetable.class.name}`;
  }, [myTimetable]);

  const plannedOccurrences = useMemo(
    () =>
      (myTimetable?.occurrences ?? [])
        .filter((occurrence) => (occurrence.status ?? "PLANNED") === "PLANNED")
        .sort((a, b) =>
          `${a.occurrenceDate}-${a.startMinute}`.localeCompare(
            `${b.occurrenceDate}-${b.startMinute}`,
          ),
        ),
    [myTimetable?.occurrences],
  );

  const { showSaturday, showSunday } = useMemo(() => {
    const recurringSlots = myTimetable?.slots ?? [];
    return {
      showSaturday: recurringSlots.some((s) => s.weekday === 6),
      showSunday: recurringSlots.some((s) => s.weekday === 7),
    };
  }, [myTimetable?.slots]);

  const subjectColorById = useMemo(
    () =>
      Object.fromEntries(
        (myTimetable?.subjectStyles ?? []).map((entry) => [
          entry.subjectId,
          entry.colorHex,
        ]),
      ),
    [myTimetable?.subjectStyles],
  );

  const daySlots = useMemo(
    () =>
      plannedOccurrences.filter(
        (occurrence) =>
          occurrence.occurrenceDate === toIsoDateString(cursorDate),
      ),
    [cursorDate, plannedOccurrences],
  );

  const weekDays = useMemo(() => buildWeekDays(cursorDate), [cursorDate]);
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
      findInitialWeekSelection(plannedOccurrences, visibleWeekDays, cursorDate),
    );
  }, [cursorDate, plannedOccurrences, viewMode, visibleWeekDays]);

  const compactMonthCells = useMemo(
    () =>
      buildCompactMonthCalendarCells(
        cursorDate,
        plannedOccurrences,
        showSaturday,
        showSunday,
      ),
    [cursorDate, showSaturday, showSunday, plannedOccurrences],
  );

  useEffect(() => {
    if (viewMode !== "month") return;
    setSelectedMonthDate(
      findInitialMonthSelection(
        compactMonthCells,
        plannedOccurrences,
        cursorDate,
      ),
    );
  }, [compactMonthCells, cursorDate, plannedOccurrences, viewMode]);

  const monthAgenda = useMemo(() => {
    if (!selectedMonthDate) return [];
    return plannedOccurrences.filter(
      (occurrence) =>
        occurrence.occurrenceDate === toIsoDateString(selectedMonthDate),
    );
  }, [plannedOccurrences, selectedMonthDate]);

  const periodLabel = useMemo(() => {
    if (viewMode === "day") {
      return formatDayNavLabel(cursorDate, today);
    }
    if (viewMode === "week") {
      return sameDate(startOfWeek(cursorDate), startOfWeek(today))
        ? "Cette semaine"
        : formatWeekRangeLabel(cursorDate);
    }
    return cursorDate.getMonth() === today.getMonth() &&
      cursorDate.getFullYear() === today.getFullYear()
      ? "Ce mois"
      : formatMonthLabel(cursorDate);
  }, [cursorDate, today, viewMode]);

  function moveCursor(direction: -1 | 1) {
    if (viewMode === "day") {
      const hiddenWeekdays = [
        ...(showSaturday ? [] : [6]),
        ...(showSunday ? [] : [7]),
      ];
      let next = addDays(cursorDate, direction);
      while (hiddenWeekdays.includes(toWeekdayMondayFirst(next))) {
        next = addDays(next, direction);
      }
      setCursorDate(next);
      return;
    }

    if (viewMode === "week") {
      setCursorDate(addDays(cursorDate, direction * 7));
      return;
    }

    setCursorDate(addMonths(cursorDate, direction));
  }

  function resetToCurrentPeriod() {
    const hiddenWeekdays = [
      ...(showSaturday ? [] : [6]),
      ...(showSunday ? [] : [7]),
    ];
    if (viewMode === "day" && hiddenWeekdays.length > 0) {
      let next = today;
      while (hiddenWeekdays.includes(toWeekdayMondayFirst(next))) {
        next = addDays(next, 1);
      }
      setCursorDate(next);
      return;
    }
    setCursorDate(today);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 0, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingMyTimetable}
            onRefresh={() => {
              clearError();
              void load().catch(() => {});
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ModuleHeader
          title="Emploi du temps"
          subtitle={subtitle}
          onBack={() => router.push(buildChildHomeTarget(childId) as never)}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          testID="child-timetable-header"
          backTestID="child-timetable-back"
          titleTestID="child-timetable-header-title"
          subtitleTestID="child-timetable-header-subtitle"
          rightTestID="child-timetable-menu"
          topInset={insets.top}
        />

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        {isLoadingMyTimetable && !myTimetable ? (
          <View style={styles.panelCard}>
            <LoadingBlock label="Chargement de l'emploi du temps..." />
          </View>
        ) : myTimetable ? (
          <View style={styles.moduleCard}>
            <View style={styles.modeTabs} testID="child-timetable-mode-tabs">
              {MODE_OPTIONS.map((entry) => {
                const active = viewMode === entry.value;
                return (
                  <TouchableOpacity
                    key={entry.value}
                    style={[styles.modeTab, active && styles.modeTabActive]}
                    onPress={() => setViewMode(entry.value)}
                    testID={`child-timetable-mode-${entry.value}`}
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

            <View style={styles.periodNavRow}>
              <TouchableOpacity
                style={styles.periodNavButton}
                onPress={() => moveCursor(-1)}
                testID="child-timetable-nav-prev"
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.periodLabelButton}
                onPress={resetToCurrentPeriod}
                testID="child-timetable-nav-label"
              >
                <Text style={styles.periodLabelText}>{periodLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.periodNavButton}
                onPress={() => moveCursor(1)}
                testID="child-timetable-nav-next"
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {viewMode === "day" ? (
              <View style={styles.dayList} testID="child-timetable-day-list">
                {daySlots.length === 0 ? (
                  <EmptyState
                    icon="calendar-clear-outline"
                    title="Aucun cours"
                    message="Aucun créneau n'est prévu pour cette journée."
                  />
                ) : (
                  daySlots.map((occurrence) => (
                    <DayCard
                      key={occurrence.id}
                      occurrence={occurrence}
                      colorHex={subjectColorById[occurrence.subject.id]}
                    />
                  ))
                )}
              </View>
            ) : null}

            {viewMode === "week" ? (
              <View style={styles.weekSection}>
                <WeekGrid
                  visibleWeekDays={visibleWeekDays}
                  occurrences={plannedOccurrences}
                  selectedWeekCell={selectedWeekCell}
                  setSelectedWeekCell={setSelectedWeekCell}
                  subjectColorById={subjectColorById}
                  today={today}
                />
                <WeekDetailCard
                  selectedWeekCell={selectedWeekCell}
                  colorHex={
                    selectedWeekCell
                      ? subjectColorById[selectedWeekCell.occurrence.subject.id]
                      : undefined
                  }
                />
              </View>
            ) : null}

            {viewMode === "month" ? (
              <View style={styles.monthSection}>
                <MonthGrid
                  cells={compactMonthCells}
                  selectedDate={selectedMonthDate}
                  onSelectDate={setSelectedMonthDate}
                  showSaturday={showSaturday}
                  showSunday={showSunday}
                />
                <MonthAgenda
                  selectedDate={selectedMonthDate}
                  agenda={monthAgenda}
                  subjectColorById={subjectColorById}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.panelCard}>
            <EmptyState
              icon="calendar-clear-outline"
              title="Impossible d'afficher ce planning"
              message="Vérifiez que l'enfant est bien lié à ce compte parent."
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function DayCard({
  occurrence,
  colorHex,
  testIDPrefix = "child-timetable",
  className,
  onEditPress,
}: {
  occurrence: TimetableOccurrence;
  colorHex?: string;
  testIDPrefix?: string;
  className?: string;
  onEditPress?: () => void;
}) {
  const tone = subjectVisualTone(colorHex);

  return (
    <View
      style={[
        styles.dayCard,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
        },
      ]}
      testID={`${testIDPrefix}-day-card-${occurrence.id}`}
    >
      <View style={styles.dayCardBody}>
        <View style={styles.dayCardMain}>
          <View style={styles.dayCardHeader}>
            <Text
              style={[styles.dayCardTitle, { color: tone.text, flex: 1 }]}
              numberOfLines={1}
            >
              {minuteToTimeLabel(occurrence.startMinute)} -{" "}
              {minuteToTimeLabel(occurrence.endMinute)} ·{" "}
              {occurrence.subject.name}
            </Text>
          </View>
          <Text style={styles.dayCardTeacher}>{teacherLabel(occurrence)}</Text>
          <View style={styles.dayCardFooter}>
            {occurrence.room ? (
              <Text style={styles.dayCardRoom}>SALLE {occurrence.room}</Text>
            ) : null}
            {className ? (
              <Text
                style={styles.dayCardClass}
                testID={`${testIDPrefix}-day-card-class-${occurrence.id}`}
              >
                {className}
              </Text>
            ) : null}
          </View>
        </View>
        {onEditPress ? (
          <TouchableOpacity
            onPress={onEditPress}
            style={styles.dayCardEditRail}
            testID={`${testIDPrefix}-day-card-edit-${occurrence.id}`}
          >
            <Ionicons name="pencil" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// Horizontal space consumed by all containers wrapping the week timeline:
//   content paddingHorizontal (16) + moduleCard padding+border (9) + weekGridCard padding+border (9)
//   times 2 sides = 68px
const WEEK_GRID_OUTER_H_PADDING = 68;
const WEEK_CORNER_WIDTH = 36;
const WEEK_COL_GAP = 2;
const WEEK_MIN_DAY_COL_WIDTH = 56;

export function computeWeekDayColumnWidth(
  screenWidth: number,
  nDays: number,
): number {
  const available = screenWidth - WEEK_GRID_OUTER_H_PADDING;
  const raw = (available - WEEK_CORNER_WIDTH - nDays * WEEK_COL_GAP) / nDays;
  return Math.max(WEEK_MIN_DAY_COL_WIDTH, Math.floor(raw));
}

export function WeekGrid({
  visibleWeekDays,
  occurrences,
  selectedWeekCell,
  setSelectedWeekCell,
  subjectColorById,
  today,
  testIDPrefix = "child-timetable",
}: {
  visibleWeekDays: ReturnType<typeof buildWeekDays>;
  occurrences: TimetableOccurrence[];
  selectedWeekCell: WeekSelection | null;
  setSelectedWeekCell: (value: WeekSelection | null) => void;
  subjectColorById: Record<string, string>;
  today: Date;
  testIDPrefix?: string;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const nDays = visibleWeekDays.length;
  const dayColWidth = computeWeekDayColumnWidth(screenWidth, nDays);
  const timelineWidth =
    WEEK_CORNER_WIDTH + nDays * (dayColWidth + WEEK_COL_GAP);

  const timelineStartMinute = 7 * 60;
  const timelineEndMinute = 18 * 60;
  const timelinePxPerHour = 36;
  const timelineHeight =
    ((timelineEndMinute - timelineStartMinute) / 60) * timelinePxPerHour;
  const timelineHours = Array.from(
    { length: (timelineEndMinute - timelineStartMinute) / 60 + 1 },
    (_, index) => timelineStartMinute + index * 60,
  );

  return (
    <View style={styles.weekGridCard} testID={`${testIDPrefix}-week-grid`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          style={[
            styles.weekTimeline,
            {
              width: timelineWidth,
            },
          ]}
        >
          <View style={styles.weekCornerCell}>
            <Text style={styles.weekCornerText}>H</Text>
          </View>
          {visibleWeekDays.map((entry) => (
            <View
              key={`week-head-${entry.weekday}`}
              style={[
                styles.weekHeaderCell,
                { width: dayColWidth },
                sameDate(entry.date, today) && styles.weekHeaderCellToday,
              ]}
            >
              <Text
                style={[
                  styles.weekHeaderText,
                  sameDate(entry.date, today) && styles.weekHeaderTextToday,
                ]}
              >
                {entry.compactLabel}{" "}
                {String(entry.date.getDate()).padStart(2, "0")}
              </Text>
            </View>
          ))}

          <View style={[styles.weekHoursColumn, { height: timelineHeight }]}>
            {timelineHours.map((hourMinute, index) => (
              <View
                key={`week-hour-${hourMinute}`}
                style={[
                  styles.weekHourLabelWrap,
                  {
                    top:
                      index === timelineHours.length - 1
                        ? timelineHeight - 12
                        : ((hourMinute - timelineStartMinute) / 60) *
                          timelinePxPerHour,
                  },
                ]}
              >
                <Text style={styles.weekHourLabel}>
                  {minuteToTimeLabel(hourMinute)}
                </Text>
              </View>
            ))}
          </View>

          {visibleWeekDays.map((entry) => {
            const dayOccurrences = occurrences.filter(
              (occurrence) =>
                occurrence.occurrenceDate === toIsoDateString(entry.date),
            );
            return (
              <View
                key={`week-col-${entry.weekday}`}
                style={[
                  styles.weekDayColumn,
                  { height: timelineHeight, width: dayColWidth },
                ]}
                testID={`${testIDPrefix}-week-col-${entry.weekday}`}
              >
                {timelineHours.slice(0, -1).map((hourMinute) => (
                  <View
                    key={`week-line-${entry.weekday}-${hourMinute}`}
                    style={[
                      styles.weekHourLine,
                      {
                        top:
                          ((hourMinute - timelineStartMinute) / 60) *
                          timelinePxPerHour,
                      },
                    ]}
                  />
                ))}

                {dayOccurrences.map((occurrence) => {
                  const tone = subjectVisualTone(
                    subjectColorById[occurrence.subject.id],
                  );
                  const clampedStart = Math.max(
                    timelineStartMinute,
                    Math.min(timelineEndMinute, occurrence.startMinute),
                  );
                  const clampedEnd = Math.max(
                    timelineStartMinute,
                    Math.min(timelineEndMinute, occurrence.endMinute),
                  );
                  const top =
                    ((clampedStart - timelineStartMinute) / 60) *
                    timelinePxPerHour;
                  const height = Math.max(
                    18,
                    ((Math.max(clampedEnd, clampedStart + 15) - clampedStart) /
                      60) *
                      timelinePxPerHour,
                  );
                  const selected =
                    selectedWeekCell?.occurrence.id === occurrence.id &&
                    selectedWeekCell?.date &&
                    sameDate(selectedWeekCell.date, entry.date);

                  return (
                    <TouchableOpacity
                      key={`week-slot-${entry.weekday}-${occurrence.id}`}
                      style={[
                        styles.weekSlot,
                        {
                          top,
                          minHeight: height,
                          backgroundColor: selected
                            ? tone.chip
                            : tone.background,
                          borderColor: selected ? tone.chip : tone.border,
                        },
                      ]}
                      onPress={() =>
                        setSelectedWeekCell({ occurrence, date: entry.date })
                      }
                      testID={`${testIDPrefix}-week-slot-${occurrence.id}`}
                    >
                      <Text
                        style={[
                          styles.weekSlotText,
                          { color: selected ? colors.white : tone.text },
                        ]}
                      >
                        {subjectShortLabel(occurrence.subject.name)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function WeekDetailCard({
  selectedWeekCell,
  colorHex,
  testIDPrefix = "child-timetable",
  className,
  onEditPress,
}: {
  selectedWeekCell: WeekSelection | null;
  colorHex?: string;
  testIDPrefix?: string;
  className?: string;
  onEditPress?: () => void;
}) {
  const tone = subjectVisualTone(colorHex);
  return (
    <View
      style={[
        styles.detailCard,
        selectedWeekCell && {
          backgroundColor: tone.background,
          borderColor: tone.border,
        },
      ]}
      testID={`${testIDPrefix}-week-detail`}
    >
      <View style={styles.detailCardLayout}>
        <View style={styles.detailCardContent}>
          <View style={styles.detailCardLabelRow}>
            <Text style={styles.detailCardLabel}>
              DETAIL DU CRENEAU SELECTIONNE
            </Text>
          </View>
          {selectedWeekCell ? (
            <View style={styles.detailCardBody}>
              <Text style={styles.detailCardText}>
                <Text style={styles.detailCardTextStrong}>Matière :</Text>{" "}
                {selectedWeekCell.occurrence.subject.name}
              </Text>
              {className ? (
                <Text
                  style={styles.detailCardText}
                  testID={`${testIDPrefix}-week-detail-class`}
                >
                  <Text style={styles.detailCardTextStrong}>Classe :</Text>{" "}
                  {className}
                </Text>
              ) : null}
              <Text style={styles.detailCardText}>
                <Text style={styles.detailCardTextStrong}>Jour :</Text>{" "}
                {formatDetailDay(selectedWeekCell.date)}
              </Text>
              <Text style={styles.detailCardText}>
                <Text style={styles.detailCardTextStrong}>Horaire :</Text>{" "}
                {minuteToTimeLabel(selectedWeekCell.occurrence.startMinute)} -{" "}
                {minuteToTimeLabel(selectedWeekCell.occurrence.endMinute)}
              </Text>
              <Text style={styles.detailCardText}>
                <Text style={styles.detailCardTextStrong}>Enseignant :</Text>{" "}
                {teacherLabel(selectedWeekCell.occurrence)}
              </Text>
              <Text style={styles.detailCardText}>
                <Text style={styles.detailCardTextStrong}>Salle :</Text>{" "}
                {selectedWeekCell.occurrence.room ?? "-"}
              </Text>
            </View>
          ) : (
            <Text style={styles.detailPlaceholder}>
              Sélectionnez un créneau dans le tableau pour afficher son détail.
            </Text>
          )}
        </View>
        {selectedWeekCell && onEditPress ? (
          <TouchableOpacity
            onPress={onEditPress}
            style={styles.detailEditRail}
            testID={`${testIDPrefix}-week-detail-edit`}
          >
            <Ionicons name="pencil" size={18} color={colors.white} />
            <Text style={styles.detailEditRailText}>MODIFIER</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function MonthGrid({
  cells,
  selectedDate,
  onSelectDate,
  showSaturday,
  showSunday,
  testIDPrefix = "child-timetable",
}: {
  cells: Array<{ date: Date | null; slotsCount: number }>;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  showSaturday: boolean;
  showSunday: boolean;
  testIDPrefix?: string;
}) {
  const weekdayLabels = [
    ...WEEKDAY_LABELS_COMPACT.slice(0, 5),
    ...(showSaturday ? [WEEKDAY_LABELS_COMPACT[5]!] : []),
    ...(showSunday ? [WEEKDAY_LABELS_COMPACT[6]!] : []),
  ];
  const columns = weekdayLabels.length;

  const rows: Array<Array<{ date: Date | null; slotsCount: number }>> = [];
  for (let i = 0; i < cells.length; i += columns) {
    rows.push(cells.slice(i, i + columns));
  }

  return (
    <View style={styles.monthGridCard} testID={`${testIDPrefix}-month-grid`}>
      <View style={styles.monthWeekdayRow}>
        {weekdayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.monthWeekdayText}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {rows.map((row, rowIndex) => (
          <View
            key={`month-row-${rowIndex}`}
            style={styles.monthRow}
            testID={`${testIDPrefix}-month-row-${rowIndex}`}
          >
            {row.map((entry, cellIndex) => {
              const selected =
                entry.date && selectedDate
                  ? sameDate(entry.date, selectedDate)
                  : false;
              return (
                <TouchableOpacity
                  key={`month-cell-${entry.date ? toIsoDateString(entry.date) : `empty-${rowIndex}-${cellIndex}`}`}
                  style={[
                    styles.monthCell,
                    !entry.date && styles.monthCellEmpty,
                    selected && styles.monthCellSelected,
                  ]}
                  onPress={() => entry.date && onSelectDate(entry.date)}
                  disabled={!entry.date}
                  testID={
                    entry.date
                      ? `${testIDPrefix}-month-day-${toIsoDateString(entry.date)}`
                      : undefined
                  }
                >
                  {entry.date ? (
                    <>
                      <Text
                        style={[
                          styles.monthDayText,
                          selected && styles.monthDayTextSelected,
                        ]}
                      >
                        {entry.date.getDate()}
                      </Text>
                      {entry.slotsCount > 0 ? (
                        <View
                          style={[
                            styles.monthCountBadge,
                            selected && styles.monthCountBadgeSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.monthCountBadgeText,
                              selected && styles.monthCountBadgeTextSelected,
                            ]}
                          >
                            {entry.slotsCount}
                          </Text>
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

export function MonthAgenda({
  selectedDate,
  agenda,
  subjectColorById,
  testIDPrefix = "child-timetable",
  getClassName,
  onEditPress,
}: {
  selectedDate: Date | null;
  agenda: TimetableOccurrence[];
  subjectColorById: Record<string, string>;
  testIDPrefix?: string;
  getClassName?: (occId: string) => string | undefined;
  onEditPress?: (occ: TimetableOccurrence) => void;
}) {
  return (
    <View
      style={styles.monthAgendaCard}
      testID={`${testIDPrefix}-month-agenda`}
    >
      <Text style={styles.monthAgendaLabel}>AGENDA DU JOUR SELECTIONNE</Text>
      <Text style={styles.monthAgendaDate}>
        {selectedDate ? formatDetailDay(selectedDate) : "-"}
      </Text>
      <View style={styles.monthAgendaList}>
        {agenda.length === 0 ? (
          <Text style={styles.detailPlaceholder}>
            Aucun cours prevu pour cette journee.
          </Text>
        ) : (
          agenda.map((occurrence) => (
            <DayCard
              key={`month-agenda-${occurrence.id}`}
              occurrence={occurrence}
              colorHex={subjectColorById[occurrence.subject.id]}
              testIDPrefix={testIDPrefix}
              className={getClassName?.(occurrence.id)}
              onEditPress={
                onEditPress ? () => onEditPress(occurrence) : undefined
              }
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, gap: 14 },
  panelCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0D9BF",
    backgroundColor: "#FFF9F1",
    padding: 14,
  },
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
  modeTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2B4A74",
  },
  modeTabTextActive: {
    color: colors.white,
  },
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
  dayList: {
    gap: 10,
  },
  dayCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  dayCardBody: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  dayCardMain: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  dayCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayCardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  dayCardEditRail: {
    width: "10%",
    minWidth: 44,
    maxWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B45309",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.25)",
  },
  dayCardTeacher: {
    color: "#4B5563",
    fontSize: 12,
  },
  dayCardFooter: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  dayCardRoom: {
    color: "#36557A",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dayCardClass: {
    fontSize: 12,
    fontWeight: "700",
    color: "#36557A",
    opacity: 0.75,
  },
  weekSection: { gap: 12 },
  weekGridCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: "#FBFDFF",
    padding: 8,
  },
  weekTimeline: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 2,
    rowGap: 2,
  },
  weekCornerCell: {
    width: 36,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#EFF5FD",
    alignItems: "center",
    justifyContent: "center",
  },
  weekCornerText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#5A7093",
  },
  weekHeaderCell: {
    width: 56,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#EFF5FD",
    alignItems: "center",
    justifyContent: "center",
  },
  weekHeaderCellToday: {
    backgroundColor: colors.primary,
  },
  weekHeaderText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#5A7093",
    textTransform: "uppercase",
  },
  weekHeaderTextToday: {
    color: colors.white,
  },
  weekHoursColumn: {
    width: 36,
    borderRadius: 6,
    backgroundColor: "#F2F7FD",
    position: "relative",
  },
  weekHourLabelWrap: {
    position: "absolute",
    left: 2,
    right: 2,
  },
  weekHourLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: "#35557F",
  },
  weekDayColumn: {
    width: 56,
    borderRadius: 6,
    backgroundColor: "#FAFCFF",
    position: "relative",
    overflow: "hidden",
  },
  weekHourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5EEF9",
  },
  weekSlot: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 2,
    justifyContent: "flex-start",
  },
  weekSlotText: {
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: "#F9FCFF",
    overflow: "hidden",
  },
  detailCardLayout: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  detailCardContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  detailCardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailCardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#4C6284",
    textTransform: "uppercase",
  },
  detailEditRail: {
    width: "10%",
    minWidth: 52,
    maxWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#B45309",
  },
  detailEditRailText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  detailCardBody: {
    gap: 6,
  },
  detailCardText: {
    fontSize: 14,
    color: "#213B5D",
  },
  detailCardTextStrong: {
    fontWeight: "800",
    color: "#213B5D",
  },
  detailPlaceholder: {
    fontSize: 12,
    color: "#8192A8",
  },
  monthSection: { gap: 12 },
  monthGridCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0D9BF",
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
  },
  monthWeekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthWeekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7C93",
  },
  monthGrid: {
    gap: 6,
  },
  monthRow: {
    flexDirection: "row",
    gap: 6,
  },
  monthCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  monthCellEmpty: {
    backgroundColor: "#F3F6F9",
    borderColor: "transparent",
  },
  monthCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthDayText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B4A74",
  },
  monthDayTextSelected: {
    color: colors.white,
  },
  monthCountBadge: {
    position: "absolute",
    right: 6,
    bottom: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  monthCountBadgeSelected: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  monthCountBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.primary,
  },
  monthCountBadgeTextSelected: {
    color: colors.white,
  },
  monthAgendaCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0D9BF",
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
  },
  monthAgendaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7C93",
    textTransform: "uppercase",
  },
  monthAgendaDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B4A74",
  },
  monthAgendaList: {
    gap: 10,
  },
});
