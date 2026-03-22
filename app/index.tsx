import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { colors } from "../src/theme";

const FEATURES = [
  { icon: "📊", label: "Suivi des notes en temps réel" },
  { icon: "💬", label: "Messagerie école-famille" },
  { icon: "📖", label: "Cahier de vie numérique" },
  { icon: "📅", label: "Gestion des absences" },
];

export default function HomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={styles.titleAccent}>Sco</Text>
          <Text style={styles.titleMain}>live</Text>
        </Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.subtitle}>La vie scolaire, simplifiée.</Text>
      </View>

      {/* Feature cards */}
      <View style={styles.cardsGrid}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardIcon}>{f.icon}</Text>
            <Text style={styles.cardLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerAccent} />
        <Text style={styles.bannerText}>
          Connectez école, enseignants et familles en un seul endroit.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2026 Scolive — Tous droits réservés</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 8,
  },
  titleAccent: { color: colors.primary },
  titleMain: { color: colors.primaryDark },
  titleUnderline: {
    width: 56,
    height: 4,
    backgroundColor: colors.warmAccent,
    borderRadius: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
    marginBottom: 32,
  },
  card: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
    shadowColor: "#4D3820",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: { fontSize: 24 },
  cardLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
    lineHeight: 18,
  },
  banner: {
    width: "100%",
    backgroundColor: colors.warmHighlight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  bannerAccent: {
    width: 4,
    minHeight: 40,
    backgroundColor: colors.warmAccent,
    borderRadius: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  footer: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.5,
  },
});
