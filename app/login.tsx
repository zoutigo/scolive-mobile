import { useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { authApi } from "../src/api/auth.api";
import { type ApiClientError } from "../src/api/client";
import {
  GoogleAuthError,
  signInWithGoogleAsync,
} from "../src/auth/google-auth";
import { parseApiError } from "../src/auth/google-sso-callback";
import { SecureTextField } from "../src/components/SecureTextField";
import { useAuthStore } from "../src/store/auth.store";
import { SUPPORTED_LOCALES } from "../src/i18n/translations";
import { useTranslation, type TranslateFn } from "../src/i18n/useTranslation";

const PREFERRED_METHOD_KEY = "preferred_auth_method";

type AuthMethod = "phone" | "email" | "username" | "google";

function getMethodLabels(t: TranslateFn): Record<AuthMethod, string> {
  return {
    phone: t("login.method.phone"),
    email: t("login.method.email"),
    username: t("login.method.username"),
    google: t("login.method.google"),
  };
}

// ── Schemas ────────────────────────────────────────────────────────────────────

function createLoginSchemas(t: TranslateFn) {
  const phoneLoginSchema = z.object({
    phone: z
      .string()
      .trim()
      .refine((value) => value.replace(/\D/g, "").length >= 8, {
        message: t("login.errors.invalidPhone"),
      }),
    pin: z
      .string()
      .trim()
      .regex(/^\d{6}$/, t("login.errors.invalidPin")),
  });

  const emailLoginSchema = z.object({
    email: z.string().trim().email(t("login.errors.invalidEmail")),
    password: z.string().min(1, t("login.errors.passwordRequired")),
  });

  const usernameLoginSchema = z.object({
    username: z.string().trim().min(1, t("login.errors.usernameRequired")),
    password: z.string().min(1, t("login.errors.passwordRequired")),
  });

  return { phoneLoginSchema, emailLoginSchema, usernameLoginSchema };
}

type PhoneLoginValues = { phone: string; pin: string };
type EmailLoginValues = { email: string; password: string };
type UsernameLoginValues = { username: string; password: string };

// ── Helpers ────────────────────────────────────────────────────────────────────

function routeToOnboarding(err: ApiClientError, fallbackEmail?: string) {
  const email = err.email ?? fallbackEmail ?? undefined;
  router.push({
    pathname: "/onboarding",
    params: {
      ...(email ? { email } : {}),
      ...(err.schoolSlug ? { schoolSlug: err.schoolSlug } : {}),
      ...(err.setupToken ? { setupToken: err.setupToken } : {}),
    },
  });
}

function GoogleIcon() {
  return (
    <View style={styles.ssoIcon}>
      <Text style={styles.ssoIconTextBlue}>G</Text>
    </View>
  );
}

function AppleIcon() {
  return (
    <View style={[styles.ssoIcon, styles.ssoIconDark]}>
      <Text style={[styles.ssoIconTextBlue, styles.ssoIconTextWhite]}>A</Text>
    </View>
  );
}

// ── Method switcher modal (Android) ───────────────────────────────────────────

function MethodSwitcherModal({
  visible,
  currentMethod,
  onSelect,
  onClose,
  t,
}: {
  visible: boolean;
  currentMethod: AuthMethod;
  onSelect: (method: AuthMethod) => void;
  onClose: () => void;
  t: TranslateFn;
}) {
  const methods: AuthMethod[] = ["phone", "email", "username", "google"];
  const methodLabels = getMethodLabels(t);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.switcherOverlay}>
        <Pressable style={styles.switcherBackdrop} onPress={onClose} />
        <View style={styles.switcherSheet}>
          <View style={styles.switcherHandle} />
          <Text style={styles.switcherTitle}>{t("login.modal.title")}</Text>
          {methods
            .filter((m) => m !== currentMethod)
            .map((m) => (
              <Pressable
                key={m}
                style={styles.switcherOption}
                onPress={() => onSelect(m)}
                testID={`modal-tab-${m}`}
              >
                <Text style={styles.switcherOptionText}>{methodLabels[m]}</Text>
              </Pressable>
            ))}
          <Pressable style={styles.switcherCancel} onPress={onClose}>
            <Text style={styles.switcherCancelText}>
              {t("login.modal.cancel")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const params = useLocalSearchParams<{ tab?: string; error?: string }>();
  const insets = useSafeAreaInsets();
  const { handleLoginResponse } = useAuthStore();
  const { locale, setLocale, t } = useTranslation();
  const { phoneLoginSchema, emailLoginSchema, usernameLoginSchema } = useMemo(
    () => createLoginSchemas(t),
    [locale],
  );
  const methodLabels = getMethodLabels(t);

  const [method, setMethod] = useState<AuthMethod>("phone");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switcherVisible, setSwitcherVisible] = useState(false);

  // Load preferred method
  useEffect(() => {
    AsyncStorage.getItem(PREFERRED_METHOD_KEY)
      .then((stored) => {
        if (
          stored &&
          ["phone", "email", "username", "google"].includes(stored)
        ) {
          setMethod(stored as AuthMethod);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (params.tab === "google") {
      setMethod("google");
    }
    if (typeof params.error === "string" && params.error.trim()) {
      setError(params.error.trim());
    }
  }, [params.error, params.tab]);

  async function saveMethod(m: AuthMethod) {
    await AsyncStorage.setItem(PREFERRED_METHOD_KEY, m).catch(() => {});
  }

  function switchMethod(m: AuthMethod) {
    setMethod(m);
    setError(null);
    setSwitcherVisible(false);
  }

  function openSwitcher() {
    if (Platform.OS === "ios") {
      const methods: AuthMethod[] = ["phone", "email", "username", "google"];
      const others = methods.filter((m) => m !== method);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            ...others.map((m) => methodLabels[m]),
            t("login.modal.cancel"),
          ],
          cancelButtonIndex: others.length,
          title: t("login.actionSheet.title"),
        },
        (idx) => {
          if (idx < others.length) {
            const selected = others[idx];
            if (selected) switchMethod(selected);
          }
        },
      );
    } else {
      setSwitcherVisible(true);
    }
  }

  // ── Phone form ──────────────────────────────────────────────────────────────

  const phoneForm = useForm<PhoneLoginValues>({
    resolver: zodResolver(phoneLoginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { phone: "", pin: "" },
  });

  const handlePhoneLogin = phoneForm.handleSubmit(async (values) => {
    const digits = values.phone.replace(/\D/g, "");
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.loginPhone(`+237${digits}`, values.pin);
      await handleLoginResponse(response);
      await saveMethod("phone");
      router.replace("/");
    } catch (err) {
      const apiErr = err as ApiClientError;
      if (apiErr?.code === "PROFILE_SETUP_REQUIRED" && apiErr.setupToken) {
        routeToOnboarding(apiErr);
        return;
      }
      setError(parseApiError(apiErr, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Email form ──────────────────────────────────────────────────────────────

  const emailForm = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const handleEmailLogin = emailForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.loginEmail(
        values.email.trim(),
        values.password,
      );
      await handleLoginResponse(response);
      await saveMethod("email");
      router.replace("/");
    } catch (err) {
      const apiErr = err as ApiClientError;
      if (
        apiErr?.code === "PASSWORD_CHANGE_REQUIRED" ||
        apiErr?.code === "PROFILE_SETUP_REQUIRED"
      ) {
        routeToOnboarding(apiErr, values.email.trim());
        return;
      }
      setError(parseApiError(apiErr, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Username form ────────────────────────────────────────────────────────────

  const usernameForm = useForm<UsernameLoginValues>({
    resolver: zodResolver(usernameLoginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { username: "", password: "" },
  });

  const handleUsernameLogin = usernameForm.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.loginUsername(
        values.username.trim(),
        values.password,
      );
      await handleLoginResponse(response);
      await saveMethod("username");
      router.replace("/");
    } catch (err) {
      const apiErr = err as ApiClientError;
      if (apiErr?.code === "PASSWORD_CHANGE_REQUIRED") {
        router.push({
          pathname: "/onboarding",
          params: {
            username: values.username.trim(),
            ...(apiErr.schoolSlug ? { schoolSlug: apiErr.schoolSlug } : {}),
          },
        });
        return;
      }
      if (apiErr?.code === "PROFILE_SETUP_REQUIRED") {
        routeToOnboarding(apiErr);
        return;
      }
      setError(parseApiError(apiErr, t));
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Google ────────────────────────────────────────────────────────────────

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithGoogleAsync();
      await saveMethod("google");
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        setError(err.message);
        return;
      }
      setError(parseApiError(err, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── En-tête sombre ─────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        <View
          style={[styles.languageSwitcher, { top: insets.top + 12 }]}
          testID="login-language-switcher"
        >
          {SUPPORTED_LOCALES.map((option) => {
            const selected = locale === option;
            return (
              <Pressable
                key={option}
                onPress={() => setLocale(option)}
                style={[
                  styles.languageOption,
                  selected && styles.languageOptionActive,
                ]}
                testID={`login-language-${option}`}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    selected && styles.languageOptionTextActive,
                  ]}
                >
                  {option.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.brandRow}>
          <Text style={styles.brandNameWhite}>SCO</Text>
          <Text style={styles.brandNameGold}>LIVE</Text>
        </View>
        <View style={styles.brandAccent} />
        <Text style={styles.tagline}>{t("login.tagline")}</Text>
      </View>

      {/* ── Card (formulaire) ──────────────────────────────── */}
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
            scrollIndicatorInsets={{ bottom: 40 }}
          >
            {/* Onglets de méthode (testID hooks pour les tests) */}
            {(["phone", "email", "username", "google"] as AuthMethod[]).map(
              (m) => (
                <Pressable
                  key={m}
                  testID={`tab-${m}`}
                  onPress={() => switchMethod(m)}
                  style={{ height: 0, overflow: "hidden" }}
                />
              ),
            )}

            {/* Titre de la méthode active */}
            <Text style={styles.methodLabel} testID="active-method-label">
              {methodLabels[method]}
            </Text>

            {/* Téléphone */}
            {method === "phone" ? (
              <View style={styles.form} testID="panel-phone">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t("login.fields.phone")}</Text>
                  <View style={styles.phoneRow}>
                    <View style={styles.dialCode}>
                      <Text style={styles.dialCodeText}>+237</Text>
                    </View>
                    <Controller
                      control={phoneForm.control}
                      name="phone"
                      render={({ field, fieldState }) => (
                        <TextInput
                          ref={field.ref}
                          testID="input-phone"
                          value={field.value}
                          onBlur={field.onBlur}
                          onChangeText={(value) => {
                            setError(null);
                            field.onChange(value);
                          }}
                          placeholder={t("login.placeholders.phone")}
                          keyboardType="phone-pad"
                          style={[
                            styles.input,
                            styles.inputFlex,
                            fieldState.error && styles.inputError,
                          ]}
                          placeholderTextColor="#9B9490"
                        />
                      )}
                    />
                  </View>
                  {phoneForm.formState.errors.phone ? (
                    <Text style={styles.fieldError} testID="error-phone">
                      {phoneForm.formState.errors.phone.message}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t("login.fields.pin")}</Text>
                  <Controller
                    control={phoneForm.control}
                    name="pin"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-pin"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          setError(null);
                          field.onChange(value);
                        }}
                        placeholder={t("login.placeholders.pin")}
                        keyboardType="number-pad"
                        placeholderTextColor="#9B9490"
                        maxLength={6}
                        variant="pin"
                        containerStyle={
                          fieldState.error ? styles.secureFieldError : undefined
                        }
                      />
                    )}
                  />
                  {phoneForm.formState.errors.pin ? (
                    <Text style={styles.fieldError} testID="error-pin">
                      {phoneForm.formState.errors.pin.message}
                    </Text>
                  ) : null}
                </View>
                {error ? (
                  <View style={styles.errorBox} testID="error-message">
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <Pressable
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handlePhoneLogin}
                  disabled={isSubmitting}
                  testID="submit-login"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("login.submit")}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  testID="link-forgot-pin"
                  onPress={() => router.push("/recovery/pin")}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotLinkText}>
                    {t("login.links.forgotPin")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Email */}
            {method === "email" ? (
              <View style={styles.form} testID="panel-email">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t("login.fields.email")}</Text>
                  <Controller
                    control={emailForm.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-email"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          setError(null);
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
                  {emailForm.formState.errors.email ? (
                    <Text style={styles.fieldError} testID="error-email">
                      {emailForm.formState.errors.email.message}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t("login.fields.password")}</Text>
                  <Controller
                    control={emailForm.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-password"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          setError(null);
                          field.onChange(value);
                        }}
                        placeholder={t("login.placeholders.password")}
                        placeholderTextColor="#9B9490"
                        containerStyle={
                          fieldState.error ? styles.secureFieldError : undefined
                        }
                      />
                    )}
                  />
                  {emailForm.formState.errors.password ? (
                    <Text style={styles.fieldError} testID="error-password">
                      {emailForm.formState.errors.password.message}
                    </Text>
                  ) : null}
                </View>
                {error ? (
                  <View style={styles.errorBox} testID="error-message">
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <Pressable
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handleEmailLogin}
                  disabled={isSubmitting}
                  testID="submit-login"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("login.submit")}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  testID="link-forgot-password"
                  onPress={() => router.push("/recovery/password")}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotLinkText}>
                    {t("login.links.forgotPassword")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Identifiant */}
            {method === "username" ? (
              <View style={styles.form} testID="panel-username">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t("login.fields.username")}</Text>
                  <Controller
                    control={usernameForm.control}
                    name="username"
                    render={({ field, fieldState }) => (
                      <TextInput
                        ref={field.ref}
                        testID="input-username"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          setError(null);
                          field.onChange(value);
                        }}
                        placeholder={t("login.placeholders.username")}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                          styles.input,
                          fieldState.error && styles.inputError,
                        ]}
                        placeholderTextColor="#9B9490"
                      />
                    )}
                  />
                  {usernameForm.formState.errors.username ? (
                    <Text style={styles.fieldError} testID="error-username">
                      {usernameForm.formState.errors.username.message}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t("login.fields.password")}</Text>
                  <Controller
                    control={usernameForm.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <SecureTextField
                        ref={field.ref}
                        testID="input-password-username"
                        value={field.value}
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          setError(null);
                          field.onChange(value);
                        }}
                        placeholder={t("login.placeholders.password")}
                        placeholderTextColor="#9B9490"
                        containerStyle={
                          fieldState.error ? styles.secureFieldError : undefined
                        }
                      />
                    )}
                  />
                  {usernameForm.formState.errors.password ? (
                    <Text
                      style={styles.fieldError}
                      testID="error-password-username"
                    >
                      {usernameForm.formState.errors.password.message}
                    </Text>
                  ) : null}
                </View>
                {error ? (
                  <View style={styles.errorBox} testID="error-message">
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <Pressable
                  style={[
                    styles.primaryButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  onPress={handleUsernameLogin}
                  disabled={isSubmitting}
                  testID="submit-login"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {t("login.submit")}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  testID="link-forgot-username"
                  onPress={() => router.push("/recovery/username")}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotLinkText}>
                    {t("login.links.forgotUsername")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Google / Apple SSO */}
            {method === "google" ? (
              <View style={styles.form} testID="panel-google">
                <Text style={styles.ssoInfo}>{t("login.sso.info")}</Text>
                <Pressable
                  style={[
                    styles.ssoButton,
                    isSubmitting && styles.primaryButtonBusy,
                  ]}
                  testID="sso-google"
                  onPress={() => void handleGoogleLogin()}
                  disabled={isSubmitting}
                >
                  <View style={styles.ssoButtonInner}>
                    <GoogleIcon />
                    <Text style={styles.ssoButtonText}>
                      {isSubmitting
                        ? t("login.sso.googleLoading")
                        : t("login.sso.googleContinue")}
                    </Text>
                  </View>
                  <Text style={styles.ssoChevron}>›</Text>
                </Pressable>
                {error ? (
                  <View style={styles.errorBox} testID="error-message">
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <Pressable style={styles.ssoButtonMuted} testID="sso-apple">
                  <View style={styles.ssoButtonInner}>
                    <AppleIcon />
                    <Text style={styles.ssoButtonTextMuted}>
                      {t("login.sso.appleContinue")}
                    </Text>
                  </View>
                  <Text style={styles.comingSoon}>
                    {t("login.sso.comingSoon")}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Lien "Se connecter autrement" */}
            <Pressable
              testID="link-switch-method"
              onPress={openSwitcher}
              style={styles.switchMethodLink}
            >
              <Text style={styles.switchMethodText}>
                {t("login.links.switchMethod")}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Version + Copyright — toujours ancrés en bas de la carte */}
        <View
          style={[styles.copyrightBar, { paddingBottom: 10 + insets.bottom }]}
          testID="login-footer"
        >
          <Text style={styles.appVersion} testID="login-app-version">
            build {Application.nativeBuildVersion ?? "—"}
          </Text>
          <Text style={styles.copyright}>{t("login.footer.copyright")}</Text>
        </View>
      </View>

      {/* Android method switcher modal */}
      {Platform.OS === "android" ? (
        <MethodSwitcherModal
          visible={switcherVisible}
          currentMethod={method}
          onSelect={switchMethod}
          onClose={() => setSwitcherVisible(false)}
          t={t}
        />
      ) : null}
    </View>
  );
}

const BLUE = "#08467D";
const BLUE_LIGHT = "#0C5FA8";
const GOLD = "#F7C260";
const AMBER = "#C06A1A";

const styles = StyleSheet.create({
  // ── Écran ──────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: BLUE,
  },

  // ── En-tête ────────────────────────────────────────────────
  header: {
    paddingTop: 64,
    paddingHorizontal: 28,
    paddingBottom: 48,
    overflow: "hidden",
  },
  languageSwitcher: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 6,
    zIndex: 1,
  },
  languageOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  languageOptionActive: {
    borderColor: GOLD,
    backgroundColor: "rgba(247,194,96,0.18)",
  },
  languageOptionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  languageOptionTextActive: {
    color: GOLD,
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
  tagline: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.8,
    marginTop: 28,
  },

  // ── Card ───────────────────────────────────────────────────
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
    paddingBottom: 16,
    gap: 20,
  },

  // ── Méthode active ─────────────────────────────────────────
  methodLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: BLUE,
    letterSpacing: -0.3,
  },

  // ── Formulaire ─────────────────────────────────────────────
  form: {
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
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
  inputError: {
    borderColor: "#FCA5A5",
  },
  inputFlex: {
    flex: 1,
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  phoneRow: {
    flexDirection: "row",
  },
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
  dialCodeText: {
    color: AMBER,
    fontSize: 15,
    fontWeight: "700",
  },
  secureFieldError: {
    borderColor: "#FCA5A5",
  },
  fieldError: {
    color: "#B91C1C",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },

  // ── Bouton principal ───────────────────────────────────────
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: AMBER,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonBusy: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // ── Message d'erreur ───────────────────────────────────────
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

  // ── SSO ────────────────────────────────────────────────────
  ssoInfo: {
    color: "#6A625A",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  ssoButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D5E4F8",
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ssoButtonMuted: {
    backgroundColor: "#F8F4EF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E9DED1",
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ssoButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ssoButtonText: {
    color: "#1F2933",
    fontSize: 15,
    fontWeight: "700",
  },
  ssoButtonTextMuted: {
    color: "#5E5A55",
    fontSize: 15,
    fontWeight: "700",
  },
  ssoChevron: {
    color: BLUE_LIGHT,
    fontSize: 24,
    lineHeight: 24,
  },
  comingSoon: {
    color: "#8A6B45",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  ssoIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  ssoIconDark: {
    backgroundColor: "#1F2933",
    borderColor: "#1F2933",
  },
  ssoIconTextBlue: {
    color: BLUE_LIGHT,
    fontSize: 15,
    fontWeight: "900",
  },
  ssoIconTextWhite: {
    color: "#FFFFFF",
  },

  // ── Lien "oublié" ──────────────────────────────────────────
  forgotLink: {
    alignItems: "center",
    paddingVertical: 6,
  },
  forgotLinkText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // ── Switcher de méthode ────────────────────────────────────
  switchMethodLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
  switchMethodText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  // ── Modal switcher Android ─────────────────────────────────
  switcherOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  switcherBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  switcherSheet: {
    backgroundColor: "#FFFCF8",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    gap: 2,
  },
  switcherHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#D0C8C0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  switcherTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2933",
    marginBottom: 10,
    textAlign: "center",
  },
  switcherOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EFE8DE",
  },
  switcherOptionText: {
    fontSize: 15,
    color: BLUE,
    fontWeight: "600",
    textAlign: "center",
  },
  switcherCancel: {
    paddingVertical: 14,
    marginTop: 4,
  },
  switcherCancelText: {
    fontSize: 15,
    color: "#7A6F65",
    fontWeight: "700",
    textAlign: "center",
  },

  // ── Copyright (ancré en bas) ───────────────────────────────
  copyrightBar: {
    paddingTop: 10,
    backgroundColor: "#FFFCF8",
    alignItems: "center",
    gap: 2,
  },
  appVersion: {
    color: "#C0B6AC",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  copyright: {
    color: "#B0A496",
    fontSize: 11,
    textAlign: "center",
  },
});
