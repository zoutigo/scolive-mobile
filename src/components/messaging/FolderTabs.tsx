import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { colors } from "../../theme";
import type { FolderKey } from "../../types/messaging.types";

interface FolderTab {
  key: FolderKey;
  label: string;
  badge?: number;
}

interface Props {
  activeFolder: FolderKey;
  unreadCount: number;
  onSelect: (folder: FolderKey) => void;
}

const FOLDERS: FolderTab[] = [
  { key: "inbox", label: "Réception" },
  { key: "sent", label: "Envoyés" },
  { key: "drafts", label: "Brouillons" },
  { key: "archive", label: "Archives" },
];

export function FolderTabs({ activeFolder, unreadCount, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {FOLDERS.map((tab) => {
          const isActive = tab.key === activeFolder;
          const badge =
            tab.key === "inbox" && unreadCount > 0 ? unreadCount : 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelect(tab.key)}
              activeOpacity={0.7}
              testID={`folder-tab-${tab.key}`}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
              {badge > 0 && (
                <View style={styles.badge} testID={`folder-badge-${tab.key}`}>
                  <Text style={styles.badgeText}>
                    {badge > 99 ? "99+" : String(badge)}
                  </Text>
                </View>
              )}
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
