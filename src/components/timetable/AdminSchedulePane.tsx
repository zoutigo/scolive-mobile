import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { usersApi } from "../../api/users.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { timetableApi } from "../../api/timetable.api";
import type { SchoolMember } from "../../types/users.types";
import type { CurriculumAcademicLevel } from "../../types/curriculums.types";
import type {
  TimetableClassOption,
  TimetableOccurrence,
  TimetableSubjectStyle,
} from "../../types/timetable.types";
import {
  buildTimetableRangeForView,
  parseOccurrenceDate,
  stripTime,
  toWeekdayMondayFirst,
  TimetableCalendarViewMode,
} from "../../utils/timetable";
import type { WeekSelection } from "./ChildTimetableScreen";
import { EmptyState } from "./TimetableCommon";
import { TimetablePane, type OccurrenceContext } from "./TeacherAgendaScreen";
import {
  SearchableDropdown,
  type SearchableDropdownItem,
} from "../pickers/SearchableDropdown";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";

const P = "teacher-agenda-admin";
const SEARCH_DEBOUNCE_MS = 300;

type ScheduleMode = "USER" | "CLASS";

type ScheduleFilters = {
  mode: ScheduleMode;
  member: SchoolMember | null;
  levelId: string | null;
  classOption: TimetableClassOption | null;
};

const NO_FILTERS: ScheduleFilters = {
  mode: "USER",
  member: null,
  levelId: null,
  classOption: null,
};

function hasActiveFilters(filters: ScheduleFilters) {
  return filters.member != null || filters.classOption != null;
}

function fullMemberName(member: SchoolMember): string {
  return `${member.lastName} ${member.firstName}`.trim();
}

function memberHasRole(member: SchoolMember, role: "TEACHER" | "STUDENT") {
  return (member.roles as readonly string[]).includes(role);
}

function memberRoleLabel(member: SchoolMember, t: TranslateFn): string {
  if (memberHasRole(member, "TEACHER")) {
    return t("timetable.teacherAgenda.admin.roleTeacher");
  }
  if (memberHasRole(member, "STUDENT")) {
    return t("timetable.teacherAgenda.admin.roleStudent");
  }
  return t("timetable.teacherAgenda.admin.roleStaff");
}

type PageMeta = { page: number; limit: number; total: number };

function computeHasMore(meta: PageMeta | null): boolean {
  if (!meta) return false;
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  return meta.page < totalPages;
}

type AgendaData = {
  occurrences: TimetableOccurrence[];
  subjectStyles: TimetableSubjectStyle[];
  slots: { weekday: number }[];
  contextByOccId: Map<string, OccurrenceContext>;
};

type TargetKind = "TEACHER" | "STUDENT" | "CLASS" | "NONE";

