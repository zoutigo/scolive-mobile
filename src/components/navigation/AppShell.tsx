import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth.store";
import { useBadgesStore } from "../../store/badges.store";
import { useFamilyStore } from "../../store/family.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { colors } from "../../theme";
import { AppHeader } from "./AppHeader";
import { AppDrawer } from "./AppDrawer";
import { BottomTabBar, BOTTOM_TAB_BAR_HEIGHT } from "./BottomTabBar";
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

  useEffect(() => {
    if (!schoolSlug || viewType === "unknown") {
      clearBadgesSummary();
      return;
    }

    void loadBadgesSummary(schoolSlug);

    // Connectivity in the field is unreliable: refresh badges whenever the
    // app comes back to the foreground, which is the most common moment
    // connectivity returns after a drop.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void loadBadgesSummary(schoolSlug);
      }
    });

    return () => subscription.remove();
  }, [viewType, schoolSlug, loadBadgesSummary, clearBadgesSummary]);

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
});
