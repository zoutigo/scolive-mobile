import React, { useEffect, useMemo } from "react";
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
import {
  buildLifeEventPayload,
  DISCIPLINE_TYPE_CONFIG,
  disciplineFormSchema,
  type StudentLifeEvent,
  type StudentLifeEventType,
  type CreateLifeEventPayload,
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

const teacherClassDisciplineFormSchema = disciplineFormSchema.extend({
  studentId: z.string().min(1, "Choisissez un élève."),
});

type FormValues = z.infer<typeof teacherClassDisciplineFormSchema>;

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
    resolver: zodResolver(teacherClassDisciplineFormSchema),
    defaultValues,
  });

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
    ? "Enregistrer les modifications"
    : "Créer l'événement";

  const onSave = handleSubmit(async (values) => {
    await onSubmit({
      studentId: values.studentId,
      payload: {
        ...buildLifeEventPayload(values),
        classId,
      },
    });
    if (!editing) {
      clearDraft(classId);
      reset(buildCreateDefaults(classId));
    }
  });

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
                {editing ? "Modification" : "Nouvel événement"}
              </Text>
              <Text style={styles.title}>Discipline</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="discipline-form-close">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Controller
              control={control}
              name="studentId"
              render={({ field: { value, onChange } }) => (
                <StudentSelectField
                  label="Élève"
                  value={value}
                  options={studentOptions}
                  onChange={onChange}
                  allowEmpty={false}
                  placeholder="Choisir un élève"
                  testIDPrefix="discipline-form-student"
                />
              )}
            />
            {errors.studentId ? (
              <Text style={styles.fieldError}>{errors.studentId.message}</Text>
            ) : null}

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Type d'événement</Text>
              <View style={styles.typeRow}>
                {TYPES.map((type) => {
                  const cfg = DISCIPLINE_TYPE_CONFIG[type];
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
                        {cfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Controller
              control={control}
              name="occurredAt"
              render={({ field: { value, onChange } }) => (
                <FieldTextInput
                  label="Date et heure"
                  value={value}
                  onChangeText={onChange}
                  placeholder="YYYY-MM-DDTHH:mm"
                  testID="discipline-form-occurred-at"
                />
              )}
            />
            {errors.occurredAt ? (
              <Text style={styles.fieldError}>{errors.occurredAt.message}</Text>
            ) : null}

            <Controller
              control={control}
              name="reason"
              render={({ field: { value, onChange } }) => (
                <FieldTextInput
                  label="Description"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex : bus arrivé en retard"
                  multiline
                  testID="discipline-form-reason"
                />
              )}
            />
            {errors.reason ? (
              <Text style={styles.fieldError}>{errors.reason.message}</Text>
            ) : null}

            <Controller
              control={control}
              name="durationMinutes"
              render={({ field: { value, onChange } }) => (
                <FieldTextInput
                  label="Durée (minutes)"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ex : 40"
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

            {typeHasJustified(selectedType) ? (
              <Controller
                control={control}
                name="justified"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.switchRow}>
                    <View style={styles.switchTextBlock}>
                      <Text style={styles.fieldLabel}>Justifié</Text>
                      <Text style={styles.switchSub}>
                        Absence ou retard validé par les parents ou
                        l'administration
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
                  label="Commentaire"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Observations complémentaires"
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
              <Text style={styles.cancelBtnText}>Annuler</Text>
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

function FieldTextInput(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  testID: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
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
}

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
