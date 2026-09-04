import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { UnderlineTabs } from "../../../src/components/navigation/UnderlineTabs";
import { PageHelpModal } from "../../../src/components/help/PageHelpModal";
import { TestsSummaryTab } from "../../../src/components/tests/TestsSummaryTab";
import {
  ALL_CAMPAIGNS_FILTER,
  TestsCampaignsTab,
  type TestsCampaignsFilter,
} from "../../../src/components/tests/TestsCampaignsTab";
import { TestsExecutionsTab } from "../../../src/components/tests/TestsExecutionsTab";
import { TestsToRedoTab } from "../../../src/components/tests/TestsToRedoTab";
import {
  TESTS_TOUR_ID,
  TESTS_TOUR_ROLE,
  TESTS_TOUR_STEPS,
  TESTS_TOUR_TARGETS,
} from "../../../src/components/tests/tests-tour.config";
import { testsApi } from "../../../src/api/tests.api";
import { useAuthStore } from "../../../src/store/auth.store";
import { useOnboardingTourStore } from "../../../src/store/onboarding-tour.store";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { colors } from "../../../src/theme";
import type {
  TestCampaignSummary,
  TestCaseToRedo,
} from "../../../src/types/tests.types";
import { moduleBack } from "../../../src/utils/moduleBack";

type TabKey = "summary" | "campaigns" | "executions" | "toRedo";

const PLATFORM_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

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
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [campaignsFilter, setCampaignsFilter] =
    useState<TestsCampaignsFilter>(ALL_CAMPAIGNS_FILTER);
  const [campaigns, setCampaigns] = useState<TestCampaignSummary[]>([]);
  const [toRedo, setToRedo] = useState<TestCaseToRedo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const isInitialLoad = useRef(true);
  const isPlatformContext = Boolean(
    user?.activeRole && PLATFORM_ROLES.has(user.activeRole),
  );

  const activeTourId = useOnboardingTourStore((state) => state.activeTourId);
  const startTour = useOnboardingTourStore((state) => state.startTour);
  const isTourCompleted = useOnboardingTourStore((state) => state.isCompleted);
  const onboardingActiveTourTargetKey = useOnboardingTourStore((state) =>
    state.activeTourId === TESTS_TOUR_ID
      ? state.steps[state.stepIndex]?.targetKey
      : undefined,
  );

  const load = useCallback(
    async (refresh = false) => {
      if (!user?.isTester) {
        setCampaigns([]);
        setToRedo([]);
        setIsLoading(false);
        return;
      }
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const [campaignsResponse, toRedoResponse] = await Promise.all([
          testsApi.listCampaigns(),
          testsApi.listToRedo(),
        ]);
        setCampaigns(campaignsResponse);
        setToRedo(toRedoResponse);
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

  useFocusEffect(
    useCallback(() => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }
      void load(true);
    }, [load]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!user?.isTester) return;
      if (user.onboardingHelpEnabled === false) return;
      if (isTourCompleted(TESTS_TOUR_ROLE, TESTS_TOUR_ID)) return;
      if (activeTourId) return;

      const handle = requestIdleCallback(() => {
        startTour(TESTS_TOUR_ID, TESTS_TOUR_ROLE, TESTS_TOUR_STEPS);
      });
      return () => cancelIdleCallback(handle);
    }, [user, isTourCompleted, activeTourId, startTour]),
  );

  useEffect(() => {
    if (onboardingActiveTourTargetKey === TESTS_TOUR_TARGETS.campaignAction) {
      setActiveTab("campaigns");
    }
  }, [onboardingActiveTourTargetKey]);

  function openCampaignsWithFilter(filter: TestsCampaignsFilter) {
    setCampaignsFilter(filter);
    setActiveTab("campaigns");
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("tests.title")}
        subtitle={t("tests.campaigns.subtitle")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="tests-header"
        helpAction={{
          label: t("tests.help.menuLabel"),
          onPress: () => setHelpVisible(true),
          testID: "tests-help-menu-item",
        }}
        menuTourTargetId={TESTS_TOUR_TARGETS.helpToggle}
      />

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("tests.help.title")}
        closeLabel={t("tests.help.close")}
        testID="tests-help-modal"
        sections={[
          {
            title: t("tests.help.section1Title"),
            body: [t("tests.help.section1Body")],
          },
          {
            title: t("tests.help.section2Title"),
            body: [t("tests.help.section2Body")],
          },
          {
            title: t("tests.help.section3Title"),
            body: [t("tests.help.section3Body")],
          },
          {
            title: t("tests.help.section4Title"),
            body: [t("tests.help.section4Body")],
          },
        ]}
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
              { key: "campaigns", label: t("tests.tabs.campaigns") },
              { key: "executions", label: t("tests.tabs.executions") },
              {
                key: "toRedo",
                label: t("tests.tabs.toRedo"),
                badge: toRedo.length,
              },
            ]}
            activeKey={activeTab}
            onSelect={setActiveTab}
            testIDPrefix="tests-home-tab"
            tourTargetId={TESTS_TOUR_TARGETS.tabs}
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
              <TestsSummaryTab
                campaigns={campaigns}
                onCampaignsFilterPress={openCampaignsWithFilter}
                isPlatformContext={isPlatformContext}
              />
            ) : activeTab === "campaigns" ? (
              <TestsCampaignsTab
                campaigns={campaigns}
                filter={campaignsFilter}
                onFilterChange={setCampaignsFilter}
                isPlatformContext={isPlatformContext}
              />
            ) : activeTab === "executions" ? (
              <TestsExecutionsTab campaigns={campaigns} />
            ) : (
              <TestsToRedoTab items={toRedo} campaigns={campaigns} />
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
