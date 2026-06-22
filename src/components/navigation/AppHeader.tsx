import React, { useMemo, useState } from "react";
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { getRoleLabel, getViewType } from "./nav-config";
import { useHeaderScroll } from "./header-scroll-context";
import { useTranslation } from "../../i18n/useTranslation";
import { ConfirmDialog } from "../ConfirmDialog";

/** Convertit un slug en nom lisible : "college-vogt" → "College Vogt" */
export function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isHomePath(pathname: string): boolean {
  const normalized = pathname.replace("/(home)", "");
  return normalized === "" || normalized === "/" || normalized === "/index";
}

export function AppHeader() {
  const { user, schoolSlug, logout } = useAuthStore();
  const { translateY } = useHeaderScroll();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

  const isHome = isHomePath(pathname);

  const centerTitle = useMemo(() => {
    const view = user ? getViewType(user) : "unknown";
    if (view === "platform") return "SCOLIVE";
    if (schoolSlug) return slugToDisplayName(schoolSlug).toUpperCase();
    return "SCOLIVE";
  }, [user, schoolSlug]);

  const userFullName = user ? `${user.firstName} ${user.lastName}` : "";
  const userRoleLabel = user ? getRoleLabel(user) : "";

  const handleAuthButtonPress = () => {
    if (user) {
      setConfirmLogoutVisible(true);
    } else {
      router.replace("/login" as never);
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ translateY: Animated.multiply(translateY, -1) }] }}
    >
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.bar} testID="app-header">
          {/* Blobs décoratifs */}
          <View style={styles.blobTopRight} pointerEvents="none" />
          <View style={styles.blobBottomLeft} pointerEvents="none" />
          <View style={styles.blobMid} pointerEvents="none" />

          {isHome ? (
            <>
              <View style={styles.homeLeft} testID="app-header-home-left">
                <Text
                  style={styles.homeName}
                  numberOfLines={1}
                  testID="app-header-home-name"
                >
                  {userFullName}
                </Text>
                {userRoleLabel ? (
                  <Text
                    style={styles.homeRole}
                    numberOfLines={1}
                    testID="app-header-home-role"
                  >
                    {userRoleLabel}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={handleAuthButtonPress}
                style={styles.authBtn}
                testID="app-header-auth-btn"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={
                  user
                    ? t("header.home.logoutAction")
                    : t("header.home.loginAction")
                }
              >
                <Ionicons
                  name={user ? "log-out-outline" : "log-in-outline"}
                  size={22}
                  color={colors.white}
                />
              </TouchableOpacity>
            </>
          ) : (
            <Text
              style={styles.title}
              numberOfLines={1}
              testID="app-header-title"
              pointerEvents="none"
            >
              {centerTitle}
            </Text>
          )}
        </View>
      </SafeAreaView>

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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  bar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  blobTopRight: {
    position: "absolute",
    top: -38,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "#F7C260",
    opacity: 0.09,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -38,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: "#E07B2A",
    opacity: 0.11,
  },
  blobMid: {
    position: "absolute",
    top: -24,
    right: 100,
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.05,
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  homeLeft: {
    flex: 1,
    gap: 1,
  },
  homeName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  homeRole: {
    color: colors.warmAccent,
    fontSize: 12,
    fontWeight: "500",
  },
  authBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(216,155,91,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(216,155,91,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
