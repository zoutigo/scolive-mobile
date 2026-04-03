import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useDrawer } from "./drawer-context";
import { useAuthStore } from "../../store/auth.store";
import { getViewType } from "./nav-config";
import { ScoliveLogo } from "../ScoliveLogo";

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
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.menuBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="header-menu-btn"
          accessibilityLabel="Ouvrir le menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu-outline" size={28} color={colors.white} />
        </TouchableOpacity>
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
  menuBtn: {
    marginLeft: "auto",
    padding: 4,
  },
});
