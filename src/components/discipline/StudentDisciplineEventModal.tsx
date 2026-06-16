import React, { useEffect, useState } from "react";
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
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import {
  buildLifeEventPayload,
  createDisciplineFormSchema,
  DISCIPLINE_TYPE_CONFIG,
  getDisciplineTypeLabel,
  STUDENT_LIFE_EVENT_TYPES,
  typeHasJustified,
  type CreateLifeEventPayload,
  type DisciplineFormInput,
  type StudentLifeEvent,
  type StudentLifeEventType,
} from "../../types/discipline.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  editing?: StudentLifeEvent | null;
  isSaving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateLifeEventPayload) => Promise<void> | void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowLocalIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function eventToFormValues(event: StudentLifeEvent): DisciplineFormInput {
  const d = new Date(event.occurredAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    type: event.type,
    occurredAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    reason: event.reason,
    durationMinutes:
      event.durationMinutes != null ? String(event.durationMinutes) : "",
    justified: event.justified ?? false,
    comment: event.comment ?? "",
  };
}

function defaultFormValues(): DisciplineFormInput {
  return {
    type: "ABSENCE",
    occurredAt: nowLocalIso(),
    reason: "",
    durationMinutes: "",
    justified: false,
    comment: "",
  };
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function StudentDisciplineEventModal({
  visible,
  editing,
  isSaving = false,
  error,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const schema = createDisciplineFormSchema(t);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const { control, handleSubmit, watch, reset, setValue } =
    useForm<DisciplineFormInput>({
      resolver: zodResolver(schema),
      mode: "onChange",
      reValidateMode: "onChange",
      defaultValues: editing ? eventToFormValues(editing) : defaultFormValues(),
    });

  const selectedType = watch("type");

  useEffect(() => {
    if (!visible) return;
    reset(editing ? eventToFormValues(editing) : defaultFormValues());
  }, [editing?.id, visible]); // reset intentionnellement limité à l'id et à la visibilité

  useEffect(() => {
    if (typeHasJustified(selectedType)) return;
    setValue("justified", false);
  }, [selectedType, setValue]);

  const onSave = handleSubmit(async (values) => {
    await onSubmit(buildLifeEventPayload(values, schema));
  });

  const typeCfg = DISCIPLINE_TYPE_CONFIG[selectedType];

  return (
    <>
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
          <View style={styles.sheet} testID="student-discipline-modal">
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>
                  {editing
                    ? t("discipline.form.eyebrowEdit")
                    : t("discipline.form.eyebrowCreate")}
                </Text>
                <Text style={styles.title}>{t("discipline.form.title")}</Text>
              </View>
              <TouchableOpacity onPress={onClose} testID="modal-close">
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Type d'événement — label + trigger inline */}
              <View style={styles.inlineField}>
                <Text style={styles.inlineLabel}>
                  {t("discipline.form.fields.type")}
                </Text>
                <TouchableOpacity
                  style={styles.inlineTrigger}
                  activeOpacity={0.8}
                  onPress={() => setTypePickerOpen(true)}
                  testID="modal-type-trigger"
                >
                  <Ionicons
                    name={typeCfg.icon as "time-outline"}
                    size={14}
                    color={typeCfg.accent}
                  />
                  <Text
                    style={[
                      styles.inlineTriggerLabel,
                      { color: typeCfg.accent },
                    ]}
                  >
                    {getDisciplineTypeLabel(t, selectedType)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Date et heure */}
              <Controller
                control={control}
                name="occurredAt"
                render={({ field, fieldState }) => (
                  <FormField
                    label={t("discipline.form.fields.dateTimeRequired")}
                    error={fieldState.error?.message}
                  >
                    <TextInput
                      ref={field.ref}
                      style={[
                        styles.input,
                        fieldState.error && styles.inputError,
                      ]}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder={t(
                        "discipline.form.fields.dateTimePlaceholder",
                      )}
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="none"
                      testID="modal-occurred-at"
                    />
                  </FormField>
                )}
              />

              {/* Motif */}
              <Controller
                control={control}
                name="reason"
                render={({ field, fieldState }) => (
                  <FormField
                    label={t("discipline.form.fields.reasonRequired")}
                    error={fieldState.error?.message}
                  >
                    <TextInput
                      ref={field.ref}
                      style={[
                        styles.input,
                        styles.textarea,
                        fieldState.error && styles.inputError,
                      ]}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder={t(
                        "discipline.form.fields.reasonPlaceholder",
                      )}
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      testID="modal-reason"
                    />
                  </FormField>
                )}
              />

              {/* Durée */}
              <Controller
                control={control}
                name="durationMinutes"
                render={({ field, fieldState }) => (
                  <FormField
                    label={t("discipline.form.fields.durationOptional")}
                    error={fieldState.error?.message}
                  >
                    <TextInput
                      ref={field.ref}
                      style={[
                        styles.input,
                        fieldState.error && styles.inputError,
                      ]}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder={t(
                        "discipline.form.fields.durationPlaceholder",
                      )}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      testID="modal-duration"
                    />
                  </FormField>
                )}
              />

              {/* Justifié (ABSENCE / RETARD uniquement) */}
              {typeHasJustified(selectedType) ? (
                <Controller
                  control={control}
                  name="justified"
                  render={({ field }) => (
                    <View style={styles.switchRow}>
                      <View style={styles.switchInfo}>
                        <Text style={styles.fieldLabel}>
                          {t("discipline.form.fields.justified")}
                        </Text>
                        <Text style={styles.switchSub}>
                          {t("discipline.form.fields.justifiedHint")}
                        </Text>
                      </View>
                      <Switch
                        value={field.value}
                        onValueChange={field.onChange}
                        thumbColor={
                          field.value ? colors.accentTeal : colors.warmBorder
                        }
                        trackColor={{
                          false: colors.border,
                          true: `${colors.accentTeal}66`,
                        }}
                        testID="modal-justified"
                      />
                    </View>
                  )}
                />
              ) : null}

              {/* Commentaire */}
              <Controller
                control={control}
                name="comment"
                render={({ field }) => (
                  <FormField
                    label={t("discipline.form.fields.commentOptional")}
                  >
                    <TextInput
                      ref={field.ref}
                      style={[styles.input, styles.textarea]}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder={t(
                        "discipline.form.fields.commentPlaceholder",
                      )}
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      testID="modal-comment"
                    />
                  </FormField>
                )}
              />

              {/* Erreur globale */}
              {error ? (
                <View style={styles.errorBox} testID="modal-error">
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={colors.notification}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isSaving}
                testID="modal-cancel"
              >
                <Text style={styles.cancelBtnText}>
                  {t("discipline.form.buttons.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]}
                onPress={() => void onSave()}
                disabled={isSaving}
                testID="modal-submit"
              >
                <Text style={styles.submitBtnText}>
                  {editing
                    ? t("discipline.form.buttons.edit")
                    : t("discipline.form.buttons.create")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Type picker — centré, overlay séparé */}
      <Modal
        visible={typePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerOpen(false)}
      >
        <View style={styles.typeOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setTypePickerOpen(false)}
          />
          <View style={styles.typeSheet} testID="modal-type-picker">
            <Text style={styles.typeSheetTitle}>
              {t("discipline.form.fields.type")}
            </Text>
            {STUDENT_LIFE_EVENT_TYPES.map((type: StudentLifeEventType) => {
              const cfg = DISCIPLINE_TYPE_CONFIG[type];
              const typeLabel = getDisciplineTypeLabel(t, type);
              const active = type === selectedType;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, active && styles.typeOptionActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setValue("type", type, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (!typeHasJustified(type)) {
                      setValue("justified", false);
                    }
                    setTypePickerOpen(false);
                  }}
                  testID={`modal-type-option-${type}`}
                >
                  <Ionicons
                    name={cfg.icon as "time-outline"}
                    size={16}
                    color={active ? cfg.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeOptionLabel,
                      active && { color: cfg.accent, fontWeight: "700" },
                    ]}
                  >
                    {typeLabel}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark" size={16} color={cfg.accent} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── FormField wrapper ─────────────────────────────────────────────────────────

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 14,
  },

  /* Type inline */
  inlineField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inlineLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    flexShrink: 0,
  },
  inlineTrigger: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineTriggerLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  /* Champs texte */
  fieldBlock: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.notification,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  fieldError: {
    fontSize: 12,
    color: colors.notification,
    marginTop: 2,
  },

  /* Justifié */
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
  },
  switchInfo: { flex: 1, gap: 4 },
  switchSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  /* Erreur globale */
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.notification,
    lineHeight: 18,
  },

  /* Footer */
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
    flex: 1.4,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  /* Type picker */
  typeOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  typeSheet: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 4,
  },
  typeSheetTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  typeOptionActive: {
    backgroundColor: colors.warmSurface,
  },
  typeOptionLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
