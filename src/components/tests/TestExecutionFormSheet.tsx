import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { TestExecutionStatus } from "../../types/tests.types";

type LocalAttachment = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
};

const SUBMIT_STATUSES: TestExecutionStatus[] = [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "IN_PROGRESS",
];

type FormValues = {
  status: TestExecutionStatus;
  resultText: string;
  comment: string;
  attachmentsCount: number;
};

function buildSchema(t: (key: string) => string, evidenceRequired: boolean) {
  return z.object({
    status: z.enum([
      "PASSED",
      "FAILED",
      "BLOCKED",
      "SKIPPED",
      "IN_PROGRESS",
      "TODO",
    ]),
    resultText: z
      .string()
      .trim()
      .min(1, t("tests.detail.validation.resultRequired")),
    comment: z.string(),
    attachmentsCount: evidenceRequired
      ? z.number().min(1, t("tests.detail.validation.attachmentsRequired"))
      : z.number(),
  });
}

type Props = {
  visible: boolean;
  evidenceRequired: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: {
    status: TestExecutionStatus;
    resultText: string;
    comment: string;
    attachments: LocalAttachment[];
  }) => Promise<void>;
};

export function TestExecutionFormSheet({
  visible,
  evidenceRequired,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const resultInputRef = useRef<TextInput>(null);
  const schema = buildSchema(t, evidenceRequired);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      status: "PASSED",
      resultText: "",
      comment: "",
      attachmentsCount: 0,
    },
  });

  useEffect(() => {
    if (!visible) return;
    reset({
      status: "PASSED",
      resultText: "",
      comment: "",
      attachmentsCount: 0,
    });
    setAttachments([]);
  }, [reset, visible]);

  useEffect(() => {
    setValue("attachmentsCount", attachments.length, { shouldValidate: true });
  }, [attachments.length, setValue]);

  async function pickFromGallery() {
    const { status: permission } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission !== "granted") {
      Alert.alert(
        t("tests.detail.permissions.title"),
        t("tests.detail.permissions.gallery"),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((asset) => ({
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName ?? `capture_${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        })),
      ]);
    }
  }

  async function takePhoto() {
    const { status: permission } =
      await ImagePicker.requestCameraPermissionsAsync();
    if (permission !== "granted") {
      Alert.alert(
        t("tests.detail.permissions.title"),
        t("tests.detail.permissions.camera"),
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName ?? `capture_${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        },
      ]);
    }
  }

  function openAttachmentMenu() {
    Alert.alert(
      t("tests.detail.attachments.title"),
      t("tests.detail.attachments.message"),
      [
        {
          text: t("tests.detail.attachments.camera"),
          onPress: () => void takePhoto(),
        },
        {
          text: t("tests.detail.attachments.gallery"),
          onPress: () => void pickFromGallery(),
        },
        { text: t("tests.common.cancel"), style: "cancel" },
      ],
    );
  }

  const onValid = handleSubmit(
    async (values) => {
      await onSubmit({
        status: values.status,
        resultText: values.resultText.trim(),
        comment: values.comment.trim(),
        attachments,
      });
    },
    (formErrors) => {
      if (formErrors.resultText) {
        resultInputRef.current?.focus();
      }
    },
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet} testID="test-execution-form-sheet">
          <View style={styles.header}>
            <Text style={styles.title}>{t("tests.detail.formModalTitle")}</Text>
            <TouchableOpacity
              onPress={onClose}
              testID="test-execution-form-close"
            >
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
              name="status"
              render={({ field: { value, onChange } }) => (
                <View style={styles.statusWrap}>
                  {SUBMIT_STATUSES.map((entry) => {
                    const selected = entry === value;
                    return (
                      <TouchableOpacity
                        key={entry}
                        style={[
                          styles.statusChip,
                          selected && styles.statusChipSelected,
                        ]}
                        onPress={() => onChange(entry)}
                        testID={`test-execution-status-${entry}`}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            selected && styles.statusChipTextSelected,
                          ]}
                        >
                          {statusLabel(t, entry)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />

            <Controller
              control={control}
              name="resultText"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  ref={resultInputRef}
                  style={[
                    styles.input,
                    styles.textArea,
                    errors.resultText && styles.inputError,
                  ]}
                  placeholder={t("tests.detail.resultPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  multiline
                  testID="tests-result-input"
                />
              )}
            />
            {errors.resultText ? (
              <Text style={styles.fieldError}>{errors.resultText.message}</Text>
            ) : null}

            <Controller
              control={control}
              name="comment"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, styles.textAreaSmall]}
                  placeholder={t("tests.detail.commentPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />

            <TouchableOpacity
              style={styles.attachButton}
              onPress={openAttachmentMenu}
            >
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={styles.attachButtonText}>
                {t("tests.detail.attachments.add")}
              </Text>
            </TouchableOpacity>
            {errors.attachmentsCount ? (
              <Text style={styles.fieldError}>
                {errors.attachmentsCount.message}
              </Text>
            ) : null}
            {attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentRow}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setAttachments((prev) =>
                      prev.filter((entry) => entry.id !== attachment.id),
                    )
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#A33E2B"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              disabled={isSubmitting}
              onPress={() => void onValid()}
              testID="tests-submit-btn"
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting
                  ? t("tests.detail.submitting")
                  : t("tests.detail.submit")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function statusLabel(t: (key: string) => string, value: TestExecutionStatus) {
  switch (value) {
    case "PASSED":
      return t("tests.status.passed");
    case "FAILED":
      return t("tests.status.failed");
    case "BLOCKED":
      return t("tests.status.blocked");
    case "SKIPPED":
      return t("tests.status.skipped");
    case "IN_PROGRESS":
      return t("tests.status.inProgress");
    default:
      return t("tests.status.todo");
  }
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
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
    minHeight: "65%",
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
  title: { color: colors.textPrimary, fontSize: 19, fontWeight: "800" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 20, gap: 12 },
  statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  statusChipTextSelected: { color: colors.white },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.notification,
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  textAreaSmall: { minHeight: 80, textAlignVertical: "top" },
  fieldError: {
    marginTop: -4,
    color: colors.notification,
    fontSize: 12,
    fontWeight: "600",
  },
  attachButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  attachButtonText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  attachmentName: { flex: 1, fontSize: 13, color: colors.textSecondary },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  submitButton: {
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});
