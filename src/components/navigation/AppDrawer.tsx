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
import * as Application from "expo-application";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { colors } from "../../theme";
import { ConfirmDialog } from "../ConfirmDialog";
import { useFamilyStore } from "../../store/family.store";
import { useTranslation } from "../../i18n/useTranslation";
import type {
  NavItem,
  ParentChildSection,
  TeacherClassSection,
} from "./nav-config";

const DRAWER_WIDTH = 288;
const BAR_HEIGHT = 56;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  /** Sections enfants — uniquement pour le rôle PARENT */
  childSections?: ParentChildSection[];
  /** Sections classes — uniquement pour le rôle TEACHER */
  teacherClassSections?: TeacherClassSection[];
  isTeacherClassNavEnabled?: boolean;
  isLoadingTeacherClassSections?: boolean;
  teacherClassSectionsError?: string | null;
  /** Forçe l'ouverture d'une section au prochain open (ex: "teacher-class-{id}"). */
  forcedSection?: string | null;
  userFullName: string;
  userInitials: string;
  userRole: string;
  isTester?: boolean;
  onLogout: () => void;
}

export function AppDrawer({
  isOpen,
  onClose,
  navItems,
  childSections,
  teacherClassSections,
  isTeacherClassNavEnabled = false,
  isLoadingTeacherClassSections = false,
  teacherClassSectionsError = null,
  forcedSection,
  userFullName,
  userInitials,
  userRole,
  isTester = false,
  onLogout,
}: AppDrawerProps) {
  const insets = useSafeAreaInsets();
  const drawerTop = insets.top + BAR_HEIGHT;
  const drawerBottom = insets.bottom;

  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const { activeChildId, setActiveChild } = useFamilyStore();
  // "general" = section menu principal ouverte
  // "child-{id}" = section enfant ouverte
  // "teacher-class-{id}" = section classe enseignant ouverte
  const [openSection, setOpenSection] = useState<string>(
    activeChildId ? `child-${activeChildId}` : "general",
  );

  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const hasChildren = (childSections?.length ?? 0) > 0;
  const hasTeacherClasses = (teacherClassSections?.length ?? 0) > 0;
  const hasTeacherDrawerMode =
    isTeacherClassNavEnabled ||
    hasTeacherClasses ||
    isLoadingTeacherClassSections ||
    Boolean(teacherClassSectionsError);

  // Synchronise la section ouverte quand l'enfant actif change dans le store
  // Déduit si la route courante appartient à la section générale (home, feed…).
  // Utilisé dans les deux effects et dans le rendu — défini ici pour éviter
  // la duplication. Dépend de pathname via la closure de isItemActive.
  const isGeneralNavActive = () =>
    navItems
      .filter((i) => i.key !== "account")
      .some((item) => isItemActive(item));

  // Effect B — store-driven. Tourne en premier ; Effect A peut l'écraser.
  useEffect(() => {
    if (!hasChildren) return;
    setOpenSection(activeChildId ? `child-${activeChildId}` : "general");
  }, [activeChildId, hasChildren]);

  // Effect A — route-driven, tourne après Effect B pour avoir la priorité.
  // Exclu pour "/" : items "-home" de tous les enfants matchent "/" —
  // ambiguïté résolue par Effect B via activeChildId.
  useEffect(() => {
    if (!hasChildren) return;
    const isAtRoot =
      pathname === "/" || pathname === "/index" || pathname === "";
    if (isAtRoot) return;
    const matchingChild = (childSections ?? []).find((child) =>
      child.navItems.some((item) => isItemActive(item)),
    );
    if (matchingChild) {
      setOpenSection(`child-${matchingChild.id}`);
      return;
    }
    if (!isGeneralNavActive()) setOpenSection("none");
  }, [pathname]); // pathname change drives this; navItems/childSections stable across renders

  useEffect(() => {
    if (!hasTeacherDrawerMode) return;
    if (hasTeacherClasses) {
      const matchingSection = teacherClassSections?.find((section) =>
        section.navItems.some((item) => isItemActive(item)),
      );
      if (matchingSection) {
        setOpenSection(`teacher-class-${matchingSection.classId}`);
        return;
      }
    }
    setOpenSection(isGeneralNavActive() ? "general" : "none");
  }, [
    hasTeacherDrawerMode,
    hasTeacherClasses,
    pathname,
    navItems,
    teacherClassSections,
  ]);

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

  // Priorité maximale : ouvre directement la section demandée au prochain open.
  // Déclaré après tous les effets de synchronisation route/store pour les écraser.
  useEffect(() => {
    if (isOpen && forcedSection) {
      setOpenSection(forcedSection);
    }
  }, [isOpen, forcedSection]);

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

  const resolveItemRoute = (item: NavItem) => {
    if (!item.params) return item.route;
    return Object.entries(item.params).reduce(
      (route, [key, value]) => route.replace(`[${key}]`, value),
      item.route,
    );
  };

  const normalizeRoute = (route: string) => route.replace("/(home)", "");

  const isItemActive = (item: NavItem): boolean => {
    // L'item "home" racine correspond uniquement à "/".
    if (item.key === "home") {
      return pathname === "/" || pathname === "/index" || pathname === "";
    }
    if (!item.route || item.route === "/placeholder") {
      return false;
    }
    const normalizedPathname = normalizeRoute(pathname);
    const candidates = [item.route, resolveItemRoute(item)].map(normalizeRoute);

    return candidates.some(
      (route) =>
        normalizedPathname === route ||
        normalizedPathname.startsWith(`${route}/`),
    );
  };

  function initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  const isGeneralRouteActive = isGeneralNavActive();

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

        {/* Nav — mode accordéon si parent avec enfants, sinon liste simple */}
        <ScrollView
          style={styles.navList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.navContent}
        >
          {/* ── Mon compte — toujours en premier, quel que soit le rôle ── */}
          {(() => {
            const accountItem = navItems.find((i) => i.key === "account");
            if (!accountItem) return null;
            return (
              <NavRow
                key="account-top"
                item={accountItem}
                active={isItemActive(accountItem)}
                onPress={handleNavPress}
              />
            );
          })()}

          {hasChildren ? (
            <>
              {/* ── Section "Mon espace famille" ── */}
              <TouchableOpacity
                style={[
                  styles.navItem,
                  isGeneralRouteActive && styles.navItemActive,
                ]}
                onPress={() => {
                  setOpenSection("general");
                  setActiveChild(null);
                }}
                activeOpacity={0.7}
                testID="drawer-section-general"
              >
                {isGeneralRouteActive && (
                  <View
                    style={styles.activeBar}
                    testID="drawer-section-general-active-bar"
                  />
                )}
                {!isGeneralRouteActive && (
                  <View
                    style={styles.topLevelBar}
                    testID="drawer-section-general-top-level-bar"
                  />
                )}
                <Ionicons
                  name="home-outline"
                  size={16}
                  color={
                    isGeneralRouteActive
                      ? colors.warmAccent
                      : "rgba(255,255,255,0.90)"
                  }
                />
                <Text
                  testID="drawer-section-general-label"
                  style={[
                    styles.navLabel,
                    styles.expandableLabel,
                    isGeneralRouteActive
                      ? styles.navLabelActive
                      : styles.navLabelTopLevel,
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
                navItems
                  .filter((i) => i.key !== "account")
                  .map((item) => {
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

                const isChildRouteActive = child.navItems.some((item) =>
                  isItemActive(item),
                );

                return (
                  <View key={child.id}>
                    <ExpandableNavRow
                      label={`${child.lastName} ${child.firstName}`}
                      leadingNode={
                        <View
                          style={[
                            styles.childAvatar,
                            isChildRouteActive && styles.childAvatarActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.childAvatarText,
                              isChildRouteActive &&
                                styles.childAvatarTextActive,
                            ]}
                          >
                            {childInitials}
                          </Text>
                        </View>
                      }
                      isOpen={isOpen}
                      active={isChildRouteActive}
                      onPress={() => setOpenSection(sectionKey)}
                      testID={`drawer-section-child-${child.id}`}
                    />

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
          ) : hasTeacherDrawerMode ? (
            <>
              <TouchableOpacity
                style={[
                  styles.navItem,
                  isGeneralRouteActive && styles.navItemActive,
                ]}
                onPress={() => setOpenSection("general")}
                activeOpacity={0.7}
                testID="drawer-section-teacher-general"
              >
                {isGeneralRouteActive && (
                  <View
                    style={styles.activeBar}
                    testID="drawer-section-teacher-general-active-bar"
                  />
                )}
                {!isGeneralRouteActive && (
                  <View
                    style={styles.topLevelBar}
                    testID="drawer-section-teacher-general-top-level-bar"
                  />
                )}
                <Ionicons
                  name="school-outline"
                  size={16}
                  color={
                    isGeneralRouteActive
                      ? colors.warmAccent
                      : "rgba(255,255,255,0.90)"
                  }
                />
                <Text
                  testID="drawer-section-teacher-general-label"
                  style={[
                    styles.navLabel,
                    styles.expandableLabel,
                    isGeneralRouteActive
                      ? styles.navLabelActive
                      : styles.navLabelTopLevel,
                  ]}
                >
                  Menu enseignant
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
                navItems
                  .filter((i) => i.key !== "account")
                  .map((item) => {
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

              {isLoadingTeacherClassSections ? (
                <Text
                  style={styles.inlineStateText}
                  testID="drawer-teacher-classes-loading"
                >
                  Chargement des classes...
                </Text>
              ) : null}

              {!isLoadingTeacherClassSections && teacherClassSectionsError ? (
                <Text
                  style={styles.inlineStateError}
                  testID="drawer-teacher-classes-error"
                >
                  {teacherClassSectionsError}
                </Text>
              ) : null}

              {!isLoadingTeacherClassSections &&
              !teacherClassSectionsError &&
              !hasTeacherClasses ? (
                <Text
                  style={styles.inlineStateText}
                  testID="drawer-teacher-classes-empty"
                >
                  Aucune classe accessible pour ce profil.
                </Text>
              ) : null}

              {teacherClassSections?.map((section) => {
                const sectionKey = `teacher-class-${section.classId}`;
                const isOpen = openSection === sectionKey;
                const isClassRouteActive = section.navItems.some((item) =>
                  isItemActive(item),
                );

                return (
                  <View key={section.classId}>
                    <ExpandableNavRow
                      label={`Menu classe ${section.className}`}
                      leadingNode={
                        <Ionicons
                          name="school-outline"
                          size={18}
                          color={
                            isClassRouteActive
                              ? colors.warmAccent
                              : "rgba(255,255,255,0.90)"
                          }
                        />
                      }
                      isOpen={isOpen}
                      active={isClassRouteActive}
                      onPress={() => setOpenSection(sectionKey)}
                      testID={`drawer-section-teacher-class-${section.classId}`}
                    />

                    {isOpen &&
                      section.navItems.map((item) => {
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
            navItems
              .filter((i) => i.key !== "account")
              .map((item) => {
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

        {isTester ? (
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => {
              onClose();
              setTimeout(() => router.push("/(home)/tests"), 120);
            }}
            activeOpacity={0.7}
            testID="drawer-tests-btn"
          >
            <Ionicons
              name="clipboard-outline"
              size={20}
              color="rgba(255,255,255,0.55)"
            />
            <Text style={styles.logoutLabel}>{t("tests.title")}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Lien assistance — juste au-dessus de la déconnexion */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={() => {
            onClose();
            setTimeout(() => router.push("/(home)/tickets"), 120);
          }}
          activeOpacity={0.7}
          testID="drawer-tickets-btn"
        >
          <Ionicons
            name="help-circle-outline"
            size={20}
            color="rgba(255,255,255,0.55)"
          />
          <Text style={styles.logoutLabel}>Assistance</Text>
        </TouchableOpacity>

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

        {/* Version de l'application */}
        <View style={styles.versionRow} testID="drawer-app-version">
          <Text style={styles.versionText}>
            V{Application.nativeApplicationVersion ?? "—"}
          </Text>
        </View>
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
  const isTopLevel = !indented;
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
      {active && (
        <View style={styles.activeBar} testID={`${item.key}-active-bar`} />
      )}
      {!active && isTopLevel && (
        <View style={styles.topLevelBar} testID={`${item.key}-top-level-bar`} />
      )}
      <Ionicons
        name={item.icon as "home-outline"}
        size={18}
        color={
          active
            ? colors.warmAccent
            : isTopLevel
              ? "rgba(255,255,255,0.90)"
              : "rgba(255,255,255,0.60)"
        }
      />
      <Text
        testID={`${item.key}-label`}
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
          !active && isTopLevel && styles.navLabelTopLevel,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Section expansible — même système de style que NavRow ────────────────────

interface ExpandableNavRowProps {
  label: string;
  leadingNode: React.ReactNode;
  isOpen: boolean;
  active: boolean;
  onPress: () => void;
  testID: string;
}

function ExpandableNavRow({
  label,
  leadingNode,
  isOpen,
  active,
  onPress,
  testID,
}: ExpandableNavRowProps) {
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      {active && (
        <View style={styles.activeBar} testID={`${testID}-active-bar`} />
      )}
      {!active && (
        <View style={styles.topLevelBar} testID={`${testID}-top-level-bar`} />
      )}
      {leadingNode}
      <Text
        testID={`${testID}-label`}
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
          !active && styles.navLabelTopLevel,
          styles.expandableLabel,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Ionicons
        name={isOpen ? "chevron-down" : "chevron-forward"}
        size={14}
        color="rgba(255,255,255,0.4)"
      />
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
  sectionHeaderActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  sectionHeaderText: {
    flex: 1,
    color: colors.warmAccent,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  childAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  childAvatarActive: {
    backgroundColor: colors.warmAccent,
  },
  childAvatarText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
  },
  childAvatarTextActive: {
    color: colors.sidebarBg,
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
  navItemIndented: { paddingLeft: 32 },
  navLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "400",
    flex: 1,
  },
  expandableLabel: {
    flex: 1,
  },
  navLabelActive: { color: colors.white, fontWeight: "600" },
  inlineStateText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inlineStateError: {
    color: "#FFD7D3",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  topLevelBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: "rgba(216,155,91,0.35)",
    borderRadius: 2,
  },
  navLabelTopLevel: {
    color: "rgba(255,255,255,0.92)",
    fontWeight: "600",
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

  // ── Version ──────────────────────────────────────────────────────────────────
  versionRow: {
    alignItems: "center",
    paddingBottom: 14,
    paddingTop: 2,
  },
  versionText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sideHitArea: { position: "absolute", top: 0, bottom: 0 },
});
