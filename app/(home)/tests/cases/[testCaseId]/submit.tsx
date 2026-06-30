import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Application from "expo-application";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppShell } from "../../../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../../../src/components/navigation/ModuleHeader";
import { testsApi } from "../../../../../src/api/tests.api";
import { useSuccessToastStore } from "../../../../../src/store/success-toast.store";
import { useTranslation } from "../../../../../src/i18n/useTranslation";
import { colors } from "../../../../../src/theme";
import type { TestExecutionStatus } from "../../../../../src/types/tests.types";

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

export default function SubmitResultRoute() {
  return (
    <AppShell showHeader={false}>
      <SubmitResultScreen />
    </AppShell>
  );
}

function SubmitResultScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { testCaseId, evidenceRequired } = useLocalSearchParams<{
    testCaseId: string;
    evidenceRequired: string;
  }>();
  const isEvidenceRequired = evidenceRequired === "1";
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultInputRef = useRef<TextInput>(null);
  const schema = buildSchema(t, isEvidenceRequired);

  const {
    control,
    handleSubmit,
    setValue,
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
    setValue("attachmentsCount", attachments.length, { shouldValidate: true });
  }, [attachments.length, setValue]);

  async function pickImage() {
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

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((asset) => ({
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? "application/octet-stream",
        })),
      ]);
    }
  }

  const onValid = handleSubmit(
    async (values) => {
      if (!testCaseId) return;
      setIsSubmitting(true);
      try {
        await testsApi.createExecution(testCaseId, {
          status: values.status,
          resultText: values.resultText.trim(),
          comment: values.comment.trim() || undefined,
          deviceInfo: `${Platform.OS}`,
          appVersion:
            Application.nativeApplicationVersion ??
            Application.nativeBuildVersion ??
            undefined,
          attachments,
        });
        showSuccess({
          title: t("tests.detail.toastSuccessTitle"),
          message: t("tests.detail.toastSuccessMessage"),
        });
        router.back();
      } catch (error) {
        showError({
          title: t("tests.common.errors.submitTitle"),
          message:
            error instanceof Error
              ? error.message
              : t("tests.common.errors.submitGeneric"),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    (formErrors) => {
      if (formErrors.resultText) {
        resultInputRef.current?.focus();
      }
    },
  );

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("tests.detail.formModalTitle")}
        onBack={() => router.back()}
        topInset={insets.top}
      />

      {/* Hero compact */}
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <Ionicons
            name="clipboard-outline"
            size={20}
            color={colors.white}
          />
        </View>
        <Text style={styles.heroText} numberOfLines={1}>
          {t("tests.detail.heroSubtitle")}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Status chips — horizontal scroll so they stay on one line */}
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusWrap}
              >
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
              </ScrollView>
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

          {/* Attachments — same pattern as CreateTicketScreen */}
          <View style={styles.attachActions}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => void pickImage()}
              testID="tests-attach-image-btn"
            >
              <Ionicons name="image-outline" size={16} color={colors.primary} />
              <Text style={styles.attachBtnText}>
                {t("tests.detail.attachments.image")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => void pickDocument()}
              testID="tests-attach-file-btn"
            >
              <Ionicons
                name="document-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.attachBtnText}>
                {t("tests.detail.attachments.file")}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.attachmentsCount ? (
            <Text style={styles.fieldError}>
              {errors.attachmentsCount.message}
            </Text>
          ) : null}
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentRow}>
              <Ionicons
                name="attach-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setAttachments((prev) =>
                    prev.filter((entry) => entry.id !== attachment.id),
                  )
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(243,179,77,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    flex: 1,
    color: "rgba(255,244,227,0.9)",
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  statusWrap: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    color: colors.textPrimary,
    fontSize: 13,
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
  inputError: { borderColor: colors.notification },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  textAreaSmall: { minHeight: 80, textAlignVertical: "top" },
  fieldError: {
    marginTop: -4,
    color: colors.notification,
    fontSize: 12,
    fontWeight: "600",
  },
  attachActions: { flexDirection: "row", gap: 10 },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  attachBtnText: { fontSize: 13, color: colors.primary, fontWeight: "500" },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  attachmentName: { flex: 1, fontSize: 12, color: colors.textSecondary },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
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
