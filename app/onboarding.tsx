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
import { DEFAULT_LOCALE } from "../src/i18n/translations";
import {
  translate,
  useTranslation,
  type TranslateFn,
} from "../src/i18n/useTranslation";
import { formatDateInput, parseDateToISO } from "./recovery/pin";

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PHONE_PIN_REGEX = /^\d{6}$/;

const defaultT: TranslateFn = (key) => translate(DEFAULT_LOCALE, key);

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type Step1FormValues = {
  email: string;
  temporaryPassword: string;
  newPassword: string;
  confirmPassword: string;
  setupToken: string;
  username: string;
};
type Step2FormValues = z.infer<typeof onboardingProfileStepSchema>;
type Step3FormValues = z.infer<typeof onboardingPinStepSchema>;
type RecoveryFormValues = z.infer<typeof onboardingRecoveryStepSchema>;

export function buildUsernameOnboardingStep1Schema(t: TranslateFn) {
  return z
    .object({
      username: z
        .string()
        .trim()
        .min(1, t("onboarding.errors.usernameRequired")),
      temporaryPassword: z
        .string()
        .trim()
        .min(1, t("onboarding.errors.temporaryPasswordRequired")),
      newPassword: z
        .string()
        .min(8, t("recovery.password.errors.passwordTooShort"))
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
          t("recovery.password.errors.passwordComplexity"),
        ),
      confirmPassword: z
        .string()
        .min(1, t("recovery.password.errors.confirmRequired")),
    })
    .superRefine((value, ctx) => {
      if (value.newPassword !== value.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("recovery.password.errors.confirmMismatch"),
        });
      }
    });
}

export const usernameOnboardingStep1Schema =
  buildUsernameOnboardingStep1Schema(defaultT);

export function buildEmailOnboardingStep1Schema(t: TranslateFn) {
  return z
    .object({
      email: z
        .string()
        .trim()
        .email(t("recovery.password.errors.emailInvalid")),
      temporaryPassword: z
        .string()
        .trim()
        .min(8, t("onboarding.errors.temporaryPasswordRequired")),
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
    .superRefine((value, ctx) => {
      if (value.newPassword !== value.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("recovery.password.errors.confirmMismatch"),
        });
      }
    });
}

export const emailOnboardingStep1Schema =
  buildEmailOnboardingStep1Schema(defaultT);

export function buildPhoneOnboardingStep1Schema(t: TranslateFn) {
  return z.object({
    email: z
      .string()
      .trim()
      .refine(
        (value) =>
          value.length === 0 ||
          z
            .string()
            .email(t("recovery.password.errors.emailInvalid"))
            .safeParse(value).success,
        t("recovery.password.errors.emailInvalid"),
      ),
    setupToken: z
      .string()
      .trim()
      .min(1, t("onboarding.errors.setupTokenRequired")),
  });
}

export const phoneOnboardingStep1Schema =
  buildPhoneOnboardingStep1Schema(defaultT);

export function buildOnboardingProfileStepSchema(t: TranslateFn) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(1, t("onboarding.errors.firstNameRequired")),
    lastName: z.string().trim().min(1, t("onboarding.errors.lastNameRequired")),
    gender: z.enum(["M", "F", "OTHER"], {
      message: t("onboarding.errors.genderRequired"),
    }),
    birthDate: z
      .string()
      .min(1, t("recovery.common.errors.birthDateRequired"))
      .refine((value) => /^\d{2}\/\d{2}\/\d{4}$/.test(value), {
        message: t("recovery.common.errors.birthDateFormat"),
      })
      .refine((value) => parseDateToISO(value) !== null, {
        message: t("recovery.common.errors.birthDateInvalid"),
      })
      .refine((value) => {
        const isoDate = parseDateToISO(value);
        if (!isoDate) {
          return false;
        }
        return new Date(`${isoDate}T23:59:59.999Z`) <= new Date();
      }, t("onboarding.errors.birthDateFuture")),
  });
}

export const onboardingProfileStepSchema =
  buildOnboardingProfileStepSchema(defaultT);

