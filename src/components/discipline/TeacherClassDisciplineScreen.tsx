import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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
import { useTranslation } from "../../i18n/useTranslation";
import type { TranslateFn } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useDisciplineStore } from "../../store/discipline.store";
import { notesApi } from "../../api/notes.api";
import { timetableApi } from "../../api/timetable.api";
import { disciplineApi } from "../../api/discipline.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";
import { DisciplineList } from "./DisciplineList";
import { DisciplineDeleteDialog } from "./DisciplineDeleteDialog";
import { DisciplineSummaryOverview } from "./DisciplineSummaryOverview";
import {
  StudentSelectField,
  type StudentSelectOption,
} from "./StudentSelectField";
import { DatePickerField } from "../DatePickerField";
import { TimePickerField } from "../TimePickerField";
import {
  buildLifeEventPayload,
  createDisciplineFormSchema,
  DISCIPLINE_TYPE_CONFIG,
  getDisciplineTypeLabel,
  typeHasJustified,
  type DisciplineFormSchema,
  type StudentLifeEvent,
  type StudentLifeEventType,
} from "../../types/discipline.types";
import {
  getDefaultTeacherClassDisciplineDraft,
  useTeacherClassDisciplineDraftStore,
} from "../../store/teacher-class-discipline-draft.store";
import type { NotesTeacherContext } from "../../types/notes.types";
import type { ClassTimetableContextResponse } from "../../types/timetable.types";
import type { CreateLifeEventPayload } from "../../types/discipline.types";
import { moduleBack } from "../../utils/moduleBack";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "events" | "carnets" | "forms";
type ListTabKey = "events" | "carnets";

type FormContext = {
  type: "create-event" | "edit-event";
  originTab: ListTabKey;
  item: StudentLifeEvent | null;
};

const LIST_TAB_KEYS = [
  { key: "events", labelKey: "discipline.tabs.events" },
  { key: "carnets", labelKey: "discipline.tabs.booklets" },
] as const;

const TYPES: StudentLifeEventType[] = [
  "ABSENCE",
  "RETARD",
  "SANCTION",
  "PUNITION",
];

const POWER_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
]);

// ---------------------------------------------------------------------------
// Form schema / values
// ---------------------------------------------------------------------------

function createTeacherClassDisciplineFormSchema(
  baseSchema: DisciplineFormSchema,
  studentRequiredMessage: string,
) {
  return baseSchema.extend({
    studentId: z.string().min(1, studentRequiredMessage),
  });
}

type FormValues = z.infer<
  ReturnType<typeof createTeacherClassDisciplineFormSchema>
>;

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

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

