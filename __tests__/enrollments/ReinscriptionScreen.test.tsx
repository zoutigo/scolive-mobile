import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ReinscriptionScreen } from "../../src/components/enrollments/ReinscriptionScreen";
import { financeApi } from "../../src/api/finance.api";
import { supplyListsApi } from "../../src/api/supply-lists.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import type { WalletSummary } from "../../src/types/finance.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/finance.api");
jest.mock("../../src/api/supply-lists.api");
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

const financeApiMock = financeApi as jest.Mocked<typeof financeApi>;
const supplyListsApiMock = supplyListsApi as jest.Mocked<typeof supplyListsApi>;

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

  financeApiMock.getWalletSummary.mockResolvedValue({
    walletId: "wallet-1",
    balance: 0,
    transactions: [],
    children: [],
  });
  financeApiMock.topUpWallet.mockResolvedValue({
    walletId: "wallet-1",
    balance: 10000,
  });
  financeApiMock.payAndReinscribe.mockResolvedValue({
    requiredAmount: 30000,
    reinscriptionConfirmed: true,
  });
  supplyListsApiMock.getMyChildSupplyList.mockResolvedValue({
    targetSchoolYearId: "sy-2026",
    targetSchoolYearLabel: "2026-2027",
    items: [
      {
        id: "item-1",
        rank: 1,
        label: "Cahier 100 pages",
        quantity: 3,
        note: null,
      },
    ],
  });
});

describe("ReinscriptionScreen — onglet Paiement", () => {
  it("charge et affiche le solde reel et le statut de chaque enfant", async () => {
    financeApiMock.getWalletSummary.mockResolvedValue(WALLET_ONE_CHILD_READY);
    render(<ReinscriptionScreen />);

    await waitFor(() =>
      expect(financeApiMock.getWalletSummary).toHaveBeenCalledWith(
        "college-vogt",
      ),
    );
    expect(await screen.findByText("Remi Ntamack")).toBeOnTheScreen();
    expect(screen.getByText(/Pret\(e\) a etre reinscrit/)).toBeOnTheScreen();
  });

  it("credite le porte-monnaie via le formulaire de depot", async () => {
    render(<ReinscriptionScreen />);
    await waitFor(() =>
      expect(financeApiMock.getWalletSummary).toHaveBeenCalledTimes(1),
    );

    fireEvent.changeText(screen.getByTestId("wallet-top-up-input"), "10000");
    fireEvent.press(screen.getByTestId("wallet-top-up-submit"));

    await waitFor(() =>
      expect(financeApiMock.topUpWallet).toHaveBeenCalledWith(
        "college-vogt",
        10000,
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Porte-monnaie credite.",
      ),
    );
  });

  it('appuie sur "Je paie et je reinscris" et confirme la reinscription', async () => {
    financeApiMock.getWalletSummary.mockResolvedValue(WALLET_ONE_CHILD_READY);
    render(<ReinscriptionScreen />);

    await screen.findByText("Remi Ntamack");
    fireEvent.press(screen.getByTestId("pay-and-reinscribe-student-1"));

    await waitFor(() =>
      expect(financeApiMock.payAndReinscribe).toHaveBeenCalledWith(
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

    render(<ReinscriptionScreen />);

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        "reinscription-parent",
      ),
    );
  });
});

describe("ReinscriptionScreen — onglet Fournitures", () => {
  it("charge et affiche la liste de fournitures scopee au niveau cible de chaque enfant pret", async () => {
    financeApiMock.getWalletSummary.mockResolvedValue(WALLET_ONE_CHILD_READY);
    render(<ReinscriptionScreen />);

    await screen.findByText("Remi Ntamack");
    fireEvent.press(screen.getByTestId("reinscription-tabs-fournitures"));

    await waitFor(() =>
      expect(supplyListsApiMock.getMyChildSupplyList).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
      ),
    );
    expect(await screen.findByText(/Cahier 100 pages/)).toBeOnTheScreen();
  });
});

describe("ReinscriptionScreen — aide", () => {
  it("ouvre la modale d'aide depuis le menu de l'en-tete", async () => {
    render(<ReinscriptionScreen />);

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("reinscription-help-menu-item"));

    expect(screen.getByText("Aide — Réinscription")).toBeOnTheScreen();
  });
});
