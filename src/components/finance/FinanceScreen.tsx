import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { AppShell } from "../navigation/AppShell";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { FinanceTabs } from "./FinanceTabs";
import { FinanceHero } from "./FinanceHero";
import { LedgerRow } from "./LedgerRow";
import { WalletCard } from "./WalletCard";
import { InvoiceCard } from "./InvoiceCard";
import { PaymentChannelCard } from "./PaymentChannelCard";
import { useDrawer } from "../navigation/drawer-context";
import type {
  FinanceTab,
  LedgerEntry,
  WalletEntry,
  Invoice,
  PaymentChannel,
} from "../../types/finance.types";

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

const WALLETS: WalletEntry[] = [
  {
    id: "w1",
    label: "Cantine",
    balance: 24000,
    cap: 30000,
    lastOperation: "02/04/2026",
  },
  {
    id: "w2",
    label: "Fournitures",
    balance: 8500,
    cap: 20000,
    lastOperation: "15/03/2026",
  },
  {
    id: "w3",
    label: "Transport",
    balance: 3200,
    cap: 15000,
    lastOperation: "18/04/2026",
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
  const { openDrawer } = useDrawer();
  const [tab, setTab] = useState<FinanceTab>("compte");

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

  const walletTotal = useMemo(
    () => WALLETS.reduce((s, w) => s + w.balance, 0),
    [],
  );

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <ModuleHeader
          title="Situation financière"
          onBack={() => router.back()}
          rightIcon="menu-outline"
          onRightPress={openDrawer}
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
          data={WALLETS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <WalletCard item={item} />}
          hasMore={false}
          endOfListLabel="Tous les portefeuilles ont été chargés"
          contentContainerStyle={styles.listContent}
          emptyComponent={
            <EmptyView icon="card-outline" label="Aucun portefeuille" />
          }
          testID="wallets-list"
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
  headerWrap: { paddingHorizontal: 16 },
  listContent: { paddingBottom: 24 },
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
