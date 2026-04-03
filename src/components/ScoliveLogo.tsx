import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ScoliveLogoProps {
  size?: number;
  /** "onBlue" → fond blanc + texte bleu (header)
   *  "onLight" → fond bleu + texte blanc (splash, icône, fond clair) */
  variant?: "onBlue" | "onLight";
  testID?: string;
}

/**
 * Logo Scolive : carré arrondi avec "SL".
 * Reproduit fidèlement le logo SVG de l'application web.
 */
export function ScoliveLogo({
  size = 34,
  variant = "onBlue",
  testID,
}: ScoliveLogoProps) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.38);

  const bg = variant === "onBlue" ? "#FFFFFF" : "#0B5CAB";
  const fg = variant === "onBlue" ? "#0B5CAB" : "#FFFFFF";

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: bg,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize, color: fg }]}>SL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    includeFontPadding: false,
  },
});
