import React from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

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
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        testID={backTestID}
      >
        <Ionicons name="arrow-back" size={20} color={colors.white} />
      </TouchableOpacity>
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
        <TouchableOpacity
          onPress={onRightPress}
          style={styles.backBtn}
          testID={rightTestID}
        >
          <Ionicons
            name={rightIcon as "refresh-outline"}
            size={20}
            color={colors.white}
          />
        </TouchableOpacity>
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
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
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
  },
  subtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    lineHeight: 15,
  },
});
