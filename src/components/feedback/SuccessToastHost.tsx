import React, { useEffect } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  SUCCESS_TOAST_DURATION_MS,
  useSuccessToastStore,
} from "../../store/success-toast.store";
import { colors } from "../../theme";

export function SuccessToastHost() {
  const { visible, variant, title, message, hide } = useSuccessToastStore();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      hide();
    }, SUCCESS_TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [hide, visible]);

  if (!visible) {
    return null;
  }

  const isError = variant === "error";

  return (
    <View
      pointerEvents="box-none"
      style={styles.overlay}
      testID="success-toast-overlay"
    >
      <Animated.View
        style={[styles.card, isError ? styles.cardError : styles.cardSuccess]}
        testID="success-toast-card"
      >
        <View
          style={[
            styles.accentBar,
            isError ? styles.accentBarError : styles.accentBarSuccess,
          ]}
        />
        <View
          style={[
            styles.iconWrap,
            isError ? styles.iconWrapError : styles.iconWrapSuccess,
          ]}
        >
          <Ionicons
            name={isError ? "alert-circle" : "checkmark-circle"}
            size={24}
            color={isError ? colors.warmAccent : colors.accentTeal}
          />
        </View>
        <View style={styles.content}>
          <Text
            style={[
              styles.eyebrow,
              isError ? styles.eyebrowError : styles.eyebrowSuccess,
            ]}
            testID="success-toast-variant"
          >
            {isError ? "Échec" : "Succès"}
          </Text>
          <Text style={styles.title} testID="success-toast-title">
            {title}
          </Text>
          <Text style={styles.message} testID="success-toast-message">
            {message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={hide}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID="success-toast-close"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  cardSuccess: {
    borderColor: colors.warmBorder,
  },
  cardError: {
    borderColor: "rgba(224, 115, 42, 0.35)",
  },
  accentBar: {
    width: 6,
  },
  accentBarSuccess: {
    backgroundColor: colors.accentTeal,
  },
  accentBarError: {
    backgroundColor: colors.warmAccent,
  },
  iconWrap: {
    marginLeft: 14,
    marginTop: 14,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSuccess: {
    backgroundColor: "rgba(44, 167, 147, 0.12)",
  },
  iconWrapError: {
    backgroundColor: "rgba(224, 115, 42, 0.12)",
  },
  content: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 3,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  eyebrowSuccess: {
    color: colors.accentTeal,
  },
  eyebrowError: {
    color: colors.warmAccent,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: 14,
  },
});
