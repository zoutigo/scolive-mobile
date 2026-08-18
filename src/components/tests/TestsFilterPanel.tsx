import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { InlineSelectDropDown } from "../InlineSelectDropDown";

/**
 * Recherche + bouton filtre + panneau de filtres inline (teal), pattern
 * standard de l'app (skill improve-mobile-search, référence
 * SchoolsAdminScreen.tsx). Les onglets du module Tests vivent déjà à
 * l'intérieur d'une ScrollView de page (app/(home)/tests/index.tsx), donc le
 * panneau reste dans le flux normal de la page : pas de flex:1 ni de
 * ScrollView imbriquée, le footer Reset/Close/Apply reste atteignable par le
 * scroll normal de la page.
 */

export function TestsSearchRow(props: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  clearAccessibilityLabel: string;
  filtersActive: boolean;
  onToggleFilters: () => void;
  toggleAccessibilityLabel: string;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.searchRow} testID={`${props.testIDPrefix}-search-row`}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={props.value}
          onChangeText={props.onChangeText}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          autoCapitalize="none"
          accessibilityLabel={props.accessibilityLabel}
          testID={`${props.testIDPrefix}-search-input`}
        />
        {props.value.length > 0 ? (
          <TouchableOpacity
            onPress={() => props.onChangeText("")}
            testID={`${props.testIDPrefix}-search-clear`}
            accessibilityLabel={props.clearAccessibilityLabel}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity
        style={[
          styles.filterToggle,
          props.filtersActive && styles.filterToggleActive,
        ]}
        onPress={props.onToggleFilters}
        testID={`${props.testIDPrefix}-filter-toggle`}
        accessibilityLabel={props.toggleAccessibilityLabel}
      >
        <Ionicons
          name={props.filtersActive ? "filter" : "filter-outline"}
          size={18}
          color={props.filtersActive ? colors.white : colors.accentTeal}
        />
      </TouchableOpacity>
    </View>
  );
}

export function TestsFilterPanel(props: {
  visible: boolean;
  titleLabel: string;
  resetLabel: string;
  closeLabel: string;
  applyLabel: string;
  onReset: () => void;
  onClose: () => void;
  onApply: () => void;
  testIDPrefix: string;
  children: React.ReactNode;
}) {
  if (!props.visible) return null;
  return (
    <View
      style={styles.filterPanel}
      testID={`${props.testIDPrefix}-filter-panel`}
    >
      <View style={styles.filterPanelHeader}>
        <View style={styles.filterPanelHeaderIcon}>
          <Ionicons
            name="options-outline"
            size={16}
            color={colors.accentTealDark}
          />
        </View>
        <Text style={styles.filterPanelHeaderTitle}>{props.titleLabel}</Text>
      </View>

      {props.children}

      <View style={styles.filterActionsRow}>
        <TouchableOpacity
          style={styles.filterActionReset}
          onPress={props.onReset}
          testID={`${props.testIDPrefix}-filter-reset`}
        >
          <Text style={styles.filterActionResetLabel}>{props.resetLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterActionClose}
          onPress={props.onClose}
          testID={`${props.testIDPrefix}-filter-close`}
        >
          <Text style={styles.filterActionCloseLabel}>{props.closeLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterActionApply}
          onPress={props.onApply}
          testID={`${props.testIDPrefix}-filter-apply`}
        >
          <Ionicons name="checkmark" size={15} color={colors.white} />
          <Text style={styles.filterActionApplyLabel}>{props.applyLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function FilterChipsGroup<TValue extends string>(props: {
  label: string;
  allLabel: string;
  options: Array<{ value: TValue; label: string }>;
  value: TValue | null;
  onChange: (value: TValue | null) => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{props.label}</Text>
      <View style={styles.filterChipsRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            props.value == null && styles.filterChipActive,
          ]}
          onPress={() => props.onChange(null)}
          testID={`${props.testIDPrefix}-all`}
        >
          <Text
            style={[
              styles.filterChipLabel,
              props.value == null && styles.filterChipLabelActive,
            ]}
          >
            {props.allLabel}
          </Text>
        </TouchableOpacity>
        {props.options.map((option) => {
          const selected = props.value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => props.onChange(option.value)}
              testID={`${props.testIDPrefix}-${option.value}`}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  selected && styles.filterChipLabelActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function FilterToggleGroup(props: {
  label: string;
  activeLabel: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{props.label}</Text>
      <View style={styles.filterChipsRow}>
        <TouchableOpacity
          style={[styles.filterChip, props.value && styles.filterChipActive]}
          onPress={() => props.onChange(!props.value)}
          testID={testIdOf(props.testIDPrefix)}
        >
          <Ionicons
            name={props.value ? "person" : "person-outline"}
            size={14}
            color={props.value ? colors.white : colors.textSecondary}
          />
          <Text
            style={[
              styles.filterChipLabel,
              styles.filterChipLabelWithIcon,
              props.value && styles.filterChipLabelActive,
            ]}
          >
            {props.activeLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function testIdOf(prefix: string) {
  return prefix;
}

export const FILTER_DROPDOWN_ALL_VALUE = "__ALL__";

export function FilterDropdownGroup<TValue extends string>(props: {
  label: string;
  allLabel: string;
  options: Array<{ value: TValue; label: string }>;
  value: TValue | null;
  onChange: (value: TValue | null) => void;
  testID: string;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{props.label}</Text>
      <InlineSelectDropDown
        options={[
          { value: FILTER_DROPDOWN_ALL_VALUE, label: props.allLabel },
          ...props.options,
        ]}
        value={props.value ?? FILTER_DROPDOWN_ALL_VALUE}
        onChange={(next) =>
          props.onChange(
            next === FILTER_DROPDOWN_ALL_VALUE ? null : (next as TValue),
          )
        }
        testID={props.testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterToggleActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterPanel: {
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}33`,
    backgroundColor: colors.surface,
    gap: 14,
  },
  filterPanelHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterPanelHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.accentTeal}1F`,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPanelHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  filterGroup: { gap: 8 },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipLabelWithIcon: {},
  filterChipLabelActive: { color: colors.white },
  filterActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterActionReset: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionResetLabel: {
    color: colors.warmAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionClose: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionCloseLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionApply: {
    flex: 1.3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 11,
  },
  filterActionApplyLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
