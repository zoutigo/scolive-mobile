import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { InlineSearchSelect } from "../../src/components/InlineSearchSelect";

const OPTIONS = [
  { value: "Centre", label: "Centre" },
  { value: "Littoral", label: "Littoral" },
  { value: "Extrême-Nord", label: "Extrême-Nord" },
];

describe("InlineSearchSelect", () => {
  it("shows the selected option label when closed", () => {
    render(
      <InlineSearchSelect
        label="Région"
        options={OPTIONS}
        value="Littoral"
        onChange={jest.fn()}
        testID="region-select"
      />,
    );
    expect(screen.getByTestId("region-select-input").props.value).toBe(
      "Littoral",
    );
  });

  it("opens the suggestion list on focus and lists all options with empty query", () => {
    render(
      <InlineSearchSelect
        label="Région"
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="region-select"
      />,
    );
    fireEvent(screen.getByTestId("region-select-input"), "focus");
    expect(screen.getByTestId("region-select-option-Centre")).toBeTruthy();
    expect(screen.getByTestId("region-select-option-Littoral")).toBeTruthy();
    expect(
      screen.getByTestId("region-select-option-Extrême-Nord"),
    ).toBeTruthy();
  });

  it("filters options by typed prefix, case and accent insensitive", () => {
    render(
      <InlineSearchSelect
        label="Région"
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="region-select"
      />,
    );
    const input = screen.getByTestId("region-select-input");
    fireEvent(input, "focus");
    fireEvent.changeText(input, "extreme");
    expect(
      screen.getByTestId("region-select-option-Extrême-Nord"),
    ).toBeTruthy();
    expect(screen.queryByTestId("region-select-option-Centre")).toBeNull();
  });

  it("forwards the raw typed text to onQueryChange, e.g. to trigger a server-side search", () => {
    const onQueryChange = jest.fn();
    render(
      <InlineSearchSelect
        label="Région"
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        onQueryChange={onQueryChange}
        testID="region-select"
      />,
    );
    const input = screen.getByTestId("region-select-input");
    fireEvent(input, "focus");
    fireEvent.changeText(input, "vogt");
    expect(onQueryChange).toHaveBeenCalledWith("vogt");
  });

  it("calls onChange and closes the list when an option is selected", () => {
    const onChange = jest.fn();
    render(
      <InlineSearchSelect
        label="Région"
        options={OPTIONS}
        value=""
        onChange={onChange}
        testID="region-select"
      />,
    );
    const input = screen.getByTestId("region-select-input");
    fireEvent(input, "focus");
    fireEvent.press(screen.getByTestId("region-select-option-Littoral"));
    expect(onChange).toHaveBeenCalledWith("Littoral");
    expect(screen.queryByTestId("region-select-option-Littoral")).toBeNull();
  });

  it("opens the suggestion list and focuses the input when the chevron is pressed", () => {
    render(
      <InlineSearchSelect
        label="Région"
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        testID="region-select"
      />,
    );
    const input = screen.getByTestId("region-select-input");
    expect(screen.queryByTestId("region-select-suggestions")).toBeNull();

    fireEvent.press(screen.getByTestId("region-select-chevron"));

    expect(input.props.value).toBe("");
    expect(screen.getByTestId("region-select-option-Centre")).toBeTruthy();
  });

  it("does not render a pressable chevron when disabled", () => {
    render(
      <InlineSearchSelect
        label="Pays"
        options={[{ value: "Cameroun", label: "Cameroun" }]}
        value="Cameroun"
        onChange={jest.fn()}
        disabled
        testID="country-select"
      />,
    );
    expect(screen.queryByTestId("country-select-chevron")).toBeNull();
  });

  it("does not open the suggestion list when disabled", () => {
    render(
      <InlineSearchSelect
        label="Pays"
        options={[{ value: "Cameroun", label: "Cameroun" }]}
        value="Cameroun"
        onChange={jest.fn()}
        disabled
        testID="country-select"
      />,
    );
    const input = screen.getByTestId("country-select-input");
    fireEvent(input, "focus");
    expect(input.props.editable).toBe(false);
    expect(screen.queryByTestId("country-select-option-Cameroun")).toBeNull();
  });

  it("shows a spinner and does not open the suggestion list while loading", () => {
    render(
      <InlineSearchSelect
        label="École"
        options={[]}
        value=""
        onChange={jest.fn()}
        loading
        placeholder="Chargement des écoles…"
        testID="school-select"
      />,
    );
    expect(screen.getByTestId("school-select-loading")).toBeTruthy();
    const input = screen.getByTestId("school-select-input");
    expect(input.props.editable).toBe(false);
    fireEvent(input, "focus");
    expect(screen.queryByTestId("school-select-suggestions")).toBeNull();
  });

  it("stops showing the spinner and opens normally once loading completes", () => {
    const { rerender } = render(
      <InlineSearchSelect
        label="École"
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        loading
        testID="school-select"
      />,
    );
    expect(screen.getByTestId("school-select-loading")).toBeTruthy();

    rerender(
      <InlineSearchSelect
        label="École"
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        loading={false}
        testID="school-select"
      />,
    );
    expect(screen.queryByTestId("school-select-loading")).toBeNull();
    const input = screen.getByTestId("school-select-input");
    fireEvent(input, "focus");
    expect(screen.getByTestId("school-select-option-Centre")).toBeTruthy();
  });

  it("shows an empty-state message when no option matches the query", () => {
    render(
      <InlineSearchSelect
        label="Région"
        options={OPTIONS}
        value=""
        onChange={jest.fn()}
        placeholder="Aucun résultat"
        testID="region-select"
      />,
    );
    const input = screen.getByTestId("region-select-input");
    fireEvent(input, "focus");
    fireEvent.changeText(input, "zzz");
    expect(screen.getByText("Aucun résultat")).toBeTruthy();
  });
});
