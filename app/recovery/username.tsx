import { useState } from "react";
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
import { apiFetch } from "../../src/api/client";
import { SecureTextField } from "../../src/components/SecureTextField";
import type { RecoveryQuestion } from "../../src/types/recovery.types";
import { formatDateInput, parseDateToISO } from "./pin";

// ── Schemas ───────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  username: z.string().trim().min(1, "L'identifiant est requis."),
});

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const step3Schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères.")
      .regex(
        PASSWORD_COMPLEXITY_REGEX,
        "Le mot de passe doit contenir majuscules, minuscules et chiffres.",
      ),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .superRefine((v, ctx) => {
    if (v.confirmPassword && v.newPassword !== v.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "La confirmation ne correspond pas au nouveau mot de passe.",
      });
    }
  });

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

type Step2Values = {
  birthDate: string;
  answers: Record<string, string>;
};

// ── API helpers ───────────────────────────────────────────────────────────────

interface UsernameRecoveryStartResponse {
  questions: RecoveryQuestion[];
  noQuestions?: boolean;
}

interface UsernameRecoveryVerifyResponse {
  recoveryToken: string;
}

async function recoverUsernameStart(
  username: string,
): Promise<UsernameRecoveryStartResponse> {
  return apiFetch("/auth/recover/username/start", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

async function recoverUsernameVerify(data: {
  username: string;
  birthDate: string;
  answers: Array<{ questionKey: string; answer: string }>;
}): Promise<UsernameRecoveryVerifyResponse> {
  return apiFetch("/auth/recover/username/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function recoverUsernameReset(data: {
  recoveryToken: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  return apiFetch("/auth/recover/username/reset", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

function parseRecoveryError(err: unknown): string {
  const e = err as { code?: string; statusCode?: number; message?: string };
  if (typeof e?.message === "string" && e.message !== "Request failed") {
    return e.message;
  }
  switch (e?.code) {
    case "RECOVERY_INVALID":
      return "Informations de récupération invalides.";
    case "NOT_FOUND":
    case "USER_NOT_FOUND":
      return "Aucun compte trouvé pour cet identifiant.";
    case "TOKEN_EXPIRED":
      return "Le jeton a expiré. Recommencez depuis le début.";
    case "NO_RECOVERY_QUESTIONS":
      return "Aucune question de récupération configurée.";
    default:
      if (e?.statusCode === 404)
        return "Aucun compte trouvé pour cet identifiant.";
      if (e?.statusCode === 400)
        return "Informations de récupération invalides.";
      return "Impossible de se connecter. Vérifiez votre connexion.";
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function UsernameRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);
  const [usernameValue, setUsernameValue] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [noQuestions, setNoQuestions] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { username: "" },
  });

  const step3Form = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const [step2Values, setStep2Values] = useState<Step2Values>({
    birthDate: "",
    answers: {},
  });

  function clearErrors() {
    setError(null);
  }

  // ── Step 1 — Saisir username ──────────────────────────────────────────────

  const handleStep1 = step1Form.handleSubmit(async (values) => {
    clearErrors();
    setIsSubmitting(true);
    try {
      const res = await recoverUsernameStart(values.username.trim());
      if (res.noQuestions || !res.questions || res.questions.length === 0) {
        setNoQuestions(true);
        setStep(2);
        return;
      }
      setUsernameValue(values.username.trim());
      setQuestions(res.questions);
      setStep(2);
    } catch (err) {
      setError(parseRecoveryError(err));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Step 2 — Répondre aux questions ──────────────────────────────────────

  async function handleStep2() {
    clearErrors();
    if (
      !step2Values.birthDate ||
      !/^\d{2}\/\d{2}\/\d{4}$/.test(step2Values.birthDate)
    ) {
      setError("Format de date attendu : JJ/MM/AAAA.");
      return;
    }
    const isoDate = parseDateToISO(step2Values.birthDate);
    if (!isoDate) {
      setError("Date de naissance invalide.");
      return;
    }
    for (const q of questions) {
      if (
        !step2Values.answers[q.key] ||
        step2Values.answers[q.key].trim().length < 2
      ) {
        setError("Chaque réponse doit contenir au moins 2 caractères.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await recoverUsernameVerify({
        username: usernameValue,
        birthDate: isoDate,
        answers: questions.map((q) => ({
          questionKey: q.key,
          answer: step2Values.answers[q.key] ?? "",
        })),
      });
      setRecoveryToken(res.recoveryToken);
      setStep(3);
    } catch (err) {
      setError(parseRecoveryError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 3 — Nouveau mot de passe ─────────────────────────────────────────

  const handleStep3 = step3Form.handleSubmit(async (values) => {
    clearErrors();
    setIsSubmitting(true);
    try {
      await recoverUsernameReset({
        recoveryToken,
        newPassword: values.newPassword,
      });
      setStep(4);
    } catch (err) {
      setError(parseRecoveryError(err));
    } finally {
      setIsSubmitting(false);
    }
  });

  const totalSteps = 3;
  const progressWidth =
    `${((Math.min(step, totalSteps) / totalSteps) * 100).toFixed(0)}%` as `${number}%`;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* En-tête */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <Text style={styles.brandNameWhite}>SCO</Text>
            <Text style={styles.brandNameGold}>LIVE</Text>
          </View>
          <Pressable
            testID="back-button"
            onPress={() => {
              if (step === 1) {
                router.back();
                return;
              }
              if (step === 4) {
                router.replace("/login");
                return;
              }
              setStep((s) => (s - 1) as Step);
              clearErrors();
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              {step === 4 ? "Se connecter" : "‹ Retour"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.brandAccent} />
        <Text style={styles.headerTitle}>
          {step === 4 ? "Mot de passe réinitialisé" : "Récupération du compte"}
        </Text>
        {step !== 4 ? (
          <>
            <Text style={styles.stepIndicator}>
              Étape {step} sur {totalSteps}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.headerSubtitle}>
              Réinitialisez votre mot de passe via votre identifiant.
            </Text>
          </>
        ) : (
          <Text style={styles.headerSubtitle}>
            Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous
            connecter.
          </Text>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.cardOuter}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <View style={styles.errorBox} testID="error-message">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ── Step 1 ── */}
            {step === 1 ? (
              <View style={styles.form} testID="step-1">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Votre identifiant</Text>
                  <Controller
                    control={step1Form.control}
                    name="username"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-username"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearErrors();
                          field.onChange(value);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="ex: jean.dupont"
                        style={[
                          styles.input,
                          fieldState.error && styles.inputError,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {step1Form.formState.errors.username ? (
                    <Text style={styles.fieldError} testID="error-username">
                      {step1Form.formState.errors.username.message}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  testID="btn-step1"
                  onPress={handleStep1}
                  disabled={isSubmitting}
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continuer</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {/* ── Step 2 — Questions ou message no-questions ── */}
            {step === 2 ? (
              noQuestions ? (
                <View style={styles.form} testID="step-2-no-questions">
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      Aucune question de récupération n'a été configurée pour ce
                      compte. Contacte ton administration scolaire pour
                      réinitialiser ton accès.
                    </Text>
                  </View>
                  <Pressable
                    testID="btn-back-login"
                    onPress={() => router.replace("/login")}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>
                      Retour à la connexion
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.form} testID="step-2">
                  {/* Date de naissance */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Date de naissance</Text>
                    <TextInput
                      testID="input-birthdate"
                      value={step2Values.birthDate}
                      onChangeText={(value) => {
                        clearErrors();
                        setStep2Values((prev) => ({
                          ...prev,
                          birthDate: formatDateInput(value),
                        }));
                      }}
                      keyboardType="number-pad"
                      placeholder="JJ/MM/AAAA"
                      style={styles.input}
                      placeholderTextColor="#9B9490"
                    />
                  </View>

                  {/* Questions */}
                  {questions.map((q, idx) => (
                    <View key={q.key} style={styles.fieldGroup}>
                      <Text style={styles.label}>{q.label}</Text>
                      <TextInput
                        testID={`input-answer-${idx}`}
                        value={step2Values.answers[q.key] ?? ""}
                        onChangeText={(value) => {
                          clearErrors();
                          setStep2Values((prev) => ({
                            ...prev,
                            answers: { ...prev.answers, [q.key]: value },
                          }));
                        }}
                        placeholder="Votre réponse"
                        autoCapitalize="none"
                        style={styles.input}
                        placeholderTextColor="#9B9490"
                      />
                    </View>
                  ))}

                  <Pressable
                    testID="btn-step2"
                    onPress={() => void handleStep2()}
                    disabled={isSubmitting}
                    style={[
                      styles.primaryButton,
                      isSubmitting && styles.primaryButtonBusy,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Continuer</Text>
                    )}
                  </Pressable>
                </View>
              )
            ) : null}

            {/* ── Step 3 — Nouveau mot de passe ── */}
            {step === 3 ? (
              <View style={styles.form} testID="step-3">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nouveau mot de passe</Text>
                  <Controller
                    control={step3Form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-new-password"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearErrors();
                          field.onChange(value);
                        }}
                        placeholder="8+ caractères, maj, min, chiffre"
                        placeholderTextColor="#9B9490"
                        containerStyle={
                          step3Form.formState.errors.newPassword
                            ? styles.inputError
                            : undefined
                        }
                      />
                    )}
                  />
                  {step3Form.formState.errors.newPassword ? (
                    <Text style={styles.fieldError} testID="error-new-password">
                      {step3Form.formState.errors.newPassword.message}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirmer le mot de passe</Text>
                  <Controller
                    control={step3Form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-confirm-password"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearErrors();
                          field.onChange(value);
                        }}
                        placeholderTextColor="#9B9490"
                        containerStyle={
                          fieldState.error ? styles.inputError : undefined
                        }
                      />
                    )}
                  />
                  {step3Form.formState.errors.confirmPassword ? (
                    <Text
                      style={styles.fieldError}
                      testID="error-confirm-password"
                    >
                      {step3Form.formState.errors.confirmPassword.message}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  testID="btn-step3"
                  onPress={handleStep3}
                  disabled={isSubmitting}
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Réinitialiser</Text>
                  )}
                </Pressable>
              </View>
            ) : null}

            {/* ── Step 4 — Succès ── */}
            {step === 4 ? (
              <View style={styles.successCard} testID="step-4">
                <Text style={styles.successTitle}>
                  Mot de passe réinitialisé
                </Text>
                <Text style={styles.successText}>
                  Votre mot de passe a été mis à jour. Vous pouvez maintenant
                  vous connecter avec votre identifiant.
                </Text>
                <Pressable
                  testID="btn-go-login"
                  onPress={() => router.replace("/login")}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    Retour à la connexion
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const BLUE = "#08467D";
const GOLD = "#F7C260";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLUE },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    overflow: "hidden",
  },
  blobTopRight: {
    position: "absolute",
    top: -30,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: GOLD,
    opacity: 0.12,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -20,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "#E07B2A",
    opacity: 0.15,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: { flexDirection: "row", alignItems: "baseline" },
  brandNameWhite: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 5,
  },
  brandNameGold: {
    color: GOLD,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 5,
  },
  backButton: { padding: 8 },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  brandAccent: {
    width: 44,
    height: 3,
    borderRadius: 999,
    backgroundColor: GOLD,
    marginTop: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 20,
    letterSpacing: -0.5,
  },
  stepIndicator: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    opacity: 0.8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: GOLD,
    borderRadius: 2,
  },
  headerSubtitle: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
    marginTop: 8,
  },

  cardOuter: {
    flex: 1,
    backgroundColor: "#FFFCF8",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 56,
    gap: 24,
  },

  form: { gap: 18 },
  fieldGroup: { gap: 8 },
  label: {
    color: "#1F2933",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2D6CA",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2933",
  },
  inputError: { borderColor: "#FCA5A5" },
  fieldError: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
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
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    elevation: 3,
  },
  primaryButtonBusy: { opacity: 0.7 },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  warningBox: {
    backgroundColor: "#FEF9EB",
    borderWidth: 1,
    borderColor: "#F0C070",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  warningText: {
    color: "#7A4A0A",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 14,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2933",
    textAlign: "center",
  },
  successText: {
    fontSize: 14,
    color: "#6A625A",
    lineHeight: 22,
    textAlign: "center",
  },
});
