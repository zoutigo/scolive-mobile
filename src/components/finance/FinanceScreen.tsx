import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { AppShell } from "../navigation/AppShell";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { FinanceTabs } from "./FinanceTabs";
import { FinanceHero } from "./FinanceHero";
import { LedgerRow } from "./LedgerRow";
import { WalletBalanceCard } from "./WalletBalanceCard";
import { WalletHistoryCard } from "./WalletHistoryCard";
import { ChildReenrollmentCard } from "../enrollments/ChildReenrollmentCard";
import { InvoiceCard } from "./InvoiceCard";
import { PaymentChannelCard } from "./PaymentChannelCard";
import type {
  FinanceTab,
  LedgerEntry,
  Invoice,
  PaymentChannel,
  WalletSummary,
  ChildFinanceStatus,
} from "../../types/finance.types";
import { moduleBack } from "../../utils/moduleBack";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
import { financeApi } from "../../api/finance.api";
import { OnboardingTarget } from "../onboarding/OnboardingTarget";
import { useOnboardingTourTrigger } from "../../hooks/useOnboardingTourTrigger";
import {
  FINANCE_PARENT_TOUR_ID,
  FINANCE_PARENT_TOUR_STEPS,
  FINANCE_PARENT_TOUR_TARGETS,
} from "./finance-parent-tour.config";

// ─── Données dummy ────────────────────────────────────────────────────────────

const LEDGER: LedgerEntry[] = [
  {
    id: "l1",
    date: "15/04/2026",
    label: "Frais de scolarité T2",
    debit: 85000,
    credit: 0,
    status: "effectue",
  },
  {
    id: "l2",
    date: "01/04/2026",
    label: "Cantine avril",
    debit: 18000,
    credit: 0,
    status: "effectue",
  },
  {
    id: "l3",
    date: "28/03/2026",
    label: "Virement parent",
    debit: 0,
    credit: 150000,
  },
  {
    id: "l4",
    date: "01/05/2026",
    label: "Frais de scolarité T3",
    debit: 85000,
    credit: 0,
    status: "a-venir",
  },
  {
    id: "l5",
    date: "01/05/2026",
    label: "Cantine mai",
    debit: 18000,
    credit: 0,
    status: "a-venir",
  },
  {
    id: "l6",
    date: "10/03/2026",
    label: "Sortie scolaire",
    debit: 5000,
    credit: 0,
    status: "effectue",
  },
  {
    id: "l7",
    date: "01/03/2026",
    label: "Virement parent",
    debit: 0,
    credit: 120000,
  },
];

const INVOICES: Invoice[] = [
  {
    id: "i1",
    document: "Facture scolarité T1 2025-2026",
    date: "15/10/2025",
    amount: 85000,
    status: "payee",
  },
  {
    id: "i2",
    document: "Facture scolarité T2 2025-2026",
    date: "15/01/2026",
    amount: 85000,
    status: "payee",
  },
  {
    id: "i3",
    document: "Facture scolarité T3 2025-2026",
    date: "15/04/2026",
    amount: 85000,
    status: "en-attente",
  },
  {
    id: "i4",
    document: "Facture cantine mars 2026",
    date: "01/03/2026",
    amount: 18000,
    status: "payee",
  },
  {
    id: "i5",
    document: "Facture cantine avril 2026",
    date: "01/04/2026",
    amount: 18000,
    status: "retard",
  },
];

