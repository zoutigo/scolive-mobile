import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTimetableStore } from "../../store/timetable.store";
import { TimePickerField } from "../TimePickerField";
import { getViewType } from "../navigation/nav-config";
import { ModuleHeader } from "../navigation/ModuleHeader";
import {
  buildDefaultDateRange,
  formatHumanDate,
  fullTeacherName,
  minuteToTimeLabel,
  timeLabelToMinute,
} from "../../utils/timetable";
import type {
  TimetableCalendarEvent,
  TimetableOneOffSlot,
  TimetableRecurringSlot,
} from "../../types/timetable.types";
import {
  CalendarEventList,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  MiniIdentityCard,
  OccurrencesAgenda,
  PillSelector,
  SectionCard,
  TextField,
} from "./TimetableCommon";

type TabKey = "agenda" | "slots" | "oneoff" | "holidays";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

const slotSchema = z.object({
  subjectId: z.string().min(1, "Choisissez une matière."),
  teacherUserId: z.string().min(1, "Choisissez un enseignant."),
  weekday: z.string(),
  start: z.string().regex(TIME_REGEX, "Format HH:MM attendu."),
  end: z.string().regex(TIME_REGEX, "Format HH:MM attendu."),
  room: z.string(),
  activeFromDate: z.string().regex(ISO_DATE_REGEX, "Format AAAA-MM-JJ attendu."),
  activeToDate: z.string().regex(ISO_DATE_REGEX, "Format AAAA-MM-JJ attendu."),
});

const oneOffSchema = z.object({
  subjectId: z.string().min(1, "Choisissez une matière."),
  teacherUserId: z.string().min(1, "Choisissez un enseignant."),
  occurrenceDate: z.string().regex(ISO_DATE_REGEX, "Format AAAA-MM-JJ attendu."),
  start: z.string().regex(TIME_REGEX, "Format HH:MM attendu."),
  end: z.string().regex(TIME_REGEX, "Format HH:MM attendu."),
  room: z.string(),
  status: z.enum(["PLANNED", "CANCELLED"]),
});

const holidaySchema = z.object({
  label: z.string().trim().min(1, "Le libellé de fermeture est obligatoire."),
  startDate: z.string().regex(ISO_DATE_REGEX, "Format AAAA-MM-JJ attendu."),
  endDate: z.string().regex(ISO_DATE_REGEX, "Format AAAA-MM-JJ attendu."),
});

type SlotValues = z.infer<typeof slotSchema>;
type OneOffValues = z.infer<typeof oneOffSchema>;
type HolidayValues = z.infer<typeof holidaySchema>;

function parseMinuteOrThrow(value: string, fieldLabel: string): number {
  const parsed = timeLabelToMinute(value);
  if (parsed === null) {
    throw new Error(`${fieldLabel} doit être au format HH:MM.`);
  }
  return parsed;
}

function firstAssignmentForSubject(
  assignments: Array<{
    subjectId: string;
    teacherUserId: string;
  }>,
  subjectId: string,
) {
  return assignments.find((entry) => entry.subjectId === subjectId);
}

