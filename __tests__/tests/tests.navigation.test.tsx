/**
 * L'accès aux Tests a été déplacé du drawer vers la bottom tab bar
 * (voir __tests__/navigation/BottomTabBar.test.tsx). Ce test verrouille
 * la non-régression : le drawer ne doit plus jamais exposer cette entrée.
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { AppDrawer } from "../../src/components/navigation/AppDrawer";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    dismissAll: jest.fn(),
    canDismiss: () => true,
  }),
  usePathname: () => "/",
}));

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  navItems: [],
  userFullName: "Valery MBELE",
  userInitials: "VM",
  userRole: "Parent",
};

describe("Tests drawer entry — supprimée (déplacée vers la bottom tab bar)", () => {
  it("n'affiche plus de bouton Tests dans le drawer", () => {
    render(<AppDrawer {...baseProps} />);
    expect(screen.queryByTestId("drawer-tests-btn")).toBeNull();
  });
});
