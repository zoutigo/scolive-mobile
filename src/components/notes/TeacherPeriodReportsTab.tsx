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
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import { useNotesStore } from "../../store/notes.store";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { PeriodHero } from "./ChildNotesScreen";
import { formatScore, termLabel } from "../../utils/notes";
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
  onDetailChange?: (
    info: {
      studentName: string;
      className: string;
      term: StudentNotesTerm;
    } | null,
  ) => void;
};

export type TeacherPeriodReportsHandle = {
  /** Returns true if the tab consumed the back action (closed the bulletin detail). */
  goBackFromDetail: () => boolean;
};

type DetailTarget = { studentId: string; term: StudentNotesTerm };

const ALL_TERMS: StudentNotesTerm[] = ["TERM_1", "TERM_2", "TERM_3"];

// ─── Component ────────────────────────────────────────────────────────────────

export const TeacherPeriodReportsTab = forwardRef<
  TeacherPeriodReportsHandle,
  Props
>(function TeacherPeriodReportsTab(
  {
    teacherContext,
    schoolSlug,
    bottomInset,
    onTermChange,
    drafts,
    onSaveAppreciation,
    isSubmitting,
    onDetailChange,
  },
  ref,
) {
  const { t } = useTranslation();
  const { studentNotes, isLoadingStudentNotes, loadStudentNotes } =
    useNotesStore();

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
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(
    null,
  );
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [generalDraft, setGeneralDraft] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectDraft, setSubjectDraft] = useState("");

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

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedStudents;
    return sortedStudents.filter((s) =>
      `${s.lastName} ${s.firstName}`.toLowerCase().includes(q),
    );
  }, [sortedStudents, searchQuery]);

  const selectedStudent = useMemo(
    () => sortedStudents.find((s) => s.id === detail?.studentId) ?? null,
    [sortedStudents, detail],
  );

  function toggleStudent(studentId: string) {
    setExpandedStudentId((current) =>
      current === studentId ? null : studentId,
    );
  }

  function openBulletin(studentId: string, term: StudentNotesTerm) {
    setDetail({ studentId, term });
    onTermChange(term);
    setEditingGeneral(false);
    setEditingSubjectId(null);
    const student = sortedStudents.find((s) => s.id === studentId);
    if (student) {
      onDetailChange?.({
        studentName: `${student.lastName} ${student.firstName}`,
        className: teacherContext.class.name,
        term,
      });
    }
  }
  function backToList() {
    setDetail(null);
    setEditingGeneral(false);
    setEditingSubjectId(null);
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

  function startEditGeneral() {
    setGeneralDraft(drafts[detail?.studentId ?? ""]?.generalAppreciation ?? "");
    setEditingGeneral(true);
  }
  async function saveGeneral() {
    if (!detail) return;
    await onSaveAppreciation(detail.studentId, {
      generalAppreciation: generalDraft,
    });
    setEditingGeneral(false);
  }

  function startEditSubject(subjectId: string) {
    setSubjectDraft(
      drafts[detail?.studentId ?? ""]?.subjects?.[subjectId] ?? "",
    );
    setEditingSubjectId(subjectId);
  }
  async function saveSubject(subjectId: string) {
    if (!detail) return;
    await onSaveAppreciation(detail.studentId, {
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

  // ── Vue détail : bulletin complet + appréciations inline ──────────
  if (detail && selectedStudent) {
    const snapshots = studentNotes[detail.studentId] ?? [];
    const snapshot =
      snapshots.find((entry) => entry.term === detail.term) ?? null;
    const generalText = drafts[detail.studentId]?.generalAppreciation ?? "";

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        testID="teacher-reports-detail"
      >
        {isLoadingStudentNotes && !snapshot ? (
          <LoadingBlock label={t("notes.panel.loading")} />
        ) : snapshot ? (
          <>
            <PeriodHero
              snapshot={snapshot}
              compactStats
              showPublished={false}
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
            </View>

            <View
              style={styles.subjectsBlock}
              testID="teacher-reports-subjects"
            >
              {snapshot.subjects.map((subject) => {
                const sequenceRows = snapshot.sequences
                  .map((seq) => ({
                    sequence: seq.sequence,
                    label: seq.sequenceLabel,
                    data: seq.subjects.find((s) => s.id === subject.id),
                  }))
                  .filter((row) => row.data);

                return (
                  <View
                    key={subject.id}
                    style={styles.subjectCard}
                    testID={`teacher-reports-subject-card-${subject.id}`}
                  >
                    <View style={styles.subjectCardHeader}>
                      <Text style={styles.subjectCardName}>
                        {subject.subjectLabel.toUpperCase()}
                      </Text>
                      <Text style={styles.subjectCardCoeff}>
                        {t("notes.avgs.coef")} {subject.coefficient}
                      </Text>
                    </View>

                    <View style={styles.metricsRow}>
                      {sequenceRows.map((row) => (
                        <View
                          key={row.sequence}
                          style={styles.metricCell}
                          testID={`teacher-reports-subject-${subject.id}-sequence-${row.sequence}`}
                        >
                          <Text style={styles.metricLabel} numberOfLines={1}>
                            {row.label}
                          </Text>
                          <Text style={styles.metricValue}>
                            {formatScore(row.data?.studentAverage ?? null)}
                          </Text>
                        </View>
                      ))}
                      <View style={[styles.metricCell, styles.metricCellEnd]}>
                        <Text style={styles.metricLabel} numberOfLines={1}>
                          {t("notes.reports.detail.termAverage")}
                        </Text>
                        <Text
                          style={[styles.metricValue, styles.metricValueStrong]}
                        >
                          {formatScore(subject.studentAverage)}
                        </Text>
                      </View>
                    </View>

                    <AppreciationEditor
                      value={
                        drafts[detail.studentId]?.subjects?.[subject.id] ?? ""
                      }
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
                );
              })}
            </View>

            {snapshot.generatedAtLabel ? (
              <View
                style={styles.publishedFooter}
                testID="teacher-reports-published"
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

  // ── Vue liste : recherche + accordéon des 3 bulletins ──────────────
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
      </View>

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
          filteredStudents.map((student) => {
            const expanded = expandedStudentId === student.id;
            const snapshots = studentNotes[student.id] ?? [];
            return (
              <View key={student.id} style={styles.studentBlock}>
                <TouchableOpacity
                  style={styles.studentRow}
                  onPress={() => toggleStudent(student.id)}
                  testID={`teacher-reports-row-${student.id}`}
                >
                  <Text style={styles.studentRowName}>
                    {student.lastName} {student.firstName}
                  </Text>
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {expanded ? (
                  <View
                    style={styles.bulletinsRow}
                    testID={`teacher-reports-bulletins-${student.id}`}
                  >
                    {ALL_TERMS.map((term) => {
                      const snapshot =
                        snapshots.find((entry) => entry.term === term) ?? null;
                      return (
                        <TouchableOpacity
                          key={term}
                          style={styles.bulletinCard}
                          onPress={() => openBulletin(student.id, term)}
                          testID={`teacher-reports-bulletin-${student.id}-${term}`}
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
          })
        )}
      </ScrollView>
    </View>
  );
});

function AppreciationEditor(props: {
  value: string;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
  isSaving: boolean;
  t: TranslateFn;
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
  list: { flex: 1 },
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
  studentRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
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
  appreciationsBlock: { paddingHorizontal: 16, gap: 10, marginTop: 12 },
  appreciationsTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subjectsBlock: { paddingHorizontal: 16, gap: 12, marginTop: 12 },
  subjectCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  subjectCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subjectCardName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subjectCardCoeff: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  metricCell: { alignItems: "center", gap: 3 },
  metricCellEnd: { alignItems: "flex-end" },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  metricValueStrong: {
    fontSize: 16,
    color: colors.primary,
  },
  appreciationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
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
