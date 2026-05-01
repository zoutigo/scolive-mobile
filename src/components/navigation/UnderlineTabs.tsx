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
};

export function UnderlineTabs<T extends string>({
  items,
  activeKey,
  onSelect,
  testIDPrefix,
}: Props<T>) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelect(item.key)}
              activeOpacity={0.7}
              testID={`${testIDPrefix}-${item.key}`}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>
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
        })}
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
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
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
