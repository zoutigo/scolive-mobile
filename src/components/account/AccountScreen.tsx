import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { accountApi } from "../../api/account.api";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { AppShell, useDrawer } from "../navigation/AppShell";
import { SecureTextField } from "../SecureTextField";
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
  accountChangePasswordSchema,
  accountChangePinSchema,
  accountPersonalProfileSchema,
  accountRecoverySchema,
  formatDateInput,
  normalizePhoneInput,
  parseDateToISO,
  toLocalPhoneDisplay,
} from "./account.schemas";
import type {
  AccountGender,
  AccountProfileResponse,
  AccountRecoveryOptionsResponse,
} from "../../types/account.types";
import type { AppRole, PlatformRole, SchoolRole } from "../../types/auth.types";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useAuthStore } from "../../store/auth.store";
import type { ApiClientError } from "../../api/client";

type AccountTab = "personal" | "security" | "help" | "settings";
type SecuritySection = "password" | "pin" | "recovery" | null;
type SettingsLanguage = "fr" | "en";

type PersonalFormState = {
  firstName: string;
  lastName: string;
  gender: AccountGender;
  phone: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type PinFormState = {
  currentPin: string;
  newPin: string;
  confirmNewPin: string;
};

type RecoveryFormState = {
  birthDate: string;
  selectedQuestions: string[];
  answers: Record<string, string>;
  isParent: boolean;
  parentClassId?: string;
  parentStudentId?: string;
};

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

const LANGUAGE_OPTIONS: Array<{ value: SettingsLanguage; label: string }> = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

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
  const labels: Record<string, string> = {
    ...PLATFORM_ROLE_LABELS,
    ...SCHOOL_ROLE_LABELS,
  };

  if (!role) {
    return "Utilisateur";
  }

  return labels[role] ?? role;
}

function extractAvailableRoles(
  profile: AccountProfileResponse | null,
): AppRole[] {
  if (!profile) {
    return [];
  }

  const roles = new Set<AppRole>();
  for (const role of profile.platformRoles ?? []) {
    roles.add(role);
  }
  for (const membership of profile.memberships ?? []) {
    roles.add(membership.role);
  }
  if (profile.role) {
    roles.add(profile.role);
  }
  if (profile.activeRole) {
    roles.add(profile.activeRole);
  }
  return Array.from(roles);
}

function formatBirthDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return "";
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function buildRecoveryForm(
  profile: AccountProfileResponse | null,
  recovery: AccountRecoveryOptionsResponse | null,
): RecoveryFormState {
  const selectedQuestions = recovery?.selectedQuestions ?? [];
  const answers = Object.fromEntries(selectedQuestions.map((key) => [key, ""]));

  return {
    birthDate: formatBirthDate(recovery?.birthDate ?? ""),
    selectedQuestions,
    answers,
    isParent:
      recovery?.schoolRoles.includes("PARENT") ?? profile?.role === "PARENT",
    parentClassId: recovery?.parentClassId ?? undefined,
    parentStudentId: recovery?.parentStudentId ?? undefined,
  };
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

function AccountScreenContent() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const setUser = useAuthStore((state) => state.setUser);
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

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

  const [personalForm, setPersonalForm] = useState<PersonalFormState>({
    firstName: "",
    lastName: "",
    gender: "M",
    phone: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [pinForm, setPinForm] = useState<PinFormState>({
    currentPin: "",
    newPin: "",
    confirmNewPin: "",
  });
  const [recoveryForm, setRecoveryForm] = useState<RecoveryFormState>({
    birthDate: "",
    selectedQuestions: [],
    answers: {},
    isParent: false,
  });

  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>(
    {},
  );
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({});
  const [recoveryErrors, setRecoveryErrors] = useState<Record<string, string>>(
    {},
  );

  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [savingRecovery, setSavingRecovery] = useState(false);
  const [settingsLanguage, setSettingsLanguage] =
    useState<SettingsLanguage>("fr");
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [savingActiveRole, setSavingActiveRole] = useState(false);

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
      setPersonalForm({
        firstName: nextProfile.firstName,
        lastName: nextProfile.lastName,
        gender: nextProfile.gender ?? "M",
        phone: toLocalPhoneDisplay(nextProfile.phone),
      });
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({
          ...currentUser,
          firstName: nextProfile.firstName,
          lastName: nextProfile.lastName,
          phone: nextProfile.phone,
          gender: nextProfile.gender ?? null,
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
    if (loadingRecovery) {
      return;
    }
    try {
      setLoadingRecovery(true);
      const response = await accountApi.getRecoveryOptions();
      setRecoveryOptions(response);
      setRecoveryForm(buildRecoveryForm(profile, response));
      setRecoveryErrors({});
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
  }, [loadingRecovery, profile, showError]);

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

  const validatePersonal = useCallback(() => {
    const result = accountPersonalProfileSchema.safeParse(personalForm);
    if (result.success) {
      setPersonalErrors({});
      return true;
    }
    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      nextErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    setPersonalErrors(nextErrors);
    return false;
  }, [personalForm]);

  const validatePassword = useCallback(() => {
    const result = accountChangePasswordSchema.safeParse(passwordForm);
    if (result.success) {
      setPasswordErrors({});
      return true;
    }
    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      nextErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    setPasswordErrors(nextErrors);
    return false;
  }, [passwordForm]);

  const validatePin = useCallback(() => {
    const result = accountChangePinSchema.safeParse(pinForm);
    if (result.success) {
      setPinErrors({});
      return true;
    }
    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      nextErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    setPinErrors(nextErrors);
    return false;
  }, [pinForm]);

  const validateRecovery = useCallback(() => {
    const result = accountRecoverySchema.safeParse(recoveryForm);
    if (result.success) {
      setRecoveryErrors({});
      return true;
    }
    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key =
        issue.path.length > 1
          ? `${String(issue.path[0])}.${String(issue.path[1])}`
          : String(issue.path[0] ?? "form");
      nextErrors[key] = issue.message;
    }
    setRecoveryErrors(nextErrors);
    return false;
  }, [recoveryForm]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadProfile(), recoveryOptions ? loadRecovery() : null]);
  }

  async function handleSavePersonal() {
    if (!validatePersonal()) {
      return;
    }
    try {
      setSavingPersonal(true);
      const response = await accountApi.updateProfile(personalForm);
      syncProfileState(response);
      setEditingPersonal(false);
      showSuccess({
        title: "Profil mis à jour",
        message: "Vos informations personnelles ont été enregistrées.",
      });
    } catch (error) {
      showError({
        title: "Mise à jour impossible",
        message: getErrorMessage(
          error,
          "Les informations personnelles n'ont pas pu être enregistrées.",
        ),
      });
    } finally {
      setSavingPersonal(false);
    }
  }

  async function handleSavePassword() {
    if (!validatePassword()) {
      return;
    }
    try {
      setSavingPassword(true);
      await accountApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordErrors({});
      setOpenSecuritySection(null);
      showSuccess({
        title: "Mot de passe modifié",
        message: "Votre mot de passe a été mis à jour avec succès.",
      });
    } catch (error) {
      const apiError = error as ApiClientError;
      const message = getErrorMessage(
        error,
        "Le mot de passe n'a pas pu être modifié.",
      );
      setPasswordErrors((current) => ({
        ...current,
        currentPassword:
          apiError.statusCode === 400 ? message : current.currentPassword,
      }));
      showError({
        title: "Modification impossible",
        message,
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSavePin() {
    if (!validatePin()) {
      return;
    }
    try {
      setSavingPin(true);
      await accountApi.changePin({
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin,
      });
      setPinForm({
        currentPin: "",
        newPin: "",
        confirmNewPin: "",
      });
      setPinErrors({});
      setOpenSecuritySection(null);
      showSuccess({
        title: "PIN modifié",
        message: "Votre code PIN a été mis à jour avec succès.",
      });
    } catch (error) {
      const apiError = error as ApiClientError;
      const message = getErrorMessage(
        error,
        "Le code PIN n'a pas pu être modifié.",
      );
      setPinErrors((current) => ({
        ...current,
        currentPin: apiError.statusCode === 400 ? message : current.currentPin,
      }));
      showError({
        title: "Modification impossible",
        message,
      });
    } finally {
      setSavingPin(false);
    }
  }

  async function handleSaveRecovery() {
    if (!validateRecovery()) {
      return;
    }
    const birthDate = parseDateToISO(recoveryForm.birthDate);
    if (!birthDate) {
      setRecoveryErrors((current) => ({
        ...current,
        birthDate: "Format attendu : JJ/MM/AAAA.",
      }));
      return;
    }
    try {
      setSavingRecovery(true);
      await accountApi.updateRecovery({
        birthDate,
        answers: recoveryForm.selectedQuestions.map((questionKey) => ({
          questionKey,
          answer: recoveryForm.answers[questionKey]?.trim() ?? "",
        })),
        ...(recoveryForm.isParent
          ? {
              parentClassId: recoveryForm.parentClassId,
              parentStudentId: recoveryForm.parentStudentId,
            }
          : {}),
      });
      setOpenSecuritySection(null);
      showSuccess({
        title: "Récupération mise à jour",
        message: "Les paramètres de récupération ont été enregistrés.",
      });
    } catch (error) {
      showError({
        title: "Enregistrement impossible",
        message: getErrorMessage(
          error,
          "Les paramètres de récupération n'ont pas pu être enregistrés.",
        ),
      });
    } finally {
      setSavingRecovery(false);
    }
  }

  async function handleSaveActiveRole() {
    if (!selectedRole) {
      return;
    }

    try {
      setSavingActiveRole(true);
      const response = await accountApi.setActiveRole({ role: selectedRole });
      setSelectedRole(response.activeRole);
      setProfile((current) =>
        current
          ? {
              ...current,
              activeRole: response.activeRole,
            }
          : current,
      );

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({
          ...currentUser,
          activeRole: response.activeRole,
        });
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

  const classOptions = (recoveryOptions?.classes ?? []).map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.schoolYearLabel}`,
  }));

  const studentOptions = (recoveryOptions?.students ?? []).map((item) => ({
    value: item.id,
    label: `${item.firstName} ${item.lastName}`,
  }));

  const recoveryQuestionOptions = recoveryOptions?.questions ?? [];

  if (loading) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title="Mon compte"
          subtitle="Chargement du profil"
          onBack={() => router.back()}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
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
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        backgroundColor={colors.primaryDark}
        testID="account-header"
      />
      <TopTabs tab={tab} onChange={setTab} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
            {editingPersonal ? (
              <View style={styles.formStack}>
                <TextField
                  label="Prénom"
                  value={personalForm.firstName}
                  onChangeText={(value) =>
                    setPersonalForm((current) => ({
                      ...current,
                      firstName: value,
                    }))
                  }
                  testID="account-first-name-input"
                />
                {personalErrors.firstName ? (
                  <Text style={styles.fieldError}>
                    {personalErrors.firstName}
                  </Text>
                ) : null}

                <TextField
                  label="Nom"
                  value={personalForm.lastName}
                  onChangeText={(value) =>
                    setPersonalForm((current) => ({
                      ...current,
                      lastName: value,
                    }))
                  }
                  testID="account-last-name-input"
                />
                {personalErrors.lastName ? (
                  <Text style={styles.fieldError}>
                    {personalErrors.lastName}
                  </Text>
                ) : null}

                <PillSelector
                  label="Genre"
                  value={personalForm.gender}
                  options={GENDER_OPTIONS}
                  onChange={(value) =>
                    setPersonalForm((current) => ({
                      ...current,
                      gender: value as AccountGender,
                    }))
                  }
                  testIDPrefix="account-gender"
                />
                {personalErrors.gender ? (
                  <Text style={styles.fieldError}>{personalErrors.gender}</Text>
                ) : null}

                <TextField
                  label="Téléphone"
                  value={personalForm.phone}
                  onChangeText={(value) =>
                    setPersonalForm((current) => ({
                      ...current,
                      phone: normalizePhoneInput(value),
                    }))
                  }
                  keyboardType="numeric"
                  testID="account-phone-input"
                />
                {personalErrors.phone ? (
                  <Text style={styles.fieldError}>{personalErrors.phone}</Text>
                ) : null}

                <View style={styles.actionsRow}>
                  <ActionButton
                    label="Annuler"
                    variant="secondary"
                    onPress={() => {
                      if (profile) {
                        syncProfileState(profile);
                      }
                      setPersonalErrors({});
                      setEditingPersonal(false);
                    }}
                    testID="account-cancel-personal"
                  />
                  <ActionButton
                    label="Enregistrer"
                    onPress={() => {
                      void handleSavePersonal();
                    }}
                    loading={savingPersonal}
                    testID="account-save-personal"
                  />
                </View>
              </View>
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
                <InfoRow
                  label="Email"
                  value={profile?.email ?? "Non renseigné"}
                />
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
                  onPress={() => setOpenSecuritySection("password")}
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
                      Modifier votre mot de passe principal
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
                  onPress={() => setOpenSecuritySection("pin")}
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
                      Mettre à jour votre code PIN
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
              <View
                style={styles.securityFormCard}
                testID="account-security-form-card"
              >
                <View style={styles.securityFormHero}>
                  <Text style={styles.securityFormHeroTitle}>
                    {openSecuritySection === "password"
                      ? "Mettre à jour votre mot de passe"
                      : openSecuritySection === "pin"
                        ? "Mettre à jour votre code PIN"
                        : "Mettre à jour vos paramètres de récupération"}
                  </Text>
                  <Text style={styles.securityFormHeroSubtitle}>
                    Vérifiez les informations puis validez la modification.
                  </Text>
                  <TouchableOpacity
                    style={styles.securityBackInline}
                    onPress={() => setOpenSecuritySection(null)}
                    testID="account-security-back"
                  >
                    <Ionicons
                      name="arrow-back"
                      size={14}
                      color={colors.white}
                    />
                    <Text style={styles.securityBackInlineLabel}>Retour</Text>
                  </TouchableOpacity>
                </View>

                {openSecuritySection === "password" ? (
                  <View style={styles.formStack}>
                    <FieldLabel text="Mot de passe actuel" />
                    <SecureTextField
                      value={passwordForm.currentPassword}
                      onChangeText={(value) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: value,
                        }))
                      }
                      placeholder="Mot de passe actuel"
                      testID="account-current-password-input"
                    />
                    {passwordErrors.currentPassword ? (
                      <Text style={styles.fieldError}>
                        {passwordErrors.currentPassword}
                      </Text>
                    ) : null}

                    <FieldLabel text="Nouveau mot de passe" />
                    <SecureTextField
                      value={passwordForm.newPassword}
                      onChangeText={(value) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: value,
                        }))
                      }
                      placeholder="Nouveau mot de passe"
                      testID="account-new-password-input"
                    />
                    {passwordErrors.newPassword ? (
                      <Text style={styles.fieldError}>
                        {passwordErrors.newPassword}
                      </Text>
                    ) : null}

                    <FieldLabel text="Confirmation" />
                    <SecureTextField
                      value={passwordForm.confirmNewPassword}
                      onChangeText={(value) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmNewPassword: value,
                        }))
                      }
                      placeholder="Confirmez le nouveau mot de passe"
                      testID="account-confirm-password-input"
                    />
                    {passwordErrors.confirmNewPassword ? (
                      <Text style={styles.fieldError}>
                        {passwordErrors.confirmNewPassword}
                      </Text>
                    ) : null}

                    <View style={styles.actionsRowSplit}>
                      <ActionButton
                        label="Annuler"
                        variant="secondary"
                        onPress={() => setOpenSecuritySection(null)}
                        stretch
                        testID="account-cancel-password"
                      />
                      <ActionButton
                        label="Modifier"
                        onPress={() => {
                          void handleSavePassword();
                        }}
                        loading={savingPassword}
                        stretch
                        testID="account-save-password"
                      />
                    </View>
                  </View>
                ) : null}

                {openSecuritySection === "pin" ? (
                  <View style={styles.formStack}>
                    <FieldLabel text="PIN actuel" />
                    <SecureTextField
                      variant="pin"
                      keyboardType="numeric"
                      value={pinForm.currentPin}
                      onChangeText={(value) =>
                        setPinForm((current) => ({
                          ...current,
                          currentPin: value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="PIN actuel"
                      testID="account-current-pin-input"
                    />
                    {pinErrors.currentPin ? (
                      <Text style={styles.fieldError}>
                        {pinErrors.currentPin}
                      </Text>
                    ) : null}

                    <FieldLabel text="Nouveau PIN" />
                    <SecureTextField
                      variant="pin"
                      keyboardType="numeric"
                      value={pinForm.newPin}
                      onChangeText={(value) =>
                        setPinForm((current) => ({
                          ...current,
                          newPin: value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="Nouveau PIN"
                      testID="account-new-pin-input"
                    />
                    {pinErrors.newPin ? (
                      <Text style={styles.fieldError}>{pinErrors.newPin}</Text>
                    ) : null}

                    <FieldLabel text="Confirmation" />
                    <SecureTextField
                      variant="pin"
                      keyboardType="numeric"
                      value={pinForm.confirmNewPin}
                      onChangeText={(value) =>
                        setPinForm((current) => ({
                          ...current,
                          confirmNewPin: value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="Confirmez le nouveau PIN"
                      testID="account-confirm-pin-input"
                    />
                    {pinErrors.confirmNewPin ? (
                      <Text style={styles.fieldError}>
                        {pinErrors.confirmNewPin}
                      </Text>
                    ) : null}

                    <View style={styles.actionsRowSplit}>
                      <ActionButton
                        label="Annuler"
                        variant="secondary"
                        onPress={() => setOpenSecuritySection(null)}
                        stretch
                        testID="account-cancel-pin"
                      />
                      <ActionButton
                        label="Modifier"
                        onPress={() => {
                          void handleSavePin();
                        }}
                        loading={savingPin}
                        stretch
                        testID="account-save-pin"
                      />
                    </View>
                  </View>
                ) : null}

                {openSecuritySection === "recovery" ? (
                  loadingRecovery ? (
                    <LoadingBlock label="Chargement des options de récupération..." />
                  ) : (
                    <View style={styles.formStack}>
                      <TextField
                        label="Date de naissance"
                        value={recoveryForm.birthDate}
                        onChangeText={(value) =>
                          setRecoveryForm((current) => ({
                            ...current,
                            birthDate: formatDateInput(value),
                          }))
                        }
                        placeholder="JJ/MM/AAAA"
                        testID="account-birth-date-input"
                      />
                      {recoveryErrors.birthDate ? (
                        <Text style={styles.fieldError}>
                          {recoveryErrors.birthDate}
                        </Text>
                      ) : null}

                      {[0, 1, 2].map((index) => {
                        const selected =
                          recoveryForm.selectedQuestions[index] ?? "";
                        return (
                          <View key={index} style={styles.questionBlock}>
                            <Text style={styles.fieldLabel}>
                              Question {index + 1}
                            </Text>
                            <View style={styles.chipsWrap}>
                              {recoveryQuestionOptions.map((option) => {
                                const isSelected = selected === option.key;
                                return (
                                  <TouchableOpacity
                                    key={`${index}-${option.key}`}
                                    style={[
                                      styles.choiceChip,
                                      isSelected && styles.choiceChipSelected,
                                    ]}
                                    onPress={() =>
                                      setRecoveryForm((current) => {
                                        const nextQuestions = [
                                          ...current.selectedQuestions,
                                        ];
                                        nextQuestions[index] = option.key;
                                        return {
                                          ...current,
                                          selectedQuestions: nextQuestions,
                                          answers: {
                                            ...current.answers,
                                            [option.key]:
                                              current.answers[option.key] ?? "",
                                          },
                                        };
                                      })
                                    }
                                    testID={`account-recovery-question-${index}-${option.key}`}
                                  >
                                    <Text
                                      style={[
                                        styles.choiceChipText,
                                        isSelected &&
                                          styles.choiceChipTextSelected,
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
                                <TextInput
                                  value={recoveryForm.answers[selected] ?? ""}
                                  onChangeText={(value) =>
                                    setRecoveryForm((current) => ({
                                      ...current,
                                      answers: {
                                        ...current.answers,
                                        [selected]: value,
                                      },
                                    }))
                                  }
                                  placeholder="Votre réponse"
                                  placeholderTextColor={colors.textSecondary}
                                  style={[
                                    styles.textAreaInput,
                                    styles.answerInput,
                                  ]}
                                  testID={`account-recovery-answer-${index}`}
                                />
                                {recoveryErrors[`answers.${selected}`] ? (
                                  <Text style={styles.fieldError}>
                                    {recoveryErrors[`answers.${selected}`]}
                                  </Text>
                                ) : null}
                              </>
                            ) : null}
                          </View>
                        );
                      })}

                      {recoveryForm.isParent ? (
                        <>
                          <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>
                              Classe de l'enfant
                            </Text>
                            <View style={styles.chipsWrap}>
                              {classOptions.map((option) => {
                                const selected =
                                  recoveryForm.parentClassId === option.value;
                                return (
                                  <TouchableOpacity
                                    key={option.value}
                                    style={[
                                      styles.choiceChip,
                                      selected && styles.choiceChipSelected,
                                    ]}
                                    onPress={() =>
                                      setRecoveryForm((current) => ({
                                        ...current,
                                        parentClassId: option.value,
                                      }))
                                    }
                                    testID={`account-parent-class-${option.value}`}
                                  >
                                    <Text
                                      style={[
                                        styles.choiceChipText,
                                        selected &&
                                          styles.choiceChipTextSelected,
                                      ]}
                                    >
                                      {option.label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {recoveryErrors.parentClassId ? (
                              <Text style={styles.fieldError}>
                                {recoveryErrors.parentClassId}
                              </Text>
                            ) : null}
                          </View>

                          <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>
                              Nom de l'enfant
                            </Text>
                            <View style={styles.chipsWrap}>
                              {studentOptions.map((option) => {
                                const selected =
                                  recoveryForm.parentStudentId === option.value;
                                return (
                                  <TouchableOpacity
                                    key={option.value}
                                    style={[
                                      styles.choiceChip,
                                      selected && styles.choiceChipSelected,
                                    ]}
                                    onPress={() =>
                                      setRecoveryForm((current) => ({
                                        ...current,
                                        parentStudentId: option.value,
                                      }))
                                    }
                                    testID={`account-parent-student-${option.value}`}
                                  >
                                    <Text
                                      style={[
                                        styles.choiceChipText,
                                        selected &&
                                          styles.choiceChipTextSelected,
                                      ]}
                                    >
                                      {option.label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {recoveryErrors.parentStudentId ? (
                              <Text style={styles.fieldError}>
                                {recoveryErrors.parentStudentId}
                              </Text>
                            ) : null}
                          </View>
                        </>
                      ) : null}

                      <View style={styles.actionsRowSplit}>
                        <ActionButton
                          label="Annuler"
                          variant="secondary"
                          onPress={() => setOpenSecuritySection(null)}
                          stretch
                          testID="account-cancel-recovery"
                        />
                        <ActionButton
                          label="Modifier"
                          onPress={() => {
                            void handleSaveRecovery();
                          }}
                          loading={savingRecovery}
                          stretch
                          testID="account-save-recovery"
                        />
                      </View>
                    </View>
                  )
                ) : null}
              </View>
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
              title="Langue"
              subtitle="Préparez l'interface multilingue"
              testID="account-settings-language-card"
            >
              <Text style={styles.settingsHint}>
                Sélection visuelle uniquement pour le moment.
              </Text>
              <View style={styles.settingsChoiceWrap}>
                {LANGUAGE_OPTIONS.map((option) => {
                  const selected = settingsLanguage === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.settingsRoleOption,
                        selected && styles.settingsRoleOptionActive,
                      ]}
                      onPress={() => setSettingsLanguage(option.value)}
                      testID={`account-language-${option.value}`}
                    >
                      <Text
                        style={[
                          styles.settingsRoleLabel,
                          selected && styles.settingsRoleLabelActive,
                        ]}
                      >
                        {option.label}
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
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  helpIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  helpText: {
    flex: 1,
    gap: 4,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  helpBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
