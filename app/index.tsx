import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../src/store/auth.store";
import { colors } from "../src/theme";
import { ConfirmDialog } from "../src/components/ConfirmDialog";
import LoginScreen from "./login";
import HomeScreen from "./(home)/index";

export default function IndexScreen() {
  const { isAuthenticated, isLoading, authErrorMessage, clearAuthError } =
    useAuthStore();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowFallback(false);
      return;
    }

    const timer = setTimeout(() => setShowFallback(true), 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container} testID="index-loading">
        <ActivityIndicator size="large" color={colors.primary} />
        {showFallback ? <View style={styles.fallbackDot} /> : null}
      </View>
    );
  }

  return (
    <>
      {isAuthenticated ? <HomeScreen /> : <LoginScreen />}
      <ConfirmDialog
        visible={!isLoading && !isAuthenticated && !!authErrorMessage}
        title="Session expirée"
        subtitle="Votre espace a été verrouillé en toute sécurité"
        message={
          authErrorMessage ||
          "Votre session a expiré. Veuillez vous connecter à nouveau."
        }
        icon="lock-closed-outline"
        variant="warning"
        confirmLabel="Se reconnecter"
        hideCancel
        onConfirm={clearAuthError}
        onCancel={clearAuthError}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackDot: {
    marginTop: 16,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});
