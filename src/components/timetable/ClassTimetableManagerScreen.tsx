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
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";

type TabKey = "agenda" | "slots" | "oneoff" | "holidays";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

function createSlotSchema(t: TranslateFn) {
  return z.object({
    subjectId: z
      .string()
      .min(1, t("timetable.classManager.validation.chooseSubject")),
    teacherUserId: z
      .string()
      .min(1, t("timetable.classManager.validation.chooseTeacher")),
    weekday: z.string(),
    start: z
      .string()
      .regex(TIME_REGEX, t("timetable.classManager.validation.timeFormat")),
    end: z
      .string()
      .regex(TIME_REGEX, t("timetable.classManager.validation.timeFormat")),
    room: z.string(),
    activeFromDate: z
      .string()
      .regex(ISO_DATE_REGEX, t("timetable.classManager.validation.dateFormat")),
    activeToDate: z
      .string()
      .regex(ISO_DATE_REGEX, t("timetable.classManager.validation.dateFormat")),
  });
}

function createOneOffSchema(t: TranslateFn) {
  return z.object({
    subjectId: z
      .string()
      .min(1, t("timetable.classManager.validation.chooseSubject")),
    teacherUserId: z
      .string()
      .min(1, t("timetable.classManager.validation.chooseTeacher")),
    occurrenceDate: z
      .string()
      .regex(ISO_DATE_REGEX, t("timetable.classManager.validation.dateFormat")),
    start: z
      .string()
      .regex(TIME_REGEX, t("timetable.classManager.validation.timeFormat")),
    end: z
      .string()
      .regex(TIME_REGEX, t("timetable.classManager.validation.timeFormat")),
    room: z.string(),
    status: z.enum(["PLANNED", "CANCELLED"]),
  });
}

function createHolidaySchema(t: TranslateFn) {
  return z.object({
    label: z
      .string()
      .trim()
      .min(1, t("timetable.classManager.validation.holidayLabelRequired")),
    startDate: z
      .string()
      .regex(ISO_DATE_REGEX, t("timetable.classManager.validation.dateFormat")),
    endDate: z
      .string()
      .regex(ISO_DATE_REGEX, t("timetable.classManager.validation.dateFormat")),
  });
}

type SlotValues = z.infer<ReturnType<typeof createSlotSchema>>;
type OneOffValues = z.infer<ReturnType<typeof createOneOffSchema>>;
type HolidayValues = z.infer<ReturnType<typeof createHolidaySchema>>;

