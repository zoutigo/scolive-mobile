import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { TimePickerField } from "../../src/components/TimePickerField";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("TimePickerField", () => {
  it("affiche la valeur courante formatée", () => {
    render(
      <TimePickerField value="08:20" onChange={jest.fn()} testID="time" />,
    );
    expect(screen.getByText("08:20")).toBeTruthy();
  });

  it("ouvre la modal et confirme une nouvelle heure", async () => {
    const onChange = jest.fn();
    render(<TimePickerField value="08:20" onChange={onChange} testID="time" />);

    fireEvent.press(screen.getByTestId("time"));

    await waitFor(() => expect(screen.getByTestId("time-modal")).toBeTruthy());
    fireEvent.press(screen.getByTestId("time-hour-09"));
    fireEvent.press(screen.getByTestId("time-minute-45"));
    fireEvent.press(screen.getByTestId("time-confirm"));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("09:45"));
  });

  it("ferme sans modifier quand on annule", async () => {
    const onChange = jest.fn();
    render(<TimePickerField value="08:20" onChange={onChange} testID="time" />);

    fireEvent.press(screen.getByTestId("time"));
    await waitFor(() => expect(screen.getByTestId("time-modal")).toBeTruthy());
    fireEvent.press(screen.getByTestId("time-cancel"));

    await waitFor(() => expect(screen.queryByTestId("time-modal")).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });
});
