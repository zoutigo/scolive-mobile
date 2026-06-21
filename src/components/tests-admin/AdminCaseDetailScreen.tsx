import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawer } from "../navigation/AppShell";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { testsAdminApi } from "../../api/tests-admin.api";
import { ExecutionsPager } from "../tests/ExecutionsPager";
import { AdminCaseDetailCard } from "./AdminCaseDetailCard";

export function AdminCaseDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { campaignId, testCaseId } = useLocalSearchParams<{
    campaignId: string;
    testCaseId: string;
  }>();

  const [ids, setIds] = useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!campaignId) return;
    void (async () => {
      try {
        const campaign = await testsAdminApi.getCampaign(campaignId);
        if (!cancelled) {
          setIds(campaign.testCases.map((testCase) => testCase.id));
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : t("testsAdmin.common.errors.loadGeneric"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const initialIndex = ids ? Math.max(0, ids.indexOf(testCaseId)) : 0;

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("testsAdmin.caseDetail.title")}
        subtitle={t("testsAdmin.caseDetail.swipeHint")}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={insets.top}
        testID="admin-case-detail-header"
      />

      {errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : !ids || ids.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ExecutionsPager
          ids={ids}
          initialIndex={initialIndex}
          renderPage={(id, isActive) => (
            <AdminCaseDetailCard
              testCaseId={id}
              isActive={isActive}
              onDeleted={() => router.back()}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 14, color: colors.notification, textAlign: "center" },
});
