import React from "react";
import { render } from "@testing-library/react-native";
import { NavBadge } from "../../src/components/navigation/NavBadge";

describe("NavBadge", () => {
  it("renders nothing when count is undefined, zero or negative", () => {
    expect(render(<NavBadge count={undefined} testID="badge" />).queryByTestId("badge")).toBeNull();
    expect(render(<NavBadge count={0} testID="badge" />).queryByTestId("badge")).toBeNull();
    expect(render(<NavBadge count={-1} testID="badge" />).queryByTestId("badge")).toBeNull();
  });

  it("renders the count when positive", () => {
    const { getByText } = render(<NavBadge count={3} testID="badge" />);
    expect(getByText("3")).toBeTruthy();
  });

  it("caps the displayed value at 99+", () => {
    const { getByText } = render(<NavBadge count={150} testID="badge" />);
    expect(getByText("99+")).toBeTruthy();
  });
});
