import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useTranslation } from "../../i18n/useTranslation";
import { supplyListsApi } from "../../api/supply-lists.api";
import type { ChildSupplyList } from "../../types/supply-lists.types";
import { ModuleHeader } from "../navigation/ModuleHeader";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";

type Props = {
  studentId: string;
  studentLabel: string;
  viewerRole: "parent" | "student";
  onBack: () => void;
};

export function SupplyListScreen({
  studentId,
  studentLabel,
  viewerRole,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug } = useAuthStore();
  const [supplyList, setSupplyList] = useState<ChildSupplyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!schoolSlug || !studentId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await supplyListsApi.getMyChildSupplyList(
          schoolSlug,
          studentId,
        );
        if (cancelled) return;
        setSupplyList(result);
        if (
          viewerRole === "parent" &&
          result.targetSchoolYearId &&
          !result.seen
        ) {
          void supplyListsApi.markMyChildSupplyListSeen(schoolSlug, studentId);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [schoolSlug, studentId, viewerRole]);

  return (
    <View style={styles.root} testID="supply-list-screen">
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={t("supplyList.screen.title")}
          subtitle={studentLabel}
          onBack={onBack}
          testID="supply-list-header"
          backTestID="btn-back"
          topInset={insets.top}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <LoadingBlock label={t("supplyList.screen.loading")} />
        ) : error ? (
          <ErrorBanner
            message={t("supplyList.screen.error")}
            testID="supply-list-error"
          />
        ) : !supplyList?.targetSchoolYearId ? (
          <EmptyState
            icon="bag-outline"
            title={t("supplyList.screen.title")}
            message={t("supplyList.screen.notReady")}
          />
        ) : supplyList.items.length === 0 ? (
          <EmptyState
            icon="bag-outline"
            title={t("supplyList.screen.title")}
            message={t("supplyList.screen.empty")}
          />
        ) : (
          <View testID="supply-list-items">
            <Text style={styles.yearLabel}>
              {t("supplyList.screen.yearLabel").replace(
                "{year}",
                supplyList.targetSchoolYearLabel ?? "",
              )}
            </Text>
            {supplyList.items
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((item) => (
                <View
                  key={item.id}
                  style={styles.itemRow}
                  testID="supply-list-item"
                >
                  <View style={styles.itemTextBlock}>
                    <Text style={styles.itemLabel}>
                      {item.rank}. {item.label}
                    </Text>
                    {item.note ? (
                      <Text style={styles.itemNote}>
                        {t("supplyList.screen.note").replace(
                          "{note}",
                          item.note,
                        )}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.itemQuantity}>
                    {t("supplyList.screen.quantity").replace(
                      "{quantity}",
                      String(item.quantity),
                    )}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerWrap: { backgroundColor: colors.primary },
  content: { padding: 16, gap: 12 },
  yearLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  itemTextBlock: { flex: 1 },
  itemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemNote: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  itemQuantity: { fontSize: 13, color: colors.textSecondary },
});
