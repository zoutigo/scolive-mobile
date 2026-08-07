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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { ModuleHeader } from "../navigation/ModuleHeader";
import {
  buildAdminSubtitle,
  buildTeacherSubtitle,
} from "../navigation/nav-config";
import { useAuthStore } from "../../store/auth.store";
import { useTimetableStore } from "../../store/timetable.store";
import { timetableApi } from "../../api/timetable.api";
import type {
  TimetableClassOption,
  TimetableOccurrence,
  TimetableSubjectStyle,
} from "../../types/timetable.types";
import type { AuthUser } from "../../types/auth.types";
import {
  buildTimetableRangeForView,
  fullTeacherName,
  parseOccurrenceDate,
  stripTime,
  toWeekdayMondayFirst,
  TimetableCalendarViewMode,
} from "../../utils/timetable";
import { WeekSelection } from "./StudentTimetableScreen";
import { EmptyState, ErrorBanner, LoadingBlock } from "./TimetableCommon";
import { AdminSchedulePane } from "./AdminSchedulePane";
import { TimetablePane, type OccurrenceContext } from "./TimetablePane";
import { useTranslation } from "../../i18n/useTranslation";
import { moduleBack } from "../../utils/moduleBack";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { PageHelpModal } from "../help/PageHelpModal";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import {
  TEACHER_AGENDA_TOUR_ID,
  TEACHER_AGENDA_TOUR_STEPS,
  TEACHER_AGENDA_TOUR_TARGETS,
} from "./teacher-agenda-tour.config";

const P = "teacher-agenda";

type AgendaTab = "mine" | "classes" | "users";

type TeacherOption = { id: string; name: string };

function isSchoolAdmin(user: AuthUser | null): boolean {
  const role = user?.activeRole ?? user?.role;
  return role === "SCHOOL_ADMIN";
}

// ─── Main exported screen ────────────────────────────────────────────────────

export function TeacherAgendaScreen() {
  const params = useLocalSearchParams<{
    teacherId?: string;
    teacherName?: string;
  }>();
  const teacherId =
    typeof params.teacherId === "string" && params.teacherId
      ? params.teacherId
      : undefined;
  const teacherName =
    typeof params.teacherName === "string" && params.teacherName
      ? params.teacherName
      : undefined;
  return (
    <TeacherAgendaScreenInner
      viewAsTeacherId={teacherId}
      viewAsTeacherName={teacherName}
    />
  );
}

type TeacherAgendaScreenProps = {
  initialTab?: AgendaTab;
  lockedClassId?: string;
  lockedClassName?: string;
  hideClassPicker?: boolean;
  headerTitle?: string;
  lockedClassTabLabel?: string;
  /** Admin viewing a specific teacher's agenda */
  viewAsTeacherId?: string;
  viewAsTeacherName?: string;
  showHeader?: boolean;
};

