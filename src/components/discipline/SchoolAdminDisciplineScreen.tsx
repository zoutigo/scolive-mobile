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
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useDisciplineStore } from "../../store/discipline.store";
import { teachersApi } from "../../api/teachers.api";
import { notesApi } from "../../api/notes.api";
import { disciplineApi } from "../../api/discipline.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import { DisciplineList } from "./DisciplineList";
import { DisciplineDeleteDialog } from "./DisciplineDeleteDialog";
import { DisciplineSummaryOverview } from "./DisciplineSummaryOverview";
import {
  StudentSelectField,
  type StudentSelectOption,
} from "./StudentSelectField";
import { TeacherClassDisciplineFormSheet } from "./TeacherClassDisciplineFormSheet";
import type {
  TeacherClassroomOption,
  TeacherSchoolYearOption,
} from "../../types/teachers.types";
import type { NotesTeacherContext } from "../../types/notes.types";
import type {
  CreateLifeEventPayload,
  StudentLifeEvent,
} from "../../types/discipline.types";

type StudentForDisplay = {
  id: string;
  firstName: string;
  lastName: string;
  classId?: string;
  className?: string;
};

// ── Tab types ─────────────────────────────────────────────────────────────────

type MainTab = "students" | "class";
type ClassTab = "events" | "carnets";

const MAIN_TAB_KEYS = [
  { key: "students" as const, labelKey: "discipline.adminTabs.students" },
  { key: "class" as const, labelKey: "discipline.adminTabs.byClass" },
];

