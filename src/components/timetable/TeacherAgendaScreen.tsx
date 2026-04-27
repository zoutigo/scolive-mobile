import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { buildTeacherSubtitle } from "../navigation/nav-config";
import { useDrawer } from "../navigation/AppShell";
import { useAuthStore } from "../../store/auth.store";
import { useTimetableStore } from "../../store/timetable.store";
import { timetableApi } from "../../api/timetable.api";
import type {
  TimetableClassOption,
  TimetableOccurrence,
  TimetableSubjectStyle,
} from "../../types/timetable.types";
import { TeacherOneOffCreatePanel } from "./TeacherOneOffCreatePanel";
import {
  addDays,
  addMonths,
  buildCompactMonthCalendarCells,
  buildTimetableRangeForView,
  formatMonthLabel,
  formatWeekRangeLabel,
  sameDate,
  startOfWeek,
  stripTime,
  toIsoDateString,
  toWeekdayMondayFirst,
  TimetableCalendarViewMode,
} from "../../utils/timetable";
import {
  buildWeekDays,
  DayCard,
  findInitialMonthSelection,
  findInitialWeekSelection,
  formatDayNavLabel,
  MODE_OPTIONS,
  MonthAgenda,
  MonthGrid,
  WeekDetailCard,
  WeekGrid,
  WeekSelection,
} from "./ChildTimetableScreen";
import { EmptyState, ErrorBanner, LoadingBlock } from "./TimetableCommon";
import { TeacherSlotEditPanel } from "./TeacherSlotEditPanel";

const P = "teacher-agenda";

// Context metadata attached to each occurrence at aggregation time
type OccurrenceContext = {
  classId: string;
  className: string;
  schoolYearId: string;
};

type AgendaTab = "mine" | "classes";

// ─── Main exported screen ────────────────────────────────────────────────────

