import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../theme";
import type { SchoolUserRoleFilter } from "../../types/users.types";

interface FilterChip {
  key: SchoolUserRoleFilter;
  label: string;
}

const FILTER_CHIPS: FilterChip[] = [
  { key: "ALL", label: "Tous" },
  { key: "TEACHER", label: "Profs" },
  { key: "PARENT", label: "Parents" },
  { key: "STUDENT", label: "Élèves" },
  { key: "SCHOOL_ADMIN", label: "Admins" },
  { key: "SCHOOL_STAFF", label: "Staff" },
];

interface RoleFilterBarProps {
  selected: SchoolUserRoleFilter;
  onSelect: (role: SchoolUserRoleFilter) => void;
  testID?: string;
}

export function RoleFilterBar({
  selected,
  onSelect,
  testID,
}: RoleFilterBarProps) {
  return (
    <View style={styles.wrapper} testID={testID ?? "role-filter-bar"}>
      <View style={styles.row}>
        {FILTER_CHIPS.map((chip) => {
          const isActive = chip.key === selected;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(chip.key)}
              activeOpacity={0.7}
              testID={`role-filter-${chip.key.toLowerCase()}`}
            >
              <Text
                style={[styles.chipLabel, isActive && styles.chipLabelActive]}
                numberOfLines={1}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export { FILTER_CHIPS };

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  row: {
    flexDirection: "row",
    gap: 5,
  },
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.white,
  },
});
