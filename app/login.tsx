import { useEffect, useState } from "react";
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
import * as Application from "expo-application";
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

type AuthTab = "phone" | "email" | "google";

const phoneLoginSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((value) => value.replace(/\D/g, "").length >= 8, {
      message: "Numéro de téléphone invalide.",
    }),
  pin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code PIN doit contenir exactement 6 chiffres."),
});

const emailLoginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

type PhoneLoginValues = z.infer<typeof phoneLoginSchema>;
type EmailLoginValues = z.infer<typeof emailLoginSchema>;

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

export default function LoginScreen() {
  const params = useLocalSearchParams<{ tab?: string; error?: string }>();
  const insets = useSafeAreaInsets();
  const { handleLoginResponse } = useAuthStore();

  const [tab, setTab] = useState<AuthTab>("phone");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneForm = useForm<PhoneLoginValues>({
    resolver: zodResolver(phoneLoginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      phone: "",
      pin: "",
    },
  });

  const emailForm = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (params.tab === "google") {
      setTab("google");
    }
    if (typeof params.error === "string" && params.error.trim()) {
      setError(params.error.trim());
    }
  }, [params.error, params.tab]);

  const handlePhoneLogin = phoneForm.handleSubmit(async (values) => {
    const digits = values.phone.replace(/\D/g, "");
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.loginPhone(`+237${digits}`, values.pin);
      await handleLoginResponse(response);
      router.replace("/");
    } catch (err) {
      const apiErr = err as ApiClientError;
      if (apiErr?.code === "PROFILE_SETUP_REQUIRED" && apiErr.setupToken) {
        routeToOnboarding(apiErr);
        return;
      }
      setError(parseApiError(apiErr));
    } finally {
      setIsSubmitting(false);
    }
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
      setError(parseApiError(apiErr));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithGoogleAsync();
    } catch (err) {
      if (err instanceof GoogleAuthError) {
        setError(err.message);
        return;
      }
      setError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── En-tête sombre ─────────────────────────────────── */}
      <View style={styles.header}>
        {/* Blobs décoratifs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        {/* Marque */}
        <View style={styles.brandRow}>
          <Text style={styles.brandNameWhite}>SCO</Text>
          <Text style={styles.brandNameGold}>LIVE</Text>
        </View>
        <View style={styles.brandAccent} />

        {/* Tagline */}
        <Text style={styles.tagline}>Votre école en temps réel.</Text>
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
            {/* Onglets */}
            <View style={styles.tabBar}>
              {(["phone", "email", "google"] as AuthTab[]).map((t) => (
                <Pressable
                  key={t}
                  testID={`tab-${t}`}
                  onPress={() => {
                    setTab(t);
                    setError(null);
                  }}
                  style={[styles.tab, tab === t && styles.tabActive]}
                >
                  <Text
                    style={[styles.tabText, tab === t && styles.tabTextActive]}
                  >
                    {t === "phone"
                      ? "Téléphone"
                      : t === "email"
                        ? "Email"
                        : "Google"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Téléphone */}
            {tab === "phone" ? (
              <View style={styles.form} testID="panel-phone">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Numéro de téléphone</Text>
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
                          placeholder="6XX XXX XXX"
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
                  <Text style={styles.label}>Code PIN</Text>
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
                        placeholder="6 chiffres"
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
                    <Text style={styles.primaryButtonText}>Se connecter</Text>
                  )}
                </Pressable>
                <Pressable
                  testID="link-forgot-pin"
                  onPress={() => router.push("/recovery/pin")}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotLinkText}>PIN oublié ?</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Email */}
            {tab === "email" ? (
              <View style={styles.form} testID="panel-email">
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Adresse email</Text>
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
                  {emailForm.formState.errors.email ? (
                    <Text style={styles.fieldError} testID="error-email">
                      {emailForm.formState.errors.email.message}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Mot de passe</Text>
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
                        placeholder="Votre mot de passe"
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
                    <Text style={styles.primaryButtonText}>Se connecter</Text>
                  )}
                </Pressable>
                <Pressable
                  testID="link-forgot-password"
                  onPress={() => router.push("/recovery/password")}
                  style={styles.forgotLink}
                >
                  <Text style={styles.forgotLinkText}>
                    Mot de passe oublié ?
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Google / Apple SSO */}
            {tab === "google" ? (
              <View style={styles.form} testID="panel-google">
                <Text style={styles.ssoInfo}>
                  Accès instantané avec votre compte existant.
                </Text>
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
                        ? "Connexion Google..."
                        : "Continuer avec Google"}
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
                      Continuer avec Apple
                    </Text>
                  </View>
                  <Text style={styles.comingSoon}>BIENTÔT</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Version + Copyright — ancrés en bas */}
        <View style={[styles.copyrightBar, { bottom: insets.bottom }]}>
          <Text style={styles.appVersion} testID="login-app-version">
            build {Application.nativeBuildVersion ?? "—"}
          </Text>
          <Text style={styles.copyright}>
            © 2026 Scolive. Tous droits réservés.
          </Text>
        </View>
      </View>
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
    paddingBottom: 56,
    gap: 24,
  },

  // ── Onglets ────────────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#EFE8DE",
    borderRadius: 14,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    color: "#7A6F65",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#FFFFFF",
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

  // ── Copyright (ancré en bas) ───────────────────────────────
  copyrightBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    backgroundColor: "#FFFCF8",
    zIndex: 10,
    elevation: 10,
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
