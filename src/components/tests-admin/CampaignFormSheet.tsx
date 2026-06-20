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
import { DatePickerField } from "../DatePickerField";
import { SelectField } from "./SelectField";
import type { AdminCampaignRow } from "../../types/tests-admin.types";
import type { TestCampaignStatus } from "../../types/tests.types";

export type CampaignFormValues = {
  title: string;
  description: string;
  targetVersion: string;
  startsAt: string;
  dueAt: string;
  status: TestCampaignStatus;
};

type Props = {
  campaign?: AdminCampaignRow | null;
  saving: boolean;
  error: string | null;
  onSubmit: (values: CampaignFormValues) => void;
  onCancel: () => void;
};

export function CampaignFormSheet({
  campaign,
  saving,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const isEdit = Boolean(campaign);

  const schema = z.object({
    title: z.string().trim().min(1, t("testsAdmin.campaignForm.titleRequired")),
    description: z.string(),
    targetVersion: z.string(),
    startsAt: z.string(),
    dueAt: z.string(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: campaign?.title ?? "",
      description: campaign?.description ?? "",
      targetVersion: campaign?.targetVersion ?? "",
      startsAt: campaign?.startsAt ?? "",
      dueAt: campaign?.dueAt ?? "",
      status: campaign?.status ?? "DRAFT",
    },
  });

  const onSave = handleSubmit((values) => onSubmit(values));

  const statusOptions: Array<{ value: TestCampaignStatus; label: string }> = [
    { value: "DRAFT", label: t("testsAdmin.campaigns.status.draft") },
    { value: "ACTIVE", label: t("testsAdmin.campaigns.status.active") },
    { value: "ARCHIVED", label: t("testsAdmin.campaigns.status.archived") },
  ];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />
        <View style={styles.sheet} testID="campaign-form-sheet">
          <Text style={styles.title}>
            {isEdit
              ? t("testsAdmin.campaignForm.editTitle")
              : t("testsAdmin.campaignForm.createTitle")}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t("testsAdmin.campaignForm.titleLabel")}
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field, fieldState }) => (
                <TextInput
                  ref={field.ref}
                  style={[styles.input, fieldState.error && styles.inputError]}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder={t("testsAdmin.campaignForm.titlePlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  testID="campaign-form-title"
                />
              )}
            />
            {errors.title?.message ? (
              <Text style={styles.fieldError}>{errors.title.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t("testsAdmin.campaignForm.descriptionLabel")}
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextInput
                  ref={field.ref}
                  style={[styles.input, styles.textarea]}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor={colors.textSecondary}
                  testID="campaign-form-description"
                />
              )}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t("testsAdmin.campaignForm.targetVersionLabel")}
            </Text>
            <Controller
              control={control}
              name="targetVersion"
              render={({ field }) => (
                <TextInput
                  ref={field.ref}
                  style={styles.input}
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholderTextColor={colors.textSecondary}
                  testID="campaign-form-target-version"
                />
              )}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.rowItem]}>
              <Text style={styles.label}>
                {t("testsAdmin.campaignForm.startsAtLabel")}
              </Text>
              <Controller
                control={control}
                name="startsAt"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    testID="campaign-form-starts-at"
                  />
                )}
              />
            </View>
            <View style={[styles.field, styles.rowItem]}>
              <Text style={styles.label}>
                {t("testsAdmin.campaignForm.dueAtLabel")}
              </Text>
              <Controller
                control={control}
                name="dueAt"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    testID="campaign-form-due-at"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SelectField
                label={t("testsAdmin.campaignForm.statusLabel")}
                value={field.value}
                onChange={(value) =>
                  field.onChange(value as TestCampaignStatus)
                }
                options={statusOptions}
                placeholder={t("testsAdmin.campaignForm.statusLabel")}
                closeLabel={t("testsAdmin.common.close")}
                testIDPrefix="campaign-form-status"
              />
            )}
          />

          {error ? <Text style={styles.fieldError}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => void onSave()}
              disabled={saving}
              testID="campaign-form-save-btn"
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
              testID="campaign-form-cancel-btn"
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
    maxHeight: "88%",
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  field: { gap: 6 },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },
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
