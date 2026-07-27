import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { roomsApi } from "../../api/rooms.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useAuthStore } from "../../store/auth.store";
import { useTranslation } from "../../i18n/useTranslation";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import {
  addDays,
  addMonths,
  formatDateInput,
  minuteToTimeLabel,
  sameDate,
  startOfWeek,
  toIsoDateString,
} from "../../utils/timetable";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import type { RoomCalendarEntry, RoomRow } from "../../types/room.types";
import { moduleBack } from "../../utils/moduleBack";

type AgendaView = "week" | "month";

const STATUS_LABELS: Record<RoomRow["status"], string> = {
  AVAILABLE: "Disponible",
  UNAVAILABLE: "Indisponible",
  MAINTENANCE: "Maintenance",
};

const STATUS_DOT_COLORS: Record<RoomRow["status"], string> = {
  AVAILABLE: "#D89B5B",
  UNAVAILABLE: colors.notification,
  MAINTENANCE: colors.notification,
};

const TIMELINE_START_MINUTE = 7 * 60;
const TIMELINE_END_MINUTE = 18 * 60;
const TIMELINE_PX_PER_HOUR = 36;
const WEEK_CORNER_WIDTH = 34;
const WEEK_MIN_DAY_COL_WIDTH = 38;
// SectionCard padding (16*2) + page scroll content padding (16*2).
const WEEK_GRID_OUTER_H_PADDING = 64;

