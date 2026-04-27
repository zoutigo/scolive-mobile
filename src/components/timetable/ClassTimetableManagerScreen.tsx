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
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTimetableStore } from "../../store/timetable.store";
import { TimePickerField } from "../TimePickerField";
import { getViewType } from "../navigation/nav-config";
import { HeaderBackButton } from "../navigation/HeaderBackButton";
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

  const [slotForm, setSlotForm] = useState({
    id: "",
    subjectId: "",
    teacherUserId: "",
    weekday: "1",
    start: "07:30",
    end: "08:20",
    room: "",
    activeFromDate: range.fromDate,
    activeToDate: range.toDate,
  });
  const [oneOffForm, setOneOffForm] = useState({
    id: "",
    subjectId: "",
    teacherUserId: "",
    occurrenceDate: range.fromDate,
    start: "10:00",
    end: "10:50",
    room: "",
    status: "PLANNED",
  });
  const [holidayForm, setHolidayForm] = useState({
    id: "",
    label: "",
    startDate: range.fromDate,
    endDate: range.toDate,
  });

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

    if (!slotForm.subjectId && context.assignments.length > 0) {
      const first = context.assignments[0];
      setSlotForm((current) => ({
        ...current,
        subjectId: first.subjectId,
        teacherUserId: first.teacherUserId,
      }));
      setOneOffForm((current) => ({
        ...current,
        subjectId: first.subjectId,
        teacherUserId: first.teacherUserId,
      }));
    }
  }, [
    classId,
    initialSchoolYearId,
    loadClassContext,
    loadClassTimetable,
    range.fromDate,
    range.toDate,
    schoolSlug,
    slotForm.subjectId,
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
      .filter((assignment) => assignment.subjectId === slotForm.subjectId)
      .map((assignment) => ({
        value: assignment.teacherUserId,
        label: fullTeacherName(assignment.teacherUser),
      }));
    return filtered.length > 0 ? filtered : teacherOptions;
  }, [classContext, slotForm.subjectId, teacherOptions]);

  function resetSlotForm() {
    const assignment =
      classContext?.assignments[0] &&
      firstAssignmentForSubject(
        classContext.assignments,
        classContext.assignments[0].subjectId,
      );
    setSlotForm({
      id: "",
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
    setOneOffForm({
      id: "",
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
    setHolidayForm({
      id: "",
      label: "",
      startDate: range.fromDate,
      endDate: range.toDate,
    });
  }

  async function handleSaveRecurringSlot() {
    if (!schoolSlug || !classId || !classContext) return;
    try {
      const payload = {
        schoolYearId:
          classContext.selectedSchoolYearId ?? classContext.class.schoolYearId,
        weekday: Number(slotForm.weekday),
        startMinute: parseMinuteOrThrow(slotForm.start, "Début"),
        endMinute: parseMinuteOrThrow(slotForm.end, "Fin"),
        subjectId: slotForm.subjectId,
        teacherUserId: slotForm.teacherUserId,
        room: slotForm.room.trim() || null,
        activeFromDate: slotForm.activeFromDate,
        activeToDate: slotForm.activeToDate,
      };

      if (!payload.subjectId || !payload.teacherUserId) {
        throw new Error("Choisissez la matière et l'enseignant.");
      }

      if (slotForm.id) {
        await updateRecurringSlot(schoolSlug, slotForm.id, payload);
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
  }

  async function handleSaveOneOffSlot() {
    if (!schoolSlug || !classId || !classContext) return;
    try {
      const payload = {
        schoolYearId:
          classContext.selectedSchoolYearId ?? classContext.class.schoolYearId,
        occurrenceDate: oneOffForm.occurrenceDate,
        startMinute: parseMinuteOrThrow(oneOffForm.start, "Début"),
        endMinute: parseMinuteOrThrow(oneOffForm.end, "Fin"),
        subjectId: oneOffForm.subjectId,
        teacherUserId: oneOffForm.teacherUserId,
        room: oneOffForm.room.trim() || null,
        status: oneOffForm.status as "PLANNED" | "CANCELLED",
      };
      if (!payload.subjectId || !payload.teacherUserId) {
        throw new Error("Choisissez la matière et l'enseignant.");
      }

      if (oneOffForm.id) {
        await updateOneOffSlot(schoolSlug, oneOffForm.id, payload);
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
  }

  async function handleSaveHoliday() {
    if (!schoolSlug || !classContext) return;
    try {
      const payload = {
        schoolYearId:
          classContext.selectedSchoolYearId ?? classContext.class.schoolYearId,
        label: holidayForm.label.trim(),
        startDate: holidayForm.startDate,
        endDate: holidayForm.endDate,
        scope: "SCHOOL" as const,
      };
      if (!payload.label) {
        throw new Error("Le libellé de fermeture est obligatoire.");
      }
      if (holidayForm.id) {
        await updateCalendarEvent(schoolSlug, holidayForm.id, payload);
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
  }

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
    setSlotForm({
      id: slot.id,
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
    setOneOffForm({
      id: slot.id,
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
    setHolidayForm({
      id: event.id,
      label: event.label,
      startDate: event.startDate,
      endDate: event.endDate,
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
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
        <View style={styles.headerRow}>
          <HeaderBackButton onPress={() => router.back()} />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Agenda de classe</Text>
            <Text style={styles.title}>
              {classContext?.class.name ?? "Chargement..."}
            </Text>
            <Text style={styles.subtitle}>
              Création, lecture, mise à jour et suppression des créneaux depuis
              mobile, avec scroll vertical complet pour éviter les problèmes de
              clavier.
            </Text>
          </View>
        </View>

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
              title={
                slotForm.id
                  ? "Modifier un créneau"
                  : "Nouveau créneau hebdomadaire"
              }
              subtitle="Le formulaire reste scrollable pour laisser de la place au clavier et sécuriser la saisie E2E."
            >
              <PillSelector
                label="Matière"
                value={slotForm.subjectId}
                onChange={(subjectId) => {
                  const assignment =
                    classContext.assignments.find(
                      (entry) => entry.subjectId === subjectId,
                    ) ?? classContext.assignments[0];
                  setSlotForm((current) => ({
                    ...current,
                    subjectId,
                    teacherUserId:
                      assignment?.teacherUserId ?? current.teacherUserId,
                  }));
                }}
                options={subjectOptions}
              />
              <PillSelector
                label="Enseignant"
                value={slotForm.teacherUserId}
                onChange={(teacherUserId) =>
                  setSlotForm((current) => ({ ...current, teacherUserId }))
                }
                options={subjectScopedTeachers}
              />
              <PillSelector
                label="Jour"
                value={slotForm.weekday}
                onChange={(weekday) =>
                  setSlotForm((current) => ({ ...current, weekday }))
                }
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
              <View style={styles.row}>
                <View style={styles.rowField}>
                  <Text style={styles.rowFieldLabel}>Début</Text>
                  <TimePickerField
                    value={slotForm.start}
                    onChange={(start) =>
                      setSlotForm((current) => ({ ...current, start }))
                    }
                    title="Heure de début"
                    placeholder="07:30"
                    testID="slot-form-start"
                  />
                </View>
                <View style={styles.rowField}>
                  <Text style={styles.rowFieldLabel}>Fin</Text>
                  <TimePickerField
                    value={slotForm.end}
                    onChange={(end) =>
                      setSlotForm((current) => ({ ...current, end }))
                    }
                    title="Heure de fin"
                    placeholder="08:20"
                    testID="slot-form-end"
                  />
                </View>
              </View>
              <TextField
                label="Salle"
                value={slotForm.room}
                onChangeText={(room) =>
                  setSlotForm((current) => ({ ...current, room }))
                }
                placeholder="Salle A2"
                testID="slot-form-room"
              />
              <View style={styles.row}>
                <TextField
                  label="Actif du"
                  value={slotForm.activeFromDate}
                  onChangeText={(activeFromDate) =>
                    setSlotForm((current) => ({ ...current, activeFromDate }))
                  }
                  placeholder="2026-04-13"
                />
                <TextField
                  label="Actif au"
                  value={slotForm.activeToDate}
                  onChangeText={(activeToDate) =>
                    setSlotForm((current) => ({ ...current, activeToDate }))
                  }
                  placeholder="2026-05-03"
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
                    {slotForm.id ? "Mettre à jour" : "Ajouter le créneau"}
                  </Text>
                </TouchableOpacity>
                {slotForm.id ? (
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
                          {slot.room?.trim() ? slot.room : "Salle à confirmer"}
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
              title={
                oneOffForm.id
                  ? "Modifier une séance"
                  : "Nouvelle séance ponctuelle"
              }
              subtitle="Utilisez cet onglet pour les permutations, remplacements et cours exceptionnels."
            >
              <PillSelector
                label="Matière"
                value={oneOffForm.subjectId}
                onChange={(subjectId) => {
                  const assignment =
                    classContext.assignments.find(
                      (entry) => entry.subjectId === subjectId,
                    ) ?? classContext.assignments[0];
                  setOneOffForm((current) => ({
                    ...current,
                    subjectId,
                    teacherUserId:
                      assignment?.teacherUserId ?? current.teacherUserId,
                  }));
                }}
                options={subjectOptions}
              />
              <PillSelector
                label="Enseignant"
                value={oneOffForm.teacherUserId}
                onChange={(teacherUserId) =>
                  setOneOffForm((current) => ({ ...current, teacherUserId }))
                }
                options={teacherOptions}
              />
              <TextField
                label="Date"
                value={oneOffForm.occurrenceDate}
                onChangeText={(occurrenceDate) =>
                  setOneOffForm((current) => ({ ...current, occurrenceDate }))
                }
                placeholder="2026-04-17"
                testID="oneoff-form-date"
              />
              <View style={styles.row}>
                <View style={styles.rowField}>
                  <Text style={styles.rowFieldLabel}>Début</Text>
                  <TimePickerField
                    value={oneOffForm.start}
                    onChange={(start) =>
                      setOneOffForm((current) => ({ ...current, start }))
                    }
                    title="Heure de début"
                    placeholder="10:00"
                    testID="oneoff-form-start"
                  />
                </View>
                <View style={styles.rowField}>
                  <Text style={styles.rowFieldLabel}>Fin</Text>
                  <TimePickerField
                    value={oneOffForm.end}
                    onChange={(end) =>
                      setOneOffForm((current) => ({ ...current, end }))
                    }
                    title="Heure de fin"
                    placeholder="10:50"
                    testID="oneoff-form-end"
                  />
                </View>
              </View>
              <TextField
                label="Salle"
                value={oneOffForm.room}
                onChangeText={(room) =>
                  setOneOffForm((current) => ({ ...current, room }))
                }
                placeholder="Salle polyvalente"
              />
              <PillSelector
                label="Statut"
                value={oneOffForm.status}
                onChange={(status) =>
                  setOneOffForm((current) => ({ ...current, status }))
                }
                options={[
                  { value: "PLANNED", label: "Prévu" },
                  { value: "CANCELLED", label: "Annulé" },
                ]}
              />
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => void handleSaveOneOffSlot()}
                  disabled={isSubmitting}
                  testID="oneoff-form-submit"
                >
                  <Text style={styles.primaryButtonText}>
                    {oneOffForm.id ? "Mettre à jour" : "Ajouter la séance"}
                  </Text>
                </TouchableOpacity>
                {oneOffForm.id ? (
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
                          {minuteToTimeLabel(slot.endMinute)} • {slot.status} •{" "}
                          {slot.room?.trim() ? slot.room : "Salle à confirmer"}
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
              title={
                holidayForm.id ? "Modifier une fermeture" : "Nouvelle fermeture"
              }
              subtitle="Réservé aux rôles établissement. Sert pour congés, ponts et jours fériés."
            >
              <TextField
                label="Libellé"
                value={holidayForm.label}
                onChangeText={(label) =>
                  setHolidayForm((current) => ({ ...current, label }))
                }
                placeholder="Fête de la jeunesse"
                testID="holiday-form-label"
              />
              <View style={styles.row}>
                <TextField
                  label="Début"
                  value={holidayForm.startDate}
                  onChangeText={(startDate) =>
                    setHolidayForm((current) => ({ ...current, startDate }))
                  }
                  placeholder="2026-05-20"
                />
                <TextField
                  label="Fin"
                  value={holidayForm.endDate}
                  onChangeText={(endDate) =>
                    setHolidayForm((current) => ({ ...current, endDate }))
                  }
                  placeholder="2026-05-20"
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
                    {holidayForm.id ? "Mettre à jour" : "Ajouter la fermeture"}
                  </Text>
                </TouchableOpacity>
                {holidayForm.id ? (
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
  headerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
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
});
