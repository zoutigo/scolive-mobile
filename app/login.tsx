import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/theme";

type AuthTab = "phone" | "email";

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

      <View style={styles.hero}>
        <Text style={styles.kicker}>Scolive Mobile</Text>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>
          Le rendu React Native est maintenant stable sur l&apos;émulateur.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.tabs}>
          <Pressable
            testID="tab-phone"
            onPress={() => setTab("phone")}
            style={[styles.tab, tab === "phone" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, tab === "phone" && styles.tabTextActive]}
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
              style={[styles.tabText, tab === "email" && styles.tabTextActive]}
            >
              Email
            </Text>
          </Pressable>
        </View>

        {tab === "phone" ? (
          <View style={styles.form}>
            <Text style={styles.label}>Numéro</Text>
            <TextInput
              testID="input-phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="6XXXXXXXX"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#8A847D"
            />
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
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="input-email"
              value={email}
              onChangeText={setEmail}
              placeholder="prenom.nom@ecole.fr"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#8A847D"
            />
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              testID="input-password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#8A847D"
            />
          </View>
        )}

        <Pressable style={styles.primaryButton} testID="submit-login">
          <Text style={styles.primaryButtonText}>Continuer</Text>
        </Pressable>

        <View style={styles.devBadge} testID="dev-badge">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.devBadgeText}>
            Build dev Android opérationnel
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F1E8",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  hero: {
    marginBottom: 24,
    gap: 8,
  },
  kicker: {
    color: "#0C5FA8",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  title: {
    color: "#1F2933",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: {
    color: "#5F5A52",
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFDFC",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7D8C8",
    padding: 20,
    gap: 18,
    shadowColor: "#3A2B17",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#F3DFC7",
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#0C5FA8",
  },
  tabText: {
    color: "#6B6259",
    fontSize: 15,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  form: {
    gap: 10,
  },
  label: {
    color: "#1F2933",
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8CCAE",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2933",
  },
  primaryButton: {
    backgroundColor: "#0C5FA8",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  devBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EEF6FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  devBadgeText: {
    color: "#0C5FA8",
    fontSize: 14,
    fontWeight: "600",
  },
});