function computeWeekDayColumnWidth(screenWidth: number): number {
  const available = screenWidth - WEEK_GRID_OUTER_H_PADDING - WEEK_CORNER_WIDTH;
  return Math.max(WEEK_MIN_DAY_COL_WIDTH, Math.floor(available / 7));
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function buildWeekDays(cursor: Date) {
  const monday = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function buildMonthCells(cursor: Date): Array<Date | null> {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const cells: Array<Date | null> = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatWeekRangeLabel(days: Date[]) {
  const start = days[0];
  const end = days[days.length - 1];
  const fmt = (date: Date) =>
    `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function formatMonthLabel(cursor: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(cursor);
}

export function RoomDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const dayColWidth = computeWeekDayColumnWidth(screenWidth);
  const { schoolSlug } = useAuthStore();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === "string" ? params.roomId : "";

  const [room, setRoom] = useState<RoomRow | null>(null);
  const [isRoomLoading, setIsRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const [view, setView] = useState<AgendaView>("week");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [entries, setEntries] = useState<RoomCalendarEntry[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const weekDays = useMemo(() => buildWeekDays(cursorDate), [cursorDate]);
  const monthCells = useMemo(() => buildMonthCells(cursorDate), [cursorDate]);

  const monthDatesOnly = useMemo(
    () => monthCells.filter((d): d is Date => d != null),
    [monthCells],
  );

  const rangeStart = view === "week" ? weekDays[0] : monthDatesOnly[0];
  const rangeEnd =
    view === "week" ? weekDays[6] : monthDatesOnly[monthDatesOnly.length - 1];

  const fromDate = formatDateInput(rangeStart);
  const toDate = formatDateInput(rangeEnd);

  const loadRoom = useCallback(async () => {
    if (!schoolSlug || !roomId) return;
    setIsRoomLoading(true);
    setRoomError(null);
    try {
      const result = await roomsApi.getRoom(schoolSlug, roomId);
      setRoom(result);
    } catch (error) {
      setRoomError(extractApiError(error));
    } finally {
      setIsRoomLoading(false);
    }
  }, [schoolSlug, roomId]);

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  const loadCalendar = useCallback(async () => {
    if (!schoolSlug || !roomId) return;
    setIsCalendarLoading(true);
    setCalendarError(null);
    try {
      const result = await roomsApi.getRoomCalendar(
        schoolSlug,
        roomId,
        fromDate,
        toDate,
      );
      setEntries(result);
    } catch (error) {
      setCalendarError(extractApiError(error));
    } finally {
      setIsCalendarLoading(false);
    }
  }, [schoolSlug, roomId, fromDate, toDate]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    setSelectedDay(null);
  }, [view, fromDate, toDate]);

  function goToPrevious() {
    setCursorDate((current) =>
      view === "week" ? addDays(current, -7) : addMonths(current, -1),
    );
  }

  function goToNext() {
    setCursorDate((current) =>
      view === "week" ? addDays(current, 7) : addMonths(current, 1),
    );
  }

  const entriesByDate = useMemo(() => {
    const map = new Map<string, RoomCalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.occurrenceDate) ?? [];
      list.push(entry);
      map.set(entry.occurrenceDate, list);
    }
    return map;
  }, [entries]);

  const timelineHours = Array.from(
    { length: (TIMELINE_END_MINUTE - TIMELINE_START_MINUTE) / 60 + 1 },
    (_, index) => TIMELINE_START_MINUTE + index * 60,
  );
  const timelineHeight =
    ((TIMELINE_END_MINUTE - TIMELINE_START_MINUTE) / 60) * TIMELINE_PX_PER_HOUR;

  const selectedDayEntries = selectedDay
    ? (entriesByDate.get(selectedDay) ?? [])
    : [];

  if (isRoomLoading && !room) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title={t("rooms.detail.headerTitle")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="room-detail-header"
          backTestID="room-detail-back-btn"
        />
        <View style={styles.loadingWrap}>
          <LoadingBlock label={t("rooms.detail.loading")} />
        </View>
      </View>
    );
  }

  if (roomError || !room) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title={t("rooms.detail.headerTitle")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="room-detail-header"
          backTestID="room-detail-back-btn"
        />
        <View style={styles.content}>
          <ErrorBanner
            message={roomError ?? t("rooms.detail.notFound")}
            onDismiss={() => setRoomError(null)}
            testID="room-detail-error-banner"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title={room.name}
        subtitle={t("rooms.detail.headerTitle")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="room-detail-header"
        backTestID="room-detail-back-btn"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard
          title={t("rooms.detail.infoTitle")}
          testID="room-detail-info-card"
        >
          <View style={styles.infoRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_DOT_COLORS[room.status] },
              ]}
              testID="room-detail-status-dot"
            />
            <Text style={styles.infoValue}>{STATUS_LABELS[room.status]}</Text>
          </View>
          <Text style={styles.infoLine}>
            {t("rooms.detail.capacityLabel")}: {room.capacity ?? "-"}
          </Text>
          <Text style={styles.infoLine}>
            {t("rooms.detail.maxConcurrentSlotsLabel")}:{" "}
            {room.maxConcurrentSlots}
          </Text>
          <Text style={styles.infoLine}>
            {t("rooms.detail.descriptionLabel")}:{" "}
            {room.description ?? t("rooms.detail.noDescription")}
          </Text>
        </SectionCard>

        <SectionCard
          title={t("rooms.detail.agendaTitle")}
          testID="room-detail-agenda-card"
        >
          <View style={styles.viewToggleRow}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                view === "week" && styles.viewToggleButtonActive,
              ]}
              onPress={() => setView("week")}
              testID="room-detail-view-week"
            >
              <Text
                style={[
                  styles.viewToggleLabel,
                  view === "week" && styles.viewToggleLabelActive,
                ]}
              >
                {t("rooms.detail.viewWeek")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                view === "month" && styles.viewToggleButtonActive,
              ]}
              onPress={() => setView("month")}
              testID="room-detail-view-month"
            >
              <Text
                style={[
                  styles.viewToggleLabel,
                  view === "month" && styles.viewToggleLabelActive,
                ]}
              >
                {t("rooms.detail.viewMonth")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={goToPrevious}
              testID="room-detail-nav-previous"
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.navLabel}>
              {view === "week"
                ? formatWeekRangeLabel(weekDays)
                : formatMonthLabel(cursorDate)}
            </Text>
            <TouchableOpacity onPress={goToNext} testID="room-detail-nav-next">
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {calendarError ? (
            <ErrorBanner
              message={calendarError}
              onDismiss={() => setCalendarError(null)}
              testID="room-detail-calendar-error"
            />
          ) : null}

          {isCalendarLoading ? (
            <LoadingBlock label={t("rooms.detail.loading")} />
          ) : view === "week" ? (
            <View
              style={[
                styles.weekTimeline,
                {
                  width: WEEK_CORNER_WIDTH + weekDays.length * dayColWidth,
                },
              ]}
              testID="room-detail-week-grid"
            >
              <View style={styles.weekCornerCell}>
                <Text style={styles.weekCornerText}>H</Text>
              </View>
              {weekDays.map((day, index) => (
                <View
                  key={`week-head-${index}`}
                  style={[
                    styles.weekHeaderCell,
                    { width: dayColWidth },
                    sameDate(day, new Date()) && styles.weekHeaderCellToday,
                  ]}
                >
                  <Text
                    style={styles.weekHeaderText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {WEEKDAY_LABELS[index]}
                  </Text>
                  <Text style={styles.weekHeaderDate}>
                    {String(day.getDate()).padStart(2, "0")}
                  </Text>
                </View>
              ))}

              <View
                style={[styles.weekHoursColumn, { height: timelineHeight }]}
              >
                {timelineHours.map((hourMinute, index) => (
                  <View
                    key={`week-hour-${hourMinute}`}
                    style={[
                      styles.weekHourLabelWrap,
                      {
                        top:
                          index === timelineHours.length - 1
                            ? timelineHeight - 12
                            : ((hourMinute - TIMELINE_START_MINUTE) / 60) *
                              TIMELINE_PX_PER_HOUR,
                      },
                    ]}
                  >
                    <Text style={styles.weekHourLabel}>
                      {minuteToTimeLabel(hourMinute)}
                    </Text>
                  </View>
                ))}
              </View>

              {weekDays.map((day, dayIndex) => {
                const dateKey = toIsoDateString(day);
                const dayEntries = entriesByDate.get(dateKey) ?? [];
                return (
                  <View
                    key={`week-col-${dayIndex}`}
                    style={[
                      styles.weekDayColumn,
                      { height: timelineHeight, width: dayColWidth },
                    ]}
                    testID={`room-detail-week-col-${dateKey}`}
                  >
                    {dayEntries.map((entry) => {
                      const clampedStart = Math.max(
                        TIMELINE_START_MINUTE,
                        Math.min(TIMELINE_END_MINUTE, entry.startMinute),
                      );
                      const clampedEnd = Math.max(
                        TIMELINE_START_MINUTE,
                        Math.min(TIMELINE_END_MINUTE, entry.endMinute),
                      );
                      const top =
                        ((clampedStart - TIMELINE_START_MINUTE) / 60) *
                        TIMELINE_PX_PER_HOUR;
                      const height = Math.max(
                        18,
                        ((Math.max(clampedEnd, clampedStart + 15) -
                          clampedStart) /
                          60) *
                          TIMELINE_PX_PER_HOUR,
                      );
                      return (
                        <View
                          key={entry.id}
                          style={[styles.weekSlot, { top, minHeight: height }]}
                          testID={`room-detail-week-slot-${entry.id}`}
                        >
                          <Text style={styles.weekSlotText} numberOfLines={2}>
                            {entry.className}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          ) : (
            <View testID="room-detail-month-grid">
              <View style={styles.monthWeekdaysRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.monthWeekdayLabel}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.monthGrid}>
                {monthCells.map((day, index) => {
                  if (!day) {
                    return (
                      <View key={`empty-${index}`} style={styles.monthCell} />
                    );
                  }
                  const dateKey = toIsoDateString(day);
                  const count = entriesByDate.get(dateKey)?.length ?? 0;
                  const isSelected = selectedDay === dateKey;
                  return (
                    <TouchableOpacity
                      key={dateKey}
                      style={[
                        styles.monthCell,
                        isSelected && styles.monthCellSelected,
                      ]}
                      onPress={() => setSelectedDay(dateKey)}
                      testID={`room-detail-month-cell-${dateKey}`}
                    >
                      <Text style={styles.monthCellDay}>{day.getDate()}</Text>
                      {count > 0 ? (
                        <View style={styles.monthCellBadge}>
                          <Text style={styles.monthCellBadgeText}>{count}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedDay ? (
                <View style={styles.listStack}>
                  {selectedDayEntries.length === 0 ? (
                    <EmptyState
                      icon="calendar-outline"
                      title={
                        t("rooms.detail.notFound") /* placeholder unused */
                      }
                      message=""
                    />
                  ) : (
                    selectedDayEntries.map((entry) => (
                      <View
                        key={entry.id}
                        style={styles.calendarEntryRow}
                        testID={`room-detail-day-entry-${entry.id}`}
                      >
                        <Text style={styles.calendarEntryTime}>
                          {minuteToTimeLabel(entry.startMinute)} -{" "}
                          {minuteToTimeLabel(entry.endMinute)}
                        </Text>
                        <Text style={styles.calendarEntryMeta}>
                          {entry.className} · {entry.subjectName} ·{" "}
                          {entry.teacherName}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 48,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  infoLine: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  viewToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  viewToggleButton: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingVertical: 9,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  viewToggleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  viewToggleLabelActive: {
    color: colors.white,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  weekTimeline: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  weekCornerCell: {
    width: WEEK_CORNER_WIDTH,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  weekCornerText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  weekHeaderCell: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    paddingHorizontal: 2,
  },
  weekHeaderCellToday: {
    backgroundColor: `${colors.primary}14`,
  },
  weekHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  weekHeaderDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  weekHoursColumn: {
    width: WEEK_CORNER_WIDTH,
    position: "relative",
  },
  weekHourLabelWrap: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  weekHourLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
  },
  weekDayColumn: {
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  weekSlot: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    backgroundColor: `${colors.accentTeal}22`,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  weekSlotText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  monthWeekdaysRow: {
    flexDirection: "row",
  },
  monthWeekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthCellSelected: {
    backgroundColor: `${colors.primary}14`,
  },
  monthCellDay: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  monthCellBadge: {
    marginTop: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCellBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },
  listStack: {
    marginTop: 12,
    gap: 8,
  },
  calendarEntryRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  calendarEntryTime: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  calendarEntryMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
