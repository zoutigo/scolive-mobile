export type FinanceTab = "compte" | "porte-monnaie" | "factures" | "reglement";

export type LedgerEntry = {
  id: string;
  date: string;
  label: string;
  debit: number;
  credit: number;
  status?: "a-venir" | "effectue";
};

export type WalletEntry = {
  id: string;
  label: string;
  balance: number;
  cap: number;
  lastOperation: string;
};

export type WalletHistoryEntry = {
  id: string;
  walletId: string;
  label: string;
  amount: number;
  date: string;
  channel: string;
};

export type Invoice = {
  id: string;
  document: string;
  date: string;
  amount: number;
  status: "payee" | "en-attente" | "retard";
};

export type PaymentChannel = {
  id: string;
  label: string;
  type: "mobile-money" | "cash";
  status: "actif" | "inactif";
  number?: string;
};

export type WalletTransactionEntry = {
  id: string;
  type: "TOPUP" | "ALLOCATION";
  amount: number;
  createdAt: string;
  note: string | null;
};

export type ChildFinanceStatus = {
  student: { id: string; firstName: string; lastName: string };
  status: "DECISION_PENDING" | "ALREADY_REINSCRIBED" | "READY_TO_REINSCRIBE";
  targetSchoolYearId?: string;
  targetSchoolYearLabel?: string;
  requiredAmount?: number | null;
};

export type WalletSummary = {
  walletId: string;
  balance: number;
  transactions: WalletTransactionEntry[];
  children: ChildFinanceStatus[];
};
