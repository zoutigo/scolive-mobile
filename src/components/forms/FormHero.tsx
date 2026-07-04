import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type FormHeroPalette = "teal" | "warm" | "primary";

const FORM_HERO_PALETTES: Record<
  FormHeroPalette,
  { bg: string; dark: string }
> = {
  teal: { bg: "#247C72", dark: "#195E56" },
  warm: { bg: "#C0681A", dark: "#A05010" },
  primary: { bg: "#08467D", dark: "#052F55" },
};

export function FormHero(props: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string | null;
  palette: FormHeroPalette;
  testID?: string;
  /** Extra content appended at the end of the icon/title row (e.g. a scope pill). */
  trailing?: React.ReactNode;
  /** Extra content rendered below the icon/title row (e.g. a meta line). */
  footer?: React.ReactNode;
}) {
  const { bg, dark } = FORM_HERO_PALETTES[props.palette];

  return (
    <View
      style={[styles.heroContainer, { backgroundColor: bg }]}
      testID={props.testID ?? "form-hero"}
    >
      <View style={[styles.heroDecor1, { backgroundColor: dark }]} />
      <View style={[styles.heroDecor2, { backgroundColor: dark }]} />
      <View style={styles.heroRow}>
        <View style={styles.heroIconWrap}>
          <Ionicons
            name={props.icon}
            size={28}
            color="rgba(255,255,255,0.92)"
          />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>{props.title}</Text>
          {props.subtitle ? (
            <Text style={styles.heroSubtitle}>{props.subtitle}</Text>
          ) : null}
        </View>
        {props.trailing}
      </View>
      {props.footer}
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    overflow: "hidden",
    position: "relative",
  },
  heroDecor1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    right: -30,
    opacity: 0.3,
  },
  heroDecor2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: -20,
    left: 40,
    opacity: 0.2,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    marginTop: 3,
  },
});
