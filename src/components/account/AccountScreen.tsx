import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { accountApi } from "../../api/account.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { AppShell } from "../navigation/AppShell";
import { useHeaderScroll } from "../navigation/header-scroll-context";
import { SecureTextField } from "../SecureTextField";
import { DatePickerField } from "../DatePickerField";
import { colors } from "../../theme";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PillSelector,
  SectionCard,
  TextField,
} from "../timetable/TimetableCommon";
import {
  accountAddEmailSchema,
  accountAddPhoneCredentialSchema,
  accountChangeEmailSchema,
  accountChangePasswordSchema,
  accountChangePinSchema,
  accountCreatePasswordSchema,
  accountPersonalProfileSchema,
  accountRecoverySchema,
  normalizePhoneInput,
  toLocalPhoneDisplay,
} from "./account.schemas";
import type {
  AccountGender,
  AccountLocale,
  AccountProfileResponse,
  AccountRecoveryOptionsResponse,
} from "../../types/account.types";
import type { AppRole, PlatformRole, SchoolRole } from "../../types/auth.types";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useAuthStore } from "../../store/auth.store";
import { useTranslation } from "../../i18n/useTranslation";
import { SUPPORTED_LOCALES, type Locale } from "../../i18n/translations";
import type { ApiClientError } from "../../api/client";

type AccountTab = "personal" | "security" | "help" | "settings";
type SecuritySection =
  | "password"
  | "create-password"
  | "pin"
  | "add-phone"
  | "recovery"
  | null;

type PersonalValues = z.infer<typeof accountPersonalProfileSchema>;
type PasswordValues = z.infer<typeof accountChangePasswordSchema>;
type CreatePasswordValues = z.infer<typeof accountCreatePasswordSchema>;
type PinValues = z.infer<typeof accountChangePinSchema>;
type AddPhoneValues = z.infer<typeof accountAddPhoneCredentialSchema>;
type AddEmailValues = z.infer<typeof accountAddEmailSchema>;
type ChangeEmailValues = z.infer<typeof accountChangeEmailSchema>;
type RecoveryValues = z.infer<typeof accountRecoverySchema>;

const TAB_ITEMS: Array<{ key: AccountTab; label: string }> = [
  { key: "personal", label: "Informations" },
  { key: "security", label: "Sécurité" },
  { key: "help", label: "Aide" },
  { key: "settings", label: "Paramètres" },
];

const GENDER_OPTIONS: Array<{ value: AccountGender; label: string }> = [
  { value: "M", label: "Homme" },
  { value: "F", label: "Femme" },
  { value: "OTHER", label: "Autre" },
];

const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  SALES: "Commercial",
  SUPPORT: "Support",
};

const SCHOOL_ROLE_LABELS: Record<SchoolRole, string> = {
  SCHOOL_ADMIN: "Administrateur école",
  SCHOOL_MANAGER: "Directeur",
  SUPERVISOR: "Superviseur",
  SCHOOL_ACCOUNTANT: "Comptable",
  SCHOOL_STAFF: "Personnel",
  TEACHER: "Enseignant(e)",
  PARENT: "Parent",
  STUDENT: "Élève",
};

const ROLE_LABELS: Record<string, string> = {
  ...PLATFORM_ROLE_LABELS,
  ...SCHOOL_ROLE_LABELS,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

function toReadableRole(role: string | null | undefined) {
  if (!role) return "Utilisateur";
  return ROLE_LABELS[role] ?? role;
}

function extractAvailableRoles(
  profile: AccountProfileResponse | null,
): AppRole[] {
  if (!profile) return [];
  const roles = new Set<AppRole>();
  for (const role of profile.platformRoles ?? []) roles.add(role);
  for (const membership of profile.memberships ?? [])
    roles.add(membership.role);
  if (profile.role) roles.add(profile.role);
  if (profile.activeRole) roles.add(profile.activeRole);
  return Array.from(roles);
}


function fieldErr(
  fieldState: {
    error?: { message?: string };
    isDirty: boolean;
    isTouched: boolean;
  },
  submitCount: number,
): string | null {
  if (
    fieldState.error &&
    (fieldState.isDirty || fieldState.isTouched || submitCount > 0)
  ) {
    return fieldState.error.message ?? null;
  }
  return null;
}

function ActionButton(props: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  stretch?: boolean;
  testID?: string;
}) {
  const variant = props.variant ?? "primary";
  const disabled = props.disabled || props.loading;

  return (
    <Pressable
      onPress={props.onPress}
      disabled={disabled}
      testID={props.testID}
      style={({ pressed }) => [
        styles.actionButton,
        props.stretch && styles.actionButtonStretch,
        variant === "primary"
          ? styles.actionButtonPrimary
          : styles.actionButtonSecondary,
        disabled && styles.actionButtonDisabled,
        pressed && !disabled && styles.actionButtonPressed,
      ]}
    >
      {props.loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? colors.white : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.actionButtonText,
            variant === "primary"
              ? styles.actionButtonTextPrimary
              : styles.actionButtonTextSecondary,
          ]}
        >
          {props.label}
        </Text>
      )}
    </Pressable>
  );
}

function TabButton(props: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={[styles.tabButton, props.active && styles.tabButtonActive]}
      testID={props.testID}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabLabel, props.active && styles.tabLabelActive]}>
        {props.label}
      </Text>
    </TouchableOpacity>
  );
}

