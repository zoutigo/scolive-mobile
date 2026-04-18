import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { colors } from "../../theme";
import { AppHeader } from "./AppHeader";
import { AppDrawer } from "./AppDrawer";
import {
  getNavItems,
  getPortalLabel,
  getRoleLabel,
  getViewType,
  buildChildSections,
} from "./nav-config";
import { DrawerContext } from "./drawer-context";

export { useDrawer } from "./drawer-context";

interface AppShellProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function AppShell({ children, showHeader = true }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, schoolSlug, logout } = useAuthStore();
  const {
    children: familyChildren,
    loadChildren,
    clearChildren,
  } = useFamilyStore();

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const viewType = user ? getViewType(user) : "unknown";
  const navItems = user ? getNavItems(user) : [];
  const portalLabel = getPortalLabel(viewType);

  const userFullName = user ? `${user.firstName} ${user.lastName}` : "";
  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "?";
  const userRole = user ? getRoleLabel(user) : "";

  // Charge les enfants quand l'utilisateur est un parent avec un schoolSlug
  useEffect(() => {
    if (viewType === "parent" && schoolSlug) {
      void loadChildren(schoolSlug);
    } else {
      clearChildren();
    }
  }, [viewType, schoolSlug, loadChildren, clearChildren]);

  const childSections =
    viewType === "parent" ? buildChildSections(familyChildren) : undefined;

  return (
    <DrawerContext.Provider value={{ openDrawer, closeDrawer, isDrawerOpen }}>
      <View style={styles.container}>
        {showHeader ? <AppHeader /> : null}
        <View style={styles.content}>{children}</View>
        <AppDrawer
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
          navItems={navItems}
          childSections={childSections}
          portalLabel={portalLabel}
          userFullName={userFullName}
          userInitials={userInitials}
          userRole={userRole}
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
