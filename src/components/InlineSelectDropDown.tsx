import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useTranslation } from "../i18n/useTranslation";

export type InlineSelectDropDownOption = { value: string; label: string };

const SEARCH_THRESHOLD = 5;

function normalizeForSearch(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

interface InlineSelectDropDownProps {
  options: InlineSelectDropDownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  testID?: string;
  /** Override the default translated search placeholder. */
  searchPlaceholder?: string;
  /** Override the default translated "no results" label. */
  noResultsLabel?: string;
}

/**
 * Dropdown standard de l'app : toujours inline (jamais de Modal), pour rester
 * dans le flux keyboard-aware (adjustPan) de l'écran hôte. Le champ de
 * recherche n'apparaît qu'au-delà de `SEARCH_THRESHOLD` options ; la liste
 * est toujours affichée au-dessus du champ de recherche pour rester visible
 * pendant la saisie (adjustPan ne garantit que la visibilité de la vue
 * focalisée, pas de ce qui la suit dans le flux).
 */
export function InlineSelectDropDown({
  options,
  value,
  onChange,
  placeholder = "—",
  hasError,
  testID,
  searchPlaceholder,
  noResultsLabel,
}: InlineSelectDropDownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.value === value);
  const searchable = options.length > SEARCH_THRESHOLD;

  const filteredOptions = useMemo(() => {
    const needle = normalizeForSearch(search);
    if (!searchable || !needle) return options;
    return options.filter((o) => normalizeForSearch(o.label).includes(needle));
  }, [options, search, searchable]);

  function handleClose() {
    setSearch("");
    setOpen(false);
  }

  function handleTriggerPress() {
    if (open) {
      handleClose();
    } else {
      setSearch("");
      setOpen(true);
    }
  }

  function renderOption(item: InlineSelectDropDownOption) {
    const isSelected = item.value === value;
    return (
      <TouchableOpacity
        key={item.value || "__none__"}
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => {
          onChange(item.value);
          handleClose();
        }}
        activeOpacity={0.7}
        testID={testID ? `${testID}-option-${item.value || "none"}` : undefined}
      >
        <View style={[styles.optionCheck, isSelected && styles.optionCheckOn]}>
          {isSelected ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : null}
        </View>
        <Text
          style={[styles.optionText, isSelected && styles.optionTextSelected]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.trigger,
          open && styles.triggerOpen,
          hasError && styles.triggerError,
        ]}
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
        <View style={[styles.chevronWrap, open && styles.chevronWrapOpen]}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={15}
            color={open ? colors.primary : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {open ? (
        <View
          style={styles.panel}
          testID={testID ? `${testID}-panel` : undefined}
        >
          {filteredOptions.length === 0 ? (
            <Text style={styles.noResults}>
              {noResultsLabel ?? t("components.inlineSelect.noResults")}
            </Text>
          ) : (
            filteredOptions.map(renderOption)
          )}
          {searchable ? (
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={
                  searchPlaceholder ??
                  t("components.inlineSelect.searchPlaceholder")
                }
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                testID={testID ? `${testID}-search` : undefined}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
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
  triggerOpen: {
    borderColor: colors.primary,
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
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronWrapOpen: {
    backgroundColor: "rgba(8,70,125,0.08)",
  },
  panel: {
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 10,
    marginTop: 6,
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
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    marginVertical: 1,
    borderRadius: 6,
    gap: 10,
  },
  optionSelected: {
    backgroundColor: "rgba(8,70,125,0.06)",
  },
  optionCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCheckOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
