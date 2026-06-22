import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { colors } from "../../theme";
import { useDrawer } from "./drawer-context";
import { useAuthStore } from "../../store/auth.store";
import { useTranslation } from "../../i18n/useTranslation";

/** Hauteur du contenu de la barre, hors zone de sécurité bas (insets.bottom). */
export const BOTTOM_TAB_BAR_HEIGHT = 58;

type TabKey = "home" | "account" | "assistance" | "menu" | "tests";

interface TabDef {
  key: TabKey;
  labelKey: string;
  activeIcon: React.ComponentProps<typeof Ionicons>["name"];
  inactiveIcon: React.ComponentProps<typeof Ionicons>["name"];
}

const BASE_TABS: TabDef[] = [
  {
    key: "home",
    labelKey: "nav.tabs.home",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  {
    key: "account",
    labelKey: "nav.tabs.account",
    activeIcon: "person-circle",
    inactiveIcon: "person-circle-outline",
  },
  {
    key: "assistance",
    labelKey: "nav.tabs.assistance",
    activeIcon: "help-circle",
    inactiveIcon: "help-circle-outline",
  },
  {
    key: "menu",
    labelKey: "nav.tabs.menu",
    activeIcon: "menu",
    inactiveIcon: "menu-outline",
  },
];

const TESTS_TAB: TabDef = {
  key: "tests",
  labelKey: "nav.tabs.tests",
  activeIcon: "clipboard",
  inactiveIcon: "clipboard-outline",
};

function normalize(pathname: string): string {
  const withoutGroup = pathname.replace("/(home)", "");
  return withoutGroup === "" ? "/" : withoutGroup;
}

export function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { openDrawer } = useDrawer();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const isTester = Boolean(user?.isTester);
  const tabs = useMemo(
    () => (isTester ? [...BASE_TABS, TESTS_TAB] : BASE_TABS),
    [isTester],
  );

  const normalized = normalize(pathname);
  const isHomeActive =
    normalized === "/" || normalized === "/index" || normalized === "";
  const isAccountActive =
    normalized === "/account" || normalized.startsWith("/account/");
  const isAssistanceActive =
    normalized === "/tickets" || normalized.startsWith("/tickets/");
  const isTestsActive =
    normalized === "/tests" || normalized.startsWith("/tests/");
  const isMenuActive =
    !isHomeActive && !isAccountActive && !isAssistanceActive && !isTestsActive;

  const isActive = (key: TabKey): boolean => {
    switch (key) {
      case "home":
        return isHomeActive;
      case "account":
        return isAccountActive;
      case "assistance":
        return isAssistanceActive;
      case "tests":
        return isTestsActive;
      case "menu":
        return isMenuActive;
      default:
        return false;
    }
  };

  const handlePress = (tab: TabDef) => {
    if (tab.key === "menu") {
      openDrawer();
      return;
    }
    if (isActive(tab.key)) return;
    switch (tab.key) {
      case "home":
        router.push("/" as never);
        break;
      case "account":
        router.push("/account" as never);
        break;
      case "assistance":
        router.push("/(home)/tickets" as never);
        break;
      case "tests":
        router.push("/(home)/tests" as never);
        break;
    }
  };

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      testID="bottom-tab-bar"
    >
      {tabs.map((tab) => {
        const active = isActive(tab.key);
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => handlePress(tab)}
            style={styles.tab}
            activeOpacity={0.7}
            testID={`bottom-tab-${tab.key}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(tab.labelKey)}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons
                name={active ? tab.activeIcon : tab.inactiveIcon}
                size={22}
                color={active ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
              testID={`bottom-tab-${tab.key}-label`}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_TAB_BAR_HEIGHT,
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingTop: 6,
  },
  iconWrap: {
    width: 40,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.warmHighlight,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
