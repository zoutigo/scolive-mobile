import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../theme";

export function ProgressBar({
  percent,
  height = 8,
  trackColor = colors.border,
  fillColor = colors.accentTeal,
}: {
  percent: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View
      style={[styles.track, { height, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: fillColor, height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 4,
  },
});
