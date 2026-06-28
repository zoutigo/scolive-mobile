import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { FeedFilter } from "../../types/feed.types";

type Tab = {
  key: FeedFilter;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey:
    | "feed.filters.all"
    | "feed.filters.featured"
    | "feed.filters.polls"
    | "feed.filters.mine";
};

const TABS: Tab[] = [
  { key: "all", icon: "albums-outline", labelKey: "feed.filters.all" },
  {
    key: "featured",
    icon: "sparkles-outline",
    labelKey: "feed.filters.featured",
  },
  {
    key: "polls",
    icon: "stats-chart-outline",
    labelKey: "feed.filters.polls",
  },
  { key: "mine", icon: "person-outline", labelKey: "feed.filters.mine" },
];

type Props = {
  activeFilter: FeedFilter;
  unreadCounts: Partial<Record<FeedFilter, number>>;
  onSelect: (filter: FeedFilter) => void;
};

export function FeedFilterTabs({
  activeFilter,
  unreadCounts,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeFilter;
          const count = unreadCounts[tab.key] ?? 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelect(tab.key)}
              activeOpacity={0.7}
              testID={`feed-filter-tab-${tab.key}`}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {t(tab.labelKey)}
              </Text>
              {count > 0 ? (
                <View
                  style={styles.badge}
                  testID={`feed-filter-badge-${tab.key}`}
                >
                  <Text style={styles.badgeText}>
                    {count > 99 ? "99+" : String(count)}
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
