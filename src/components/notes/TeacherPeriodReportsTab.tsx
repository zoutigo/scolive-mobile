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
import { PeriodHero } from "./PeriodHero";
import { AppreciationEditor, SubjectReportCard } from "./SubjectReportCard";
import { computeYearlySnapshot, formatScore, termLabel } from "../../utils/notes";
import type {
  CouncilDrafts,
  NotesTeacherContext,
  StudentNotesTerm,
  StudentNotesTermOrYearly,
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
      term: StudentNotesTermOrYearly;
    } | null,
  ) => void;
  /**
   * Bulletin à ouvrir automatiquement (ex : depuis l'onglet Decision, tap sur
   * un trimestre ou la moyenne annuelle). Consommé une seule fois puis
   * signalé au parent via `onOpenTargetConsumed` pour éviter une réouverture
   * en boucle au re-render.
   */
  openTarget?: { studentId: string; term: StudentNotesTermOrYearly } | null;
  onOpenTargetConsumed?: () => void;
};

export type TeacherPeriodReportsHandle = {
  /** Returns true if the tab consumed the back action (closed the bulletin detail). */
  goBackFromDetail: () => boolean;
};

type DetailTarget = { studentId: string; term: StudentNotesTermOrYearly };

const ALL_TERMS: StudentNotesTerm[] = ["TERM_1", "TERM_2", "TERM_3"];
const ALL_CARDS: StudentNotesTermOrYearly[] = [
  "TERM_1",
  "TERM_2",
  "TERM_3",
  "YEARLY",
];

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
    openTarget,
    onOpenTargetConsumed,
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
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

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

  function openBulletin(studentId: string, term: StudentNotesTermOrYearly) {
    setDetail({ studentId, term });
    if (term !== "YEARLY") {
      onTermChange(term);
    }
    setExpandedStudentId(studentId);
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

  useEffect(() => {
    if (!openTarget) return;
    openBulletin(openTarget.studentId, openTarget.term);
    onOpenTargetConsumed?.();
    // `openBulletin`/`onOpenTargetConsumed` sont recréés à chaque render :
    // seul un changement de cible doit redéclencher l'ouverture.
  }, [openTarget]);

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

  async function saveGeneral(value: string) {
    if (!detail) return;
    await onSaveAppreciation(detail.studentId, {
      generalAppreciation: value,
    });
    setEditingGeneral(false);
  }

  async function saveSubject(subjectId: string, value: string) {
    if (!detail) return;
    await onSaveAppreciation(detail.studentId, {
      subject: { subjectId, value },
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
    const isYearly = detail.term === "YEARLY";
    const snapshot = isYearly
      ? null
      : (snapshots.find((entry) => entry.term === detail.term) ?? null);
    const yearlySnapshot = isYearly
      ? computeYearlySnapshot(snapshots, t)
      : null;
    const generalText = drafts[detail.studentId]?.generalAppreciation ?? "";
    const isReferentTeacher = teacherContext.class.isReferentTeacher;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        testID="teacher-reports-detail"
      >
        {isLoadingStudentNotes && snapshots.length === 0 ? (
          <LoadingBlock label={t("notes.panel.loading")} />
        ) : isYearly ? (
          yearlySnapshot ? (
            <>
              <View style={styles.heroWrapper}>
                <PeriodHero
                  snapshot={yearlySnapshot}
                  compactStats
                  showPublished={false}
                  inlineHeader
                />
              </View>

              <View
                style={styles.subjectsBlock}
                testID="teacher-reports-yearly-subjects"
              >
                {yearlySnapshot.subjects.map((subject) => (
                  <SubjectReportCard
                    key={subject.id}
                    subject={subject}
                    sequenceRows={ALL_TERMS.map((termKey) => ({
                      sequence: termKey,
                      label: termLabel(termKey, t),
                      studentAverage: subject.termAverages[termKey] ?? null,
                    }))}
                    editable={false}
                    appreciationValue=""
                    t={t}
                    testID={`teacher-reports-yearly-subject-card-${subject.id}`}
                    testIDPrefix={`teacher-reports-yearly-subject-${subject.id}`}
                  />
                ))}
              </View>
            </>
          ) : (
            <EmptyState
              icon="document-text-outline"
              title={t("notes.reports.empty.title")}
              message={t("notes.reports.empty.message")}
            />
          )
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

            {isReferentTeacher || generalText ? (
              <View style={styles.appreciationsBlock}>
                <Text style={styles.appreciationsTitle}>
                  {t("notes.reports.detail.generalTitle")}
                </Text>
                <AppreciationEditor
                  value={generalText}
                  editable={isReferentTeacher}
                  editing={editingGeneral}
                  onStartEdit={() => setEditingGeneral(true)}
                  onCancel={() => setEditingGeneral(false)}
                  onSave={saveGeneral}
                  isSaving={isSubmitting}
                  t={t}
                  testIDPrefix="teacher-reports-general"
                />
              </View>
            ) : null}

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
                const isSubjectTeacher = teacherContext.subjects.some(
                  (s) => s.id === subject.id,
                );
                const subjectAppreciationValue =
                  drafts[detail.studentId]?.subjects?.[subject.id] ?? "";

                return (
                  <SubjectReportCard
                    key={subject.id}
                    subject={subject}
                    sequenceRows={sequenceRows.map((row) => ({
                      sequence: row.sequence,
                      label: row.label,
                      studentAverage: row.data?.studentAverage ?? null,
                    }))}
                    editable={isSubjectTeacher}
                    editing={editingSubjectId === subject.id}
                    onStartEdit={() => setEditingSubjectId(subject.id)}
                    onCancelEdit={() => setEditingSubjectId(null)}
                    onSaveAppreciation={(value) =>
                      saveSubject(subject.id, value)
                    }
                    isSaving={isSubmitting}
                    appreciationValue={subjectAppreciationValue}
                    t={t}
                    testID={`teacher-reports-subject-card-${subject.id}`}
                    testIDPrefix={`teacher-reports-subject-${subject.id}`}
                  />
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
                    {ALL_CARDS.map((term) => {
                      const average =
                        term === "YEARLY"
                          ? (computeYearlySnapshot(snapshots, t)
                              ?.generalAverage.student ?? null)
                          : (snapshots.find((entry) => entry.term === term)
                              ?.generalAverage.student ?? null);
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
                            {formatScore(average)}
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
    paddingHorizontal: 6,
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
  appreciationsBlock: { paddingHorizontal: 16, gap: 10, marginTop: 12 },
  appreciationsTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary,
  },
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
