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

// ── Schémas Zod ───────────────────────────────────────────────────────────────

export const pinRecoveryStep1PhoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est requis.")
    .regex(/^\d{9}$/, "Numéro invalide (9 chiffres attendus)."),
});

export const pinRecoveryStep1EmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "L'adresse email est requise.")
    .email("Adresse email invalide."),
});

export const pinRecoveryStep3Schema = z
  .object({
    newPin: z
      .string()
      .regex(/^\d{6}$/, "Le PIN doit contenir exactement 6 chiffres."),
    confirmPin: z.string().min(1, "Confirmez le PIN."),
  })
  .superRefine((v, ctx) => {
    if (v.confirmPin && v.newPin !== v.confirmPin) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPin"],
        message: "La confirmation ne correspond pas au PIN.",
      });
    }
  });

// ── Types internes ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;
type InputMode = "phone" | "email";

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

export function parseRecoveryApiError(err: unknown): string {
  const e = err as { code?: string; statusCode?: number };
  switch (e?.code) {
    case "RECOVERY_INVALID":
      return "Informations de récupération invalides.";
    case "NOT_FOUND":
    case "USER_NOT_FOUND":
      return "Aucun compte trouvé avec ces informations.";
    case "RECOVERY_SESSION_EXPIRED":
      return "Session expirée. Recommencez depuis le début.";
    case "SAME_PIN":
      return "Le nouveau PIN doit être différent de l'actuel.";
    default:
      if (e?.statusCode === 404)
        return "Aucun compte trouvé avec ces informations.";
      if (e?.statusCode === 400)
        return "Informations de récupération invalides.";
      return "Impossible de se connecter. Vérifiez votre connexion.";
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function PinRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [inputMode, setInputMode] = useState<InputMode>("phone");

  const [phone, setPhone] = useState("");
  const [emailId, setEmailId] = useState("");

  const [principalHint, setPrincipalHint] = useState("");
  const [questions, setQuestions] = useState<RecoveryQuestion[]>([]);
  const [birthDate, setBirthDate] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  // ── Step 1 : Identification ───────────────────────────────────────────────

  async function handleStep1() {
    clearErrors();

    if (inputMode === "phone") {
      const result = pinRecoveryStep1PhoneSchema.safeParse({ phone });
      if (!result.success) {
        setFieldErrors({ phone: result.error.issues[0].message });
        return;
      }
    } else {
      const result = pinRecoveryStep1EmailSchema.safeParse({ email: emailId });
      if (!result.success) {
        setFieldErrors({ email: result.error.issues[0].message });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload =
        inputMode === "phone" ? { phone } : { email: emailId.trim() };
      const res = await recoveryApi.forgotPinOptions(payload);
      setPrincipalHint(res.principalHint);
      setQuestions(res.questions);
      setStep(2);
    } catch (err) {
      setError(parseRecoveryApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 2 : Vérification identité ───────────────────────────────────────

  async function handleStep2() {
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
      const payload = {
        ...(inputMode === "phone" ? { phone } : { email: emailId.trim() }),
        birthDate: isoDate,
        answers: questions.map((q) => ({
          questionKey: q.key,
          answer: answers[q.key].trim(),
        })),
      };
      const res = await recoveryApi.forgotPinVerify(payload);
      setRecoveryToken(res.recoveryToken);
      setStep(3);
    } catch (err) {
      setError(parseRecoveryApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 3 : Nouveau PIN ──────────────────────────────────────────────────

  async function handleStep3() {
    clearErrors();

    const result = pinRecoveryStep3Schema.safeParse({ newPin, confirmPin });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        if (i.path.length > 0) errs[String(i.path[0])] = i.message;
      });
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await recoveryApi.forgotPinComplete({ recoveryToken, newPin });
      setStep(4);
    } catch (err) {
      setError(parseRecoveryApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isSuccess = step === 4;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── En-tête ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

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
            <Text style={styles.backButtonText}>← Retour</Text>
          </Pressable>
        )}

        <Text style={styles.headerTitle}>
          {isSuccess ? "PIN mis à jour !" : "Récupération de PIN"}
        </Text>

        {!isSuccess && (
          <>
            <Text style={styles.stepIndicator}>Étape {step} sur 3</Text>
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
                <Text style={styles.stepTitle}>Identifiez votre compte</Text>
                <Text style={styles.stepSubtitle}>
                  Renseignez votre numéro de téléphone ou adresse email pour
                  retrouver l'accès à votre compte.
                </Text>

                <View style={styles.toggleRow}>
                  {(["phone", "email"] as InputMode[]).map((m) => (
                    <Pressable
                      key={m}
                      testID={`toggle-${m}`}
                      onPress={() => {
                        setInputMode(m);
                        clearErrors();
                      }}
                      style={[
                        styles.toggleBtn,
                        inputMode === m && styles.toggleBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          inputMode === m && styles.toggleTextActive,
                        ]}
                      >
                        {m === "phone" ? "Téléphone" : "Email"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {inputMode === "phone" ? (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Numéro de téléphone</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.dialCode}>
                        <Text style={styles.dialCodeText}>+237</Text>
                      </View>
                      <TextInput
                        testID="input-phone"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="6XX XXX XXX"
                        keyboardType="phone-pad"
                        style={[
                          styles.input,
                          styles.inputFlex,
                          fieldErrors.phone ? styles.inputError : null,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    </View>
                    {fieldErrors.phone ? (
                      <Text style={styles.fieldErrorText} testID="error-phone">
                        {fieldErrors.phone}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Adresse email</Text>
                    <TextInput
                      testID="input-email"
                      value={emailId}
                      onChangeText={setEmailId}
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
                )}

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
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handleStep1}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continuer →</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 2 : Vérification identité ──────────── */}
            {step === 2 && (
              <View testID="step-2">
                <Text style={styles.stepTitle}>Vérification d'identité</Text>
                <Text style={styles.stepSubtitle}>
                  Confirmez votre identité pour accéder à la réinitialisation.
                </Text>

                {principalHint ? (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintText}>
                      Compte :{" "}
                      <Text style={styles.hintValue}>{principalHint}</Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Date de naissance</Text>
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
                    <Text style={styles.label}>{q.label}</Text>
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
                    <Text style={styles.primaryButtonText}>Vérifier →</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* ── Step 3 : Nouveau PIN ─────────────────────── */}
            {step === 3 && (
              <View testID="step-3">
                <Text style={styles.stepTitle}>Nouveau PIN</Text>
                <Text style={styles.stepSubtitle}>
                  Choisissez un code PIN à 6 chiffres pour sécuriser votre
                  accès.
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nouveau PIN</Text>
                  <TextInput
                    testID="input-new-pin"
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder="6 chiffres"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    style={[
                      styles.input,
                      fieldErrors.newPin ? styles.inputError : null,
                    ]}
                    placeholderTextColor="#9B9490"
                  />
                  {fieldErrors.newPin ? (
                    <Text style={styles.fieldErrorText} testID="error-new-pin">
                      {fieldErrors.newPin}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirmer le PIN</Text>
                  <TextInput
                    testID="input-confirm-pin"
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    placeholder="Confirmez votre PIN"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    style={[
                      styles.input,
                      fieldErrors.confirmPin ? styles.inputError : null,
                    ]}
                    placeholderTextColor="#9B9490"
                  />
                  {fieldErrors.confirmPin ? (
                    <Text
                      style={styles.fieldErrorText}
                      testID="error-confirm-pin"
                    >
                      {fieldErrors.confirmPin}
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
                      Enregistrer le PIN
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
                <Text style={styles.successTitle}>PIN mis à jour !</Text>
                <Text style={styles.successSubtitle}>
                  Votre code PIN a été modifié avec succès. Vous pouvez
                  maintenant vous connecter.
                </Text>
                <Pressable
                  testID="btn-go-login"
                  style={styles.primaryButton}
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

  // En-tête
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
  backButton: { paddingVertical: 4, marginBottom: 16, alignSelf: "flex-start" },
  backButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
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
    marginTop: 6,
    marginBottom: 10,
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
    paddingTop: 28,
    paddingBottom: 56,
    gap: 18,
  },

  // Étape
  stepTitle: {
    color: "#1F2933",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  stepSubtitle: {
    color: "#6A625A",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4,
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#EFE8DE",
    borderRadius: 12,
    padding: 4,
    gap: 2,
    marginBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleText: { color: "#7A6F65", fontSize: 13, fontWeight: "700" },
  toggleTextActive: { color: "#FFFFFF" },

  // Champs
  fieldGroup: { gap: 7 },
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
    marginTop: 2,
  },

  // Hint
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

  // Erreur
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

  // Bouton principal
  primaryButton: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
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
