import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { colors } from "../../theme";
import { ConfirmDialog } from "../ConfirmDialog";
import type { NavItem } from "./nav-config";

const DRAWER_WIDTH = 288;
const BAR_HEIGHT = 56; // hauteur de la barre header (hors status bar)
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  portalLabel: string;
  userFullName: string;
  userInitials: string;
  userRole: string;
  onLogout: () => void;
}

export function AppDrawer({
  isOpen,
  onClose,
  navItems,
  portalLabel,
  userFullName,
  userInitials,
  userRole,
  onLogout,
}: AppDrawerProps) {
  const insets = useSafeAreaInsets();
  const drawerTop = insets.top + BAR_HEIGHT;
  const drawerBottom = insets.bottom;

  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 24,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, overlayOpacity, translateX]);

  const handleNavPress = (item: NavItem) => {
    onClose();
    setTimeout(() => {
      if (item.params) {
        router.push({
          pathname: item.route as "/placeholder",
          params: item.params,
        });
      } else {
        router.push(item.route as "/");
      }
    }, 120);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.key === "home") {
      return pathname === "/" || pathname === "/index" || pathname === "";
    }
    return false;
  };

  return (
    <View
      style={[StyleSheet.absoluteFillObject, styles.root]}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      {/* Overlay (dark background) */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
          testID="drawer-overlay"
        />
      </Animated.View>

      {/* Drawer panel — ancré à droite, entre bas du header et barre de nav */}
      <Animated.View
        testID="drawer-panel"
        style={[
          styles.drawer,
          { top: drawerTop, bottom: drawerBottom, transform: [{ translateX }] },
        ]}
      >
        {/* En-tête utilisateur */}
        <View style={styles.drawerHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{userInitials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userFullName}
            </Text>
            <Text style={styles.userRoleText} numberOfLines={1}>
              {userRole}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Portal badge */}
        <View style={styles.portalBadgeRow}>
          <View style={styles.portalBadge}>
            <Text style={styles.portalBadgeText}>{portalLabel}</Text>
          </View>
        </View>

        {/* Nav items */}
        <ScrollView
          style={styles.navList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.navContent}
        >
          {navItems.map((item) => {
            const active = isItemActive(item);
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => handleNavPress(item)}
                activeOpacity={0.7}
                testID={`nav-item-${item.key}`}
                accessibilityLabel={item.label}
              >
                {/* Active bar on the LEFT inside the right-side drawer */}
                {active && <View style={styles.activeBar} />}
                <Ionicons
                  name={item.icon as "home-outline"}
                  size={20}
                  color={active ? colors.warmAccent : "rgba(255,255,255,0.72)"}
                />
                <Text
                  style={[styles.navLabel, active && styles.navLabelActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bouton de déconnexion — ouvre la confirmation */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={() => setConfirmLogoutVisible(true)}
          activeOpacity={0.7}
          testID="drawer-logout-btn"
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="rgba(255,255,255,0.55)"
          />
          <Text style={styles.logoutLabel}>Se déconnecter</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Dialog de confirmation de déconnexion */}
      <ConfirmDialog
        visible={confirmLogoutVisible}
        variant="danger"
        icon="log-out-outline"
        title="Se déconnecter ?"
        message="Vous serez redirigé vers l'écran de connexion. Vos données locales seront effacées."
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        onConfirm={() => {
          setConfirmLogoutVisible(false);
          onClose();
          onLogout();
        }}
        onCancel={() => setConfirmLogoutVisible(false)}
      />

      {/* Tap zone to the left of the drawer closes it */}
      {isOpen && (
        <TouchableOpacity
          style={[
            styles.sideHitArea,
            { width: SCREEN_WIDTH - DRAWER_WIDTH, left: 0 },
          ]}
          onPress={onClose}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  // Drawer sits on the RIGHT — top/bottom sont injectés dynamiquement via style inline
  drawer: {
    position: "absolute",
    right: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.sidebarBg,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    overflow: "hidden",
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    gap: 12,
  },
  closeBtn: {
    padding: 4,
    marginLeft: "auto",
  },
  avatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.warmAccent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLargeText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  userRoleText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  portalBadgeRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  portalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  portalBadgeText: {
    color: colors.warmAccent,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  navList: {
    flex: 1,
  },
  navContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    gap: 14,
    position: "relative",
  },
  navItemActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  navLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    fontWeight: "400",
    flex: 1,
  },
  navLabelActive: {
    color: colors.white,
    fontWeight: "600",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: colors.warmAccent,
    borderRadius: 2,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 14,
  },
  logoutLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 15,
  },
  sideHitArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
});
