import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../src/store/auth.store";
import { colors } from "../src/theme";
import LoginScreen from "./login";
import HomeScreen from "./(home)/index";

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuthStore();
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

  if (isAuthenticated) {
    return <HomeScreen />;
  }

  return <LoginScreen />;
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
