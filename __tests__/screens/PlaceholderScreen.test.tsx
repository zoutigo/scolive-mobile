import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import PlaceholderScreen from "../../app/(home)/placeholder";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockBack = jest.fn();
const mockRouter = { back: mockBack };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ title: "Mon module" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PlaceholderScreen", () => {
  it("rend sans crash", () => {
    render(<PlaceholderScreen />);
  });

  it("affiche le ModuleHeader avec testID 'placeholder-header'", () => {
    render(<PlaceholderScreen />);
    expect(screen.getByTestId("placeholder-header")).toBeOnTheScreen();
  });

  it("affiche le bouton retour 'placeholder-back-btn'", () => {
    render(<PlaceholderScreen />);
    expect(screen.getByTestId("placeholder-back-btn")).toBeOnTheScreen();
  });

  it("affiche le titre passé en paramètre", () => {
    render(<PlaceholderScreen />);
    expect(screen.getAllByText("Mon module").length).toBeGreaterThan(0);
  });

  it("appelle router.back() quand on presse le bouton retour", () => {
    render(<PlaceholderScreen />);
    fireEvent.press(screen.getByTestId("placeholder-back-btn"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