export function AdminSchedulePane({ insetBottom }: { insetBottom: number }) {
  const { schoolSlug } = useAuthStore();
  const { t, locale } = useTranslation();

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ScheduleFilters>(NO_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ScheduleFilters>(NO_FILTERS);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  // ── Users picker (recherche paginée sur /schools/:slug/users) ─────────────

  const [memberItems, setMemberItems] = useState<SchoolMember[]>([]);
  const [memberMeta, setMemberMeta] = useState<PageMeta | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMoreMembers, setIsLoadingMoreMembers] = useState(false);

  const loadMembers = useCallback(
    async (page: number, mode: "reset" | "append") => {
      if (!schoolSlug) return;
      if (mode === "reset") setIsLoadingMembers(true);
      else setIsLoadingMoreMembers(true);
      try {
        const res = await usersApi.list(schoolSlug, {
          search: appliedSearch,
          page,
        });
        setMemberItems((current) =>
          mode === "append" ? [...current, ...res.data] : res.data,
        );
        setMemberMeta({ page: res.page, limit: res.limit, total: res.total });
      } catch {
        // conserve les éléments déjà chargés
      } finally {
        if (mode === "reset") setIsLoadingMembers(false);
        else setIsLoadingMoreMembers(false);
      }
    },
    [schoolSlug, appliedSearch],
  );

  useEffect(() => {
    if (!filtersOpen || draftFilters.mode !== "USER") return;
    void loadMembers(1, "reset");
  }, [filtersOpen, draftFilters.mode, appliedSearch]);

  const handleMembersLoadMore = useCallback(() => {
    if (!memberMeta || isLoadingMoreMembers || !computeHasMore(memberMeta))
      return;
    void loadMembers(memberMeta.page + 1, "append");
  }, [memberMeta, isLoadingMoreMembers, loadMembers]);

  // ── Niveaux (liste courte, chargée une fois) ──────────────────────────────

  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);

  useEffect(() => {
    if (!schoolSlug) return;
    curriculumsApi
      .listAcademicLevels(schoolSlug)
      .then(setLevels)
      .catch(() => {});
  }, [schoolSlug]);

  // ── Classes picker (recherche paginée, filtrée par niveau) ────────────────

  const [classItems, setClassItems] = useState<TimetableClassOption[]>([]);
  const [classMeta, setClassMeta] = useState<PageMeta | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingMoreClasses, setIsLoadingMoreClasses] = useState(false);

  const loadClasses = useCallback(
    async (page: number, mode: "reset" | "append", levelId: string | null) => {
      if (!schoolSlug) return;
      if (mode === "reset") setIsLoadingClasses(true);
      else setIsLoadingMoreClasses(true);
      try {
        const res = await timetableApi.getAdminClassList(schoolSlug, {
          academicLevelId: levelId ?? undefined,
          search: appliedSearch,
          page,
        });
        setClassItems((current) =>
          mode === "append" ? [...current, ...res.data] : res.data,
        );
        setClassMeta({ page: res.page, limit: res.limit, total: res.total });
      } catch {
        // conserve les éléments déjà chargés
      } finally {
        if (mode === "reset") setIsLoadingClasses(false);
        else setIsLoadingMoreClasses(false);
      }
    },
    [schoolSlug, appliedSearch],
  );

  useEffect(() => {
    if (!filtersOpen || draftFilters.mode !== "CLASS") return;
    void loadClasses(1, "reset", draftFilters.levelId);
  }, [filtersOpen, draftFilters.mode, draftFilters.levelId, appliedSearch]);

  const handleClassesLoadMore = useCallback(() => {
    if (!classMeta || isLoadingMoreClasses || !computeHasMore(classMeta))
      return;
    void loadClasses(classMeta.page + 1, "append", draftFilters.levelId);
  }, [classMeta, isLoadingMoreClasses, loadClasses, draftFilters.levelId]);

  // ── Panneau de filtres : open / close / apply / reset ─────────────────────

  function openFilters() {
    setDraftFilters(appliedFilters);
    setSearchInput(appliedSearch);
    setFiltersOpen(true);
  }
  function closeFilters() {
    setDraftFilters(appliedFilters);
    setFiltersOpen(false);
  }
  function toggleFilters() {
    if (filtersOpen) closeFilters();
    else openFilters();
  }
  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  }
  function resetFilters() {
    setDraftFilters(NO_FILTERS);
    setAppliedFilters(NO_FILTERS);
    setSearchInput("");
  }
  function switchMode(mode: ScheduleMode) {
    setDraftFilters({ ...NO_FILTERS, mode });
    setSearchInput("");
  }

  // ── Cible résolue et chargement de l'agenda ───────────────────────────────

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
    [viewMode, cursorDate],
  );

  const [agenda, setAgenda] = useState<AgendaData | null>(null);
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const loadAgendaKeyRef = useRef(0);

  const targetKind: TargetKind = useMemo(() => {
    if (appliedFilters.mode === "CLASS") {
      return appliedFilters.classOption ? "CLASS" : "NONE";
    }
    const member = appliedFilters.member;
    if (!member) return "NONE";
    if (memberHasRole(member, "TEACHER")) return "TEACHER";
    if (memberHasRole(member, "STUDENT")) return "STUDENT";
    return "NONE";
  }, [appliedFilters]);

  const hasSelection =
    appliedFilters.member != null || appliedFilters.classOption != null;

  const loadAgenda = useCallback(async () => {
    if (!schoolSlug) return;
    const key = ++loadAgendaKeyRef.current;
    setIsLoadingAgenda(true);
    setAgendaError(null);
    try {
      if (targetKind === "TEACHER" && appliedFilters.member) {
        const payload = await timetableApi.getTeacherMyTimetable(schoolSlug, {
          teacherUserId: appliedFilters.member.id,
          fromDate: range.fromDate,
          toDate: range.toDate,
        });
        if (key !== loadAgendaKeyRef.current) return;
        const contextByOccId = new Map<string, OccurrenceContext>();
        payload.occurrenceContexts.forEach((ctx) => {
          contextByOccId.set(ctx.occurrenceId, {
            classId: ctx.classId,
            className: ctx.className,
            schoolYearId: ctx.schoolYearId,
          });
        });
        setAgenda({
          occurrences: payload.occurrences,
          subjectStyles: payload.subjectStyles,
          slots: payload.slots,
          contextByOccId,
        });
      } else if (targetKind === "STUDENT" && appliedFilters.member) {
        const studentId =
          appliedFilters.member.studentId ?? appliedFilters.member.id;
        const payload = await timetableApi.getMyTimetable(schoolSlug, {
          studentId,
          fromDate: range.fromDate,
          toDate: range.toDate,
        });
        if (key !== loadAgendaKeyRef.current) return;
        const contextByOccId = new Map<string, OccurrenceContext>();
        payload.occurrences.forEach((occ) => {
          contextByOccId.set(occ.id, {
            classId: payload.class.id,
            className: payload.class.name,
            schoolYearId: payload.class.schoolYearId,
          });
        });
        setAgenda({
          occurrences: payload.occurrences,
          subjectStyles: payload.subjectStyles,
          slots: payload.slots,
          contextByOccId,
        });
      } else if (targetKind === "CLASS" && appliedFilters.classOption) {
        const classOption = appliedFilters.classOption;
        const payload = await timetableApi.getClassTimetable(
          schoolSlug,
          classOption.classId,
          { fromDate: range.fromDate, toDate: range.toDate },
        );
        if (key !== loadAgendaKeyRef.current) return;
        const classCtx: OccurrenceContext = {
          classId: classOption.classId,
          className: classOption.className,
          schoolYearId: classOption.schoolYearId,
        };
        const contextByOccId = new Map<string, OccurrenceContext>();
        payload.occurrences.forEach((occ) => {
          contextByOccId.set(occ.id, classCtx);
        });
        setAgenda({
          occurrences: payload.occurrences,
          subjectStyles: payload.subjectStyles,
          slots: payload.slots,
          contextByOccId,
        });
      } else {
        setAgenda(null);
      }
    } catch {
      if (key !== loadAgendaKeyRef.current) return;
      setAgendaError(t("timetable.teacherAgenda.errors.loadTeacherAgenda"));
      setIsLoadingAgenda(false);
      return;
    }
    if (key !== loadAgendaKeyRef.current) return;
    setIsLoadingAgenda(false);
    // `t` dérive de `locale`, déjà listé ci-dessous — l'ajouter recréerait
    // `loadAgenda` à chaque render (nouvelle fonction `t`) et boucle en effet.
  }, [
    schoolSlug,
    targetKind,
    appliedFilters,
    range.fromDate,
    range.toDate,
    locale,
  ]);

  useEffect(() => {
    setViewMode("day");
    setCursorDate(today);
  }, [appliedFilters.member?.id, appliedFilters.classOption?.classId]);

  useEffect(() => {
    if (targetKind === "NONE") {
      setAgenda(null);
      return;
    }
    void loadAgenda().catch(() => {});
  }, [loadAgenda, targetKind]);

  const occurrences = useMemo(
    () =>
      (agenda?.occurrences ?? [])
        .filter((o) => (o.status ?? "PLANNED") === "PLANNED")
        .sort((a, b) =>
          `${a.occurrenceDate}-${a.startMinute}`.localeCompare(
            `${b.occurrenceDate}-${b.startMinute}`,
          ),
        ),
    [agenda?.occurrences],
  );

  const subjectColorById = useMemo(
    () =>
      Object.fromEntries(
        (agenda?.subjectStyles ?? []).map((e) => [e.subjectId, e.colorHex]),
      ),
    [agenda?.subjectStyles],
  );

  const { showSaturday, showSunday } = useMemo(() => {
    const slots = agenda?.slots ?? [];
    const occs = agenda?.occurrences ?? [];
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
  }, [agenda?.slots, agenda?.occurrences]);

  const memberDropdownItems: SearchableDropdownItem[] = memberItems.map(
    (m) => ({
      id: m.id,
      label: fullMemberName(m),
      sublabel: memberRoleLabel(m, t),
    }),
  );

  const classDropdownItems: SearchableDropdownItem[] = classItems.map((c) => ({
    id: c.classId,
    label: c.className,
    sublabel: c.academicLevelName ?? undefined,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.searchRow} testID={`${P}-search-row`}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={
              appliedFilters.mode === "CLASS"
                ? t("timetable.teacherAgenda.admin.searchClassPlaceholder")
                : t("timetable.teacherAgenda.searchTeacherPlaceholder")
            }
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            returnKeyType="search"
            testID={`${P}-search-input`}
          />
          {searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchInput("")}
              testID={`${P}-search-clear`}
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
            hasActiveFilters(appliedFilters) && styles.filterToggleActive,
          ]}
          onPress={toggleFilters}
          testID={`${P}-filter-toggle`}
        >
          <Ionicons
            name={
              hasActiveFilters(appliedFilters) ? "filter" : "filter-outline"
            }
            size={18}
            color={
              hasActiveFilters(appliedFilters)
                ? colors.white
                : colors.accentTeal
            }
          />
        </TouchableOpacity>
      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel} testID={`${P}-filter-panel`}>
          <View style={styles.filterScrollWrapper}>
            <ScrollView
              style={styles.filterScrollArea}
              contentContainerStyle={styles.filterScrollContent}
              showsVerticalScrollIndicator
              testID={`${P}-filter-scroll`}
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("timetable.teacherAgenda.admin.modeLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      draftFilters.mode === "USER" && styles.filterChipActive,
                    ]}
                    onPress={() => switchMode("USER")}
                    testID={`${P}-mode-user`}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftFilters.mode === "USER" &&
                          styles.filterChipLabelActive,
                      ]}
                    >
                      {t("timetable.teacherAgenda.tabs.users")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      draftFilters.mode === "CLASS" && styles.filterChipActive,
                    ]}
                    onPress={() => switchMode("CLASS")}
                    testID={`${P}-mode-class`}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftFilters.mode === "CLASS" &&
                          styles.filterChipLabelActive,
                      ]}
                    >
                      {t("timetable.teacherAgenda.tabs.classes")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {draftFilters.mode === "USER" ? (
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>
                    {t("timetable.teacherAgenda.admin.userLabel")}
                  </Text>
                  <SearchableDropdown
                    value={
                      draftFilters.member
                        ? {
                            id: draftFilters.member.id,
                            label: fullMemberName(draftFilters.member),
                            sublabel: memberRoleLabel(draftFilters.member, t),
                          }
                        : null
                    }
                    items={memberDropdownItems}
                    isLoading={isLoadingMembers}
                    isLoadingMore={isLoadingMoreMembers}
                    hasMore={computeHasMore(memberMeta)}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    onLoadMore={handleMembersLoadMore}
                    onSelect={(item) => {
                      const found =
                        memberItems.find((m) => m.id === item.id) ?? null;
                      setDraftFilters((current) => ({
                        ...current,
                        member: found,
                      }));
                    }}
                    placeholder={t(
                      "timetable.teacherAgenda.admin.userPlaceholder",
                    )}
                    searchPlaceholder={t(
                      "timetable.teacherAgenda.searchTeacherPlaceholder",
                    )}
                    emptyLabel={t("timetable.teacherAgenda.noResultTitle")}
                    title={t("timetable.teacherAgenda.admin.userLabel")}
                    testIDPrefix={`${P}-user-picker`}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterGroupLabel}>
                      {t("timetable.teacherAgenda.admin.levelLabel")}
                    </Text>
                    <View style={styles.filterChipsRow}>
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          !draftFilters.levelId && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          setDraftFilters((c) => ({
                            ...c,
                            levelId: null,
                            classOption: null,
                          }))
                        }
                        testID={`${P}-level-all`}
                      >
                        <Text
                          style={[
                            styles.filterChipLabel,
                            !draftFilters.levelId &&
                              styles.filterChipLabelActive,
                          ]}
                        >
                          {t("timetable.teacherAgenda.admin.allLevels")}
                        </Text>
                      </TouchableOpacity>
                      {levels.map((level) => {
                        const active = draftFilters.levelId === level.id;
                        return (
                          <TouchableOpacity
                            key={level.id}
                            style={[
                              styles.filterChip,
                              active && styles.filterChipActive,
                            ]}
                            onPress={() =>
                              setDraftFilters((c) => ({
                                ...c,
                                levelId: level.id,
                                classOption: null,
                              }))
                            }
                            testID={`${P}-level-${level.id}`}
                          >
                            <Text
                              style={[
                                styles.filterChipLabel,
                                active && styles.filterChipLabelActive,
                              ]}
                            >
                              {level.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.filterGroup}>
                    <Text style={styles.filterGroupLabel}>
                      {t("timetable.teacherAgenda.admin.classLabel")}
                    </Text>
                    <SearchableDropdown
                      value={
                        draftFilters.classOption
                          ? {
                              id: draftFilters.classOption.classId,
                              label: draftFilters.classOption.className,
                            }
                          : null
                      }
                      items={classDropdownItems}
                      isLoading={isLoadingClasses}
                      isLoadingMore={isLoadingMoreClasses}
                      hasMore={computeHasMore(classMeta)}
                      searchValue={searchInput}
                      onSearchChange={setSearchInput}
                      onLoadMore={handleClassesLoadMore}
                      onSelect={(item) => {
                        const found =
                          classItems.find((c) => c.classId === item.id) ?? null;
                        setDraftFilters((current) => ({
                          ...current,
                          classOption: found,
                        }));
                      }}
                      placeholder={t(
                        "timetable.teacherAgenda.admin.classPlaceholder",
                      )}
                      searchPlaceholder={t(
                        "timetable.teacherAgenda.admin.searchClassPlaceholder",
                      )}
                      emptyLabel={t("timetable.teacherAgenda.noClassTitle")}
                      title={t("timetable.teacherAgenda.admin.classLabel")}
                      testIDPrefix={`${P}-class-picker`}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={resetFilters}
              testID={`${P}-filter-reset`}
            >
              <Text style={styles.filterActionResetLabel}>
                {t("timetable.teacherAgenda.admin.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID={`${P}-filter-close`}
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("timetable.teacherAgenda.admin.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={applyFilters}
              testID={`${P}-filter-apply`}
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("timetable.teacherAgenda.admin.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : targetKind === "NONE" ? (
        <EmptyState
          icon="options-outline"
          title={
            hasSelection
              ? t("timetable.teacherAgenda.admin.noAgendaTitle")
              : t("timetable.teacherAgenda.admin.emptySelectionTitle")
          }
          message={
            hasSelection
              ? t("timetable.teacherAgenda.admin.noAgendaMessage")
              : t("timetable.teacherAgenda.admin.emptySelectionMessage")
          }
        />
      ) : (
        <View style={styles.classPane}>
          <TimetablePane
            testIDPrefix={`${P}-agenda`}
            isLoading={isLoadingAgenda}
            hasData={agenda !== null}
            errorMessage={agendaError}
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
              setAgenda(null);
              void loadAgenda().catch(() => {});
            }}
            emptyTitle={t("timetable.common.noCourseTitle")}
            emptyMessage={
              targetKind === "TEACHER"
                ? t("timetable.teacherAgenda.emptyMessageTeacher")
                : targetKind === "STUDENT"
                  ? t("timetable.teacherAgenda.admin.emptyMessageStudent")
                  : t("timetable.teacherAgenda.emptyMessageClass")
            }
            teacherUserId={
              targetKind === "TEACHER" ? appliedFilters.member?.id : undefined
            }
            isAdminMode
            getOccurrenceContext={(occId) => agenda?.contextByOccId.get(occId)}
            schoolSlug={schoolSlug ?? ""}
            canCreate={targetKind === "CLASS" || targetKind === "TEACHER"}
            prefilledClassId={
              targetKind === "CLASS"
                ? appliedFilters.classOption?.classId
                : undefined
            }
            prefilledTeacherId={
              targetKind === "TEACHER" ? appliedFilters.member?.id : undefined
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
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
  filterScrollWrapper: { flex: 1 },
  filterScrollArea: { flex: 1 },
  filterScrollContent: { gap: 14, paddingBottom: 12 },
  filterGroup: { gap: 8 },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipLabelActive: {
    color: colors.white,
  },
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
  classPane: { flex: 1 },
});
