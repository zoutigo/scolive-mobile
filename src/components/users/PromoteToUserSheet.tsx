import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { usersApi } from "../../api/users.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { extractApiError } from "../../utils/api-error";
import { FormActions, TextFormField } from "../teachers/TeacherSheetCommons";
import { useTranslation } from "../../i18n/useTranslation";
import type { PromoteStudentResponse } from "../../types/users.types";

function buildPromoteSchema(t: ReturnType<typeof useTranslation>["t"]) {
  return z.object({
    username: z
      .string()
      .trim()
      .min(3, t("users.detail.forms.createAccess.errorMin"))
      .regex(/^[a-zA-Z0-9]+$/, t("users.detail.forms.createAccess.errorAlnum")),
  });
}

type PromoteFormValues = { username: string };

function isUsernameTakenError(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("username") &&
    (normalized.includes("already taken") ||
      normalized.includes("déjà utilisé"))
  );
}

function buildLocalUsernameFallback(studentName: string): string {
  return studentName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");
}

interface PromoteToUserFormContentProps {
  schoolSlug: string;
  studentId: string;
  studentName: string;
  onCancel: () => void;
  onSuccess: (credentials: PromoteStudentResponse) => void;
}

export function PromoteToUserFormContent({
  schoolSlug,
  studentId,
  studentName,
  onCancel,
  onSuccess,
}: PromoteToUserFormContentProps) {
  const { t } = useTranslation();
  const showError = useSuccessToastStore((s) => s.showError);

  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    getValues,
    setFocus,
  } = useForm<PromoteFormValues>({
    resolver: zodResolver(buildPromoteSchema(t)),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { username: "" },
  });

  useEffect(() => {
    let active = true;
    async function loadSuggestion() {
      const localFallback = buildLocalUsernameFallback(studentName);
      reset({ username: localFallback });
      setSuggestionError(null);
      setIsLoadingSuggestion(true);
      try {
        const res = await usersApi.suggestUsername(schoolSlug, studentId);
        if (active) {
          const currentValue = getValues("username").trim();
          if (!currentValue || currentValue === localFallback) {
            reset({ username: res.username });
          } else {
            setValue("username", currentValue, { shouldValidate: true });
          }
        }
      } catch {
        if (active) {
          setSuggestionError(
            t("users.detail.forms.createAccess.suggestionError"),
          );
        }
      } finally {
        if (active) setIsLoadingSuggestion(false);
      }
    }

    void loadSuggestion();
    return () => {
      active = false;
    };
  }, [schoolSlug, studentId, studentName]);

  const doSubmit = handleSubmit(
    async (values) => {
      setIsSubmitting(true);
      try {
        const result = await usersApi.promoteStudent(
          schoolSlug,
          studentId,
          values.username.trim(),
        );
        onSuccess(result);
      } catch (err) {
        const message = extractApiError(err);
        if (isUsernameTakenError(message)) {
          setError("username", {
            type: "server",
            message: t("users.detail.forms.createAccess.errorTaken"),
          });
          return;
        }
        showError({ title: "Erreur", message });
      } finally {
        setIsSubmitting(false);
      }
    },
    (errs) => {
      const first = Object.keys(errs)[0];
      if (first) setFocus(first as Parameters<typeof setFocus>[0]);
    },
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="promote-to-user-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <Controller
            control={control}
            name="username"
            render={({ field, fieldState }) => (
              <TextFormField
                ref={field.ref}
                testID="input-username-promote"
                label={t("users.detail.forms.createAccess.usernameLabel")}
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                autoCapitalize="none"
                placeholder={t(
                  "users.detail.forms.createAccess.usernamePlaceholder",
                )}
                error={fieldState.error?.message}
              />
            )}
          />
          {isLoadingSuggestion ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>
                {t("users.detail.forms.createAccess.suggestionLoading")}
              </Text>
            </View>
          ) : null}
          {suggestionError ? (
            <Text style={styles.fieldHint} testID="hint-username-promote">
              {suggestionError}
            </Text>
          ) : null}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {t("users.detail.forms.createAccess.info")}
          </Text>
        </View>
      </ScrollView>
      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={t("users.detail.forms.createAccess.submit")}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onSubmit={() => void doSubmit()}
          testIDPrefix="promote-student"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoBox: {
    backgroundColor: "#EBF1F8",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 12,
    color: "#08467D",
    lineHeight: 18,
  },
});
