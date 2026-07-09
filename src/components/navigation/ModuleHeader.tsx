import React, { useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { HeaderBackButton } from "./HeaderBackButton";
import { useHeaderScroll, HEADER_HIDE_DISTANCE } from "./header-scroll-context";
import { useAuthStore } from "../../store/auth.store";
import { ConfirmDialog } from "../ConfirmDialog";
import { useTranslation } from "../../i18n/useTranslation";

interface ModuleHeaderSecondaryAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
  /** Visually marks the action as toggled on (e.g. a search panel that is open). */
  active?: boolean;
}

interface ModuleHeaderProps {
  title: string;
  /** Segment appended after `title`, rendered in warm color (e.g. an unread/total counter). */
  titleHighlight?: string;
  subtitle?: string | null;
  onBack: () => void;
  testID?: string;
  backTestID?: string;
  titleTestID?: string;
  subtitleTestID?: string;
  topInset?: number;
  backgroundColor?: string;
  titleUppercase?: boolean;
  /** Extra icon button rendered left of the kebab menu (e.g. a search toggle). */
  secondaryAction?: ModuleHeaderSecondaryAction;
}

export function ModuleHeader({
  title,
  titleHighlight,
  subtitle,
  onBack,
  testID = "module-header",
  backTestID = "module-header-back",
  titleTestID = "module-header-title",
  subtitleTestID = "module-header-subtitle",
  topInset = 0,
  backgroundColor = colors.primary,
  titleUppercase = true,
  secondaryAction,
}: ModuleHeaderProps) {
  const { translateY } = useHeaderScroll();
  const { logout } = useAuthStore();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

  const androidStatusInset =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
  const resolvedTopInset = Math.max(topInset, androidStatusInset);

  return (
    <>
      <Animated.View
        style={{
          transform: [
            {
              translateY: translateY.interpolate({
                inputRange: [0, HEADER_HIDE_DISTANCE],
                outputRange: [0, -HEADER_HIDE_DISTANCE],
                extrapolate: "clamp",
              }),
            },
          ],
        }}
      >
        <View
          style={[
            styles.headerCard,
            { paddingTop: resolvedTopInset + 10, backgroundColor },
          ]}
          testID={testID}
        >
          {/* Blobs décoratifs */}
          <View style={styles.blobTopRight} pointerEvents="none" />
          <View style={styles.blobBottomLeft} pointerEvents="none" />
          <View style={styles.blobMid} pointerEvents="none" />

          <HeaderBackButton onPress={onBack} testID={backTestID} />
          <View style={styles.headerText}>
            <Text
              style={[styles.title, !titleUppercase && styles.titleNormalCase]}
              numberOfLines={1}
              testID={titleTestID}
            >
              {title}
              {titleHighlight ? (
                <Text style={styles.titleHighlight}>{titleHighlight}</Text>
              ) : null}
            </Text>
            {subtitle ? (
              <Text
                style={styles.subtitle}
                numberOfLines={1}
                testID={subtitleTestID}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {secondaryAction ? (
            <TouchableOpacity
              onPress={secondaryAction.onPress}
              style={[
                styles.kebabBtn,
                secondaryAction.active && styles.secondaryActionActive,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={secondaryAction.accessibilityLabel}
              accessibilityRole="button"
              testID={
                secondaryAction.testID ?? "module-header-secondary-action"
              }
            >
              <Ionicons
                name={secondaryAction.icon}
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.kebabBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Menu"
            accessibilityRole="button"
            testID="module-header-menu"
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Dropdown menu — Modal transparent pour fermeture au tap extérieur */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={styles.menuBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.menuPanel}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuOpen(false);
                    setConfirmLogoutVisible(true);
                  }}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={colors.notification}
                  />
                  <Text style={styles.menuItemLogout}>
                    {t("header.home.logoutAction")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ConfirmDialog
        visible={confirmLogoutVisible}
        variant="danger"
        icon="log-out-outline"
        title={t("header.home.logoutConfirmTitle")}
        message={t("header.home.logoutConfirmMessage")}
        confirmLabel={t("header.home.logoutConfirmConfirm")}
        cancelLabel={t("header.home.logoutConfirmCancel")}
        onConfirm={() => {
          setConfirmLogoutVisible(false);
          logout();
        }}
        onCancel={() => setConfirmLogoutVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  blobTopRight: {
    position: "absolute",
    top: -60,
    right: -45,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "#F7C260",
    opacity: 0.09,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -50,
    left: -25,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "#E07B2A",
    opacity: 0.11,
  },
  blobMid: {
    position: "absolute",
    top: -30,
    right: 90,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.05,
  },
  kebabBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(216,155,91,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(216,155,91,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionActive: {
    backgroundColor: "rgba(216,155,91,0.55)",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "600",
    textTransform: "uppercase",
    textAlign: "center",
  },
  titleNormalCase: {
    textTransform: "none",
    fontSize: 15,
    fontWeight: "600",
  },
  titleHighlight: {
    color: colors.warmAccent,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.warmAccent,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  menuPanel: {
    position: "absolute",
    top: 72,
    right: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 180,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemLogout: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.notification,
  },
});
