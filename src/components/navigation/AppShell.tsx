import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { useTeacherClassNavStore } from "../../store/teacher-class-nav.store";
import { colors } from "../../theme";
import { AppHeader } from "./AppHeader";
import { AppDrawer } from "./AppDrawer";
import {
  getRoleLabel,
  getViewType,
  buildDrawerNavigationConfig,
} from "./nav-config";
import { DrawerContext } from "./drawer-context";

export { useDrawer } from "./drawer-context";

interface AppShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function AppShell({ children, showHeader = true }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const { user, schoolSlug, logout } = useAuthStore();
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

  const { navItems, childSections, teacherClassSections } =
    buildDrawerNavigationConfig({
      user,
      familyChildren,
      teacherClasses: teacherClassOptions?.classes ?? [],
    });

  return (
    <DrawerContext.Provider
      value={{ openDrawer, openDrawerForClass, closeDrawer, isDrawerOpen }}
    >
      <View style={styles.container}>
        {showHeader ? <AppHeader /> : null}
        <View style={styles.content}>{children}</View>
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
          isTester={Boolean(user?.isTester)}
          onLogout={logout}
        />
      </View>
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
