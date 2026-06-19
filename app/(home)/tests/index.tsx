import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppShell,
  useDrawer,
} from "../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { UnderlineTabs } from "../../../src/components/navigation/UnderlineTabs";
import { TestsSummaryTab } from "../../../src/components/tests/TestsSummaryTab";
import { TestsCampaignsTab } from "../../../src/components/tests/TestsCampaignsTab";
import { testsApi } from "../../../src/api/tests.api";
import { useAuthStore } from "../../../src/store/auth.store";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { colors } from "../../../src/theme";
import type { TestCampaignSummary } from "../../../src/types/tests.types";

type TabKey = "summary" | "tests";

export default function TestsHomeRoute() {
  return (
    <AppShell showHeader={false}>
      <TestsHomeScreen />
    </AppShell>
  );
}

function TestsHomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [campaigns, setCampaigns] = useState<TestCampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!user?.isTester) {
        setCampaigns([]);
        setIsLoading(false);
        return;
      }
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const response = await testsApi.listCampaigns();
        setCampaigns(response);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("tests.common.errors.loadGeneric"),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.isTester],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("tests.title")}
        subtitle={t("tests.campaigns.subtitle")}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={insets.top}
        testID="tests-header"
      />

      {!user?.isTester ? (
        <EmptyState
          icon="lock-closed-outline"
          title={t("tests.common.restrictedTitle")}
          message={t("tests.common.restrictedMessage")}
        />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage ? (
        <EmptyState
          icon="alert-circle-outline"
          title={t("tests.common.errors.loadTitle")}
          message={errorMessage}
        />
      ) : (
        <>
          <UnderlineTabs
            items={[
              { key: "summary", label: t("tests.tabs.summary") },
              { key: "tests", label: t("tests.tabs.tests") },
            ]}
            activeKey={activeTab}
            onSelect={setActiveTab}
            testIDPrefix="tests-home-tab"
          />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void load(true)}
              />
            }
          >
            {activeTab === "summary" ? (
              <TestsSummaryTab campaigns={campaigns} />
            ) : (
              <TestsCampaignsTab campaigns={campaigns} />
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function EmptyState(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={props.icon} size={42} color={colors.warmBorder} />
      <Text style={styles.emptyTitle}>{props.title}</Text>
      <Text style={styles.emptyBody}>{props.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, gap: 12 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
