import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
   * When provided, a search field is shown above the option list and filters
   * options by label as the user types. Omit for short, fixed lists.
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

  function handleOpen() {
    setSearch("");
    setOpen(true);
  }

  function handleClose() {
    setSearch("");
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, hasError && styles.triggerError]}
        onPress={handleOpen}
        testID={testID}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholderText]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.sheetWrap}
          pointerEvents="box-none"
        >
          <View style={styles.sheet} pointerEvents="box-none">
            {searchable ? (
              <View style={styles.searchWrap}>
                <Ionicons
                  name="search"
                  size={16}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.textSecondary}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID={testID ? `${testID}-search` : undefined}
                />
              </View>
            ) : null}
            {searchable && filteredOptions.length === 0 ? (
              <Text style={styles.noResults}>{noResultsLabel}</Text>
            ) : (
              <FlatList
                data={filteredOptions}
                keyExtractor={(o) => o.value || "__none__"}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      item.value === value && styles.optionSelected,
                    ]}
                    onPress={() => {
                      onChange(item.value);
                      handleClose();
                    }}
                    testID={
                      testID
                        ? `${testID}-option-${item.value || "none"}`
                        : undefined
                    }
                  >
                    <View style={styles.optionCheck}>
                      {item.value === value ? (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colors.primary}
                        />
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
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
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
