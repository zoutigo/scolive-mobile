import React, { useEffect, useMemo, useRef } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
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
import { useTranslation } from "../../i18n/useTranslation";
import {
  buildLifeEventPayload,
  createDisciplineFormSchema,
  DISCIPLINE_TYPE_CONFIG,
  getDisciplineTypeLabel,
  type StudentLifeEvent,
  type StudentLifeEventType,
  type CreateLifeEventPayload,
  type DisciplineFormSchema,
  typeHasJustified,
} from "../../types/discipline.types";
import {
  getDefaultTeacherClassDisciplineDraft,
  useTeacherClassDisciplineDraftStore,
} from "../../store/teacher-class-discipline-draft.store";
import {
  StudentSelectField,
  type StudentSelectOption,
} from "./StudentSelectField";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";

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

const TYPES: StudentLifeEventType[] = [
  "ABSENCE",
  "RETARD",
  "SANCTION",
  "PUNITION",
];

type Props = {
  visible: boolean;
  classId: string;
  studentOptions: StudentSelectOption[];
  editing?: StudentLifeEvent | null;
  isSaving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: {
    studentId: string;
    payload: CreateLifeEventPayload;
  }) => Promise<void> | void;
};

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

export function TeacherClassDisciplineFormSheet({
  visible,
  classId,
  studentOptions,
  editing,
  isSaving = false,
  error,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const baseSchema = createDisciplineFormSchema(t);
  const schema = createTeacherClassDisciplineFormSchema(
    baseSchema,
    t("discipline.validation.studentRequired"),
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
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const occurredAtRef = useRef<TextInput>(null);
  const reasonRef = useRef<TextInput>(null);
  const durationRef = useRef<TextInput>(null);
  const {
    scrollViewRef,
    registerFieldOffset,
    registerFieldInputRef,
    focusFirstInvalidField,
  } = useScrollToFirstError<keyof FormValues>();
  registerFieldInputRef("occurredAt", occurredAtRef);
  registerFieldInputRef("reason", reasonRef);
  registerFieldInputRef("durationMinutes", durationRef);

  const FIELD_ORDER: Array<keyof FormValues> = [
    "studentId",
    "occurredAt",
    "reason",
    "durationMinutes",
  ];

  const watchedValues = watch();
  const selectedType = watch("type");

  useEffect(() => {
    if (!visible) return;
    reset(defaultValues);
  }, [defaultValues, reset, visible]);

  useEffect(() => {
    if (!visible || editing) return;
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
    visible,
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

  const onSave = handleSubmit(
    async (values) => {
      await onSubmit({
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
    (formErrors) => focusFirstInvalidField(FIELD_ORDER, formErrors),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet} testID="teacher-class-discipline-form-sheet">
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                {editing
                  ? t("discipline.form.eyebrowEdit")
                  : t("discipline.form.eyebrowCreate")}
              </Text>
              <Text style={styles.title}>{t("discipline.form.title")}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="discipline-form-close">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View onLayout={registerFieldOffset("studentId")}>
              <Controller
                control={control}
                name="studentId"
                render={({ field: { value, onChange } }) => (
                  <StudentSelectField
                    label={t("discipline.form.fields.student")}
                    value={value}
                    options={studentOptions}
                    onChange={onChange}
                    allowEmpty={false}
                    placeholder={t("discipline.form.fields.studentPlaceholder")}
                    testIDPrefix="discipline-form-student"
                  />
                )}
              />
              {errors.studentId ? (
                <Text style={styles.fieldError}>
                  {errors.studentId.message}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t("discipline.form.fields.type")}
              </Text>
              <View style={styles.typeRow}>
                {TYPES.map((type) => {
                  const cfg = DISCIPLINE_TYPE_CONFIG[type];
                  const typeLabel = getDisciplineTypeLabel(t, type);
                  const active = selectedType === type;
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
                      onPress={() => setValue("type", type)}
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
                          active && {
                            color: cfg.accent,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {typeLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View onLayout={registerFieldOffset("occurredAt")}>
              <Controller
                control={control}
                name="occurredAt"
                render={({ field: { value, onChange } }) => (
                  <FieldTextInput
                    ref={occurredAtRef}
                    label={t("discipline.form.fields.dateTime")}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t(
                      "discipline.form.fields.dateTimePlaceholderIso",
                    )}
                    testID="discipline-form-occurred-at"
                  />
                )}
              />
              {errors.occurredAt ? (
                <Text style={styles.fieldError}>
                  {errors.occurredAt.message}
                </Text>
              ) : null}
            </View>

            <View onLayout={registerFieldOffset("reason")}>
              <Controller
                control={control}
                name="reason"
                render={({ field: { value, onChange } }) => (
                  <FieldTextInput
                    ref={reasonRef}
                    label={t("discipline.form.fields.description")}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t(
                      "discipline.form.fields.reasonPlaceholderShort",
                    )}
                    multiline
                    testID="discipline-form-reason"
                  />
                )}
              />
              {errors.reason ? (
                <Text style={styles.fieldError}>{errors.reason.message}</Text>
              ) : null}
            </View>

            <View onLayout={registerFieldOffset("durationMinutes")}>
              <Controller
                control={control}
                name="durationMinutes"
                render={({ field: { value, onChange } }) => (
                  <FieldTextInput
                    ref={durationRef}
                    label={t("discipline.form.fields.duration")}
                    value={value}
                    onChangeText={onChange}
                    placeholder={t(
                      "discipline.form.fields.durationPlaceholderAlt",
                    )}
                    keyboardType="numeric"
                    testID="discipline-form-duration"
                  />
                )}
              />
              {errors.durationMinutes ? (
                <Text style={styles.fieldError}>
                  {errors.durationMinutes.message}
                </Text>
              ) : null}
            </View>

            {typeHasJustified(selectedType) ? (
              <Controller
                control={control}
                name="justified"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.switchRow}>
                    <View style={styles.switchTextBlock}>
                      <Text style={styles.fieldLabel}>
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
              render={({ field: { value, onChange } }) => (
                <FieldTextInput
                  label={t("discipline.form.fields.comment")}
                  value={value}
                  onChangeText={onChange}
                  placeholder={t(
                    "discipline.form.fields.commentPlaceholderAlt",
                  )}
                  multiline
                  testID="discipline-form-comment"
                />
              )}
            />

            {error ? (
              <View style={styles.errorBox} testID="discipline-form-error">
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.notification}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
              testID="discipline-form-cancel"
            >
              <Text style={styles.cancelBtnText}>
                {t("discipline.form.buttons.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
              onPress={() => void onSave()}
              disabled={isSaving}
              testID="discipline-form-submit"
            >
              <Text style={styles.submitBtnText}>{submitLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const FieldTextInput = React.forwardRef<
  TextInput,
  {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    keyboardType?: "default" | "numeric";
    multiline?: boolean;
    testID: string;
  }
>(function FieldTextInput(props, ref) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        ref={ref}
        style={[styles.input, props.multiline && styles.inputMultiline]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={props.keyboardType}
        multiline={props.multiline}
        numberOfLines={props.multiline ? 4 : 1}
        textAlignVertical={props.multiline ? "top" : "center"}
        testID={props.testID}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderBottomWidth: 0,
    minHeight: "70%",
    maxHeight: "92%",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.warmAccent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 14,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 104,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    minHeight: 38,
    borderRadius: 999,
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
    borderRadius: 18,
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
  fieldError: {
    marginTop: -6,
    color: colors.notification,
    fontSize: 12,
    fontWeight: "600",
  },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFF5F5",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: colors.notification,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  cancelBtnText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  submitBtn: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
