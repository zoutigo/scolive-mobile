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
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { authApi } from "../src/api/auth.api";
import type { ApiClientError } from "../src/api/client";
import { SecureTextField } from "../src/components/SecureTextField";
import type {
  Gender,
  OnboardingOptionsResponse,
} from "../src/types/onboarding.types";
import { formatDateInput, parseDateToISO } from "./recovery/pin";

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_PIN_REGEX = /^\d{6}$/;

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type Step1FormValues = {
  email: string;
  temporaryPassword: string;
  newPassword: string;
  confirmPassword: string;
  setupToken: string;
};
type Step2FormValues = z.infer<typeof onboardingProfileStepSchema>;
type Step3FormValues = z.infer<typeof onboardingPinStepSchema>;
type RecoveryFormValues = z.infer<typeof onboardingRecoveryStepSchema>;

export const emailOnboardingStep1Schema = z
  .object({
    email: z.string().trim().email("Adresse email invalide."),
    temporaryPassword: z
      .string()
      .trim()
      .min(8, "Le mot de passe provisoire est obligatoire."),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères.")
      .regex(
        PASSWORD_COMPLEXITY_REGEX,
        "Le mot de passe doit contenir majuscules, minuscules et chiffres.",
      ),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "La confirmation ne correspond pas au nouveau mot de passe.",
      });
    }
  });

export const phoneOnboardingStep1Schema = z.object({
  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        z.string().email("Adresse email invalide.").safeParse(value).success,
      "Adresse email invalide.",
    ),
  setupToken: z.string().trim().min(1, "Jeton d'activation manquant."),
});

export const onboardingProfileStepSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire."),
  lastName: z.string().trim().min(1, "Le nom est obligatoire."),
  gender: z.enum(["M", "F", "OTHER"], {
    message: "Le genre est obligatoire.",
  }),
  birthDate: z
    .string()
    .min(1, "La date de naissance est obligatoire.")
    .refine((value) => /^\d{2}\/\d{2}\/\d{4}$/.test(value), {
      message: "Format attendu : JJ/MM/AAAA.",
    })
    .refine((value) => parseDateToISO(value) !== null, {
      message: "Date de naissance invalide.",
    })
    .refine((value) => {
      const isoDate = parseDateToISO(value);
      if (!isoDate) {
        return false;
      }
      return new Date(`${isoDate}T23:59:59.999Z`) <= new Date();
    }, "La date de naissance ne peut pas être dans le futur."),
});

export const onboardingPinStepSchema = z
  .object({
    newPin: z
      .string()
      .trim()
      .regex(PHONE_PIN_REGEX, "Le PIN doit contenir exactement 6 chiffres."),
    confirmPin: z.string().trim().min(1, "Confirmez le PIN."),
  })
  .superRefine((value, ctx) => {
    if (value.newPin !== value.confirmPin) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPin"],
        message: "La confirmation ne correspond pas au PIN.",
      });
    }
  });

export const onboardingRecoveryStepSchema = z
  .object({
    selectedQuestions: z
      .array(z.string())
      .length(3, "Choisissez exactement 3 questions.")
      .refine((items) => new Set(items).size === 3, {
        message: "Les 3 questions doivent être différentes.",
      }),
    answers: z.record(z.string(), z.string().trim().min(2)),
    isParent: z.boolean(),
    parentClassId: z.string().optional(),
    parentStudentId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    value.selectedQuestions.forEach((questionKey) => {
      if (
        !value.answers[questionKey] ||
        value.answers[questionKey].trim().length < 2
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["answers", questionKey],
          message: "Chaque réponse doit contenir au moins 2 caractères.",
        });
      }
    });

    if (value.isParent && !value.parentClassId) {
      ctx.addIssue({
        code: "custom",
        path: ["parentClassId"],
        message: "La classe de votre enfant est obligatoire.",
      });
    }

    if (value.isParent && !value.parentStudentId) {
      ctx.addIssue({
        code: "custom",
        path: ["parentStudentId"],
        message: "Le nom de votre enfant est obligatoire.",
      });
    }
  });