function parseMinuteOrThrow(
  value: string,
  fieldLabel: string,
  t: TranslateFn,
): number {
  const parsed = timeLabelToMinute(value);
  if (parsed === null) {
    throw new Error(
      `${fieldLabel} ${t("timetable.classManager.validation.timeFormatError")}`,
    );
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
  const { t } = useTranslation();
  const viewType = user ? getViewType(user) : "unknown";
  const canManageCalendarEvents = viewType === "school";

  const [tab, setTab] = useState<TabKey>("agenda");
  const [range] = useState(buildDefaultDateRange());

  // Editing IDs — tracked outside RHF since they're not validated fields
  const [slotEditId, setSlotEditId] = useState("");
  const [oneOffEditId, setOneOffEditId] = useState("");
  const [holidayEditId, setHolidayEditId] = useState("");

  const slotSchema = useMemo(() => createSlotSchema(t), [t]);
  const oneOffSchema = useMemo(() => createOneOffSchema(t), [t]);
  const holidaySchema = useMemo(() => createHolidaySchema(t), [t]);

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
            classContext.selectedSchoolYearId ??
            classContext.class.schoolYearId,
          weekday: Number(data.weekday),
          startMinute: parseMinuteOrThrow(
            data.start,
            t("timetable.classManager.validation.startLabel"),
            t,
          ),
          endMinute: parseMinuteOrThrow(
            data.end,
            t("timetable.classManager.validation.endLabel"),
            t,
          ),
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
            title: t("timetable.classManager.toast.slotUpdatedTitle"),
            message: t("timetable.classManager.toast.slotUpdatedMessage"),
          });
        } else {
          await createRecurringSlot(schoolSlug, classId, payload);
          showToast({
            variant: "success",
            title: t("timetable.classManager.toast.slotCreatedTitle"),
            message: t("timetable.classManager.toast.slotCreatedMessage"),
          });
        }
        resetSlotForm();
        await load();
      } catch (error) {
        showToast({
          variant: "error",
          title: t("timetable.classManager.toast.slotRejectedTitle"),
          message:
            error instanceof Error
              ? error.message
              : t("timetable.classManager.toast.slotRejectedMessage"),
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
            classContext.selectedSchoolYearId ??
            classContext.class.schoolYearId,
          occurrenceDate: data.occurrenceDate,
          startMinute: parseMinuteOrThrow(
            data.start,
            t("timetable.classManager.validation.startLabel"),
            t,
          ),
          endMinute: parseMinuteOrThrow(
            data.end,
            t("timetable.classManager.validation.endLabel"),
            t,
          ),
          subjectId: data.subjectId,
          teacherUserId: data.teacherUserId,
          room: data.room.trim() || null,
          status: data.status,
        };
        if (oneOffEditId) {
          await updateOneOffSlot(schoolSlug, oneOffEditId, payload);
          showToast({
            variant: "success",
            title: t("timetable.classManager.toast.oneOffUpdatedTitle"),
            message: t("timetable.classManager.toast.oneOffUpdatedMessage"),
          });
        } else {
          await createOneOffSlot(schoolSlug, classId, payload);
          showToast({
            variant: "success",
            title: t("timetable.classManager.toast.oneOffCreatedTitle"),
            message: t("timetable.classManager.toast.oneOffCreatedMessage"),
          });
        }
        resetOneOffForm();
        await load();
      } catch (error) {
        showToast({
          variant: "error",
          title: t("timetable.classManager.toast.oneOffRejectedTitle"),
          message:
            error instanceof Error
              ? error.message
              : t("timetable.classManager.toast.oneOffRejectedMessage"),
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
            classContext.selectedSchoolYearId ??
            classContext.class.schoolYearId,
          label: data.label.trim(),
          startDate: data.startDate,
          endDate: data.endDate,
          scope: "SCHOOL" as const,
        };
        if (holidayEditId) {
          await updateCalendarEvent(schoolSlug, holidayEditId, payload);
          showToast({
            variant: "success",
            title: t("timetable.classManager.toast.holidayUpdatedTitle"),
            message: t("timetable.classManager.toast.holidayUpdatedMessage"),
          });
        } else {
          await createCalendarEvent(schoolSlug, payload);
          showToast({
            variant: "success",
            title: t("timetable.classManager.toast.holidayCreatedTitle"),
            message: t("timetable.classManager.toast.holidayCreatedMessage"),
          });
        }
        resetHolidayForm();
        await load();
      } catch (error) {
        showToast({
          variant: "error",
          title: t("timetable.classManager.toast.holidayRejectedTitle"),
          message:
            error instanceof Error
              ? error.message
              : t("timetable.classManager.toast.holidayRejectedMessage"),
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
        title: t("timetable.classManager.toast.slotDeletedTitle"),
        message: t("timetable.classManager.toast.slotDeletedMessage"),
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: t("timetable.classManager.toast.deleteImpossibleTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("timetable.classManager.toast.slotDeleteErrorMessage"),
      });
    }
  }

  async function handleDeleteOneOffSlot(slot: TimetableOneOffSlot) {
    if (!schoolSlug) return;
    try {
      await deleteOneOffSlot(schoolSlug, slot.id);
      showToast({
        variant: "success",
        title: t("timetable.classManager.toast.oneOffDeletedTitle"),
        message: t("timetable.classManager.toast.oneOffDeletedMessage"),
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: t("timetable.classManager.toast.deleteImpossibleTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("timetable.classManager.toast.oneOffDeleteErrorMessage"),
      });
    }
  }

  async function handleDeleteHoliday(event: TimetableCalendarEvent) {
    if (!schoolSlug) return;
    try {
      await deleteCalendarEvent(schoolSlug, event.id);
      showToast({
        variant: "success",
        title: t("timetable.classManager.toast.holidayDeletedTitle"),
        message: t("timetable.classManager.toast.holidayDeletedMessage"),
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: t("timetable.classManager.toast.deleteImpossibleTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("timetable.classManager.toast.holidayDeleteErrorMessage"),
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
        title={
          classContext?.class.name ?? t("timetable.classManager.defaultTitle")
        }
        subtitle={t("timetable.classManager.headerSubtitle")}
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
              subtitle={`${classContext.selectedSchoolYearId ?? classContext.class.schoolYearId} • ${formatHumanDate(range.fromDate)} ${t("timetable.classManager.dateRangeTo")} ${formatHumanDate(range.toDate)}`}
              accent={colors.primary}
            />
          ) : null}

          <SectionCard
            title={t("timetable.classManager.nav.title")}
            subtitle={t("timetable.classManager.nav.subtitle")}
          >
            <PillSelector
              label={t("timetable.classManager.nav.tabLabel")}
              value={tab}
              onChange={(value) => setTab(value as TabKey)}
              options={[
                {
                  value: "agenda",
                  label: t("timetable.classManager.nav.tabAgenda"),
                },
                {
                  value: "slots",
                  label: t("timetable.classManager.nav.tabSlots"),
                },
                {
                  value: "oneoff",
                  label: t("timetable.classManager.nav.tabOneOff"),
                },
                ...(canManageCalendarEvents
                  ? [
                      {
                        value: "holidays",
                        label: t("timetable.classManager.nav.tabHolidays"),
                      },
                    ]
                  : []),
              ]}
              testIDPrefix="class-timetable-tab"
            />
          </SectionCard>

          {isLoadingClassContext || isLoadingClassTimetable ? (
            <SectionCard title={t("timetable.classManager.loadingTitle")}>
              <LoadingBlock label={t("timetable.classManager.loadingClass")} />
            </SectionCard>
          ) : !classContext || !classTimetable ? (
            <SectionCard title={t("timetable.classManager.accessTitle")}>
              <EmptyState
                icon="lock-closed-outline"
                title={t("timetable.classManager.accessDeniedTitle")}
                message={t("timetable.classManager.accessDeniedMessage")}
              />
            </SectionCard>
          ) : tab === "agenda" ? (
            <SectionCard
              title={t("timetable.classManager.agenda.title")}
              subtitle={t("timetable.classManager.agenda.subtitle")}
            >
              <OccurrencesAgenda
                occurrences={classTimetable.occurrences}
                subjectStyles={classTimetable.subjectStyles}
                emptyTitle={t("timetable.classManager.agenda.emptyTitle")}
                emptyMessage={t("timetable.classManager.agenda.emptyMessage")}
                testID="class-timetable-occurrences"
              />
            </SectionCard>
          ) : tab === "slots" ? (
            <>
              <SectionCard
                title={
                  slotEditId
                    ? t("timetable.classManager.slots.editTitle")
                    : t("timetable.classManager.slots.newTitle")
                }
                subtitle={t("timetable.classManager.slots.subtitle")}
              >
                <Controller
                  control={slotRhf.control}
                  name="subjectId"
                  render={({ field }) => (
                    <PillSelector
                      label={t("timetable.classManager.fields.subject")}
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
                      label={t("timetable.classManager.fields.teacher")}
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
                      label={t("timetable.classManager.fields.day")}
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        {
                          value: "1",
                          label: t("timetable.classManager.weekdays.mon"),
                        },
                        {
                          value: "2",
                          label: t("timetable.classManager.weekdays.tue"),
                        },
                        {
                          value: "3",
                          label: t("timetable.classManager.weekdays.wed"),
                        },
                        {
                          value: "4",
                          label: t("timetable.classManager.weekdays.thu"),
                        },
                        {
                          value: "5",
                          label: t("timetable.classManager.weekdays.fri"),
                        },
                        {
                          value: "6",
                          label: t("timetable.classManager.weekdays.sat"),
                        },
                        {
                          value: "7",
                          label: t("timetable.classManager.weekdays.sun"),
                        },
                      ]}
                    />
                  )}
                />
                <View style={styles.row}>
                  <View style={styles.rowField}>
                    <Text style={styles.rowFieldLabel}>
                      {t("timetable.classManager.fields.start")}
                    </Text>
                    <Controller
                      control={slotRhf.control}
                      name="start"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title={t(
                            "timetable.classManager.timePicker.startTitle",
                          )}
                          placeholder="07:30"
                          testID="slot-form-start"
                        />
                      )}
                    />
                  </View>
                  <View style={styles.rowField}>
                    <Text style={styles.rowFieldLabel}>
                      {t("timetable.classManager.fields.end")}
                    </Text>
                    <Controller
                      control={slotRhf.control}
                      name="end"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title={t(
                            "timetable.classManager.timePicker.endTitle",
                          )}
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
                      label={t("timetable.classManager.fields.room")}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t(
                        "timetable.classManager.placeholders.roomA2",
                      )}
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
                          label={t("timetable.classManager.fields.activeFrom")}
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder={t(
                            "timetable.classManager.placeholders.isoDate",
                          )}
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
                          label={t("timetable.classManager.fields.activeTo")}
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder={t(
                            "timetable.classManager.placeholders.isoDate",
                          )}
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
                      {slotEditId
                        ? t("timetable.classManager.buttons.updateSlot")
                        : t("timetable.classManager.buttons.addSlot")}
                    </Text>
                  </TouchableOpacity>
                  {slotEditId ? (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={resetSlotForm}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {t("timetable.common.cancel")}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SectionCard>

              <SectionCard
                title={t("timetable.classManager.existingSlots.title")}
                subtitle={t("timetable.classManager.existingSlots.subtitle")}
              >
                {classTimetable.slots.length === 0 ? (
                  <EmptyState
                    icon="time-outline"
                    title={t("timetable.classManager.existingSlots.emptyTitle")}
                    message={t(
                      "timetable.classManager.existingSlots.emptyMessage",
                    )}
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
                            {fullTeacherName(slot.teacherUser)} •{" "}
                            {t(
                              "timetable.classManager.existingSlots.dayPrefix",
                            )}{" "}
                            {slot.weekday} •{" "}
                            {slot.room?.trim()
                              ? slot.room
                              : t("timetable.common.roomToConfirm")}
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
                  oneOffEditId
                    ? t("timetable.classManager.oneoff.editTitle")
                    : t("timetable.classManager.oneoff.newTitle")
                }
                subtitle={t("timetable.classManager.oneoff.subtitle")}
              >
                <Controller
                  control={oneOffRhf.control}
                  name="subjectId"
                  render={({ field }) => (
                    <PillSelector
                      label={t("timetable.classManager.fields.subject")}
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
                      label={t("timetable.classManager.fields.teacher")}
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
                        label={t("timetable.classManager.fields.date")}
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder={t(
                          "timetable.classManager.placeholders.isoDate",
                        )}
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
                    <Text style={styles.rowFieldLabel}>
                      {t("timetable.classManager.fields.start")}
                    </Text>
                    <Controller
                      control={oneOffRhf.control}
                      name="start"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title={t(
                            "timetable.classManager.timePicker.startTitle",
                          )}
                          placeholder="10:00"
                          testID="oneoff-form-start"
                        />
                      )}
                    />
                  </View>
                  <View style={styles.rowField}>
                    <Text style={styles.rowFieldLabel}>
                      {t("timetable.classManager.fields.end")}
                    </Text>
                    <Controller
                      control={oneOffRhf.control}
                      name="end"
                      render={({ field }) => (
                        <TimePickerField
                          value={field.value}
                          onChange={field.onChange}
                          title={t(
                            "timetable.classManager.timePicker.endTitle",
                          )}
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
                      label={t("timetable.classManager.fields.room")}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t(
                        "timetable.classManager.placeholders.roomMultipurpose",
                      )}
                    />
                  )}
                />
                <Controller
                  control={oneOffRhf.control}
                  name="status"
                  render={({ field }) => (
                    <PillSelector
                      label={t("timetable.classManager.fields.status")}
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        {
                          value: "PLANNED",
                          label: t("timetable.common.statusPlanned"),
                        },
                        {
                          value: "CANCELLED",
                          label: t("timetable.common.statusCancelled"),
                        },
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
                      {oneOffEditId
                        ? t("timetable.classManager.buttons.updateOneOff")
                        : t("timetable.classManager.buttons.addOneOff")}
                    </Text>
                  </TouchableOpacity>
                  {oneOffEditId ? (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={resetOneOffForm}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {t("timetable.common.cancel")}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SectionCard>

              <SectionCard
                title={t("timetable.classManager.existingOneOff.title")}
                subtitle={t("timetable.classManager.existingOneOff.subtitle")}
              >
                {classTimetable.oneOffSlots.length === 0 ? (
                  <EmptyState
                    icon="flash-outline"
                    title={t(
                      "timetable.classManager.existingOneOff.emptyTitle",
                    )}
                    message={t(
                      "timetable.classManager.existingOneOff.emptyMessage",
                    )}
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
                              : t("timetable.common.roomToConfirm")}
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
                  holidayEditId
                    ? t("timetable.classManager.holidays.editTitle")
                    : t("timetable.classManager.holidays.newTitle")
                }
                subtitle={t("timetable.classManager.holidays.subtitle")}
              >
                <Controller
                  control={holidayRhf.control}
                  name="label"
                  render={({ field, fieldState }) => (
                    <>
                      <TextField
                        label={t("timetable.classManager.fields.label")}
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder={t(
                          "timetable.classManager.placeholders.holidayLabel",
                        )}
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
                          label={t(
                            "timetable.classManager.validation.startLabel",
                          )}
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder={t(
                            "timetable.classManager.placeholders.isoDate",
                          )}
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
                          label={t(
                            "timetable.classManager.validation.endLabel",
                          )}
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder={t(
                            "timetable.classManager.placeholders.isoDate",
                          )}
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
                      {holidayEditId
                        ? t("timetable.classManager.buttons.updateHoliday")
                        : t("timetable.classManager.buttons.addHoliday")}
                    </Text>
                  </TouchableOpacity>
                  {holidayEditId ? (
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={resetHolidayForm}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {t("timetable.common.cancel")}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </SectionCard>

              <SectionCard
                title={t("timetable.classManager.holidays.calendarTitle")}
                subtitle={t("timetable.classManager.holidays.calendarSubtitle")}
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
