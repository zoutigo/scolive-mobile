import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth.store";
import { useBadgesStore } from "../../store/badges.store";
import { useFamilyStore } from "../../store/family.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { useOnboardingTourStore } from "../../store/onboarding-tour.store";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { PLATFORM_SCOPE } from "../../api/messaging-client";
import { AppHeader } from "./AppHeader";
import { AppDrawer } from "./AppDrawer";
import {
  BottomTabBar,
  BOTTOM_TAB_BAR_HEIGHT,
  BOTTOM_TAB_ACCOUNT_TOUR_TARGET,
} from "./BottomTabBar";
import {
  getRoleLabel,
  getViewType,
  buildDrawerNavigationConfig,
} from "./nav-config";
import { DrawerContext } from "./drawer-context";
import {
  HeaderScrollContext,
  useCreateHeaderScroll,
} from "./header-scroll-context";

export { useDrawer } from "./drawer-context";
export { useHeaderScroll } from "./header-scroll-context";

interface AppShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function AppShell({ children, showHeader = true }: AppShellProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const { user, schoolSlug } = useAuthStore();
  const headerScroll = useCreateHeaderScroll();
  const {
    children: familyChildren,
    loadChildren,
    clearChildren,
  } = useFamilyStore();
  const {
    classOptions: teacherClassOptions,
    isLoadingClassOptions: isLoadingTeacherClassOptions,
    errorMessage: teacherClassNavError,
    loadClassOptions: loadTeacherClassOptions,
    reset: resetTeacherClassNav,
  } = useTeacherClassNavStore();
  const {
    summary: badgesSummary,
    loadSummary: loadBadgesSummary,
    clear: clearBadgesSummary,
  } = useBadgesStore();

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setPendingSection(null);
  }, []);
  const openDrawerForClass = useCallback((classId: string) => {
    setPendingSection(`teacher-class-${classId}`);
    setIsDrawerOpen(true);
  }, []);

  const activeTourStepTargetKey = useOnboardingTourStore(
    (state) => state.steps[state.stepIndex]?.targetKey,
  );

  // Le tour "parent-landing" referme le drawer avant sa dernière étape
  // (compte, dans la barre du bas) : le drawer resterait sinon ouvert
  // par-dessus la barre de tabs et masquerait la cible réelle, reproduisant
  // le bug initial (tooltip flottant au-dessus d'un menu déjà ouvert).
  useEffect(() => {
    if (
      activeTourStepTargetKey === BOTTOM_TAB_ACCOUNT_TOUR_TARGET &&
      isDrawerOpen
    ) {
      closeDrawer();
    }
  }, [activeTourStepTargetKey, isDrawerOpen, closeDrawer]);

  const viewType = user ? getViewType(user) : "unknown";

  const userFullName = user ? `${user.firstName} ${user.lastName}` : "";
  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";
  const userRole = user ? getRoleLabel(user) : "";

  useEffect(() => {
    if (viewType === "parent" && schoolSlug) {
      void loadChildren(schoolSlug);
    } else {
      clearChildren();
    }
  }, [viewType, schoolSlug, loadChildren, clearChildren]);

  useEffect(() => {
    if (viewType === "teacher" && schoolSlug) {
      void loadTeacherClassOptions(schoolSlug).catch(() => {});
    } else {
      resetTeacherClassNav();
    }
  }, [viewType, schoolSlug, loadTeacherClassOptions, resetTeacherClassNav]);

  const badgesScope =
    viewType === "platform" ? PLATFORM_SCOPE : (schoolSlug ?? null);

  useEffect(() => {
    if (!badgesScope || viewType === "unknown") {
      clearBadgesSummary();
      return;
    }

    void loadBadgesSummary(badgesScope);

    // Connectivity in the field is unreliable: refresh badges whenever the
    // app comes back to the foreground, which is the most common moment
    // connectivity returns after a drop.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void loadBadgesSummary(badgesScope);
      }
    });

    return () => subscription.remove();
  }, [viewType, badgesScope, loadBadgesSummary, clearBadgesSummary]);

  const { navItems, childSections, teacherClassSections } =
    buildDrawerNavigationConfig({
      user,
      familyChildren,
      teacherClasses: teacherClassOptions?.classes ?? [],
      badges: badgesSummary,
    });

  return (
    <DrawerContext.Provider
      value={{ openDrawer, openDrawerForClass, closeDrawer, isDrawerOpen }}
    >
      <HeaderScrollContext.Provider value={headerScroll}>
        <View style={styles.container}>
          {showHeader ? <AppHeader /> : null}
          <View
            style={[
              styles.content,
              { paddingBottom: BOTTOM_TAB_BAR_HEIGHT + insets.bottom },
            ]}
          >
            {user?.schoolReadOnly ? (
              <View
                style={[
                  styles.readOnlyBanner,
                  // Hors accueil, la bannière est le premier élément de l'écran :
                  // elle doit passer sous la barre d'état (encoche, heure).
                  !showHeader ? { paddingTop: insets.top + 10 } : null,
                ]}
                testID="read-only-banner"
              >
                <Text style={styles.readOnlyTitle}>{t("readOnly.title")}</Text>
                <Text style={styles.readOnlyMessage}>
                  {t(
                    user.activeRole === "PARENT"
                      ? "readOnly.messageParent"
                      : "readOnly.message",
                  )}
                </Text>
              </View>
            ) : null}
            {children}
          </View>
          <BottomTabBar />
          <AppDrawer
            isOpen={isDrawerOpen}
            onClose={closeDrawer}
            navItems={navItems}
            childSections={childSections}
            teacherClassSections={teacherClassSections}
            isTeacherClassNavEnabled={viewType === "teacher"}
            isLoadingTeacherClassSections={
              viewType === "teacher" && isLoadingTeacherClassOptions
            }
            teacherClassSectionsError={
              viewType === "teacher" ? teacherClassNavError : null
            }
            forcedSection={pendingSection}
            userFullName={userFullName}
            userInitials={userInitials}
            userRole={userRole}
          />
        </View>
      </HeaderScrollContext.Provider>
    </DrawerContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  readOnlyBanner: {
    backgroundColor: "#FFF3E4",
    borderBottomWidth: 1,
    borderBottomColor: "#F4C7A1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  readOnlyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7A4A12",
  },
  readOnlyMessage: {
    fontSize: 12,
    color: "#7A4A12",
  },
});
