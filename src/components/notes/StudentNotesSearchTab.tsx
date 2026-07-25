import React, { useMemo, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { StudentNotesPanel } from "./ChildNotesScreen";
import type {
  StudentNotesSequence,
  StudentNotesTerm,
  StudentNotesView,
} from "../../types/notes.types";
import {
  ALL_SEQUENCES,
  getCurrentTerm,
  sequenceShortLabel,
} from "../../utils/notes";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Élève affichable dans la recherche : `className` est fourni uniquement
 * quand la liste couvre plusieurs classes (vue school admin), afin de
 * désambiguïser deux élèves homonymes de classes différentes.
 */
export type StudentNotesSearchEntry = {
  id: string;
  firstName: string;
  lastName: string;
  className?: string;
};

export type StudentNotesSearchSubject = { id: string; name: string };

type Props = {
  students: StudentNotesSearchEntry[];
  subjects: StudentNotesSearchSubject[];
  schoolSlug: string;
  bottomInset: number;
  initialStudentId?: string;
  isLoadingStudents?: boolean;
};

function buildViewOptions(
  t: ReturnType<typeof useTranslation>["t"],
): Array<{ value: StudentNotesView; label: string }> {
  return [
    { value: "evaluations", label: t("notes.panel.viewEval") },
    { value: "averages", label: t("notes.panel.viewAvg") },
    { value: "charts", label: t("notes.panel.viewChart") },
  ];
}

function formatStudentLabel(entry: StudentNotesSearchEntry) {
  const base = `${entry.lastName} ${entry.firstName}`;
  return entry.className ? `${base} • ${entry.className}` : base;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentNotesSearchTab({
  students,
  subjects,
  schoolSlug,
  bottomInset,
  initialStudentId,
  isLoadingStudents = false,
}: Props) {
  const { t } = useTranslation();
  const sortedStudents = useMemo(
    () =>
      [...students].sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      ),
    [students],
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    initialStudentId ??
      (sortedStudents.length > 0 ? sortedStudents[0].id : null),
  );
  const selectedStudent = useMemo(
    () => sortedStudents.find((s) => s.id === selectedStudentId) ?? null,
    [sortedStudents, selectedStudentId],
  );

  const [searchQuery, setSearchQuery] = useState(
    selectedStudent ? formatStudentLabel(selectedStudent) : "",
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedStudents;
    return sortedStudents.filter((s) =>
      `${s.lastName} ${s.firstName}`.toLowerCase().includes(q),
    );
  }, [sortedStudents, searchQuery]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterScrollOverflowing, setFilterScrollOverflowing] = useState(false);
  const [filterScrollNearBottom, setFilterScrollNearBottom] = useState(false);
  const filterScrollLayoutHeightRef = useRef(0);
  const filterScrollContentHeightRef = useRef(0);
  const showFilterScrollHint =
    filterScrollOverflowing && !filterScrollNearBottom;
  const subjectOptions = useMemo(
    () => [
      { id: "", name: t("notes.teacher.filters.allSubjects") },
      ...subjects,
    ],
    [subjects, t],
  );
  const [draftSubjectId, setDraftSubjectId] = useState("");
  const [draftTerm, setDraftTerm] =
    useState<StudentNotesTerm>(getCurrentTerm());
  const [draftSequence, setDraftSequence] =
    useState<StudentNotesSequence | null>(null);
  const [draftView, setDraftView] = useState<StudentNotesView>("evaluations");

  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState<StudentNotesTerm>(getCurrentTerm());
  const [sequence, setSequence] = useState<StudentNotesSequence | null>(null);
  const [view, setView] = useState<StudentNotesView>("evaluations");

  function selectStudent(id: string, label: string) {
    setSelectedStudentId(id);
    setSearchQuery(label);
    setSearchOpen(false);
  }

  function openFilters() {
    setDraftSubjectId(subjectId);
    setDraftTerm(term);
    setDraftSequence(sequence);
    setDraftView(view);
    filterScrollLayoutHeightRef.current = 0;
    filterScrollContentHeightRef.current = 0;
    setFilterScrollOverflowing(false);
    setFilterScrollNearBottom(false);
    setFiltersOpen(true);
  }
  function closeFilters() {
    setFiltersOpen(false);
  }
  function recomputeFilterScrollOverflow() {
    setFilterScrollOverflowing(
      filterScrollContentHeightRef.current >
        filterScrollLayoutHeightRef.current + 4,
    );
  }
  function handleFilterScrollLayout(height: number) {
    filterScrollLayoutHeightRef.current = height;
    recomputeFilterScrollOverflow();
  }
  function handleFilterScrollContentSize(height: number) {
    filterScrollContentHeightRef.current = height;
    recomputeFilterScrollOverflow();
  }
  function handleFilterScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setFilterScrollNearBottom(distanceFromBottom < 12);
  }
  function applyFilters() {
    setSubjectId(draftSubjectId);
    setTerm(draftTerm);
    setSequence(draftSequence);
    setView(draftView);
    setFiltersOpen(false);
  }
  function resetFilters() {
    setDraftSubjectId("");
    setDraftTerm(getCurrentTerm());
    setDraftSequence(null);
    setDraftView("evaluations");
    setSubjectId("");
    setTerm(getCurrentTerm());
    setSequence(null);
    setView("evaluations");
  }

  const hasActiveFilters =
    subjectId !== "" ||
    term !== getCurrentTerm() ||
    sequence !== null ||
    view !== "evaluations";

  if (isLoadingStudents && students.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="teacher-notes-tab">
        <LoadingBlock label={t("notes.teacher.loading.students")} />
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="teacher-notes-tab">
        <EmptyState
          icon="people-outline"
          title={t("notes.teacher.empty.title")}
          message={t("notes.teacher.empty.message")}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="teacher-notes-tab">
      {/* ── Recherche élève + filtre ──────────────────────────────── */}
      <View style={styles.searchRow} testID="teacher-notes-search-bar">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(value) => {
              setSearchQuery(value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder={t("notes.teacher.search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={t("notes.teacher.search.accessibilityLabel")}
            testID="teacher-notes-search-input"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchOpen(true);
              }}
              testID="teacher-notes-search-clear"
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
          onPress={filtersOpen ? closeFilters : openFilters}
          testID="teacher-notes-filter-toggle"
          accessibilityLabel={t(
            "notes.teacher.filters.toggleAccessibilityLabel",
          )}
        >
          <Ionicons
            name={hasActiveFilters ? "filter" : "filter-outline"}
            size={18}
            color={hasActiveFilters ? colors.white : colors.accentTeal}
          />
        </TouchableOpacity>
      </View>

      {searchOpen ? (
        <View
          style={styles.searchResults}
          testID="teacher-notes-search-results"
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.searchResultsList}
          >
            {searchResults.length === 0 ? (
              <Text style={styles.searchNoResults}>
                {t("notes.teacher.search.noResults")}
              </Text>
            ) : (
              searchResults.map((student) => {
                const label = formatStudentLabel(student);
                const isSelected = student.id === selectedStudentId;
                return (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.searchResultRow,
                      isSelected && styles.searchResultRowSelected,
                    ]}
                    onPress={() => selectStudent(student.id, label)}
                    testID={`teacher-notes-search-result-${student.id}`}
                  >
                    <View style={styles.searchResultTextBlock}>
                      <Text
                        style={[
                          styles.searchResultText,
                          isSelected && styles.searchResultTextSelected,
                        ]}
                      >
                        {`${student.lastName} ${student.firstName}`}
                      </Text>
                      {student.className ? (
                        <Text
                          style={styles.searchResultClass}
                          testID={`teacher-notes-search-result-class-${student.id}`}
                        >
                          {student.className}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}

      {/* ── Panneau de filtres ──────────────────────────────── */}
      {filtersOpen ? (
        <View style={styles.filterPanel} testID="teacher-notes-filter-panel">
          <View style={styles.filterScrollWrapper}>
            <ScrollView
              style={styles.filterScrollArea}
              contentContainerStyle={styles.filterScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              onLayout={(e) =>
                handleFilterScrollLayout(e.nativeEvent.layout.height)
              }
              onContentSizeChange={(_w, h) => handleFilterScrollContentSize(h)}
              onScroll={handleFilterScroll}
              scrollEventThrottle={16}
              testID="teacher-notes-filter-scroll"
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("notes.teacher.filters.subjectLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  {subjectOptions.map((subject) => (
                    <TouchableOpacity
                      key={subject.id || "all"}
                      style={[
                        styles.filterChip,
                        draftSubjectId === subject.id &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => setDraftSubjectId(subject.id)}
                      testID={`teacher-notes-filter-subject-${subject.id || "all"}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftSubjectId === subject.id &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("notes.teacher.filters.termLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  {(["TERM_1", "TERM_2", "TERM_3"] as StudentNotesTerm[]).map(
                    (value) => (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.filterChip,
                          draftTerm === value && styles.filterChipActive,
                        ]}
                        onPress={() => setDraftTerm(value)}
                        testID={`teacher-notes-filter-term-${value}`}
                      >
                        <Text
                          style={[
                            styles.filterChipLabel,
                            draftTerm === value && styles.filterChipLabelActive,
                          ]}
                        >
                          {t(
                            `notes.terms.${value === "TERM_1" ? "term1" : value === "TERM_2" ? "term2" : "term3"}`,
                          )}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("notes.manager.filters.sequenceLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      draftSequence == null && styles.filterChipActive,
                    ]}
                    onPress={() => setDraftSequence(null)}
                    testID="teacher-notes-filter-sequence-all"
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftSequence == null && styles.filterChipLabelActive,
                      ]}
                    >
                      {t("notes.manager.filters.allOption")}
                    </Text>
                  </TouchableOpacity>
                  {ALL_SEQUENCES.map((seq) => (
                    <TouchableOpacity
                      key={seq}
                      style={[
                        styles.filterChip,
                        draftSequence === seq && styles.filterChipActive,
                      ]}
                      onPress={() => setDraftSequence(seq)}
                      testID={`teacher-notes-filter-sequence-${seq}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftSequence === seq && styles.filterChipLabelActive,
                        ]}
                      >
                        {sequenceShortLabel(seq)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("notes.teacher.filters.viewLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  {buildViewOptions(t).map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterChip,
                        draftView === option.value && styles.filterChipActive,
                      ]}
                      onPress={() => setDraftView(option.value)}
                      testID={`teacher-notes-filter-view-${option.value}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftView === option.value &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            {showFilterScrollHint ? (
              <View
                style={styles.filterScrollHint}
                pointerEvents="none"
                testID="teacher-notes-filter-scroll-hint"
              >
                <View style={styles.filterScrollHintFade} />
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.accentTeal}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={resetFilters}
              testID="teacher-notes-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("notes.manager.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID="teacher-notes-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("notes.manager.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={applyFilters}
              testID="teacher-notes-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("notes.manager.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* ── Vue notes de l'élève sélectionné ─────────────── */}
      {selectedStudent && !searchOpen && !filtersOpen ? (
        <StudentNotesPanel
          studentId={selectedStudent.id}
          schoolSlug={schoolSlug}
          bottomInset={bottomInset}
          subjectFilter={subjectId}
          term={term}
          onTermChange={setTerm}
          view={view}
          onViewChange={setView}
          sequence={sequence}
          onSequenceChange={setSequence}
          hideSwitcher
        />
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
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
  searchResults: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxHeight: 260,
    overflow: "hidden",
  },
  searchResultsList: { flexGrow: 0 },
  searchNoResults: {
    padding: 14,
    color: colors.textSecondary,
    fontSize: 13,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  searchResultRowSelected: {
    backgroundColor: "#eef5fd",
  },
  searchResultTextBlock: { flex: 1, gap: 2 },
  searchResultText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  searchResultTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  searchResultClass: {
    fontSize: 12,
    color: colors.textSecondary,
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
  filterScrollWrapper: {
    flex: 1,
    position: "relative",
  },
  filterScrollArea: {
    flex: 1,
  },
  filterScrollContent: {
    gap: 14,
    paddingBottom: 12,
  },
  filterScrollHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScrollHintFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
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
    minWidth: 90,
    minHeight: 40,
    paddingHorizontal: 10,
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
});
