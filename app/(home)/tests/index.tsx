import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { testsApi } from "../../../src/api/tests.api";
import { useAuthStore } from "../../../src/store/auth.store";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { colors } from "../../../src/theme";
import type { TestCampaignSummary } from "../../../src/types/tests.types";

export default function TestsHomeRoute() {
  return (
    <AppShell showHeader={false}>
      <TestsHomeScreen />
    </AppShell>
  );
}

function TestsHomeScreen() {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { schoolSlug, user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<TestCampaignSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!schoolSlug || !user?.isTester) {
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
        const response = await testsApi.listCampaigns(schoolSlug);
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
    [schoolSlug, user?.isTester],
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
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title={t("tests.campaigns.emptyTitle")}
          message={t("tests.campaigns.emptyMessage")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void load(true)}
            />
          }
        >
          {campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(home)/tests/[campaignId]",
                  params: { campaignId: campaign.id },
                })
              }
              testID={`test-campaign-card-${campaign.id}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{campaign.title}</Text>
                <Text style={styles.cardMeta}>
                  {campaign.summary.completedCases}/
                  {campaign.summary.totalCases}
                </Text>
              </View>
              {campaign.description ? (
                <Text style={styles.cardBody}>{campaign.description}</Text>
              ) : null}
              <View style={styles.metaRow}>
                <LabelPill
                  text={t("tests.campaigns.totalCases").replace(
                    "{count}",
                    String(campaign.summary.totalCases),
                  )}
                />
                {campaign.dueAt ? (
                  <LabelPill
                    text={t("tests.campaigns.dueLabel").replace(
                      "{date}",
                      formatDate(campaign.dueAt, locale),
                    )}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function LabelPill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
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

function formatDate(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8DCCD",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: "#F4E9DE",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
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
