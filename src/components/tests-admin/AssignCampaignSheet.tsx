import React, { useState } from "react";
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
import { SelectField } from "./SelectField";
import type { AdminTesterRow } from "../../types/tests-admin.types";

type FormValues = {
  testerId: string;
  note: string;
};

type Props = {
  testers: AdminTesterRow[];
  saving: boolean;
  error: string | null;
  onSubmit: (values: { testerId: string; note?: string }) => void;
  onCancel: () => void;
};

export function AssignCampaignSheet({
  testers,
  saving,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [testerTouched, setTesterTouched] = useState(false);

  const schema = z.object({
    testerId: z.string().trim().min(1, t("testsAdmin.assign.testerRequired")),
    note: z.string(),
  });

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { testerId: "", note: "" },
  });

  const onSave = handleSubmit((values) => {
    onSubmit({ testerId: values.testerId, note: values.note || undefined });
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={styles.sheet} testID="assign-campaign-sheet">
          <Text style={styles.title}>{t("testsAdmin.assign.title")}</Text>

          <Controller
            control={control}
            name="testerId"
            render={({ field, fieldState }) => (
              <SelectField
                label={t("testsAdmin.assign.testerLabel")}
                value={field.value}
                onChange={(value) => {
                  setTesterTouched(true);
                  field.onChange(value);
                }}
                options={testers.map((tester) => ({
                  value: tester.id,
                  label: tester.fullName,
                }))}
                placeholder={t("testsAdmin.assign.testerPlaceholder")}
                closeLabel={t("testsAdmin.common.close")}
                error={testerTouched ? fieldState.error?.message : undefined}
                testIDPrefix="assign-tester-select"
              />
            )}
          />

          <View style={styles.field}>
            <Text style={styles.label}>{t("testsAdmin.assign.noteLabel")}</Text>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <TextInput
                  ref={field.ref}
                  style={styles.input}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder={t("testsAdmin.assign.notePlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  testID="assign-note-input"
                />
              )}
            />
          </View>

          {error ? <Text style={styles.fieldError}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setTesterTouched(true);
                void onSave();
              }}
              disabled={saving}
              testID="assign-save-btn"
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? t("testsAdmin.assign.submitting")
                  : t("testsAdmin.assign.submit")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onCancel}
              disabled={saving}
              testID="assign-cancel-btn"
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
    gap: 14,
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
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
