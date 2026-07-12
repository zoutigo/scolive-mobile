import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export type SelectOption = {
  value: string;
  label: string;
};

interface SelectDropdownProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  testID?: string;
  /**
   * When provided, the dropdown expands inline (no Modal) with a search field
   * above the option list, filtering options by label as the user types.
   * Inline rendering keeps the list inside the screen's own keyboard-aware
   * layout (adjustPan), which a native Modal window cannot benefit from.
   * Omit for short, fixed lists with no search need.
   */
  searchPlaceholder?: string;
  /** Label shown when the search filters out every option. Required alongside `searchPlaceholder`. */
  noResultsLabel?: string;
}

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = "—",
  hasError,
  testID,
  searchPlaceholder,
  noResultsLabel,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.value === value);
  const searchable = !!searchPlaceholder;

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const needle = search.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, search, searchable]);

  function handleClose() {
    setSearch("");
    setOpen(false);
  }

  function handleTriggerPress() {
    if (searchable) {
      if (open) {
        handleClose();
      } else {
        setSearch("");
        setOpen(true);
      }
      return;
    }
    setOpen(true);
  }

  function renderOption(item: SelectOption) {
    return (
      <TouchableOpacity
        key={item.value || "__none__"}
        style={[styles.option, item.value === value && styles.optionSelected]}
        onPress={() => {
          onChange(item.value);
          handleClose();
        }}
        testID={testID ? `${testID}-option-${item.value || "none"}` : undefined}
      >
        <View style={styles.optionCheck}>
          {item.value === value ? (
            <Ionicons name="checkmark" size={16} color={colors.primary} />
          ) : null}
        </View>
        <Text
          style={[
            styles.optionText,
            item.value === value && styles.optionTextSelected,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.trigger, hasError && styles.triggerError]}
        onPress={handleTriggerPress}
        testID={testID}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholderText]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons
          name={searchable && open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {searchable ? (
        open ? (
          <View
            style={styles.inlinePanel}
            testID={testID ? `${testID}-panel` : undefined}
          >
            {filteredOptions.length === 0 ? (
              <Text style={styles.noResults}>{noResultsLabel}</Text>
            ) : (
              filteredOptions.map(renderOption)
            )}
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                testID={testID ? `${testID}-search` : undefined}
              />
            </View>
          </View>
        ) : null
      ) : (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={handleClose}
          testID={testID ? `${testID}-modal` : undefined}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={handleClose}
            testID={testID ? `${testID}-overlay` : undefined}
          />
          <View style={styles.sheetWrap} pointerEvents="box-none">
            <View style={styles.sheet} pointerEvents="box-none">
              <FlatList
                data={options}
                keyExtractor={(o) => o.value || "__none__"}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => renderOption(item)}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  triggerError: {
    borderColor: colors.notification,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textSecondary,
    fontWeight: "400",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: "55%",
  },
  inlinePanel: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
    paddingVertical: 8,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  noResults: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    textAlign: "center",
    fontSize: 13,
    color: colors.textSecondary,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0E8DC",
    gap: 12,
  },
  optionSelected: {
    backgroundColor: "rgba(8,70,125,0.05)",
  },
  optionCheck: {
    width: 20,
    alignItems: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: "700",
    color: colors.primary,
  },
});