export function TeacherAgendaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { user } = useAuthStore();
  const subtitle = user ? buildTeacherSubtitle(user) : null;
  const [activeTab, setActiveTab] = useState<AgendaTab>("mine");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ModuleHeader
        title="Agenda"
        subtitle={subtitle}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        testID={`${P}-header`}
        backTestID={`${P}-back`}
        rightTestID={`${P}-menu`}
        topInset={insets.top}
      />

      {/* Tab switcher */}
      <View style={styles.tabRow} testID={`${P}-tabs`}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "mine" && styles.tabBtnActive]}
          onPress={() => setActiveTab("mine")}
          testID={`${P}-tab-mine`}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "mine" && styles.tabBtnTextActive,
            ]}
          >
            Mon agenda
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "classes" && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab("classes")}
          testID={`${P}-tab-classes`}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "classes" && styles.tabBtnTextActive,
            ]}
          >
            Mes classes
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "mine" ? (
        <TeacherMyAgendaPane insetBottom={insets.bottom} />
      ) : (
        <TeacherClassAgendaPane insetBottom={insets.bottom} />
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Tab 1 : teacher's own agenda ────────────────────────────────────────────
//
// /timetable/me ne supporte pas le rôle TEACHER : on charge tous les agendas
// de classes accessibles et on filtre les créneaux par teacherUser.id.

type TeacherScheduleData = {
  occurrences: TimetableOccurrence[];
  subjectStyles: TimetableSubjectStyle[];
  slots: { weekday: number; teacherUser: { id: string } }[];
  contextByOccId: Map<string, OccurrenceContext>;
};

function TeacherMyAgendaPane({ insetBottom }: { insetBottom: number }) {
  const { schoolSlug, user } = useAuthStore();
  const { loadClassOptions } = useTimetableStore();

  const today = useMemo(() => stripTime(new Date()), []);
  const [viewMode, setViewMode] = useState<TimetableCalendarViewMode>("day");
  const [cursorDate, setCursorDate] = useState(today);
  const [selectedWeekCell, setSelectedWeekCell] =
    useState<WeekSelection | null>(null);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | null>(
    today,
  );
  const [schedule, setSchedule] = useState<TeacherScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allClasses, setAllClasses] = useState<TimetableClassOption[]>([]);

  const range = useMemo(
    () => buildTimetableRangeForView(viewMode, cursorDate),
    [cursorDate, viewMode],
  );

  const load = useCallback(async () => {
    if (!schoolSlug || !user) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const options = await loadClassOptions(schoolSlug);
      setAllClasses(options.classes);
      if (!options.classes.length) {
        setSchedule({
          occurrences: [],
          subjectStyles: [],
          slots: [],
          contextByOccId: new Map(),
        });
        return;
      }
      const timetables = await Promise.all(
        options.classes.map((cls) =>
          timetableApi.getClassTimetable(schoolSlug, cls.classId, {
            fromDate: range.fromDate,
            toDate: range.toDate,
          }),
        ),
      );
      const contextByOccId = new Map<string, OccurrenceContext>();
      const allOccurrences: TimetableOccurrence[] = [];
      for (let i = 0; i < timetables.length; i++) {
        const t = timetables[i]!;
        const cls = options.classes[i]!;
        const ctx: OccurrenceContext = {
          classId: cls.classId,
          className: cls.className,
          schoolYearId: cls.schoolYearId,
        };
        for (const o of t.occurrences) {
          if (o.teacherUser.id === user.id) {
            allOccurrences.push(o);
            contextByOccId.set(o.id, ctx);
          }
        }
      }
      const allSlots = timetables
        .flatMap((t) => t.slots)
        .filter((s) => s.teacherUser.id === user.id);
      const styleMap = new Map<string, TimetableSubjectStyle>();
      for (const t of timetables) {
        for (const style of t.subjectStyles) {
          styleMap.set(style.subjectId, style);
        }
      }
      setSchedule({
        occurrences: allOccurrences,
        subjectStyles: Array.from(styleMap.values()),
        slots: allSlots,
        contextByOccId,
      });
    } catch {
      setErrorMessage("Impossible de charger votre agenda pour le moment.");
    } finally {
      setIsLoading(false);
    }
  }, [loadClassOptions, range.fromDate, range.toDate, schoolSlug, user]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const occurrences = useMemo(
    () =>
      (schedule?.occurrences ?? [])
        .filter((o) => (o.status ?? "PLANNED") === "PLANNED")
        .sort((a, b) =>
          `${a.occurrenceDate}-${a.startMinute}`.localeCompare(
            `${b.occurrenceDate}-${b.startMinute}`,
          ),
        ),
    [schedule?.occurrences],
  );

  const { showSaturday, showSunday } = useMemo(() => {
    const slots = schedule?.slots ?? [];
    return {
      showSaturday: slots.some((s) => s.weekday === 6),
      showSunday: slots.some((s) => s.weekday === 7),
    };
  }, [schedule?.slots]);

  const subjectColorById = useMemo(
    () =>
      Object.fromEntries(
        (schedule?.subjectStyles ?? []).map((e) => [e.subjectId, e.colorHex]),
      ),
    [schedule?.subjectStyles],
  );

  const getOccurrenceContext = useCallback(
    (occId: string) => schedule?.contextByOccId.get(occId),
    [schedule],
  );

  return (
    <TimetablePane
      testIDPrefix={`${P}-mine`}
      isLoading={isLoading}
      hasData={schedule !== null}
      errorMessage={errorMessage}
      occurrences={occurrences}
      subjectColorById={subjectColorById}
      showSaturday={showSaturday}
      showSunday={showSunday}
      viewMode={viewMode}
      setViewMode={setViewMode}
      cursorDate={cursorDate}
      setCursorDate={setCursorDate}
      selectedWeekCell={selectedWeekCell}
      setSelectedWeekCell={setSelectedWeekCell}
      selectedMonthDate={selectedMonthDate}
      setSelectedMonthDate={setSelectedMonthDate}
      today={today}
      insetBottom={insetBottom}
      onRefresh={() => {
        setSchedule(null);
        void load().catch(() => {});
      }}
      emptyTitle="Aucun cours"
      emptyMessage="Aucun créneau n'est planifié pour vous sur cette période."
      teacherUserId={user?.id}
      getOccurrenceContext={getOccurrenceContext}
      schoolSlug={schoolSlug ?? ""}
      onAfterMutation={() => {
        setSchedule(null);
        void load().catch(() => {});
      }}
      canCreate={allClasses.length > 0}
      allClasses={allClasses}
    />
  );
}

// ─── Tab 2 : class agenda ─────────────────────────────────────────────────────

