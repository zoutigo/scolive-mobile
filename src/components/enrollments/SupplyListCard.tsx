import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { ChildSupplyList } from "../../types/supply-lists.types";

interface Props {
  student: { id: string; firstName: string; lastName: string };
  supplyList: ChildSupplyList | undefined;
  loading: boolean;
}

export function SupplyListCard({ student, supplyList, loading }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.card} testID={`supply-list-card-${student.id}`}>
      <Text style={styles.name}>
        {student.firstName} {student.lastName}
      </Text>

      {loading ? (
        <Text style={styles.meta}>{t("common.loading")}</Text>
      ) : !supplyList || supplyList.targetSchoolYearId === null ? (
        <Text style={styles.meta}>
          {t("reinscription.supplies.notOpenYet")}
        </Text>
      ) : supplyList.items.length === 0 ? (
        <Text style={styles.meta}>{t("reinscription.supplies.empty")}</Text>
      ) : (
        <View style={styles.items}>
          {supplyList.targetSchoolYearLabel ? (
            <Text style={styles.yearLabel}>
              {supplyList.targetSchoolYearLabel}
            </Text>
          ) : null}
          {supplyList.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemLabel}>
                {item.quantity}× {item.label}
              </Text>
              {item.note ? (
                <Text style={styles.itemNote}>{item.note}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  yearLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accentTealDark,
  },
  items: {
    gap: 6,
  },
  itemRow: {
    gap: 2,
  },
  itemLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  itemNote: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
