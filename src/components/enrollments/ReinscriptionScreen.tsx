import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { AppShell } from "../navigation/AppShell";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { WalletSummaryLinkCard } from "../finance/WalletSummaryLinkCard";
import { ChildReenrollmentCard } from "./ChildReenrollmentCard";
import { InstallmentBreakdownCard } from "./InstallmentBreakdownCard";
import { PageHelpModal } from "../help/PageHelpModal";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import {
  REINSCRIPTION_TOUR_ID,
  REINSCRIPTION_TOUR_STEPS,
  REINSCRIPTION_TOUR_TARGETS,
} from "./reinscription-tour.config";
import type {
  ChildFinanceStatus,
  WalletSummary,
} from "../../types/finance.types";
import { moduleBack } from "../../utils/moduleBack";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
import { financeApi } from "../../api/finance.api";

export function ReinscriptionScreen() {
  return (
    <AppShell showHeader={false}>
      <ReinscriptionScreenContent />
    </AppShell>
  );
}

function ReinscriptionScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [reinscribingId, setReinscribingId] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  useOnboardingTourTrigger({
    tourId: REINSCRIPTION_TOUR_ID,
    role: "parent",
    steps: REINSCRIPTION_TOUR_STEPS,
  });

  const loadWallet = useCallback(async () => {
    if (!schoolSlug) return;
    setWalletLoading(true);
    try {
      const summary = await financeApi.getWalletSummary(schoolSlug);
      setWallet(summary);
    } catch (error) {
      showError({
        title: t("reinscription.errors.load"),
        message: error instanceof Error ? error.message : "",
      });
    } finally {
      setWalletLoading(false);
    }
    // `t` is intentionally not a dependency: useTranslation() returns a new
    // function reference every render, and including it here would make the
    // focus-effect below refetch in a loop.
  }, [schoolSlug, showError]);

  const eligibleChildren = useMemo(
    () =>
      (wallet?.children ?? []).filter(
        (child) => child.status !== "DECISION_PENDING",
      ),
    [wallet],
  );

  useFocusEffect(
    useCallback(() => {
      void loadWallet();
    }, [loadWallet]),
  );

  async function onPayAndReinscribe(child: ChildFinanceStatus) {
    if (!schoolSlug || !child.targetSchoolYearId) return;
    setReinscribingId(child.student.id);
    try {
      await financeApi.payAndReinscribe(
        schoolSlug,
        child.student.id,
        child.targetSchoolYearId,
      );
      showSuccess({
        title: t("reinscription.wallet.success.reinscribed").replace(
          "{firstName}",
          child.student.firstName,
        ),
        message: "",
      });
      await loadWallet();
    } catch (error) {
      showError({
        title: t("reinscription.wallet.errors.reinscribe"),
        message: error instanceof Error ? error.message : "",
      });
    } finally {
      setReinscribingId(null);
    }
  }

  const firstReadyChildId = wallet?.children.find(
    (child) => child.status === "READY_TO_REINSCRIBE",
  )?.student.id;

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={t("reinscription.title")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="reinscription-header"
          helpAction={{
            label: t("reinscription.help.menuLabel"),
            onPress: () => setHelpVisible(true),
            testID: "reinscription-help-menu-item",
          }}
          menuTourTargetId={REINSCRIPTION_TOUR_TARGETS.helpToggle}
        />
      </View>

      <InfiniteScrollList
        data={eligibleChildren}
        keyExtractor={(item) => item.student.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ChildReenrollmentCard
              item={item}
              walletBalance={wallet?.balance ?? 0}
              submitting={reinscribingId === item.student.id}
              onPayAndReinscribe={onPayAndReinscribe}
              tourTargetId={
                item.student.id === firstReadyChildId
                  ? REINSCRIPTION_TOUR_TARGETS.reinscribe
                  : undefined
              }
            />
            {item.targetSchoolYearId ? (
              <InstallmentBreakdownCard
                studentId={item.student.id}
                schoolYearId={item.targetSchoolYearId}
              />
            ) : null}
          </View>
        )}
        hasMore={false}
        refreshing={walletLoading}
        onRefresh={loadWallet}
        ListHeaderComponent={
          <>
            <OnboardingTarget id={REINSCRIPTION_TOUR_TARGETS.wallet}>
              <WalletSummaryLinkCard
                balance={wallet?.balance ?? 0}
                onPress={() => router.push("/(home)/finance")}
              />
            </OnboardingTarget>
            <OnboardingTarget id={REINSCRIPTION_TOUR_TARGETS.children}>
              <Text style={styles.sectionTitle}>
                {t("reinscription.children.title")}
              </Text>
            </OnboardingTarget>
          </>
        }
        endOfListLabel={t("reinscription.children.allLoaded")}
        contentContainerStyle={styles.listContent}
        emptyComponent={
          <EmptyView
            icon="people-outline"
            label={t("reinscription.children.empty")}
          />
        }
        testID="reinscription-children-list"
      />

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("reinscription.help.title")}
        sections={[
          {
            title: t("reinscription.help.section1Title"),
            body: [t("reinscription.help.section1Body")],
          },
          {
            title: t("reinscription.help.section2Title"),
            body: [t("reinscription.help.section2Body")],
          },
          {
            title: t("reinscription.help.section3Title"),
            body: [t("reinscription.help.section3Body")],
          },
        ]}
        closeLabel={t("reinscription.help.close")}
        testID="reinscription-help-modal"
      />
    </View>
  );
}

function EmptyView({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color={colors.warmBorder} />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerWrap: {},
  listContent: { paddingBottom: 24 },
  cardWrap: { marginHorizontal: 16, marginTop: 12 },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
});
