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

const defaultT: TranslateFn = (key) => translate(DEFAULT_LOCALE, key);

// ── Schémas Zod ───────────────────────────────────────────────────────────────

export function buildPinRecoveryStep1PhoneSchema(t: TranslateFn) {
  return z.object({
    phone: z
      .string()
      .trim()
      .min(1, t("recovery.pin.errors.phoneRequired"))
      .regex(/^\d{9}$/, t("recovery.pin.errors.phoneInvalid")),
  });
}

export function buildPinRecoveryStep3Schema(t: TranslateFn) {
  return z
    .object({
      newPin: z.string().regex(/^\d{6}$/, t("recovery.pin.errors.pinFormat")),
      confirmPin: z.string().min(1, t("recovery.pin.errors.confirmRequired")),
    })
    .superRefine((v, ctx) => {
      if (v.confirmPin && v.newPin !== v.confirmPin) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPin"],
          message: t("recovery.pin.errors.confirmMismatch"),
        });
      }
    });
}

export const pinRecoveryStep1PhoneSchema =
  buildPinRecoveryStep1PhoneSchema(defaultT);

export const pinRecoveryStep3Schema = buildPinRecoveryStep3Schema(defaultT);

// ── Types internes ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

type PinRecoveryStep2Values = {
  birthDate: string;
  answers: Record<string, string>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseDateToISO(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (isNaN(d.getTime())) return null;
  return `${year}-${month}-${day}`;
}

export function parseRecoveryApiError(
  err: unknown,
  t: TranslateFn = defaultT,
): string {
  const e = err as { code?: string; statusCode?: number };
  switch (e?.code) {
    case "RECOVERY_INVALID":
      return t("recovery.common.errors.recoveryInvalid");
    case "NOT_FOUND":
    case "USER_NOT_FOUND":
      return t("recovery.common.errors.notFound");
    case "RECOVERY_SESSION_EXPIRED":
      return t("recovery.common.errors.sessionExpired");
    case "SAME_PIN":
      return t("recovery.pin.errors.samePin");
    default:
      if (e?.statusCode === 404) return t("recovery.common.errors.notFound");
      if (e?.statusCode === 400)
        return t("recovery.common.errors.recoveryInvalid");
      return t("apiErrors.generic");
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function PinRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const { locale, t } = useTranslation();
  const [step, setStep] = useState<Step>(1);

  const [principalHint, setPrincipalHint] = useState("");
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);

  const [recoveryToken, setRecoveryToken] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step1Schema = useMemo(
    () => buildPinRecoveryStep1PhoneSchema(t),
    [locale],
  );
  const step3Schema = useMemo(() => buildPinRecoveryStep3Schema(t), [locale]);

  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      phone: "",
    },
  });

  const step2Schema = useMemo(
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

  const step2Form = useForm<PinRecoveryStep2Values>({
    resolver: zodResolver(step2Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      birthDate: "",
      answers: {},
    },
  });

  const step3Form = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      newPin: "",
      confirmPin: "",
    },
  });

  useEffect(() => {
    if (step !== 2) {
      return;
    }
    step2Form.reset((currentValues) => ({
      birthDate: currentValues.birthDate ?? "",
      answers: Object.fromEntries(
        questions.map((question) => [
          question.key,
          currentValues.answers?.[question.key] ?? "",
        ]),
      ),
    }));
  }, [questions, step, step2Form]);

  function clearUiErrors() {
    setError(null);
  }

  // ── Step 1 : Identification par téléphone ─────────────────────────────────

  const handleStep1 = step1Form.handleSubmit(async (values) => {
    clearUiErrors();
    setIsSubmitting(true);
    try {
      const res = await recoveryApi.forgotPinOptions({ phone: values.phone });
      setPrincipalHint(res.principalHint);
      setQuestions(res.questions);
      setStep(2);
    } catch (err) {
      setError(parseRecoveryApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Step 2 : Vérification identité ───────────────────────────────────────

  const handleStep2 = step2Form.handleSubmit(async (values) => {
    clearUiErrors();
    const isoDate = parseDateToISO(values.birthDate);
    if (!isoDate) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await recoveryApi.forgotPinVerify({
        phone: step1Form.getValues("phone"),
        birthDate: isoDate,
        answers: questions.map((q) => ({
          questionKey: q.key,
          answer: (values.answers[q.key] ?? "").trim(),
        })),
      });
      setRecoveryToken(res.recoveryToken);
      setStep(3);
    } catch (err) {
      setError(parseRecoveryApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Step 3 : Nouveau PIN ──────────────────────────────────────────────────

  const handleStep3 = step3Form.handleSubmit(async (values) => {
    clearUiErrors();
    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPinComplete({
        recoveryToken,
        newPin: values.newPin,
      });
      setStep(4);
    } catch (err) {
      setError(parseRecoveryApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Render ────────────────────────────────────────────────────────────────

  const isSuccess = step === 4;

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
            ? t("recovery.pin.headerTitleSuccess")
            : t("recovery.pin.headerTitle")}
        </Text>

        {!isSuccess && (
          <>
            <Text style={styles.stepIndicator}>
              {t("recovery.pin.step").replace("{step}", String(step))}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
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
            {/* ── Step 1 : Identification ──────────────────── */}
            {step === 1 && (
              <View testID="step-1">
                <Text style={styles.stepTitle}>
                  {t("recovery.pin.step1.title")}
                </Text>
                <Text style={styles.stepSubtitle}>
                  {t("recovery.pin.step1.subtitle")}
                </Text>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>📱</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.pin.fields.phone")}
                    </Text>
                  </View>
                  <View style={styles.phoneRow}>
                    <View style={styles.dialCode}>
                      <Text style={styles.dialCodeText}>+237</Text>
                    </View>
                    <Controller
                      control={step1Form.control}
                      name="phone"
                      render={({ field, fieldState }) => (
                        <TextInput
                          ref={field.ref}
                          testID="input-phone"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChangeText={(value) => {
                            clearUiErrors();
                            field.onChange(value);
                          }}
                          placeholder={t("recovery.common.phonePlaceholder")}
                          keyboardType="phone-pad"
                          style={[
                            styles.input,
                            styles.inputFlex,
                            fieldState.error ? styles.inputError : null,
                          ]}
                          placeholderTextColor="#9B9490"
                        />
                      )}
                    />
                  </View>
                  {step1Form.formState.errors.phone ? (
                    <Text style={styles.fieldErrorText} testID="error-phone">
                      {step1Form.formState.errors.phone.message}
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
                      {t("recovery.common.continue")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 2 : Vérification identité ──────────── */}
            {step === 2 && (
              <View testID="step-2">
                <Text style={styles.stepTitle}>
                  {t("recovery.pin.step2.title")}
                </Text>
                <Text style={styles.stepSubtitle}>
                  {t("recovery.pin.step2.subtitle")}
                </Text>

                {principalHint ? (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                      {t("recovery.pin.step2.accountHint")}
                      <Text style={styles.hintValue}>{principalHint}</Text>
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
                    control={step2Form.control}
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
                  {step2Form.formState.errors.birthDate ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-birthdate"
                    >
                      {step2Form.formState.errors.birthDate.message}
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
                      control={step2Form.control}
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
                      {t("recovery.common.verify")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 3 : Nouveau PIN ─────────────────────── */}
            {step === 3 && (
              <View testID="step-3">
                <Text style={styles.stepTitle}>
                  {t("recovery.pin.step3.title")}
                </Text>
                <Text style={styles.stepSubtitle}>
                  {t("recovery.pin.step3.subtitle")}
                </Text>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔒</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.pin.fields.newPin")}
                    </Text>
                  </View>
                  <Controller
                    control={step3Form.control}
                    name="newPin"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-new-pin"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearUiErrors();
                          field.onChange(value);
                        }}
                        placeholder={t("recovery.pin.placeholders.newPin")}
                        keyboardType="number-pad"
                        maxLength={6}
                        containerStyle={
                          fieldState.error ? styles.inputError : null
                        }
                        placeholderTextColor="#9B9490"
                        variant="pin"
                      />
                    )}
                  />
                  {step3Form.formState.errors.newPin ? (
                    <Text style={styles.fieldErrorText} testID="error-new-pin">
                      {step3Form.formState.errors.newPin.message}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔒</Text>
                    </View>
                    <Text style={styles.label}>
                      {t("recovery.pin.fields.confirmPin")}
                    </Text>
                  </View>
                  <Controller
                    control={step3Form.control}
                    name="confirmPin"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-confirm-pin"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearUiErrors();
                          field.onChange(value);
                        }}
                        placeholder={t("recovery.pin.placeholders.confirmPin")}
                        keyboardType="number-pad"
                        maxLength={6}
                        containerStyle={
                          fieldState.error ? styles.inputError : null
                        }
                        placeholderTextColor="#9B9490"
                        variant="pin"
                      />
                    )}
                  />
                  {step3Form.formState.errors.confirmPin ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-confirm-pin"
                    >
                      {step3Form.formState.errors.confirmPin.message}
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
                      {t("recovery.pin.step3.submit")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 4 : Succès ──────────────────────────── */}
            {step === 4 && (
              <View testID="step-4" style={styles.successContainer}>
                <View style={styles.successIconWrap}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={styles.successTitle}>
                  {t("recovery.pin.headerTitleSuccess")}
                </Text>
                <Text style={styles.successSubtitle}>
                  {t("recovery.pin.success.subtitle")}
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

  // En-tête
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
  progressFill: {
    height: "100%",
    backgroundColor: GOLD,
    borderRadius: 999,
  },

  // Card
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

  // Étape
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

  // Champs
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
  inputFlex: {
    flex: 1,
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  inputError: { borderColor: "#FCA5A5" },
  phoneRow: { flexDirection: "row" },
  dialCode: {
    backgroundColor: "#FDF0DF",
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderColor: "#E2D6CA",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  dialCodeText: { color: AMBER, fontSize: 15, fontWeight: "700" },
  fieldErrorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
  },

  // Hint
  hintBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  hintText: { color: "#1E40AF", fontSize: 13, fontWeight: "500" },
  hintValue: { fontWeight: "800" },

  // Erreur
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  // Bouton principal
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

  // Succès
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
