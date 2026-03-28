import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuthStore } from "../../src/store/auth.store";
import { colors } from "../../src/theme";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  const displayName = user ? `${user.firstName} ${user.lastName}` : "—";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.welcome}>Bienvenue</Text>
        <Text style={styles.name} testID="user-name">
          {displayName}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        testID="logout-button"
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  welcome: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  logoutButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
