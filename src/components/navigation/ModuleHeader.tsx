import React from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme";
import { HeaderBackButton } from "./HeaderBackButton";
import { HeaderMenuButton } from "./HeaderMenuButton";

interface ModuleHeaderProps {
  title: string;
  subtitle?: string | null;
  onBack: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  testID?: string;
  backTestID?: string;
  titleTestID?: string;
  subtitleTestID?: string;
  rightTestID?: string;
  topInset?: number;
  backgroundColor?: string;
}

export function ModuleHeader({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  testID = "module-header",
  backTestID = "module-header-back",
  titleTestID = "module-header-title",
  subtitleTestID = "module-header-subtitle",
  rightTestID = "module-header-right",
  topInset = 0,
  backgroundColor = colors.primary,
}: ModuleHeaderProps) {
  const androidStatusInset =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
  const resolvedTopInset = Math.max(topInset, androidStatusInset);

  return (
    <View
      style={[
        styles.headerCard,
        { paddingTop: resolvedTopInset + 10, backgroundColor },
      ]}
      testID={testID}
    >
      {/* Blobs décoratifs */}
      <View style={styles.blobTopRight} pointerEvents="none" />
      <View style={styles.blobBottomLeft} pointerEvents="none" />
      <View style={styles.blobMid} pointerEvents="none" />

      <HeaderBackButton onPress={onBack} testID={backTestID} />
      <View style={styles.headerText}>
        <Text style={styles.title} numberOfLines={1} testID={titleTestID}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={styles.subtitle}
            numberOfLines={1}
            testID={subtitleTestID}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightIcon && onRightPress ? (
        <HeaderMenuButton onPress={onRightPress} testID={rightTestID} />
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  blobTopRight: {
    position: "absolute",
    top: -60,
    right: -45,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "#F7C260",
    opacity: 0.09,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -50,
    left: -25,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "#E07B2A",
    opacity: 0.11,
  },
  blobMid: {
    position: "absolute",
    top: -30,
    right: 90,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    opacity: 0.05,
  },
  rightSpacer: {
    width: 38,
    height: 38,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "600",
    textTransform: "uppercase",
    textAlign: "center",
  },
  subtitle: {
    color: colors.warmAccent,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
});
