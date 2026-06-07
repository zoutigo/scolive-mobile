import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { usersApi } from "../../api/users.api";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { extractApiError } from "../../utils/api-error";
import { ModalFrame, FormActions } from "../teachers/TeacherSheetCommons";
import { CredentialDisplaySheet } from "./CredentialDisplaySheet";
import type { PromoteStudentResponse } from "../../types/users.types";

const promoteSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "L'identifiant doit faire au moins 3 caractères.")
    .regex(/^[a-zA-Z0-9]+$/, "Lettres et chiffres uniquement."),
});

type PromoteFormValues = z.infer<typeof promoteSchema>;

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

interface PromoteToUserSheetProps {
  visible: boolean;
  onClose: () => void;
  schoolSlug: string;
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}

export function PromoteToUserSheet({
  visible,
  onClose,
  schoolSlug,
  studentId,
  studentName,
  onSuccess,
}: PromoteToUserSheetProps) {
  const showError = useSuccessToastStore((s) => s.showError);

  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<PromoteStudentResponse | null>(
    null,
  );
  const [credSheetVisible, setCredSheetVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    getValues,
    formState: { errors },
  } = useForm<PromoteFormValues>({
    resolver: zodResolver(promoteSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { username: "" },
  });

  useEffect(() => {
    if (!visible) {
      reset({ username: "" });
      setSuggestionError(null);
      setCredentials(null);
      return;
    }

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
            "Suggestion automatique indisponible. Vérifie l'identifiant avant de créer l'accès.",
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
  }, [visible, schoolSlug, studentId, studentName, setValue, reset, getValues]);

  const doSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const result = await usersApi.promoteStudent(
        schoolSlug,
        studentId,
        values.username.trim(),
      );
      setCredentials(result);
      onClose();
      setCredSheetVisible(true);
      onSuccess();
    } catch (err) {
      const message = extractApiError(err);
      if (isUsernameTakenError(message)) {
        setError("username", {
          type: "server",
          message: "Cet identifiant est déjà utilisé. Choisis-en un autre.",
        });
        return;
      }
      showError({ title: "Erreur", message });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      <ModalFrame
        visible={visible}
        eyebrow="Gestion des accès"
        title="Créer un accès élève"
        subtitle={`Création d'un identifiant pour ${studentName}.`}
        onClose={onClose}
        testID="promote-to-user-sheet"
        footer={
          <FormActions
            submitLabel="Créer l'accès"
            isSubmitting={isSubmitting}
            onCancel={onClose}
            onSubmit={() => void doSubmit()}
            testIDPrefix="promote-student"
          />
        }
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Identifiant</Text>
          <Controller
            control={control}
            name="username"
            render={({ field, fieldState }) => (
              <TextInput
                ref={field.ref}
                testID="input-username-promote"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="ex: JeanDUPONT"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, fieldState.error && styles.inputError]}
              />
            )}
          />
          {isLoadingSuggestion ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>
                Génération de l'identifiant unique…
              </Text>
            </View>
          ) : null}
          {suggestionError ? (
            <Text style={styles.fieldHint} testID="hint-username-promote">
              {suggestionError}
            </Text>
          ) : null}
          {errors.username ? (
            <Text style={styles.fieldError} testID="error-username-promote">
              {errors.username.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Un mot de passe temporaire sera généré automatiquement. L'élève
            devra le changer à la première connexion.
          </Text>
        </View>
      </ModalFrame>

      {credentials ? (
        <CredentialDisplaySheet
          visible={credSheetVisible}
          onClose={() => setCredSheetVisible(false)}
          username={credentials.username}
          temporaryPassword={credentials.temporaryPassword}
          title="Accès créé"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: "#FCA5A5",
  },
  fieldError: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 12,
    color: "#08467D",
    lineHeight: 18,
  },
});
