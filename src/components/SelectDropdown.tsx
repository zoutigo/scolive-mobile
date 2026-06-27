import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
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
}

export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = "—",
  hasError,
  testID,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, hasError && styles.triggerError]}
        onPress={() => setOpen(true)}
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
        onRequestClose={() => setOpen(false)}
        testID={testID ? `${testID}-modal` : undefined}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
          testID={testID ? `${testID}-overlay` : undefined}
        />
        <View style={styles.sheet} pointerEvents="box-none">
          <FlatList
            data={options}
            keyExtractor={(o) => o.value || "__none__"}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  item.value === value && styles.optionSelected,
                ]}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
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
        </View>
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
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxHeight: "55%",
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
