import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AppDrawer } from "../../src/components/navigation/AppDrawer";
import { getNavItems } from "../../src/components/navigation/nav-config";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    dismissAll: jest.fn(),
    canDismiss: () => true,
  }),
  usePathname: () => "/",
}));

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: "school-admin-1",
    firstName: "Sarah",
    lastName: "Moukouri",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    profileCompleted: true,
    role: "SCHOOL_ADMIN",
    activeRole: "SCHOOL_ADMIN",
    ...overrides,
  };
}

const schoolAdminUser = makeUser({});

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  userFullName: "Sarah Moukouri",
  userInitials: "SM",
  userRole: "Administrateur école",
  onLogout: jest.fn(),
};

describe("Teachers drawer navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("expose l'entrée enseignants dans le menu school admin avec la route dédiée", () => {
    const navItems = getNavItems(schoolAdminUser);
    const teachersItem = navItems.find((item) => item.key === "teachers");

    expect(teachersItem).toEqual({
      key: "teachers",
      label: "Enseignants",
      icon: "school-outline",
      route: "/teachers",
    });
  });

  it("place enseignants entre inscriptions et passages de classe dans le menu school admin", () => {
    const keys = getNavItems(schoolAdminUser).map((item) => item.key);
    const enrollmentsIndex = keys.indexOf("enrollments");
    const teachersIndex = keys.indexOf("teachers");
    const promotionsIndex = keys.indexOf("promotions");

    expect(enrollmentsIndex).toBeGreaterThanOrEqual(0);
    expect(teachersIndex).toBe(enrollmentsIndex + 1);
    expect(promotionsIndex).toBe(teachersIndex + 1);
  });

  it("navigue vers l'écran enseignants quand on presse l'item du drawer", () => {
    render(
      <AppDrawer {...baseProps} navItems={getNavItems(schoolAdminUser)} />,
    );

    fireEvent.press(screen.getByTestId("nav-item-teachers"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledWith("/teachers");
  });
});
