import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "../../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../../src/components/navigation/ModuleHeader";
import { ExecutionsPager } from "../../../../src/components/tests/ExecutionsPager";
import { ExecutionDetailCard } from "../../../../src/components/tests/ExecutionDetailCard";
import { testsApi } from "../../../../src/api/tests.api";
import { useAuthStore } from "../../../../src/store/auth.store";
import { useSuccessToastStore } from "../../../../src/store/success-toast.store";
import { useTranslation } from "../../../../src/i18n/useTranslation";
import { colors } from "../../../../src/theme";
import { extractApiError } from "../../../../src/utils/api-error";
import { moduleBack } from "../../../../src/utils/moduleBack";
import { BOTTOM_TAB_BAR_HEIGHT } from "../../../../src/components/navigation/BottomTabBar";
import type { TestExecutionStatus } from "../../../../src/types/tests.types";

const SUBMIT_STATUSES: TestExecutionStatus[] = [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "IN_PROGRESS",
];

type ViewMode = "detail" | "form";

type FormValues = {
  status: TestExecutionStatus;
  resultText: string;
  comment: string;
};

function buildSchema(t: (key: string) => string) {
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
      .min(1, t("tests.executions.edit.validation.resultRequired")),
    comment: z.string(),
  });
}

export default function TestExecutionRoute() {
  return (
    <AppShell showHeader={false}>
      <TestExecutionScreen />
    </AppShell>
  );
}

function TestExecutionScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const showSuccess = useSuccessToastStore((s) => s.showSuccess);
  const showError = useSuccessToastStore((s) => s.showError);

  const params = useLocalSearchParams<{
    executionId: string;
    status?: string;
    campaignId?: string;
  }>();

  const [ids, setIds] = useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState(
    params.executionId,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit =
    !!user &&
    (user.isTester === true ||
      user.platformRoles.includes("ADMIN") ||
      user.platformRoles.includes("SUPER_ADMIN"));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await testsApi.listExecutions({
          status: (params.status as TestExecutionStatus | "") || undefined,
          campaignId: params.campaignId || undefined,
        });
        if (!cancelled) {
          setIds(response.items.map((item) => item.id));
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : t("tests.common.errors.loadGeneric"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.status, params.campaignId]);

  const initialIndex = ids ? Math.max(0, ids.indexOf(params.executionId)) : 0;

  function exitForm() {
    setViewMode("detail");
  }

  async function openEditForm() {
    setIsLoadingForm(true);
    try {
      const detail = await testsApi.getExecution(currentExecutionId);
      formReset({
        status: detail.status,
        resultText: detail.resultText ?? "",
        comment: detail.comment ?? "",
      });
      setViewMode("form");
    } catch (error) {
      showError({
        title: t("tests.common.errors.loadTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsLoadingForm(false);
    }
  }

  const schema = buildSchema(t);
  const {
    control,
    handleSubmit,
    reset: formReset,
    setFocus,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { status: "PASSED", resultText: "", comment: "" },
  });

  const onValid = handleSubmit(
    async (values) => {
      setIsSubmitting(true);
      try {
        await testsApi.updateExecution(currentExecutionId, {
          status: values.status,
          resultText: values.resultText.trim(),
          comment: values.comment.trim() || undefined,
        });
        showSuccess({
          title: t("tests.executions.edit.toastSuccessTitle"),
          message: t("tests.executions.edit.toastSuccessMessage"),
        });
        setTimeout(() => {
          exitForm();
        }, 2000);
      } catch (error) {
        showError({
          title: t("tests.common.errors.submitTitle"),
          message: extractApiError(error),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    (formErrors) => {
      if (formErrors.resultText) {
        setFocus("resultText");
      }
    },
  );

  const subtitle =
    viewMode === "form"
      ? t("tests.executions.edit.heroSubtitle")
      : t("tests.executions.detail.swipeHint");

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("tests.executions.detail.subtitle")}
        subtitle={subtitle}
        onBack={() => (viewMode === "form" ? exitForm() : moduleBack(router))}
        topInset={insets.top}
        testID="test-execution-detail-header"
      />

      {errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : !ids ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : viewMode === "form" ? (
        <EditForm
          t={t}
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
          onCancel={exitForm}
          onSubmit={() => void onValid()}
        />
      ) : (
        <ExecutionsPager
          ids={ids}
          initialIndex={initialIndex}
          onIndexChange={(_idx, id) => setCurrentExecutionId(id)}
          renderPage={(id, isActive) => (
            <ExecutionDetailCard executionId={id} isActive={isActive} />
          )}
        />
      )}

      {canEdit && viewMode === "detail" && ids ? (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              bottom: insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT,
            },
          ]}
          onPress={() => void openEditForm()}
          disabled={isLoadingForm}
          testID="execution-edit-fab"
          accessibilityLabel={t("tests.executions.detail.editFab")}
        >
          {isLoadingForm ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="create-outline" size={26} color={colors.white} />
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

type EditFormProps = {
  t: (key: string) => string;
  control: ReturnType<typeof useForm<FormValues>>["control"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

function EditForm({
  t,
  control,
  errors,
  isSubmitting,
  onCancel,
  onSubmit,
}: EditFormProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formArea}
    >
      <View style={styles.heroWrapper}>
        <FormHero t={t} />
      </View>
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
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
                    testID={`edit-execution-status-${entry}`}
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

        <View style={styles.formField}>
          <Text style={styles.formLabel}>
            {t("tests.executions.detail.resultLabel")}
          </Text>
          <Controller
            control={control}
            name="resultText"
            render={({ field: { value, onChange, ref } }) => (
              <TextArea
                ref={ref}
                value={value}
                onChangeText={onChange}
                placeholder={t("tests.detail.resultPlaceholder")}
                hasError={!!errors.resultText}
                testID="edit-execution-result-input"
                minHeight={110}
              />
            )}
          />
          {errors.resultText ? (
            <Text style={styles.formError} testID="edit-execution-result-error">
              {errors.resultText.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.formField}>
          <Text style={styles.formLabel}>
            {t("tests.executions.detail.commentLabel")}
          </Text>
          <Controller
            control={control}
            name="comment"
            render={({ field: { value, onChange } }) => (
              <TextArea
                value={value}
                onChangeText={onChange}
                placeholder={t("tests.detail.commentPlaceholder")}
                hasError={false}
                testID="edit-execution-comment-input"
                minHeight={80}
              />
            )}
          />
        </View>
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          testID="edit-execution-cancel-btn"
        >
          <Text style={styles.cancelButtonText}>
            {t("tests.executions.edit.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
          disabled={isSubmitting}
          onPress={onSubmit}
          testID="edit-execution-submit-btn"
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting
              ? t("tests.executions.edit.submitting")
              : t("tests.executions.edit.submit")}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function FormHero({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.heroContainer} testID="execution-edit-form-hero">
      <View style={[styles.heroDecor1, { backgroundColor: "#A05010" }]} />
      <View style={[styles.heroDecor2, { backgroundColor: "#A05010" }]} />
      <View style={styles.heroRow}>
        <View style={styles.heroIconWrap}>
          <Ionicons
            name="create-outline"
            size={28}
            color="rgba(255,255,255,0.92)"
          />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>
            {t("tests.executions.edit.heroTitle")}
          </Text>
          <Text style={styles.heroSubtitle}>
            {t("tests.executions.edit.heroSubtitle")}
          </Text>
        </View>
      </View>
    </View>
  );
}

import { TextInput } from "react-native";

const TextArea = React.forwardRef<
  TextInput,
  {
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    hasError: boolean;
    testID?: string;
    minHeight: number;
  }
>(function TextArea(
  { value, onChangeText, placeholder, hasError, testID, minHeight },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      style={[
        styles.textInput,
        { minHeight },
        hasError && styles.textInputError,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      multiline
      textAlignVertical="top"
      testID={testID}
    />
  );
});

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
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 14, color: colors.notification, textAlign: "center" },

  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // Form layout
  formArea: { flex: 1 },
  formScroll: { flex: 1 },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  formField: { gap: 6 },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  formError: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.notification,
  },
  formActionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 2,
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },

  // Status chips
  statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    borderRadius: 4,
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

  // Text input
  textInput: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  textInputError: { borderColor: colors.notification },

  // Hero
  heroWrapper: { padding: 16 },
  heroContainer: {
    backgroundColor: "#C0681A",
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroDecor1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    right: -30,
    opacity: 0.3,
  },
  heroDecor2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: -20,
    left: 40,
    opacity: 0.2,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    marginTop: 3,
  },
});
