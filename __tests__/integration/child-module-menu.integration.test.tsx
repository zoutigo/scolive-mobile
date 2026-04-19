import React, { useEffect } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AppShell, useDrawer } from "../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/(home)/children/[childId]",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

function ChildModuleHeaderHarness() {
  const { openDrawer } = useDrawer();
  const { setActiveChild } = useFamilyStore();

  useEffect(() => {
    setActiveChild("child-1");
  }, [setActiveChild]);

  return (
    <ModuleHeader
      title="Module enfant"
      subtitle="Remi Ntamack • 6e C"
      onBack={jest.fn()}
      rightIcon="menu-outline"
      onRightPress={openDrawer}
      rightTestID="child-module-menu-btn"
    />
  );
}

function ParentModuleHeaderHarness() {
  const { openDrawer } = useDrawer();
  const { setActiveChild } = useFamilyStore();

  useEffect(() => {
    setActiveChild(null);
  }, [setActiveChild]);

  return (
    <ModuleHeader
      title="Module parent"
      subtitle="Robert Ntamack"
      onBack={jest.fn()}
      rightIcon="menu-outline"
      onRightPress={openDrawer}
      rightTestID="parent-module-menu-btn"
    />
  );
}

describe("Child module menu integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: "u1",
        firstName: "Robert",
        lastName: "Ntamack",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "PARENT" }],
        profileCompleted: true,
        role: "PARENT",
        activeRole: "PARENT",
      },
      schoolSlug: "college-vogt",
      isLoading: false,
      isAuthenticated: true,
      accessToken: "token",
    } as never);
    useFamilyStore.setState({
      children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
      activeChildId: "child-1",
      isLoading: false,
      loadChildren: jest.fn(),
      clearChildren: jest.fn(),
    } as never);
  });

  it("ouvre le drawer et conserve le contexte enfant actif", () => {
    render(
      <AppShell>
        <ChildModuleHeaderHarness />
      </AppShell>,
    );

    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("none");

    fireEvent.press(screen.getByTestId("child-module-menu-btn"));

    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("auto");
    expect(screen.getByTestId("drawer-section-child-child-1")).toBeTruthy();
  });

  it("ouvre le drawer en contexte parent quand aucun enfant n'est actif", () => {
    render(
      <AppShell>
        <ParentModuleHeaderHarness />
      </AppShell>,
    );

    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("none");

    fireEvent.press(screen.getByTestId("parent-module-menu-btn"));

    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("auto");
    expect(screen.getByTestId("drawer-section-general")).toBeTruthy();
  });
});
