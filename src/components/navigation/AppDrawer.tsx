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
import { useFamilyStore } from "../../store/family.store";
import type { NavItem, ParentChildSection } from "./nav-config";

const DRAWER_WIDTH = 288;
const BAR_HEIGHT = 56;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  /** Sections enfants — uniquement pour le rôle PARENT */
  childSections?: ParentChildSection[];
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
  childSections,
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
  const { activeChildId, setActiveChild } = useFamilyStore();
  // "general" = section parent ouverte ; "child-{id}" = section enfant ouverte
  const [openSection, setOpenSection] = useState<string>(
    activeChildId ? `child-${activeChildId}` : "general",
  );

  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const pathname = usePathname();

  const hasChildren = (childSections?.length ?? 0) > 0;

  // Synchronise la section ouverte quand l'enfant actif change dans le store
  useEffect(() => {
    setOpenSection(activeChildId ? `child-${activeChildId}` : "general");
  }, [activeChildId]);

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
    const childItemMatch = item.key.match(/^child-([^-]+)-/);
    if (childItemMatch?.[1]) {
      setActiveChild(childItemMatch[1]);
    }
    onClose();
    setTimeout(() => {
      if (item.params) {
        router.push({
          pathname: item.route as never,
          params: item.params,
        });
      } else {
        router.push(item.route as never);
      }
    }, 120);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.key === "home" || item.key.endsWith("-home")) {
      return pathname === "/" || pathname === "/index" || pathname === "";
    }
    if (!item.route || item.route === "/placeholder") {
      return false;
    }
    return pathname === item.route || pathname.startsWith(`${item.route}/`);
  };

  function initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  return (
    <View
      style={[StyleSheet.absoluteFillObject, styles.root]}
      pointerEvents={isOpen ? "auto" : "none"}
      testID="drawer-root"
    >
      {/* Overlay */}
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

      {/* Drawer panel */}
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

        {/* Nav — mode accordéon si parent avec enfants, sinon liste simple */}
        <ScrollView
          style={styles.navList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.navContent}
        >
          {hasChildren ? (
            <>
              {/* ── Section "Mon espace famille" ── */}
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setOpenSection("general")}
                activeOpacity={0.7}
                testID="drawer-section-general"
              >
                <Ionicons
                  name="home-outline"
                  size={16}
                  color={
                    openSection === "general"
                      ? colors.warmAccent
                      : "rgba(255,255,255,0.5)"
                  }
                />
                <Text
                  style={[
                    styles.sectionHeaderText,
                    openSection === "general" && styles.sectionHeaderTextActive,
                  ]}
                >
                  Mon espace famille
                </Text>
                <Ionicons
                  name={
                    openSection === "general"
                      ? "chevron-down"
                      : "chevron-forward"
                  }
                  size={14}
                  color="rgba(255,255,255,0.4)"
                />
              </TouchableOpacity>

              {openSection === "general" &&
                navItems.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <NavRow
                      key={item.key}
                      item={item}
                      active={active}
                      onPress={handleNavPress}
                      indented
                    />
                  );
                })}

              {/* ── Sections par enfant ── */}
              {childSections!.map((child) => {
                const sectionKey = `child-${child.id}`;
                const isOpen = openSection === sectionKey;
                const childInitials = initials(child.firstName, child.lastName);

                return (
                  <View key={child.id}>
                    <TouchableOpacity
                      style={styles.sectionHeader}
                      onPress={() => setOpenSection(sectionKey)}
                      activeOpacity={0.7}
                      testID={`drawer-section-child-${child.id}`}
                    >
                      <View style={styles.childAvatar}>
                        <Text style={styles.childAvatarText}>
                          {childInitials}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.sectionHeaderText,
                          isOpen && styles.sectionHeaderTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {child.lastName} {child.firstName}
                      </Text>
                      <Ionicons
                        name={isOpen ? "chevron-down" : "chevron-forward"}
                        size={14}
                        color="rgba(255,255,255,0.4)"
                      />
                    </TouchableOpacity>

                    {isOpen &&
                      child.navItems.map((item) => {
                        const active = isItemActive(item);
                        return (
                          <NavRow
                            key={item.key}
                            item={item}
                            active={active}
                            onPress={handleNavPress}
                            indented
                          />
                        );
                      })}
                  </View>
                );
              })}
            </>
          ) : (
            // Mode simple (non-parent)
            navItems.map((item) => {
              const active = isItemActive(item);
              return (
                <NavRow
                  key={item.key}
                  item={item}
                  active={active}
                  onPress={handleNavPress}
                />
              );
            })
          )}
        </ScrollView>

        {/* Bouton de déconnexion */}
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

      {/* Dialog confirmation déconnexion */}
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

      {/* Zone de clic à gauche du drawer */}
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

// ── Composant ligne de navigation réutilisable ──────────────────────────────

interface NavRowProps {
  item: NavItem;
  active: boolean;
  onPress: (item: NavItem) => void;
  indented?: boolean;
}

function NavRow({ item, active, onPress, indented = false }: NavRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.navItem,
        active && styles.navItemActive,
        indented && styles.navItemIndented,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
      testID={`nav-item-${item.key}`}
      accessibilityLabel={item.label}
    >
      {active && <View style={styles.activeBar} />}
      <Ionicons
        name={item.icon as "home-outline"}
        size={18}
        color={active ? colors.warmAccent : "rgba(255,255,255,0.72)"}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
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
  closeBtn: { padding: 4, marginLeft: "auto" },
  avatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.warmAccent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLargeText: { color: colors.white, fontSize: 17, fontWeight: "700" },
  userInfo: { flex: 1 },
  userName: { color: colors.white, fontSize: 15, fontWeight: "600" },
  userRoleText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  portalBadgeRow: { paddingHorizontal: 20, paddingVertical: 12 },
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
  navList: { flex: 1 },
  navContent: { paddingHorizontal: 12, paddingBottom: 8 },

  // ── Accordéon ──────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  sectionHeaderText: {
    flex: 1,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeaderTextActive: { color: colors.warmAccent },
  childAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  childAvatarText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Items de navigation ─────────────────────────────────────────────────────
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    gap: 14,
    position: "relative",
  },
  navItemActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  navItemIndented: { paddingLeft: 20 },
  navLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  navLabelActive: { color: colors.white, fontWeight: "600" },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    backgroundColor: colors.warmAccent,
    borderRadius: 2,
  },

  // ── Déconnexion ─────────────────────────────────────────────────────────────
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 14,
  },
  logoutLabel: { color: "rgba(255,255,255,0.55)", fontSize: 15 },
  sideHitArea: { position: "absolute", top: 0, bottom: 0 },
});