const CLASS_TAB_KEYS = [
  { key: "events" as const, labelKey: "discipline.tabs.events" },
  { key: "carnets" as const, labelKey: "discipline.tabs.booklets" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fullName(s: { firstName: string; lastName: string }): string {
  return `${s.lastName} ${s.firstName}`.trim();
}

function sortEventsDesc(events: StudentLifeEvent[]): StudentLifeEvent[] {
  return [...events].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SchoolAdminDisciplineScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug, user } = useAuthStore();
  const {
    eventsMap,
    isRefreshing,
    replaceManyStudentEvents,
    addEvent,
    updateEvent,
    removeEvent,
    getSummary,
  } = useDisciplineStore();
  const showSuccess = useSuccessToastStore((s) => s.showSuccess);
  const showError = useSuccessToastStore((s) => s.showError);

  // ── Global state ───────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>("students");
  const [years, setYears] = useState<TeacherSchoolYearOption[]>([]);
  const [classrooms, setClassrooms] = useState<TeacherClassroomOption[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // ── Class context ──────────────────────────────────────────────────────────
  const [teacherContext, setTeacherContext] =
    useState<NotesTeacherContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // ── Students tab ──────────────────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState("");
  const [allStudentsForYear, setAllStudentsForYear] = useState<
    StudentForDisplay[]
  >([]);
  const [isLoadingAllStudents, setIsLoadingAllStudents] = useState(false);

  // ── Class tab ─────────────────────────────────────────────────────────────
  const [classTab, setClassTab] = useState<ClassTab>("events");
  const [eventStudentId, setEventStudentId] = useState("");
  const [carnetStudentId, setCarnetStudentId] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<StudentLifeEvent | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<StudentLifeEvent | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Load years + classrooms ────────────────────────────────────────────────
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
      setMetaError(t("discipline.errors.loadYearsClasses"));
    } finally {
      setIsLoadingMeta(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  // ── Background-load all students for year (enables cross-class name search) ─
  useEffect(() => {
    const yearClassrooms = selectedYearId
      ? classrooms.filter((c) => c.schoolYear.id === selectedYearId)
      : classrooms;
    if (!schoolSlug || yearClassrooms.length === 0) {
      setAllStudentsForYear([]);
      return;
    }
    let cancelled = false;
    setIsLoadingAllStudents(true);
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
        const all = lists.flat().filter((s) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        });
        setAllStudentsForYear(all);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAllStudents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolSlug, classrooms, selectedYearId]);

  // ── Load class context when class changes ──────────────────────────────────
  useEffect(() => {
    if (!schoolSlug || !selectedClassId) {
      setTeacherContext(null);
      setContextError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingContext(true);
    setContextError(null);
    setEventStudentId("");
    setCarnetStudentId("");

    notesApi
      .getTeacherContext(schoolSlug, selectedClassId)
      .then((ctx) => {
        if (!cancelled) setTeacherContext(ctx);
      })
      .catch(() => {
        if (!cancelled)
          setContextError(t("discipline.errors.loadClassStudents"));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingContext(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schoolSlug, selectedClassId]);

  // ── Load discipline events when context is ready ───────────────────────────
  const loadClassEvents = useCallback(
    async (forceRefresh = false) => {
      if (!schoolSlug || !selectedClassId || !teacherContext) return;
      const all = teacherContext.students;
      const toLoad = forceRefresh
        ? all
        : all.filter((s) => eventsMap[s.id] === undefined);
      if (toLoad.length === 0) return;

      setIsLoadingEvents(true);
      try {
        const results = await Promise.all(
          toLoad.map(async (s) => ({
            studentId: s.id,
            events: sortEventsDesc(
              await disciplineApi.list(schoolSlug, s.id, {
                scope: "current",
                classId: selectedClassId,
                schoolYearId: teacherContext.class.schoolYearId,
                limit: 200,
              }),
            ),
          })),
        );
        replaceManyStudentEvents(results);
      } catch {
        setContextError(t("discipline.errors.loadEvents"));
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [
      eventsMap,
      replaceManyStudentEvents,
      schoolSlug,
      selectedClassId,
      teacherContext,
    ],
  );

  useEffect(() => {
    if (!teacherContext) return;
    void loadClassEvents(false);
  }, [loadClassEvents, teacherContext]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredClassrooms = useMemo(
    () =>
      selectedYearId
        ? classrooms.filter((c) => c.schoolYear.id === selectedYearId)
        : classrooms,
    [classrooms, selectedYearId],
  );

  const students = useMemo(
    () =>
      [...(teacherContext?.students ?? [])].sort((a, b) =>
        fullName(a).localeCompare(fullName(b)),
      ),
    [teacherContext],
  );

  const studentOptions = useMemo<StudentSelectOption[]>(
    () => students.map((s) => ({ value: s.id, label: fullName(s) })),
    [students],
  );

  const studentNameById = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, fullName(s)])),
    [students],
  );

  const filteredStudents = useMemo<StudentForDisplay[]>(() => {
    const q = studentSearch.trim().toLowerCase();
    if (selectedClassId) {
      if (!q) return students;
      return students.filter((s) => fullName(s).toLowerCase().includes(q));
    }
    if (!q) return [];
    return allStudentsForYear.filter((s) =>
      fullName(s).toLowerCase().includes(q),
    );
  }, [studentSearch, students, selectedClassId, allStudentsForYear]);

  const classEvents = useMemo(() => {
    const ids =
      eventStudentId !== "" ? [eventStudentId] : students.map((s) => s.id);
    return sortEventsDesc(
      ids
        .flatMap((id) => eventsMap[id] ?? [])
        .filter((e) => (e.classId ?? selectedClassId) === selectedClassId),
    );
  }, [eventStudentId, eventsMap, selectedClassId, students]);

  const carnetEvents = useMemo(
    () =>
      carnetStudentId
        ? sortEventsDesc(
            (eventsMap[carnetStudentId] ?? []).filter(
              (e) => (e.classId ?? selectedClassId) === selectedClassId,
            ),
          )
        : [],
    [carnetStudentId, eventsMap, selectedClassId],
  );

  const carnetSummary = getSummary(carnetStudentId || undefined);

  const yearOptions = useMemo<StudentSelectOption[]>(
    () => years.map((y) => ({ value: y.id, label: y.label })),
    [years],
  );

  const classOptions = useMemo<StudentSelectOption[]>(
    () => filteredClassrooms.map((c) => ({ value: c.id, label: c.name })),
    [filteredClassrooms],
  );

  const selectedClassName =
    classrooms.find((c) => c.id === selectedClassId)?.name ?? null;

  const subtitle = user?.schoolName ?? null;

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  async function handleSubmitForm(input: {
    studentId: string;
    payload: CreateLifeEventPayload;
  }) {
    if (!schoolSlug) return;
    setIsSavingForm(true);
    setFormError(null);
    try {
      if (editingEvent) {
        const updated = await disciplineApi.update(
          schoolSlug,
          editingEvent.studentId,
          editingEvent.id,
          input.payload,
        );
        updateEvent(editingEvent.studentId, updated);
        showSuccess({
          title: t("discipline.toasts.eventUpdatedTitle"),
          message: t("discipline.toasts.eventUpdatedMessageClassUpdatedAlt"),
        });
      } else {
        const created = await disciplineApi.create(
          schoolSlug,
          input.studentId,
          input.payload,
        );
        addEvent(input.studentId, created);
        showSuccess({
          title: t("discipline.toasts.eventCreatedTitle"),
          message: t("discipline.toasts.eventCreatedMessageGlobal"),
        });
      }
      setFormVisible(false);
      setEditingEvent(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("discipline.errors.saveGeneric");
      setFormError(message);
      showError({ title: t("discipline.errors.saveTitle"), message });
    } finally {
      setIsSavingForm(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!schoolSlug || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await disciplineApi.remove(
        schoolSlug,
        deleteTarget.studentId,
        deleteTarget.id,
      );
      removeEvent(deleteTarget.studentId, deleteTarget.id);
      showSuccess({
        title: t("discipline.toasts.eventDeletedTitle"),
        message: t("discipline.toasts.eventDeletedMessageModule"),
      });
      setDeleteTarget(null);
    } catch (error) {
      showError({
        title: t("discipline.errors.deleteTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("discipline.errors.deleteGeneric"),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Student row (Élèves tab) ───────────────────────────────────────────────
  const renderStudentItem = useCallback(
    ({ item }: { item: StudentForDisplay }) => {
      const navClassName = selectedClassName ?? item.className ?? "";
      return (
        <TouchableOpacity
          style={styles.studentRow}
          onPress={() => {
            router.push({
              pathname: "/(home)/discipline-student/[studentId]",
              params: {
                studentId: item.id,
                studentName: fullName(item),
                className: navClassName,
              },
            });
          }}
          activeOpacity={0.75}
          testID={`student-row-${item.id}`}
        >
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>
              {item.firstName[0]}
              {item.lastName[0]}
            </Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{fullName(item)}</Text>
            {navClassName ? (
              <Text style={styles.studentClass}>{navClassName}</Text>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      );
    },
    [router, selectedClassName],
  );

  // ── Shared filter block ────────────────────────────────────────────────────
  const renderFilters = (context: "students" | "class") => (
    <View style={styles.filtersWrapper}>
      <SectionCard
        title={
          context === "students"
            ? t("discipline.sections.searchStudents.title")
            : t("discipline.sections.byClass.title")
        }
        subtitle={
          context === "students"
            ? t("discipline.sections.searchStudents.subtitle")
            : t("discipline.sections.byClass.subtitle")
        }
        testID={
          context === "students"
            ? "admin-discipline-students-filters"
            : "admin-discipline-class-filters"
        }
      >
        <StudentSelectField
          label={t("discipline.filters.year")}
          value={selectedYearId}
          options={yearOptions}
          onChange={(val) => {
            setSelectedYearId(val);
            setSelectedClassId("");
          }}
          allowEmpty={false}
          placeholder={t("discipline.filters.selectYear")}
          testIDPrefix={`admin-discipline-${context}-year`}
        />
        <StudentSelectField
          label={t("discipline.filters.class")}
          value={selectedClassId}
          options={classOptions}
          onChange={(val) => {
            setSelectedClassId(val);
            setStudentSearch("");
          }}
          allowEmpty={context === "students"}
          emptyOptionLabel={t("discipline.filters.allClasses")}
          placeholder={t("discipline.filters.selectClass")}
          testIDPrefix={`admin-discipline-${context}-class`}
        />
        {context === "students" ? (
          <View style={styles.searchRow}>
            <Ionicons
              name="search-outline"
              size={16}
              color={colors.textSecondary}
            />
            <TextInput
              value={studentSearch}
              onChangeText={setStudentSearch}
              placeholder={t("discipline.filters.searchByName")}
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              testID="admin-discipline-student-search"
            />
          </View>
        ) : null}
      </SectionCard>
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID="school-admin-discipline-screen"
    >
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={t("discipline.header.discipline")}
          subtitle={subtitle}
          onBack={() => router.back()}
          testID="admin-discipline-header"
          backTestID="admin-discipline-back"
          titleTestID="admin-discipline-title"
          subtitleTestID="admin-discipline-subtitle"
          topInset={insets.top}
        />
      </View>

      <UnderlineTabs
        items={MAIN_TAB_KEYS.map((item) => ({
          key: item.key,
          label: t(item.labelKey),
          badge:
            item.key === "class" && classEvents.length > 0
              ? classEvents.length
              : 0,
        }))}
        activeKey={mainTab}
        onSelect={setMainTab}
        testIDPrefix="admin-discipline-main-tab"
      />

      {metaError ? (
        <ErrorBanner message={metaError} testID="admin-discipline-meta-error" />
      ) : null}
      {contextError ? (
        <ErrorBanner
          message={contextError}
          testID="admin-discipline-context-error"
        />
      ) : null}

      {isLoadingMeta ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("discipline.loading.generic")} />
        </View>
      ) : mainTab === "students" ? (
        // ── Élèves tab ──────────────────────────────────────────────────────
        <View style={styles.body}>
          {renderFilters("students")}

          {!selectedClassId && !studentSearch.trim() ? (
            <View style={styles.centered}>
              <EmptyState
                icon="people-outline"
                title={t("discipline.empty.searchStudent.title")}
                message={t("discipline.empty.searchStudent.message")}
              />
            </View>
          ) : isLoadingContext || (!selectedClassId && isLoadingAllStudents) ? (
            <View style={styles.centered}>
              <LoadingBlock label={t("discipline.loading.students")} />
            </View>
          ) : filteredStudents.length === 0 ? (
            <View style={styles.centered}>
              <EmptyState
                icon="person-outline"
                title={t("discipline.empty.noStudent.title")}
                message={
                  studentSearch
                    ? t("discipline.empty.noStudent.messageSearch")
                    : t("discipline.empty.noStudent.messageClass")
                }
              />
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              renderItem={renderStudentItem}
              style={styles.studentList}
              contentContainerStyle={styles.studentListContent}
              testID="admin-discipline-student-list"
            />
          )}
        </View>
      ) : (
        // ── Par classe tab ───────────────────────────────────────────────────
        <View style={styles.body}>
          {renderFilters("class")}

          {!selectedClassId ? (
            <View style={styles.centered}>
              <EmptyState
                icon="book-outline"
                title={t("discipline.empty.chooseClass.title")}
                message={t("discipline.empty.chooseClass.message")}
              />
            </View>
          ) : isLoadingContext ? (
            <View style={styles.centered}>
              <LoadingBlock label={t("discipline.loading.class")} />
            </View>
          ) : (
            <View style={styles.body}>
              <UnderlineTabs
                items={CLASS_TAB_KEYS.map((item) => ({
                  key: item.key,
                  label: t(item.labelKey),
                  badge:
                    item.key === "events"
                      ? classEvents.length
                      : carnetStudentId
                        ? carnetEvents.length
                        : 0,
                }))}
                activeKey={classTab}
                onSelect={setClassTab}
                testIDPrefix="admin-discipline-class-tab"
              />

              {classTab === "events" ? (
                <View style={styles.body}>
                  <SectionCard
                    title={t("discipline.sections.classEvents.title")}
                    subtitle={t("discipline.sections.classEvents.subtitle")}
                    testID="admin-discipline-class-events-card"
                  >
                    <StudentSelectField
                      label={t("discipline.filters.student")}
                      value={eventStudentId}
                      options={studentOptions}
                      onChange={setEventStudentId}
                      allowEmpty
                      emptyOptionLabel={t("discipline.filters.allStudents")}
                      testIDPrefix="admin-discipline-class-event-student"
                    />
                  </SectionCard>

                  <DisciplineList
                    events={classEvents}
                    isLoading={isLoadingEvents}
                    isRefreshing={isRefreshing}
                    onRefresh={() => {
                      void loadClassEvents(true);
                    }}
                    emptyTitle={t("discipline.empty.noClassEvents.title")}
                    emptySub={t("discipline.empty.noClassEvents.message")}
                    showActions
                    getHeadline={(event) =>
                      studentNameById[event.studentId] ??
                      t("discipline.header.student")
                    }
                    canEdit={() => true}
                    canDelete={() => true}
                    onEdit={(event) => {
                      setEditingEvent(event);
                      setFormError(null);
                      setFormVisible(true);
                    }}
                    onDelete={(event) => setDeleteTarget(event)}
                    testID="admin-discipline-class-events-list"
                  />

                  <TouchableOpacity
                    style={[
                      styles.fab,
                      { bottom: insets.bottom + 18 + BOTTOM_TAB_BAR_HEIGHT },
                    ]}
                    onPress={() => {
                      setEditingEvent(null);
                      setFormError(null);
                      setFormVisible(true);
                    }}
                    testID="admin-discipline-fab"
                    accessibilityLabel={t("discipline.fab.addEvent")}
                  >
                    <Ionicons name="add" size={28} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.body}>
                  <SectionCard
                    title={t("discipline.sections.booklets.title")}
                    subtitle={t("discipline.sections.booklets.subtitle")}
                    testID="admin-discipline-class-carnets-card"
                  >
                    <StudentSelectField
                      label={t("discipline.filters.searchByStudent")}
                      value={carnetStudentId}
                      options={studentOptions}
                      onChange={setCarnetStudentId}
                      allowEmpty
                      emptyOptionLabel={t(
                        "discipline.studentSelect.placeholder",
                      )}
                      testIDPrefix="admin-discipline-class-carnet-student"
                    />
                  </SectionCard>

                  {carnetStudentId ? (
                    <DisciplineSummaryOverview
                      summary={carnetSummary}
                      events={carnetEvents}
                      isLoading={isLoadingEvents}
                      isRefreshing={isRefreshing}
                      onRefresh={() => {
                        void loadClassEvents(true);
                      }}
                      testID="admin-discipline-class-carnet-summary"
                    />
                  ) : (
                    <View style={styles.centered}>
                      <EmptyState
                        icon="people-outline"
                        title={t("discipline.empty.chooseStudent.title")}
                        message={t(
                          "discipline.empty.chooseStudentGlobal.message",
                        )}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <TeacherClassDisciplineFormSheet
        visible={formVisible}
        classId={selectedClassId}
        studentOptions={studentOptions}
        editing={editingEvent}
        isSaving={isSavingForm}
        error={formError}
        onClose={() => {
          setFormVisible(false);
          setEditingEvent(null);
          setFormError(null);
        }}
        onSubmit={(input) => {
          void handleSubmitForm(input);
        }}
      />

      <DisciplineDeleteDialog
        event={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    paddingHorizontal: 16,
  },
  body: {
    flex: 1,
  },
  filtersWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  // ── Student list ────────────────────────────────────────────────────────────
  studentList: {
    flex: 1,
  },
  studentListContent: {
    paddingVertical: 4,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
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
  studentInfo: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  studentClass: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ── Search row ──────────────────────────────────────────────────────────────
  searchRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },

  // ── FAB ─────────────────────────────────────────────────────────────────────
  fab: {
    position: "absolute",
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
