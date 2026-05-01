import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useDisciplineStore } from "../../store/discipline.store";
import { notesApi } from "../../api/notes.api";
import { timetableApi } from "../../api/timetable.api";
import { disciplineApi } from "../../api/discipline.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { useDrawer } from "../navigation/drawer-context";
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
import type { NotesTeacherContext } from "../../types/notes.types";
import type { ClassTimetableContextResponse } from "../../types/timetable.types";
import type {
  CreateLifeEventPayload,
  StudentLifeEvent,
} from "../../types/discipline.types";

type TabKey = "events" | "carnets";

const TABS = [
  { key: "events", label: "Événements" },
  { key: "carnets", label: "Carnets" },
] as const;

const POWER_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
]);

function fullStudentName(student: {
  firstName: string;
  lastName: string;
}): string {
  return `${student.lastName} ${student.firstName}`.trim();
}

function sortEventsDesc(events: StudentLifeEvent[]) {
  return [...events].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function canManageEvent(params: {
  event: StudentLifeEvent;
  userId?: string;
  role?: string | null;
  isReferent: boolean;
}) {
  if (!params.role) return false;
  if (POWER_ROLES.has(params.role)) return true;
  if (params.role !== "TEACHER") return false;
  return params.isReferent || params.event.authorUserId === params.userId;
}

export function TeacherClassDisciplineScreen() {
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
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
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("events");
  const [teacherContext, setTeacherContext] =
    useState<NotesTeacherContext | null>(null);
  const [classContext, setClassContext] =
    useState<ClassTimetableContextResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);

  const students = useMemo(
    () =>
      [...(teacherContext?.students ?? [])].sort((a, b) =>
        fullStudentName(a).localeCompare(fullStudentName(b)),
      ),
    [teacherContext?.students],
  );

  const studentOptions = useMemo<StudentSelectOption[]>(
    () =>
      students.map((student) => ({
        value: student.id,
        label: fullStudentName(student),
      })),
    [students],
  );

  const studentNameById = useMemo(
    () =>
      Object.fromEntries(
        students.map((student) => [student.id, fullStudentName(student)]),
      ),
    [students],
  );

  const isReferentTeacher =
    classContext?.class.referentTeacherUserId != null &&
    classContext.class.referentTeacherUserId === user?.id;

  const classEvents = useMemo(() => {
    const studentIds =
      eventStudentId !== ""
        ? [eventStudentId]
        : students.map((student) => student.id);
    const aggregated = studentIds.flatMap(
      (studentId) => eventsMap[studentId] ?? [],
    );
    return sortEventsDesc(
      aggregated.filter((event) => (event.classId ?? classId) === classId),
    );
  }, [classId, eventStudentId, eventsMap, students]);

  const carnetEvents = useMemo(
    () =>
      carnetStudentId
        ? sortEventsDesc(
            (eventsMap[carnetStudentId] ?? []).filter(
              (event) => (event.classId ?? classId) === classId,
            ),
          )
        : [],
    [carnetStudentId, classId, eventsMap],
  );

  const carnetSummary = getSummary(carnetStudentId || undefined);

  const hydrateClassData = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    setIsLoadingContext(true);
    setLoadError(null);
    try {
      const [notesContext, timetableContext] = await Promise.all([
        notesApi.getTeacherContext(schoolSlug, classId),
        timetableApi.getClassContext(schoolSlug, classId),
      ]);
      setTeacherContext(notesContext);
      setClassContext(timetableContext);
    } catch {
      setLoadError("Impossible de charger le contexte de discipline.");
    } finally {
      setIsLoadingContext(false);
    }
  }, [classId, schoolSlug]);

  const loadEvents = useCallback(
    async (forceRefresh = false) => {
      if (!schoolSlug || !classId || !teacherContext) return;
      const targetStudents = teacherContext.students;
      const shouldLoad = forceRefresh
        ? targetStudents
        : targetStudents.filter(
            (student) => eventsMap[student.id] === undefined,
          );

      if (shouldLoad.length === 0) return;

      setIsLoadingEvents(true);
      setLoadError(null);
      try {
        const results = await Promise.all(
          shouldLoad.map(async (student) => ({
            studentId: student.id,
            events: sortEventsDesc(
              await disciplineApi.list(schoolSlug, student.id, {
                scope: "current",
                classId,
                schoolYearId: teacherContext.class.schoolYearId,
                limit: 200,
              }),
            ),
          })),
        );
        replaceManyStudentEvents(results);
      } catch {
        setLoadError("Impossible de charger les événements de discipline.");
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [classId, eventsMap, replaceManyStudentEvents, schoolSlug, teacherContext],
  );

  useEffect(() => {
    void hydrateClassData();
  }, [hydrateClassData]);

  useEffect(() => {
    if (!teacherContext) return;
    void loadEvents(false);
  }, [loadEvents, teacherContext]);

  const refreshAll = useCallback(async () => {
    await loadEvents(true);
  }, [loadEvents]);

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
          title: "Événement modifié",
          message: "La fiche discipline a bien été mise à jour.",
        });
      } else {
        const created = await disciplineApi.create(
          schoolSlug,
          input.studentId,
          input.payload,
        );
        addEvent(input.studentId, created);
        setEventStudentId((current) => current);
        showSuccess({
          title: "Événement créé",
          message: "L'événement a été ajouté à l'historique de classe.",
        });
      }
      setFormVisible(false);
      setEditingEvent(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer cet événement.";
      setFormError(message);
      showError({
        title: "Enregistrement impossible",
        message,
      });
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
        title: "Événement supprimé",
        message: "L'événement a été retiré du module discipline.",
      });
      setDeleteTarget(null);
    } catch (error) {
      showError({
        title: "Suppression impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer cet événement.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const subtitle = teacherContext?.class.name
    ? [user?.schoolName, teacherContext.class.name].filter(Boolean).join(" · ")
    : (user?.schoolName ?? null);

  return (
    <View style={styles.root} testID="teacher-class-discipline-screen">
      <View style={styles.headerWrap}>
        <ModuleHeader
          title="Discipline"
          subtitle={subtitle}
          onBack={() => router.back()}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
          testID="teacher-class-discipline-header"
          backTestID="teacher-class-discipline-back"
          rightTestID="teacher-class-discipline-menu"
          topInset={insets.top}
        />
      </View>

      <UnderlineTabs
        items={TABS.map((item) => ({
          ...item,
          badge:
            item.key === "events"
              ? classEvents.length
              : carnetStudentId
                ? carnetEvents.length
                : 0,
        }))}
        activeKey={tab}
        onSelect={setTab}
        testIDPrefix="teacher-class-discipline-tab"
      />

      {loadError ? <ErrorBanner message={loadError} /> : null}

      {isLoadingContext && !teacherContext ? (
        <View style={styles.centered}>
          <LoadingBlock label="Chargement de la discipline..." />
        </View>
      ) : !teacherContext ? (
        <View style={styles.centered}>
          <EmptyState
            icon="shield-outline"
            title="Discipline indisponible"
            message="Le contexte de classe n'a pas pu être résolu."
          />
        </View>
      ) : tab === "events" ? (
        <View style={styles.body}>
          <SectionCard
            title="Événements de classe"
            subtitle="Parcourez et filtrez l'historique du plus récent au plus ancien."
            testID="teacher-class-discipline-events-card"
          >
            <StudentSelectField
              label="Élève"
              value={eventStudentId}
              options={studentOptions}
              onChange={setEventStudentId}
              allowEmpty
              emptyOptionLabel="Tous les élèves"
              testIDPrefix="teacher-class-discipline-events-student"
            />
          </SectionCard>

          <DisciplineList
            events={classEvents}
            isLoading={isLoadingEvents}
            isRefreshing={isRefreshing}
            onRefresh={() => {
              void refreshAll();
            }}
            emptyTitle="Aucun événement de discipline"
            emptySub="Aucun événement n'a encore été saisi pour cette classe."
            showActions
            getHeadline={(event) => studentNameById[event.studentId] ?? "Élève"}
            canEdit={(event) =>
              canManageEvent({
                event,
                userId: user?.id,
                role: user?.activeRole ?? user?.role,
                isReferent: Boolean(isReferentTeacher),
              })
            }
            canDelete={(event) =>
              canManageEvent({
                event,
                userId: user?.id,
                role: user?.activeRole ?? user?.role,
                isReferent: Boolean(isReferentTeacher),
              })
            }
            onEdit={(event) => {
              setEditingEvent(event);
              setFormError(null);
              setFormVisible(true);
            }}
            onDelete={(event) => setDeleteTarget(event)}
            testID="teacher-class-discipline-events-list"
          />

          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + 18 }]}
            onPress={() => {
              setEditingEvent(null);
              setFormError(null);
              setFormVisible(true);
            }}
            testID="teacher-class-discipline-fab"
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.body}>
          <SectionCard
            title="Carnets"
            subtitle="Sélectionnez un élève pour afficher sa synthèse vie scolaire."
            testID="teacher-class-discipline-carnets-card"
          >
            <StudentSelectField
              label="Recherche par élève"
              value={carnetStudentId}
              options={studentOptions}
              onChange={setCarnetStudentId}
              allowEmpty
              emptyOptionLabel="Choisir un élève"
              testIDPrefix="teacher-class-discipline-carnets-student"
            />
          </SectionCard>

          {carnetStudentId ? (
            <DisciplineSummaryOverview
              summary={carnetSummary}
              events={carnetEvents}
              isLoading={isLoadingEvents}
              isRefreshing={isRefreshing}
              onRefresh={() => {
                void refreshAll();
              }}
              testID="teacher-class-discipline-carnet-summary"
            />
          ) : (
            <View style={styles.centered}>
              <EmptyState
                icon="people-outline"
                title="Choisissez un élève"
                message="La synthèse vie scolaire apparaît ici après sélection d'un élève de la classe."
              />
            </View>
          )}
        </View>
      )}

      <TeacherClassDisciplineFormSheet
        visible={formVisible}
        classId={classId}
        studentOptions={studentOptions}
        editing={editingEvent}
        isSaving={isSavingForm}
        error={formError}
        onClose={() => {
          setFormVisible(false);
          setEditingEvent(null);
          setFormError(null);
        }}
        onSubmit={handleSubmitForm}
      />

      <DisciplineDeleteDialog
        event={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </View>
  );
}

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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
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
