import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppShell,
  useDrawer,
} from "../../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../../src/components/navigation/ModuleHeader";
import { ExecutionsPager } from "../../../../src/components/tests/ExecutionsPager";
import { ExecutionDetailCard } from "../../../../src/components/tests/ExecutionDetailCard";
import { testsApi } from "../../../../src/api/tests.api";
import { useTranslation } from "../../../../src/i18n/useTranslation";
import { colors } from "../../../../src/theme";
import type { TestExecutionStatus } from "../../../../src/types/tests.types";

export default function TestExecutionRoute() {
  return (
    <AppShell showHeader={false}>
      <TestExecutionScreen />
    </AppShell>
  );
}

function TestExecutionScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const params = useLocalSearchParams<{
    executionId: string;
    status?: string;
    campaignId?: string;
  }>();
  const [ids, setIds] = useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await testsApi.listExecutions({
          status: (params.status as TestExecutionStatus | "") || undefined,
          campaignId: params.campaignId || undefined,
        });
        if (!cancelled) {
          setIds(response.items.map((item) => item.id));
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : t("tests.common.errors.loadGeneric"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.status, params.campaignId]);

  const initialIndex = ids ? Math.max(0, ids.indexOf(params.executionId)) : 0;

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("tests.executions.detail.subtitle")}
        subtitle={t("tests.executions.detail.swipeHint")}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={insets.top}
        testID="test-execution-detail-header"
      />

      {errorMessage ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : !ids ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ExecutionsPager
          ids={ids}
          initialIndex={initialIndex}
          renderPage={(id, isActive) => (
            <ExecutionDetailCard executionId={id} isActive={isActive} />
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
