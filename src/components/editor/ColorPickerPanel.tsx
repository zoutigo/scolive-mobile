import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { RichEditorColorPreset } from "./RichEditorField";

type Props = {
  presets: readonly RichEditorColorPreset[];
  onSelect: (value: string) => void;
  onClose: () => void;
  title: string;
  message?: string;
  closeAccessibilityLabel?: string;
  testID?: string;
  closeTestID?: string;
};

export function ColorPickerPanel({
  presets,
  onSelect,
  onClose,
  title,
  message,
  closeAccessibilityLabel,
  testID = "color-picker-panel",
  closeTestID = "color-picker-close",
}: Props) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={closeTestID}
          accessibilityLabel={closeAccessibilityLabel}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.swatchGrid}
        style={styles.swatchScroll}
      >
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            style={[styles.swatch, { backgroundColor: preset.value }]}
            onPress={() => onSelect(preset.value)}
            accessibilityLabel={preset.label}
            testID={`color-swatch-${preset.value}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  swatchScroll: {
    maxHeight: 148,
  },
  swatchGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
});
