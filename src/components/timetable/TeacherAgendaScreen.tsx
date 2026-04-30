import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { ModuleHeader } from "../navigation/ModuleHeader";
import {
  buildAdminSubtitle,
  buildTeacherSubtitle,
} from "../navigation/nav-config";
import { useDrawer } from "../navigation/AppShell";
import { useAuthStore } from "../../store/auth.store";
import { useTimetableStore } from "../../store/timetable.store";
import { timetableApi } from "../../api/timetable.api";
import type {
  TimetableClassOption,
  TimetableOccurrence,
  TimetableSubjectStyle,
} from "../../types/timetable.types";
import type { AuthUser } from "../../types/auth.types";
import { TeacherOneOffCreatePanel } from "./TeacherOneOffCreatePanel";
import {
  addDays,
  addMonths,
  buildCompactMonthCalendarCells,
  buildTimetableRangeForView,
  formatMonthLabel,
  formatWeekRangeLabel,
  fullTeacherName,
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

type AgendaTab = "mine" | "classes" | "users";

type TeacherOption = { id: string; name: string };

function isSchoolAdmin(user: AuthUser | null): boolean {
  const role = user?.activeRole ?? user?.role;
  return role === "SCHOOL_ADMIN";
}

// ─── Main exported screen ────────────────────────────────────────────────────

export function TeacherAgendaScreen() {
  return <TeacherAgendaScreenInner />;
}

type TeacherAgendaScreenProps = {
  initialTab?: AgendaTab;
  lockedClassId?: string;
  lockedClassName?: string;
  hideClassPicker?: boolean;
};

export function TeacherAgendaScreenInner({
  initialTab,
  lockedClassId,
  lockedClassName,
  hideClassPicker = false,
}: TeacherAgendaScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { user } = useAuthStore();
  const admin = isSchoolAdmin(user);
  const isLockedClassView = !admin && Boolean(lockedClassId);
  const subtitle = user
    ? admin
      ? buildAdminSubtitle(user)
      : isLockedClassView
        ? [user.schoolName, lockedClassName].filter(Boolean).join(" · ") || null
        : buildTeacherSubtitle(user)
    : null;
  const classTabLabel = lockedClassName
    ? `Agenda ${lockedClassName}`
    : "Agenda de classe";
  const [activeTab, setActiveTab] = useState<AgendaTab>(
    isLockedClassView ? "classes" : (initialTab ?? (admin ? "users" : "mine")),
  );

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
        {admin ? (
          <>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "users" && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab("users")}
              testID={`${P}-tab-users`}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === "users" && styles.tabBtnTextActive,
                ]}
              >
                Users
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
                Classes
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {isLockedClassView ? (
              <>
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
                    {classTabLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    activeTab === "mine" && styles.tabBtnActive,
                  ]}
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
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    activeTab === "mine" && styles.tabBtnActive,
                  ]}
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
              </>
            )}
          </>
        )}
      </View>

      {activeTab === "mine" ? (
        <TeacherMyAgendaPane insetBottom={insets.bottom} />
      ) : activeTab === "users" ? (
        <AdminUserAgendaPane insetBottom={insets.bottom} />
      ) : (
        <TeacherClassAgendaPane
          insetBottom={insets.bottom}
          isAdminMode={admin}
          lockedClassId={lockedClassId}
          hideClassPicker={hideClassPicker}
        />
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

// ─── Tab admin : agenda par enseignant ───────────────────────────────────────

function AdminUserAgendaPane({ insetBottom }: { insetBottom: number }) {
  const { schoolSlug } = useAuthStore();
  const { loadClassOptions } = useTimetableStore();

  // Teacher discovery
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [allClasses, setAllClasses] = useState<TimetableClassOption[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [teacherLoadError, setTeacherLoadError] = useState<string | null>(null);

  // Teacher selection & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );

  // Agenda data for selected teacher
  const today = useMemo(() => stripTime(new Date()), []);
  const [viewMode, setViewMode] = useState<TimetableCalendarViewMode>("day");
  const [cursorDate, setCursorDate] = useState(today);
  const [selectedWeekCell, setSelectedWeekCell] =
    useState<WeekSelection | null>(null);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date | null>(
    today,
  );
  const [schedule, setSchedule] = useState<TeacherScheduleData | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const range = useMemo(
    () => buildTimetableRangeForView(viewMode, cursorDate),
    [cursorDate, viewMode],
  );

  // Load class contexts to discover all teachers
  useEffect(() => {
    if (!schoolSlug) return;
    setIsLoadingTeachers(true);
    setTeacherLoadError(null);
    loadClassOptions(schoolSlug)
      .then(async (options) => {
        setAllClasses(options.classes);
        const ctxResults = await Promise.all(
          options.classes.map((cls) =>
            timetableApi.getClassContext(schoolSlug, cls.classId),
          ),
        );
        const teacherMap = new Map<string, string>();
        for (const ctx of ctxResults) {
          for (const a of ctx.assignments) {
            if (!teacherMap.has(a.teacherUserId)) {
              teacherMap.set(a.teacherUserId, fullTeacherName(a.teacherUser));
            }
          }
        }
        const sorted = Array.from(teacherMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setTeachers(sorted);
      })
      .catch(() =>
        setTeacherLoadError("Impossible de charger la liste des enseignants."),
      )
      .finally(() => setIsLoadingTeachers(false));
  }, [loadClassOptions, schoolSlug]);

  // Load agenda for selected teacher
  const loadTeacherSchedule = useCallback(async () => {
    if (!schoolSlug || !selectedTeacherId || !allClasses.length) return;
    setIsLoadingSchedule(true);
    setScheduleError(null);
    try {
      const timetables = await Promise.all(
        allClasses.map((cls) =>
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
        const cls = allClasses[i]!;
        const ctx: OccurrenceContext = {
          classId: cls.classId,
          className: cls.className,
          schoolYearId: cls.schoolYearId,
        };
        for (const o of t.occurrences) {
          if (o.teacherUser.id === selectedTeacherId) {
            allOccurrences.push(o);
            contextByOccId.set(o.id, ctx);
          }
        }
      }
      const allSlots = timetables
        .flatMap((t) => t.slots)
        .filter((s) => s.teacherUser.id === selectedTeacherId);
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
      setScheduleError("Impossible de charger l'agenda de cet enseignant.");
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [schoolSlug, selectedTeacherId, allClasses, range.fromDate, range.toDate]);

  useEffect(() => {
    if (selectedTeacherId) {
      setSchedule(null);
      void loadTeacherSchedule().catch(() => {});
    }
  }, [loadTeacherSchedule, selectedTeacherId]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => t.name.toLowerCase().includes(q));
  }, [teachers, searchQuery]);

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
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.userSearchSection}>
        <Ionicons
          name="search-outline"
          size={16}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Chercher un enseignant..."
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          testID={`${P}-users-search`}
        />
      </View>

      {/* Teacher list */}
      {isLoadingTeachers ? (
        <LoadingBlock label="Chargement des enseignants..." />
      ) : teacherLoadError ? (
        <ErrorBanner message={teacherLoadError} />
      ) : filteredTeachers.length === 0 && teachers.length > 0 ? (
        <EmptyState
          icon="person-outline"
          title="Aucun résultat"
          message="Aucun enseignant ne correspond à votre recherche."
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.classPickerScroll}
          contentContainerStyle={styles.classPicker}
          testID={`${P}-users-teacher-picker`}
        >
          {filteredTeachers.map((t) => {
            const active = selectedTeacherId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.classPickerBtn,
                  active && styles.classPickerBtnActive,
                ]}
                onPress={() => {
                  setSelectedTeacherId(t.id);
                  setViewMode("day");
                  setCursorDate(today);
                }}
                testID={`${P}-users-teacher-btn-${t.id}`}
              >
                <Text
                  style={[
                    styles.classPickerBtnText,
                    active && styles.classPickerBtnTextActive,
                  ]}
                >
                  {t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Agenda for selected teacher */}
      {selectedTeacherId ? (
        <View style={styles.classPane}>
          <TimetablePane
            testIDPrefix={`${P}-users`}
            isLoading={isLoadingSchedule}
            hasData={schedule !== null}
            errorMessage={scheduleError}
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
              void loadTeacherSchedule().catch(() => {});
            }}
            emptyTitle="Aucun cours"
            emptyMessage="Aucun créneau planifié pour cet enseignant sur cette période."
            teacherUserId={selectedTeacherId}
            getOccurrenceContext={getOccurrenceContext}
            schoolSlug={schoolSlug ?? ""}
            onAfterMutation={() => {
              setSchedule(null);
              void loadTeacherSchedule().catch(() => {});
            }}
            canCreate={allClasses.length > 0}
            allClasses={allClasses}
            prefilledTeacherId={selectedTeacherId}
          />
        </View>
      ) : !isLoadingTeachers && teachers.length > 0 ? (
        <EmptyState
          icon="person-outline"
          title="Sélectionnez un enseignant"
          message="Choisissez un enseignant ci-dessus pour consulter son agenda."
        />
      ) : null}
    </View>
  );
}

// ─── Tab 2 : class agenda ─────────────────────────────────────────────────────

function TeacherClassAgendaPane({
  insetBottom,
  isAdminMode,
  lockedClassId,
  hideClassPicker,
}: {
  insetBottom: number;
  isAdminMode?: boolean;
  lockedClassId?: string;
  hideClassPicker?: boolean;
}) {
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

  // Admin mode: load ALL school classes (not just ones with assignments)
  const [adminClasses, setAdminClasses] = useState<TimetableClassOption[]>([]);
  const [isLoadingAdminClasses, setIsLoadingAdminClasses] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const today = useMemo(() => stripTime(new Date()), []);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    lockedClassId ?? null,
  );
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
    if (isAdminMode) {
      setIsLoadingAdminClasses(true);
      timetableApi
        .getAdminClassList(schoolSlug)
        .then((res) => {
          setAdminClasses(res.classes);
          if (!selectedClassId && res.classes.length > 0) {
            setSelectedClassId(res.classes[0]?.classId ?? null);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingAdminClasses(false));
    } else {
      void loadClassOptions(schoolSlug).catch(() => {});
    }
  }, [loadClassOptions, schoolSlug, isAdminMode]);

  // Auto-select first class when list loads (teacher mode)
  useEffect(() => {
    if (isAdminMode) return;
    if (lockedClassId) {
      setSelectedClassId(lockedClassId);
      return;
    }
    if (selectedClassId || !classOptions?.classes.length) return;
    setSelectedClassId(classOptions.classes[0]?.classId ?? null);
  }, [classOptions, selectedClassId, isAdminMode, lockedClassId]);

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
    () => (isAdminMode ? adminClasses : (classOptions?.classes ?? [])),
    [isAdminMode, adminClasses, classOptions?.classes],
  );

  const isLoadingClasses = isAdminMode
    ? isLoadingAdminClasses
    : isLoadingClassOptions && !classOptions;

  const selectedClass = classes.find((c) => c.classId === selectedClassId);

  return (
    <View style={styles.root}>
      {/* Class picker */}
      {isLoadingClasses ? (
        <LoadingBlock label="Chargement des classes..." />
      ) : classes.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="Aucune classe accessible"
          message="Aucune affectation trouvée pour ce profil."
        />
      ) : (
        <>
          {hideClassPicker ? null : isAdminMode ? (
            /* Dropdown pour admin : toutes les classes de l'école */
            <>
              <TouchableOpacity
                style={styles.classDropdownBtn}
                onPress={() => setDropdownOpen(true)}
                testID={`${P}-class-dropdown`}
              >
                <Ionicons
                  name="school-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.classDropdownBtnText} numberOfLines={1}>
                  {selectedClass?.className ?? "Sélectionner une classe"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <Modal
                visible={dropdownOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setDropdownOpen(false)}
              >
                <View style={styles.modalCenterOverlay}>
                  <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setDropdownOpen(false)}
                  />
                  <View style={styles.classDropdownModal}>
                    <View style={styles.classDropdownHeader}>
                      <Text style={styles.classDropdownTitle}>
                        Choisir une classe
                      </Text>
                      <TouchableOpacity onPress={() => setDropdownOpen(false)}>
                        <Ionicons
                          name="close"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={styles.classDropdownList}
                    >
                      {classes.map((cls) => {
                        const active = selectedClassId === cls.classId;
                        return (
                          <TouchableOpacity
                            key={cls.classId}
                            style={[
                              styles.classDropdownItem,
                              active && styles.classDropdownItemActive,
                            ]}
                            onPress={() => {
                              setSelectedClassId(cls.classId);
                              setViewMode("day");
                              setCursorDate(today);
                              setDropdownOpen(false);
                            }}
                            testID={`${P}-class-btn-${cls.classId}`}
                          >
                            <Text
                              style={[
                                styles.classDropdownItemText,
                                active && styles.classDropdownItemTextActive,
                              ]}
                            >
                              {cls.className}
                            </Text>
                            {active ? (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={colors.white}
                              />
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            /* Pill scroller pour enseignant : peu de classes */
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
          )}

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
              teacherUserId={isAdminMode ? undefined : (user?.id ?? undefined)}
              isAdminMode={isAdminMode}
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
  // Edit panel props
  teacherUserId?: string;
  /** En mode admin : toutes les occurrences sont éditables */
  isAdminMode?: boolean;
  getOccurrenceContext?: (occId: string) => OccurrenceContext | undefined;
  schoolSlug?: string;
  onAfterMutation?: () => void;
  // Creation panel props
  canCreate?: boolean;
  allClasses?: TimetableClassOption[];
  prefilledClassId?: string;
  /** En mode admin user pane : pré-sélectionne cet enseignant dans le formulaire de création */
  prefilledTeacherId?: string;
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
  isAdminMode,
  getOccurrenceContext,
  schoolSlug,
  onAfterMutation,
  canCreate,
  allClasses,
  prefilledClassId,
  prefilledTeacherId,
}: TimetablePaneProps) {
  const [editingOccurrence, setEditingOccurrence] =
    useState<TimetableOccurrence | null>(null);
  const [creating, setCreating] = useState(false);

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
  const editingContext =
    editingOccurrence && getOccurrenceContext
      ? getOccurrenceContext(editingOccurrence.id)
      : undefined;
  const canRenderEditModal =
    !!editingOccurrence && !!schoolSlug && !!editingContext;

  const isTeacherOcc = useCallback(
    (occ: TimetableOccurrence) => {
      if (isAdminMode) return true;
      return !!teacherUserId && occ.teacherUser.id === teacherUserId;
    },
    [isAdminMode, teacherUserId],
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
                <View
                  style={styles.weekSelectedSlotSection}
                  testID={`${testIDPrefix}-week-detail`}
                  onLayout={(e) => {
                    weekDetailY.current = e.nativeEvent.layout.y;
                  }}
                >
                  <Text style={styles.weekSelectedSlotLabel}>
                    CRENEAU SELECTIONNE
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
                      Sélectionnez un créneau dans le tableau pour afficher son
                      détail.
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
      {canCreate && !editingOccurrence && !creating ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: insetBottom + 20 }]}
          onPress={() => setCreating(true)}
          testID={`${testIDPrefix}-fab-create`}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      {/* Modal centrée de création */}
      <Modal
        visible={creating}
        transparent
        animationType="fade"
        onRequestClose={() => setCreating(false)}
      >
        <View style={styles.modalCenterOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCreating(false)}
            testID={`${testIDPrefix}-create-modal-backdrop`}
          />
          <View
            style={styles.modalCard}
            testID={`${testIDPrefix}-create-modal-content`}
          >
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
                  prefilledTeacherId={prefilledTeacherId}
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

      {/* Modal centrée de modification */}
      <Modal
        visible={canRenderEditModal}
        transparent
        animationType="fade"
        onRequestClose={closeEdit}
      >
        <View
          style={styles.modalCenterOverlay}
          testID={`${testIDPrefix}-edit-modal`}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeEdit}
            testID={`${testIDPrefix}-edit-modal-backdrop`}
          />
          <View
            style={styles.editModalCard}
            testID={`${testIDPrefix}-edit-modal-content`}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {canRenderEditModal ? (
                <TeacherSlotEditPanel
                  occurrence={editingOccurrence}
                  className={editingContext.className}
                  classId={editingContext.classId}
                  schoolYearId={editingContext.schoolYearId}
                  schoolSlug={schoolSlug}
                  adminMode={isAdminMode}
                  onClose={closeEdit}
                  onSuccess={() => {
                    closeEdit();
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

  userSearchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    gap: 8,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },

  classDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  classDropdownBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  classDropdownModal: {
    width: "85%",
    maxWidth: 360,
    maxHeight: "60%",
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    overflow: "hidden",
    shadowColor: "#0B274B",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  classDropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE8F7",
  },
  classDropdownTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  classDropdownList: { paddingVertical: 4 },
  classDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  classDropdownItemActive: {
    backgroundColor: colors.primary,
  },
  classDropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  classDropdownItemTextActive: {
    color: colors.white,
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

  modalCenterOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,22,41,0.55)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "88%",
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE8F7",
    padding: 16,
    shadowColor: "#0B274B",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  editModalCard: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "88%",
    backgroundColor: "transparent",
    padding: 0,
  },
});
