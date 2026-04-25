import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

interface HeaderMenuButtonProps {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  testID?: string;
  style?: ViewStyle;
}

export function HeaderMenuButton({
  onPress,
  icon = "menu-outline",
  testID = "header-menu-btn",
  style,
}: HeaderMenuButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btn, style]}
      testID={testID}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="Ouvrir le menu"
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={24} color={colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(216,155,91,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(216,155,91,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
