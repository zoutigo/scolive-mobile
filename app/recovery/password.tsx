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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { recoveryApi } from "../../src/api/recovery.api";
import type { RecoveryQuestion } from "../../src/types/recovery.types";
import { formatDateInput, parseDateToISO } from "./pin";

// ── Schémas Zod ───────────────────────────────────────────────────────────────

export const pwdRecoveryStep1Schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse email est requise.")
    .email("Adresse email invalide."),
});

export const pwdRecoveryStep2Schema = z.object({
  token: z
    .string()
    .trim()
    .min(16, "Le lien de réinitialisation est invalide (trop court)."),
});

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const pwdRecoveryStep4Schema = z
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

// ── Types internes ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

// ── Helper erreur API ─────────────────────────────────────────────────────────

export function parsePasswordRecoveryApiError(err: unknown): string {
  const e = err as { code?: string; statusCode?: number };
  switch (e?.code) {
    case "RECOVERY_INVALID":
      return "Informations de récupération invalides.";
    case "NOT_FOUND":
    case "USER_NOT_FOUND":
      return "Aucun compte trouvé pour cette adresse email.";
    case "TOKEN_EXPIRED":
    case "RESET_TOKEN_EXPIRED":
      return "Le lien a expiré. Recommencez depuis le début.";
    case "TOKEN_INVALID":
    case "RESET_TOKEN_INVALID":
      return "Lien de réinitialisation invalide.";
    case "SAME_PASSWORD":
      return "Le nouveau mot de passe doit être différent de l'actuel.";
    default:
      if (e?.statusCode === 404)
        return "Aucun compte trouvé pour cette adresse email.";
      if (e?.statusCode === 400)
        return "Informations de récupération invalides.";
      if (e?.statusCode === 401)
        return "Lien de réinitialisation invalide ou expiré.";
      return "Impossible de se connecter. Vérifiez votre connexion.";
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function PasswordRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);
  const [birthDate, setBirthDate] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  // ── Step 1 : Demande de réinitialisation ──────────────────────────────────

  async function handleStep1() {
    clearErrors();

    const result = pwdRecoveryStep1Schema.safeParse({ email });
    if (!result.success) {
      setFieldErrors({ email: result.error.issues[0].message });
      return;
    }

    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPasswordRequest({ email: email.trim() });
      setStep(2);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 2 : Saisie du token (depuis l'email) ─────────────────────────────

  async function handleStep2() {
    clearErrors();

    const result = pwdRecoveryStep2Schema.safeParse({ token });
    if (!result.success) {
      setFieldErrors({ token: result.error.issues[0].message });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recoveryApi.forgotPasswordOptions({
        token: token.trim(),
      });
      setEmailHint(res.emailHint);
      setQuestions(res.questions);
      setStep(3);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 3 : Vérification identité ───────────────────────────────────────

  async function handleStep3() {
    clearErrors();

    if (!birthDate.trim()) {
      setFieldErrors({ birthDate: "La date de naissance est obligatoire." });
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
      setFieldErrors({ birthDate: "Format attendu : JJ/MM/AAAA." });
      return;
    }
    const isoDate = parseDateToISO(birthDate);
    if (!isoDate) {
      setFieldErrors({ birthDate: "Date de naissance invalide." });
      return;
    }

    const unanswered = questions.find(
      (q) => !answers[q.key]?.trim() || answers[q.key].trim().length < 2,
    );
    if (unanswered) {
      setError(
        "Répondez à toutes les questions de sécurité (min. 2 caractères).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPasswordVerify({
        token: token.trim(),
        birthDate: isoDate,
        answers: questions.map((q) => ({
          questionKey: q.key,
          answer: answers[q.key].trim(),
        })),
      });
      setStep(4);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 4 : Nouveau mot de passe ─────────────────────────────────────────

  async function handleStep4() {
    clearErrors();

    const result = pwdRecoveryStep4Schema.safeParse({
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      // Première erreur par champ (priorité aux erreurs de format sur la mismatch)
      result.error.issues.forEach((i) => {
        if (i.path.length > 0 && !errs[String(i.path[0])]) {
          errs[String(i.path[0])] = i.message;
        }
      });
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPasswordComplete({
        token: token.trim(),
        newPassword,
      });
      setStep(5);
    } catch (err) {
      setError(parsePasswordRecoveryApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

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
                  clearErrors();
                  setStep((s) => (s - 1) as Step);
                }
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>‹ Retour</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.brandAccent} />

        <Text style={styles.headerTitle}>
          {isSuccess ? "Mot de passe mis à jour !" : "Mot de passe oublié"}
        </Text>

        {!isSuccess && (
          <>
            <Text style={styles.stepIndicator}>
              Étape {step} sur {totalSteps}
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
                  Réinitialiser le mot de passe
                </Text>
                <Text style={styles.stepSubtitle}>
                  Entrez votre adresse email. Nous vous enverrons un lien pour
                  réinitialiser votre mot de passe.
                </Text>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>✉️</Text>
                    </View>
                    <Text style={styles.label}>Adresse email</Text>
                  </View>
                  <TextInput
                    testID="input-email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nom@etablissement.cm"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      fieldErrors.email ? styles.inputError : null,
                    ]}
                    placeholderTextColor="#9B9490"
                  />
                  {fieldErrors.email ? (
                    <Text style={styles.fieldErrorText} testID="error-email">
                      {fieldErrors.email}
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
                      Envoyer le lien →
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 2 : Saisie du token ─────────────────── */}
            {step === 2 && (
              <View testID="step-2">
                <Text style={styles.stepTitle}>Vérifiez votre email</Text>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Un email a été envoyé à{" "}
                    <Text style={styles.infoValueBold}>{email}</Text>.{"\n"}
                    Ouvrez le lien dans l'email et copiez le code de
                    réinitialisation ci-dessous.
                  </Text>
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔗</Text>
                    </View>
                    <Text style={styles.label}>Code de réinitialisation</Text>
                  </View>
                  <TextInput
                    testID="input-token"
                    value={token}
                    onChangeText={setToken}
                    placeholder="Collez votre code ici"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      fieldErrors.token ? styles.inputError : null,
                    ]}
                    placeholderTextColor="#9B9490"
                  />
                  {fieldErrors.token ? (
                    <Text style={styles.fieldErrorText} testID="error-token">
                      {fieldErrors.token}
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
                    <Text style={styles.primaryButtonText}>Continuer →</Text>
                  )}
                </Pressable>

                <Pressable
                  testID="btn-resend"
                  style={styles.linkButton}
                  onPress={handleStep1}
                  disabled={isSubmitting}
                >
                  <Text style={styles.linkButtonText}>Renvoyer l'email</Text>
                </Pressable>
              </View>
            )}

            {/* ── Step 3 : Vérification identité ──────────── */}
            {step === 3 && (
              <View testID="step-3">
                <Text style={styles.stepTitle}>Vérification d'identité</Text>
                <Text style={styles.stepSubtitle}>
                  Confirmez votre identité pour sécuriser la réinitialisation.
                </Text>

                {emailHint ? (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                      Compte : <Text style={styles.hintValue}>{emailHint}</Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>📅</Text>
                    </View>
                    <Text style={styles.label}>Date de naissance</Text>
                  </View>
                  <TextInput
                    testID="input-birthdate"
                    value={birthDate}
                    onChangeText={(t) => setBirthDate(formatDateInput(t))}
                    placeholder="JJ/MM/AAAA"
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      fieldErrors.birthDate ? styles.inputError : null,
                    ]}
                    placeholderTextColor="#9B9490"
                    maxLength={10}
                  />
                  {fieldErrors.birthDate ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-birthdate"
                    >
                      {fieldErrors.birthDate}
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
                    <TextInput
                      testID={`input-answer-${idx}`}
                      value={answers[q.key] ?? ""}
                      onChangeText={(v) =>
                        setAnswers((prev) => ({ ...prev, [q.key]: v }))
                      }
                      placeholder="Votre réponse"
                      autoCapitalize="none"
                      style={styles.input}
                      placeholderTextColor="#9B9490"
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
                    <Text style={styles.primaryButtonText}>Vérifier →</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 4 : Nouveau mot de passe ────────────── */}
            {step === 4 && (
              <View testID="step-4">
                <Text style={styles.stepTitle}>Nouveau mot de passe</Text>
                <Text style={styles.stepSubtitle}>
                  Choisissez un mot de passe fort : au moins 8 caractères avec
                  majuscules, minuscules et chiffres.
                </Text>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔒</Text>
                    </View>
                    <Text style={styles.label}>Nouveau mot de passe</Text>
                  </View>
                  <View style={styles.passwordRow}>
                    <TextInput
                      testID="input-new-password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Votre nouveau mot de passe"
                      secureTextEntry={!showPassword}
                      style={[
                        styles.input,
                        styles.inputFlex,
                        fieldErrors.newPassword ? styles.inputError : null,
                      ]}
                      placeholderTextColor="#9B9490"
                    />
                    <Pressable
                      testID="toggle-show-password"
                      onPress={() => setShowPassword((v) => !v)}
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeText}>
                        {showPassword ? "Cacher" : "Voir"}
                      </Text>
                    </Pressable>
                  </View>
                  {fieldErrors.newPassword ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-new-password"
                    >
                      {fieldErrors.newPassword}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <View style={styles.fieldIcon}>
                      <Text style={styles.fieldIconText}>🔒</Text>
                    </View>
                    <Text style={styles.label}>Confirmer le mot de passe</Text>
                  </View>
                  <TextInput
                    testID="input-confirm-password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirmez votre mot de passe"
                    secureTextEntry={!showPassword}
                    style={[
                      styles.input,
                      fieldErrors.confirmPassword ? styles.inputError : null,
                    ]}
                    placeholderTextColor="#9B9490"
                  />
                  {fieldErrors.confirmPassword ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-confirm-password"
                    >
                      {fieldErrors.confirmPassword}
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
                      Enregistrer le mot de passe
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
                  Mot de passe mis à jour !
                </Text>
                <Text style={styles.successSubtitle}>
                  Votre mot de passe a été modifié avec succès. Vous pouvez
                  maintenant vous connecter.
                </Text>
                <Pressable
                  testID="btn-go-login"
                  style={[styles.primaryButton, styles.fullWidth]}
                  onPress={() => router.replace("/login")}
                >
                  <Text style={styles.primaryButtonText}>Se connecter</Text>
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

  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  eyeButton: {
    backgroundColor: "#EFE8DE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  eyeText: { color: AMBER, fontSize: 13, fontWeight: "700" },

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
