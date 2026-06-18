import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AppDrawer } from "../../src/components/navigation/AppDrawer";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

describe("Tests drawer entry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const baseProps = {
    isOpen: true,
    onClose: jest.fn(),
    navItems: [],
    userFullName: "Valery MBELE",
    userInitials: "VM",
    userRole: "Parent",
    onLogout: jest.fn(),
  };

  it("shows the Tests entry for tester users and opens the route", () => {
    render(<AppDrawer {...baseProps} isTester />);

    fireEvent.press(screen.getByTestId("drawer-tests-btn"));
    act(() => {
      jest.runAllTimers();
    });

    expect(mockPush).toHaveBeenCalledWith("/(home)/tests");
  });

  it("hides the Tests entry for non-testers", () => {
    render(<AppDrawer {...baseProps} isTester={false} />);
    expect(screen.queryByTestId("drawer-tests-btn")).toBeNull();
  });
});