export function TeacherAgendaScreenInner({
  initialTab,
  lockedClassId,
  lockedClassName,
  hideClassPicker = false,
  headerTitle,
  lockedClassTabLabel,
  viewAsTeacherId,
  viewAsTeacherName,
  showHeader = true,
}: TeacherAgendaScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const admin = isSchoolAdmin(user);
  const isLockedClassView = !admin && Boolean(lockedClassId);
  /** Écran "Schedule" listé au menu admin : filtres Users/Classes centralisés,
   * pas de tabs. Ne s'applique pas quand une classe est déjà verrouillée
   * (embarqué depuis AdminClassDetailScreen), qui garde son comportement
   * existant inchangé. */
  const isAdminBrowsing = admin && !lockedClassId;
  const subtitle = viewAsTeacherName
    ? viewAsTeacherName
    : user
      ? admin
        ? buildAdminSubtitle(user)
        : isLockedClassView
          ? [user.schoolName, lockedClassName].filter(Boolean).join(" · ") ||
            null
          : buildTeacherSubtitle(user)
      : null;
  const classTabLabel =
    lockedClassTabLabel ??
    (lockedClassName
      ? `${t("timetable.teacherAgenda.classTabLabelPrefix")} ${lockedClassName}`
      : t("timetable.teacherAgenda.classTabLabelDefault"));
  const [activeTab, setActiveTab] = useState<AgendaTab>(
    isLockedClassView
      ? "classes"
      : (initialTab ?? (viewAsTeacherId ? "mine" : admin ? "users" : "mine")),
  );
  const [helpVisible, setHelpVisible] = useState(false);

  useOnboardingTourTrigger({
    tourId: TEACHER_AGENDA_TOUR_ID,
    role: "teacher",
    steps: TEACHER_AGENDA_TOUR_STEPS,
  });
  const onboardingActiveTourTargetKey = useOnboardingTourStore((state) =>
    state.activeTourId ? state.steps[state.stepIndex]?.targetKey : undefined,
  );

  // The mode-tabs/nav-row steps only exist inside the "mine" pane. If the
  // screen landed on the "classes" tab (locked class view), force "mine"
  // back so these steps' targets actually mount instead of leaving the tour
  // stuck with no visible overlay (see create-help skill §2ter-c).
  useEffect(() => {
    if (
      (onboardingActiveTourTargetKey === TEACHER_AGENDA_TOUR_TARGETS.modeTabs ||
        onboardingActiveTourTargetKey === TEACHER_AGENDA_TOUR_TARGETS.navRow) &&
      activeTab !== "mine"
    ) {
      setActiveTab("mine");
    }
  }, [onboardingActiveTourTargetKey, activeTab]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      {showHeader ? (
        <ModuleHeader
          title={headerTitle ?? t("timetable.teacherAgenda.headerTitle")}
          subtitle={subtitle}
          onBack={() => moduleBack(router)}
          testID={`${P}-header`}
          backTestID={`${P}-back`}
          topInset={insets.top}
          helpAction={
            admin
              ? undefined
              : {
                  label: t("timetable.teacherAgenda.help.menuLabel"),
                  onPress: () => setHelpVisible(true),
                  testID: `${P}-help-menu-item`,
                }
          }
          menuTourTargetId={
            admin ? undefined : TEACHER_AGENDA_TOUR_TARGETS.helpToggle
          }
        />
      ) : null}

      {/* Tab switcher */}
      {isAdminBrowsing ? null : (
        <OnboardingTarget
          id={TEACHER_AGENDA_TOUR_TARGETS.tabs}
          style={styles.tabRow}
          testID={`${P}-tabs`}
        >
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
                  {t("timetable.teacherAgenda.tabs.users")}
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
                  {t("timetable.teacherAgenda.tabs.classes")}
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
                      {t("timetable.teacherAgenda.tabs.mine")}
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
                      {t("timetable.teacherAgenda.tabs.mine")}
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
                      {t("timetable.teacherAgenda.tabs.myClasses")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </OnboardingTarget>
      )}

      {isAdminBrowsing ? (
        <AdminSchedulePane insetBottom={insets.bottom} />
      ) : activeTab === "mine" ? (
        <TeacherMyAgendaPane
          insetBottom={insets.bottom}
          viewAsTeacherId={viewAsTeacherId}
        />
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

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={
          activeTab === "classes"
            ? t("timetable.teacherAgenda.help.classes.title")
            : t("timetable.teacherAgenda.help.mine.title")
        }
        sections={
          activeTab === "classes"
            ? [
                {
                  title: t(
                    "timetable.teacherAgenda.help.classes.section1Title",
                  ),
                  body: [
                    t("timetable.teacherAgenda.help.classes.section1Body"),
                  ],
                },
                {
                  title: t(
                    "timetable.teacherAgenda.help.classes.section2Title",
                  ),
                  body: [
                    t("timetable.teacherAgenda.help.classes.section2Body"),
                  ],
                },
                {
                  title: t(
                    "timetable.teacherAgenda.help.classes.section3Title",
                  ),
                  body: [
                    t("timetable.teacherAgenda.help.classes.section3Body"),
                  ],
                },
              ]
            : [
                {
                  title: t("timetable.teacherAgenda.help.mine.section1Title"),
                  body: [t("timetable.teacherAgenda.help.mine.section1Body")],
                },
                {
                  title: t("timetable.teacherAgenda.help.mine.section2Title"),
                  body: [t("timetable.teacherAgenda.help.mine.section2Body")],
                },
                {
                  title: t("timetable.teacherAgenda.help.mine.section3Title"),
                  body: [t("timetable.teacherAgenda.help.mine.section3Body")],
                },
              ]
        }
        closeLabel={t("timetable.teacherAgenda.help.close")}
        testID={`${P}-help-modal`}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Tab 1 : teacher's own agenda ────────────────────────────────────────────
//
type TeacherScheduleData = {
  occurrences: TimetableOccurrence[];
  subjectStyles: TimetableSubjectStyle[];
  slots: { weekday: number; teacherUser: { id: string } }[];
  contextByOccId: Map<string, OccurrenceContext>;
};

function TeacherMyAgendaPane({
  insetBottom,
  viewAsTeacherId,
}: {
  insetBottom: number;
  viewAsTeacherId?: string;
}) {
  const { schoolSlug, user } = useAuthStore();
  const { t, locale } = useTranslation();
  const effectiveTeacherId = viewAsTeacherId ?? user?.id;
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
  const loadKeyRef = useRef(0);

  const range = useMemo(
    () => buildTimetableRangeForView(viewMode, cursorDate),
    [cursorDate, viewMode],
  );

  const load = useCallback(async () => {
    if (!schoolSlug || !effectiveTeacherId) return;
    const key = ++loadKeyRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [schedulePayload, classOptionsResult] = await Promise.all([
        timetableApi.getTeacherMyTimetable(schoolSlug, {
          teacherUserId:
            viewAsTeacherId && viewAsTeacherId !== user?.id
              ? viewAsTeacherId
              : undefined,
          fromDate: range.fromDate,
          toDate: range.toDate,
        }),
        loadClassOptions(schoolSlug).catch(() => null),
      ]);
      if (key !== loadKeyRef.current) return;
      setAllClasses(classOptionsResult?.classes ?? []);
      const contextByOccId = new Map<string, OccurrenceContext>();
      schedulePayload.occurrenceContexts.forEach((ctx) => {
        contextByOccId.set(ctx.occurrenceId, {
          classId: ctx.classId,
          className: ctx.className,
          schoolYearId: ctx.schoolYearId,
        });
      });
      setSchedule({
        occurrences: schedulePayload.occurrences,
        subjectStyles: schedulePayload.subjectStyles,
        slots: schedulePayload.slots,
        contextByOccId,
      });
    } catch {
      if (key !== loadKeyRef.current) return;
      setErrorMessage(t("timetable.teacherAgenda.errors.loadMyAgenda"));
      setIsLoading(false);
      return;
    }
    if (key !== loadKeyRef.current) return;
    setIsLoading(false);
  }, [
    effectiveTeacherId,
    loadClassOptions,
    range.fromDate,
    range.toDate,
    schoolSlug,
    locale,
    user?.id,
    viewAsTeacherId,
  ]);

  // useFocusEffect couvre déjà le montage initial (l'écran est focus dès son
  // premier rendu) et se redéclenche à chaque retour de focus — nécessaire
  // car un retour depuis l'écran d'édition d'un créneau (slot-edit) ne
  // remonte pas cet écran : sans ce refetch, une suppression/modification de
  // série récurrente semblait "ne pas être prise en compte" tant que
  // l'agenda n'était pas rechargé manuellement.
  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
    }, [load]),
  );

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
    const occs = schedule?.occurrences ?? [];
    const occHasSat = occs.some((o) => {
      const d = parseOccurrenceDate(o.occurrenceDate);
      return d !== null && toWeekdayMondayFirst(d) === 6;
    });
    const occHasSun = occs.some((o) => {
      const d = parseOccurrenceDate(o.occurrenceDate);
      return d !== null && toWeekdayMondayFirst(d) === 7;
    });
    return {
      showSaturday: slots.some((s) => s.weekday === 6) || occHasSat,
      showSunday: slots.some((s) => s.weekday === 7) || occHasSun,
    };
  }, [schedule?.slots, schedule?.occurrences]);

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
      emptyTitle={t("timetable.common.noCourseTitle")}
      emptyMessage={t("timetable.teacherAgenda.emptyMessageMine")}
      teacherUserId={user?.id}
      getOccurrenceContext={getOccurrenceContext}
      schoolSlug={schoolSlug ?? ""}
      canCreate={allClasses.length > 0}
      modeTabsTourTargetId={TEACHER_AGENDA_TOUR_TARGETS.modeTabs}
      navRowTourTargetId={TEACHER_AGENDA_TOUR_TARGETS.navRow}
    />
  );
}

