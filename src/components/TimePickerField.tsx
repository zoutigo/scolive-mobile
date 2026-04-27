import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { timeLabelToMinute } from "../utils/timetable";

function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

function parseTimeValue(value: string | undefined | null) {
  if (!value) return null;
  const totalMinutes = timeLabelToMinute(value);
  if (totalMinutes === null) return null;
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

function buildTimeLabel(hour: number, minute: number) {
  return `${padTimePart(hour)}:${padTimePart(minute)}`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  padTimePart(index),
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  padTimePart(index),
);

interface TimePickerFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  hasError?: boolean;
  testID?: string;
}

export function TimePickerField({
  value,
  onChange,
  onBlur,
  placeholder = "Choisir une heure",
  title = "Choisir un horaire",
  disabled = false,
  hasError = false,
  testID,
}: TimePickerFieldProps) {
  const parsedValue = useMemo(() => parseTimeValue(value), [value]);
  const [isVisible, setIsVisible] = useState(false);
  const [draftHour, setDraftHour] = useState(parsedValue?.hour ?? 8);
  const [draftMinute, setDraftMinute] = useState(parsedValue?.minute ?? 0);

  function openPicker() {
    const nextValue = parseTimeValue(value);
    setDraftHour(nextValue?.hour ?? 8);
    setDraftMinute(nextValue?.minute ?? 0);
    setIsVisible(true);
  }

  function closePicker() {
    setIsVisible(false);
    onBlur?.();
  }

  function confirmSelection() {
    onChange(buildTimeLabel(draftHour, draftMinute));
    closePicker();
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          hasError && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={openPicker}
        disabled={disabled}
        testID={testID}
      >
        <View style={styles.triggerContent}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text
            style={[
              styles.triggerValue,
              !parsedValue && styles.triggerPlaceholder,
            ]}
          >
            {parsedValue
              ? buildTimeLabel(parsedValue.hour, parsedValue.minute)
              : placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={hasError ? colors.notification : colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={isVisible}
        onRequestClose={closePicker}
      >
        <Pressable style={styles.backdrop} onPress={closePicker}>
          <Pressable
            style={styles.sheet}
            onPress={(event) => event.stopPropagation()}
            testID={testID ? `${testID}-modal` : undefined}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text
                style={styles.sheetValue}
                testID={testID ? `${testID}-preview` : undefined}
              >
                {buildTimeLabel(draftHour, draftMinute)}
              </Text>
            </View>

            <View style={styles.columns}>
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Heure</Text>
                <ScrollView
                  style={styles.wheel}
                  contentContainerStyle={styles.wheelContent}
                  showsVerticalScrollIndicator={false}
                >
                  {HOUR_OPTIONS.map((hourLabel, index) => {
                    const selected = index === draftHour;
                    return (
                      <TouchableOpacity
                        key={hourLabel}
                        style={[
                          styles.option,
                          selected && styles.optionSelected,
                        ]}
                        onPress={() => setDraftHour(index)}
                        testID={
                          testID ? `${testID}-hour-${hourLabel}` : undefined
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.optionTextSelected,
                          ]}
                        >
                          {hourLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.column}>
                <Text style={styles.columnLabel}>Minute</Text>
                <ScrollView
                  style={styles.wheel}
                  contentContainerStyle={styles.wheelContent}
                  showsVerticalScrollIndicator={false}
                >
                  {MINUTE_OPTIONS.map((minuteLabel, index) => {
                    const selected = index === draftMinute;
                    return (
                      <TouchableOpacity
                        key={minuteLabel}
                        style={[
                          styles.option,
                          selected && styles.optionSelected,
                        ]}
                        onPress={() => setDraftMinute(index)}
                        testID={
                          testID ? `${testID}-minute-${minuteLabel}` : undefined
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.optionTextSelected,
                          ]}
                        >
                          {minuteLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={closePicker}
                testID={testID ? `${testID}-cancel` : undefined}
              >
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={confirmSelection}
                testID={testID ? `${testID}-confirm` : undefined}
              >
                <Text style={styles.primaryButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerError: {
    borderColor: colors.notification,
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  triggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  triggerValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  triggerPlaceholder: {
    fontWeight: "500",
    color: colors.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sheetHeader: {
    gap: 6,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sheetValue: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
  },
  columns: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },
  wheel: {
    maxHeight: 220,
    borderRadius: 18,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "rgba(12,95,168,0.12)",
  },
  wheelContent: {
    padding: 10,
    gap: 6,
  },
  option: {
    minHeight: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.white,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  secondaryButton: {
    minWidth: 104,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  primaryButton: {
    minWidth: 104,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});
