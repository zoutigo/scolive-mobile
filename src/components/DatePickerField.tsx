import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import {
  addMonths,
  formatMonthLabel,
  parseDateInput,
  toIsoDateString,
} from "../utils/timetable";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  hasError?: boolean;
  testID?: string;
};

function buildMonthRows(cursorDate: Date): Array<Array<Date | null>> {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const cells: Array<Date | null> = [];

  for (let index = 0; index < leading; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: Array<Array<Date | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function formatDisplayDate(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function DatePickerField({
  value,
  onChange,
  onBlur,
  placeholder = "Choisir une date",
  title = "Choisir une date",
  disabled = false,
  hasError = false,
  testID,
}: Props) {
  const parsedValue = useMemo(() => parseDateInput(value), [value]);
  const [visible, setVisible] = useState(false);
  const [cursorDate, setCursorDate] = useState(parsedValue ?? new Date());
  const [draftDate, setDraftDate] = useState<Date | null>(parsedValue);

  const monthRows = useMemo(() => buildMonthRows(cursorDate), [cursorDate]);

  function openPicker() {
    const nextValue = parseDateInput(value);
    const fallback = nextValue ?? new Date();
    setCursorDate(fallback);
    setDraftDate(nextValue);
    setVisible(true);
  }

  function closePicker() {
    setVisible(false);
    onBlur?.();
  }

  function confirmSelection() {
    if (draftDate) {
      onChange(toIsoDateString(draftDate));
    }
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
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text
            style={[
              styles.triggerValue,
              !parsedValue && styles.triggerPlaceholder,
            ]}
          >
            {parsedValue ? formatDisplayDate(value) : placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={hasError ? colors.notification : colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
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
                {draftDate
                  ? formatDisplayDate(toIsoDateString(draftDate))
                  : placeholder}
              </Text>
            </View>

            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() =>
                  setCursorDate((current) => addMonths(current, -1))
                }
                testID={testID ? `${testID}-prev-month` : undefined}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {formatMonthLabel(cursorDate)}
              </Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() =>
                  setCursorDate((current) => addMonths(current, 1))
                }
                testID={testID ? `${testID}-next-month` : undefined}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => (
                <Text key={index} style={styles.weekdayText}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {monthRows.map((row, rowIndex) => (
                <View
                  key={rowIndex}
                  style={styles.gridRow}
                  testID={testID ? `${testID}-row-${rowIndex}` : undefined}
                >
                  {row.map((cell, colIndex) => {
                    const iso = cell ? toIsoDateString(cell) : null;
                    const selected =
                      iso && draftDate
                        ? iso === toIsoDateString(draftDate)
                        : false;
                    return (
                      <TouchableOpacity
                        key={iso ?? `empty-${rowIndex}-${colIndex}`}
                        style={[
                          styles.dayCell,
                          selected && styles.dayCellSelected,
                        ]}
                        onPress={() => cell && setDraftDate(cell)}
                        disabled={!cell}
                        testID={
                          iso && testID ? `${testID}-day-${iso}` : undefined
                        }
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selected && styles.dayTextSelected,
                          ]}
                        >
                          {cell ? String(cell.getDate()) : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
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
                style={[
                  styles.primaryButton,
                  !draftDate && styles.primaryButtonDisabled,
                ]}
                onPress={confirmSelection}
                disabled={!draftDate}
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
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
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
    gap: 10,
    flex: 1,
  },
  triggerValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  triggerPlaceholder: {
    color: colors.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    backgroundColor: colors.white,
    padding: 18,
    gap: 14,
  },
  sheetHeader: {
    gap: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  sheetValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  grid: {
    gap: 4,
  },
  gridRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.white,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
  },
});
