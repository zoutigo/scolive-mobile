import React, { useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { RichEditor } from "react-native-pell-rich-editor";
import { colors } from "../../theme";

/**
 * Read-only counterpart to RichEditorField: same underlying WebView renderer
 * (disabled contentEditable) so HTML saved from the rich editor — including
 * inline <img> tags — displays exactly as authored. A plain stripHtml→Text
 * render silently drops image-only content, which looked like an empty
 * submission to moderators.
 */
export function RichContentView(props: {
  html: string;
  minHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { html, minHeight = 60, containerStyle, testID } = props;
  const [height, setHeight] = useState(minHeight);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <RichEditor
        disabled
        initialContentHTML={html}
        initialHeight={minHeight}
        style={[styles.editor, { height }]}
        editorStyle={{
          backgroundColor: "transparent",
          color: colors.textPrimary,
          contentCSSText: "font-size: 14px; line-height: 1.5; padding: 0;",
          cssText:
            "img { max-width: 100%; height: auto; display: block; margin: 8px 0; }",
        }}
        onHeightChange={(newHeight) =>
          setHeight(Math.max(minHeight, newHeight))
        }
        useContainer
        scrollEnabled={false}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: "hidden" },
  editor: { backgroundColor: "transparent" },
});
