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

interface AppUpdateModalProps {
  visible: boolean;
  mandatory?: boolean;
  currentVersionName: string | null;
  latestVersionName: string | null;
  onDismiss: () => void;
  onDownload: () => void;
}

export function AppUpdateModal({
  visible,
  mandatory = false,
  currentVersionName,
  latestVersionName,
  onDismiss,
  onDownload,
}: AppUpdateModalProps) {
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

  const accentColor = mandatory ? colors.warmAccent : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={mandatory ? undefined : onDismiss}
      testID="app-update-modal"
    >
      {mandatory ? (
        <View style={styles.overlay} testID="app-update-overlay" />
      ) : (
        <TouchableWithoutFeedback
          onPress={onDismiss}
          testID="app-update-overlay"
        >
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.centeredWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
          testID="app-update-card"
        >
          {/* Barre d'accent supérieure */}
          <View
            style={[styles.accentBar, { backgroundColor: accentColor }]}
            testID="app-update-accent"
          />

          {/* Orbes décoratifs */}
          <View style={styles.glowOrb} />
          <View style={styles.secondaryOrb} />
          <View style={styles.cornerGlow} />

          {/* Icône héro */}
          <View style={styles.heroWrap}>
            <View style={styles.iconHalo} />
            <View style={styles.iconWrap} testID="app-update-icon">
              <Ionicons
                name={mandatory ? "warning-outline" : "cloud-download-outline"}
                size={36}
                color={accentColor}
              />
            </View>
          </View>

          {/* Badge */}
          <View
            style={[styles.badge, mandatory && styles.badgeMandatory]}
            testID="app-update-badge"
          >
            <Text
              style={[
                styles.badgeLabel,
                mandatory && styles.badgeLabelMandatory,
              ]}
            >
              {mandatory ? "Mise à jour obligatoire" : "Mise à jour disponible"}
            </Text>
          </View>

          {/* Titre */}
          <Text style={styles.title} testID="app-update-title">
            {mandatory ? "Mise à jour requise" : "Nouvelle version"}
          </Text>

          {/* Versions */}
          <View style={styles.versionsRow} testID="app-update-versions">
            <View style={styles.versionBlock}>
              <Text style={styles.versionLabel}>Installée</Text>
              <Text style={styles.versionValue} testID="app-update-current">
                v{currentVersionName ?? "—"}
              </Text>
            </View>
            <View style={styles.versionArrow}>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.warmAccent}
              />
            </View>
            <View style={styles.versionBlock}>
              <Text style={styles.versionLabel}>Disponible</Text>
              <Text
                style={[styles.versionValue, styles.versionValueNew]}
                testID="app-update-latest"
              >
                v{latestVersionName ?? "—"}
              </Text>
            </View>
          </View>

          {/* Panneau message */}
          <View
            style={[
              styles.messagePanel,
              mandatory && styles.messagePanelMandatory,
            ]}
          >
            {mandatory ? (
              <Text style={styles.message} testID="app-update-message">
                Cette version n&apos;est plus compatible. Téléchargez et
                installez la nouvelle version pour continuer à utiliser Scolive.
                En cas d&apos;échec de l&apos;installation, désinstallez
                d&apos;abord l&apos;application puis recommencez.
              </Text>
            ) : (
              <Text style={styles.message} testID="app-update-message">
                Une nouvelle version de Scolive est disponible. Mettez à jour
                pour bénéficier des dernières fonctionnalités et améliorations
                de sécurité.
              </Text>
            )}
          </View>

          {/* Boutons */}
          <View style={styles.actions}>
            {!mandatory && (
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={onDismiss}
                activeOpacity={0.75}
                testID="app-update-dismiss"
                accessibilityRole="button"
                accessibilityLabel="Plus tard"
              >
                <Text style={styles.dismissLabel}>Plus tard</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.downloadBtn,
                mandatory && styles.downloadBtnFull,
                mandatory && { backgroundColor: colors.warmAccent },
              ]}
              onPress={onDownload}
              activeOpacity={0.8}
              testID="app-update-download"
              accessibilityRole="button"
              accessibilityLabel={
                mandatory ? "Télécharger et installer" : "Télécharger"
              }
            >
              <Ionicons
                name="download-outline"
                size={17}
                color={colors.white}
                style={styles.downloadBtnIcon}
              />
              <Text style={styles.downloadLabel}>
                {mandatory ? "Télécharger et installer" : "Télécharger"}
              </Text>
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
    backgroundColor: "rgba(0,0,0,0.58)",
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
    backgroundColor: `${colors.primary}14`,
  },
  secondaryOrb: {
    position: "absolute",
    bottom: 60,
    left: -28,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: `${colors.warmAccent}10`,
  },
  cornerGlow: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 84,
    height: 84,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
    backgroundColor: `${colors.primary}06`,
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
    borderColor: `${colors.primary}20`,
    backgroundColor: `${colors.primary}10`,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${colors.primary}14`,
    marginTop: 2,
  },
  badgeMandatory: {
    backgroundColor: `${colors.warmAccent}20`,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: colors.primary,
  },
  badgeLabelMandatory: {
    color: colors.warmAccent,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    lineHeight: 28,
  },
  versionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    width: "100%",
    justifyContent: "center",
  },
  versionBlock: {
    alignItems: "center",
    gap: 4,
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  versionValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  versionValueNew: {
    color: colors.primary,
  },
  versionArrow: {
    marginTop: 14,
  },
  messagePanel: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${colors.primary}18`,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F5F9FF",
  },
  messagePanelMandatory: {
    borderColor: `${colors.warmAccent}30`,
    backgroundColor: "#FFF8F0",
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  dismissBtn: {
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
  dismissLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  downloadBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: colors.primary,
    minHeight: 54,
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  downloadBtnFull: {
    flex: 1,
  },
  downloadBtnIcon: {},
  downloadLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
