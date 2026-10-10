import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { useSchoolReadOnly } from "../../src/hooks/useSchoolReadOnly";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

function Probe() {
  return <Text testID="probe">{String(useSchoolReadOnly())}</Text>;
}

function setUser(user: Record<string, unknown> | null) {
  useAuthStore.setState({ user: user as never });
}

describe("useSchoolReadOnly", () => {
  afterEach(() => setUser(null));

  it("vaut true quand l'API signale schoolReadOnly", () => {
    setUser({ id: "u-1", schoolReadOnly: true });
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });

  it("vaut false quand schoolReadOnly est faux, absent ou sans utilisateur", () => {
    setUser({ id: "u-1", schoolReadOnly: false });
    const first = render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
    first.unmount();

    setUser({ id: "u-1" });
    const second = render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
    second.unmount();

    setUser(null);
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
  });

  it("réagit au changement d'utilisateur", () => {
    setUser({ id: "u-1", schoolReadOnly: false });
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
    act(() => {
      setUser({ id: "u-1", schoolReadOnly: true });
    });
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });
});
