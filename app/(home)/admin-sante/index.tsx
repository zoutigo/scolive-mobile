/**
 * Écran Santé — Vue école (responsable santé / admin / manager).
 * 3 onglets : Synthèse (stats école/classe), Cares (signalements parents,
 * du plus récent au plus ancien, recherche + filtres + pagination), Élèves
 * (recherche + filtre classe + pagination, tap -> fiche élève).
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../../src/theme";
import { useTranslation } from "../../../src/i18n/useTranslation";
import type { TranslateFn } from "../../../src/i18n/useTranslation";
import { useAuthStore } from "../../../src/store/auth.store";
import { moduleBack } from "../../../src/utils/moduleBack";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { UnderlineTabs } from "../../../src/components/navigation/UnderlineTabs";
import { InlineSelectDropDown } from "../../../src/components/InlineSelectDropDown";
import { InfiniteScrollList } from "../../../src/components/lists/InfiniteScrollList";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../../../src/components/timetable/TimetableCommon";
import { healthApi } from "../../../src/api/health.api";
import { teachersApi } from "../../../src/api/teachers.api";
import type { TeacherClassroomOption } from "../../../src/types/teachers.types";
import {
  ALERT_LEVEL_COLORS,
  HEALTH_ALERT_LEVELS,
  HEALTH_REPORT_TYPES,
  NO_SCHOOL_HEALTH_REPORTS_FILTERS,
  NO_SCHOOL_HEALTH_STUDENTS_FILTERS,
  alertLevelLabel,
  hasActiveSchoolHealthReportsFilters,
  hasActiveSchoolHealthStudentsFilters,
  reportTypeLabel,
  type HealthAlertLevel,
  type HealthReportType,
  type SchoolHealthReportItem,
  type SchoolHealthReportsFilters,
  type SchoolHealthStats,
  type SchoolHealthStudentSummary,
  type SchoolHealthStudentsFilters,
} from "../../../src/types/health.types";
import {
  HEALTH_SCHOOL_TOUR_ID,
  HEALTH_SCHOOL_TOUR_STEPS,
  HEALTH_SCHOOL_TOUR_TARGETS,
} from "../../../src/components/health/health-school-tour.config";
import { useOnboardingTourTrigger } from "../../../src/hooks/useOnboardingTourTrigger";
import { OnboardingTarget } from "../../../src/components/onboarding/OnboardingTarget";

const SEARCH_DEBOUNCE_MS = 300;
const ALL_CLASSES = "__ALL__";

type MainTab = "synthese" | "cares" | "eleves";
type ListMeta = { page: number; limit: number; total: number };

export default function AdminSanteScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminSanteScreenContent />
    </AppShell>
  );
}

function AdminSanteScreenContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolSlug, user } = useAuthStore();

  const [tab, setTab] = useState<MainTab>("synthese");
  const [classrooms, setClassrooms] = useState<TeacherClassroomOption[]>([]);

  useOnboardingTourTrigger({
    tourId: HEALTH_SCHOOL_TOUR_ID,
    role: "school",
    steps: HEALTH_SCHOOL_TOUR_STEPS,
  });

  useEffect(() => {
    if (!schoolSlug) return;
    teachersApi
      .listClassrooms(schoolSlug)
      .then(setClassrooms)
      .catch(() => setClassrooms([]));
  }, [schoolSlug]);

  const classOptions = useMemo(
    () => [
      { value: ALL_CLASSES, label: t("health.admin.scope.allClasses") },
      ...classrooms.map((c) => ({ value: c.id, label: c.name })),
    ],
    [classrooms, t],
  );

  // ── Synthèse ───────────────────────────────────────────────────────────────

  const [statsClassId, setStatsClassId] = useState<string>(ALL_CLASSES);
  const [stats, setStats] = useState<SchoolHealthStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!schoolSlug) return;
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const result = await healthApi.getSchoolStats(schoolSlug, {
        classId: statsClassId === ALL_CLASSES ? undefined : statsClassId,
      });
      setStats(result);
    } catch {
      setStatsError(t("health.admin.stats.error"));
    } finally {
      setIsLoadingStats(false);
    }
  }, [schoolSlug, statsClassId]);

  useEffect(() => {
    if (tab === "synthese") void loadStats();
  }, [tab, loadStats]);

  // ── Cares (reports globaux) ─────────────────────────────────────────────────

  const [cares, setCares] = useState<SchoolHealthReportItem[]>([]);
  const [caresMeta, setCaresMeta] = useState<ListMeta | null>(null);
  const [isCaresLoading, setIsCaresLoading] = useState(true);
  const [isCaresLoadingMore, setIsCaresLoadingMore] = useState(false);
  const [caresError, setCaresError] = useState<string | null>(null);
  const [caresSearchInput, setCaresSearchInput] = useState("");
  const [caresAppliedSearch, setCaresAppliedSearch] = useState("");
  const [caresFiltersOpen, setCaresFiltersOpen] = useState(false);
  const [caresDraftFilters, setCaresDraftFilters] =
    useState<SchoolHealthReportsFilters>(NO_SCHOOL_HEALTH_REPORTS_FILTERS);
  const [caresAppliedFilters, setCaresAppliedFilters] =
    useState<SchoolHealthReportsFilters>(NO_SCHOOL_HEALTH_REPORTS_FILTERS);
  const caresSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const loadCares = useCallback(
    async (
      page: number,
      filters: SchoolHealthReportsFilters,
      search: string,
      mode: "reset" | "append",
    ) => {
      if (!schoolSlug) return;
      setCaresError(null);
      if (mode === "append") setIsCaresLoadingMore(true);
      else setIsCaresLoading(true);
      try {
        const result = await healthApi.listSchoolReports(schoolSlug, {
          page,
          search,
          filters,
        });
        setCares((prev) =>
          mode === "append" ? [...prev, ...result.items] : result.items,
        );
        setCaresMeta({
          page: result.page,
          limit: result.limit,
          total: result.total,
        });
      } catch {
        setCaresError(t("health.admin.profile.errors.load"));
      } finally {
        setIsCaresLoading(false);
        setIsCaresLoadingMore(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (tab !== "cares") return;
    void loadCares(1, caresAppliedFilters, caresAppliedSearch, "reset");
  }, [tab, caresAppliedFilters, caresAppliedSearch, loadCares]);

  useEffect(() => {
    if (caresSearchDebounceRef.current)
      clearTimeout(caresSearchDebounceRef.current);
    caresSearchDebounceRef.current = setTimeout(() => {
      setCaresAppliedSearch(caresSearchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (caresSearchDebounceRef.current)
        clearTimeout(caresSearchDebounceRef.current);
    };
  }, [caresSearchInput]);

  const handleLoadMoreCares = useCallback(() => {
    if (!caresMeta || isCaresLoadingMore) return;
    const totalPages = Math.max(
      1,
      Math.ceil(caresMeta.total / caresMeta.limit),
    );
    if (caresMeta.page >= totalPages) return;
    void loadCares(
      caresMeta.page + 1,
      caresAppliedFilters,
      caresAppliedSearch,
      "append",
    );
  }, [
    caresMeta,
    isCaresLoadingMore,
    caresAppliedFilters,
    caresAppliedSearch,
    loadCares,
  ]);

  function openCaresFilters() {
    setCaresDraftFilters(caresAppliedFilters);
    setCaresFiltersOpen(true);
  }
  function closeCaresFilters() {
    setCaresDraftFilters(caresAppliedFilters);
    setCaresFiltersOpen(false);
  }
  function applyCaresFilters() {
    setCaresAppliedFilters(caresDraftFilters);
    setCaresFiltersOpen(false);
  }
  function resetCaresFilters() {
    setCaresDraftFilters(NO_SCHOOL_HEALTH_REPORTS_FILTERS);
    setCaresAppliedFilters(NO_SCHOOL_HEALTH_REPORTS_FILTERS);
  }

  // ── Élèves ────────────────────────────────────────────────────────────────

  const [students, setStudents] = useState<SchoolHealthStudentSummary[]>([]);
  const [studentsMeta, setStudentsMeta] = useState<ListMeta | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState(true);
  const [isStudentsLoadingMore, setIsStudentsLoadingMore] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentsSearchInput, setStudentsSearchInput] = useState("");
  const [studentsAppliedSearch, setStudentsAppliedSearch] = useState("");
  const [studentsFiltersOpen, setStudentsFiltersOpen] = useState(false);
  const [studentsDraftFilters, setStudentsDraftFilters] =
    useState<SchoolHealthStudentsFilters>(NO_SCHOOL_HEALTH_STUDENTS_FILTERS);
  const [studentsAppliedFilters, setStudentsAppliedFilters] =
    useState<SchoolHealthStudentsFilters>(NO_SCHOOL_HEALTH_STUDENTS_FILTERS);
  const studentsSearchDebounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const loadStudents = useCallback(
    async (
      page: number,
      filters: SchoolHealthStudentsFilters,
      search: string,
      mode: "reset" | "append",
    ) => {
      if (!schoolSlug) return;
      setStudentsError(null);
      if (mode === "append") setIsStudentsLoadingMore(true);
      else setIsStudentsLoading(true);
      try {
        const result = await healthApi.listSchoolStudents(schoolSlug, {
          page,
          search,
          filters,
        });
        setStudents((prev) =>
          mode === "append" ? [...prev, ...result.items] : result.items,
        );
        setStudentsMeta({
          page: result.page,
          limit: result.limit,
          total: result.total,
        });
      } catch {
        setStudentsError(t("health.admin.profile.errors.load"));
      } finally {
        setIsStudentsLoading(false);
        setIsStudentsLoadingMore(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (tab !== "eleves") return;
    void loadStudents(
      1,
      studentsAppliedFilters,
      studentsAppliedSearch,
      "reset",
    );
  }, [tab, studentsAppliedFilters, studentsAppliedSearch, loadStudents]);

  useEffect(() => {
    if (studentsSearchDebounceRef.current) {
      clearTimeout(studentsSearchDebounceRef.current);
    }
    studentsSearchDebounceRef.current = setTimeout(() => {
      setStudentsAppliedSearch(studentsSearchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (studentsSearchDebounceRef.current) {
        clearTimeout(studentsSearchDebounceRef.current);
      }
    };
  }, [studentsSearchInput]);

  const handleLoadMoreStudents = useCallback(() => {
    if (!studentsMeta || isStudentsLoadingMore) return;
    const totalPages = Math.max(
      1,
      Math.ceil(studentsMeta.total / studentsMeta.limit),
    );
    if (studentsMeta.page >= totalPages) return;
    void loadStudents(
      studentsMeta.page + 1,
      studentsAppliedFilters,
      studentsAppliedSearch,
      "append",
    );
  }, [
    studentsMeta,
    isStudentsLoadingMore,
    studentsAppliedFilters,
    studentsAppliedSearch,
    loadStudents,
  ]);

  function openStudentsFilters() {
    setStudentsDraftFilters(studentsAppliedFilters);
    setStudentsFiltersOpen(true);
  }
  function closeStudentsFilters() {
    setStudentsDraftFilters(studentsAppliedFilters);
    setStudentsFiltersOpen(false);
  }
  function applyStudentsFilters() {
    setStudentsAppliedFilters(studentsDraftFilters);
    setStudentsFiltersOpen(false);
  }
  function resetStudentsFilters() {
    setStudentsDraftFilters(NO_SCHOOL_HEALTH_STUDENTS_FILTERS);
    setStudentsAppliedFilters(NO_SCHOOL_HEALTH_STUDENTS_FILTERS);
  }

  function goToStudent(
    studentId: string,
    meta?: {
      firstName: string;
      lastName: string;
      className?: string | null;
      age?: number | null;
    },
  ) {
    router.push({
      pathname: "/(home)/admin-sante/[studentId]",
      params: {
        studentId,
        firstName: meta?.firstName ?? "",
        lastName: meta?.lastName ?? "",
        className: meta?.className ?? "",
        age: meta?.age != null ? String(meta.age) : "",
      },
    });
  }

  return (
    <View style={styles.root} testID="admin-sante-screen">
      <ModuleHeader
        title={t("health.title")}
        subtitle={user?.schoolName ?? null}
        onBack={() => moduleBack(router)}
      />

      <OnboardingTarget id={HEALTH_SCHOOL_TOUR_TARGETS.tabs}>
        <UnderlineTabs
          items={[
            { key: "synthese", label: t("health.admin.tabs.synthese") },
            { key: "cares", label: t("health.admin.tabs.cares") },
            { key: "eleves", label: t("health.admin.tabs.eleves") },
          ]}
          activeKey={tab}
          onSelect={setTab}
          testIDPrefix="admin-sante-tab"
        />
      </OnboardingTarget>

      {tab === "synthese" ? (
        <SyntheseTab
          t={t}
          stats={stats}
          isLoading={isLoadingStats}
          error={statsError}
          classOptions={classOptions}
          classId={statsClassId}
          onChangeClassId={setStatsClassId}
        />
      ) : tab === "cares" ? (
        <View style={styles.body}>
          <OnboardingTarget id={HEALTH_SCHOOL_TOUR_TARGETS.search}>
            <View style={styles.searchRow} testID="admin-cares-search-row">
              <View style={styles.searchBox}>
                <Ionicons
                  name="search"
                  size={16}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.searchInput}
                  value={caresSearchInput}
                  onChangeText={setCaresSearchInput}
                  placeholder={t("health.admin.cares.search.placeholder")}
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="search"
                  autoCapitalize="none"
                  accessibilityLabel={t(
                    "health.admin.cares.search.accessibilityLabel",
                  )}
                  testID="admin-cares-search-input"
                />
                {caresSearchInput.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setCaresSearchInput("")}
                    testID="admin-cares-search-clear"
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                style={[
                  styles.filterToggle,
                  hasActiveSchoolHealthReportsFilters(caresAppliedFilters) &&
                    styles.filterToggleActive,
                ]}
                onPress={() =>
                  caresFiltersOpen ? closeCaresFilters() : openCaresFilters()
                }
                testID="admin-cares-filter-toggle"
                accessibilityLabel={t(
                  "health.admin.cares.filters.toggleAccessibilityLabel",
                )}
              >
                <Ionicons
                  name={
                    hasActiveSchoolHealthReportsFilters(caresAppliedFilters)
                      ? "filter"
                      : "filter-outline"
                  }
                  size={18}
                  color={
                    hasActiveSchoolHealthReportsFilters(caresAppliedFilters)
                      ? colors.white
                      : colors.accentTeal
                  }
                />
              </TouchableOpacity>
            </View>
          </OnboardingTarget>

          {caresFiltersOpen ? (
            <CaresFiltersPanel
              t={t}
              draft={caresDraftFilters}
              onChange={setCaresDraftFilters}
              onReset={resetCaresFilters}
              onClose={closeCaresFilters}
              onApply={applyCaresFilters}
            />
          ) : isCaresLoading ? (
            <LoadingBlock label={t("health.parent.loading")} />
          ) : caresError ? (
            <ErrorBanner message={caresError} testID="admin-cares-error" />
          ) : (
            <InfiniteScrollList
              data={cares}
              keyExtractor={(item) => item.id}
              onLoadMore={handleLoadMoreCares}
              hasMore={
                !!caresMeta &&
                caresMeta.page <
                  Math.max(1, Math.ceil(caresMeta.total / caresMeta.limit))
              }
              isLoadingMore={isCaresLoadingMore}
              contentContainerStyle={styles.listContent}
              testID="admin-cares-list"
              emptyComponent={
                <EmptyState
                  icon="medkit-outline"
                  title={t("health.admin.cares.empty.title")}
                  message={
                    caresAppliedSearch
                      ? t("health.admin.cares.empty.search")
                      : t("health.admin.cares.empty.default")
                  }
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    goToStudent(item.student.id, {
                      firstName: item.student.firstName,
                      lastName: item.student.lastName,
                      className: item.student.class?.name ?? null,
                    })
                  }
                  testID={`admin-cares-item-${item.id}`}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>
                      {item.student.lastName} {item.student.firstName}
                    </Text>
                    <AlertBadge level={item.alertLevel} t={t} />
                  </View>
                  <Text style={styles.cardMeta}>
                    {reportTypeLabel(t, item.type)}
                    {item.student.class ? ` · ${item.student.class.name}` : ""}
                  </Text>
                  <Text style={styles.cardBody} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardMeta}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                    <Text
                      style={
                        item.acknowledgedAt
                          ? styles.acknowledgedLabel
                          : styles.pendingLabel
                      }
                    >
                      {item.acknowledgedAt
                        ? t("health.admin.cares.card.acknowledged")
                        : t("health.admin.cares.card.pending")}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.searchRow} testID="admin-eleves-search-row">
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={studentsSearchInput}
                onChangeText={setStudentsSearchInput}
                placeholder={t("health.admin.eleves.search.placeholder")}
                placeholderTextColor={colors.textSecondary}
                returnKeyType="search"
                autoCapitalize="none"
                accessibilityLabel={t(
                  "health.admin.eleves.search.accessibilityLabel",
                )}
                testID="admin-eleves-search-input"
              />
              {studentsSearchInput.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setStudentsSearchInput("")}
                  testID="admin-eleves-search-clear"
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={[
                styles.filterToggle,
                hasActiveSchoolHealthStudentsFilters(studentsAppliedFilters) &&
                  styles.filterToggleActive,
              ]}
              onPress={() =>
                studentsFiltersOpen
                  ? closeStudentsFilters()
                  : openStudentsFilters()
              }
              testID="admin-eleves-filter-toggle"
              accessibilityLabel={t(
                "health.admin.eleves.filters.toggleAccessibilityLabel",
              )}
            >
              <Ionicons
                name={
                  hasActiveSchoolHealthStudentsFilters(studentsAppliedFilters)
                    ? "filter"
                    : "filter-outline"
                }
                size={18}
                color={
                  hasActiveSchoolHealthStudentsFilters(studentsAppliedFilters)
                    ? colors.white
                    : colors.accentTeal
                }
              />
            </TouchableOpacity>
          </View>

          {studentsFiltersOpen ? (
            <View style={styles.filterPanel} testID="admin-eleves-filter-panel">
              <View style={styles.filterScrollWrapper}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>
                    {t("health.admin.eleves.filters.classLabel")}
                  </Text>
                  <InlineSelectDropDown
                    options={classOptions}
                    value={studentsDraftFilters.classId ?? ALL_CLASSES}
                    onChange={(value) =>
                      setStudentsDraftFilters({
                        classId: value === ALL_CLASSES ? null : value,
                      })
                    }
                    testID="admin-eleves-filter-class"
                  />
                </View>
              </View>
              <View style={styles.filterActionsRow}>
                <TouchableOpacity
                  style={styles.filterActionReset}
                  onPress={resetStudentsFilters}
                  testID="admin-eleves-filter-reset"
                >
                  <Text style={styles.filterActionResetLabel}>
                    {t("health.admin.eleves.filters.reset")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterActionClose}
                  onPress={closeStudentsFilters}
                  testID="admin-eleves-filter-close"
                >
                  <Text style={styles.filterActionCloseLabel}>
                    {t("health.admin.eleves.filters.close")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterActionApply}
                  onPress={applyStudentsFilters}
                  testID="admin-eleves-filter-apply"
                >
                  <Ionicons name="checkmark" size={15} color={colors.white} />
                  <Text style={styles.filterActionApplyLabel}>
                    {t("health.admin.eleves.filters.apply")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : isStudentsLoading ? (
            <LoadingBlock label={t("health.parent.loading")} />
          ) : studentsError ? (
            <ErrorBanner message={studentsError} testID="admin-eleves-error" />
          ) : (
            <InfiniteScrollList
              data={students}
              keyExtractor={(item) => item.id}
              onLoadMore={handleLoadMoreStudents}
              hasMore={
                !!studentsMeta &&
                studentsMeta.page <
                  Math.max(
                    1,
                    Math.ceil(studentsMeta.total / studentsMeta.limit),
                  )
              }
              isLoadingMore={isStudentsLoadingMore}
              contentContainerStyle={styles.listContent}
              testID="admin-eleves-list"
              emptyComponent={
                <EmptyState
                  icon="people-outline"
                  title={t("health.admin.eleves.empty.title")}
                  message={
                    studentsAppliedSearch
                      ? t("health.admin.eleves.empty.search")
                      : t("health.admin.eleves.empty.default")
                  }
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.studentRow}
                  onPress={() =>
                    goToStudent(item.id, {
                      firstName: item.firstName,
                      lastName: item.lastName,
                      className: item.class?.name ?? null,
                      age: item.age,
                    })
                  }
                  testID={`admin-eleves-item-${item.id}`}
                >
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {item.firstName[0]}
                      {item.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {item.lastName} {item.firstName}
                    </Text>
                    <Text style={styles.studentMeta}>
                      {item.class?.name ??
                        t("health.admin.eleves.card.noClass")}
                      {item.age != null
                        ? ` · ${item.age} ${t("health.admin.eleves.card.ageUnit")}`
                        : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

function SyntheseTab(props: {
  t: TranslateFn;
  stats: SchoolHealthStats | null;
  isLoading: boolean;
  error: string | null;
  classOptions: Array<{ value: string; label: string }>;
  classId: string;
  onChangeClassId: (value: string) => void;
}) {
  const { t, stats, isLoading, error, classOptions, classId, onChangeClassId } =
    props;

  return (
    <View style={styles.body} testID="admin-synthese-tab">
      <View style={styles.scopeRow}>
        <Text style={styles.filterGroupLabel}>
          {t("health.admin.scope.classLabel")}
        </Text>
        <InlineSelectDropDown
          options={classOptions}
          value={classId}
          onChange={onChangeClassId}
          testID="admin-synthese-scope"
        />
      </View>

      {isLoading ? (
        <LoadingBlock label={t("health.admin.stats.loading")} />
      ) : error ? (
        <ErrorBanner message={error} testID="admin-synthese-error" />
      ) : stats ? (
        <View style={styles.statsContent} testID="admin-synthese-content">
          <View style={styles.kpiGrid}>
            <KpiTile
              label={t("health.admin.stats.activeConditions")}
              value={stats.activeConditionsTotal}
              testID="admin-kpi-active-conditions"
            />
            <KpiTile
              label={t("health.admin.stats.studentsWithConditions")}
              value={stats.studentsWithActiveConditions}
              testID="admin-kpi-students-with-conditions"
            />
            <KpiTile
              label={t("health.admin.stats.careEvents7d")}
              value={stats.careEventsLast7Days}
              testID="admin-kpi-care-7d"
            />
            <KpiTile
              label={t("health.admin.stats.careEvents30d")}
              value={stats.careEventsLast30Days}
              testID="admin-kpi-care-30d"
            />
            <KpiTile
              label={t("health.admin.stats.reportsPending")}
              value={stats.reportsPendingAcknowledgement}
              testID="admin-kpi-reports-pending"
            />
          </View>

          <Text style={styles.sectionTitle}>
            {t("health.admin.stats.byAlertLevel")}
          </Text>
          <View style={styles.alertLevelRow}>
            {HEALTH_ALERT_LEVELS.map((level) => (
              <View
                key={level}
                style={[
                  styles.alertLevelTile,
                  { backgroundColor: ALERT_LEVEL_COLORS[level].bg },
                ]}
                testID={`admin-synthese-alert-${level}`}
              >
                <Text
                  style={[
                    styles.alertLevelValue,
                    { color: ALERT_LEVEL_COLORS[level].text },
                  ]}
                >
                  {stats.activeConditionsByAlertLevel[level]}
                </Text>
                <Text
                  style={[
                    styles.alertLevelLabel,
                    { color: ALERT_LEVEL_COLORS[level].text },
                  ]}
                >
                  {alertLevelLabel(t, level)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function KpiTile({
  label,
  value,
  testID,
}: {
  label: string;
  value: number;
  testID: string;
}) {
  return (
    <View style={styles.kpiTile} testID={testID}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function CaresFiltersPanel(props: {
  t: TranslateFn;
  draft: SchoolHealthReportsFilters;
  onChange: (filters: SchoolHealthReportsFilters) => void;
  onReset: () => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const { t, draft, onChange, onReset, onClose, onApply } = props;
  const ALL_LEVELS = "__ALL__";
  const ALL_TYPES = "__ALL__";

  const statusOptions: Array<{
    value: "all" | "acknowledged" | "pending";
    label: string;
  }> = [
    { value: "all", label: t("health.admin.cares.filters.statusAll") },
    {
      value: "acknowledged",
      label: t("health.admin.cares.filters.statusAcknowledged"),
    },
    { value: "pending", label: t("health.admin.cares.filters.statusPending") },
  ];
  const currentStatus =
    draft.acknowledged == null
      ? "all"
      : draft.acknowledged
        ? "acknowledged"
        : "pending";

  return (
    <View style={styles.filterPanel} testID="admin-cares-filter-panel">
      <View style={styles.filterScrollWrapper}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>
            {t("health.admin.cares.filters.alertLevelLabel")}
          </Text>
          <InlineSelectDropDown
            options={[
              {
                value: ALL_LEVELS,
                label: t("health.admin.cares.filters.allLevels"),
              },
              ...HEALTH_ALERT_LEVELS.map((level) => ({
                value: level,
                label: alertLevelLabel(t, level),
              })),
            ]}
            value={draft.alertLevel ?? ALL_LEVELS}
            onChange={(value) =>
              onChange({
                ...draft,
                alertLevel:
                  value === ALL_LEVELS ? null : (value as HealthAlertLevel),
              })
            }
            testID="admin-cares-filter-alertLevel"
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>
            {t("health.admin.cares.filters.reportTypeLabel")}
          </Text>
          <InlineSelectDropDown
            options={[
              {
                value: ALL_TYPES,
                label: t("health.admin.cares.filters.allReportTypes"),
              },
              ...HEALTH_REPORT_TYPES.map((type) => ({
                value: type,
                label: reportTypeLabel(t, type),
              })),
            ]}
            value={draft.reportType ?? ALL_TYPES}
            onChange={(value) =>
              onChange({
                ...draft,
                reportType:
                  value === ALL_TYPES ? null : (value as HealthReportType),
              })
            }
            testID="admin-cares-filter-reportType"
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>
            {t("health.admin.cares.filters.statusLabel")}
          </Text>
          <View style={styles.filterChipsRow}>
            {statusOptions.map((option) => {
              const active = option.value === currentStatus;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() =>
                    onChange({
                      ...draft,
                      acknowledged:
                        option.value === "all"
                          ? null
                          : option.value === "acknowledged",
                    })
                  }
                  testID={`admin-cares-filter-status-${option.value}`}
                >
                  <Text
                    style={[
                      styles.filterChipLabel,
                      active && styles.filterChipLabelActive,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.filterActionsRow}>
        <TouchableOpacity
          style={styles.filterActionReset}
          onPress={onReset}
          testID="admin-cares-filter-reset"
        >
          <Text style={styles.filterActionResetLabel}>
            {t("health.admin.cares.filters.reset")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterActionClose}
          onPress={onClose}
          testID="admin-cares-filter-close"
        >
          <Text style={styles.filterActionCloseLabel}>
            {t("health.admin.cares.filters.close")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterActionApply}
          onPress={onApply}
          testID="admin-cares-filter-apply"
        >
          <Ionicons name="checkmark" size={15} color={colors.white} />
          <Text style={styles.filterActionApplyLabel}>
            {t("health.admin.cares.filters.apply")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AlertBadge({ level, t }: { level: HealthAlertLevel; t: TranslateFn }) {
  const palette = ALERT_LEVEL_COLORS[level];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeLabel, { color: palette.text }]}>
        {alertLevelLabel(t, level)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 96, gap: 8 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterToggleActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}33`,
    backgroundColor: colors.surface,
    gap: 14,
  },
  filterScrollWrapper: { flex: 1, gap: 14 },
  filterGroup: { gap: 8 },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    flexBasis: "31%",
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  filterChipLabelActive: { color: colors.white },
  filterActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterActionReset: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionResetLabel: {
    color: colors.warmAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionClose: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionCloseLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionApply: {
    flex: 1.3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 11,
  },
  filterActionApplyLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  cardMeta: { fontSize: 11, color: colors.textSecondary },
  cardBody: { fontSize: 13, color: colors.textSecondary },
  pendingLabel: { fontSize: 11, fontWeight: "700", color: colors.warmAccent },
  acknowledgedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeLabel: { fontSize: 11, fontWeight: "700" },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  studentInfo: { flex: 1, gap: 2 },
  studentName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  studentMeta: { fontSize: 12, color: colors.textSecondary },

  scopeRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  statsContent: { padding: 16, gap: 16 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiTile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 4,
  },
  kpiValue: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  kpiLabel: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  alertLevelRow: { flexDirection: "row", gap: 10 },
  alertLevelTile: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  alertLevelValue: { fontSize: 20, fontWeight: "800" },
  alertLevelLabel: { fontSize: 11, fontWeight: "700" },
});
