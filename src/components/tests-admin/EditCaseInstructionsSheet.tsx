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
import type { AdminCaseRow } from "../../types/tests-admin.types";

type FormValues = {
  module: string;
  objective: string;
  preconditions: string;
  expectedResult: string;
};

type Props = {
  testCase: AdminCaseRow;
  saving: boolean;
  error: string | null;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
};

export function EditCaseInstructionsSheet({
  testCase,
  saving,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();

  const schema = z.object({
    module: z.string(),
    objective: z.string(),
    preconditions: z.string(),
    expectedResult: z
      .string()
      .trim()
      .min(1, t("testsAdmin.editCase.expectedResultRequired")),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      module: testCase.module ?? "",
      objective: testCase.objective ?? "",
      preconditions: testCase.preconditions ?? "",
      expectedResult: testCase.expectedResult ?? "",
    },
  });

  const onSave = handleSubmit((values) => onSubmit(values));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={styles.sheet} testID="edit-case-sheet">
          <Text style={styles.title}>{t("testsAdmin.editCase.title")}</Text>

          <Field
            label={t("testsAdmin.editCase.moduleLabel")}
            name="module"
            control={control}
            errors={errors}
            testID="edit-case-module"
          />
          <Field
            label={t("testsAdmin.editCase.objectiveLabel")}
            name="objective"
            control={control}
            errors={errors}
            testID="edit-case-objective"
            multiline
          />
          <Field
            label={t("testsAdmin.editCase.preconditionsLabel")}
            name="preconditions"
            control={control}
            errors={errors}
            testID="edit-case-preconditions"
            multiline
          />
          <Field
            label={t("testsAdmin.editCase.expectedResultLabel")}
            name="expectedResult"
            control={control}
            errors={errors}
            testID="edit-case-expected-result"
            multiline
          />

          {error ? <Text style={styles.fieldError}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => void onSave()}
              disabled={saving}
              testID="edit-case-save-btn"
            >
              <Text style={styles.primaryButtonText}>
                {saving
                  ? t("testsAdmin.common.saving")
                  : t("testsAdmin.common.save")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onCancel}
              disabled={saving}
              testID="edit-case-cancel-btn"
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

function Field(props: {
  label: string;
  name: keyof FormValues;
  control: ReturnType<typeof useForm<FormValues>>["control"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  testID: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <Controller
        control={props.control}
        name={props.name}
        render={({ field, fieldState }) => (
          <TextInput
            ref={field.ref}
            style={[
              styles.input,
              props.multiline && styles.textarea,
              fieldState.error && styles.inputError,
            ]}
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            multiline={props.multiline}
            numberOfLines={props.multiline ? 3 : 1}
            textAlignVertical={props.multiline ? "top" : "center"}
            placeholderTextColor={colors.textSecondary}
            testID={props.testID}
          />
        )}
      />
      {props.errors[props.name]?.message ? (
        <Text style={styles.fieldError}>
          {props.errors[props.name]?.message}
        </Text>
      ) : null}
    </View>
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
    maxHeight: "85%",
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
  textarea: { minHeight: 72, paddingTop: 10 },
  inputError: { borderColor: colors.notification },
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
