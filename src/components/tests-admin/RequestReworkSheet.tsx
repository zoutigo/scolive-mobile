import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";

type FormValues = { note: string };

type Props = {
  saving: boolean;
  error: string | null;
  onSubmit: (note: string) => void;
  onCancel: () => void;
};

export function RequestReworkSheet({
  saving,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();

  const schema = z.object({ note: z.string() });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { note: "" },
  });

  const onSave = handleSubmit((values) => onSubmit(values.note));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={styles.sheet} testID="request-rework-sheet">
          <Text style={styles.title}>
            {t("testsAdmin.executions.rework.title")}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t("testsAdmin.executions.rework.noteLabel")}
            </Text>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <TextInput
                  ref={field.ref}
                  style={styles.textarea}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder={t(
                    "testsAdmin.executions.rework.notePlaceholder",
                  )}
                  placeholderTextColor={colors.textSecondary}
                  testID="request-rework-note"
                />
              )}
            />
          </View>

          {error ? <Text style={styles.fieldError}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => void onSave()}
              disabled={saving}
              testID="request-rework-submit-btn"
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? t("testsAdmin.executions.rework.submitting")
                  : t("testsAdmin.executions.rework.submit")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onCancel}
              disabled={saving}
              testID="request-rework-cancel-btn"
            >
              <Text style={styles.secondaryButtonText}>
                {t("testsAdmin.common.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: 20 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 18,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  textarea: {
    minHeight: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingTop: 10,
    color: colors.textPrimary,
    fontSize: 15,
  },
  fieldError: { fontSize: 12, color: colors.notification },
  actions: { flexDirection: "row", gap: 10 },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
});