export function ClassTimetableManagerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    classId?: string;
    schoolYearId?: string;
  }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const initialSchoolYearId =
    typeof params.schoolYearId === "string" ? params.schoolYearId : undefined;
  const { schoolSlug, user } = useAuthStore();
  const {
    classContext,
    classTimetable,
    isLoadingClassContext,
    isLoadingClassTimetable,
    isSubmitting,
    errorMessage,
    loadClassContext,
    loadClassTimetable,
    createRecurringSlot,
    updateRecurringSlot,
    deleteRecurringSlot,
    createOneOffSlot,
    updateOneOffSlot,
    deleteOneOffSlot,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    clearError,
  } = useTimetableStore();
  const showToast = useSuccessToastStore((state) => state.show);
  const viewType = user ? getViewType(user) : "unknown";
  const canManageCalendarEvents = viewType === "school";

  const [tab, setTab] = useState<TabKey>("agenda");
  const [range] = useState(buildDefaultDateRange());

  // Editing IDs — tracked outside RHF since they're not validated fields
  const [slotEditId, setSlotEditId] = useState("");
  const [oneOffEditId, setOneOffEditId] = useState("");
  const [holidayEditId, setHolidayEditId] = useState("");

  const slotRhf = useForm<SlotValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(slotSchema),
    defaultValues: {
      subjectId: "",
      teacherUserId: "",
      weekday: "1",
      start: "07:30",
      end: "08:20",
      room: "",
      activeFromDate: range.fromDate,
      activeToDate: range.toDate,
    },
  });

  const oneOffRhf = useForm<OneOffValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(oneOffSchema),
    defaultValues: {
      subjectId: "",
      teacherUserId: "",
      occurrenceDate: range.fromDate,
      start: "10:00",
      end: "10:50",
      room: "",
      status: "PLANNED",
    },
  });

  const holidayRhf = useForm<HolidayValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      label: "",
      startDate: range.fromDate,
      endDate: range.toDate,
    },
  });

  const slotSubjectId = slotRhf.watch("subjectId");

  const load = useCallback(async () => {
    if (!schoolSlug || !classId) return;
    const context = await loadClassContext(
      schoolSlug,
      classId,
      initialSchoolYearId,
    );
    await loadClassTimetable(schoolSlug, classId, {
      schoolYearId: context.selectedSchoolYearId ?? initialSchoolYearId,
      fromDate: range.fromDate,
      toDate: range.toDate,
    });

    if (!slotRhf.getValues("subjectId") && context.assignments.length > 0) {
      const first = context.assignments[0];
      slotRhf.setValue("subjectId", first.subjectId);
      slotRhf.setValue("teacherUserId", first.teacherUserId);
      oneOffRhf.setValue("subjectId", first.subjectId);
      oneOffRhf.setValue("teacherUserId", first.teacherUserId);
    }
  }, [
    classId,
    initialSchoolYearId,
    loadClassContext,
    loadClassTimetable,
    oneOffRhf,
    range.fromDate,
    range.toDate,
    schoolSlug,
    slotRhf,
  ]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const subjectOptions = useMemo(
    () =>
      (classContext?.allowedSubjects ?? []).map((subject) => ({
        value: subject.id,
        label: subject.name,
      })),
    [classContext?.allowedSubjects],
  );

  const teacherOptions = useMemo(() => {
    const teachers = new Map<string, string>();
    (classContext?.assignments ?? []).forEach((assignment) => {
      teachers.set(
        assignment.teacherUserId,
        fullTeacherName(assignment.teacherUser),
      );
    });
    return Array.from(teachers.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [classContext?.assignments]);

  const subjectScopedTeachers = useMemo(() => {
    if (!classContext) return teacherOptions;
    const filtered = classContext.assignments
      .filter((assignment) => assignment.subjectId === slotSubjectId)
      .map((assignment) => ({
        value: assignment.teacherUserId,
        label: fullTeacherName(assignment.teacherUser),
      }));
    return filtered.length > 0 ? filtered : teacherOptions;
  }, [classContext, slotSubjectId, teacherOptions]);

  function resetSlotForm() {
    const assignment =
      classContext?.assignments[0] &&
      firstAssignmentForSubject(
        classContext.assignments,
        classContext.assignments[0].subjectId,
      );
    setSlotEditId("");
    slotRhf.reset({
      subjectId: assignment?.subjectId ?? "",
      teacherUserId: assignment?.teacherUserId ?? "",
      weekday: "1",
      start: "07:30",
      end: "08:20",
      room: "",
      activeFromDate: range.fromDate,
      activeToDate: range.toDate,
    });
  }

  function resetOneOffForm() {
    const assignment = classContext?.assignments[0];
    setOneOffEditId("");
    oneOffRhf.reset({
      subjectId: assignment?.subjectId ?? "",
      teacherUserId: assignment?.teacherUserId ?? "",
      occurrenceDate: range.fromDate,
      start: "10:00",
      end: "10:50",
      room: "",
      status: "PLANNED",
    });
  }

  function resetHolidayForm() {
    setHolidayEditId("");
    holidayRhf.reset({
      label: "",
      startDate: range.fromDate,
      endDate: range.toDate,
    });
  }

  const handleSaveRecurringSlot = slotRhf.handleSubmit(
    async (data: SlotValues) => {
      if (!schoolSlug || !classId || !classContext) return;
      try {
        const payload = {
          schoolYearId:
            classContext.selectedSchoolYearId ?? classContext.class.schoolYearId,
          weekday: Number(data.weekday),
          startMinute: parseMinuteOrThrow(data.start, "Début"),
          endMinute: parseMinuteOrThrow(data.end, "Fin"),
          subjectId: data.subjectId,
          teacherUserId: data.teacherUserId,
          room: data.room.trim() || null,
          activeFromDate: data.activeFromDate,
          activeToDate: data.activeToDate,
        };
        if (slotEditId) {
          await updateRecurringSlot(schoolSlug, slotEditId, payload);
          showToast({
            variant: "success",
            title: "Créneau mis à jour",
            message: "Le planning hebdomadaire a été actualisé.",
          });
        } else {
          await createRecurringSlot(schoolSlug, classId, payload);
          showToast({
            variant: "success",
            title: "Créneau ajouté",
            message: "Le nouveau cours apparaît maintenant dans l'agenda.",
          });
        }
        resetSlotForm();
        await load();
      } catch (error) {
        showToast({
          variant: "error",
          title: "Créneau refusé",
          message:
            error instanceof Error
              ? error.message
              : "Impossible d'enregistrer ce créneau.",
        });
      }
    },
  );

  const handleSaveOneOffSlot = oneOffRhf.handleSubmit(
    async (data: OneOffValues) => {
      if (!schoolSlug || !classId || !classContext) return;
      try {
        const payload = {
          schoolYearId:
            classContext.selectedSchoolYearId ?? classContext.class.schoolYearId,
          occurrenceDate: data.occurrenceDate,
          startMinute: parseMinuteOrThrow(data.start, "Début"),
          endMinute: parseMinuteOrThrow(data.end, "Fin"),
          subjectId: data.subjectId,
          teacherUserId: data.teacherUserId,
          room: data.room.trim() || null,
          status: data.status,
        };
        if (oneOffEditId) {
          await updateOneOffSlot(schoolSlug, oneOffEditId, payload);
          showToast({
            variant: "success",
            title: "Séance modifiée",
            message: "L'exception de planning a été mise à jour.",
          });
        } else {
          await createOneOffSlot(schoolSlug, classId, payload);
          showToast({
            variant: "success",
            title: "Séance exceptionnelle ajoutée",
            message: "Le créneau ponctuel apparaît maintenant dans l'agenda.",
          });
        }
        resetOneOffForm();
        await load();
      } catch (error) {
        showToast({
          variant: "error",
          title: "Séance non enregistrée",
          message:
            error instanceof Error
              ? error.message
              : "Impossible d'enregistrer cette séance.",
        });
      }
    },
  );

  const handleSaveHoliday = holidayRhf.handleSubmit(
    async (data: HolidayValues) => {
      if (!schoolSlug || !classContext) return;
      try {
        const payload = {
          schoolYearId:
            classContext.selectedSchoolYearId ?? classContext.class.schoolYearId,
          label: data.label.trim(),
          startDate: data.startDate,
          endDate: data.endDate,
          scope: "SCHOOL" as const,
        };
        if (holidayEditId) {
          await updateCalendarEvent(schoolSlug, holidayEditId, payload);
          showToast({
            variant: "success",
            title: "Fermeture mise à jour",
            message: "Le calendrier école a été actualisé.",
          });
        } else {
          await createCalendarEvent(schoolSlug, payload);
          showToast({
            variant: "success",
            title: "Fermeture ajoutée",
            message: "Le calendrier de l'école a été mis à jour.",
          });
        }
        resetHolidayForm();
        await load();
      } catch (error) {
        showToast({
          variant: "error",
          title: "Fermeture refusée",
          message:
            error instanceof Error
              ? error.message
              : "Impossible d'enregistrer cette fermeture.",
        });
      }
    },
  );

  async function handleDeleteRecurringSlot(slot: TimetableRecurringSlot) {
    if (!schoolSlug) return;
    try {
      await deleteRecurringSlot(schoolSlug, slot.id);
      showToast({
        variant: "success",
        title: "Créneau supprimé",
        message: "Le cours hebdomadaire ne fait plus partie du planning.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Suppression impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer ce créneau.",
      });
    }
  }

  async function handleDeleteOneOffSlot(slot: TimetableOneOffSlot) {
    if (!schoolSlug) return;
    try {
      await deleteOneOffSlot(schoolSlug, slot.id);
      showToast({
        variant: "success",
        title: "Séance supprimée",
        message: "Le créneau ponctuel ne figure plus dans l'agenda.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Suppression impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer cette séance.",
      });
    }
  }

  async function handleDeleteHoliday(event: TimetableCalendarEvent) {
    if (!schoolSlug) return;
    try {
      await deleteCalendarEvent(schoolSlug, event.id);
      showToast({
        variant: "success",
        title: "Fermeture supprimée",
        message: "Le calendrier école a été mis à jour.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Suppression impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer cette fermeture.",
      });
    }
  }

  function fillRecurringSlot(slot: TimetableRecurringSlot) {
    setTab("slots");
    setSlotEditId(slot.id);
    slotRhf.reset({
      subjectId: slot.subject.id,
      teacherUserId: slot.teacherUser.id,
      weekday: String(slot.weekday),
      start: minuteToTimeLabel(slot.startMinute),
      end: minuteToTimeLabel(slot.endMinute),
      room: slot.room ?? "",
      activeFromDate: slot.activeFromDate ?? range.fromDate,
      activeToDate: slot.activeToDate ?? range.toDate,
    });
  }

  function fillOneOffSlot(slot: TimetableOneOffSlot) {
    setTab("oneoff");
    setOneOffEditId(slot.id);
    oneOffRhf.reset({
      subjectId: slot.subject.id,
      teacherUserId: slot.teacherUser.id,
      occurrenceDate: slot.occurrenceDate,
      start: minuteToTimeLabel(slot.startMinute),
      end: minuteToTimeLabel(slot.endMinute),
      room: slot.room ?? "",
      status: slot.status,
    });
  }

  function fillHoliday(event: TimetableCalendarEvent) {
    setTab("holidays");
    setHolidayEditId(event.id);
    holidayRhf.reset({
      label: event.label,
      startDate: event.startDate,
      endDate: event.endDate,
    });
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={classContext?.class.name ?? "Emploi du temps"}
        subtitle="Emploi du temps de la classe"
        onBack={() => router.back()}
        topInset={insets.top}
        testID="class-timetable-header"
        backTestID="class-timetable-back-btn"
        titleTestID="class-timetable-title"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.root}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingClassContext || isLoadingClassTimetable}
              onRefresh={() => {
                clearError();
                void load().catch(() => {});
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

          {classContext ? (
            <MiniIdentityCard
              title={classContext.class.name}
              subtitle={`${classContext.selectedSchoolYearId ?? classContext.class.schoolYearId} • ${formatHumanDate(range.fromDate)} au ${formatHumanDate(range.toDate)}`}
              accent={colors.primary}
            />
          ) : null}

          <SectionCard
            title="Navigation"
            subtitle="Passez du planning visualisé aux formulaires de gestion."
          >
            <PillSelector
              label="Onglet"
              value={tab}
              onChange={(value) => setTab(value as TabKey)}
              options={[
                { value: "agenda", label: "Agenda" },
                { value: "slots", label: "Créneaux" },
                { value: "oneoff", label: "Exceptions" },
                ...(canManageCalendarEvents
                  ? [{ value: "holidays", label: "Fermetures" }]
                  : []),
              ]}
              testIDPrefix="class-timetable-tab"
            />
          </SectionCard>

          {isLoadingClassContext || isLoadingClassTimetable ? (
            <SectionCard title="Chargement">
              <LoadingBlock label="Chargement de la classe..." />
            </SectionCard>
          ) : !classContext || !classTimetable ? (
            <SectionCard title="Accès">
              <EmptyState
                icon="lock-closed-outline"
                title="Classe indisponible"
                message="Le backend n'autorise peut-être pas la gestion de cette classe pour votre rôle."
              />
            </SectionCard>
          ) : tab === "agenda" ? (
            <SectionCard
              title="Agenda consolidé"
              subtitle="Vue unifiée des créneaux récurrents, ajustements et annulations."
            >
              <OccurrencesAgenda
                occurrences={classTimetable.occurrences}
                subjectStyles={classTimetable.subjectStyles}
                emptyTitle="Aucun créneau chargé"
                emptyMessage="Commencez par ajouter un créneau ou élargir la période côté écran."
                testID="class-timetable-occurrences"
              />
            </SectionCard>
          ) : tab === "slots" ? (
            <>
              <SectionCard
                title={slotEditId ? "Modifier un créneau" : "Nouveau créneau hebdomadaire"}
                subtitle="Le formulaire reste scrollable pour laisser de la place au clavier et sécuriser la saisie E2E."
              >
                <Controller
                  control={slotRhf.control}
                  name="subjectId"
                  render={({ field }) => (
                    <PillSelector
                      label="Matière"
                      value={field.value}
                      onChange={(subjectId) => {
                        const assignment =
                          classContext.assignments.find(
                            (entry) => entry.subjectId === subjectId,
                          ) ?? classContext.assignments[0];
                        field.onChange(subjectId);
                        slotRhf.setValue(
                          "teacherUserId",
                          assignment?.teacherUserId ?? field.value,
                        );
                      }}
                      options={subjectOptions}
                    />
                  )}
                />
                <Controller
                  control={slotRhf.control}
                  name="teacherUserId"
                  render={({ field }) => (
                    <PillSelector
                      label="Enseignant"
                      value={field.value}
                      onChange={field.onChange}
                      options={subjectScopedTeachers}
                    />
                  )}
                />
                <Controller
                  control={slotRhf.control}
                  name="weekday"
                  render={({ field }) => (
                    <PillSelector
                      label="Jour"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "1", label: "Lun" },
                        { value: "2", label: "Mar" },
                        { value: "3", label: "Mer" },
                        { value: "4", label: "Jeu" },
                        { value: "5", label: "Ven" },
                        { value: "6", label: "Sam" },
                        { value: "7", label: "Dim" },
                      ]}
                    />
                  )}
                />
                <View style={styles.row}>
                  <View style={styles.rowField}>
                    <Text style={styles.rowFieldLabel}>Début</Text>
                    <Controller
                      control={slotRhf.control}
                      name="start"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title="Heure de début"
                          placeholder="07:30"
                          testID="slot-form-start"
                        />
                      )}
                    />
                  </View>
                  <View style={styles.rowField}>
                    <Text style={styles.rowFieldLabel}>Fin</Text>
                    <Controller
                      control={slotRhf.control}
                      name="end"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title="Heure de fin"
                          placeholder="08:20"
                          testID="slot-form-end"
                        />
                      )}
                    />
                  </View>
                </View>
                <Controller
                  control={slotRhf.control}
                  name="room"
                  render={({ field }) => (
                    <TextField
                      label="Salle"
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Salle A2"
                      testID="slot-form-room"
                    />
                  )}
                />
                <View style={styles.row}>
                  <Controller
                    control={slotRhf.control}
                    name="activeFromDate"
                    render={({ field, fieldState }) => (
                      <View style={{ flex: 1 }}>
                        <TextField
                          label="Actif du"
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder="AAAA-MM-JJ"
                          hasError={!!fieldState.error}
                        />
                        {fieldState.error ? (
                          <Text style={styles.fieldError}>
                            {fieldState.error.message}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  />
                  <Controller
                    control={slotRhf.control}
                    name="activeToDate"
                    render={({ field, fieldState }) => (
                      <View style={{ flex: 1 }}>
                        <TextField
                          label="Actif au"
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder="AAAA-MM-JJ"
                          hasError={!!fieldState.error}
                        />
                        {fieldState.error ? (
                          <Text style={styles.fieldError}>
                            {fieldState.error.message}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  />
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => void handleSaveRecurringSlot()}
                    disabled={isSubmitting}
                    testID="slot-form-submit"
                  >
                    <Text style={styles.primaryButtonText}>
                      {slotEditId ? "Mettre à jour" : "Ajouter le créneau"}
                    </Text>
                  </TouchableOpacity>
                  {slotEditId ? (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={resetSlotForm}
                    >
                      <Text style={styles.secondaryButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SectionCard>

              <SectionCard
                title="Créneaux existants"
                subtitle="Chaque ligne peut être modifiée ou supprimée."
              >
                {classTimetable.slots.length === 0 ? (
                  <EmptyState
                    icon="time-outline"
                    title="Pas encore de créneau récurrent"
                    message="Ajoutez le premier cours hebdomadaire pour cette classe."
                  />
                ) : (
                  <View style={styles.list}>
                    {classTimetable.slots.map((slot) => (
                      <View key={slot.id} style={styles.entryRow}>
                        <View style={styles.entryBody}>
                          <Text style={styles.entryTitle}>
                            {slot.subject.name} •{" "}
                            {minuteToTimeLabel(slot.startMinute)}-
                            {minuteToTimeLabel(slot.endMinute)}
                          </Text>
                          <Text style={styles.entryMeta}>
                            {fullTeacherName(slot.teacherUser)} • jour{" "}
                            {slot.weekday} •{" "}
                            {slot.room?.trim()
                              ? slot.room
                              : "Salle à confirmer"}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => fillRecurringSlot(slot)}
                          testID={`slot-edit-${slot.id}`}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => void handleDeleteRecurringSlot(slot)}
                          testID={`slot-delete-${slot.id}`}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.notification}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            </>
          ) : tab === "oneoff" ? (
            <>
              <SectionCard
                title={oneOffEditId ? "Modifier une séance" : "Nouvelle séance ponctuelle"}
                subtitle="Utilisez cet onglet pour les permutations, remplacements et cours exceptionnels."
              >
                <Controller
                  control={oneOffRhf.control}
                  name="subjectId"
                  render={({ field }) => (
                    <PillSelector
                      label="Matière"
                      value={field.value}
                      onChange={(subjectId) => {
                        const assignment =
                          classContext.assignments.find(
                            (entry) => entry.subjectId === subjectId,
                          ) ?? classContext.assignments[0];
                        field.onChange(subjectId);
                        oneOffRhf.setValue(
                          "teacherUserId",
                          assignment?.teacherUserId ?? field.value,
                        );
                      }}
                      options={subjectOptions}
                    />
                  )}
                />
                <Controller
                  control={oneOffRhf.control}
                  name="teacherUserId"
                  render={({ field }) => (
                    <PillSelector
                      label="Enseignant"
                      value={field.value}
                      onChange={field.onChange}
                      options={teacherOptions}
                    />
                  )}
                />
                <Controller
                  control={oneOffRhf.control}
                  name="occurrenceDate"
                  render={({ field, fieldState }) => (
                    <>
                      <TextField
                        label="Date"
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder="AAAA-MM-JJ"
                        hasError={!!fieldState.error}
                        testID="oneoff-form-date"
                      />
                      {fieldState.error ? (
                        <Text style={styles.fieldError}>
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </>
                  )}
                />
                <View style={styles.row}>
                  <View style={styles.rowField}>
                    <Text style={styles.rowFieldLabel}>Début</Text>
                    <Controller
                      control={oneOffRhf.control}
                      name="start"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title="Heure de début"
                          placeholder="10:00"
                          testID="oneoff-form-start"
                        />
                      )}
                    />
                  </View>
                  <View style={styles.rowField}>
                    <Text style={styles.rowFieldLabel}>Fin</Text>
                    <Controller
                      control={oneOffRhf.control}
                      name="end"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title="Heure de fin"
                          placeholder="10:50"
                          testID="oneoff-form-end"
                        />
                      )}
                    />
                  </View>
                </View>
                <Controller
                  control={oneOffRhf.control}
                  name="room"
                  render={({ field }) => (
                    <TextField
                      label="Salle"
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Salle polyvalente"
                    />
                  )}
                />
                <Controller
                  control={oneOffRhf.control}
                  name="status"
                  render={({ field }) => (
                    <PillSelector
                      label="Statut"
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: "PLANNED", label: "Prévu" },
                        { value: "CANCELLED", label: "Annulé" },
                      ]}
                    />
                  )}
                />
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => void handleSaveOneOffSlot()}
                    disabled={isSubmitting}
                    testID="oneoff-form-submit"
                  >
                    <Text style={styles.primaryButtonText}>
                      {oneOffEditId ? "Mettre à jour" : "Ajouter la séance"}
                    </Text>
                  </TouchableOpacity>
                  {oneOffEditId ? (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={resetOneOffForm}
                    >
                      <Text style={styles.secondaryButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SectionCard>

              <SectionCard
                title="Séances ponctuelles"
                subtitle="Historique des exceptions déjà créées pour cette classe."
              >
                {classTimetable.oneOffSlots.length === 0 ? (
                  <EmptyState
                    icon="flash-outline"
                    title="Aucune exception"
                    message="Les cours ponctuels, reports et annulations apparaîtront ici."
                  />
                ) : (
                  <View style={styles.list}>
                    {classTimetable.oneOffSlots.map((slot) => (
                      <View key={slot.id} style={styles.entryRow}>
                        <View style={styles.entryBody}>
                          <Text style={styles.entryTitle}>
                            {slot.subject.name} •{" "}
                            {formatHumanDate(slot.occurrenceDate)}
                          </Text>
                          <Text style={styles.entryMeta}>
                            {minuteToTimeLabel(slot.startMinute)}-
                            {minuteToTimeLabel(slot.endMinute)} • {slot.status}{" "}
                            •{" "}
                            {slot.room?.trim()
                              ? slot.room
                              : "Salle à confirmer"}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => fillOneOffSlot(slot)}
                          testID={`oneoff-edit-${slot.id}`}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => void handleDeleteOneOffSlot(slot)}
                          testID={`oneoff-delete-${slot.id}`}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.notification}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            </>
          ) : (
            <>
              <SectionCard
                title={holidayEditId ? "Modifier une fermeture" : "Nouvelle fermeture"}
                subtitle="Réservé aux rôles établissement. Sert pour congés, ponts et jours fériés."
              >
                <Controller
                  control={holidayRhf.control}
                  name="label"
                  render={({ field, fieldState }) => (
                    <>
                      <TextField
                        label="Libellé"
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder="Fête de la jeunesse"
                        hasError={!!fieldState.error}
                        testID="holiday-form-label"
                      />
                      {fieldState.error ? (
                        <Text style={styles.fieldError}>
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </>
                  )}
                />
                <View style={styles.row}>
                  <Controller
                    control={holidayRhf.control}
                    name="startDate"
                    render={({ field, fieldState }) => (
                      <View style={{ flex: 1 }}>
                        <TextField
                          label="Début"
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder="AAAA-MM-JJ"
                          hasError={!!fieldState.error}
                        />
                        {fieldState.error ? (
                          <Text style={styles.fieldError}>
                            {fieldState.error.message}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  />
                  <Controller
                    control={holidayRhf.control}
                    name="endDate"
                    render={({ field, fieldState }) => (
                      <View style={{ flex: 1 }}>
                        <TextField
                          label="Fin"
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder="AAAA-MM-JJ"
                          hasError={!!fieldState.error}
                        />
                        {fieldState.error ? (
                          <Text style={styles.fieldError}>
                            {fieldState.error.message}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  />
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => void handleSaveHoliday()}
                    disabled={isSubmitting}
                    testID="holiday-form-submit"
                  >
                    <Text style={styles.primaryButtonText}>
                      {holidayEditId ? "Mettre à jour" : "Ajouter la fermeture"}
                    </Text>
                  </TouchableOpacity>
                  {holidayEditId ? (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={resetHolidayForm}
                    >
                      <Text style={styles.secondaryButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SectionCard>

              <SectionCard
                title="Calendrier établissement"
                subtitle="Événements école répercutés dans la lecture des emplois du temps."
              >
                <CalendarEventList
                  events={classTimetable.calendarEvents.filter(
                    (event) => event.scope === "SCHOOL",
                  )}
                  onEdit={fillHoliday}
                  onDelete={(event) => void handleDeleteHoliday(event)}
                />
              </SectionCard>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowField: {
    flex: 1,
    gap: 6,
  },
  rowFieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  list: {
    gap: 10,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    padding: 12,
  },
  entryBody: {
    flex: 1,
    gap: 3,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  entryMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  fieldError: {
    fontSize: 12,
    color: colors.notification,
    marginTop: -4,
  },
});
