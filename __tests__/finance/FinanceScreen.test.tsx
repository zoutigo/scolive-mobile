import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { FinanceScreen } from "../../src/components/finance/FinanceScreen";
import { financeApi } from "../../src/api/finance.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import type { WalletSummary } from "../../src/types/finance.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/finance.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = financeApi as jest.Mocked<typeof financeApi>;

const WALLET_ONE_CHILD_READY: WalletSummary = {
  walletId: "wallet-1",
  balance: 50000,
  transactions: [],
  children: [
    {
      student: { id: "student-1", firstName: "Remi", lastName: "Ntamack" },
      status: "READY_TO_REINSCRIBE",
      targetSchoolYearId: "sy-2026",
      targetSchoolYearLabel: "2026-2027",
      requiredAmount: 30000,
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "parent-1",
      firstName: "Awa",
      lastName: "Ekwalla",
      onboardingHelpEnabled: false,
      activeRole: "PARENT",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
    },
  } as never);
  useOnboardingTourStore.setState({
    activeTourId: null,
    activeRole: null,
    steps: [],
    stepIndex: 0,
    completedTours: {},
  } as never);

  api.getWalletSummary.mockResolvedValue({
    walletId: "wallet-1",
    balance: 0,
    transactions: [],
    children: [],
  });
  api.topUpWallet.mockResolvedValue({ walletId: "wallet-1", balance: 10000 });
  api.payAndReinscribe.mockResolvedValue({
    requiredAmount: 30000,
    reinscriptionConfirmed: true,
  });
});

function openWalletTab() {
  fireEvent.press(screen.getByTestId("finance-tab-porte-monnaie"));
}

describe("FinanceScreen — porte-monnaie (parent)", () => {
  it("charge et affiche le solde reel et le statut de chaque enfant", async () => {
    api.getWalletSummary.mockResolvedValue(WALLET_ONE_CHILD_READY);
    render(<FinanceScreen />);

    openWalletTab();

    await waitFor(() =>
      expect(api.getWalletSummary).toHaveBeenCalledWith("college-vogt"),
    );
    expect(await screen.findByText("Remi Ntamack")).toBeOnTheScreen();
    expect(screen.getByText(/Pret\(e\) a etre reinscrit/)).toBeOnTheScreen();
  });

  it("credite le porte-monnaie via le formulaire de depot", async () => {
    render(<FinanceScreen />);
    openWalletTab();
    await waitFor(() => expect(api.getWalletSummary).toHaveBeenCalledTimes(1));

    fireEvent.changeText(screen.getByTestId("wallet-top-up-input"), "10000");
    fireEvent.press(screen.getByTestId("wallet-top-up-submit"));

    await waitFor(() =>
      expect(api.topUpWallet).toHaveBeenCalledWith("college-vogt", 10000),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Porte-monnaie credite.",
      ),
    );
  });

  it('appuie sur "Je paie et je reinscris" et confirme la reinscription', async () => {
    api.getWalletSummary.mockResolvedValue(WALLET_ONE_CHILD_READY);
    render(<FinanceScreen />);
    openWalletTab();

    await screen.findByText("Remi Ntamack");
    fireEvent.press(screen.getByTestId("pay-and-reinscribe-student-1"));

    await waitFor(() =>
      expect(api.payAndReinscribe).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        "sy-2026",
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Remi est reinscrit(e) !",
      ),
    );
  });

  it("desactive le bouton de reinscription si le solde du wallet est insuffisant", async () => {
    api.getWalletSummary.mockResolvedValue({
      ...WALLET_ONE_CHILD_READY,
      balance: 5000,
    });
    render(<FinanceScreen />);
    openWalletTab();

    await screen.findByText("Remi Ntamack");
    expect(screen.getByTestId("pay-and-reinscribe-student-1")).toBeDisabled();
  });

  it("demarre le tour d'aide guidee quand onboardingHelpEnabled est actif", async () => {
    useAuthStore.setState({
      schoolSlug: "college-vogt",
      user: {
        id: "parent-1",
        firstName: "Awa",
        lastName: "Ekwalla",
        onboardingHelpEnabled: true,
        activeRole: "PARENT",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "PARENT" }],
        profileCompleted: true,
      },
    } as never);

    render(<FinanceScreen />);

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        "finance-parent-reinscription",
      ),
    );
  });
});
