import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { recoveryApi } from "../../src/api/recovery.api";
import { SecureTextField } from "../../src/components/SecureTextField";
import type { RecoveryQuestion } from "../../src/types/recovery.types";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import {
  translate,
  useTranslation,
  type TranslateFn,
} from "../../src/i18n/useTranslation";
import { formatDateInput, parseDateToISO } from "./pin";

const defaultT: TranslateFn = (key) => translate(DEFAULT_LOCALE, key);

// ── Schémas Zod ───────────────────────────────────────────────────────────────

export function buildPwdRecoveryStep1Schema(t: TranslateFn) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("recovery.password.errors.emailRequired"))
      .email(t("recovery.password.errors.emailInvalid")),
  });
}

export const pwdRecoveryStep1Schema = buildPwdRecoveryStep1Schema(defaultT);

export function buildPwdRecoveryStep2Schema(t: TranslateFn) {
  return z.object({
    token: z
      .string()
      .trim()
      .min(16, t("recovery.password.errors.tokenInvalid")),
  });
}

export const pwdRecoveryStep2Schema = buildPwdRecoveryStep2Schema(defaultT);

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function buildPwdRecoveryStep4Schema(t: TranslateFn) {
  return z
    .object({
      newPassword: z
        .string()
        .min(8, t("recovery.password.errors.passwordTooShort"))
        .regex(
          PASSWORD_COMPLEXITY_REGEX,
          t("recovery.password.errors.passwordComplexity"),
        ),
      confirmPassword: z
        .string()
        .min(1, t("recovery.password.errors.confirmRequired")),
    })
    .superRefine((v, ctx) => {
      if (v.confirmPassword && v.newPassword !== v.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("recovery.password.errors.confirmMismatch"),
        });
      }
    });
}

export const pwdRecoveryStep4Schema = buildPwdRecoveryStep4Schema(defaultT);

// ── Types internes ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

type PasswordRecoveryStep3Values = {
  birthDate: string;
  answers: Record<string, string>;
};

// ── Helper erreur API ─────────────────────────────────────────────────────────