function TopTabs(props: {
  tab: AccountTab;
  onChange: (tab: AccountTab) => void;
}) {
  return (
    <View style={styles.topTabsWrap} testID="account-top-tabs">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topTabsInner}
      >
        {TAB_ITEMS.map((item) => (
          <TabButton
            key={item.key}
            active={props.tab === item.key}
            label={item.label}
            onPress={() => props.onChange(item.key)}
            testID={`account-tab-${item.key}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function PersonalFormEdit({
  profile,
  onSuccess,
  onCancel,
}: {
  profile: AccountProfileResponse;
  onSuccess: (updated: AccountProfileResponse) => void;
  onCancel: () => void;
}) {
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<PersonalValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(accountPersonalProfileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender ?? "M",
      phone: toLocalPhoneDisplay(profile.phone),
    },
  });

  const { isSubmitting, submitCount } = formState;

  async function onValid(data: PersonalValues) {
    try {
      const response = await accountApi.updateProfile(data);
      showSuccess({
        title: "Profil mis à jour",
        message: "Vos informations personnelles ont été enregistrées.",
      });
      onSuccess(response);
    } catch (error) {
      showError({
        title: "Mise à jour impossible",
        message: getErrorMessage(
          error,
          "Les informations personnelles n'ont pas pu être enregistrées.",
        ),
      });
    }
  }

  function onInvalid(errors: Partial<Record<keyof PersonalValues, unknown>>) {
    if (errors.firstName) {
      firstNameRef.current?.focus();
      return;
    }
    if (errors.lastName) {
      lastNameRef.current?.focus();
      return;
    }
    if (errors.phone) {
      phoneRef.current?.focus();
    }
  }

  return (
    <View style={styles.formStack}>
      <Controller
        control={control}
        name="firstName"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <TextField
                ref={firstNameRef}
                label="Prénom"
                value={field.value}
                onChangeText={field.onChange}
                hasError={!!err}
                testID="account-first-name-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <TextField
                ref={lastNameRef}
                label="Nom"
                value={field.value}
                onChangeText={field.onChange}
                hasError={!!err}
                testID="account-last-name-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <PillSelector
            label="Genre"
            value={field.value}
            options={GENDER_OPTIONS}
            onChange={(value) => field.onChange(value as AccountGender)}
            testIDPrefix="account-gender"
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <TextField
                ref={phoneRef}
                label="Téléphone"
                value={field.value}
                onChangeText={(value) =>
                  field.onChange(normalizePhoneInput(value))
                }
                keyboardType="numeric"
                hasError={!!err}
                testID="account-phone-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <View style={styles.actionsRow}>
        <ActionButton
          label="Annuler"
          variant="secondary"
          onPress={onCancel}
          testID="account-cancel-personal"
        />
        <ActionButton
          label="Enregistrer"
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          loading={isSubmitting}
          testID="account-save-personal"
        />
      </View>
    </View>
  );
}

function AddEmailSection({ onSuccess }: { onSuccess: () => void }) {
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const { control, handleSubmit, formState, reset } = useForm<AddEmailValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(accountAddEmailSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting, submitCount } = formState;

  async function onValid(data: AddEmailValues) {
    try {
      await accountApi.addEmail({ email: data.email });
      reset();
      showSuccess({
        title: "Email envoyé",
        message:
          "Un lien de vérification a été envoyé. Vérifiez votre boite mail.",
      });
      onSuccess();
    } catch (error) {
      showError({
        title: "Ajout impossible",
        message: getErrorMessage(
          error,
          "L'adresse email n'a pas pu être ajoutée.",
        ),
      });
    }
  }

  return (
    <View style={styles.addEmailBlock}>
      <Text style={styles.infoLabel}>EMAIL</Text>
      <Text style={styles.infoValueSecondary}>Non renseigné</Text>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.textAreaInput, err ? styles.inputError : null]}
                testID="account-add-email-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <ActionButton
        label="Ajouter l'email"
        onPress={() => {
          void handleSubmit(onValid)();
        }}
        loading={isSubmitting}
        testID="account-submit-add-email"
      />
    </View>
  );
}

function ChangeEmailSection({
  currentEmail,
  onSuccess,
}: {
  currentEmail: string;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const [open, setOpen] = React.useState(false);

  const { control, handleSubmit, formState, reset } =
    useForm<ChangeEmailValues>({
      mode: "onChange",
      reValidateMode: "onChange",
      resolver: zodResolver(accountChangeEmailSchema),
      defaultValues: { email: "" },
    });

  const { isSubmitting, submitCount } = formState;

  async function onValid(data: ChangeEmailValues) {
    try {
      await accountApi.requestEmailChange({ email: data.email });
      reset();
      setOpen(false);
      showSuccess({
        title: t("account.email.changeTitle"),
        message: t("account.email.successMessage"),
      });
      onSuccess();
    } catch (error) {
      showError({
        title: t("account.email.changeTitle"),
        message: getErrorMessage(error, t("account.email.errors.sendFailed")),
      });
    }
  }

  return (
    <View style={styles.addEmailBlock}>
      <Text style={styles.infoLabel}>
        {t("account.email.current").toUpperCase()}
      </Text>
      <Text style={styles.infoValue} testID="account-current-email">
        {currentEmail}
      </Text>
      {!open ? (
        <TouchableOpacity
          onPress={() => setOpen(true)}
          testID="account-change-email-button"
        >
          <Text
            style={[
              styles.infoLabel,
              { color: colors.primary, textDecorationLine: "underline" },
            ]}
          >
            {t("account.email.changeButton")}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => {
              const err = fieldErr(fieldState, submitCount);
              return (
                <>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={t("account.email.newPlaceholder")}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.textAreaInput,
                      err ? styles.inputError : null,
                    ]}
                    testID="account-change-email-input"
                  />
                  {err ? <Text style={styles.fieldError}>{err}</Text> : null}
                </>
              );
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <ActionButton
              label={
                isSubmitting
                  ? t("account.email.sending")
                  : t("account.email.sendLink")
              }
              onPress={() => {
                void handleSubmit(onValid)();
              }}
              loading={isSubmitting}
              testID="account-submit-change-email"
            />
            <ActionButton
              label={t("account.email.cancel")}
              onPress={() => {
                setOpen(false);
                reset();
              }}
              testID="account-cancel-change-email"
            />
          </View>
        </>
      )}
    </View>
  );
}

function ChangePasswordForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const currentPasswordRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState, setError } =
    useForm<PasswordValues>({
      mode: "onChange",
      reValidateMode: "onChange",
      resolver: zodResolver(accountChangePasswordSchema),
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      },
    });

  const { isSubmitting, submitCount } = formState;

  async function onValid(data: PasswordValues) {
    try {
      await accountApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showSuccess({
        title: "Mot de passe modifié",
        message: "Votre mot de passe a été mis à jour avec succès.",
      });
      onSuccess();
    } catch (error) {
      const apiError = error as ApiClientError;
      const message = getErrorMessage(
        error,
        "Le mot de passe n'a pas pu être modifié.",
      );
      if (apiError.statusCode === 400) {
        setError("currentPassword", { message });
      }
      showError({ title: "Modification impossible", message });
    }
  }

  function onInvalid(errors: Partial<Record<keyof PasswordValues, unknown>>) {
    if (errors.currentPassword) {
      currentPasswordRef.current?.focus();
      return;
    }
    if (errors.newPassword) {
      newPasswordRef.current?.focus();
      return;
    }
    if (errors.confirmNewPassword) {
      confirmPasswordRef.current?.focus();
    }
  }

  return (
    <View style={styles.formStack}>
      <Controller
        control={control}
        name="currentPassword"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Mot de passe actuel" />
              <SecureTextField
                ref={currentPasswordRef}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Mot de passe actuel"
                hasError={!!err}
                testID="account-current-password-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Nouveau mot de passe" />
              <SecureTextField
                ref={newPasswordRef}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Nouveau mot de passe"
                hasError={!!err}
                testID="account-new-password-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="confirmNewPassword"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Confirmation" />
              <SecureTextField
                ref={confirmPasswordRef}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Confirmez le nouveau mot de passe"
                hasError={!!err}
                testID="account-confirm-password-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <View style={styles.actionsRowSplit}>
        <ActionButton
          label="Annuler"
          variant="secondary"
          onPress={onCancel}
          stretch
          testID="account-cancel-password"
        />
        <ActionButton
          label="Modifier"
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          loading={isSubmitting}
          stretch
          testID="account-save-password"
        />
      </View>
    </View>
  );
}

function CreatePasswordForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<CreatePasswordValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(accountCreatePasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const { isSubmitting, submitCount } = formState;

  async function onValid(data: CreatePasswordValues) {
    try {
      await accountApi.createPassword({ newPassword: data.newPassword });
      showSuccess({
        title: "Mot de passe créé",
        message: "Votre mot de passe a été configuré avec succès.",
      });
      onSuccess();
    } catch (error) {
      showError({
        title: "Création impossible",
        message: getErrorMessage(
          error,
          "Le mot de passe n'a pas pu être créé.",
        ),
      });
    }
  }

  function onInvalid(
    errors: Partial<Record<keyof CreatePasswordValues, unknown>>,
  ) {
    if (errors.newPassword) {
      newPasswordRef.current?.focus();
      return;
    }
    if (errors.confirmNewPassword) {
      confirmPasswordRef.current?.focus();
    }
  }

  return (
    <View style={styles.formStack}>
      <Text style={styles.securityIntroText}>
        Votre compte n&apos;a pas encore de mot de passe. Définissez-en un pour
        vous connecter avec votre email.
      </Text>
      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Nouveau mot de passe" />
              <SecureTextField
                ref={newPasswordRef}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Nouveau mot de passe"
                hasError={!!err}
                testID="account-create-password-new-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="confirmNewPassword"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Confirmation" />
              <SecureTextField
                ref={confirmPasswordRef}
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Confirmez le mot de passe"
                hasError={!!err}
                testID="account-create-password-confirm-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <View style={styles.actionsRowSplit}>
        <ActionButton
          label="Annuler"
          variant="secondary"
          onPress={onCancel}
          stretch
          testID="account-cancel-create-password"
        />
        <ActionButton
          label="Créer"
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          loading={isSubmitting}
          stretch
          testID="account-save-create-password"
        />
      </View>
    </View>
  );
}

function ChangePinForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const currentPinRef = useRef<TextInput>(null);
  const newPinRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState, setError } = useForm<PinValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(accountChangePinSchema),
    defaultValues: { currentPin: "", newPin: "", confirmNewPin: "" },
  });

  const { isSubmitting, submitCount } = formState;

  async function onValid(data: PinValues) {
    try {
      await accountApi.changePin({
        currentPin: data.currentPin,
        newPin: data.newPin,
      });
      showSuccess({
        title: "PIN modifié",
        message: "Votre code PIN a été mis à jour avec succès.",
      });
      onSuccess();
    } catch (error) {
      const apiError = error as ApiClientError;
      const message = getErrorMessage(
        error,
        "Le code PIN n'a pas pu être modifié.",
      );
      if (apiError.statusCode === 400) {
        setError("currentPin", { message });
      }
      showError({ title: "Modification impossible", message });
    }
  }

  function onInvalid(errors: Partial<Record<keyof PinValues, unknown>>) {
    if (errors.currentPin) {
      currentPinRef.current?.focus();
      return;
    }
    if (errors.newPin) {
      newPinRef.current?.focus();
      return;
    }
    if (errors.confirmNewPin) {
      confirmPinRef.current?.focus();
    }
  }

  return (
    <View style={styles.formStack}>
      <Controller
        control={control}
        name="currentPin"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="PIN actuel" />
              <SecureTextField
                ref={currentPinRef}
                variant="pin"
                keyboardType="numeric"
                value={field.value}
                onChangeText={(value) =>
                  field.onChange(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="PIN actuel"
                hasError={!!err}
                testID="account-current-pin-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="newPin"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Nouveau PIN" />
              <SecureTextField
                ref={newPinRef}
                variant="pin"
                keyboardType="numeric"
                value={field.value}
                onChangeText={(value) =>
                  field.onChange(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Nouveau PIN"
                hasError={!!err}
                testID="account-new-pin-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="confirmNewPin"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Confirmation" />
              <SecureTextField
                ref={confirmPinRef}
                variant="pin"
                keyboardType="numeric"
                value={field.value}
                onChangeText={(value) =>
                  field.onChange(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Confirmez le nouveau PIN"
                hasError={!!err}
                testID="account-confirm-pin-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <View style={styles.actionsRowSplit}>
        <ActionButton
          label="Annuler"
          variant="secondary"
          onPress={onCancel}
          stretch
          testID="account-cancel-pin"
        />
        <ActionButton
          label="Modifier"
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          loading={isSubmitting}
          stretch
          testID="account-save-pin"
        />
      </View>
    </View>
  );
}

function AddPhoneForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const phoneRef = useRef<TextInput>(null);
  const pinRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<AddPhoneValues>({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(accountAddPhoneCredentialSchema),
    defaultValues: { phone: "", pin: "", confirmPin: "" },
  });

  const { isSubmitting, submitCount } = formState;

  async function onValid(data: AddPhoneValues) {
    try {
      await accountApi.addPhoneCredential({ phone: data.phone, pin: data.pin });
      showSuccess({
        title: "Téléphone configuré",
        message: "Votre numéro et PIN ont été ajoutés avec succès.",
      });
      onSuccess();
    } catch (error) {
      showError({
        title: "Configuration impossible",
        message: getErrorMessage(
          error,
          "Le téléphone n'a pas pu être configuré.",
        ),
      });
    }
  }

  function onInvalid(errors: Partial<Record<keyof AddPhoneValues, unknown>>) {
    if (errors.phone) {
      phoneRef.current?.focus();
      return;
    }
    if (errors.pin) {
      pinRef.current?.focus();
      return;
    }
    if (errors.confirmPin) {
      confirmPinRef.current?.focus();
    }
  }

  return (
    <View style={styles.formStack}>
      <Text style={styles.securityIntroText}>
        Ajoutez un numéro de téléphone et un code PIN pour vous connecter depuis
        l&apos;application mobile.
      </Text>
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Téléphone (9 chiffres)" />
              <TextInput
                ref={phoneRef}
                value={field.value}
                onChangeText={(value) =>
                  field.onChange(normalizePhoneInput(value))
                }
                placeholder="6XXXXXXXX"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.textAreaInput, err ? styles.inputError : null]}
                testID="account-add-phone-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="pin"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Code PIN (6 chiffres)" />
              <SecureTextField
                ref={pinRef}
                variant="pin"
                keyboardType="numeric"
                value={field.value}
                onChangeText={(value) =>
                  field.onChange(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                hasError={!!err}
                testID="account-add-phone-pin-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <Controller
        control={control}
        name="confirmPin"
        render={({ field, fieldState }) => {
          const err = fieldErr(fieldState, submitCount);
          return (
            <>
              <FieldLabel text="Confirmer le PIN" />
              <SecureTextField
                ref={confirmPinRef}
                variant="pin"
                keyboardType="numeric"
                value={field.value}
                onChangeText={(value) =>
                  field.onChange(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                hasError={!!err}
                testID="account-add-phone-confirm-pin-input"
              />
              {err ? <Text style={styles.fieldError}>{err}</Text> : null}
            </>
          );
        }}
      />
      <View style={styles.actionsRowSplit}>
        <ActionButton
          label="Annuler"
          variant="secondary"
          onPress={onCancel}
          stretch
          testID="account-cancel-add-phone"
        />
        <ActionButton
          label="Configurer"
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          loading={isSubmitting}
          stretch
          testID="account-save-add-phone"
        />
      </View>
    </View>
  );
}

function RecoveryForm({
  recoveryOptions,
  profile,
  onSuccess,
  onCancel,
}: {
  recoveryOptions: AccountRecoveryOptionsResponse;
  profile: AccountProfileResponse | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);


  const isParent =
    recoveryOptions.schoolRoles.includes("PARENT") ??
    profile?.role === "PARENT";
  const initialQuestions = recoveryOptions.selectedQuestions ?? [];
  const initialAnswers = Object.fromEntries(
    initialQuestions.map((key) => [key, ""]),
  );

  const { control, handleSubmit, formState, setValue, watch } =
    useForm<RecoveryValues>({
      mode: "onChange",
      reValidateMode: "onChange",
      resolver: zodResolver(accountRecoverySchema),
      defaultValues: {
        birthDate: recoveryOptions.birthDate ?? "",
        selectedQuestions: initialQuestions,
        answers: initialAnswers,
        isParent,
        parentClassId: recoveryOptions.parentClassId ?? undefined,
        parentStudentId: recoveryOptions.parentStudentId ?? undefined,
      },
    });

  const { isSubmitting, submitCount, errors } = formState;
  const [selectedQuestions, answers, parentClassId, parentStudentId] = watch([
    "selectedQuestions",
    "answers",
    "parentClassId",
    "parentStudentId",
  ]);

  const classOptions = (recoveryOptions.classes ?? []).map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.schoolYearLabel}`,
  }));
  const studentOptions = (recoveryOptions.students ?? []).map((item) => ({
    value: item.id,
    label: `${item.firstName} ${item.lastName}`,
  }));
  const questionOptions = recoveryOptions.questions ?? [];

  async function onValid(data: RecoveryValues) {
    try {
      await accountApi.updateRecovery({
        birthDate: data.birthDate,
        answers: data.selectedQuestions.map((questionKey) => ({
          questionKey,
          answer: data.answers[questionKey]?.trim() ?? "",
        })),
        ...(data.isParent
          ? {
              parentClassId: data.parentClassId,
              parentStudentId: data.parentStudentId,
            }
          : {}),
      });
      showSuccess({
        title: "Récupération mise à jour",
        message: "Les paramètres de récupération ont été enregistrés.",
      });
      onSuccess();
    } catch (error) {
      showError({
        title: "Enregistrement impossible",
        message: getErrorMessage(
          error,
          "Les paramètres de récupération n'ont pas pu être enregistrés.",
        ),
      });
    }
  }

  function onInvalid() {}

  return (
    <View style={styles.formStack}>
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Date de naissance</Text>
        <Controller
          control={control}
          name="birthDate"
          render={({ field, fieldState }) => {
            const err = fieldErr(fieldState, submitCount);
            return (
              <>
                <DatePickerField
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  title="Date de naissance"
                  hasError={!!err}
                  testID="account-birth-date-input"
                />
                {err ? <Text style={styles.fieldError}>{err}</Text> : null}
              </>
            );
          }}
        />
      </View>

      {[0, 1, 2].map((index) => {
        const selected = selectedQuestions[index] ?? "";
        const answerErr =
          errors.answers && selected
            ? (errors.answers as Record<string, { message?: string }>)[selected]
                ?.message
            : null;
        return (
          <View key={index} style={styles.questionBlock}>
            <Text style={styles.fieldLabel}>Question {index + 1}</Text>
            <View style={styles.chipsWrap}>
              {questionOptions.map((option) => {
                const isSelected = selected === option.key;
                return (
                  <TouchableOpacity
                    key={`${index}-${option.key}`}
                    style={[
                      styles.choiceChip,
                      isSelected && styles.choiceChipSelected,
                    ]}
                    onPress={() => {
                      const nextQuestions = [...selectedQuestions];
                      nextQuestions[index] = option.key;
                      setValue("selectedQuestions", nextQuestions, {
                        shouldValidate: submitCount > 0,
                      });
                      if (!answers[option.key]) {
                        setValue(`answers.${option.key}`, "", {
                          shouldValidate: false,
                        });
                      }
                    }}
                    testID={`account-recovery-question-${index}-${option.key}`}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        isSelected && styles.choiceChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selected ? (
              <>
                <Controller
                  control={control}
                  name={`answers.${selected}`}
                  render={({ field }) => (
                    <TextInput
                      value={field.value ?? ""}
                      onChangeText={field.onChange}
                      placeholder="Votre réponse"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.textAreaInput,
                        styles.answerInput,
                        answerErr ? styles.inputError : null,
                      ]}
                      testID={`account-recovery-answer-${index}`}
                    />
                  )}
                />
                {answerErr ? (
                  <Text style={styles.fieldError}>{answerErr}</Text>
                ) : null}
              </>
            ) : null}
          </View>
        );
      })}

      {isParent ? (
        <>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Classe de l&apos;enfant</Text>
            <View style={styles.chipsWrap}>
              {classOptions.map((option) => {
                const selected = parentClassId === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.choiceChip,
                      selected && styles.choiceChipSelected,
                    ]}
                    onPress={() =>
                      setValue("parentClassId", option.value, {
                        shouldValidate: submitCount > 0,
                      })
                    }
                    testID={`account-parent-class-${option.value}`}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selected && styles.choiceChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.parentClassId ? (
              <Text style={styles.fieldError}>
                {errors.parentClassId.message}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Nom de l&apos;enfant</Text>
            <View style={styles.chipsWrap}>
              {studentOptions.map((option) => {
                const selected = parentStudentId === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.choiceChip,
                      selected && styles.choiceChipSelected,
                    ]}
                    onPress={() =>
                      setValue("parentStudentId", option.value, {
                        shouldValidate: submitCount > 0,
                      })
                    }
                    testID={`account-parent-student-${option.value}`}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selected && styles.choiceChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.parentStudentId ? (
              <Text style={styles.fieldError}>
                {errors.parentStudentId.message}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}

      <View style={styles.actionsRowSplit}>
        <ActionButton
          label="Annuler"
          variant="secondary"
          onPress={onCancel}
          stretch
          testID="account-cancel-recovery"
        />
        <ActionButton
          label="Modifier"
          onPress={() => {
            void handleSubmit(onValid, onInvalid)();
          }}
          loading={isSubmitting}
          stretch
          testID="account-save-recovery"
        />
      </View>
    </View>
  );
}

function SecurityFormCard({
  section,
  profile,
  recoveryOptions,
  loadingRecovery,
  onClose,
  onProfileUpdate,
}: {
  section: Exclude<SecuritySection, null>;
  profile: AccountProfileResponse | null;
  recoveryOptions: AccountRecoveryOptionsResponse | null;
  loadingRecovery: boolean;
  onClose: () => void;
  onProfileUpdate: (updated: AccountProfileResponse) => void;
}) {
  const title =
    section === "password" || section === "create-password"
      ? "Mettre à jour votre mot de passe"
      : section === "pin" || section === "add-phone"
        ? "Mettre à jour votre code PIN"
        : "Mettre à jour vos paramètres de récupération";

  return (
    <View style={styles.securityFormCard} testID="account-security-form-card">
      <View style={styles.securityFormHero}>
        <Text style={styles.securityFormHeroTitle}>{title}</Text>
        <Text style={styles.securityFormHeroSubtitle}>
          Vérifiez les informations puis validez la modification.
        </Text>
        <TouchableOpacity
          style={styles.securityBackInline}
          onPress={onClose}
          testID="account-security-back"
        >
          <Ionicons name="arrow-back" size={14} color={colors.white} />
          <Text style={styles.securityBackInlineLabel}>Retour</Text>
        </TouchableOpacity>
      </View>

      {section === "create-password" ? (
        <CreatePasswordForm
          onSuccess={() => {
            if (profile) onProfileUpdate({ ...profile, hasPassword: true });
            onClose();
          }}
          onCancel={onClose}
        />
      ) : null}

      {section === "password" ? (
        <ChangePasswordForm onSuccess={onClose} onCancel={onClose} />
      ) : null}

      {section === "pin" ? (
        <ChangePinForm onSuccess={onClose} onCancel={onClose} />
      ) : null}

      {section === "add-phone" ? (
        <AddPhoneForm
          onSuccess={() => {
            if (profile)
              onProfileUpdate({ ...profile, hasPhoneCredential: true });
            onClose();
          }}
          onCancel={onClose}
        />
      ) : null}

      {section === "recovery" ? (
        loadingRecovery ? (
          <LoadingBlock label="Chargement des options de récupération..." />
        ) : recoveryOptions ? (
          <RecoveryForm
            recoveryOptions={recoveryOptions}
            profile={profile}
            onSuccess={onClose}
            onCancel={onClose}
          />
        ) : null
      ) : null}
    </View>
  );
}

function AccountScreenContent() {
  const router = useRouter();
  const { onScroll } = useHeaderScroll();
  const setUser = useAuthStore((state) => state.setUser);
  const showError = useSuccessToastStore((state) => state.showError);
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);

  const [tab, setTab] = useState<AccountTab>("personal");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AccountProfileResponse | null>(null);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [openSecuritySection, setOpenSecuritySection] =
    useState<SecuritySection>(null);
  const [recoveryOptions, setRecoveryOptions] =
    useState<AccountRecoveryOptionsResponse | null>(null);
  const [loadingRecovery, setLoadingRecovery] = useState(false);
  const { locale, setLocale, t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [savingActiveRole, setSavingActiveRole] = useState(false);
  const [savingAccountLanguage, setSavingAccountLanguage] = useState(false);

  const securityHint = useMemo(() => {
    if (profile?.role === "PARENT") {
      return "Mot de passe, PIN et récupération du compte famille";
    }
    return "Mot de passe, PIN et récupération du compte";
  }, [profile?.role]);

  const availableRoles = useMemo(
    () => extractAvailableRoles(profile),
    [profile],
  );
  const currentActiveRole = useMemo(
    () =>
      profile?.activeRole && availableRoles.includes(profile.activeRole)
        ? profile.activeRole
        : (profile?.role ?? availableRoles[0] ?? null),
    [availableRoles, profile?.activeRole, profile?.role],
  );

  const syncProfileState = useCallback(
    (nextProfile: AccountProfileResponse) => {
      setProfile(nextProfile);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({
          ...currentUser,
          firstName: nextProfile.firstName,
          lastName: nextProfile.lastName,
          phone: nextProfile.phone,
          gender: nextProfile.gender ?? null,
          preferredLocale:
            nextProfile.preferredLocale ?? currentUser.preferredLocale,
          email: nextProfile.email ?? currentUser.email ?? null,
          role: nextProfile.role ?? currentUser.role,
          activeRole: nextProfile.activeRole ?? currentUser.activeRole,
          platformRoles: nextProfile.platformRoles ?? currentUser.platformRoles,
          memberships: nextProfile.memberships ?? currentUser.memberships,
        });
      }
    },
    [setUser],
  );

  const loadProfile = useCallback(async () => {
    try {
      const response = await accountApi.getMe();
      syncProfileState(response);
      setScreenError(null);
    } catch (error) {
      setScreenError(
        getErrorMessage(
          error,
          "Impossible de charger votre compte pour le moment.",
        ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [syncProfileState]);

  const loadRecovery = useCallback(async () => {
    if (loadingRecovery) return;
    try {
      setLoadingRecovery(true);
      const response = await accountApi.getRecoveryOptions();
      setRecoveryOptions(response);
    } catch (error) {
      showError({
        title: "Récupération indisponible",
        message: getErrorMessage(
          error,
          "Impossible de charger les paramètres de récupération.",
        ),
      });
    } finally {
      setLoadingRecovery(false);
    }
  }, [loadingRecovery, showError]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (tab === "security" && !recoveryOptions && !loadingRecovery) {
      void loadRecovery();
    }
  }, [loadRecovery, loadingRecovery, recoveryOptions, tab]);

  useEffect(() => {
    setSelectedRole(currentActiveRole);
  }, [currentActiveRole]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadProfile(), recoveryOptions ? loadRecovery() : null]);
  }

  async function handleSaveActiveRole() {
    if (!selectedRole) return;
    try {
      setSavingActiveRole(true);
      const response = await accountApi.setActiveRole({ role: selectedRole });
      setSelectedRole(response.activeRole);
      setProfile((current) =>
        current ? { ...current, activeRole: response.activeRole } : current,
      );
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({ ...currentUser, activeRole: response.activeRole });
      }
      showSuccess({
        title: "Profil actif mis à jour",
        message: `${toReadableRole(response.activeRole)} est maintenant actif.`,
      });
    } catch (error) {
      showError({
        title: "Mise à jour impossible",
        message: getErrorMessage(
          error,
          "Le profil actif n'a pas pu être mis à jour.",
        ),
      });
    } finally {
      setSavingActiveRole(false);
    }
  }

  async function handleSetAccountLanguage(option: Locale) {
    const preferredLocale: AccountLocale = option === "en" ? "EN" : "FR";
    if (profile?.preferredLocale === preferredLocale || savingAccountLanguage) {
      return;
    }
    try {
      setSavingAccountLanguage(true);
      const response = await accountApi.updateLanguage({ preferredLocale });
      syncProfileState(response);
      setLocale(option);
      showSuccess({
        title: "Langue mise à jour",
        message: "La langue de votre compte a été enregistrée.",
      });
    } catch (error) {
      showError({
        title: "Mise à jour impossible",
        message: getErrorMessage(
          error,
          "La langue du compte n'a pas pu être mise à jour.",
        ),
      });
    } finally {
      setSavingAccountLanguage(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title="Mon compte"
          subtitle="Chargement du profil"
          onBack={() => router.back()}
          backgroundColor={colors.primaryDark}
        />
        <TopTabs tab={tab} onChange={setTab} />
        <LoadingBlock label="Chargement de votre espace personnel..." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title="Mon compte"
        subtitle={
          profile
            ? `${profile.firstName} ${profile.lastName} • ${toReadableRole(profile.role)}`
            : "Mon espace personnel"
        }
        onBack={() => router.back()}
        backgroundColor={colors.primaryDark}
        testID="account-header"
      />
      <TopTabs tab={tab} onChange={setTab} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {screenError ? <ErrorBanner message={screenError} /> : null}

        {tab === "personal" ? (
          <SectionCard
            title="Informations personnelles"
            subtitle="Coordonnées affichées dans votre compte"
            testID="account-personal-card"
          >
            {editingPersonal && profile ? (
              <PersonalFormEdit
                profile={profile}
                onSuccess={(updated) => {
                  syncProfileState(updated);
                  setEditingPersonal(false);
                }}
                onCancel={() => setEditingPersonal(false)}
              />
            ) : (
              <View style={styles.infoList}>
                <InfoRow label="Prénom" value={profile?.firstName ?? "-"} />
                <InfoRow label="Nom" value={profile?.lastName ?? "-"} />
                <InfoRow
                  label="Genre"
                  value={
                    profile?.gender === "F"
                      ? "Femme"
                      : profile?.gender === "OTHER"
                        ? "Autre"
                        : "Homme"
                  }
                />
                {profile?.email ? (
                  <ChangeEmailSection
                    currentEmail={profile.email}
                    onSuccess={() => {
                      void loadProfile();
                    }}
                  />
                ) : (
                  <AddEmailSection
                    onSuccess={() => {
                      void loadProfile();
                    }}
                  />
                )}
                <InfoRow
                  label="Téléphone"
                  value={toLocalPhoneDisplay(profile?.phone) || "Non renseigné"}
                />
                <View style={styles.infoEditAction}>
                  <ActionButton
                    label="Modifier"
                    onPress={() => setEditingPersonal(true)}
                    testID="account-edit-personal"
                  />
                </View>
              </View>
            )}
          </SectionCard>
        ) : null}

        {tab === "security" ? (
          <View style={styles.securityStack}>
            {openSecuritySection === null ? (
              <SectionCard
                title="Sécurité"
                subtitle={securityHint}
                testID="account-security-card"
              >
                <View style={styles.securityIntro}>
                  <Text style={styles.securityIntroText}>
                    Sélectionnez une action pour ouvrir un écran de modification
                    dédié.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.securityEntry}
                  onPress={() =>
                    setOpenSecuritySection(
                      profile?.hasPassword ? "password" : "create-password",
                    )
                  }
                  testID="account-password-section-toggle"
                >
                  <View style={styles.securityEntryIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.securityEntryText}>
                    <Text style={styles.securityEntryTitle}>Mot de passe</Text>
                    <Text style={styles.securityEntrySubtitle}>
                      {profile?.hasPassword
                        ? "Modifier votre mot de passe principal"
                        : "Créer votre mot de passe (non configuré)"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.securityEntry}
                  onPress={() =>
                    setOpenSecuritySection(
                      profile?.hasPhoneCredential ? "pin" : "add-phone",
                    )
                  }
                  testID="account-pin-section-toggle"
                >
                  <View style={styles.securityEntryIcon}>
                    <Ionicons
                      name="keypad-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.securityEntryText}>
                    <Text style={styles.securityEntryTitle}>Code PIN</Text>
                    <Text style={styles.securityEntrySubtitle}>
                      {profile?.hasPhoneCredential
                        ? "Mettre à jour votre code PIN"
                        : "Configurer téléphone + PIN (non configuré)"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.securityEntry}
                  onPress={() => {
                    setOpenSecuritySection("recovery");
                    if (!recoveryOptions && !loadingRecovery) {
                      void loadRecovery();
                    }
                  }}
                  testID="account-recovery-section-toggle"
                >
                  <View style={styles.securityEntryIcon}>
                    <Ionicons
                      name="shield-half-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.securityEntryText}>
                    <Text style={styles.securityEntryTitle}>Récupération</Text>
                    <Text style={styles.securityEntrySubtitle}>
                      Questions et réponses de secours
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </SectionCard>
            ) : (
              <SecurityFormCard
                section={openSecuritySection}
                profile={profile}
                recoveryOptions={recoveryOptions}
                loadingRecovery={loadingRecovery}
                onClose={() => setOpenSecuritySection(null)}
                onProfileUpdate={(updated) => {
                  setProfile(updated);
                }}
              />
            )}
          </View>
        ) : null}

        {tab === "help" ? (
          <SectionCard
            title="Aide"
            subtitle="Bonnes pratiques et assistance"
            testID="account-help-card"
          >
            <View style={styles.helpList}>
              <HelpItem
                title="Mot de passe fort"
                text="Utilisez au moins 8 caractères avec minuscules, majuscules et chiffres."
              />
              <HelpItem
                title="PIN confidentiel"
                text="Choisissez un code à 6 chiffres, différent des dates évidentes."
              />
              <HelpItem
                title="Récupération"
                text="Renseignez trois réponses fiables pour restaurer l'accès sans support."
              />
              <HelpItem
                title="Support"
                text="Si votre compte reste bloqué, contactez l'administration de votre établissement."
              />
            </View>
          </SectionCard>
        ) : null}

        {tab === "settings" ? (
          <View style={styles.settingsStack}>
            <SectionCard
              title={t("settings.language.title")}
              subtitle={t("settings.language.subtitle")}
              testID="account-settings-language-card"
            >
              <Text style={styles.settingsHint}>
                {t("settings.language.hint")}
              </Text>
              <View style={styles.settingsChoiceWrap}>
                {SUPPORTED_LOCALES.map((option) => {
                  const selected = locale === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.settingsRoleOption,
                        selected && styles.settingsRoleOptionActive,
                      ]}
                      onPress={() => setLocale(option)}
                      testID={`account-language-${option}`}
                    >
                      <Text
                        style={[
                          styles.settingsRoleLabel,
                          selected && styles.settingsRoleLabelActive,
                        ]}
                      >
                        {t(`settings.language.${option}`)}
                      </Text>
                      <Ionicons
                        name={
                          selected
                            ? "radio-button-on-outline"
                            : "radio-button-off-outline"
                        }
                        size={16}
                        color={selected ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SectionCard>

            <SectionCard
              title={t("settings.accountLanguage.title")}
              subtitle={t("settings.accountLanguage.subtitle")}
              testID="account-settings-account-language-card"
            >
              <Text style={styles.settingsHint}>
                {t("settings.accountLanguage.hint")}
              </Text>
              <View style={styles.settingsChoiceWrap}>
                {SUPPORTED_LOCALES.map((option) => {
                  const accountLocale: Locale =
                    profile?.preferredLocale === "EN" ? "en" : "fr";
                  const selected = accountLocale === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.settingsRoleOption,
                        selected && styles.settingsRoleOptionActive,
                      ]}
                      onPress={() => {
                        void handleSetAccountLanguage(option);
                      }}
                      disabled={savingAccountLanguage}
                      testID={`account-profile-language-${option}`}
                    >
                      <Text
                        style={[
                          styles.settingsRoleLabel,
                          selected && styles.settingsRoleLabelActive,
                        ]}
                      >
                        {t(`settings.language.${option}`)}
                      </Text>
                      <Ionicons
                        name={
                          selected
                            ? "radio-button-on-outline"
                            : "radio-button-off-outline"
                        }
                        size={16}
                        color={selected ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SectionCard>

            <SectionCard
              title="Profil actif"
              subtitle="Choisissez la navigation à afficher"
              testID="account-settings-role-card"
            >
              {availableRoles.length <= 1 ? (
                <Text style={styles.settingsHint}>
                  Un seul profil est disponible sur ce compte.
                </Text>
              ) : (
                <View style={styles.settingsChoiceWrap}>
                  {availableRoles.map((role) => {
                    const selected = selectedRole === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.settingsRoleOption,
                          selected && styles.settingsRoleOptionActive,
                        ]}
                        onPress={() => setSelectedRole(role)}
                        testID={`account-active-role-${role}`}
                      >
                        <Text
                          style={[
                            styles.settingsRoleLabel,
                            selected && styles.settingsRoleLabelActive,
                          ]}
                        >
                          {toReadableRole(role)}
                        </Text>
                        <Ionicons
                          name={
                            selected
                              ? "radio-button-on-outline"
                              : "radio-button-off-outline"
                          }
                          size={16}
                          color={
                            selected ? colors.primary : colors.textSecondary
                          }
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.actionsRowSplit}>
                <ActionButton
                  label="Réinitialiser"
                  variant="secondary"
                  onPress={() => setSelectedRole(currentActiveRole)}
                  stretch
                  disabled={
                    savingActiveRole || selectedRole === currentActiveRole
                  }
                  testID="account-reset-active-role"
                />
                <ActionButton
                  label="Appliquer"
                  onPress={() => {
                    void handleSaveActiveRole();
                  }}
                  stretch
                  loading={savingActiveRole}
                  disabled={
                    !selectedRole ||
                    selectedRole === currentActiveRole ||
                    availableRoles.length <= 1
                  }
                  testID="account-save-active-role"
                />
              </View>
            </SectionCard>
          </View>
        ) : null}

        {!screenError && !profile ? (
          <EmptyState
            icon="person-circle-outline"
            title="Aucune donnée disponible"
            message="Le profil n'a pas pu être chargé."
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

export function AccountScreen() {
  return (
    <AppShell showHeader={false}>
      <AccountScreenContent />
    </AppShell>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{props.label}</Text>
      <Text style={styles.infoValue}>{props.value}</Text>
    </View>
  );
}

function HelpItem(props: { title: string; text: string }) {
  return (
    <View style={styles.helpItem}>
      <View style={styles.helpIconWrap}>
        <Ionicons name="sparkles-outline" size={16} color={colors.warmAccent} />
      </View>
      <View style={styles.helpText}>
        <Text style={styles.helpTitle}>{props.title}</Text>
        <Text style={styles.helpBody}>{props.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  topTabsWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  topTabsInner: {
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  tabButton: {
    minHeight: 46,
    backgroundColor: "transparent",
    borderBottomWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(12,95,168,0.08)",
    borderWidth: 1,
    borderColor: "rgba(12,95,168,0.14)",
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  formStack: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: -4,
  },
  fieldError: {
    marginTop: -6,
    fontSize: 12,
    color: colors.notification,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  actionsRowSplit: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    minWidth: 122,
    minHeight: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderWidth: 1,
  },
  actionButtonStretch: {
    flex: 1,
    minWidth: 0,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonPressed: {
    opacity: 0.84,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  actionButtonTextPrimary: {
    color: colors.white,
  },
  actionButtonTextSecondary: {
    color: colors.primary,
  },
  infoList: {
    gap: 12,
  },
  infoEditAction: {
    marginTop: 4,
    alignItems: "flex-end",
  },
  infoRow: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  infoValueSecondary: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  addEmailBlock: {
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  securityStack: {
    gap: 16,
  },
  securityIntro: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  securityIntroText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  securityEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  securityEntryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12,95,168,0.08)",
  },
  securityEntryText: {
    flex: 1,
    gap: 2,
  },
  securityEntryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  securityEntrySubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  securityFormCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  securityFormHero: {
    marginBottom: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(36,124,114,0.35)",
    backgroundColor: "rgba(36,124,114,0.25)",
    gap: 4,
  },
  securityFormHeroTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  securityFormHeroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(25,94,86,0.86)",
  },
  securityBackInline: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(36,124,114,0.35)",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  securityBackInlineLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  accordionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.surface,
    marginTop: 10,
  },
  accordionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  accordionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(12,95,168,0.08)",
  },
  accordionText: {
    flex: 1,
    gap: 3,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  accordionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  questionBlock: {
    gap: 10,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceChipSelected: {
    backgroundColor: "rgba(12,95,168,0.08)",
    borderColor: "rgba(12,95,168,0.22)",
  },
  choiceChipText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  choiceChipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  fieldBlock: {
    gap: 10,
  },
  textAreaInput: {
    minHeight: 54,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputError: {
    borderColor: "#FCA5A5",
  },
  answerInput: {
    minHeight: 52,
  },
  settingsStack: {
    gap: 16,
  },
  settingsHint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  settingsChoiceWrap: {
    marginTop: 10,
    gap: 10,
  },
  settingsRoleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  settingsRoleOptionActive: {
    borderColor: "rgba(12,95,168,0.24)",
    backgroundColor: "rgba(12,95,168,0.08)",
  },
  settingsRoleLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  settingsRoleLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  helpList: {
    gap: 14,
  },
  helpItem: {
    flexDirection: "row",
    gap: 12,
  },
  helpIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warmSurface,
  },
  helpText: {
    flex: 1,
    gap: 4,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  helpBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
