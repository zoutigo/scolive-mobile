import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { timetableApi } from "../../api/timetable.api";
import { roomsApi } from "../../api/rooms.api";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { DatePickerField } from "../DatePickerField";
import { TimePickerField } from "../TimePickerField";
import type { RoomAvailability } from "../../types/room.types";
import type {
  ClassTimetableContextResponse,
  TimetableClassOption,
} from "../../types/timetable.types";
import { timeLabelToMinute, toIsoDateString } from "../../utils/timetable";
import { extractApiError } from "../../utils/api-error";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import { moduleBack } from "../../utils/moduleBack";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";

// ─── Palette ──────────────────────────────────────────────────────────────────

const HERO_BG = "#247C72";

// ─── Constants ────────────────────────────────────────────────────────────────

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{1,2}:\d{2}$/;

// ─── Schema ───────────────────────────────────────────────────────────────────

function createSchema(t: TranslateFn) {
  return z
    .object({
      classId: z
        .string()
        .min(1, t("timetable.oneOffPanel.validation.chooseClass")),
      slotType: z.enum(["oneoff", "recurring"]),
      subjectId: z
        .string()
        .min(1, t("timetable.classManager.validation.chooseSubject")),
      start: z
        .string()
        .trim()
        .min(1, t("timetable.oneOffPanel.validation.startRequired"))
        .regex(TIME_REGEX, t("timetable.classManager.validation.timeFormat")),
      end: z
        .string()
        .trim()
        .min(1, t("timetable.oneOffPanel.validation.endRequired"))
        .regex(TIME_REGEX, t("timetable.classManager.validation.timeFormat")),
      roomId: z.string().optional(),
      occurrenceDate: z.string().optional(),
      weekdays: z.array(z.string()).optional(),
      activeFromDate: z.string().optional(),
      activeToDate: z.string().optional(),
    })
    .superRefine((d, ctx) => {
      if (d.slotType === "oneoff") {
        if (!d.occurrenceDate || !ISO_DATE_REGEX.test(d.occurrenceDate)) {
          ctx.addIssue({
            path: ["occurrenceDate"],
            code: z.ZodIssueCode.custom,
            message: t("timetable.classManager.validation.dateFormat"),
          });
        }
      } else {
        if (!d.weekdays || d.weekdays.length === 0) {
          ctx.addIssue({
            path: ["weekdays"],
            code: z.ZodIssueCode.custom,
            message: t("timetable.classManager.validation.chooseDays"),
          });
        }
        if (!d.activeFromDate || !ISO_DATE_REGEX.test(d.activeFromDate)) {
          ctx.addIssue({
            path: ["activeFromDate"],
            code: z.ZodIssueCode.custom,
            message: t("timetable.oneOffPanel.validation.activeFromRequired"),
          });
        }
        if (
          d.activeToDate &&
          d.activeToDate.trim() !== "" &&
          !ISO_DATE_REGEX.test(d.activeToDate)
        ) {
          ctx.addIssue({
            path: ["activeToDate"],
            code: z.ZodIssueCode.custom,
            message: t("timetable.classManager.validation.dateFormat"),
          });
        }
        if (
          d.activeToDate &&
          d.activeToDate.trim() !== "" &&
          d.activeFromDate &&
          ISO_DATE_REGEX.test(d.activeFromDate) &&
          ISO_DATE_REGEX.test(d.activeToDate) &&
          d.activeToDate <= d.activeFromDate
        ) {
          ctx.addIssue({
            path: ["activeToDate"],
            code: z.ZodIssueCode.custom,
            message: t("timetable.oneOffPanel.validation.activeToAfterFrom"),
          });
        }
      }
      const s = timeLabelToMinute(d.start);
      const e = timeLabelToMinute(d.end);
      if (s !== null && e !== null && e <= s) {
        ctx.addIssue({
          path: ["end"],
          code: z.ZodIssueCode.custom,
          message: t("timetable.oneOffPanel.validation.endAfterStart"),
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SlotCreateScreenProps {
  prefilledClassId?: string;
  prefilledDate?: string;
  prefilledTeacherId?: string;
  schoolSlug: string;
  allClasses: TimetableClassOption[];
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SlotCreateScreen({
  prefilledClassId,
  prefilledDate,
  prefilledTeacherId,
  schoolSlug,
  allClasses,
  onSuccess,
}: SlotCreateScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { showSuccess } = useSuccessToastStore();

  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [classCtx, setClassCtx] =
    useState<ClassTimetableContextResponse | null>(null);
  const [isLoadingCtx, setIsLoadingCtx] = useState(false);
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability[]>(
    [],
  );
  const prevLoadedClassId = useRef<string>("");

  const schema = useMemo(() => createSchema(t), [t]);

  const today = toIsoDateString(new Date());

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      classId: prefilledClassId ?? "",
      slotType: "oneoff",
      subjectId: "",
      start: "08:00",
      end: "09:00",
      roomId: "",
      occurrenceDate: prefilledDate ?? today,
      weekdays: ["1"],
      activeFromDate: prefilledDate ?? today,
      activeToDate: "",
    },
  });

  const classId = watch("classId");
  const slotType = watch("slotType");
  const occurrenceDate = watch("occurrenceDate");
  const activeFromDate = watch("activeFromDate");
  const start = watch("start");
  const end = watch("end");

  const { scrollViewRef, registerFieldOffset, focusFirstInvalidField } =
    useScrollToFirstError<keyof FormValues>();
  const ONEOFF_FIELD_ORDER: Array<keyof FormValues> = [
    "classId",
    "subjectId",
    "occurrenceDate",
    "start",
    "end",
  ];
  const RECURRING_FIELD_ORDER: Array<keyof FormValues> = [
    "classId",
    "subjectId",
    "weekdays",
    "activeFromDate",
    "activeToDate",
    "start",
    "end",
  ];

  // Load class context when classId changes
  useEffect(() => {
    if (!classId || classId === prevLoadedClassId.current) return;
    prevLoadedClassId.current = classId;
    setClassCtx(null);
    setApiError(null);
    setIsLoadingCtx(true);
    timetableApi
      .getClassContext(schoolSlug, classId)
      .then((ctx) => {
        setClassCtx(ctx);
        const teacherId = prefilledTeacherId ?? user?.id;
        const teacherAssignments = ctx.assignments.filter(
          (a) => !teacherId || a.teacherUserId === teacherId,
        );
        const firstSubjectId =
          teacherAssignments[0]?.subjectId ??
          ctx.assignments[0]?.subjectId ??
          "";
        setValue("subjectId", firstSubjectId);
      })
      .catch(() => {})
      .finally(() => setIsLoadingCtx(false));
  }, [classId, schoolSlug, user?.id, setValue, prefilledTeacherId]);

  const dateForRooms = slotType === "oneoff" ? occurrenceDate : activeFromDate;

  const weekdayForRooms = useMemo(() => {
    if (!dateForRooms || !ISO_DATE_REGEX.test(dateForRooms)) return null;
    return new Date(`${dateForRooms}T00:00:00`).getDay() || 7;
  }, [dateForRooms]);

  // Fetch available rooms
  useEffect(() => {
    if (!schoolSlug || weekdayForRooms === null) return;
    const startMinute = timeLabelToMinute(start);
    const endMinute = timeLabelToMinute(end);
    if (startMinute === null || endMinute === null) return;

    let cancelled = false;
    roomsApi
      .listAvailableRooms(schoolSlug, {
        weekday: weekdayForRooms,
        startMinute,
        endMinute,
        occurrenceDate: slotType === "oneoff" ? dateForRooms : undefined,
      })
      .then((result) => {
        if (!cancelled) setRoomAvailability(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [schoolSlug, dateForRooms, weekdayForRooms, start, end, slotType]);

  const subjectOptions = useMemo(() => {
    if (!classCtx) return [];
    const teacherId = prefilledTeacherId ?? user?.id;
    const assignedSubjectIds = new Set(
      classCtx.assignments
        .filter((a) => !teacherId || a.teacherUserId === teacherId)
        .map((a) => a.subjectId),
    );
    const subjects =
      assignedSubjectIds.size > 0
        ? classCtx.allowedSubjects.filter((s) => assignedSubjectIds.has(s.id))
        : classCtx.allowedSubjects;
    return subjects.map((s) => ({ value: s.id, label: s.name }));
  }, [classCtx, prefilledTeacherId, user?.id]);

  const availableRoomOptions = useMemo(
    () => [
      { value: "", label: t("timetable.classManager.fields.roomNone") },
      ...roomAvailability
        .filter((r) => r.isAvailable && r.status === "AVAILABLE")
        .map((r) => ({ value: r.id, label: r.name })),
    ],
    [roomAvailability, t],
  );

  const selectedClassName = useMemo(
    () => allClasses.find((c) => c.classId === classId)?.className ?? null,
    [allClasses, classId],
  );

  const { user: authUser } = useAuthStore();
  const headerSubtitle = [authUser?.schoolName, selectedClassName]
    .filter(Boolean)
    .join(" · ");

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSave = handleSubmit(
    async (values) => {
      if (!classCtx) return;
      const teacherUserId = prefilledTeacherId ?? user?.id;
      if (!teacherUserId) return;
      const startMinute = timeLabelToMinute(values.start)!;
      const endMinute = timeLabelToMinute(values.end)!;
      const schoolYearId =
        classCtx.selectedSchoolYearId ?? classCtx.class.schoolYearId;

      setIsSaving(true);
      setApiError(null);
      try {
        if (values.slotType === "oneoff") {
          await timetableApi.createOneOffSlot(schoolSlug, values.classId, {
            schoolYearId,
            occurrenceDate: values.occurrenceDate!,
            startMinute,
            endMinute,
            subjectId: values.subjectId,
            teacherUserId,
            roomId: values.roomId || null,
            status: "PLANNED",
          });
          showSuccess({
            title: t("timetable.oneOffPanel.toasts.createdTitle"),
            message: t("timetable.oneOffPanel.toasts.createdMessage"),
          });
        } else {
          const fromDate = values.activeFromDate!;
          const selectedWeekdays = values.weekdays ?? ["1"];
          await Promise.all(
            selectedWeekdays.map((wd) =>
              timetableApi.createRecurringSlot(schoolSlug, values.classId, {
                schoolYearId,
                weekday: Number(wd),
                startMinute,
                endMinute,
                subjectId: values.subjectId,
                teacherUserId,
                roomId: values.roomId || null,
                activeFromDate: fromDate,
                activeToDate: values.activeToDate?.trim() || null,
              }),
            ),
          );
          showSuccess({
            title: t("timetable.oneOffPanel.toasts.recurringCreatedTitle"),
            message: t("timetable.oneOffPanel.toasts.recurringCreatedMessage"),
          });
        }
        onSuccess();
        router.back();
      } catch (err) {
        setApiError(extractApiError(err));
      } finally {
        setIsSaving(false);
      }
    },
    (errs) =>
      focusFirstInvalidField(
        slotType === "oneoff" ? ONEOFF_FIELD_ORDER : RECURRING_FIELD_ORDER,
        errs,
      ),
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root} testID="slot-create-screen">
      <ModuleHeader
        title={t("timetable.slotScreen.headerTitle")}
        subtitle={headerSubtitle || null}
        onBack={() => moduleBack(router)}
        testID="slot-create-header"
        backTestID="slot-create-back"
        topInset={insets.top}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID="slot-create-scroll"
        >
          {/* Hero */}
          <FormHero
            icon="calendar-outline"
            title={t("timetable.slotScreen.create.heroTitle")}
            subtitle={t("timetable.slotScreen.heroSubtitle")}
            palette="teal"
            testID="slot-create-hero"
          />

          {/* Form card */}
          <View style={styles.card}>
            {/* Class picker */}
            <Controller
              control={control}
              name="classId"
              render={({ field: { value, onChange } }) => (
                <View
                  style={styles.section}
                  onLayout={registerFieldOffset("classId")}
                >
                  <Text style={styles.label}>
                    {t("timetable.oneOffPanel.fields.class")}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pillsRow}
                  >
                    {allClasses.map((cls) => (
                      <TouchableOpacity
                        key={cls.classId}
                        style={[
                          styles.pill,
                          value === cls.classId && styles.pillActive,
                        ]}
                        onPress={() => onChange(cls.classId)}
                        testID={`slot-create-class-${cls.classId}`}
                      >
                        <Text
                          style={[
                            styles.pillText,
                            value === cls.classId && styles.pillTextActive,
                          ]}
                        >
                          {cls.className}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errors.classId ? (
                    <Text
                      style={styles.errorText}
                      testID="slot-create-class-error"
                    >
                      {errors.classId.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            {/* Loading class context */}
            {isLoadingCtx ? (
              <View style={styles.loaderRow}>
                <ActivityIndicator size="small" color={HERO_BG} />
              </View>
            ) : classCtx ? (
              <>
                {/* Slot type toggle */}
                <View style={styles.typeToggleRow}>
                  <Controller
                    control={control}
                    name="slotType"
                    render={({ field: { value, onChange } }) => (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.typeToggle,
                            value === "oneoff" && styles.typeToggleActive,
                          ]}
                          onPress={() => onChange("oneoff")}
                          testID="slot-create-type-oneoff"
                        >
                          <Ionicons
                            name="calendar-number-outline"
                            size={14}
                            color={
                              value === "oneoff"
                                ? colors.white
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.typeToggleText,
                              value === "oneoff" && styles.typeToggleTextActive,
                            ]}
                          >
                            {t("timetable.oneOffPanel.slotType.oneoff")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.typeToggle,
                            value === "recurring" && styles.typeToggleActive,
                          ]}
                          onPress={() => onChange("recurring")}
                          testID="slot-create-type-recurring"
                        >
                          <Ionicons
                            name="repeat-outline"
                            size={14}
                            color={
                              value === "recurring"
                                ? colors.white
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.typeToggleText,
                              value === "recurring" &&
                                styles.typeToggleTextActive,
                            ]}
                          >
                            {t("timetable.oneOffPanel.slotType.recurring")}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  />
                </View>

                {/* Subject */}
                <View
                  style={styles.section}
                  onLayout={registerFieldOffset("subjectId")}
                >
                  <Text style={styles.label}>
                    {t("timetable.classManager.fields.subject")}
                  </Text>
                  <Controller
                    control={control}
                    name="subjectId"
                    render={({ field: { value, onChange } }) => (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.pillsRow}
                      >
                        {subjectOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.pill,
                              value === opt.value && styles.pillActive,
                            ]}
                            onPress={() => onChange(opt.value)}
                            testID={`slot-create-subject-${opt.value}`}
                          >
                            <Text
                              style={[
                                styles.pillText,
                                value === opt.value && styles.pillTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  />
                  {errors.subjectId ? (
                    <Text
                      style={styles.errorText}
                      testID="slot-create-subject-error"
                    >
                      {errors.subjectId.message}
                    </Text>
                  ) : null}
                </View>

                {slotType === "oneoff" ? (
                  <View
                    style={styles.dateTimeRow}
                    onLayout={(e) => {
                      registerFieldOffset("occurrenceDate")(e);
                      registerFieldOffset("start")(e);
                      registerFieldOffset("end")(e);
                    }}
                  >
                    <View style={styles.dateField}>
                      <Text style={styles.label}>
                        {t("timetable.classManager.fields.date")}
                      </Text>
                      <Controller
                        control={control}
                        name="occurrenceDate"
                        render={({ field: { value, onChange, onBlur } }) => (
                          <DatePickerField
                            value={value ?? ""}
                            onChange={onChange}
                            onBlur={onBlur}
                            title={t("timetable.classManager.fields.date")}
                            hasError={!!errors.occurrenceDate}
                            testID="slot-create-date-input"
                          />
                        )}
                      />
                      {errors.occurrenceDate ? (
                        <Text style={styles.errorText}>
                          {errors.occurrenceDate.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.timeField}>
                      <Text style={styles.label}>
                        {t("timetable.classManager.fields.start")}
                      </Text>
                      <Controller
                        control={control}
                        name="start"
                        render={({ field: { value, onChange, onBlur } }) => (
                          <TimePickerField
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            title={t(
                              "timetable.classManager.timePicker.startTitle",
                            )}
                            placeholder="08:00"
                            hasError={!!errors.start}
                            testID="slot-create-start-input"
                          />
                        )}
                      />
                      {errors.start ? (
                        <Text
                          style={styles.errorText}
                          testID="slot-create-start-error"
                        >
                          {errors.start.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.timeField}>
                      <Text style={styles.label}>
                        {t("timetable.classManager.fields.end")}
                      </Text>
                      <Controller
                        control={control}
                        name="end"
                        render={({ field: { value, onChange, onBlur } }) => (
                          <TimePickerField
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            title={t(
                              "timetable.classManager.timePicker.endTitle",
                            )}
                            placeholder="09:00"
                            hasError={!!errors.end}
                            testID="slot-create-end-input"
                          />
                        )}
                      />
                      {errors.end ? (
                        <Text
                          style={styles.errorText}
                          testID="slot-create-end-error"
                        >
                          {errors.end.message}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <View
                    onLayout={(e) => {
                      registerFieldOffset("weekdays")(e);
                      registerFieldOffset("activeFromDate")(e);
                      registerFieldOffset("activeToDate")(e);
                      registerFieldOffset("start")(e);
                      registerFieldOffset("end")(e);
                    }}
                  >
                    {/* Weekday selector */}
                    <Controller
                      control={control}
                      name="weekdays"
                      render={({ field }) => {
                        const weekdayOptions = [
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
                        ];
                        const values = field.value ?? [];
                        function toggle(v: string) {
                          if (values.includes(v)) {
                            const next = values.filter((d) => d !== v);
                            if (next.length > 0) field.onChange(next);
                          } else {
                            field.onChange([...values, v]);
                          }
                        }
                        return (
                          <View style={styles.section}>
                            <Text style={styles.label}>
                              {t("timetable.classManager.fields.days")}
                            </Text>
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.weekdayRow}
                            >
                              {weekdayOptions.map((opt) => {
                                const active = values.includes(opt.value);
                                return (
                                  <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                      styles.weekdayBtn,
                                      active && styles.weekdayBtnActive,
                                    ]}
                                    onPress={() => toggle(opt.value)}
                                    testID={`slot-create-weekday-${opt.value}`}
                                  >
                                    <Text
                                      style={[
                                        styles.weekdayBtnText,
                                        active && styles.weekdayBtnTextActive,
                                      ]}
                                    >
                                      {opt.label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        );
                      }}
                    />

                    <View style={styles.dateTimeRow}>
                      <View style={styles.dateField}>
                        <Text style={styles.label}>
                          {t("timetable.oneOffPanel.fields.activeFrom")}
                        </Text>
                        <Controller
                          control={control}
                          name="activeFromDate"
                          render={({ field: { value, onChange, onBlur } }) => (
                            <DatePickerField
                              value={value ?? ""}
                              onChange={onChange}
                              onBlur={onBlur}
                              title={t(
                                "timetable.oneOffPanel.fields.activeFrom",
                              )}
                              hasError={!!errors.activeFromDate}
                              testID="slot-create-activefrom-input"
                            />
                          )}
                        />
                        {errors.activeFromDate ? (
                          <Text style={styles.errorText}>
                            {errors.activeFromDate.message}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.dateField}>
                        <Text style={styles.label}>
                          {t("timetable.oneOffPanel.fields.activeTo")}
                        </Text>
                        <Controller
                          control={control}
                          name="activeToDate"
                          render={({ field: { value, onChange, onBlur } }) => (
                            <DatePickerField
                              value={value ?? ""}
                              onChange={onChange}
                              onBlur={onBlur}
                              title={t("timetable.oneOffPanel.fields.activeTo")}
                              hasError={!!errors.activeToDate}
                              testID="slot-create-activeto-input"
                            />
                          )}
                        />
                        {errors.activeToDate ? (
                          <Text style={styles.errorText}>
                            {errors.activeToDate.message}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.dateTimeRow}>
                      <View style={styles.timeField}>
                        <Text style={styles.label}>
                          {t("timetable.classManager.fields.start")}
                        </Text>
                        <Controller
                          control={control}
                          name="start"
                          render={({ field: { value, onChange, onBlur } }) => (
                            <TimePickerField
                              value={value}
                              onChange={onChange}
                              onBlur={onBlur}
                              title={t(
                                "timetable.classManager.timePicker.startTitle",
                              )}
                              placeholder="08:00"
                              hasError={!!errors.start}
                              testID="slot-create-start-input"
                            />
                          )}
                        />
                        {errors.start ? (
                          <Text
                            style={styles.errorText}
                            testID="slot-create-start-error"
                          >
                            {errors.start.message}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.timeField}>
                        <Text style={styles.label}>
                          {t("timetable.classManager.fields.end")}
                        </Text>
                        <Controller
                          control={control}
                          name="end"
                          render={({ field: { value, onChange, onBlur } }) => (
                            <TimePickerField
                              value={value}
                              onChange={onChange}
                              onBlur={onBlur}
                              title={t(
                                "timetable.classManager.timePicker.endTitle",
                              )}
                              placeholder="09:00"
                              hasError={!!errors.end}
                              testID="slot-create-end-input"
                            />
                          )}
                        />
                        {errors.end ? (
                          <Text
                            style={styles.errorText}
                            testID="slot-create-end-error"
                          >
                            {errors.end.message}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                )}

                {/* Room */}
                <View style={styles.section}>
                  <Text style={styles.label}>
                    {t("timetable.classManager.fields.room")}
                  </Text>
                  <Controller
                    control={control}
                    name="roomId"
                    render={({ field: { value, onChange } }) => (
                      <InlineSelectDropDown
                        options={availableRoomOptions}
                        value={value ?? ""}
                        onChange={onChange}
                        placeholder={t(
                          "timetable.classManager.fields.roomNone",
                        )}
                        testID="slot-create-room"
                      />
                    )}
                  />
                </View>

                {/* API error */}
                {apiError ? (
                  <View
                    style={styles.errorBanner}
                    testID="slot-create-api-error"
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color={colors.notification}
                    />
                    <Text style={styles.errorBannerText}>{apiError}</Text>
                  </View>
                ) : null}

                {/* Submit */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    isSaving && styles.submitBtnDisabled,
                  ]}
                  onPress={() => void onSave()}
                  disabled={isSaving}
                  testID="slot-create-save"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.white}
                      />
                      <Text style={styles.submitBtnText}>
                        {slotType === "recurring"
                          ? t("timetable.oneOffPanel.addRecurringButton")
                          : t("timetable.oneOffPanel.addButton")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : classId ? (
              <Text style={styles.ctxError}>
                {t("timetable.oneOffPanel.contextError")}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  content: {
    gap: 16,
    padding: 16,
  },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* Section */
  section: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  /* Type toggle */
  typeToggleRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  typeToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    backgroundColor: colors.white,
  },
  typeToggleActive: { backgroundColor: HERO_BG },
  typeToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  typeToggleTextActive: { color: colors.white },

  /* Pills */
  pillsRow: { flexDirection: "row", gap: 6, flexWrap: "nowrap" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillActive: { backgroundColor: HERO_BG, borderColor: HERO_BG },
  pillText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  pillTextActive: { color: colors.white },

  /* Weekday */
  weekdayRow: { flexDirection: "row", gap: 6 },
  weekdayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  weekdayBtnActive: { backgroundColor: HERO_BG, borderColor: HERO_BG },
  weekdayBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  weekdayBtnTextActive: { color: colors.white },

  /* Date/time row */
  dateTimeRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  dateField: { flex: 1.4, gap: 6 },
  timeField: { flex: 1, gap: 6 },

  /* Misc */
  loaderRow: { alignItems: "center", paddingVertical: 16 },
  errorText: { fontSize: 11, color: colors.notification, marginTop: 2 },
  ctxError: {
    fontSize: 13,
    color: colors.notification,
    textAlign: "center",
    paddingVertical: 12,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(220,53,69,0.07)",
    borderWidth: 1,
    borderColor: "rgba(220,53,69,0.2)",
    borderRadius: 8,
    padding: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.notification,
    lineHeight: 18,
  },

  /* Submit */
  submitBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: HERO_BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});
