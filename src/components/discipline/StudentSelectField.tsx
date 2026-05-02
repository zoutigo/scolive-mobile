import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export type StudentSelectOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: StudentSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyOptionLabel?: string;
  allowEmpty?: boolean;
  testIDPrefix: string;
};

export function StudentSelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Choisir un élève",
  emptyOptionLabel = "Tous les élèves",
  allowEmpty = true,
  testIDPrefix,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    (value === "" && allowEmpty ? emptyOptionLabel : placeholder);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.trigger}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        testID={`${testIDPrefix}-trigger`}
      >
        <Text
          style={[styles.triggerLabel, !value && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                testID={`${testIDPrefix}-close`}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.textSecondary}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher un élève"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                testID={`${testIDPrefix}-search`}
              />
            </View>

            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {allowEmpty ? (
                <SelectOptionRow
                  active={value === ""}
                  label={emptyOptionLabel}
                  onPress={() => {
                    onChange("");
                    setOpen(false);
                    setQuery("");
                  }}
                  testID={`${testIDPrefix}-option-empty`}
                />
              ) : null}

              {filteredOptions.map((option) => (
                <SelectOptionRow
                  key={option.value}
                  active={value === option.value}
                  label={option.label}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  testID={`${testIDPrefix}-option-${option.value}`}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SelectOptionRow(props: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, props.active && styles.optionRowActive]}
      onPress={props.onPress}
      activeOpacity={0.8}
      testID={props.testID}
    >
      <Text
        style={[styles.optionLabel, props.active && styles.optionLabelActive]}
      >
        {props.label}
      </Text>
      {props.active ? (
        <Ionicons name="checkmark" size={16} color={colors.primary} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  trigger: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  triggerLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },
  triggerPlaceholder: {
    color: colors.textSecondary,
    fontWeight: "400",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 12,
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  searchRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },
  optionsList: {
    maxHeight: 360,
  },
  optionRow: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  optionRowActive: {
    backgroundColor: colors.warmSurface,
  },
  optionLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  optionLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
