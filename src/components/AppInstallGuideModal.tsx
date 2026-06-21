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

interface AppInstallGuideModalProps {
  visible: boolean;
  mandatory?: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: "globe-outline" as const,
    text: "Le téléchargement démarre dans votre navigateur. Attendez qu'il se termine.",
  },
  {
    icon: "lock-open-outline" as const,
    text: "Android vous demande d'autoriser l'installation depuis une \"source inconnue\". Appuyez sur Paramètres.",
  },
  {
    icon: "toggle-outline" as const,
    text: 'Activez l\'option "Autoriser depuis cette source" pour votre navigateur.',
  },
  {
    icon: "arrow-back-outline" as const,
    text: "Revenez en arrière et appuyez sur Installer. Vos données sont conservées.",
  },
];

export function AppInstallGuideModal({
  visible,
  mandatory = false,
  onClose,
}: AppInstallGuideModalProps) {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      testID="install-guide-modal"
    >
      <TouchableWithoutFeedback
        onPress={onClose}
        testID="install-guide-overlay"
      >
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.centeredWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
          testID="install-guide-card"
        >
          {/* Barre d'accent teal */}
          <View
            style={[styles.accentBar, { backgroundColor: colors.accentTeal }]}
            testID="install-guide-accent"
          />

          {/* Orbes */}
          <View style={styles.glowOrb} />
          <View style={styles.secondaryOrb} />

          {/* Icône héro */}
          <View style={styles.heroWrap}>
            <View style={styles.iconHalo} />
            <View style={styles.iconWrap} testID="install-guide-icon">
              <Ionicons
                name="shield-checkmark-outline"
                size={36}
                color={colors.accentTeal}
              />
            </View>
          </View>

          {/* Badge */}
          <View style={styles.badge} testID="install-guide-badge">
            <Text style={styles.badgeLabel}>Installation sécurisée</Text>
          </View>

          {/* Titre */}
          <Text style={styles.title} testID="install-guide-title">
            Autoriser l&apos;installation
          </Text>

          {/* Sous-titre */}
          <Text style={styles.subtitle} testID="install-guide-subtitle">
            Android bloque par défaut les APK hors Play Store. Suivez ces étapes
            simples :
          </Text>

          {/* Étapes */}
          <View style={styles.stepsContainer} testID="install-guide-steps">
            {STEPS.map((step, index) => (
              <View
                key={index}
                style={styles.stepRow}
                testID={`install-guide-step-${index}`}
              >
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={colors.accentTeal}
                    style={styles.stepIcon}
                  />
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Note */}
          <View style={styles.notePanel}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={colors.accentTeal}
              style={{ flexShrink: 0 }}
            />
            <Text style={styles.noteText}>
              Cette procédure ne s&apos;effectue qu&apos;une seule fois par
              navigateur. Les mises à jour suivantes seront plus rapides.
            </Text>
          </View>

          {/* Note de repli — installation refusée (signature incompatible) */}
          {mandatory && (
            <View
              style={styles.fallbackNotePanel}
              testID="install-guide-fallback-note"
            >
              <Ionicons
                name="alert-circle-outline"
                size={15}
                color={colors.warmAccent}
                style={{ flexShrink: 0 }}
              />
              <Text style={styles.fallbackNoteText}>
                Si l&apos;installation est refusée, désinstallez d&apos;abord
                l&apos;application Scolive puis recommencez le téléchargement.
              </Text>
            </View>
          )}

          {/* Bouton */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            testID="install-guide-close"
            accessibilityRole="button"
            accessibilityLabel="J'ai compris"
          >
            <Text style={styles.closeBtnLabel}>J&apos;ai compris</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  centeredWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
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
  glowOrb: {
    position: "absolute",
    top: -18,
    right: -6,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: `${colors.accentTeal}12`,
  },
  secondaryOrb: {
    position: "absolute",
    bottom: 50,
    left: -28,
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: `${colors.accentTeal}08`,
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
    borderColor: `${colors.accentTeal}20`,
    backgroundColor: `${colors.accentTeal}10`,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FAF8",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${colors.accentTeal}14`,
    marginTop: 2,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: colors.accentTeal,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  stepsContainer: {
    width: "100%",
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  stepContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  stepIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  notePanel: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F0FAF8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}20`,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.accentTealDark,
    lineHeight: 18,
    fontStyle: "italic",
  },
  fallbackNotePanel: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF8F0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.warmAccent}30`,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fallbackNoteText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  closeBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: colors.accentTeal,
    minHeight: 54,
    justifyContent: "center",
    marginTop: 4,
    shadowColor: colors.accentTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  closeBtnLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
