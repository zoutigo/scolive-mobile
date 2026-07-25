import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
import { useTranslation } from "../../i18n/useTranslation";
import { useNotesStore } from "../../store/notes.store";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { PeriodHero } from "./PeriodHero";
import { SubjectReportCard } from "./SubjectReportCard";
import {
  StudentSelectField,
  type StudentSelectOption,
} from "../discipline/StudentSelectField";
import { formatScore, termLabel } from "../../utils/notes";
import type { StudentNotesTerm } from "../../types/notes.types";
import type { TeacherClassroomOption } from "../../types/teachers.types";

// Vue "Bulletins" du school admin : élève cherché sur toute l'école (comme
// l'onglet notes), avec la classe affichée en face du nom et des filtres
// niveau/classe en listes liées. Lecture seule : l'édition des appréciations
// reste réservée aux enseignants (référent/matière) depuis leur propre vue.

export type SchoolWideReportsStudent = {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  classId: string;
  academicLevelId?: string;
};

type Props = {
  students: SchoolWideReportsStudent[];
  classrooms: TeacherClassroomOption[];
  schoolSlug: string;
  bottomInset: number;
  isLoadingStudents?: boolean;
  onDetailChange?: (
    info: {
      studentName: string;
      className: string;
      term: StudentNotesTerm;
    } | null,
  ) => void;
};

export type SchoolPeriodReportsHandle = {
  /** Returns true if the tab consumed the back action (closed the bulletin detail). */
  goBackFromDetail: () => boolean;
};

type DetailTarget = { studentId: string; term: StudentNotesTerm };

const ALL_TERMS: StudentNotesTerm[] = ["TERM_1", "TERM_2", "TERM_3"];
const PAGE_SIZE = 20;

export const SchoolPeriodReportsTab = forwardRef<
  SchoolPeriodReportsHandle,
  Props
