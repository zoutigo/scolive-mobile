import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export type PageHelpBlockProps = {
  title: string;
  body: string[];
  toggleOpenLabel: string;
  toggleCloseLabel: string;
  testID?: string;
  defaultOpen?: boolean;
};

export function PageHelpBlock({
  title,
  body,
  toggleOpenLabel,
  toggleCloseLabel,
  testID = "page-help-block",
  defaultOpen = false,
}: PageHelpBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.card} testID={testID}>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={styles.toggleRow}
        testID={`${testID}-toggle`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.toggleIconWrap}>
          <Ionicons name="help-circle" size={20} color={colors.accentTeal} />
        </View>
        <Text style={styles.toggleLabel} numberOfLines={2}>
          {open ? toggleCloseLabel : toggleOpenLabel}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.accentTealDark}
        />
      </Pressable>

      {open ? (
        <View style={styles.content} testID={`${testID}-content`}>
          <Text style={styles.title}>{title}</Text>
          {body.map((paragraph, index) => (
            <Text key={index} style={styles.body}>
              {paragraph}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFE3DE",
    backgroundColor: "#EAF6F4",
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#D5EEEA",
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: "justify",
  },
});