export function buildOnboardingPinStepSchema(t: TranslateFn) {
  return z
    .object({
      newPin: z
        .string()
        .trim()
        .regex(PHONE_PIN_REGEX, t("onboarding.errors.pinFormat")),
      confirmPin: z
        .string()
        .trim()
        .min(1, t("onboarding.errors.confirmPinRequired")),
    })
    .superRefine((value, ctx) => {
      if (value.newPin !== value.confirmPin) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPin"],
          message: t("onboarding.errors.confirmPinMismatch"),
        });
      }
    });
}

export const onboardingPinStepSchema = buildOnboardingPinStepSchema(defaultT);

export function buildOnboardingRecoveryStepSchema(t: TranslateFn) {
  return z
    .object({
      selectedQuestions: z
        .array(z.string())
        .length(3, t("onboarding.errors.questionsCount"))
        .refine((items) => new Set(items).size === 3, {
          message: t("onboarding.errors.questionsUnique"),
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
            message: t("recovery.username.errors.answerTooShort"),
          });
        }
      });

      if (value.isParent && !value.parentClassId) {
        ctx.addIssue({
          code: "custom",
          path: ["parentClassId"],
          message: t("onboarding.errors.parentClassRequired"),
        });
      }

      if (value.isParent && !value.parentStudentId) {
        ctx.addIssue({
          code: "custom",
          path: ["parentStudentId"],
          message: t("onboarding.errors.parentStudentRequired"),
        });
      }
    });
}

export const onboardingRecoveryStepSchema =
  buildOnboardingRecoveryStepSchema(defaultT);

export function buildOnboardingRecoverySelectionStepSchema(t: TranslateFn) {
  return z.object({
    selectedQuestions: z
      .array(z.string())
      .length(3, t("onboarding.errors.questionsCount"))
      .refine((items) => new Set(items).size === 3, {
        message: t("onboarding.errors.questionsUnique"),
      }),
  });
}

export const onboardingRecoverySelectionStepSchema =
  buildOnboardingRecoverySelectionStepSchema(defaultT);

export function buildOnboardingRecoveryRows(
  selectedQuestions: string[],
  answers: Record<string, string>,
) {
  return selectedQuestions.map((questionKey) => ({
    questionKey,
    answer: answers[questionKey] ?? "",
  }));
}