function eventToFormValues(event: StudentLifeEvent): FormValues {
  const date = new Date(event.occurredAt);
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    studentId: event.studentId,
    type: event.type,
    occurredAt: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`,
    reason: event.reason,
    durationMinutes:
      event.durationMinutes != null ? String(event.durationMinutes) : "",
    justified: event.justified ?? false,
    comment: event.comment ?? "",
  };
}

function buildCreateDefaults(classId: string): FormValues {
  const draft =
    useTeacherClassDisciplineDraftStore.getState().getDraft(classId) ??
    getDefaultTeacherClassDisciplineDraft();

  return {
    studentId: draft.studentId,
    type: draft.type,
    occurredAt: draft.occurredAt,
    reason: draft.reason,
    durationMinutes: draft.durationMinutes,
    justified: draft.justified,
    comment: draft.comment,
  };
}

// ---------------------------------------------------------------------------
// FieldTextInput — champ texte inline avec forward de ref pour RHF setFocus
// ---------------------------------------------------------------------------

type FieldTextInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  testID: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
};

const FieldTextInput = React.forwardRef<TextInput, FieldTextInputProps>(
  function FieldTextInput(props, ref) {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{props.label}</Text>
        <TextInput
          ref={ref}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={() => {
            setFocused(false);
            props.onBlur();
          }}
          onFocus={() => setFocused(true)}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={props.keyboardType}
          multiline={props.multiline}
          numberOfLines={props.multiline ? 4 : 1}
          textAlignVertical={props.multiline ? "top" : "center"}
          style={[
            styles.formInput,
            props.multiline && styles.formInputMultiline,
            focused && styles.formInputFocused,
            props.error ? styles.formInputError : null,
          ]}
          testID={props.testID}
        />
        {props.error ? (
          <Text style={styles.formError} testID={`${props.testID}-error`}>
            {props.error}
          </Text>
        ) : null}
      </View>
    );
  },
);

// ---------------------------------------------------------------------------
// DisciplineEventFormContent — formulaire inline de création / édition
// ---------------------------------------------------------------------------

function DisciplineEventFormContent(props: {
  t: TranslateFn;
  classId: string;
  studentOptions: StudentSelectOption[];
  editing: StudentLifeEvent | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    studentId: string;
    payload: CreateLifeEventPayload;
  }) => Promise<void> | void;
}) {
  const { t, classId, editing } = props;
  const baseSchema = useMemo(() => createDisciplineFormSchema(t), [t]);
  const schema = useMemo(
    () =>
      createTeacherClassDisciplineFormSchema(
        baseSchema,
        t("discipline.validation.studentRequired"),
      ),
    [baseSchema, t],
  );

  const saveDraft = useTeacherClassDisciplineDraftStore(
    (state) => state.saveDraft,
  );
  const clearDraft = useTeacherClassDisciplineDraftStore(
    (state) => state.clearDraft,
  );

  const defaultValues = useMemo(
    () => (editing ? eventToFormValues(editing) : buildCreateDefaults(classId)),
    [classId, editing],
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedValues = watch();
  const selectedType = watch("type");

  useEffect(() => {
    if (editing) return;
    saveDraft(classId, {
      studentId: watchedValues.studentId ?? "",
      type: watchedValues.type ?? "ABSENCE",
      occurredAt: watchedValues.occurredAt ?? "",
      reason: watchedValues.reason ?? "",
      durationMinutes: watchedValues.durationMinutes ?? "",
      justified: watchedValues.justified ?? false,
      comment: watchedValues.comment ?? "",
    });
  }, [
    classId,
    editing,
    saveDraft,
    watchedValues.comment,
    watchedValues.durationMinutes,
    watchedValues.justified,
    watchedValues.occurredAt,
    watchedValues.reason,
    watchedValues.studentId,
    watchedValues.type,
  ]);

  useEffect(() => {
    if (typeHasJustified(selectedType)) return;
    setValue("justified", false);
  }, [selectedType, setValue]);

  const submitLabel = editing
    ? t("discipline.form.buttons.edit")
    : t("discipline.form.buttons.create");

  const onValid = handleSubmit(
    async (values) => {
      await props.onSubmit({
        studentId: values.studentId,
        payload: {
          ...buildLifeEventPayload(values, baseSchema),
          classId,
        },
      });
      if (!editing) {
        clearDraft(classId);
        reset(buildCreateDefaults(classId));
      }
    },
    (formErrors) => {
      const first = Object.keys(formErrors)[0];
      if (first) setFocus(first as Parameters<typeof setFocus>[0]);
    },
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="teacher-class-discipline-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="studentId"
          render={({ field: { value, onChange } }) => (
            <View style={styles.formField}>
              <StudentSelectField
                label={t("discipline.form.fields.student")}
                value={value}
                options={props.studentOptions}
                onChange={onChange}
                allowEmpty={false}
                placeholder={t("discipline.form.fields.studentPlaceholder")}
                testIDPrefix="discipline-form-student"
              />
              {errors.studentId ? (
                <Text
                  style={styles.formError}
                  testID="discipline-form-student-error"
                >
                  {errors.studentId.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <View style={styles.formField}>
              <Text style={styles.formLabel}>
                {t("discipline.form.fields.type")}
              </Text>
              <View style={styles.typeRow}>
                {TYPES.map((type) => {
                  const cfg = DISCIPLINE_TYPE_CONFIG[type];
                  const typeLabel = getDisciplineTypeLabel(t, type);
                  const active = value === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        active && {
                          backgroundColor: cfg.bg,
                          borderColor: cfg.accent,
                        },
                      ]}
                      onPress={() => onChange(type)}
                      testID={`discipline-form-type-${type}`}
                    >
                      <Ionicons
                        name={cfg.icon as "time-outline"}
                        size={14}
                        color={active ? cfg.accent : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeChipLabel,
                          active && { color: cfg.accent, fontWeight: "700" },
                        ]}
                      >
                        {typeLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="occurredAt"
          render={({ field: { value, onChange } }) => {
            const datePart = value ? (value.split("T")[0] ?? "") : "";
            const timePart = value ? (value.split("T")[1] ?? "08:00") : "08:00";
            return (
              <View style={styles.formField}>
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeCol}>
                    <Text style={styles.formLabel}>
                      {t("discipline.form.fields.date")}
                    </Text>
                    <DatePickerField
                      value={datePart}
                      onChange={(newDate) => onChange(`${newDate}T${timePart}`)}
                      title={t("discipline.form.fields.date")}
                      hasError={!!errors.occurredAt}
                      testID="discipline-form-date-picker"
                    />
                  </View>
                  <View style={styles.dateTimeCol}>
                    <Text style={styles.formLabel}>
                      {t("discipline.form.fields.time")}
                    </Text>
                    <TimePickerField
                      value={timePart}
                      onChange={(newTime) => onChange(`${datePart}T${newTime}`)}
                      title={t("discipline.form.fields.time")}
                      hasError={!!errors.occurredAt}
                      testID="discipline-form-time-picker"
                    />
                  </View>
                </View>
                {errors.occurredAt ? (
                  <Text style={styles.formError}>
                    {errors.occurredAt.message}
                  </Text>
                ) : null}
              </View>
            );
          }}
        />

        <Controller
          control={control}
          name="reason"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <FieldTextInput
              ref={ref}
              label={t("discipline.form.fields.description")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("discipline.form.fields.reasonPlaceholderShort")}
              error={errors.reason?.message}
              multiline
              testID="discipline-form-reason"
            />
          )}
        />

        <Controller
          control={control}
          name="durationMinutes"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <FieldTextInput
              ref={ref}
              label={t("discipline.form.fields.duration")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("discipline.form.fields.durationPlaceholderAlt")}
              error={errors.durationMinutes?.message}
              keyboardType="numeric"
              testID="discipline-form-duration"
            />
          )}
        />

        {typeHasJustified(selectedType) ? (
          <Controller
            control={control}
            name="justified"
            render={({ field: { value, onChange } }) => (
              <View style={styles.switchRow}>
                <View style={styles.switchTextBlock}>
                  <Text style={styles.formLabel}>
                    {t("discipline.form.fields.justified")}
                  </Text>
                  <Text style={styles.switchSub}>
                    {t("discipline.form.fields.justifiedHintAlt")}
                  </Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  thumbColor={value ? colors.accentTeal : colors.warmBorder}
                  trackColor={{
                    false: colors.border,
                    true: `${colors.accentTeal}66`,
                  }}
                  testID="discipline-form-justified"
                />
              </View>
            )}
          />
        ) : null}

        <Controller
          control={control}
          name="comment"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <FieldTextInput
              ref={ref}
              label={t("discipline.form.fields.comment")}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("discipline.form.fields.commentPlaceholderAlt")}
              multiline
              testID="discipline-form-comment"
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={props.onCancel}
          testID="discipline-form-cancel"
        >
          <Text style={styles.secondaryActionLabel}>
            {t("discipline.form.buttons.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.primaryAction,
            props.isSubmitting && styles.primaryActionDisabled,
          ]}
          disabled={props.isSubmitting}
          onPress={() => void onValid()}
          testID="discipline-form-submit"
        >
          <Text style={styles.primaryActionLabel}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// TeacherClassDisciplineScreen
// ---------------------------------------------------------------------------

export function TeacherClassDisciplineScreen({
  showHeader = true,
}: {
  showHeader?: boolean;
} = {}) {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ classId?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
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
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("events");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [teacherContext, setTeacherContext] =
    useState<NotesTeacherContext | null>(null);
  const [classContext, setClassContext] =
    useState<ClassTimetableContextResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [eventStudentId, setEventStudentId] = useState("");
  const [carnetStudentId, setCarnetStudentId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<StudentLifeEvent | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
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
      setLoadError(t("discipline.errors.loadContext"));
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
        setLoadError(t("discipline.errors.loadEvents"));
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

  function exitForms() {
    const origin = formContext?.originTab ?? "events";
    setFormContext(null);
    setTab(origin);
  }

  function openCreateForm() {
    setFormContext({ type: "create-event", originTab: "events", item: null });
    setTab("forms");
  }

  function openEditForm(event: StudentLifeEvent) {
    setFormContext({ type: "edit-event", originTab: "events", item: event });
    setTab("forms");
  }

  async function handleSubmitForm(input: {
    studentId: string;
    payload: CreateLifeEventPayload;
  }) {
    if (!schoolSlug || !formContext) return;
    const editingEvent = formContext.item;
    const originTab = formContext.originTab;
    setIsSavingForm(true);
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
          message: t("discipline.toasts.eventUpdatedMessageClassUpdated"),
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
          message: t("discipline.toasts.eventCreatedMessageClass"),
        });
      }
      setTimeout(() => {
        setTab(originTab);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: t("discipline.errors.saveTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("discipline.errors.saveGeneric"),
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

  const subtitle = teacherContext?.class.name
    ? [user?.schoolName, teacherContext.class.name].filter(Boolean).join(" · ")
    : (user?.schoolName ?? null);

  return (
    <View style={styles.root} testID="teacher-class-discipline-screen">
      {showHeader ? (
        <View style={styles.headerWrap}>
          <ModuleHeader
            title={t("discipline.header.discipline")}
            subtitle={subtitle}
            onBack={() => (tab === "forms" ? exitForms() : moduleBack(router))}
            testID="teacher-class-discipline-header"
            backTestID="teacher-class-discipline-back"
            topInset={insets.top}
          />
        </View>
      ) : null}

      {tab !== "forms" ? (
        <UnderlineTabs
          items={LIST_TAB_KEYS.map((item) => ({
            key: item.key,
            label: t(item.labelKey),
            badge:
              item.key === "events"
                ? classEvents.length
                : carnetStudentId
                  ? carnetEvents.length
                  : 0,
          }))}
          activeKey={tab as ListTabKey}
          onSelect={(key) => setTab(key as TabKey)}
          testIDPrefix="teacher-class-discipline-tab"
        />
      ) : null}

      {loadError ? <ErrorBanner message={loadError} /> : null}

      {/* ── Tab forms : hero + formulaire inline ──────────────────────────── */}
      {tab === "forms" && formContext ? (
        <View
          style={styles.formsTabContent}
          testID="teacher-class-discipline-forms-tab"
        >
          <View style={styles.heroWrapper}>
            <FormHero
              icon={
                formContext.type === "edit-event"
                  ? "create-outline"
                  : "add-circle-outline"
              }
              title={
                formContext.type === "edit-event"
                  ? t("discipline.form.hero.editTitle")
                  : t("discipline.form.hero.createTitle")
              }
              subtitle={
                formContext.type === "edit-event"
                  ? t("discipline.form.hero.editSubtitle")
                  : t("discipline.form.hero.createSubtitle")
              }
              palette={formContext.type === "edit-event" ? "warm" : "teal"}
              testID="teacher-class-discipline-form-hero"
            />
          </View>
          <DisciplineEventFormContent
            t={t}
            classId={classId}
            studentOptions={studentOptions}
            editing={formContext.item}
            isSubmitting={isSavingForm}
            onCancel={exitForms}
            onSubmit={handleSubmitForm}
          />
        </View>
      ) : null}

      {tab !== "forms" ? (
        isLoadingContext && !teacherContext ? (
          <View style={styles.centered}>
            <LoadingBlock label={t("discipline.loading.generic")} />
          </View>
        ) : !teacherContext ? (
          <View style={styles.centered}>
            <EmptyState
              icon="shield-outline"
              title={t("discipline.empty.discipline.title")}
              message={t("discipline.empty.discipline.message")}
            />
          </View>
        ) : tab === "events" ? (
          <View style={styles.body}>
            <View style={styles.heroWrapper}>
              <FormHero
                icon="shield-checkmark-outline"
                title={t("discipline.sections.classEvents.title")}
                subtitle={t("discipline.sections.classEvents.subtitle")}
                palette="primary"
                testID="teacher-class-discipline-events-hero"
              />
            </View>
            <View
              style={styles.filterCardWrapper}
              testID="teacher-class-discipline-events-card"
            >
              <StudentSelectField
                value={eventStudentId}
                options={studentOptions}
                onChange={setEventStudentId}
                allowEmpty
                emptyOptionLabel={t("discipline.filters.allStudents")}
                testIDPrefix="teacher-class-discipline-events-student"
              />
            </View>

            <DisciplineList
              events={classEvents}
              isLoading={isLoadingEvents}
              isRefreshing={isRefreshing}
              onRefresh={() => {
                void refreshAll();
              }}
              emptyTitle={t("discipline.empty.noClassEvents.title")}
              emptySub={t("discipline.empty.noClassEvents.message")}
              showActions
              getHeadline={(event) =>
                studentNameById[event.studentId] ??
                t("discipline.header.student")
              }
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
              onEdit={openEditForm}
              onDelete={(event) => setDeleteTarget(event)}
              testID="teacher-class-discipline-events-list"
            />

            <TouchableOpacity
              style={[
                styles.fab,
                { bottom: insets.bottom + 18 + BOTTOM_TAB_BAR_HEIGHT },
              ]}
              onPress={openCreateForm}
              testID="teacher-class-discipline-fab"
              accessibilityLabel={t("discipline.fab.addEvent")}
            >
              <Ionicons name="add" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.heroWrapper}>
              <FormHero
                icon="book-outline"
                title={t("discipline.sections.booklets.title")}
                subtitle={t("discipline.sections.booklets.subtitle")}
                palette="primary"
                testID="teacher-class-discipline-carnets-hero"
              />
            </View>
            <View
              style={styles.filterCardWrapper}
              testID="teacher-class-discipline-carnets-card"
            >
              <StudentSelectField
                value={carnetStudentId}
                options={studentOptions}
                onChange={setCarnetStudentId}
                allowEmpty
                emptyOptionLabel={t("discipline.studentSelect.placeholder")}
                testIDPrefix="teacher-class-discipline-carnets-student"
              />
            </View>

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
                  title={t("discipline.empty.chooseStudent.title")}
                  message={t("discipline.empty.chooseStudentClass.message")}
                />
              </View>
            )}
          </View>
        )
      ) : null}

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
  headerWrap: {},
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
  // ── Inline form layout ────────────────────────────────────────────────
  formsTabContent: {
    flex: 1,
  },
  heroWrapper: {
    padding: 16,
  },
  filterCardWrapper: {
    paddingHorizontal: 16,
  },
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  // ── Form fields ───────────────────────────────────────────────────────
  formField: {
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateTimeCol: {
    flex: 1,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  formInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  formInputMultiline: {
    minHeight: 104,
  },
  formInputFocused: {
    borderColor: colors.primary,
  },
  formInputError: {
    borderColor: "#B84A3B",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    minHeight: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeChipLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
  },
  switchRow: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  switchTextBlock: {
    flex: 1,
    gap: 4,
  },
  switchSub: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  secondaryActionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1.2,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