function TeacherClassAgendaPane({ insetBottom }: { insetBottom: number }) {
  const { schoolSlug, user } = useAuthStore();
  const {
    classOptions,
    isLoadingClassOptions,
    classTimetable,
    isLoadingClassTimetable,
    errorMessage,
    loadClassOptions,
    loadClassTimetable,
    clearError,
  } = useTimetableStore();

  const today = useMemo(() => stripTime(new Date()), []);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
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

  // Load class list on mount
  useEffect(() => {
    if (!schoolSlug) return;
    void loadClassOptions(schoolSlug).catch(() => {});
  }, [loadClassOptions, schoolSlug]);

  // Auto-select first class when list loads
  useEffect(() => {
    if (selectedClassId || !classOptions?.classes.length) return;
    setSelectedClassId(classOptions.classes[0]?.classId ?? null);
  }, [classOptions, selectedClassId]);

  // Load timetable for selected class
  const loadClass = useCallback(async () => {
    if (!schoolSlug || !selectedClassId) return;
    await loadClassTimetable(schoolSlug, selectedClassId, {
      fromDate: range.fromDate,
      toDate: range.toDate,
    });
  }, [
    loadClassTimetable,
    range.fromDate,
    range.toDate,
    schoolSlug,
    selectedClassId,
  ]);

  useEffect(() => {
    void loadClass().catch(() => {});
  }, [loadClass]);

  const occurrences = useMemo(
    () =>
      (classTimetable?.occurrences ?? [])
        .filter((o) => (o.status ?? "PLANNED") === "PLANNED")
        .sort((a, b) =>
          `${a.occurrenceDate}-${a.startMinute}`.localeCompare(
            `${b.occurrenceDate}-${b.startMinute}`,
          ),
        ),
    [classTimetable?.occurrences],
  );

  const { showSaturday, showSunday } = useMemo(() => {
    const slots = classTimetable?.slots ?? [];
    return {
      showSaturday: slots.some((s) => s.weekday === 6),
      showSunday: slots.some((s) => s.weekday === 7),
    };
  }, [classTimetable?.slots]);

  const subjectColorById = useMemo(
    () =>
      Object.fromEntries(
        (classTimetable?.subjectStyles ?? []).map((e) => [
          e.subjectId,
          e.colorHex,
        ]),
      ),
    [classTimetable?.subjectStyles],
  );

  const classes = useMemo(
    () => classOptions?.classes ?? [],
    [classOptions?.classes],
  );

  return (
    <View style={styles.root}>
      {/* Class picker */}
      {isLoadingClassOptions && !classOptions ? (
        <LoadingBlock label="Chargement des classes..." />
      ) : classes.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="Aucune classe accessible"
          message="Aucune affectation trouvée pour ce profil."
        />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.classPickerScroll}
            contentContainerStyle={styles.classPicker}
            testID={`${P}-class-picker`}
          >
            {classes.map((cls) => {
              const active = selectedClassId === cls.classId;
              return (
                <TouchableOpacity
                  key={cls.classId}
                  style={[
                    styles.classPickerBtn,
                    active && styles.classPickerBtnActive,
                  ]}
                  onPress={() => {
                    setSelectedClassId(cls.classId);
                    setViewMode("day");
                    setCursorDate(today);
                  }}
                  testID={`${P}-class-btn-${cls.classId}`}
                >
                  <Text
                    style={[
                      styles.classPickerBtnText,
                      active && styles.classPickerBtnTextActive,
                    ]}
                  >
                    {cls.className}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.classPane}>
            <TimetablePane
              testIDPrefix={`${P}-class`}
              isLoading={isLoadingClassTimetable}
              hasData={!!classTimetable}
              errorMessage={errorMessage}
              occurrences={occurrences}
              subjectColorById={subjectColorById}
              showSaturday={showSaturday}
              showSunday={showSunday}
              viewMode={viewMode}
              setViewMode={setViewMode}
              cursorDate={cursorDate}
              setCursorDate={setCursorDate}
              selectedWeekCell={selectedWeekCell}
              setSelectedWeekCell={setSelectedWeekCell}
              selectedMonthDate={selectedMonthDate}
              setSelectedMonthDate={setSelectedMonthDate}
              today={today}
              insetBottom={insetBottom}
              onRefresh={() => {
                clearError();
                void loadClass().catch(() => {});
              }}
              emptyTitle="Aucun cours"
              emptyMessage="Aucun créneau planifié pour cette classe sur cette période."
              teacherUserId={user?.id}
              getOccurrenceContext={(occId) => {
                const occ = occurrences.find((o) => o.id === occId);
                if (!occ || !selectedClassId) return undefined;
                const cls = classes.find((c) => c.classId === selectedClassId);
                if (!cls) return undefined;
                return {
                  classId: cls.classId,
                  className: cls.className,
                  schoolYearId: cls.schoolYearId,
                };
              }}
              schoolSlug={schoolSlug ?? ""}
              onAfterMutation={() => {
                clearError();
                void loadClass().catch(() => {});
              }}
              canCreate={classes.length > 0}
              allClasses={classes}
              prefilledClassId={selectedClassId ?? undefined}
            />
          </View>
        </>
      )}
    </View>
  );
}

// ─── Shared day/week/month pane ───────────────────────────────────────────────

interface TimetablePaneProps {
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
  // Edit panel props (optional — only for teacher view)
  teacherUserId?: string;
  getOccurrenceContext?: (occId: string) => OccurrenceContext | undefined;
  schoolSlug?: string;
  onAfterMutation?: () => void;
  // Creation panel props
  canCreate?: boolean;
  allClasses?: TimetableClassOption[];
  prefilledClassId?: string;
}

function TimetablePane({
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
  getOccurrenceContext,
  schoolSlug,
  onAfterMutation,
  canCreate,
  allClasses,
  prefilledClassId,
}: TimetablePaneProps) {
  const [editingOccurrence, setEditingOccurrence] =
    useState<TimetableOccurrence | null>(null);
  const [creating, setCreating] = useState(false);

  const isTeacherOcc = useCallback(
    (occ: TimetableOccurrence) =>
      !!teacherUserId && occ.teacherUser.id === teacherUserId,
    [teacherUserId],
  );

  const openEdit = useCallback((occ: TimetableOccurrence) => {
    setEditingOccurrence(occ);
  }, []);

  const closeEdit = useCallback(() => setEditingOccurrence(null), []);
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
    if (viewMode === "day") return formatDayNavLabel(cursorDate, today);
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
      const hidden = [...(showSaturday ? [] : [6]), ...(showSunday ? [] : [7])];
      let next = addDays(cursorDate, direction);
      while (hidden.includes(toWeekdayMondayFirst(next))) {
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

  function resetToToday() {
    const hidden = [...(showSaturday ? [] : [6]), ...(showSunday ? [] : [7])];
    if (viewMode === "day" && hidden.length > 0) {
      let next = today;
      while (hidden.includes(toWeekdayMondayFirst(next))) {
        next = addDays(next, 1);
      }
      setCursorDate(next);
      return;
    }
    setCursorDate(today);
  }

  return (
    <View style={styles.root}>
      <ScrollView
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
            <LoadingBlock label="Chargement de l'agenda..." />
          </View>
        ) : (
          <View style={styles.moduleCard}>
            {/* Mode tabs */}
            <View style={styles.modeTabs} testID={`${testIDPrefix}-mode-tabs`}>
              {MODE_OPTIONS.map((entry) => {
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
                <WeekDetailCard
                  selectedWeekCell={selectedWeekCell}
                  colorHex={
                    selectedWeekCell
                      ? subjectColorById[selectedWeekCell.occurrence.subject.id]
                      : undefined
                  }
                  testIDPrefix={testIDPrefix}
                  className={
                    selectedWeekCell
                      ? getOccurrenceContext?.(selectedWeekCell.occurrence.id)
                          ?.className
                      : undefined
                  }
                  onEditPress={
                    selectedWeekCell &&
                    isTeacherOcc(selectedWeekCell.occurrence)
                      ? () => openEdit(selectedWeekCell.occurrence)
                      : undefined
                  }
                />
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
            ) : null}

            {/* Edit panel */}
            {editingOccurrence && schoolSlug && getOccurrenceContext
              ? (() => {
                  const ctx = getOccurrenceContext(editingOccurrence.id);
                  if (!ctx) return null;
                  return (
                    <TeacherSlotEditPanel
                      occurrence={editingOccurrence}
                      className={ctx.className}
                      classId={ctx.classId}
                      schoolYearId={ctx.schoolYearId}
                      schoolSlug={schoolSlug}
                      onClose={closeEdit}
                      onSuccess={() => {
                        closeEdit();
                        onAfterMutation?.();
                      }}
                    />
                  );
                })()
              : null}
          </View>
        )}
      </ScrollView>

      {/* FAB — création d'un nouveau créneau */}
      {canCreate && !editingOccurrence ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: insetBottom + 20 }]}
          onPress={() => setCreating(true)}
          testID={`${testIDPrefix}-fab-create`}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      {/* Modal bottom-sheet de création */}
      <Modal
        visible={creating}
        transparent
        animationType="slide"
        onRequestClose={() => setCreating(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCreating(false)}
          />
          <View style={styles.modalSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {schoolSlug && allClasses ? (
                <TeacherOneOffCreatePanel
                  schoolSlug={schoolSlug}
                  prefilledClassId={prefilledClassId}
                  prefilledDate={toIsoDateString(cursorDate)}
                  allClasses={allClasses}
                  onClose={() => setCreating(false)}
                  onSuccess={() => {
                    setCreating(false);
                    onAfterMutation?.();
                  }}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    paddingHorizontal: 16,
    gap: 0,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },

  classPickerScroll: {
    flexShrink: 0,
    flexGrow: 0,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  classPicker: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  classPane: {
    flex: 1,
  },
  classPickerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  classPickerBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classPickerBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  classPickerBtnTextActive: {
    color: colors.white,
  },

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

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "85%",
  },
});
