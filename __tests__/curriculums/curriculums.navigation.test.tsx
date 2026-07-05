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

describe("Curriculums drawer navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("expose l'entrée curriculums dans le menu school admin avec la route dédiée", () => {
    const navItems = getNavItems(schoolAdminUser);
    const curriculumsItem = navItems.find((item) => item.key === "curriculums");

    expect(curriculumsItem).toEqual({
      key: "curriculums",
      label: "Curriculums",
      icon: "layers-outline",
      route: "/curriculums",
    });
  });

  it("place curriculums entre matières et inscriptions dans le menu school admin", () => {
    const keys = getNavItems(schoolAdminUser).map((item) => item.key);
    const subjectsIndex = keys.indexOf("subjects");
    const curriculumsIndex = keys.indexOf("curriculums");
    const enrollmentsIndex = keys.indexOf("enrollments");

    expect(subjectsIndex).toBeGreaterThanOrEqual(0);
    expect(curriculumsIndex).toBe(subjectsIndex + 1);
    expect(enrollmentsIndex).toBe(curriculumsIndex + 1);
  });

  it("navigue vers l'écran curriculums quand on presse l'item du drawer", () => {
    render(
      <AppDrawer {...baseProps} navItems={getNavItems(schoolAdminUser)} />,
    );

    fireEvent.press(screen.getByTestId("nav-item-curriculums"));
    act(() => jest.runAllTimers());

    expect(mockPush).toHaveBeenCalledWith("/curriculums");
  });
});
