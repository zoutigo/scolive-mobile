import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  closeLabel: string;
  error?: string | null;
  testIDPrefix: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  closeLabel,
  error,
  testIDPrefix,
}: Props) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError]}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        testID={`${testIDPrefix}-trigger`}
      >
        <Text
          style={[styles.triggerLabel, !selectedLabel && styles.placeholder]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

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
                <Text style={styles.closeLabel}>{closeLabel}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionRow,
                    value === option.value && styles.optionRowActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  testID={`${testIDPrefix}-option-${option.value}`}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      value === option.value && styles.optionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {value === option.value ? (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  trigger: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  triggerError: { borderColor: colors.notification },
  triggerLabel: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  placeholder: { color: colors.textSecondary },
  error: { fontSize: 12, color: colors.notification },
  overlay: { flex: 1, justifyContent: "center", padding: 20 },
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
  sheetTitle: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  closeLabel: { fontSize: 13, fontWeight: "700", color: colors.primary },
  optionsList: { maxHeight: 360 },
  optionRow: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  optionRowActive: { backgroundColor: colors.warmSurface },
  optionLabel: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  optionLabelActive: { color: colors.primary, fontWeight: "700" },
});
