import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../src/store/auth.store";
import { colors } from "../src/theme";
import { ConfirmDialog } from "../src/components/ConfirmDialog";
import { useTranslation } from "../src/i18n/useTranslation";
import LoginScreen from "./login";
import HomeScreen from "./(home)/index";

export default function IndexScreen() {
  const { isAuthenticated, isLoading, authErrorMessage, clearAuthError } =
    useAuthStore();
  const { t } = useTranslation();
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
        title={t("app.sessionExpired.title")}
        subtitle={t("app.sessionExpired.subtitle")}
        message={authErrorMessage || t("app.sessionExpired.message")}
        icon="lock-closed-outline"
        variant="warning"
        confirmLabel={t("app.sessionExpired.reconnect")}
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
