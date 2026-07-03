import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { teachersApi } from "../../api/teachers.api";
import { notesApi } from "../../api/notes.api";
import { useAuthStore } from "../../store/auth.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import type { UnderlineTabItem } from "../navigation/UnderlineTabs";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import {
  StudentSelectField,
  type StudentSelectOption,
} from "../discipline/StudentSelectField";
import type {
  TeacherClassroomOption,
  TeacherSchoolYearOption,
} from "../../types/teachers.types";
import { moduleBack } from "../../utils/moduleBack";

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = "students" | "class";

function buildMainTabs(t: TranslateFn): Array<UnderlineTabItem<MainTab>> {
  return [
    { key: "students", label: t("notes.admin.tabs.byStudent") },
    { key: "class", label: t("notes.admin.tabs.byClass") },
  ];
}

type StudentForDisplay = {
  id: string;
  firstName: string;
  lastName: string;
  classId: string;
  className: string;
};

function fullName(s: { firstName: string; lastName: string }): string {
  return `${s.lastName} ${s.firstName}`.trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SchoolAdminNotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug } = useAuthStore();

  const [tab, setTab] = useState<MainTab>("students");
  const [years, setYears] = useState<TeacherSchoolYearOption[]>([]);
  const [classrooms, setClassrooms] = useState<TeacherClassroomOption[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudents, setAllStudents] = useState<StudentForDisplay[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // ── Load school years + classrooms ────────────────────────────────────────

  const loadMeta = useCallback(async () => {
    if (!schoolSlug) return;
    setIsLoadingMeta(true);
    setMetaError(null);
    try {
      const [yrs, clrs] = await Promise.all([
        teachersApi.listSchoolYears(schoolSlug),
        teachersApi.listClassrooms(schoolSlug),
      ]);
      setYears(yrs);
      setClassrooms(clrs);
      const active = yrs.find((y) => y.isActive) ?? yrs[0];
      if (active) setSelectedYearId(active.id);
    } catch {
      setMetaError(t("notes.admin.error.loadFailed"));
    } finally {
      setIsLoadingMeta(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  // ── Load all students for the selected year (cross-class name search) ──────
  // Same pattern as SchoolAdminDisciplineScreen

  useEffect(() => {
    const yearClassrooms = selectedYearId
      ? classrooms.filter((c) => c.schoolYear.id === selectedYearId)
      : classrooms;
    if (!schoolSlug || yearClassrooms.length === 0) {
      setAllStudents([]);
      return;
    }
    let cancelled = false;
    setIsLoadingStudents(true);
    Promise.all(
      yearClassrooms.map((c) =>
        notesApi
          .getTeacherContext(schoolSlug, c.id)
          .then((ctx) =>
            ctx.students.map((s) => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              classId: c.id,
              className: c.name,
            })),
          )
          .catch(() => [] as StudentForDisplay[]),
      ),
    )
      .then((lists) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const merged = lists.flat().filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        merged.sort((a, b) => fullName(a).localeCompare(fullName(b)));
        setAllStudents(merged);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStudents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolSlug, classrooms, selectedYearId]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredClassrooms = useMemo(
    () =>
      selectedYearId
        ? classrooms.filter((c) => c.schoolYear.id === selectedYearId)
        : classrooms,
    [classrooms, selectedYearId],
  );

  const classOptions = useMemo<StudentSelectOption[]>(
    () => filteredClassrooms.map((c) => ({ value: c.id, label: c.name })),
    [filteredClassrooms],
  );

  const filteredStudents = useMemo<StudentForDisplay[]>(() => {
    const base = selectedClassId
      ? allStudents.filter((s) => s.classId === selectedClassId)
      : allStudents;
    const q = studentSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter((s) => fullName(s).toLowerCase().includes(q));
  }, [allStudents, selectedClassId, studentSearch]);

  const yearOptions = useMemo(
    () => years.map((y) => ({ value: y.id, label: y.label })),
    [years],
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  function navigateToStudent(student: StudentForDisplay) {
    router.push({
      pathname: "/(home)/notes/class/[classId]",
      params: { classId: student.classId, preStudentId: student.id },
    });
  }

  function navigateToClass(classId: string) {
    router.push({
      pathname: "/(home)/notes/class/[classId]",
      params: { classId },
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ModuleHeader
        title={t("notes.admin.title")}
        onBack={() => moduleBack(router)}
        testID="school-admin-notes-header"
        backTestID="school-admin-notes-back"
        titleTestID="school-admin-notes-title"
      />

      <UnderlineTabs
        items={buildMainTabs(t)}
        activeKey={tab}
        onSelect={setTab}
        testIDPrefix="school-admin-notes-tab"
      />

      {/* ── Onglet : Par élève ────────────────────────────────── */}
      {tab === "students" ? (
        <View style={styles.tabContent}>
          <View style={styles.filtersRow}>
            {yearOptions.length > 0 ? (
              <StudentSelectField
                label={t("notes.admin.filters.year")}
                value={selectedYearId}
                options={yearOptions}
                onChange={setSelectedYearId}
                allowEmpty={false}
                placeholder={t("notes.admin.filters.yearPlaceholder")}
                testIDPrefix="school-admin-notes-year"
              />
            ) : null}
            {classOptions.length > 0 ? (
              <StudentSelectField
                label={t("notes.admin.filters.class")}
                value={selectedClassId}
                options={classOptions}
                onChange={setSelectedClassId}
                allowEmpty
                emptyOptionLabel={t("notes.admin.filters.allClasses")}
                testIDPrefix="school-admin-notes-class-filter"
              />
            ) : null}
          </View>

          <View style={styles.searchRow} testID="school-admin-notes-search-bar">
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              value={studentSearch}
              onChangeText={setStudentSearch}
              placeholder={t("notes.admin.search.placeholder")}
              placeholderTextColor={colors.textSecondary}
              clearButtonMode="while-editing"
              testID="school-admin-notes-search-input"
            />
            {studentSearch.length > 0 ? (
              <TouchableOpacity
                onPress={() => setStudentSearch("")}
                testID="school-admin-notes-search-clear"
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {isLoadingMeta || isLoadingStudents ? (
            <View style={styles.centered}>
              <LoadingBlock label={t("notes.admin.loading.students")} />
            </View>
          ) : metaError ? (
            <View style={styles.centered}>
              <EmptyState
                icon="alert-circle-outline"
                title={t("notes.admin.error.title")}
                message={metaError}
              />
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.studentCard}
                  onPress={() => navigateToStudent(item)}
                  testID={`school-admin-notes-student-${item.id}`}
                >
                  <View style={styles.studentCardLeft}>
                    <Text style={styles.studentName}>{fullName(item)}</Text>
                    <Text style={styles.studentMeta}>{item.className}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <EmptyState
                    icon="people-outline"
                    title={
                      studentSearch
                        ? t("notes.admin.students.noResultTitle")
                        : t("notes.admin.students.emptyTitle")
                    }
                    message={
                      studentSearch
                        ? t("notes.admin.students.noResultMessage")
                        : t("notes.admin.students.emptyMessage")
                    }
                  />
                </View>
              }
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              testID="school-admin-notes-student-list"
            />
          )}
        </View>
      ) : null}

      {/* ── Onglet : Par classe ───────────────────────────────── */}
      {tab === "class" ? (
        <View style={styles.tabContent}>
          <View style={styles.filtersRow}>
            {yearOptions.length > 0 ? (
              <StudentSelectField
                label={t("notes.admin.filters.year")}
                value={selectedYearId}
                options={yearOptions}
                onChange={setSelectedYearId}
                allowEmpty={false}
                placeholder={t("notes.admin.filters.yearPlaceholder")}
                testIDPrefix="school-admin-notes-class-year"
              />
            ) : null}
          </View>

          {isLoadingMeta ? (
            <View style={styles.centered}>
              <LoadingBlock label={t("notes.admin.loading.classes")} />
            </View>
          ) : (
            <FlatList
              data={filteredClassrooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.classCard}
                  onPress={() => navigateToClass(item.id)}
                  testID={`school-admin-notes-class-${item.id}`}
                >
                  <View style={styles.classBadge}>
                    <Ionicons
                      name="school-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.classTextBlock}>
                    <Text style={styles.className}>{item.name}</Text>
                    <Text style={styles.classMeta}>
                      {item.schoolYear.label}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <EmptyState
                    icon="school-outline"
                    title={t("notes.admin.classes.emptyTitle")}
                    message={t("notes.admin.classes.emptyMessage")}
                  />
                </View>
              }
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              testID="school-admin-notes-class-list"
            />
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabContent: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", padding: 16 },
  filtersRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    gap: 10,
  },
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  studentCardLeft: { flex: 1, gap: 2 },
  studentName: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  studentMeta: { color: colors.textSecondary, fontSize: 12 },
  classCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  classBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eaf2fa",
    alignItems: "center",
    justifyContent: "center",
  },
  classTextBlock: { flex: 1, gap: 3 },
  className: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  classMeta: { color: colors.textSecondary, fontSize: 12 },
});
