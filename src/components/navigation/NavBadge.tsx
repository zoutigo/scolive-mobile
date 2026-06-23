import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme";

interface NavBadgeProps {
  count?: number;
  testID?: string;
}

export function NavBadge({ count, testID }: NavBadgeProps) {
  if (!count || count <= 0) {
    return null;
  }

  return (
    <View style={styles.badge} testID={testID}>
      <Text style={styles.text} numberOfLines={1}>
        {count > 99 ? "99+" : String(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.notification,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});