export function parseOnboardingApiError(
  err: unknown,
  t: TranslateFn = defaultT,
): string {
  const apiErr = err as ApiClientError;
  switch (apiErr?.code) {
    case "INVALID_CREDENTIALS":
      return t("onboarding.errors.invalidCredentials");
    case "PROFILE_SETUP_REQUIRED":
      return t("onboarding.errors.profileSetupRequired");
    default:
      if (
        typeof apiErr?.message === "string" &&
        apiErr.message !== "Request failed"
      ) {
        return apiErr.message;
      }
      if (apiErr?.statusCode === 401) {
        return t("onboarding.errors.invalidCredentials");
      }
      if (apiErr?.statusCode === 400 || apiErr?.statusCode === 403) {
        return t("onboarding.errors.activationFailed");
      }
      return t("apiErrors.generic");
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
    username?: string | string[];
  }>();

  const initialEmail = getTextParam(params.email).trim();
  const initialSetupToken = getTextParam(params.setupToken).trim();
  const schoolSlug = getTextParam(params.schoolSlug).trim();
  const initialUsername = getTextParam(params.username).trim();
  const isUsernameFlow = initialUsername.length > 0;
  const isTokenFlow = !isUsernameFlow && initialSetupToken.length > 0;
  // username flow: steps 1, 2, 3, 4 (same as email, but step 1 uses username)
  const totalSteps = isTokenFlow ? 5 : 4;
  const successStep = (totalSteps + 1) as Step;

  const [step, setStep] = useState<Step>(1);
  const [options, setOptions] = useState<OnboardingOptionsResponse | null>(
    null,
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { locale, t } = useTranslation();

  const isParent = useMemo(
    () => (options?.schoolRoles ?? []).includes("PARENT"),
    [options?.schoolRoles],
  );

  const usernameStep1Schema = useMemo(
    () => buildUsernameOnboardingStep1Schema(t),
    [locale],
  );
  const emailStep1Schema = useMemo(
    () => buildEmailOnboardingStep1Schema(t),
    [locale],
  );
  const phoneStep1Schema = useMemo(
    () => buildPhoneOnboardingStep1Schema(t),
    [locale],
  );
  const profileStepSchema = useMemo(
    () => buildOnboardingProfileStepSchema(t),
    [locale],
  );
  const pinStepSchema = useMemo(
    () => buildOnboardingPinStepSchema(t),
    [locale],
  );
  const recoveryStepSchema = useMemo(
    () => buildOnboardingRecoveryStepSchema(t),
    [locale],
  );
  const recoverySelectionStepSchema = useMemo(
    () => buildOnboardingRecoverySelectionStepSchema(t),
    [locale],
  );

  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(
      isUsernameFlow
        ? usernameStep1Schema
        : isTokenFlow
          ? phoneStep1Schema
          : emailStep1Schema,
    ) as never,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: initialEmail,
      temporaryPassword: "",
      newPassword: "",
      confirmPassword: "",
      setupToken: initialSetupToken,
      username: initialUsername,
    },
  });

  const step2Form = useForm<Step2FormValues>({
    resolver: zodResolver(profileStepSchema),
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
    resolver: zodResolver(pinStepSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      newPin: "",
      confirmPin: "",
    },
  });

  const recoveryForm = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoveryStepSchema),
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
  const watchedUsername = step1Form.watch("username");
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
      username: initialUsername,
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
  }, [initialEmail, initialSetupToken, initialUsername]);

  useEffect(() => {
    const normalizedUsername = watchedUsername?.trim() ?? "";
    if (!watchedEmail && !watchedSetupToken && !normalizedUsername) {
      setError(t("onboarding.errors.invalidActivationLink"));
      return;
    }

    let active = true;
    async function loadOptions() {
      setIsLoadingOptions(true);
      setError(null);
      try {
        const response = await authApi.getOnboardingOptions({
          ...(watchedEmail ? { email: watchedEmail } : {}),
          ...(normalizedUsername ? { username: normalizedUsername } : {}),
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
        setError(parseOnboardingApiError(err, t));
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
  }, [watchedEmail, watchedSetupToken, watchedUsername]);

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
    const result = recoverySelectionStepSchema.safeParse({
      selectedQuestions,
    });
    if (!result.success) {
      const message =
        result.error.issues[0]?.message ??
        t("onboarding.errors.questionsCount");
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
      setError(t("onboarding.errors.questionsCount"));
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
        message: t("recovery.common.errors.birthDateInvalid"),
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

      if (isUsernameFlow) {
        // Username flow: first change password, then complete onboarding profile+recovery
        await authApi.firstPasswordChangeByUsername(
          step1Values.username.trim(),
          step1Values.temporaryPassword,
          step1Values.newPassword,
        );
        await authApi.completeOnboarding({
          username: step1Values.username.trim(),
          email: step1Values.email.trim() || undefined,
          temporaryPassword: step1Values.temporaryPassword,
          newPassword: step1Values.newPassword,
          firstName: step2Values.firstName.trim(),
          lastName: step2Values.lastName.trim(),
          gender: step2Values.gender as Gender,
          birthDate: isoBirthDate,
          answers: buildOnboardingRecoveryRows(
            values.selectedQuestions,
            values.answers,
          ),
        });
      } else {
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
      }
      setStep(successStep);
    } catch (err) {
      setError(parseOnboardingApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  const progressWidth =
    `${((Math.min(step, totalSteps) / totalSteps) * 100).toFixed(0)}%` as `${number}%`;
  const title =
    step === successStep ? t("onboarding.titleSuccess") : t("onboarding.title");

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
              {step === successStep
                ? t("recovery.common.loginButton")
                : t("recovery.common.back")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.brandAccent} />
        <Text style={styles.headerTitle}>{title}</Text>
        {step !== successStep ? (
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
                  { width: progressWidth as `${number}%` },
                ]}
              />
            </View>
            <Text style={styles.headerSubtitle}>
              {isTokenFlow
                ? t("onboarding.subtitle.tokenFlow")
                : t("onboarding.subtitle.passwordFlow")}
            </Text>
          </>
        ) : (
          <Text style={styles.headerSubtitle}>
            {t("onboarding.subtitle.success")}
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
                <Text style={styles.loadingText}>
                  {t("onboarding.loadingOptions")}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox} testID="error-message">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <View style={styles.form} testID="step-1">
                {isUsernameFlow ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>
                        {t("onboarding.step1.username.label")}
                      </Text>
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
                            editable={false}
                            style={[
                              styles.input,
                              styles.inputReadonly,
                              fieldState.error && styles.inputError,
                            ]}
                            placeholderTextColor="#9B9490"
                          />
                        )}
                      />
                      {step1Form.formState.errors.username?.message ? (
                        <Text style={styles.fieldError} testID="error-username">
                          {step1Form.formState.errors.username.message}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>
                        {t("onboarding.step1.temporaryPassword.label")}
                      </Text>
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
                      <Text style={styles.label}>
                        {t("recovery.password.fields.newPassword")}
                      </Text>
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
                        {t("recovery.password.fields.confirmPassword")}
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
                ) : isTokenFlow ? (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>
                        {t("onboarding.step1.emailOptional.label")}
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
                            placeholder={t("login.placeholders.email")}
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
                      <Text style={styles.label}>
                        {t("onboarding.step1.setupToken.label")}
                      </Text>
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
                      <Text style={styles.label}>
                        {t("onboarding.step1.email.label")}
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
                            placeholder={t("login.placeholders.email")}
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
                      <Text style={styles.label}>
                        {t("onboarding.step1.temporaryPassword.label")}
                      </Text>
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
                      <Text style={styles.label}>
                        {t("recovery.password.fields.newPassword")}
                      </Text>
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
                        {t("recovery.password.fields.confirmPassword")}
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
                  <Text style={styles.primaryButtonText}>
                    {t("recovery.username.continueButton")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.form} testID="step-2">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    {t("onboarding.step2.firstName.label")}
                  </Text>
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
                  <Text style={styles.label}>
                    {t("onboarding.step2.lastName.label")}
                  </Text>
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
                  <Text style={styles.label}>
                    {t("onboarding.step2.gender.label")}
                  </Text>
                  <View style={styles.choiceRow}>
                    <GenderButton
                      value="F"
                      label={t("onboarding.step2.gender.female")}
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
                      label={t("onboarding.step2.gender.male")}
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
                      label={t("onboarding.step2.gender.other")}
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
                  <Text style={styles.label}>
                    {t("recovery.common.birthDateLabel")}
                  </Text>
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
                        placeholder={t("recovery.common.birthDatePlaceholder")}
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
                  <Text style={styles.primaryButtonText}>
                    {t("recovery.username.continueButton")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {step === 3 && isTokenFlow ? (
              <View style={styles.form} testID="step-3">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    {t("onboarding.step3.newPin.label")}
                  </Text>
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
                  <Text style={styles.label}>
                    {t("onboarding.step3.confirmPin.label")}
                  </Text>
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
                  <Text style={styles.primaryButtonText}>
                    {t("recovery.username.continueButton")}
                  </Text>
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
                    {t("onboarding.recoverySelection.title")}
                  </Text>
                  <Text style={styles.sectionHint}>
                    {t("onboarding.recoverySelection.hint").replace(
                      "{selected}",
                      String(selectedQuestions.length),
                    )}
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
                  <Text style={styles.primaryButtonText}>
                    {t("recovery.username.continueButton")}
                  </Text>
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
                        {t("onboarding.recoveryAnswers.classTitle")}
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
                        {t("onboarding.recoveryAnswers.studentTitle")}
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
                      {recoveryForm.formState.errors.parentStudentId
                        ?.message ? (
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
                    <Text style={styles.primaryButtonText}>
                      {t("onboarding.submitButton")}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {step === successStep ? (
              <View style={styles.successCard} testID={`step-${successStep}`}>
                <Text style={styles.successTitle}>
                  {t("onboarding.success.title")}
                </Text>
                <Text style={styles.successText}>
                  {t("onboarding.success.textPrefix")}
                  {schoolSlug
                    ? ` ${schoolSlug}`
                    : ` ${t("onboarding.success.defaultAccount")}`}
                  .
                </Text>
                <Pressable
                  testID="btn-go-login"
                  onPress={() => router.replace("/login")}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    {t("recovery.common.loginButton")}
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
  inputReadonly: {
    backgroundColor: "#F5F0EB",
    color: "#7A6F65",
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
