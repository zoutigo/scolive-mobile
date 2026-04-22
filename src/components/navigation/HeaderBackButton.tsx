import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

interface HeaderBackButtonProps {
  onPress: () => void;
  testID?: string;
}

export function HeaderBackButton({
  onPress,
  testID = "header-back-btn",
}: HeaderBackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.btn}
      testID={testID}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="Retour"
      accessibilityRole="button"
    >
      <Ionicons name="arrow-back" size={20} color={colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
