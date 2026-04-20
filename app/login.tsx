import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../src/api/auth.api";
import { type ApiClientError } from "../src/api/client";
import { mobileBuildsApi } from "../src/api/mobile-builds.api";
import {
  GoogleAuthError,
  signInWithGoogleAsync,
} from "../src/auth/google-auth";
import { parseApiError } from "../src/auth/google-sso-callback";
import { SecureTextField } from "../src/components/SecureTextField";
import { useAuthStore } from "../src/store/auth.store";

type AuthTab = "phone" | "email" | "google";
type AndroidUpdateNotice = {
  versionName: string;
  versionCode: number;
  downloadUrl: string;
};

function parseVersionCode(value?: string | null) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

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
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [androidUpdate, setAndroidUpdate] =
    useState<AndroidUpdateNotice | null>(null);

  useEffect(() => {
    if (params.tab === "google") {
      setTab("google");
    }
    if (typeof params.error === "string" && params.error.trim()) {
      setError(params.error.trim());
    }
  }, [params.error, params.tab]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    let cancelled = false;

    async function checkAndroidUpdate() {
      try {
        const latest = await mobileBuildsApi.getLatestAndroidBuildMeta();
        const latestCode = Number(latest.versionCode);
        const installedCode = parseVersionCode(
          Application.nativeBuildVersion ?? null,
        );

        if (
          !Number.isFinite(latestCode) ||
          installedCode === null ||
          latestCode <= installedCode
        ) {
          return;
        }

        if (!cancelled) {
          setAndroidUpdate({
            versionName: latest.versionName,
            versionCode: latestCode,
            downloadUrl:
              latest.downloadUrl ||
              mobileBuildsApi.getLatestAndroidDownloadUrl(),
          });
        }
      } catch {
        // La vérification de version ne doit jamais bloquer la connexion.
      }
    }

    void checkAndroidUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePhoneLogin() {
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 8) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("Le code PIN doit contenir exactement 6 chiffres.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.loginPhone(`+237${digits}`, pin);
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
  }

  async function handleEmailLogin() {
    if (!email.trim() || !email.includes("@")) {
      setError("Adresse email invalide.");
      return;
    }
    if (!password) {
      setError("Mot de passe requis.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await authApi.loginEmail(email.trim(), password);
      await handleLoginResponse(response);
      router.replace("/");
    } catch (err) {
      const apiErr = err as ApiClientError;
      if (
        apiErr?.code === "PASSWORD_CHANGE_REQUIRED" ||
        apiErr?.code === "PROFILE_SETUP_REQUIRED"
      ) {
        routeToOnboarding(apiErr, email.trim());
        return;
      }
      setError(parseApiError(apiErr));
    } finally {
      setIsSubmitting(false);
    }
  }

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
                    <TextInput
                      testID="input-phone"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="6XX XXX XXX"
                      keyboardType="phone-pad"
                      style={[styles.input, styles.inputFlex]}
                      placeholderTextColor="#9B9490"
                    />
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Code PIN</Text>
                  <SecureTextField
                    testID="input-pin"
                    value={pin}
                    onChangeText={setPin}
                    placeholder="6 chiffres"
                    keyboardType="number-pad"
                    placeholderTextColor="#9B9490"
                    maxLength={6}
                    variant="pin"
                  />
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
                  <TextInput
                    testID="input-email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nom@etablissement.cm"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    placeholderTextColor="#9B9490"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <SecureTextField
                    testID="input-password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#9B9490"
                  />
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

            {androidUpdate ? (
              <View style={styles.updateCard} testID="android-update-banner">
                <Text style={styles.updateTitle}>
                  Une mise à jour Android est disponible
                </Text>
                <Text style={styles.updateText}>
                  Version installée:{" "}
                  {Application.nativeApplicationVersion ?? "inconnue"} (
                  {Application.nativeBuildVersion ?? "?"}){"\n"}
                  Dernière version: {androidUpdate.versionName} (
                  {androidUpdate.versionCode})
                </Text>
                <Pressable
                  style={styles.updateButton}
                  testID="android-update-download"
                  onPress={() => {
                    void Linking.openURL(androidUpdate.downloadUrl);
                  }}
                >
                  <Text style={styles.updateButtonText}>
                    Télécharger la mise à jour
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Copyright — juste au-dessus de la barre de navigation */}
        <View style={[styles.copyrightBar, { bottom: insets.bottom }]}>
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

  // ── Mise à jour Android ───────────────────────────────────
  updateCard: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  updateTitle: {
    color: BLUE,
    fontSize: 14,
    fontWeight: "800",
  },
  updateText: {
    color: "#1E3A5F",
    fontSize: 12,
    lineHeight: 18,
  },
  updateButton: {
    alignSelf: "flex-start",
    backgroundColor: BLUE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // ── Copyright (ancré en bas) ───────────────────────────────
  copyrightBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    backgroundColor: "#FFFCF8",
    zIndex: 10,
    elevation: 10,
  },
  copyright: {
    color: "#B0A496",
    fontSize: 12,
    textAlign: "center",
  },
});
