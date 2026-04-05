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
  subtitle?: string;
  /** Nom d'icône Ionicons affiché en haut du dialog */
  icon?: string;
  variant?: ConfirmDialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
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
  subtitle,
  icon,
  variant = "info",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  hideCancel = false,
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
          <View
            style={[styles.accentBar, { backgroundColor: accentColor }]}
            testID="confirm-dialog-accent"
          />
          <View
            style={[
              styles.cornerGlow,
              {
                borderColor: `${accentColor}28`,
                backgroundColor: `${accentColor}08`,
              },
            ]}
          />
          <View
            style={[styles.glowOrb, { backgroundColor: `${accentColor}18` }]}
          />
          <View
            style={[
              styles.secondaryOrb,
              { backgroundColor: `${accentColor}10` },
            ]}
          />

          {/* Icône */}
          <View style={styles.heroWrap}>
            <View
              style={[
                styles.iconHalo,
                {
                  backgroundColor: `${accentColor}12`,
                  borderColor: `${accentColor}20`,
                },
              ]}
            />
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Ionicons
                name={iconName as "warning-outline"}
                size={36}
                color={accentColor}
                testID="confirm-dialog-icon"
              />
            </View>
          </View>

          {/* Textes */}
          <View
            style={[styles.badge, { backgroundColor: `${accentColor}14` }]}
            testID="confirm-dialog-badge"
          >
            <Text style={[styles.badgeLabel, { color: accentColor }]}>
              {variant === "danger"
                ? "Action sensible"
                : variant === "warning"
                  ? "Attention"
                  : "Information"}
            </Text>
          </View>
          <Text style={styles.title} testID="confirm-dialog-title">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} testID="confirm-dialog-subtitle">
              {subtitle}
            </Text>
          ) : null}
          <View
            style={[
              styles.messagePanel,
              {
                backgroundColor:
                  variant === "danger"
                    ? "#FFF7F7"
                    : variant === "warning"
                      ? "#FFF9F2"
                      : "#F5F9FF",
                borderColor: `${accentColor}18`,
              },
            ]}
          >
            <Text style={styles.message} testID="confirm-dialog-message">
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {hideCancel ? null : (
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
            )}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                hideCancel && styles.confirmBtnFull,
                { backgroundColor: accentColor },
              ]}
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 28,
    paddingTop: 34,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    // Ombre
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  cornerGlow: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 84,
    height: 84,
    borderRadius: 22,
    borderWidth: 1,
  },
  glowOrb: {
    position: "absolute",
    top: -18,
    right: -6,
    width: 120,
    height: 120,
    borderRadius: 999,
  },
  secondaryOrb: {
    position: "absolute",
    bottom: 72,
    left: -26,
    width: 92,
    height: 92,
    borderRadius: 999,
  },
  heroWrap: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  iconHalo: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 28,
    borderWidth: 1,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 2,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primaryDark,
    textAlign: "center",
    lineHeight: 21,
  },
  messagePanel: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.warmBorder,
    alignItems: "center",
    backgroundColor: colors.warmSurface,
    minHeight: 54,
    justifyContent: "center",
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    minHeight: 54,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmBtnFull: {
    flex: 0,
    width: "100%",
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