export function parsePasswordRecoveryApiError(
  err: unknown,
  t: TranslateFn = defaultT,
): string {
  const e = err as { code?: string; statusCode?: number };
  switch (e?.code) {
    case "RECOVERY_INVALID":
      return t("recovery.common.errors.recoveryInvalid");
    case "NOT_FOUND":
    case "USER_NOT_FOUND":
      return t("recovery.password.errors.notFoundEmail");
    case "TOKEN_EXPIRED":
    case "RESET_TOKEN_EXPIRED":
      return t("recovery.password.errors.tokenExpired");
    case "TOKEN_INVALID":
    case "RESET_TOKEN_INVALID":
      return t("recovery.password.errors.tokenInvalidLink");
    case "SAME_PASSWORD":
      return t("recovery.password.errors.samePassword");
    default:
      if (e?.statusCode === 404)
        return t("recovery.password.errors.notFoundEmail");
      if (e?.statusCode === 400)
        return t("recovery.common.errors.recoveryInvalid");
      if (e?.statusCode === 401)
        return t("recovery.password.errors.tokenInvalidOrExpired");
      return t("apiErrors.generic");
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function PasswordRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const { locale, t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [emailHint, setEmailHint] = useState("");
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step1Schema = useMemo(() => buildPwdRecoveryStep1Schema(t), [locale]);
  const step2Schema = useMemo(() => buildPwdRecoveryStep2Schema(t), [locale]);
  const step4Schema = useMemo(() => buildPwdRecoveryStep4Schema(t), [locale]);

  const step1Form = useForm<z.infer<typeof pwdRecoveryStep1Schema>>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const step2Form = useForm<z.infer<typeof pwdRecoveryStep2Schema>>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      token: "",
    },
  });

  const step3Schema = useMemo(
    () =>
      z
        .object({
          birthDate: z
            .string()
            .min(1, t("recovery.common.errors.birthDateRequired"))
            .refine((value) => /^\d{2}\/\d{2}\/\d{4}$/.test(value), {
              message: t("recovery.common.errors.birthDateFormat"),
            })
            .refine((value) => parseDateToISO(value) !== null, {
              message: t("recovery.common.errors.birthDateInvalid"),
            }),
          answers: z.record(z.string(), z.string().trim()),
        })
        .superRefine((value, ctx) => {
          questions.forEach((question) => {
            const answer = value.answers[question.key] ?? "";
            if (answer.trim().length < 2) {
              ctx.addIssue({
                code: "custom",
                path: ["answers", question.key],
                message: t("recovery.common.errors.answerRequired"),
              });
            }
          });
        }),
    [questions, locale],
  );

  const step3Form = useForm<PasswordRecoveryStep3Values>({
    resolver: zodResolver(step3Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      birthDate: "",
      answers: {},
    },
  });

  const step4Form = useForm<z.infer<typeof pwdRecoveryStep4Schema>>({
    resolver: zodResolver(step4Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (step !== 3) {
      return;
    }
    step3Form.reset((currentValues) => ({
      birthDate: currentValues.birthDate ?? "",
      answers: Object.fromEntries(
        questions.map((question) => [
          question.key,
          currentValues.answers?.[question.key] ?? "",
        ]),
      ),
    }));
  }, [questions, step, step3Form]);

  function clearUiErrors() {
    setError(null);
  }

  // ── Step 1 : Demande de réinitialisation ──────────────────────────────────

  const handleStep1 = step1Form.handleSubmit(async (values) => {
    clearUiErrors();
    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPasswordRequest({ email: values.email.trim() });
      setStep(2);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Step 2 : Saisie du token (depuis l'email) ─────────────────────────────

  const handleStep2 = step2Form.handleSubmit(async (values) => {
    clearUiErrors();
    setIsSubmitting(true);
    try {
      const res = await recoveryApi.forgotPasswordOptions({
        token: values.token.trim(),
      });
      setEmailHint(res.emailHint);
      setQuestions(res.questions);
      setStep(3);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Step 3 : Vérification identité ───────────────────────────────────────

  const handleStep3 = step3Form.handleSubmit(async (values) => {
    clearUiErrors();
    const isoDate = parseDateToISO(values.birthDate);
    if (!isoDate) {
      return;
    }
    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPasswordVerify({
        token: step2Form.getValues("token").trim(),
        birthDate: isoDate,
        answers: questions.map((q) => ({
          questionKey: q.key,
          answer: (values.answers[q.key] ?? "").trim(),
        })),
      });
      setStep(4);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Step 4 : Nouveau mot de passe ─────────────────────────────────────────

  const handleStep4 = step4Form.handleSubmit(async (values) => {
    clearUiErrors();
    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPasswordComplete({
        token: step2Form.getValues("token").trim(),
        newPassword: values.newPassword,
      });
      setStep(5);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Render ────────────────────────────────────────────────────────────────

  const isSuccess = step === 5;
  const totalSteps = 4;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── En-tête ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        {/* Marque + bouton retour sur la même ligne */}
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <Text style={styles.brandNameWhite}>SCO</Text>
            <Text style={styles.brandNameGold}>LIVE</Text>
          </View>
          {!isSuccess && (
            <Pressable
              testID="back-button"
              onPress={() => {
                if (step === 1) router.back();
                else {
                  clearUiErrors();
                  setStep((s) => (s - 1) as Step);
                }
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>
                {t("recovery.common.back")}
              </Text>
            </Pressable>
          )}
        </View>
        <View style={styles.brandAccent} />

        <Text style={styles.headerTitle}>
          {isSuccess
            ? t("recovery.password.headerTitleSuccess")
            : t("recovery.password.headerTitle")}
        </Text>

        {!isSuccess && (
          <>
            <Text style={styles.stepIndicator}>
              {t("recovery.password.step")
                .replace("{step}", String(step))
                .replace("{total}", String(totalSteps))}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(step / totalSteps) * 100}%` },
                ]}
              />
            </View>
          </>
        )}
      </View>

      {/* ── Card ─────────────────────────────────────────────── */}
      <View style={styles.cardOuter}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Step 1 : Saisie de l'email ───────────────── */}
            {step === 1 && (
              <View testID="step-1">
                <Text style={styles.stepTitle}>
                  {t("recovery.password.step1.title")}
                </Text>
                <Text style={styles.stepSubtitle}>
                  {t("recovery.password.step1.subtitle")}
                </Text>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>✉️</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.password.fields.email")}
                    </Text>
                  </View>
                  <Controller
                    control={step1Form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-email"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearUiErrors();
                          field.onChange(value);
                        }}
                        placeholder={t("login.placeholders.email")}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={[
                          styles.input,
                          fieldState.error ? styles.inputError : null,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {step1Form.formState.errors.email ? (
                    <Text style={styles.fieldErrorText} testID="error-email">
                      {step1Form.formState.errors.email.message}
                    </Text>
                  ) : null}
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText} testID="error-message">
                      {error}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  testID="btn-step1"
                  style={[
                    styles.primaryButton,
                    styles.primaryButtonSpaced,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handleStep1}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("recovery.password.step1.submit")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 2 : Saisie du token ─────────────────── */}
            {step === 2 && (
              <View testID="step-2">
                <Text style={styles.stepTitle}>
                  {t("recovery.password.step2.title")}
                </Text>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    {t("recovery.password.step2.infoPrefix")}
                    <Text style={styles.infoValueBold}>
                      {step1Form.getValues("email")}
                    </Text>
                    {t("recovery.password.step2.infoSuffix")}
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔗</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.password.fields.token")}
                    </Text>
                  </View>
                  <Controller
                    control={step2Form.control}
                    name="token"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-token"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearUiErrors();
                          field.onChange(value);
                        }}
                        placeholder={t("recovery.password.placeholders.token")}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                          styles.input,
                          fieldState.error ? styles.inputError : null,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {step2Form.formState.errors.token ? (
                    <Text style={styles.fieldErrorText} testID="error-token">
                      {step2Form.formState.errors.token.message}
                    </Text>
                  ) : null}
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText} testID="error-message">
                      {error}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  testID="btn-step2"
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handleStep2}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("recovery.common.continue")}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  testID="btn-resend"
                  style={styles.linkButton}
                  onPress={handleStep1}
                  disabled={isSubmitting}
                >
                  <Text style={styles.linkButtonText}>
                    {t("recovery.password.step2.resend")}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* ── Step 3 : Vérification identité ──────────── */}
            {step === 3 && (
              <View testID="step-3">
                <Text style={styles.stepTitle}>
                  {t("recovery.password.step3.title")}
                </Text>
                <Text style={styles.stepSubtitle}>
                  {t("recovery.password.step3.subtitle")}
                </Text>

                {emailHint ? (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                      {t("recovery.password.step3.accountHint")}
                      <Text style={styles.hintValue}>{emailHint}</Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>📅</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.common.birthDateLabel")}
                    </Text>
                  </View>
                  <Controller
                    control={step3Form.control}
                    name="birthDate"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-birthdate"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearUiErrors();
                          field.onChange(formatDateInput(value));
                        }}
                        placeholder={t("recovery.common.birthDatePlaceholder")}
                        keyboardType="numeric"
                        style={[
                          styles.input,
                          fieldState.error ? styles.inputError : null,
                        ]}
                        placeholderTextColor="#9B9490"
                        maxLength={10}
                      />
                    )}
                  />
                  {step3Form.formState.errors.birthDate ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-birthdate"
                    >
                      {step3Form.formState.errors.birthDate.message}
                    </Text>
                  ) : null}
                </View>

                {questions.map((q, idx) => (
                  <View key={q.key} style={styles.fieldGroup}>
                    <View style={styles.labelRow}>
                      <View style={styles.fieldIcon}>
                        <Text style={styles.fieldIconText}>🔑</Text>
                      </View>
                      <Text style={styles.label}>{q.label}</Text>
                    </View>
                    <Controller
                      control={step3Form.control}
                      name={`answers.${q.key}` as const}
                      render={({ field, fieldState }) => (
                        <>
                          <TextInput
                            ref={field.ref}
                            testID={`input-answer-${idx}`}
                            value={field.value ?? ""}
                            onBlur={field.onBlur}
                            onChangeText={(value) => {
                              clearUiErrors();
                              field.onChange(value);
                            }}
                            placeholder={t("recovery.common.answerPlaceholder")}
                            autoCapitalize="none"
                            style={[
                              styles.input,
                              fieldState.error ? styles.inputError : null,
                            ]}
                            placeholderTextColor="#9B9490"
                          />
                          {fieldState.error ? (
                            <Text
                              style={styles.fieldErrorText}
                              testID={`error-answer-${idx}`}
                            >
                              {fieldState.error.message}
                            </Text>
                          ) : null}
                        </>
                      )}
                    />
                  </View>
                ))}

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText} testID="error-message">
                      {error}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  testID="btn-step3"
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handleStep3}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("recovery.common.verify")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 4 : Nouveau mot de passe ────────────── */}
            {step === 4 && (
              <View testID="step-4">
                <Text style={styles.stepTitle}>
                  {t("recovery.password.step4.title")}
                </Text>
                <Text style={styles.stepSubtitle}>
                  {t("recovery.password.step4.subtitle")}
                </Text>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔒</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.password.fields.newPassword")}
                    </Text>
                  </View>
                  <Controller
                    control={step4Form.control}
                    name="newPassword"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-new-password"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearUiErrors();
                          field.onChange(value);
                        }}
                        placeholder={t(
                          "recovery.password.placeholders.newPassword",
                        )}
                        containerStyle={
                          fieldState.error ? styles.inputError : null
                        }
                        inputStyle={styles.inputFlex}
                        placeholderTextColor="#9B9490"
                        visibilityToggleTestID="toggle-show-password"
                      />
                    )}
                  />
                  {step4Form.formState.errors.newPassword ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-new-password"
                    >
                      {step4Form.formState.errors.newPassword.message}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔒</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.password.fields.confirmPassword")}
                    </Text>
                  </View>
                  <Controller
                    control={step4Form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-confirm-password"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearUiErrors();
                          field.onChange(value);
                        }}
                        placeholder={t(
                          "recovery.password.placeholders.confirmPassword",
                        )}
                        containerStyle={
                          fieldState.error ? styles.inputError : null
                        }
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {step4Form.formState.errors.confirmPassword ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-confirm-password"
                    >
                      {step4Form.formState.errors.confirmPassword.message}
                    </Text>
                  ) : null}
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText} testID="error-message">
                      {error}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  testID="btn-step4"
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handleStep4}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("recovery.password.step4.submit")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 5 : Succès ──────────────────────────── */}
            {step === 5 && (
              <View testID="step-5" style={styles.successContainer}>
                <View style={styles.successIconWrap}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={styles.successTitle}>
                  {t("recovery.password.headerTitleSuccess")}
                </Text>
                <Text style={styles.successSubtitle}>
                  {t("recovery.password.success.subtitle")}
                </Text>
                <Pressable
                  testID="btn-go-login"
                  style={[styles.primaryButton, styles.fullWidth]}
                  onPress={() => router.replace("/login")}
                >
                  <Text style={styles.primaryButtonText}>
                    {t("recovery.common.loginButton")}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const BLUE = "#08467D";
const BLUE_LIGHT = "#0C5FA8";
const GOLD = "#F7C260";
const AMBER = "#C06A1A";
const GREEN = "#16A34A";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    overflow: "hidden",
  },
  blobTopRight: {
    position: "absolute",
    top: -20,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: GOLD,
    opacity: 0.1,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -10,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "#E07B2A",
    opacity: 0.12,
  },
  // Marque
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandNameWhite: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 5,
  },
  brandNameGold: {
    color: GOLD,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 5,
  },
  brandAccent: {
    width: 36,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: GOLD,
    marginBottom: 20,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  stepIndicator: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: GOLD, borderRadius: 999 },

  cardOuter: {
    flex: 1,
    backgroundColor: "#FFFCF8",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 56,
    gap: 24,
  },

  stepTitle: {
    color: "#1F2933",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  stepSubtitle: {
    color: "#6A625A",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },

  infoBox: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoText: { color: "#0C4A6E", fontSize: 14, lineHeight: 21 },
  infoValueBold: { fontWeight: "800" },

  hintBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  hintText: { color: "#1E40AF", fontSize: 13, fontWeight: "500" },
  hintValue: { fontWeight: "800" },

  fieldGroup: { gap: 10 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F0F6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldIconText: {
    fontSize: 13,
  },
  label: {
    color: "#1F2933",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
    flex: 1,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2D6CA",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#1F2933",
  },
  inputFlex: { flex: 1 },
  inputError: { borderColor: "#FCA5A5" },
  fieldErrorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
  },

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonSpaced: { marginTop: 24 },
  fullWidth: { alignSelf: "stretch" },
  primaryButtonBusy: { opacity: 0.7 },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  linkButton: { alignItems: "center", paddingVertical: 8 },
  linkButtonText: {
    color: BLUE_LIGHT,
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  successContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 32,
    gap: 16,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    borderWidth: 2,
    borderColor: "#BBF7D0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  successCheck: { color: GREEN, fontSize: 36, fontWeight: "900" },
  successTitle: {
    color: "#1F2933",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  successSubtitle: {
    color: "#6A625A",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});
