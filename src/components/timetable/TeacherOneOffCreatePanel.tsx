import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { timetableApi } from "../../api/timetable.api";
import { roomsApi } from "../../api/rooms.api";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { TimePickerField } from "../TimePickerField";
import type { RoomAvailability } from "../../types/room.types";
import type {
  ClassTimetableContextResponse,
  TimetableClassOption,
} from "../../types/timetable.types";
import { timeLabelToMinute, toIsoDateString } from "../../utils/timetable";
import { extractApiError } from "../../utils/api-error";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";

// ─── Constants ────────────────────────────────────────────────────────────────

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{1,2}:\d{2}$/;

const WEEKDAY_KEYS: Record<number, string> = {
  0: "timetable.weekdays.sunFull",
  1: "timetable.weekdays.monFull",
  2: "timetable.weekdays.tueFull",
  3: "timetable.weekdays.wedFull",
  4: "timetable.weekdays.thuFull",
  5: "timetable.weekdays.friFull",
  6: "timetable.weekdays.satFull",
  7: "timetable.weekdays.sunFull",
};

// ─── Schema ───────────────────────────────────────────────────────────────────

function createSchema(t: TranslateFn) {
  return z
    .object({
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
      // One-off only
      occurrenceDate: z.string().optional(),
      // Recurring only
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

interface TeacherOneOffCreatePanelProps {
  schoolSlug: string;
  prefilledClassId?: string;
  prefilledDate?: string;
  allClasses: TimetableClassOption[];
  prefilledTeacherId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherOneOffCreatePanel({
  schoolSlug,
  prefilledClassId,
  prefilledDate,
  allClasses,
  prefilledTeacherId,
  onClose,
  onSuccess,
}: TeacherOneOffCreatePanelProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { showSuccess } = useSuccessToastStore();
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pickedClassId, setPickedClassId] = useState<string>("");
  const [classCtx, setClassCtx] =
    useState<ClassTimetableContextResponse | null>(null);
  const [isLoadingCtx, setIsLoadingCtx] = useState(false);
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability[]>(
    [],
  );
  const prevClassId = useRef<string>("");

  const schema = useMemo(() => createSchema(t), [t]);

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
      slotType: "oneoff",
      subjectId: "",
      start: "08:00",
      end: "09:00",
      roomId: "",
      occurrenceDate: prefilledDate ?? toIsoDateString(new Date()),
      activeFromDate: prefilledDate ?? toIsoDateString(new Date()),
      activeToDate: "",
    },
  });

  const slotType = watch("slotType");
  const occurrenceDate = watch("occurrenceDate");
  const activeFromDate = watch("activeFromDate");
  const start = watch("start");
  const end = watch("end");

  // Resolved class id: from prop or from picker
  const resolvedClassId = prefilledClassId ?? pickedClassId;

  // Load class context when the resolved class changes
  useEffect(() => {
    if (!resolvedClassId || resolvedClassId === prevClassId.current) return;
    prevClassId.current = resolvedClassId;
    setClassCtx(null);
    setApiError(null);
    setIsLoadingCtx(true);
    timetableApi
      .getClassContext(schoolSlug, resolvedClassId)
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
  }, [resolvedClassId, schoolSlug, user?.id, setValue, prefilledTeacherId]);

  // Date used for room availability: from occurrenceDate (oneoff) or activeFromDate (recurring)
  const dateForRooms = slotType === "oneoff" ? occurrenceDate : activeFromDate;

  // Weekday derived from the reference date
  const weekdayForRooms = useMemo(() => {
    if (!dateForRooms || !ISO_DATE_REGEX.test(dateForRooms)) return null;
    return new Date(`${dateForRooms}T00:00:00`).getDay() || 7;
  }, [dateForRooms]);

  // Weekday label (e.g. "Lundi")
  const weekdayLabel = useMemo(() => {
    if (weekdayForRooms === null) return null;
    const key =
      (WEEKDAY_KEYS[weekdayForRooms] as Parameters<typeof t>[0]) ??
      "timetable.weekdays.monFull";
    return t(key);
  }, [weekdayForRooms, t]);

  // Fetch available rooms whenever date/time changes
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

  // Only subjects the teacher teaches in the selected class
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

  // Only truly available rooms (exclude maintenance/unavailable/full)
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
    () =>
      prefilledClassId
        ? (allClasses.find((c) => c.classId === prefilledClassId)?.className ??
          classCtx?.class.name)
        : (allClasses.find((c) => c.classId === resolvedClassId)?.className ??
          null),
    [allClasses, classCtx, resolvedClassId, prefilledClassId],
  );

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSave = handleSubmit(async (values) => {
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
        await timetableApi.createOneOffSlot(schoolSlug, resolvedClassId, {
          schoolYearId,
          occurrenceDate: values.occurrenceDate!,
          startMinute,
          endMinute,
          subjectId: values.subjectId,
          teacherUserId,
          roomId: values.roomId || null,
          status: "PLANNED",
        });
        onSuccess();
        showSuccess({
          title: t("timetable.oneOffPanel.toasts.createdTitle"),
          message: t("timetable.oneOffPanel.toasts.createdMessage"),
        });
      } else {
        const fromDate = values.activeFromDate!;
        const weekday = new Date(`${fromDate}T00:00:00`).getDay() || 7;
        await timetableApi.createRecurringSlot(schoolSlug, resolvedClassId, {
          schoolYearId,
          weekday,
          startMinute,
          endMinute,
          subjectId: values.subjectId,
          teacherUserId,
          roomId: values.roomId || null,
          activeFromDate: fromDate,
          activeToDate: values.activeToDate?.trim() || null,
        });
        onSuccess();
        showSuccess({
          title: t("timetable.oneOffPanel.toasts.recurringCreatedTitle"),
          message: t("timetable.oneOffPanel.toasts.recurringCreatedMessage"),
        });
      }
    } catch (err) {
      // Inline error — global toast is invisible behind the Modal overlay
      setApiError(extractApiError(err));
    } finally {
      setIsSaving(false);
    }
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  const classIsKnown = !!prefilledClassId || !!resolvedClassId;

  return (
    <View style={styles.panel} testID="teacher-oneoff-create-panel">
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="calendar-outline" size={18} color={colors.white} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {t("timetable.oneOffPanel.title")}
            </Text>
            {selectedClassName ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {selectedClassName}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerClose}
          testID="teacher-oneoff-create-close"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Class picker — only when no class is known yet */}
        {!classIsKnown ? (
          <View style={styles.section}>
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
                    pickedClassId === cls.classId && styles.pillActive,
                  ]}
                  onPress={() => setPickedClassId(cls.classId)}
                  testID={`teacher-oneoff-class-${cls.classId}`}
                >
                  <Text
                    style={[
                      styles.pillText,
                      pickedClassId === cls.classId && styles.pillTextActive,
                    ]}
                  >
                    {cls.className}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Loading context */}
        {isLoadingCtx ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color={colors.primary} />
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
                      testID="teacher-oneoff-type-oneoff"
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
                      testID="teacher-oneoff-type-recurring"
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
                          value === "recurring" && styles.typeToggleTextActive,
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
            <View style={styles.section}>
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
                        testID={`teacher-oneoff-subject-${opt.value}`}
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
                <Text style={styles.errorText}>{errors.subjectId.message}</Text>
              ) : null}
            </View>

            {slotType === "oneoff" ? (
              /* ── One-off : date + heures ── */
              <View style={styles.dateTimeRow}>
                <View style={styles.dateField}>
                  <Text style={styles.label}>
                    {t("timetable.classManager.fields.date")}
                  </Text>
                  <Controller
                    control={control}
                    name="occurrenceDate"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        style={[
                          styles.dateInput,
                          errors.occurrenceDate && styles.inputError,
                        ]}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="2026-04-28"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numbers-and-punctuation"
                        testID="teacher-oneoff-date-input"
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
                        testID="teacher-oneoff-start-input"
                      />
                    )}
                  />
                  {errors.start ? (
                    <Text
                      style={styles.errorText}
                      testID="teacher-oneoff-start-error"
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
                        title={t("timetable.classManager.timePicker.endTitle")}
                        placeholder="09:00"
                        hasError={!!errors.end}
                        testID="teacher-oneoff-end-input"
                      />
                    )}
                  />
                  {errors.end ? (
                    <Text
                      style={styles.errorText}
                      testID="teacher-oneoff-end-error"
                    >
                      {errors.end.message}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : (
              /* ── Récurrent : dates de récurrence + heures ── */
              <>
                {/* Weekday badge */}
                {weekdayLabel ? (
                  <View
                    style={styles.weekdayBadge}
                    testID="teacher-oneoff-weekday-label"
                  >
                    <Ionicons
                      name="repeat-outline"
                      size={13}
                      color={colors.primary}
                    />
                    <Text style={styles.weekdayBadgeText}>
                      {t("timetable.oneOffPanel.fields.weekdayLabel")} :{" "}
                      <Text style={styles.weekdayBadgeEmphasis}>
                        {weekdayLabel}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.dateTimeRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.label}>
                      {t("timetable.oneOffPanel.fields.activeFrom")}
                    </Text>
                    <Controller
                      control={control}
                      name="activeFromDate"
                      render={({ field: { value, onChange, onBlur } }) => (
                        <TextInput
                          style={[
                            styles.dateInput,
                            errors.activeFromDate && styles.inputError,
                          ]}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="2026-09-01"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numbers-and-punctuation"
                          testID="teacher-oneoff-activefrom-input"
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
                        <TextInput
                          style={[
                            styles.dateInput,
                            errors.activeToDate && styles.inputError,
                          ]}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="2027-06-30"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numbers-and-punctuation"
                          testID="teacher-oneoff-activeto-input"
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
                          testID="teacher-oneoff-start-input"
                        />
                      )}
                    />
                    {errors.start ? (
                      <Text
                        style={styles.errorText}
                        testID="teacher-oneoff-start-error"
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
                          testID="teacher-oneoff-end-input"
                        />
                      )}
                    />
                    {errors.end ? (
                      <Text
                        style={styles.errorText}
                        testID="teacher-oneoff-end-error"
                      >
                        {errors.end.message}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </>
            )}

            {/* Room picker — available rooms only */}
            <View style={styles.section}>
              <Text style={styles.label}>
                {t("timetable.classManager.fields.room")}
              </Text>
              <Controller
                control={control}
                name="roomId"
                render={({ field: { value, onChange } }) => (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pillsRow}
                  >
                    {availableRoomOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.pill,
                          value === opt.value && styles.pillActive,
                        ]}
                        onPress={() => onChange(opt.value)}
                        testID={`teacher-oneoff-room-${opt.value || "none"}`}
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
            </View>

            {/* API error banner — visible inside the Modal */}
            {apiError ? (
              <View
                style={styles.errorBanner}
                testID="teacher-oneoff-api-error"
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
              style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
              onPress={() => void onSave()}
              disabled={isSaving}
              testID="teacher-oneoff-create-save"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                  <Text style={styles.submitBtnText}>
                    {slotType === "recurring"
                      ? t("timetable.oneOffPanel.addRecurringButton")
                      : t("timetable.oneOffPanel.addButton")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : resolvedClassId ? (
          <Text style={styles.ctxError}>
            {t("timetable.oneOffPanel.contextError")}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
  },

  /* Header */
  header: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  headerClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Body */
  body: {
    padding: 16,
    gap: 14,
  },

  /* Section */
  section: {
    gap: 6,
  },

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
  typeToggleActive: {
    backgroundColor: colors.primary,
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  typeToggleTextActive: {
    color: colors.white,
  },

  /* Pills */
  pillsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "nowrap",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  pillTextActive: {
    color: colors.white,
  },

  /* Weekday badge */
  weekdayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(8,70,125,0.07)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  weekdayBadgeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  weekdayBadgeEmphasis: {
    fontWeight: "700",
    color: colors.primary,
  },

  /* Date + time row */
  dateTimeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  dateField: {
    flex: 1.4,
    gap: 6,
  },
  timeField: {
    flex: 1,
    gap: 6,
  },
  dateInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.notification,
  },

  /* Misc */
  loaderRow: {
    alignItems: "center",
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 11,
    color: colors.notification,
    marginTop: 2,
  },
  ctxError: {
    fontSize: 13,
    color: colors.notification,
    textAlign: "center",
    paddingVertical: 12,
  },

  /* API error banner */
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
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
