import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { EmptyState } from "../timetable/TimetableCommon";
import { StudentNotesPanel } from "./ChildNotesScreen";
import type { NotesTeacherContext } from "../../types/notes.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  teacherContext: NotesTeacherContext;
  schoolSlug: string;
  bottomInset: number;
  initialStudentId?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherClassNotesTab({
  teacherContext,
  schoolSlug,
  bottomInset,
  initialStudentId,
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

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    initialStudentId ?? null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);

  // Select first student (sorted alphabetically) on mount
  useEffect(() => {
    if (sortedStudents.length > 0 && selectedStudentId === null) {
      setSelectedStudentId(sortedStudents[0].id);
    }
  }, [sortedStudents, selectedStudentId]);

  const selectedStudent = useMemo(
    () => sortedStudents.find((s) => s.id === selectedStudentId) ?? null,
    [sortedStudents, selectedStudentId],
  );

  const subjectOptions = useMemo(
    () => [
      { id: "", name: t("notes.teacher.filters.allSubjects") },
      ...teacherContext.subjects,
    ],
    [teacherContext.subjects, t],
  );

  const selectedSubject = useMemo(
    () =>
      subjectOptions.find((s) => s.id === selectedSubjectId) ??
      subjectOptions[0],
    [subjectOptions, selectedSubjectId],
  );

  if (teacherContext.students.length === 0) {
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
      {/* ── Barre de filtres ──────────────────────────────── */}
      <View style={styles.filtersRow}>
        {/* Picker élève */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setPickerVisible(true)}
          testID="teacher-notes-student-picker"
        >
          <Text style={styles.filterLabel}>
            {t("notes.teacher.filters.studentLabel")}
          </Text>
          {selectedStudent ? (
            <Text style={styles.filterValue} numberOfLines={1}>
              {selectedStudent.lastName} {selectedStudent.firstName}
            </Text>
          ) : null}
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.filterDivider} />

        {/* Picker matière */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setSubjectPickerVisible(true)}
          testID="teacher-notes-subject-picker"
        >
          <Text style={styles.filterLabel}>
            {t("notes.teacher.filters.subjectLabel")}
          </Text>
          <Text style={styles.filterValue} numberOfLines={1}>
            {selectedSubject.name}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* ── Vue notes de l'élève sélectionné ─────────────── */}
      {selectedStudent ? (
        <StudentNotesPanel
          studentId={selectedStudent.id}
          schoolSlug={schoolSlug}
          bottomInset={bottomInset}
          subjectFilter={selectedSubjectId}
        />
      ) : null}

      {/* ── Modal de sélection ────────────────────────────── */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
        testID="teacher-notes-picker-modal"
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
          testID="teacher-notes-picker-overlay"
        />
        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {t("notes.teacher.picker.selectStudent")}
            </Text>
            <TouchableOpacity
              onPress={() => setPickerVisible(false)}
              style={styles.closeButton}
              testID="teacher-notes-picker-close"
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Liste des élèves */}
          <ScrollView
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            testID="teacher-notes-picker-list"
          >
            {sortedStudents.map((student) => {
              const isSelected = student.id === selectedStudentId;
              return (
                <TouchableOpacity
                  key={student.id}
                  style={[
                    styles.pickerStudentRow,
                    isSelected && styles.pickerStudentRowSelected,
                  ]}
                  onPress={() => {
                    setSelectedStudentId(student.id);
                    setPickerVisible(false);
                  }}
                  testID={`teacher-notes-picker-student-${student.id}`}
                >
                  <Text
                    style={[
                      styles.pickerStudentName,
                      isSelected && styles.pickerStudentNameSelected,
                    ]}
                  >
                    {student.lastName} {student.firstName}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal sélection matière ───────────────────────── */}
      <Modal
        visible={subjectPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSubjectPickerVisible(false)}
        testID="teacher-notes-subject-picker-modal"
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSubjectPickerVisible(false)}
          testID="teacher-notes-subject-picker-overlay"
        />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {t("notes.teacher.picker.filterBySubject")}
            </Text>
            <TouchableOpacity
              onPress={() => setSubjectPickerVisible(false)}
              style={styles.closeButton}
              testID="teacher-notes-subject-picker-close"
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.pickerList}
            showsVerticalScrollIndicator={false}
            testID="teacher-notes-subject-picker-list"
          >
            {subjectOptions.map((subject) => {
              const isSelected = subject.id === selectedSubjectId;
              return (
                <TouchableOpacity
                  key={subject.id || "all"}
                  style={[
                    styles.pickerStudentRow,
                    isSelected && styles.pickerStudentRowSelected,
                  ]}
                  onPress={() => {
                    setSelectedSubjectId(subject.id);
                    setSubjectPickerVisible(false);
                  }}
                  testID={`teacher-notes-subject-picker-option-${subject.id || "all"}`}
                >
                  <Text
                    style={[
                      styles.pickerStudentName,
                      isSelected && styles.pickerStudentNameSelected,
                    ]}
                  >
                    {subject.name}
                  </Text>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
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
  // Filters row
  filtersRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 2,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  filterValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  filterDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31,41,51,0.45)",
  },
  // Bottom sheet
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerStudentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerStudentRowSelected: {
    backgroundColor: "#eef5fd",
  },
  pickerStudentName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  pickerStudentNameSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
});
