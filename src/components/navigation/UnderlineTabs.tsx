import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../theme";

export type UnderlineTabItem<T extends string> = {
  key: T;
  label: string;
  badge?: number;
};

type Props<T extends string> = {
  items: Array<UnderlineTabItem<T>>;
  activeKey: T;
  onSelect: (key: T) => void;
  testIDPrefix: string;
  /** When true, tabs share the available width equally instead of scrolling horizontally. */
  fitWidth?: boolean;
};

export function UnderlineTabs<T extends string>({
  items,
  activeKey,
  onSelect,
  testIDPrefix,
  fitWidth,
}: Props<T>) {
  const tabs = items.map((item) => {
    const isActive = item.key === activeKey;
    return (
      <TouchableOpacity
        key={item.key}
        style={[
          styles.tab,
          fitWidth && styles.tabFit,
          isActive && styles.tabActive,
        ]}
        onPress={() => onSelect(item.key)}
        activeOpacity={0.7}
        testID={`${testIDPrefix}-${item.key}`}
      >
        <Text
          style={[
            styles.label,
            fitWidth && styles.labelFit,
            isActive && styles.labelActive,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={fitWidth}
          minimumFontScale={0.8}
        >
          {item.label}
        </Text>
        {item.badge && item.badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.badge > 99 ? "99+" : String(item.badge)}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  });

  if (fitWidth) {
    return (
      <View style={styles.container}>
        <View style={styles.fitRow}>{tabs}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {tabs}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    gap: 4,
  },
  fitRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabFit: {
    flex: 1,
    paddingHorizontal: 4,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  labelFit: {
    fontSize: 12,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
