import React from "react";
import { render, screen } from "@testing-library/react-native";
import { WalletHistoryCard } from "../../src/components/finance/WalletHistoryCard";
import type { WalletTransactionEntry } from "../../src/types/finance.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("WalletHistoryCard", () => {
  it("ne rend rien quand la liste de transactions est vide", () => {
    render(<WalletHistoryCard transactions={[]} />);
    expect(screen.queryByTestId("wallet-history-card")).toBeNull();
  });

  it("affiche un depot et une reinscription avec le bon signe", () => {
    const transactions: WalletTransactionEntry[] = [
      {
        id: "tx-1",
        type: "TOPUP",
        amount: 5000,
        createdAt: "2026-09-05T00:00:00.000Z",
        note: null,
      },
      {
        id: "tx-2",
        type: "ALLOCATION",
        amount: 30000,
        createdAt: "2026-09-01T00:00:00.000Z",
        note: "Reinscription Remi Ntamack",
      },
    ];

    render(<WalletHistoryCard transactions={transactions} />);

    expect(screen.getByTestId("wallet-history-row-tx-1")).toBeOnTheScreen();
    expect(screen.getByTestId("wallet-history-row-tx-2")).toBeOnTheScreen();
    expect(screen.getByText("Depot")).toBeOnTheScreen();
    expect(screen.getByText("Reinscription")).toBeOnTheScreen();
    expect(screen.getByText(/Reinscription Remi Ntamack/)).toBeOnTheScreen();
  });
});