const CHANNELS: PaymentChannel[] = [
  {
    id: "c1",
    label: "Orange Money",
    type: "mobile-money",
    status: "actif",
    number: "6XX XXX XXX",
  },
  {
    id: "c2",
    label: "MTN MoMo",
    type: "mobile-money",
    status: "inactif",
    number: "6XX XXX XXX",
  },
  { id: "c3", label: "Cash guichet", type: "cash", status: "actif" },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export function FinanceScreen() {
  return (
    <AppShell showHeader={false}>
      <FinanceScreenContent />
    </AppShell>
  );
}

function FinanceScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [tab, setTab] = useState<FinanceTab>("compte");
  const { schoolSlug } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [reinscribingId, setReinscribingId] = useState<string | null>(null);

  useOnboardingTourTrigger({
    tourId: FINANCE_PARENT_TOUR_ID,
    role: "parent",
    steps: FINANCE_PARENT_TOUR_STEPS,
  });

  const loadWallet = useCallback(async () => {
    if (!schoolSlug) return;
    setWalletLoading(true);
    try {
      const summary = await financeApi.getWalletSummary(schoolSlug);
      setWallet(summary);
    } catch (error) {
      showError({
        title: t("finSituation.wallet.errors.load"),
        message: error instanceof Error ? error.message : "",
      });
    } finally {
      setWalletLoading(false);
    }
    // `t` is intentionally not a dependency: useTranslation() returns a new
    // function reference every render, and including it here would make the
    // focus-effect below refetch in a loop.
  }, [schoolSlug, showError]);

  useFocusEffect(
    useCallback(() => {
      if (tab === "porte-monnaie") void loadWallet();
    }, [tab, loadWallet]),
  );

  async function onTopUp(amount: number) {
    if (!schoolSlug || amount <= 0) return;
    setTopUpSubmitting(true);
    try {
      await financeApi.topUpWallet(schoolSlug, amount);
      showSuccess({
        title: t("finSituation.wallet.success.topUp"),
        message: "",
      });
      await loadWallet();
    } catch (error) {
      showError({
        title: t("finSituation.wallet.errors.topUp"),
        message: error instanceof Error ? error.message : "",
      });
    } finally {
      setTopUpSubmitting(false);
    }
  }

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
        title: t("finSituation.wallet.success.reinscribed").replace(
          "{firstName}",
          child.student.firstName,
        ),
        message: "",
      });
      await loadWallet();
    } catch (error) {
      showError({
        title: t("finSituation.wallet.errors.reinscribe"),
        message: error instanceof Error ? error.message : "",
      });
    } finally {
      setReinscribingId(null);
    }
  }

  const balance = useMemo(() => {
    const totalCredit = LEDGER.reduce((s, e) => s + e.credit, 0);
    const totalDebit = LEDGER.filter((e) => e.status !== "a-venir").reduce(
      (s, e) => s + e.debit,
      0,
    );
    return totalCredit - totalDebit;
  }, []);

  const pending = useMemo(
    () =>
      LEDGER.filter((e) => e.status === "a-venir").reduce(
        (s, e) => s + e.debit,
        0,
      ),
    [],
  );

  const walletTotal = wallet?.balance ?? 0;
  const firstReadyChildId = wallet?.children.find(
    (c) => c.status === "READY_TO_REINSCRIBE",
  )?.student.id;

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <ModuleHeader
          title="Situation financière"
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="finance-header"
        />
      </View>

      <FinanceTabs activeTab={tab} onSelect={setTab} />

      {tab === "compte" && (
        <InfiniteScrollList
          data={LEDGER}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LedgerRow item={item} />}
          hasMore={false}
          ListHeaderComponent={
            <FinanceHero
              balance={balance}
              pending={pending}
              walletTotal={walletTotal}
            />
          }
          endOfListLabel="Tous les mouvements ont été chargés"
          contentContainerStyle={styles.listContent}
          testID="ledger-list"
        />
      )}

      {tab === "porte-monnaie" && (
        <InfiniteScrollList
          data={wallet?.children ?? []}
          keyExtractor={(item) => item.student.id}
          renderItem={({ item }) => (
            <View style={styles.childCardWrap}>
              <ChildReenrollmentCard
                item={item}
                walletBalance={wallet?.balance ?? 0}
                submitting={reinscribingId === item.student.id}
                onPayAndReinscribe={onPayAndReinscribe}
                tourTargetId={
                  item.student.id === firstReadyChildId
                    ? FINANCE_PARENT_TOUR_TARGETS.reinscribe
                    : undefined
                }
              />
            </View>
          )}
          hasMore={false}
          refreshing={walletLoading}
          onRefresh={loadWallet}
          ListHeaderComponent={
            <>
              <OnboardingTarget id={FINANCE_PARENT_TOUR_TARGETS.wallet}>
                <WalletBalanceCard
                  balance={wallet?.balance ?? 0}
                  submitting={topUpSubmitting}
                  onTopUp={onTopUp}
                />
              </OnboardingTarget>
              <WalletHistoryCard transactions={wallet?.transactions ?? []} />
              <OnboardingTarget id={FINANCE_PARENT_TOUR_TARGETS.children}>
                <Text style={styles.childrenTitle}>
                  {t("finSituation.children.title")}
                </Text>
              </OnboardingTarget>
            </>
          }
          endOfListLabel={t("finSituation.wallet.allChildrenLoaded")}
          contentContainerStyle={styles.listContent}
          emptyComponent={
            <EmptyView
              icon="people-outline"
              label={t("finSituation.children.empty")}
            />
          }
          testID="wallet-children-list"
        />
      )}

      {tab === "factures" && (
        <InfiniteScrollList
          data={INVOICES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InvoiceCard item={item} />}
          hasMore={false}
          endOfListLabel="Toutes les factures ont été chargées"
          contentContainerStyle={styles.listContent}
          emptyComponent={
            <EmptyView icon="document-text-outline" label="Aucune facture" />
          }
          testID="invoices-list"
        />
      )}

      {tab === "reglement" && (
        <InfiniteScrollList
          data={CHANNELS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PaymentChannelCard item={item} />}
          hasMore={false}
          endOfListLabel="Tous les modes de règlement ont été chargés"
          contentContainerStyle={styles.listContent}
          emptyComponent={
            <EmptyView icon="cash-outline" label="Aucun mode de règlement" />
          }
          testID="channels-list"
        />
      )}
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
  childCardWrap: { marginHorizontal: 16, marginTop: 12 },
  childrenTitle: {
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
