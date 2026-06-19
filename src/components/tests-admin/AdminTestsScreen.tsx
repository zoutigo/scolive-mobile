import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawer } from "../navigation/AppShell";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { testsAdminApi } from "../../api/tests-admin.api";
import type { AdminTestsSynthesis } from "../../types/tests-admin.types";
import { AdminTestsSummaryTab } from "./AdminTestsSummaryTab";
import { AdminTestsCampaignsTab } from "./AdminTestsCampaignsTab";
import { AdminTestersTab } from "./AdminTestersTab";

type TabKey = "summary" | "campaigns" | "testers";

export function AdminTestsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [synthesis, setSynthesis] = useState<AdminTestsSynthesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPlatformAdmin = (user?.platformRoles ?? []).some((role) =>
    ["SUPER_ADMIN", "ADMIN"].includes(role),
  );

  useEffect(() => {
    if (!isPlatformAdmin) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const data = await testsAdminApi.getSynthesis();
        setSynthesis(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("testsAdmin.common.errors.loadGeneric"),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [isPlatformAdmin]);

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("testsAdmin.title")}
        subtitle={t("testsAdmin.subtitle")}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={insets.top}
        testID="admin-tests-header"
      />

      {!isPlatformAdmin ? (
        <View style={styles.center}>
          <Text style={styles.restricted}>
            {t("tests.common.restrictedTitle")}
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.restricted}>{error}</Text>
        </View>
      ) : (
        <>
          <UnderlineTabs
            items={[
              { key: "summary", label: t("testsAdmin.tabs.summary") },
              { key: "campaigns", label: t("testsAdmin.tabs.campaigns") },
              { key: "testers", label: t("testsAdmin.tabs.testers") },
            ]}
            activeKey={activeTab}
            onSelect={setActiveTab}
            testIDPrefix="admin-tests-tab"
          />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "summary" && synthesis ? (
              <AdminTestsSummaryTab data={synthesis} />
            ) : null}
            {activeTab === "campaigns" ? <AdminTestsCampaignsTab /> : null}
            {activeTab === "testers" ? <AdminTestersTab /> : null}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  restricted: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
  scrollContent: { padding: 16, gap: 12 },
});
