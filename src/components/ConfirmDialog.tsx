import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  /** Nom d'icône Ionicons affiché en haut du dialog */
  icon?: string;
  variant?: ConfirmDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_COLORS: Record<ConfirmDialogVariant, string> = {
  danger: "#DC3545",
  warning: "#D89B5B",
  info: "#0C5FA8",
};

const VARIANT_BG: Record<ConfirmDialogVariant, string> = {
  danger: "#FFF0F0",
  warning: "#FFF8F0",
  info: "#EEF4FF",
};

const DEFAULT_ICONS: Record<ConfirmDialogVariant, string> = {
  danger: "warning-outline",
  warning: "alert-circle-outline",
  info: "information-circle-outline",
};

export function ConfirmDialog({
  visible,
  title,
  message,
  icon,
  variant = "info",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 6,
          speed: 20,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const accentColor = VARIANT_COLORS[variant];
  const iconBg = VARIANT_BG[variant];
  const iconName = icon ?? DEFAULT_ICONS[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
      testID="confirm-dialog-modal"
    >
      {/* Overlay — clic en dehors = annulation */}
      <TouchableWithoutFeedback
        onPress={onCancel}
        testID="confirm-dialog-overlay"
      >
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Carte animée */}
      <View style={styles.centeredWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
          testID="confirm-dialog-card"
        >
          {/* Icône */}
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            <Ionicons
              name={iconName as "warning-outline"}
              size={36}
              color={accentColor}
              testID="confirm-dialog-icon"
            />
          </View>

          {/* Textes */}
          <Text style={styles.title} testID="confirm-dialog-title">
            {title}
          </Text>
          <Text style={styles.message} testID="confirm-dialog-message">
            {message}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.75}
              testID="confirm-dialog-cancel"
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: accentColor }]}
              onPress={onConfirm}
              activeOpacity={0.8}
              testID="confirm-dialog-confirm"
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  centeredWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 28,
    alignItems: "center",
    gap: 12,
    // Ombre
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    alignItems: "center",
    backgroundColor: colors.warmSurface,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