>(function SchoolPeriodReportsTab(
  {
    students,
    classrooms,
    schoolSlug,
    bottomInset,
    isLoadingStudents = false,
    onDetailChange,
  },
  ref,
) {
  const { t } = useTranslation();
  const { studentNotes, isLoadingStudentNotes, loadStudentNotes } =
    useNotesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [levelId, setLevelId] = useState("");
  const [classId, setClassId] = useState("");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(
    null,
  );
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const levelOptions = useMemo<StudentSelectOption[]>(() => {
    const seen = new Map<string, string>();
    classrooms.forEach((c) => {
      if (c.academicLevel && !seen.has(c.academicLevel.id)) {
        seen.set(c.academicLevel.id, c.academicLevel.label);
      }
    });
    return Array.from(seen.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [classrooms]);

  const classOptions = useMemo<StudentSelectOption[]>(() => {
    const filtered = levelId
      ? classrooms.filter((c) => c.academicLevel?.id === levelId)
      : classrooms;
    return filtered.map((c) => ({ value: c.id, label: c.name }));
  }, [classrooms, levelId]);

  const sortedStudents = useMemo(
    () =>
      [...students].sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      ),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedStudents.filter((s) => {
      if (levelId && s.academicLevelId !== levelId) return false;
      if (classId && s.classId !== classId) return false;
      if (q && !`${s.lastName} ${s.firstName}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [sortedStudents, searchQuery, levelId, classId]);

  const filteredStudentIdsKey = useMemo(
    () => filteredStudents.map((s) => s.id).join("|"),
    [filteredStudents],
  );

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, filteredStudents.length || PAGE_SIZE));
  }, [filteredStudentIdsKey, filteredStudents.length]);

  const visibleStudents = filteredStudents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredStudents.length;
  const hasActiveFilters = levelId !== "" || classId !== "";

  function handleLevelChange(value: string) {
    setLevelId(value);
    setClassId((current) => {
      const stillValid = classrooms.find((c) => c.id === current)?.academicLevel
        ?.id;
      return value && stillValid !== value ? "" : current;
    });
  }

  function resetFilters() {
    setLevelId("");
    setClassId("");
  }

  const loadFor = useCallback(
    async (studentId: string) => {
      if (!schoolSlug || !studentId) return;
      await loadStudentNotes(schoolSlug, studentId);
    },
    [schoolSlug, loadStudentNotes],
  );

  useEffect(() => {
    if (!expandedStudentId) return;
    void loadFor(expandedStudentId).catch(() => {});
  }, [expandedStudentId, loadFor]);

  function toggleStudent(studentId: string) {
    setExpandedStudentId((current) =>
      current === studentId ? null : studentId,
    );
  }

  const selectedStudent = useMemo(
    () => sortedStudents.find((s) => s.id === detail?.studentId) ?? null,
    [sortedStudents, detail],
  );

  function openBulletin(
    student: SchoolWideReportsStudent,
    term: StudentNotesTerm,
  ) {
    setDetail({ studentId: student.id, term });
    onDetailChange?.({
      studentName: `${student.lastName} ${student.firstName}`,
      className: student.className,
      term,
    });
  }

  function backToList() {
    setDetail(null);
    onDetailChange?.(null);
  }

  useImperativeHandle(
    ref,
    () => ({
      goBackFromDetail: () => {
        if (!detail) return false;
        backToList();
        return true;
      },
    }),
    [detail],
  );

  if (isLoadingStudents && students.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="school-reports-tab">
        <LoadingBlock label={t("notes.manager.loading.notebook")} />
      </View>
    );
  }

  // ── Vue détail : bulletin complet en lecture seule ──────────────────
  if (detail && selectedStudent) {
    const snapshots = studentNotes[detail.studentId] ?? [];
    const snapshot =
      snapshots.find((entry) => entry.term === detail.term) ?? null;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        testID="school-reports-detail"
      >
        {isLoadingStudentNotes && !snapshot ? (
          <LoadingBlock label={t("notes.panel.loading")} />
        ) : snapshot ? (
          <>
            <View style={styles.heroWrapper}>
              <PeriodHero
                snapshot={snapshot}
                compactStats
                showPublished={false}
                inlineHeader
              />
            </View>

            <View style={styles.subjectsBlock} testID="school-reports-subjects">
              {snapshot.subjects.map((subject) => {
                const sequenceRows = snapshot.sequences
                  .map((seq) => ({
                    sequence: seq.sequence,
                    label: seq.sequenceLabel,
                    data: seq.subjects.find((s) => s.id === subject.id),
                  }))
                  .filter((row) => row.data);

                return (
                  <SubjectReportCard
                    key={subject.id}
                    subject={subject}
                    sequenceRows={sequenceRows.map((row) => ({
                      sequence: row.sequence,
                      label: row.label,
                      studentAverage: row.data?.studentAverage ?? null,
                    }))}
                    editable={false}
                    appreciationValue={subject.appreciation ?? ""}
                    t={t}
                    testID={`school-reports-subject-card-${subject.id}`}
                    testIDPrefix={`school-reports-subject-${subject.id}`}
                  />
                );
              })}
            </View>

            {snapshot.generatedAtLabel ? (
              <View
                style={styles.publishedFooter}
                testID="school-reports-published"
              >
                <Text style={styles.publishedFooterLabel}>
                  {t("notes.period.published")}
                </Text>
                <Text style={styles.publishedFooterValue}>
                  {snapshot.generatedAtLabel}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon="document-text-outline"
            title={t("notes.reports.empty.title")}
            message={t("notes.reports.empty.message")}
          />
        )}
      </ScrollView>
    );
  }

  // ── Vue liste : recherche + filtres niveau/classe + accordéon ───────
  return (
    <View style={styles.container} testID="school-reports-tab">
      <View style={styles.searchRow} testID="school-reports-search-bar">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("notes.reports.search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={t("notes.reports.search.accessibilityLabel")}
            testID="school-reports-search-input"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              testID="school-reports-search-clear"
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
            hasActiveFilters && styles.filterToggleActive,
          ]}
          onPress={() => setFiltersOpen((v) => !v)}
          testID="school-reports-filter-toggle"
          accessibilityLabel={t(
            "notes.reports.filter.toggleAccessibilityLabel",
          )}
        >
          <Ionicons
            name={hasActiveFilters ? "filter" : "filter-outline"}
            size={18}
            color={hasActiveFilters ? colors.white : colors.accentTeal}
          />
        </TouchableOpacity>
      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel} testID="school-reports-filter-panel">
          <View style={styles.filterGroup}>
            <StudentSelectField
              label={t("notes.admin.filters.level")}
              value={levelId}
              options={levelOptions}
              onChange={handleLevelChange}
              allowEmpty
              emptyOptionLabel={t("notes.admin.filters.allLevels")}
              testIDPrefix="school-reports-filter-level"
            />
          </View>
          <View style={styles.filterGroup}>
            <StudentSelectField
              label={t("notes.admin.filters.class")}
              value={classId}
              options={classOptions}
              onChange={setClassId}
              allowEmpty
              emptyOptionLabel={t("notes.admin.filters.allClasses")}
              placeholder={t("notes.admin.filters.classPlaceholder")}
              testIDPrefix="school-reports-filter-class"
            />
          </View>
          {hasActiveFilters ? (
            <TouchableOpacity
              style={styles.filterResetBtn}
              onPress={resetFilters}
              testID="school-reports-filter-reset"
            >
              <Text style={styles.filterResetText}>
                {t("notes.manager.filters.reset")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <InfiniteScrollList
        data={visibleStudents}
        keyExtractor={(item) => item.id}
        renderItem={({ item: student }) => {
          const expanded = expandedStudentId === student.id;
          const snapshots = studentNotes[student.id] ?? [];
          return (
            <View style={styles.studentBlock}>
              <TouchableOpacity
                style={styles.studentRow}
                onPress={() => toggleStudent(student.id)}
                testID={`school-reports-row-${student.id}`}
              >
                <View style={styles.studentRowText}>
                  <Text style={styles.studentRowName}>
                    {student.lastName} {student.firstName}
                  </Text>
                  <Text
                    style={styles.studentRowClass}
                    testID={`school-reports-row-class-${student.id}`}
                  >
                    {student.className}
                  </Text>
                </View>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {expanded ? (
                <View
                  style={styles.bulletinsRow}
                  testID={`school-reports-bulletins-${student.id}`}
                >
                  {ALL_TERMS.map((term) => {
                    const snapshot =
                      snapshots.find((entry) => entry.term === term) ?? null;
                    return (
                      <TouchableOpacity
                        key={term}
                        style={styles.bulletinCard}
                        onPress={() => openBulletin(student, term)}
                        testID={`school-reports-bulletin-${student.id}-${term}`}
                      >
                        <Text style={styles.bulletinCardTerm}>
                          {termLabel(term, t)}
                        </Text>
                        <Text style={styles.bulletinCardAverage}>
                          {formatScore(
                            snapshot?.generalAverage.student ?? null,
                          )}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        }}
        onLoadMore={() => {
          setVisibleCount((current) =>
            current >= filteredStudents.length
              ? current
              : Math.min(current + PAGE_SIZE, filteredStudents.length),
          );
        }}
        hasMore={hasMore}
        emptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={t("notes.reports.empty.title")}
            message={t("notes.reports.empty.message")}
          />
        }
        contentContainerStyle={{
          padding: 16,
          gap: 10,
          paddingBottom: bottomInset + 24,
        }}
        testID="school-reports-list"
      />
    </View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: "center", padding: 16 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  filterToggle: {
    width: 42,
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  filterToggleActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterPanel: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterGroup: { gap: 6 },
  filterResetBtn: { alignSelf: "flex-start", paddingVertical: 4 },
  filterResetText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.accentTeal,
  },
  studentBlock: { gap: 8 },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  studentRowText: { gap: 2 },
  studentRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  studentRowClass: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  bulletinsRow: {
    flexDirection: "row",
    gap: 8,
  },
  bulletinCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  bulletinCardTerm: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },
  bulletinCardAverage: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  heroWrapper: { marginHorizontal: 16, marginTop: 12 },
  subjectsBlock: { paddingHorizontal: 16, gap: 12, marginTop: 12 },
  publishedFooter: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  publishedFooterLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  publishedFooterValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
