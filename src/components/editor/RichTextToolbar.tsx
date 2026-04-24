import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  actions,
  RichEditor,
  RichToolbar,
} from "react-native-pell-rich-editor";
import { colors } from "../../theme";

type Props = {
  editorRef: React.RefObject<RichEditor | null>;
  onPressAddImage: () => void;
  onPressAddVideo?: () => void;
  onPressColor: () => void;
  onPressHeading: () => void;
  onPressQuote: () => void;
  toolbarTestID?: string;
  quickToolsTestID?: string;
  videoButtonTestID?: string;
  colorButtonTestID?: string;
  headingButtonTestID?: string;
  quoteButtonTestID?: string;
};

export function RichTextToolbar({
  editorRef,
  onPressAddImage,
  onPressAddVideo,
  onPressColor,
  onPressHeading,
  onPressQuote,
  toolbarTestID = "rich-toolbar",
  quickToolsTestID = "editor-quick-tools",
  videoButtonTestID = "editor-video-btn",
  colorButtonTestID = "editor-color-btn",
  headingButtonTestID = "editor-heading-btn",
  quoteButtonTestID = "editor-quote-btn",
}: Props) {
  return (
    <View style={styles.row} testID={quickToolsTestID}>
      <RichToolbar
        editor={editorRef}
        style={styles.richToolbar}
        iconTint={colors.textSecondary}
        selectedIconTint={colors.primary}
        disabledIconTint={colors.warmBorder}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.setStrikethrough,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.insertImage,
        ]}
        onPressAddImage={onPressAddImage}
        iconMap={{
          [actions.insertImage]: () => (
            <Ionicons name="image-outline" size={20} color={colors.primary} />
          ),
        }}
        testID={toolbarTestID}
      />
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickToolBtn}
          onPress={onPressAddVideo}
          testID={videoButtonTestID}
          accessibilityLabel="Ajouter une vidéo"
          disabled={!onPressAddVideo}
        >
          <Ionicons name="videocam-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickToolBtn}
          onPress={onPressColor}
          testID={colorButtonTestID}
          accessibilityLabel="Couleur du texte"
        >
          <Ionicons
            name="color-palette-outline"
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickToolBtn}
          onPress={onPressHeading}
          testID={headingButtonTestID}
          accessibilityLabel="Titre"
        >
          <Ionicons name="text-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickToolBtn}
          onPress={onPressQuote}
          testID={quoteButtonTestID}
          accessibilityLabel="Citation"
        >
          <Ionicons
            name="chatbox-ellipses-outline"
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  richToolbar: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickToolBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
});
