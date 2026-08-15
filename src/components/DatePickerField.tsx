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
  minimumDate?: Date;
  maximumDate?: Date;
};

type PickerMode = "days" | "months" | "years";

const YEARS_PER_PAGE = 12;

const MONTH_LABELS = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(
    new Date(2000, index, 1),
  ),
);

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

function buildYearsPage(pageStart: number): number[] {
  return Array.from(
    { length: YEARS_PER_PAGE },
    (_, index) => pageStart + index,
  );
}

function isYearDisabled(
  year: number,
  minimumDate?: Date,
  maximumDate?: Date,
): boolean {
  if (minimumDate && year < minimumDate.getFullYear()) return true;
  if (maximumDate && year > maximumDate.getFullYear()) return true;
  return false;
}

function isMonthDisabled(
  year: number,
  month: number,
  minimumDate?: Date,
  maximumDate?: Date,
): boolean {
  if (
    minimumDate &&
    (year < minimumDate.getFullYear() ||
      (year === minimumDate.getFullYear() && month < minimumDate.getMonth()))
  ) {
    return true;
  }
  if (
    maximumDate &&
    (year > maximumDate.getFullYear() ||
      (year === maximumDate.getFullYear() && month > maximumDate.getMonth()))
  ) {
    return true;
  }
  return false;
}

function isDayDisabled(
  date: Date,
  minimumDate?: Date,
  maximumDate?: Date,
): boolean {
  if (minimumDate && date < stripTime(minimumDate)) return true;
  if (maximumDate && date > stripTime(maximumDate)) return true;
  return false;
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
  minimumDate,
  maximumDate,
}: Props) {
  const parsedValue = useMemo(() => parseDateInput(value), [value]);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<PickerMode>("days");
  const [cursorDate, setCursorDate] = useState(parsedValue ?? new Date());
  const [draftDate, setDraftDate] = useState<Date | null>(parsedValue);
  const [yearsPageStart, setYearsPageStart] = useState(() => {
    const year = (parsedValue ?? new Date()).getFullYear();
    return year - (year % YEARS_PER_PAGE);
  });

  const monthRows = useMemo(() => buildMonthRows(cursorDate), [cursorDate]);
  const yearsPage = useMemo(
    () => buildYearsPage(yearsPageStart),
    [yearsPageStart],
  );

  function openPicker() {
    const nextValue = parseDateInput(value);
    const fallback = nextValue ?? new Date();
    setCursorDate(fallback);
    setDraftDate(nextValue);
    setYearsPageStart(
      fallback.getFullYear() - (fallback.getFullYear() % YEARS_PER_PAGE),
    );
    setMode("days");
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

  function openYearsPicker() {
    setYearsPageStart(
      cursorDate.getFullYear() - (cursorDate.getFullYear() % YEARS_PER_PAGE),
    );
    setMode("years");
  }

  function selectYear(year: number) {
    setCursorDate((current) => new Date(year, current.getMonth(), 1));
    setMode("months");
  }

  function selectMonth(monthIndex: number) {
    setCursorDate((current) => new Date(current.getFullYear(), monthIndex, 1));
    setMode("days");
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

            {mode === "days" ? (
              <>
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
                  <TouchableOpacity
                    style={styles.monthLabelButton}
                    onPress={openYearsPicker}
                    testID={testID ? `${testID}-open-years` : undefined}
                  >
                    <Text style={styles.monthLabel}>
                      {formatMonthLabel(cursorDate)}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
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
                        const disabled =
                          !cell ||
                          isDayDisabled(cell, minimumDate, maximumDate);
                        return (
                          <TouchableOpacity
                            key={iso ?? `empty-${rowIndex}-${colIndex}`}
                            style={[
                              styles.dayCell,
                              selected && styles.dayCellSelected,
                            ]}
                            onPress={() => cell && setDraftDate(cell)}
                            disabled={disabled}
                            testID={
                              iso && testID ? `${testID}-day-${iso}` : undefined
                            }
                          >
                            <Text
                              style={[
                                styles.dayText,
                                selected && styles.dayTextSelected,
                                disabled && styles.dayTextDisabled,
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
              </>
            ) : null}

            {mode === "years" ? (
              <>
                <View style={styles.monthNavRow}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() =>
                      setYearsPageStart((current) => current - YEARS_PER_PAGE)
                    }
                    testID={testID ? `${testID}-prev-years` : undefined}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.monthLabel}>
                    {yearsPageStart} - {yearsPageStart + YEARS_PER_PAGE - 1}
                  </Text>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() =>
                      setYearsPageStart((current) => current + YEARS_PER_PAGE)
                    }
                    testID={testID ? `${testID}-next-years` : undefined}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionGrid}>
                  {yearsPage.map((year) => {
                    const disabled = isYearDisabled(
                      year,
                      minimumDate,
                      maximumDate,
                    );
                    const selected = cursorDate.getFullYear() === year;
                    return (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.optionCell,
                          selected && styles.optionCellSelected,
                        ]}
                        onPress={() => selectYear(year)}
                        disabled={disabled}
                        testID={testID ? `${testID}-year-${year}` : undefined}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.optionTextSelected,
                            disabled && styles.dayTextDisabled,
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            {mode === "months" ? (
              <>
                <View style={styles.monthNavRow}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() =>
                      setCursorDate((current) => addMonths(current, -12))
                    }
                    testID={testID ? `${testID}-prev-year` : undefined}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.monthLabelButton}
                    onPress={openYearsPicker}
                    testID={
                      testID ? `${testID}-open-years-from-months` : undefined
                    }
                  >
                    <Text style={styles.monthLabel}>
                      {cursorDate.getFullYear()}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() =>
                      setCursorDate((current) => addMonths(current, 12))
                    }
                    testID={testID ? `${testID}-next-year` : undefined}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionGrid}>
                  {MONTH_LABELS.map((label, monthIndex) => {
                    const disabled = isMonthDisabled(
                      cursorDate.getFullYear(),
                      monthIndex,
                      minimumDate,
                      maximumDate,
                    );
                    const selected = cursorDate.getMonth() === monthIndex;
                    return (
                      <TouchableOpacity
                        key={monthIndex}
                        style={[
                          styles.optionCell,
                          selected && styles.optionCellSelected,
                        ]}
                        onPress={() => selectMonth(monthIndex)}
                        disabled={disabled}
                        testID={
                          testID ? `${testID}-month-${monthIndex}` : undefined
                        }
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.optionTextSelected,
                            disabled && styles.dayTextDisabled,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

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
  monthLabelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
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
  dayTextDisabled: {
    color: colors.textSecondary,
    opacity: 0.4,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionCell: {
    width: "31%",
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0D0BA",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    textTransform: "capitalize",
  },
  optionTextSelected: {
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
