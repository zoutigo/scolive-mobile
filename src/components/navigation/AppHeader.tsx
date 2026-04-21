import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useDrawer } from "./drawer-context";
import { useAuthStore } from "../../store/auth.store";
import { getViewType } from "./nav-config";
import { ScoliveLogo } from "../ScoliveLogo";
import { HeaderMenuButton } from "./HeaderMenuButton";

/** Convertit un slug en nom lisible : "college-vogt" → "College Vogt" */
export function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function AppHeader() {
  const { openDrawer } = useDrawer();
  const { user, schoolSlug } = useAuthStore();

  const centerTitle = useMemo(() => {
    const view = user ? getViewType(user) : "unknown";
    if (view === "platform") return "SCOLIVE";
    if (schoolSlug) return slugToDisplayName(schoolSlug).toUpperCase();
    return "SCOLIVE";
  }, [user, schoolSlug]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.bar}>
        {/* Blobs décoratifs */}
        <View style={styles.blobTopRight} pointerEvents="none" />
        <View style={styles.blobBottomLeft} pointerEvents="none" />
        <View style={styles.blobMid} pointerEvents="none" />

        {/* Logo — gauche */}
        <ScoliveLogo size={34} testID="header-logo" />

        {/* Titre centré (nom app ou nom école) */}
        <Text
          style={styles.title}
          numberOfLines={1}
          testID="header-title"
          pointerEvents="none"
        >
          {centerTitle}
        </Text>

        {/* Bouton menu — droite */}
        <HeaderMenuButton
          onPress={openDrawer}
          testID="header-menu-btn"
          style={styles.menuBtnSpacer}
        />
      </View>
    </SafeAreaView>
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
  menuBtnSpacer: {
    marginLeft: "auto",
  },
});
