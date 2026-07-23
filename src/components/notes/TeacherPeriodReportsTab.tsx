import React, { useMemo, useState } from "react";
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
import { EmptyState } from "../timetable/TimetableCommon";
import { StudentNotesPanel } from "./ChildNotesScreen";
import type {
  CouncilDrafts,
  NotesTeacherContext,
  StudentNotesTerm,
} from "../../types/notes.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  teacherContext: NotesTeacherContext;
  schoolSlug: string;
  bottomInset: number;
  term: StudentNotesTerm;
  onTermChange: (term: StudentNotesTerm) => void;
  drafts: CouncilDrafts;
  onSaveAppreciation: (
    studentId: string,
    patch: {
      generalAppreciation?: string;
      subject?: { subjectId: string; value: string };
    },
  ) => Promise<void>;
  isSubmitting: boolean;
};

const TERM_KEYS: Record<StudentNotesTerm, string> = {
  TERM_1: "notes.terms.term1",
  TERM_2: "notes.terms.term2",
  TERM_3: "notes.terms.term3",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherPeriodReportsTab({
  teacherContext,
  schoolSlug,
  bottomInset,
  term,
  onTermChange,
  drafts,
  onSaveAppreciation,
  isSubmitting,
}: Props) {
  const { t } = useTranslation();
  const sortedStudents = useMemo(
    () =>
      [...teacherContext.students].sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      ),
    [teacherContext.students],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftTerm, setDraftTerm] = useState<StudentNotesTerm>(term);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [generalDraft, setGeneralDraft] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectDraft, setSubjectDraft] = useState("");

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedStudents;
    return sortedStudents.filter((s) =>
      `${s.lastName} ${s.firstName}`.toLowerCase().includes(q),
    );
  }, [sortedStudents, searchQuery]);

  const selectedStudent = useMemo(
    () => sortedStudents.find((s) => s.id === selectedStudentId) ?? null,
    [sortedStudents, selectedStudentId],
  );

  function openFilters() {
    setDraftTerm(term);
    setFiltersOpen(true);
  }
  function closeFilters() {
    setFiltersOpen(false);
  }
  function applyFilters() {
    onTermChange(draftTerm);
    setFiltersOpen(false);
  }
  function resetFilters() {
    setDraftTerm(term);
    setFiltersOpen(false);
  }

  function openStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setEditingGeneral(false);
    setEditingSubjectId(null);
  }
  function backToList() {
    setSelectedStudentId(null);
    setEditingGeneral(false);
    setEditingSubjectId(null);
  }

  function startEditGeneral() {
    setGeneralDraft(drafts[selectedStudentId ?? ""]?.generalAppreciation ?? "");
    setEditingGeneral(true);
  }
  async function saveGeneral() {
    if (!selectedStudentId) return;
    await onSaveAppreciation(selectedStudentId, {
      generalAppreciation: generalDraft,
    });
    setEditingGeneral(false);
  }

  function startEditSubject(subjectId: string) {
    setSubjectDraft(
      drafts[selectedStudentId ?? ""]?.subjects?.[subjectId] ?? "",
    );
    setEditingSubjectId(subjectId);
  }
  async function saveSubject(subjectId: string) {
    if (!selectedStudentId) return;
    await onSaveAppreciation(selectedStudentId, {
      subject: { subjectId, value: subjectDraft },
    });
    setEditingSubjectId(null);
  }

  if (teacherContext.students.length === 0) {
    return (
      <View style={styles.emptyContainer} testID="teacher-reports-tab">
        <EmptyState
          icon="document-text-outline"
          title={t("notes.reports.empty.title")}
          message={t("notes.reports.empty.message")}
        />
      </View>
    );
  }

  // ── Vue détail : bulletin + appréciations inline ──────────────────
  if (selectedStudent) {
    const generalText = drafts[selectedStudent.id]?.generalAppreciation ?? "";
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        testID="teacher-reports-detail"
      >
        <TouchableOpacity
          style={styles.backRow}
          onPress={backToList}
          testID="teacher-reports-detail-back"
        >
          <Ionicons
            name="arrow-back-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.backText}>
            {t("notes.reports.detail.backToList")}
          </Text>
        </TouchableOpacity>

        <StudentNotesPanel
          studentId={selectedStudent.id}
          schoolSlug={schoolSlug}
          bottomInset={0}
          term={term}
          onTermChange={onTermChange}
        />

        <View style={styles.appreciationsBlock}>
          <Text style={styles.appreciationsTitle}>
            {t("notes.reports.detail.generalTitle")}
          </Text>
          <AppreciationEditor
            value={generalText}
            editing={editingGeneral}
            draft={generalDraft}
            onDraftChange={setGeneralDraft}
            onStartEdit={startEditGeneral}
            onCancel={() => setEditingGeneral(false)}
            onSave={saveGeneral}
            isSaving={isSubmitting}
            t={t}
            testIDPrefix="teacher-reports-general"
          />

          <Text style={styles.appreciationsTitle}>
            {t("notes.reports.detail.subjectsTitle")}
          </Text>
          {teacherContext.subjects.map((subject) => (
            <View key={subject.id} style={styles.subjectAppreciationRow}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <AppreciationEditor
                value={drafts[selectedStudent.id]?.subjects?.[subject.id] ?? ""}
                editing={editingSubjectId === subject.id}
                draft={subjectDraft}
                onDraftChange={setSubjectDraft}
                onStartEdit={() => startEditSubject(subject.id)}
                onCancel={() => setEditingSubjectId(null)}
                onSave={() => saveSubject(subject.id)}
                isSaving={isSubmitting}
                t={t}
                testIDPrefix={`teacher-reports-subject-${subject.id}`}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  // ── Vue liste : recherche + filtre ─────────────────────────────────
  return (
    <View style={styles.container} testID="teacher-reports-tab">
      <View style={styles.searchRow} testID="teacher-reports-search-bar">
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
            testID="teacher-reports-search-input"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              testID="teacher-reports-search-clear"
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
            filtersOpen && styles.filterToggleActive,
          ]}
          onPress={filtersOpen ? closeFilters : openFilters}
          testID="teacher-reports-filter-toggle"
          accessibilityLabel={t(
            "notes.reports.filter.toggleAccessibilityLabel",
          )}
        >
          <Ionicons
            name={filtersOpen ? "filter" : "filter-outline"}
            size={18}
            color={filtersOpen ? colors.white : colors.accentTeal}
          />
        </TouchableOpacity>
      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel} testID="teacher-reports-filter-panel">
          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>
              {t("notes.reports.filter.termLabel")}
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
                    testID={`teacher-reports-filter-term-${value}`}
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftTerm === value && styles.filterChipLabelActive,
                      ]}
                    >
                      {t(TERM_KEYS[value])}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={resetFilters}
              testID="teacher-reports-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("notes.manager.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID="teacher-reports-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("notes.manager.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={applyFilters}
              testID="teacher-reports-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("notes.manager.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.list}
        contentContainerStyle={{
          padding: 16,
          gap: 10,
          paddingBottom: bottomInset + 24,
        }}
        testID="teacher-reports-list"
      >
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title={t("notes.reports.empty.title")}
            message={t("notes.reports.empty.message")}
          />
        ) : (
          filteredStudents.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentRow}
              onPress={() => openStudent(student.id)}
              testID={`teacher-reports-row-${student.id}`}
            >
              <Text style={styles.studentRowName}>
                {student.lastName} {student.firstName}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AppreciationEditor(props: {
  value: string;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
  isSaving: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  testIDPrefix: string;
}) {
  const { t } = props;
  if (props.editing) {
    return (
      <View style={styles.editorBlock} testID={`${props.testIDPrefix}-editor`}>
        <TextInput
          value={props.draft}
          onChangeText={props.onDraftChange}
          multiline
          style={styles.editorInput}
          placeholderTextColor={colors.textSecondary}
          testID={`${props.testIDPrefix}-input`}
        />
        <View style={styles.editorActionsRow}>
          <TouchableOpacity
            style={styles.editorCancelBtn}
            onPress={props.onCancel}
            testID={`${props.testIDPrefix}-cancel`}
          >
            <Text style={styles.editorCancelText}>
              {t("notes.reports.detail.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.editorSaveBtn,
              props.isSaving && styles.editorSaveBtnDisabled,
            ]}
            onPress={() => void props.onSave()}
            disabled={props.isSaving}
            testID={`${props.testIDPrefix}-save`}
          >
            <Text style={styles.editorSaveText}>
              {t("notes.reports.detail.saveField")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.appreciationRow}
      onPress={props.onStartEdit}
      testID={`${props.testIDPrefix}-display`}
    >
      <Text style={styles.appreciationText} numberOfLines={2}>
        {props.value || t("notes.reports.detail.noAppreciation")}
      </Text>
      <Ionicons name="create-outline" size={18} color={colors.primary} />
    </TouchableOpacity>
  );
}

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
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}33`,
    backgroundColor: colors.surface,
    gap: 14,
  },
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
    backgroundColor: colors.accentTeal,
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
  list: { flex: 1 },
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
  studentRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  appreciationsBlock: { paddingHorizontal: 16, gap: 10, marginTop: 4 },
  appreciationsTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 8,
  },
  subjectAppreciationRow: { gap: 6 },
  subjectName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  appreciationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  appreciationText: { flex: 1, fontSize: 13, color: colors.textPrimary },
  editorBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
  },
  editorInput: {
    minHeight: 72,
    textAlignVertical: "top",
    fontSize: 13,
    color: colors.textPrimary,
  },
  editorActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  editorCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editorCancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  editorSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  editorSaveBtnDisabled: { opacity: 0.6 },
  editorSaveText: { fontSize: 13, fontWeight: "700", color: colors.white },
});
