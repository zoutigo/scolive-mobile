import React, { useEffect, useMemo, useState } from "react";
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
import { useNotesStore } from "../../store/notes.store";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import type {
  NotesTeacherContext,
  StudentEvaluation,
  StudentNotesTerm,
  StudentSubjectNotes,
} from "../../types/notes.types";
import { formatScore, getCurrentTerm, termLabel } from "../../utils/notes";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  teacherContext: NotesTeacherContext;
  schoolSlug: string;
  bottomInset: number;
};

const TERMS: StudentNotesTerm[] = ["TERM_1", "TERM_2", "TERM_3"];

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherClassNotesTab({
  teacherContext,
  schoolSlug,
  bottomInset,
}: Props) {
  const { studentNotes, isLoadingStudentNotes, loadStudentNotes } =
    useNotesStore();

  const [notesTerm, setNotesTerm] =
    useState<StudentNotesTerm>(getCurrentTerm());
  const [studentFilter, setStudentFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  // Load notes for all students in the class on mount
  useEffect(() => {
    teacherContext.students.forEach((student) => {
      if (!studentNotes[student.id]) {
        void loadStudentNotes(schoolSlug, student.id).catch(() => {});
      }
    });
  }, [teacherContext.students, schoolSlug, loadStudentNotes, studentNotes]);

  const sortedStudents = useMemo(
    () =>
      [...teacherContext.students].sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      ),
    [teacherContext.students],
  );

  const filteredStudents = useMemo(() => {
    const q = studentFilter.trim().toLowerCase();
    if (!q) return sortedStudents;
    return sortedStudents.filter(
      (s) =>
        s.lastName.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q),
    );
  }, [sortedStudents, studentFilter]);

  const subjectOptions = useMemo(
    () => [{ id: "", name: "Toutes les matières" }, ...teacherContext.subjects],
    [teacherContext.subjects],
  );

  const isInitialLoading =
    isLoadingStudentNotes &&
    teacherContext.students.every((s) => !studentNotes[s.id]);

  return (
    <View style={styles.container} testID="teacher-notes-tab">
      {/* ── Période ─────────────────────────────────────────── */}
      <View style={styles.termRow} testID="teacher-notes-term-row">
        {TERMS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.termChip, notesTerm === t && styles.termChipActive]}
            onPress={() => setNotesTerm(t)}
            testID={`teacher-notes-term-${t}`}
          >
            <Text
              style={[
                styles.termChipLabel,
                notesTerm === t && styles.termChipLabelActive,
              ]}
            >
              {termLabel(t)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Recherche élève ─────────────────────────────────── */}
      <View style={styles.searchRow} testID="teacher-notes-student-search">
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          value={studentFilter}
          onChangeText={setStudentFilter}
          placeholder="Rechercher un élève…"
          placeholderTextColor={colors.textSecondary}
          clearButtonMode="while-editing"
          testID="teacher-notes-student-input"
        />
        {studentFilter.length > 0 ? (
          <TouchableOpacity
            onPress={() => setStudentFilter("")}
            testID="teacher-notes-student-clear"
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Filtre matière ──────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subjectFilterRow}
        style={styles.subjectFilterScroll}
        testID="teacher-notes-subject-filter"
      >
        {subjectOptions.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.subjectChip,
              subjectFilter === s.id && styles.subjectChipActive,
            ]}
            onPress={() => setSubjectFilter(s.id)}
            testID={`teacher-notes-subject-${s.id || "all"}`}
          >
            <Text
              style={[
                styles.subjectChipLabel,
                subjectFilter === s.id && styles.subjectChipLabelActive,
              ]}
            >
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Liste des élèves ────────────────────────────────── */}
      {isInitialLoading ? (
        <View style={styles.centered}>
          <LoadingBlock label="Chargement des notes…" />
        </View>
      ) : (
        <InfiniteScrollList
          data={filteredStudents}
          keyExtractor={(student) => student.id}
          renderItem={({ item: student }) => {
            const notes = studentNotes[student.id];
            const snapshot =
              notes?.find((entry) => entry.term === notesTerm) ?? null;
            const isLoadingThis = isLoadingStudentNotes && !notes;

            return (
              <StudentNoteBloc
                studentId={student.id}
                firstName={student.firstName}
                lastName={student.lastName}
                snapshot={snapshot}
                subjectFilter={subjectFilter}
                isLoading={isLoadingThis}
              />
            );
          }}
          emptyComponent={
            <View style={styles.centered}>
              <EmptyState
                icon="people-outline"
                title="Aucun élève"
                message="Aucun élève ne correspond à la recherche."
              />
            </View>
          }
          extraData={`${notesTerm}|${subjectFilter}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomInset + 24 },
          ]}
          testID="teacher-notes-list"
        />
      )}
    </View>
  );
}

// ─── StudentNoteBloc ─────────────────────────────────────────────────────────

type BlocProps = {
  studentId: string;
  firstName: string;
  lastName: string;
  snapshot: {
    generalAverage: { student: number | null };
    subjects: StudentSubjectNotes[];
  } | null;
  subjectFilter: string;
  isLoading: boolean;
};

function StudentNoteBloc({
  studentId,
  firstName,
  lastName,
  snapshot,
  subjectFilter,
  isLoading,
}: BlocProps) {
  const visibleSubjects = useMemo(() => {
    if (!snapshot) return [];
    if (!subjectFilter) return snapshot.subjects;
    return snapshot.subjects.filter((s) => s.id === subjectFilter);
  }, [snapshot, subjectFilter]);

  return (
    <View style={styles.studentBloc} testID={`teacher-notes-bloc-${studentId}`}>
      {/* Student header */}
      <View style={styles.studentBlocHeader}>
        <Text style={styles.studentBlocName}>
          {lastName} {firstName}
        </Text>
        {snapshot ? (
          <View style={styles.studentBlocAvg}>
            <Text style={styles.studentBlocAvgLabel}>Moy. gén.</Text>
            <Text style={styles.studentBlocAvgValue}>
              {formatScore(snapshot.generalAverage.student)}
            </Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.blocLoading}>
          <LoadingBlock label="Chargement…" />
        </View>
      ) : !snapshot || snapshot.subjects.length === 0 ? (
        <Text style={styles.noDataText}>
          Aucune note publiée pour cette période.
        </Text>
      ) : visibleSubjects.length === 0 ? (
        <Text style={styles.noDataText}>
          Aucune note pour la matière sélectionnée.
        </Text>
      ) : (
        <View style={styles.subjectsContainer}>
          {visibleSubjects.map((subject, index) => (
            <SubjectRow
              key={subject.id}
              subject={subject}
              isLast={index === visibleSubjects.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── SubjectRow ──────────────────────────────────────────────────────────────

function SubjectRow({
  subject,
  isLast,
}: {
  subject: StudentSubjectNotes;
  isLast: boolean;
}) {
  return (
    <View
      style={[styles.subjectRow, !isLast && styles.subjectRowBorder]}
      testID={`teacher-notes-subject-row-${subject.id}`}
    >
      {/* Subject header */}
      <View style={styles.subjectHeader}>
        <Text style={styles.subjectName} numberOfLines={1}>
          {subject.subjectLabel.toUpperCase()}
        </Text>
        <View style={styles.subjectStats}>
          <Text style={styles.subjectAvg}>
            {formatScore(subject.studentAverage)}
          </Text>
          <Text style={styles.subjectCoeff}>coef. {subject.coefficient}</Text>
        </View>
      </View>

      {/* Evaluations */}
      {subject.evaluations.length > 0 ? (
        <View style={styles.evalList}>
          {subject.evaluations.map((evaluation) => (
            <EvalChip key={evaluation.id} evaluation={evaluation} />
          ))}
        </View>
      ) : null}

      {/* Appreciation */}
      {subject.appreciation ? (
        <Text style={styles.appreciation}>"{subject.appreciation}"</Text>
      ) : null}
    </View>
  );
}

// ─── EvalChip ────────────────────────────────────────────────────────────────

function EvalChip({ evaluation }: { evaluation: StudentEvaluation }) {
  const scoreText =
    evaluation.status === "ABSENT"
      ? "ABS"
      : evaluation.status === "EXCUSED"
        ? "DISP"
        : evaluation.status === "NOT_GRADED"
          ? "NE"
          : `${formatScore(evaluation.score)}/${formatScore(evaluation.maxScore)}`;

  const isGood =
    evaluation.score !== null &&
    evaluation.maxScore > 0 &&
    evaluation.score / evaluation.maxScore >= 0.5;

  return (
    <View
      style={[
        styles.evalChip,
        isGood ? styles.evalChipGood : styles.evalChipBad,
      ]}
      testID={`teacher-notes-eval-${evaluation.id}`}
    >
      <Text style={styles.evalChipLabel} numberOfLines={1}>
        {evaluation.label}
      </Text>
      <Text
        style={[
          styles.evalChipScore,
          isGood ? styles.evalScoreGood : styles.evalScoreBad,
        ]}
      >
        {scoreText}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", padding: 16 },
  // Term
  termRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  termChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  termChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  termChipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  termChipLabelActive: { color: colors.white },
  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  // Subject filter
  subjectFilterScroll: {
    backgroundColor: colors.warmSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  subjectFilterRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  subjectChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  subjectChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  subjectChipLabelActive: { color: colors.white },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  // Student bloc
  studentBloc: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    overflow: "hidden",
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  studentBlocHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.warmSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  studentBlocName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  studentBlocAvg: { alignItems: "flex-end" },
  studentBlocAvgLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  studentBlocAvgValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  blocLoading: { padding: 16 },
  noDataText: {
    padding: 14,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  subjectsContainer: { paddingHorizontal: 14, paddingBottom: 8 },
  // Subject row
  subjectRow: { paddingVertical: 10 },
  subjectRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  subjectName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  subjectStats: { flexDirection: "row", alignItems: "center", gap: 10 },
  subjectAvg: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
    minWidth: 40,
    textAlign: "right",
  },
  subjectCoeff: { fontSize: 11, color: colors.textSecondary },
  // Eval chips
  evalList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  evalChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 2,
    maxWidth: 150,
  },
  evalChipGood: {
    borderColor: "#D1FAE5",
    backgroundColor: "#F0FDF4",
  },
  evalChipBad: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
  },
  evalChipLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  evalChipScore: { fontSize: 13, fontWeight: "800" },
  evalScoreGood: { color: "#065F46" },
  evalScoreBad: { color: "#B91C1C" },
  // Appreciation
  appreciation: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 17,
  },
});