// ─── Tab admin : agenda par enseignant ───────────────────────────────────────

function AdminUserAgendaPane({ insetBottom }: { insetBottom: number }) {
  const { schoolSlug } = useAuthStore();
  const { t, locale } = useTranslation();
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
  const loadTeacherScheduleKeyRef = useRef(0);

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
        setTeacherLoadError(t("timetable.teacherAgenda.errors.loadTeachers")),
      )
      .finally(() => setIsLoadingTeachers(false));
  }, [loadClassOptions, schoolSlug, locale]);

  // Load agenda for selected teacher
  const loadTeacherSchedule = useCallback(async () => {
    if (!schoolSlug || !selectedTeacherId || !allClasses.length) return;
    const key = ++loadTeacherScheduleKeyRef.current;
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
      if (key !== loadTeacherScheduleKeyRef.current) return;
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
      if (key !== loadTeacherScheduleKeyRef.current) return;
      setScheduleError(t("timetable.teacherAgenda.errors.loadTeacherAgenda"));
      setIsLoadingSchedule(false);
      return;
    }
    if (key !== loadTeacherScheduleKeyRef.current) return;
    setIsLoadingSchedule(false);
  }, [
    schoolSlug,
    selectedTeacherId,
    allClasses,
    range.fromDate,
    range.toDate,
    locale,
  ]);

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
    const occs = schedule?.occurrences ?? [];
    const occHasSat = occs.some((o) => {
      const d = parseOccurrenceDate(o.occurrenceDate);
      return d !== null && toWeekdayMondayFirst(d) === 6;
    });
    const occHasSun = occs.some((o) => {
      const d = parseOccurrenceDate(o.occurrenceDate);
      return d !== null && toWeekdayMondayFirst(d) === 7;
    });
    return {
      showSaturday: slots.some((s) => s.weekday === 6) || occHasSat,
      showSunday: slots.some((s) => s.weekday === 7) || occHasSun,
    };
  }, [schedule?.slots, schedule?.occurrences]);

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
          placeholder={t("timetable.teacherAgenda.searchTeacherPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          testID={`${P}-users-search`}
        />
      </View>

      {/* Teacher list */}
      {isLoadingTeachers ? (
        <LoadingBlock label={t("timetable.teacherAgenda.loadingTeachers")} />
      ) : teacherLoadError ? (
        <ErrorBanner message={teacherLoadError} />
      ) : filteredTeachers.length === 0 && teachers.length > 0 ? (
        <EmptyState
          icon="person-outline"
          title={t("timetable.teacherAgenda.noResultTitle")}
          message={t("timetable.teacherAgenda.noResultMessage")}
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
            emptyTitle={t("timetable.common.noCourseTitle")}
            emptyMessage={t("timetable.teacherAgenda.emptyMessageTeacher")}
            teacherUserId={selectedTeacherId}
            getOccurrenceContext={getOccurrenceContext}
            schoolSlug={schoolSlug ?? ""}
            canCreate={allClasses.length > 0}
            prefilledTeacherId={selectedTeacherId}
          />
        </View>
      ) : !isLoadingTeachers && teachers.length > 0 ? (
        <EmptyState
          icon="person-outline"
          title={t("timetable.teacherAgenda.selectTeacherTitle")}
          message={t("timetable.teacherAgenda.selectTeacherMessage")}
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
  const { t } = useTranslation();
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
        .getAdminClassList(schoolSlug, { limit: 100 })
        .then((res) => {
          setAdminClasses(res.data);
          if (!selectedClassId && res.data.length > 0) {
            setSelectedClassId(res.data[0]?.classId ?? null);
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
    const occs = classTimetable?.occurrences ?? [];
    const occHasSat = occs.some((o) => {
      const d = parseOccurrenceDate(o.occurrenceDate);
      return d !== null && toWeekdayMondayFirst(d) === 6;
    });
    const occHasSun = occs.some((o) => {
      const d = parseOccurrenceDate(o.occurrenceDate);
      return d !== null && toWeekdayMondayFirst(d) === 7;
    });
    return {
      showSaturday: slots.some((s) => s.weekday === 6) || occHasSat,
      showSunday: slots.some((s) => s.weekday === 7) || occHasSun,
    };
  }, [classTimetable?.slots, classTimetable?.occurrences]);

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
        <LoadingBlock label={t("timetable.teacherAgenda.loadingClasses")} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title={t("timetable.teacherAgenda.noClassTitle")}
          message={t("timetable.teacherAgenda.noClassMessage")}
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
                  {selectedClass?.className ??
                    t("timetable.teacherAgenda.selectClassPlaceholder")}
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
                        {t("timetable.teacherAgenda.chooseClassTitle")}
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
              emptyTitle={t("timetable.common.noCourseTitle")}
              emptyMessage={t("timetable.teacherAgenda.emptyMessageClass")}
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
              canCreate={classes.length > 0}
              prefilledClassId={selectedClassId ?? undefined}
            />
          </View>
        </>
      )}
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
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0B274B",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  editModalCard: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "88%",
    backgroundColor: "transparent",
    padding: 0,
  },
});