export const onboardingRecoverySelectionStepSchema = z.object({
  selectedQuestions: z
    .array(z.string())
    .length(3, "Choisissez exactement 3 questions.")
    .refine((items) => new Set(items).size === 3, {
      message: "Les 3 questions doivent être différentes.",
    }),
});

export function buildOnboardingRecoveryRows(
  selectedQuestions: string[],
  answers: Record<string, string>,
) {
  return selectedQuestions.map((questionKey) => ({
    questionKey,
    answer: answers[questionKey] ?? "",
  }));
}

export function parseOnboardingApiError(err: unknown): string {
  const apiErr = err as ApiClientError;
  if (
    typeof apiErr?.message === "string" &&
    apiErr.message !== "Request failed"
  ) {
    return apiErr.message;
  }
  switch (apiErr?.code) {
    case "INVALID_CREDENTIALS":
      return "Informations d'activation invalides.";
    case "PROFILE_SETUP_REQUIRED":
      return "Le profil doit encore être complété.";
    default:
      if (apiErr?.statusCode === 401) {
        return "Informations d'activation invalides.";
      }
      if (apiErr?.statusCode === 400 || apiErr?.statusCode === 403) {
        return "Impossible de finaliser l'activation avec ces informations.";
      }
      return "Impossible de se connecter. Vérifiez votre connexion.";
  }
}

function getTextParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0] ?? "";
  }
  return "";
}

function getCompactQuestionLabel(label: string): string {
  if (label.length <= 22) {
    return label;
  }
  return `${label.slice(0, 19).trimEnd()}…`;
}

