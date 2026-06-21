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
import { messagingApi } from "../../api/messaging.api";
import type { AdminTesterRow } from "../../types/tests-admin.types";

type FormValues = {
  subject: string;
  body: string;
};

type Props = {
  tester: AdminTesterRow;
  initialSubject?: string;
  onClose: () => void;
};

export function QuickMessageSheet({
  tester,
  initialSubject = "",
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const schoolSlug = tester.schools[0]?.slug ?? null;

  const schema = z.object({
    subject: z.string().trim().min(1, t("testsAdmin.message.subjectRequired")),
    body: z.string().trim().min(1, t("testsAdmin.message.bodyRequired")),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { subject: initialSubject, body: "" },
  });

  const onSend = handleSubmit(async (values) => {
    if (!schoolSlug) {
      setError(t("testsAdmin.message.noSchool"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      await messagingApi.send(schoolSlug, {
        subject: values.subject,
        body: values.body,
        recipientUserIds: [tester.id],
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setSending(false);
    }
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet} testID="quick-message-sheet">
          <Text style={styles.title}>
            {t("testsAdmin.message.title").replace("{name}", tester.fullName)}
          </Text>

          {sent ? (
            <>
              <Text style={styles.sentText} testID="quick-message-sent">
                {t("testsAdmin.message.sent")}
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onClose}
                testID="quick-message-close"
              >
                <Text style={styles.primaryButtonText}>
                  {t("testsAdmin.common.close")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>
                  {t("testsAdmin.message.subjectLabel")}
                </Text>
                <Controller
                  control={control}
                  name="subject"
                  render={({ field, fieldState }) => (
                    <TextInput
                      ref={field.ref}
                      style={[
                        styles.input,
                        fieldState.error && styles.inputError,
                      ]}
                      value={field.value}
                      onBlur={field.onBlur}
                      onChangeText={field.onChange}
                      placeholder={t("testsAdmin.message.subjectPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      testID="quick-message-subject"
                    />
                  )}
                />
                {errors.subject?.message ? (
                  <Text style={styles.fieldError}>
                    {errors.subject.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  {t("testsAdmin.message.bodyLabel")}
                </Text>
                <Controller
                  control={control}
                  name="body"
                  render={({ field, fieldState }) => (
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
                      placeholder={t("testsAdmin.message.bodyPlaceholder")}
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      testID="quick-message-body"
                    />
                  )}
                />
                {errors.body?.message ? (
                  <Text style={styles.fieldError}>{errors.body.message}</Text>
                ) : null}
              </View>

              {error ? <Text style={styles.fieldError}>{error}</Text> : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onSend}
                  disabled={sending}
                  testID="quick-message-send"
                >
                  <Text style={styles.primaryButtonText}>
                    {sending
                      ? t("testsAdmin.message.sending")
                      : t("testsAdmin.message.send")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onClose}
                  disabled={sending}
                  testID="quick-message-cancel"
                >
                  <Text style={styles.secondaryButtonText}>
                    {t("testsAdmin.common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  textarea: { minHeight: 96, paddingTop: 10 },
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
  sentText: { fontSize: 14, color: colors.textPrimary },
});
