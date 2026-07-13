import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export type InlineSearchSelectOption = {
  value: string;
  label: string;
};

interface InlineSearchSelectProps {
  label: string;
  options: InlineSearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Options are still being fetched: field is disabled and shows a spinner instead of looking unresponsive. */
  loading?: boolean;
  hasError?: boolean;
  testID: string;
  /** Called with the raw query text as the user types, e.g. to trigger a server-side search. */
  onQueryChange?: (query: string) => void;
}

function normalizeForSearch(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function InlineSearchSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "—",
  disabled = false,
  loading = false,
  hasError = false,
  testID,
  onQueryChange,
}: InlineSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isDisabled = disabled || loading;

  const selected = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return options;
    return options.filter((o) =>
      normalizeForSearch(o.label).includes(normalizedQuery),
    );
  }, [options, query]);

  const displayedText = open ? query : (selected?.label ?? "");

  return (
    <View style={styles.row} testID={testID}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.fieldColumn}>
        <View
          style={[
            styles.inputWrapper,
            hasError && styles.inputWrapperError,
            isDisabled && styles.inputWrapperDisabled,
          ]}
        >
          <TextInput
            value={displayedText}
            onChangeText={(text) => {
              setQuery(text);
              if (!open) setOpen(true);
              onQueryChange?.(text);
            }}
            onFocus={() => {
              if (isDisabled) return;
              setOpen(true);
              setQuery("");
            }}
            onBlur={() => {
              setOpen(false);
              setQuery("");
            }}
            editable={!isDisabled}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            testID={`${testID}-input`}
          />
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.textSecondary}
              testID={`${testID}-loading`}
            />
          ) : !disabled ? (
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textSecondary}
            />
          ) : null}
        </View>
        {open && filteredOptions.length > 0 ? (
          <View style={styles.suggestions} testID={`${testID}-suggestions`}>
            <FlatList
              data={filteredOptions}
              keyExtractor={(o) => o.value}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.suggestionOption,
                    item.value === value && styles.suggestionOptionSelected,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  testID={`${testID}-option-${item.value}`}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      item.value === value && styles.suggestionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : null}
        {open && filteredOptions.length === 0 ? (
          <View style={styles.suggestions} testID={`${testID}-suggestions`}>
            <Text style={styles.emptyText}>{placeholder}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  label: {
    width: 110,
    paddingTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  fieldColumn: {
    flex: 1,
    position: "relative",
    zIndex: 10,
  },
  inputWrapper: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  inputWrapperError: {
    borderColor: colors.notification,
  },
  inputWrapperDisabled: {
    backgroundColor: "#F3EEE4",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    padding: 0,
  },
  suggestions: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0D0BA",
    maxHeight: 220,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
    padding: 4,
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  suggestionOptionSelected: {
    backgroundColor: "rgba(8,70,125,0.08)",
  },
  suggestionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  suggestionTextSelected: {
    fontWeight: "700",
    color: colors.primary,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
