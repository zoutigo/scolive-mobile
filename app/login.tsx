import { useState } from "react";
import {
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

type AuthTab = "phone" | "email" | "google";

function GoogleMark() {
  return (
    <View style={styles.googleMark}>
      <Text style={styles.googleMarkText}>G</Text>
    </View>
  );
}

function AppleMark() {
  return (
    <View style={styles.appleMark}>
      <Text style={styles.appleMarkText}>A</Text>
    </View>
  );
}

export default function LoginScreen() {
  const [tab, setTab] = useState<AuthTab>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />

      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.brandWordmark}>SCOLIVE</Text>
          <View style={styles.brandRule} />

          <Text style={styles.title}>Bienvenue</Text>
          <Text style={styles.subtitle}>Accedez a votre espace scolaire.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <Pressable
              testID="tab-phone"
              onPress={() => setTab("phone")}
              style={[styles.tab, tab === "phone" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "phone" && styles.tabTextActive,
                ]}
              >
                Téléphone
              </Text>
            </Pressable>
            <Pressable
              testID="tab-email"
              onPress={() => setTab("email")}
              style={[styles.tab, tab === "email" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "email" && styles.tabTextActive,
                ]}
              >
                Email
              </Text>
            </Pressable>
            <Pressable
              testID="tab-google"
              onPress={() => setTab("google")}
              style={[styles.tab, tab === "google" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === "google" && styles.tabTextActive,
                ]}
              >
                Google
              </Text>
            </Pressable>
          </View>

          <View style={styles.headerBlock}>
            <Text style={styles.cardSubtitle}>
              Choisissez votre mode d&apos;accès.
            </Text>
          </View>

          {tab === "phone" ? (
            <View style={styles.form} testID="panel-phone">
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Numero de telephone</Text>
                <TextInput
                  testID="input-phone"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="6XXXXXXXX"
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholderTextColor="#8A847D"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Code PIN</Text>
                <TextInput
                  testID="input-pin"
                  value={pin}
                  onChangeText={setPin}
                  placeholder="123456"
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholderTextColor="#8A847D"
                  secureTextEntry
                />
              </View>
              <Pressable style={styles.primaryButton} testID="submit-login">
                <Text style={styles.primaryButtonText}>
                  Entrer dans l&apos;espace
                </Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "email" ? (
            <View style={styles.form} testID="panel-email">
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Adresse email</Text>
                <TextInput
                  testID="input-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="prenom.nom@etablissement.fr"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#8A847D"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  testID="input-password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Votre mot de passe"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#8A847D"
                />
              </View>
              <Pressable style={styles.primaryButton} testID="submit-login">
                <Text style={styles.primaryButtonText}>Continuer</Text>
              </Pressable>
            </View>
          ) : null}

          {tab === "google" ? (
            <View style={styles.form} testID="panel-google">
              <View style={styles.ssoPanel}>
                <Text style={styles.ssoTitle}>Connexion Google</Text>
                <Text style={styles.ssoSubtitle}>
                  Accès rapide avec votre compte.
                </Text>
              </View>

              <Pressable style={styles.ssoButton} testID="sso-google">
                <View style={styles.ssoButtonLeft}>
                  <GoogleMark />
                  <Text style={styles.ssoButtonText}>
                    Continuer avec Google
                  </Text>
                </View>
                <Text style={styles.ssoArrow}>›</Text>
              </Pressable>

              <Pressable style={styles.ssoButtonMuted} testID="sso-apple">
                <View style={styles.ssoButtonLeft}>
                  <AppleMark />
                  <Text style={styles.ssoButtonTextMuted}>
                    Continuer avec Apple
                  </Text>
                </View>
                <Text style={styles.ssoMutedHint}>Bientot</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerCopy}>
            © 2026 Scolive. Tous droits reserves.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F1E8",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 36,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -20,
    right: -30,
    width: 210,
    height: 210,
    borderRadius: 999,
    backgroundColor: "#D8E9FF",
    opacity: 0.95,
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: 70,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "#F2D9BC",
    opacity: 0.8,
  },
  hero: {
    marginBottom: 24,
    gap: 10,
    alignItems: "center",
    paddingTop: 10,
  },
  brandWordmark: {
    color: "#0C5FA8",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: 4.8,
    textAlign: "center",
  },
  brandRule: {
    width: 72,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D89B5B",
    opacity: 0.9,
  },
  title: {
    color: "#1F2933",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1.4,
    textAlign: "center",
    marginTop: 4,
  },
  subtitle: {
    color: "#5F5A52",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 260,
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255, 252, 248, 0.95)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E5D8C8",
    padding: 20,
    gap: 16,
    shadowColor: "#55371A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#F5EBDD",
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#0C5FA8",
  },
  tabText: {
    color: "#6B6259",
    fontSize: 14,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  headerBlock: {
    gap: 6,
  },
  cardSubtitle: {
    color: "#6A625A",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: "#1F2933",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#E8CCAE",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2933",
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: "#0C5FA8",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#0C5FA8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  ssoPanel: {
    backgroundColor: "#F7EFE5",
    borderRadius: 16,
    padding: 15,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E9D4BC",
  },
  ssoTitle: {
    color: "#1F2933",
    fontSize: 16,
    fontWeight: "800",
  },
  ssoSubtitle: {
    color: "#6A625A",
    fontSize: 14,
    lineHeight: 21,
  },
  ssoButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D5E4F8",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ssoButtonMuted: {
    backgroundColor: "#F8F4EF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9DED1",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ssoButtonLeft: {
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
  ssoArrow: {
    color: "#0C5FA8",
    fontSize: 24,
    lineHeight: 24,
  },
  ssoMutedHint: {
    color: "#8A6B45",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  googleMark: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  googleMarkText: {
    color: "#0C5FA8",
    fontSize: 15,
    fontWeight: "900",
  },
  appleMark: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#1F2933",
    justifyContent: "center",
    alignItems: "center",
  },
  appleMarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  footer: {
    marginTop: 16,
    alignItems: "center",
    gap: 4,
    paddingBottom: 6,
  },
  footerCopy: {
    color: "#857A70",
    fontSize: 12,
    textAlign: "center",
  },
});
