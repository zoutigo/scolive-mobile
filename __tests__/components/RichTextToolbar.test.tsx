import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { RichTextToolbar } from "../../src/components/editor/RichTextToolbar";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");

describe("RichTextToolbar", () => {
  it("rend les actions rapides et propage les callbacks", () => {
    const onPressAddImage = jest.fn();
    const onPressColor = jest.fn();
    const onPressHeading = jest.fn();
    const onPressQuote = jest.fn();

    render(
      <RichTextToolbar
        editorRef={{ current: null }}
        onPressAddImage={onPressAddImage}
        onPressColor={onPressColor}
        onPressHeading={onPressHeading}
        onPressQuote={onPressQuote}
      />,
    );

    expect(screen.getByTestId("rich-toolbar")).toBeTruthy();
    expect(screen.getByTestId("editor-quick-tools")).toBeTruthy();

    fireEvent.press(screen.getByTestId("toolbar-insert-image"));
    fireEvent.press(screen.getByTestId("editor-color-btn"));
    fireEvent.press(screen.getByTestId("editor-heading-btn"));
    fireEvent.press(screen.getByTestId("editor-quote-btn"));

    expect(onPressAddImage).toHaveBeenCalledTimes(1);
    expect(onPressColor).toHaveBeenCalledTimes(1);
    expect(onPressHeading).toHaveBeenCalledTimes(1);
    expect(onPressQuote).toHaveBeenCalledTimes(1);
  });
});
