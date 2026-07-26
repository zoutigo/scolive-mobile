import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  InfiniteScrollList,
  canTriggerInfiniteScroll,
} from "../lists/InfiniteScrollList";

export type SearchableDropdownItem = {
  id: string;
  label: string;
  sublabel?: string;
};

type SearchableDropdownProps = {
  value: SearchableDropdownItem | null;
  items: SearchableDropdownItem[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  searchValue: string;
  onSearchChange: (text: string) => void;
  onLoadMore?: () => void;
  onSelect: (item: SearchableDropdownItem) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  title: string;
  testIDPrefix: string;
  disabled?: boolean;
};

export function SearchableDropdown({
  value,
  items,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  searchValue,
  onSearchChange,
  onLoadMore,
  onSelect,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  title,
  testIDPrefix,
  disabled = false,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        testID={`${testIDPrefix}-trigger`}
      >
        <Text
          style={[styles.triggerText, !value && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {value?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.accentTeal} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        testID={`${testIDPrefix}-modal`}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                testID={`${testIDPrefix}-modal-close`}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={searchValue}
                onChangeText={onSearchChange}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                testID={`${testIDPrefix}-search-input`}
              />
            </View>

            {isLoading && items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{emptyLabel}</Text>
              </View>
            ) : (
              <InfiniteScrollList
                data={items}
                keyExtractor={(item) => item.id}
                style={styles.list}
                onLoadMore={onLoadMore}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                testID={`${testIDPrefix}-list`}
                emptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>{emptyLabel}</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const active = value?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.row, active && styles.rowActive]}
                      onPress={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                      testID={`${testIDPrefix}-item-${item.id}`}
                    >
                      <View style={styles.rowText}>
                        <Text
                          style={[
                            styles.rowLabel,
                            active && styles.rowLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {item.sublabel ? (
                          <Text
                            style={[
                              styles.rowSublabel,
                              active && styles.rowLabelActive,
                            ]}
                            numberOfLines={1}
                          >
                            {item.sublabel}
                          </Text>
                        ) : null}
                      </View>
                      {active ? (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.white}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

export { canTriggerInfiniteScroll };

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  triggerPlaceholder: {
    fontWeight: "500",
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,22,41,0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "75%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  list: {
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  rowActive: {
    backgroundColor: colors.accentTeal,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowSublabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowLabelActive: {
    color: colors.white,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