function GenderButton({
  value,
  label,
  currentValue,
  onPress,
}: {
  value: Gender;
  label: string;
  currentValue: Gender | "";
  onPress: (value: Gender) => void;
}) {
  const active = currentValue === value;
  return (
    <Pressable
      testID={`gender-${value}`}
      onPress={() => onPress(value)}
      style={[styles.choiceChip, active && styles.choiceChipActive]}
    >
      <Text
        style={[styles.choiceChipText, active && styles.choiceChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    email?: string | string[];
    schoolSlug?: string | string[];
    setupToken?: string | string[];
  }>();

  const initialEmail = getTextParam(params.email).trim();
  const initialSetupToken = getTextParam(params.setupToken).trim();
  const schoolSlug = getTextParam(params.schoolSlug).trim();
  const isTokenFlow = initialSetupToken.length > 0;
  const totalSteps = isTokenFlow ? 5 : 4;
  const successStep = (totalSteps + 1) as Step;

  const [step, setStep] = useState<Step>(1);
  const [options, setOptions] = useState<OnboardingOptionsResponse | null>(
    null,
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isParent = useMemo(
    () => (options?.schoolRoles ?? []).includes("PARENT"),
    [options?.schoolRoles],
  );

  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(
      isTokenFlow ? phoneOnboardingStep1Schema : emailOnboardingStep1Schema,
    ) as never,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: initialEmail,
      temporaryPassword: "",
      newPassword: "",
      confirmPassword: "",
      setupToken: initialSetupToken,
    },
  });

  const step2Form = useForm<Step2FormValues>({
    resolver: zodResolver(onboardingProfileStepSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: undefined as unknown as Gender,
      birthDate: "",
    },
  });

  const step3Form = useForm<Step3FormValues>({
    resolver: zodResolver(onboardingPinStepSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      newPin: "",
      confirmPin: "",
    },
  });

  const recoveryForm = useForm<RecoveryFormValues>({
    resolver: zodResolver(onboardingRecoveryStepSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      selectedQuestions: [],
      answers: {},
      isParent: false,
      parentClassId: "",
      parentStudentId: "",
    },
  });

  const watchedEmail = step1Form.watch("email");
  const watchedSetupToken = step1Form.watch("setupToken");
  const watchedGender = (step2Form.watch("gender") ?? "") as Gender | "";
  const selectedQuestions = recoveryForm.watch("selectedQuestions") ?? [];
  const parentClassId = recoveryForm.watch("parentClassId") ?? "";
  const parentStudentId = recoveryForm.watch("parentStudentId") ?? "";

  useEffect(() => {
    step1Form.reset({
      email: initialEmail,
      temporaryPassword: "",
      newPassword: "",
      confirmPassword: "",
      setupToken: initialSetupToken,
    });
    step2Form.reset({
      firstName: "",
      lastName: "",
      gender: undefined as unknown as Gender,
      birthDate: "",
    });
    step3Form.reset({
      newPin: "",
      confirmPin: "",
    });
    recoveryForm.reset({
      selectedQuestions: [],
      answers: {},
      isParent: false,
      parentClassId: "",
      parentStudentId: "",
    });
    setStep(1);
    setError(null);
    setOptions(null);
  }, [initialEmail, initialSetupToken]);

  useEffect(() => {
    if (!watchedEmail && !watchedSetupToken) {
      setError("Lien d'activation invalide.");
      return;
    }

    let active = true;
    async function loadOptions() {
      setIsLoadingOptions(true);
      setError(null);
      try {
        const response = await authApi.getOnboardingOptions({
          ...(watchedEmail ? { email: watchedEmail } : {}),
          ...(watchedSetupToken ? { setupToken: watchedSetupToken } : {}),
        });
        if (!active) {
          return;
        }
        setOptions(response);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(parseOnboardingApiError(err));
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();
    return () => {
      active = false;
    };
  }, [watchedEmail, watchedSetupToken]);

  useEffect(() => {
    recoveryForm.setValue("isParent", isParent, { shouldValidate: false });
  }, [isParent, recoveryForm]);

  function clearErrors() {
    setError(null);
  }

  function handleBack() {
    if (step === successStep) {
      router.replace("/login");
      return;
    }
    clearErrors();
    if (step === 1) {
      router.back();
      return;
    }
    setStep((current) => (current - 1) as Step);
  }

  function validateRecoverySelectionStep() {
    clearErrors();
    const result = onboardingRecoverySelectionStepSchema.safeParse({
      selectedQuestions,
    });
    if (!result.success) {
      const message =
        result.error.issues[0]?.message ?? "Choisissez exactement 3 questions.";
      setError(message);
      return false;
    }
    return true;
  }

  const goNextStep1 = step1Form.handleSubmit(() => {
    clearErrors();
    setStep((current) => (current + 1) as Step);
  });

  const goNextStep2 = step2Form.handleSubmit(() => {
    clearErrors();
    setStep((current) => (current + 1) as Step);
  });

  const goNextStep3 = step3Form.handleSubmit(() => {
    clearErrors();
    setStep((current) => (current + 1) as Step);
  });

  function goNextSelection() {
    if (!validateRecoverySelectionStep()) {
      return;
    }
    setStep((current) => (current + 1) as Step);
  }

  function toggleQuestion(questionKey: string) {
    clearErrors();
    const current = recoveryForm.getValues("selectedQuestions") ?? [];
    if (current.includes(questionKey)) {
      recoveryForm.setValue(
        "selectedQuestions",
        current.filter((entry) => entry !== questionKey),
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }
    if (current.length >= 3) {
      setError("Choisissez exactement 3 questions.");
      return;
    }
    recoveryForm.setValue("selectedQuestions", [...current, questionKey], {
      shouldDirty: true,
      shouldValidate: true,
    });
    recoveryForm.setValue(`answers.${questionKey}` as const, "", {
      shouldDirty: false,
      shouldValidate: false,
    });
  }

  const handleSubmit = recoveryForm.handleSubmit(async (values) => {
    clearErrors();
    const birthDate = step2Form.getValues("birthDate");
    const isoBirthDate = parseDateToISO(birthDate);
    if (!isoBirthDate) {
      step2Form.setError("birthDate", {
        message: "Date de naissance invalide.",
      });
      return;
    }

    if (!validateRecoverySelectionStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const step1Values = step1Form.getValues();
      const step2Values = step2Form.getValues();
      const step3Values = step3Form.getValues();
      await authApi.completeOnboarding({
        ...(isTokenFlow
          ? {
              setupToken: step1Values.setupToken,
              email: step1Values.email.trim() || undefined,
              newPin: step3Values.newPin,
            }
          : {
              email: step1Values.email.trim(),
              temporaryPassword: step1Values.temporaryPassword,
              newPassword: step1Values.newPassword,
            }),
        firstName: step2Values.firstName.trim(),
        lastName: step2Values.lastName.trim(),
        gender: step2Values.gender as Gender,
        birthDate: isoBirthDate,
        answers: buildOnboardingRecoveryRows(
          values.selectedQuestions,
          values.answers,
        ),
        parentClassId: values.parentClassId || undefined,
        parentStudentId: values.parentStudentId || undefined,
      });
      setStep(successStep);
    } catch (err) {
      setError(parseOnboardingApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  });

  const progressWidth =
    `${((Math.min(step, totalSteps) / totalSteps) * 100).toFixed(0)}%` as `${number}%`;
  const title =
    step === successStep ? "Activation terminée" : "Première connexion";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

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
            onPress={handleBack}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              {step === successStep ? "Se connecter" : "‹ Retour"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.brandAccent} />
        <Text style={styles.headerTitle}>{title}</Text>
        {step !== successStep ? (
          <>
            <Text style={styles.stepIndicator}>
              Étape {step} sur {totalSteps}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: progressWidth as `${number}%` },
                ]}
              />
            </View>
            <Text style={styles.headerSubtitle}>
              {isTokenFlow
                ? "Complétez votre profil, changez votre PIN et configurez la récupération."
                : "Changez votre mot de passe provisoire puis terminez la configuration du compte."}
            </Text>
          </>
        ) : (
          <Text style={styles.headerSubtitle}>
            Votre compte est prêt. Vous pouvez maintenant revenir à la
            connexion.
          </Text>
        )}
      </View>

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
            {isLoadingOptions && step !== successStep ? (
              <View style={styles.loadingBox} testID="loading-options">
                <ActivityIndicator size="small" color={BLUE} />
                <Text style={styles.loadingText}>Chargement des options…</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox} testID="error-message">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <View style={styles.form} testID="step-1">
                {isTokenFlow ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>
                        Adresse email optionnelle
                      </Text>
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
                              clearErrors();
                              field.onChange(value);
                            }}
                            placeholder="nom@etablissement.cm"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={[
                              styles.input,
                              fieldState.error && styles.inputError,
                            ]}
                            placeholderTextColor="#9B9490"
                          />
                        )}
                      />
                      {step1Form.formState.errors.email?.message ? (
                        <Text style={styles.fieldError} testID="error-email">
                          {step1Form.formState.errors.email.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Jeton d'activation</Text>
                      <Controller
                        control={step1Form.control}
                        name="setupToken"
                        render={({ field, fieldState }) => (
                          <TextInput
                            ref={field.ref}
                            testID="input-setup-token"
                            value={field.value}
                            onBlur={field.onBlur}
                            onChangeText={(value) => {
                              clearErrors();
                              field.onChange(value);
                            }}
                            autoCapitalize="none"
                            style={[
                              styles.input,
                              fieldState.error && styles.inputError,
                            ]}
                            placeholderTextColor="#9B9490"
                          />
                        )}
                      />
                      {step1Form.formState.errors.setupToken?.message ? (
                        <Text
                          style={styles.fieldError}
                          testID="error-setup-token"
                        >
                          {step1Form.formState.errors.setupToken.message}
                        </Text>
                      ) : null}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Adresse email</Text>
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
                              clearErrors();
                              field.onChange(value);
                            }}
                            placeholder="nom@etablissement.cm"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={[
                              styles.input,
                              fieldState.error && styles.inputError,
                            ]}
                            placeholderTextColor="#9B9490"
                          />
                        )}
                      />
                      {step1Form.formState.errors.email?.message ? (
                        <Text style={styles.fieldError} testID="error-email">
                          {step1Form.formState.errors.email.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Mot de passe provisoire</Text>
                      <Controller
                        control={step1Form.control}
                        name="temporaryPassword"
                        render={({ field, fieldState }) => (
                          <SecureTextField
                            ref={field.ref}
                            testID="input-temporary-password"
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
                      {step1Form.formState.errors.temporaryPassword?.message ? (
                        <Text
                          style={styles.fieldError}
                          testID="error-temporary-password"
                        >
                          {step1Form.formState.errors.temporaryPassword.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Nouveau mot de passe</Text>
                      <Controller
                        control={step1Form.control}
                        name="newPassword"
                        render={({ field, fieldState }) => (
                          <SecureTextField
                            ref={field.ref}
                            testID="input-new-password"
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
                      {step1Form.formState.errors.newPassword?.message ? (
                        <Text
                          style={styles.fieldError}
                          testID="error-new-password"
                        >
                          {step1Form.formState.errors.newPassword.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>
                        Confirmer le mot de passe
                      </Text>
                      <Controller
                        control={step1Form.control}
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
                      {step1Form.formState.errors.confirmPassword?.message ? (
                        <Text
                          style={styles.fieldError}
                          testID="error-confirm-password"
                        >
                          {step1Form.formState.errors.confirmPassword.message}
                        </Text>
                      ) : null}
                    </View>
                  </>
                )}

                <Pressable
                  testID="btn-step1"
                  onPress={goNextStep1}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                </Pressable>
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.form} testID="step-2">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Prénom</Text>
                  <Controller
                    control={step2Form.control}
                    name="firstName"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-first-name"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearErrors();
                          field.onChange(value);
                        }}
                        style={[
                          styles.input,
                          fieldState.error && styles.inputError,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {step2Form.formState.errors.firstName?.message ? (
                    <Text style={styles.fieldError} testID="error-firstName">
                      {step2Form.formState.errors.firstName.message}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nom</Text>
                  <Controller
                    control={step2Form.control}
                    name="lastName"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-last-name"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          clearErrors();
                          field.onChange(value);
                        }}
                        style={[
                          styles.input,
                          fieldState.error && styles.inputError,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {step2Form.formState.errors.lastName?.message ? (
                    <Text style={styles.fieldError} testID="error-lastName">
                      {step2Form.formState.errors.lastName.message}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Genre</Text>
                  <View style={styles.choiceRow}>
                    <GenderButton
                      value="F"
                      label="Femme"
                      currentValue={watchedGender}
                      onPress={(value) => {
                        clearErrors();
                        step2Form.setValue("gender", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    <GenderButton
                      value="M"
                      label="Homme"
                      currentValue={watchedGender}
                      onPress={(value) => {
                        clearErrors();
                        step2Form.setValue("gender", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                    <GenderButton
                      value="OTHER"
                      label="Autre"
                      currentValue={watchedGender}
                      onPress={(value) => {
                        clearErrors();
                        step2Form.setValue("gender", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    />
                  </View>
                  {step2Form.formState.errors.gender?.message ? (
                    <Text style={styles.fieldError} testID="error-gender">
                      {step2Form.formState.errors.gender.message}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Date de naissance</Text>
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
                          clearErrors();
                          field.onChange(formatDateInput(value));
                        }}
                        keyboardType="number-pad"
                        placeholder="JJ/MM/AAAA"
                        style={[
                          styles.input,
                          fieldState.error && styles.inputError,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {step2Form.formState.errors.birthDate?.message ? (
                    <Text style={styles.fieldError} testID="error-birthDate">
                      {step2Form.formState.errors.birthDate.message}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  testID="btn-step2"
                  onPress={goNextStep2}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                </Pressable>
              </View>
            ) : null}

            {step === 3 && isTokenFlow ? (
              <View style={styles.form} testID="step-3">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nouveau PIN</Text>
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
                          clearErrors();
                          field.onChange(value);
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholderTextColor="#9B9490"
                        variant="pin"
                        containerStyle={
                          fieldState.error ? styles.inputError : undefined
                        }
                      />
                    )}
                  />
                  {step3Form.formState.errors.newPin?.message ? (
                    <Text style={styles.fieldError} testID="error-newPin">
                      {step3Form.formState.errors.newPin.message}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirmer le PIN</Text>
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
                          clearErrors();
                          field.onChange(value);
                        }}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholderTextColor="#9B9490"
                        variant="pin"
                        containerStyle={
                          fieldState.error ? styles.inputError : undefined
                        }
                      />
                    )}
                  />
                  {step3Form.formState.errors.confirmPin?.message ? (
                    <Text style={styles.fieldError} testID="error-confirmPin">
                      {step3Form.formState.errors.confirmPin.message}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  testID="btn-step3"
                  onPress={goNextStep3}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                </Pressable>
              </View>
            ) : null}

            {((step === 3 && !isTokenFlow) || (step === 4 && isTokenFlow)) && (
              <View
                style={[
                  styles.form,
                  selectedQuestions.length === 3 && styles.formCompact,
                ]}
                testID={`step-${step}`}
              >
                <View
                  style={[
                    styles.sectionBox,
                    selectedQuestions.length === 3 && styles.sectionBoxCompact,
                  ]}
                >
                  <Text style={styles.sectionTitle}>
                    Choisissez 3 questions
                  </Text>
                  <Text style={styles.sectionHint}>
                    Sélection {selectedQuestions.length}/3
                  </Text>
                  <View style={styles.choiceWrap}>
                    {(options?.questions ?? []).map((question) => {
                      const active = selectedQuestions.includes(question.key);
                      return (
                        <Pressable
                          key={question.key}
                          testID={`question-${question.key}`}
                          onPress={() => toggleQuestion(question.key)}
                          style={[
                            styles.choiceChip,
                            selectedQuestions.length === 3 &&
                              styles.choiceChipCompact,
                            active && styles.choiceChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceChipText,
                              active && styles.choiceChipTextActive,
                              selectedQuestions.length === 3 &&
                                styles.choiceChipTextCompact,
                            ]}
                          >
                            {selectedQuestions.length === 3
                              ? getCompactQuestionLabel(question.label)
                              : question.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable
                  testID={`btn-step${step}`}
                  onPress={goNextSelection}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                </Pressable>
              </View>
            )}

            {((step === 4 && !isTokenFlow) || (step === 5 && isTokenFlow)) && (
              <View
                style={[
                  styles.form,
                  selectedQuestions.length === 3 && styles.formCompact,
                  !isParent && styles.formUltraCompact,
                ]}
                testID={`step-${step}`}
              >
                {selectedQuestions.map((questionKey, index) => {
                  const question = options?.questions.find(
                    (item) => item.key === questionKey,
                  );
                  return (
                    <View
                      key={questionKey}
                      style={[
                        styles.fieldGroup,
                        selectedQuestions.length === 3 &&
                          styles.fieldGroupCompact,
                        !isParent && styles.fieldGroupUltraCompact,
                      ]}
                    >
                      {isParent ? (
                        <Text style={styles.label}>
                          {question?.label ?? questionKey}
                        </Text>
                      ) : null}
                      <Controller
                        control={recoveryForm.control}
                        name={`answers.${questionKey}` as const}
                        render={({ field, fieldState }) => (
                          <TextInput
                            ref={field.ref}
                            testID={`input-answer-${index}`}
                            value={field.value ?? ""}
                            onBlur={field.onBlur}
                            onChangeText={(value) => {
                              clearErrors();
                              field.onChange(value);
                            }}
                            style={[
                              styles.input,
                              selectedQuestions.length === 3 &&
                                styles.inputCompact,
                              !isParent && styles.inputUltraCompact,
                              fieldState.error && styles.inputError,
                            ]}
                            placeholder={
                              !isParent ? question?.label : undefined
                            }
                            placeholderTextColor="#9B9490"
                          />
                        )}
                      />
                      {recoveryForm.formState.errors.answers?.[questionKey]
                        ?.message ? (
                        <Text
                          style={styles.fieldError}
                          testID={`error-answer-${index}`}
                        >
                          {
                            recoveryForm.formState.errors.answers?.[questionKey]
                              ?.message
                          }
                        </Text>
                      ) : null}
                    </View>
                  );
                })}

                {isParent ? (
                  <>
                    <View
                      style={[
                        styles.sectionBox,
                        selectedQuestions.length === 3 &&
                          styles.sectionBoxCompact,
                      ]}
                    >
                      <Text style={styles.sectionTitle}>
                        Classe de votre enfant
                      </Text>
                      <View
                        style={[
                          styles.optionList,
                          selectedQuestions.length === 3 &&
                            styles.optionListCompact,
                        ]}
                      >
                        {(options?.classes ?? []).map((classroom) => {
                          const active = parentClassId === classroom.id;
                          return (
                            <Pressable
                              key={classroom.id}
                              testID={`parent-class-${classroom.id}`}
                              onPress={() => {
                                clearErrors();
                                recoveryForm.setValue(
                                  "parentClassId",
                                  classroom.id,
                                  {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  },
                                );
                              }}
                              style={[
                                styles.optionCard,
                                selectedQuestions.length === 3 &&
                                  styles.optionCardCompact,
                                active && styles.optionCardActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.optionTitle,
                                  selectedQuestions.length === 3 &&
                                    styles.optionTitleCompact,
                                ]}
                              >
                                {classroom.name}
                              </Text>
                              <Text
                                style={[
                                  styles.optionSubtitle,
                                  selectedQuestions.length === 3 &&
                                    styles.optionSubtitleCompact,
                                ]}
                              >
                                {classroom.year}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {recoveryForm.formState.errors.parentClassId?.message ? (
                        <Text
                          style={styles.fieldError}
                          testID="error-parentClassId"
                        >
                          {recoveryForm.formState.errors.parentClassId.message}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.sectionBox,
                        selectedQuestions.length === 3 &&
                          styles.sectionBoxCompact,
                      ]}
                    >
                      <Text style={styles.sectionTitle}>
                        Nom de votre enfant
                      </Text>
                      <View
                        style={[
                          styles.optionList,
                          selectedQuestions.length === 3 &&
                            styles.optionListCompact,
                        ]}
                      >
                        {(options?.students ?? []).map((student) => {
                          const active = parentStudentId === student.id;
                          return (
                            <Pressable
                              key={student.id}
                              testID={`parent-student-${student.id}`}
                              onPress={() => {
                                clearErrors();
                                recoveryForm.setValue(
                                  "parentStudentId",
                                  student.id,
                                  {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  },
                                );
                              }}
                              style={[
                                styles.optionCard,
                                selectedQuestions.length === 3 &&
                                  styles.optionCardCompact,
                                active && styles.optionCardActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.optionTitle,
                                  selectedQuestions.length === 3 &&
                                    styles.optionTitleCompact,
                                ]}
                              >
                                {student.firstName} {student.lastName}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {recoveryForm.formState.errors.parentStudentId?.message ? (
                        <Text
                          style={styles.fieldError}
                          testID="error-parentStudentId"
                        >
                          {
                            recoveryForm.formState.errors.parentStudentId
                              .message
                          }
                        </Text>
                      ) : null}
                    </View>
                  </>
                ) : null}

                <Pressable
                  testID="btn-submit-onboarding"
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={[
                    styles.primaryButton,
                    selectedQuestions.length === 3 &&
                      styles.primaryButtonCompact,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Finaliser</Text>
                  )}
                </Pressable>
              </View>
            )}

            {step === successStep ? (
              <View style={styles.successCard} testID={`step-${successStep}`}>
                <Text style={styles.successTitle}>Compte configuré</Text>
                <Text style={styles.successText}>
                  Votre première connexion est terminée pour
                  {schoolSlug ? ` ${schoolSlug}` : " votre compte"}.
                </Text>
                <Pressable
                  testID="btn-go-login"
                  onPress={() => router.replace("/login")}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Se connecter</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const BLUE = "#08467D";
const BLUE_LIGHT = "#0C5FA8";
const GOLD = "#F7C260";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BLUE,
  },
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
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
  brandAccent: {
    width: 44,
    height: 3,
    borderRadius: 999,
    backgroundColor: GOLD,
    marginTop: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 20,
  },
  stepIndicator: {
    color: "#D9ECFF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: GOLD,
    borderRadius: 999,
  },
  headerSubtitle: {
    color: "#D9ECFF",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  backButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  cardOuter: {
    flex: 1,
    backgroundColor: "#FFFCF8",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 56,
    gap: 18,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F6EFE5",
  },
  loadingText: {
    color: "#6B625B",
    fontSize: 14,
    fontWeight: "600",
  },
  form: {
    gap: 18,
  },
  formCompact: {
    gap: 14,
  },
  formUltraCompact: {
    gap: 10,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldGroupCompact: {
    gap: 6,
  },
  fieldGroupUltraCompact: {
    gap: 4,
  },
  label: {
    color: "#1F2933",
    fontSize: 13,
    fontWeight: "700",
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
  inputError: {
    borderColor: "#FCA5A5",
  },
  inputCompact: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputUltraCompact: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonCompact: {
    paddingVertical: 13,
  },
  primaryButtonBusy: {
    opacity: 0.8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  errorBox: {
    backgroundColor: "#FCE8E8",
    borderWidth: 1,
    borderColor: "#F4B8B8",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: "#A42323",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  fieldError: {
    color: "#A42323",
    fontSize: 13,
    fontWeight: "600",
  },
  choiceRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#D8CABB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  choiceChipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceChipActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  choiceChipText: {
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "700",
  },
  choiceChipTextCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  choiceChipTextActive: {
    color: "#FFFFFF",
  },
  sectionBox: {
    gap: 12,
    backgroundColor: "#F8F1E8",
    borderRadius: 18,
    padding: 16,
  },
  sectionBoxCompact: {
    gap: 10,
    paddingVertical: 14,
  },
  sectionTitle: {
    color: "#1F2933",
    fontSize: 15,
    fontWeight: "800",
  },
  sectionHint: {
    color: "#6B625B",
    fontSize: 13,
    fontWeight: "600",
  },
  optionList: {
    gap: 10,
  },
  optionListCompact: {
    gap: 8,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2D6CA",
    borderRadius: 14,
    padding: 14,
  },
  optionCardCompact: {
    padding: 12,
  },
  optionCardActive: {
    borderColor: BLUE_LIGHT,
    backgroundColor: "#EAF3FB",
  },
  optionTitle: {
    color: "#1F2933",
    fontSize: 14,
    fontWeight: "700",
  },
  optionTitleCompact: {
    fontSize: 13,
  },
  optionSubtitle: {
    color: "#6B625B",
    fontSize: 12,
    marginTop: 4,
  },
  optionSubtitleCompact: {
    marginTop: 2,
    fontSize: 11,
  },
  successCard: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    paddingVertical: 24,
  },
  successTitle: {
    color: "#1F2933",
    fontSize: 24,
    fontWeight: "800",
  },
  successText: {
    color: "#4B5563",
    fontSize: 15,
    lineHeight: 22,
  },
});
