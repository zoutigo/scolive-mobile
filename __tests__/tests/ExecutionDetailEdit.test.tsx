import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import TestExecutionRoute from "../../app/(home)/tests/executions/[executionId]";
import { useAuthStore } from "../../src/store/auth.store";
import { testsApi } from "../../src/api/tests.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({
    executionId: "exec-1",
    status: undefined,
    campaignId: undefined,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
  useDrawer: () => ({
    openDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

jest.mock("../../src/store/auth.store");
jest.mock("../../src/api/tests.api");
jest.mock("../../src/utils/moduleBack", () => ({ moduleBack: jest.fn() }));
jest.mock("../../src/components/navigation/BottomTabBar", () => ({
  BOTTOM_TAB_BAR_HEIGHT: 58,
}));

// Pager mocké : rend directement une page pour "exec-1"
jest.mock("../../src/components/tests/ExecutionsPager", () => ({
  ExecutionsPager: ({
    ids,
    renderPage,
    onIndexChange,
  }: {
    ids: string[];
    renderPage: (id: string, isActive: boolean) => React.ReactNode;
    onIndexChange?: (index: number, id: string) => void;
  }) => {
    const id = ids[0] ?? "exec-1";
    // Signale l'id actif synchroniquement (pas de useEffect pour éviter les contraintes Jest mock)
    onIndexChange?.(0, id);
    return <>{renderPage(id, true)}</>;
  },
}));

jest.mock("../../src/components/tests/ExecutionDetailCard", () => ({
  ExecutionDetailCard: () => {
    const { Text } = require("react-native");
    return <Text testID="mock-execution-detail-card">Detail</Text>;
  },
}));

// ─── Données de test ──────────────────────────────────────────────────────────

const makeUser = (isTester: boolean, platformRoles: string[] = []) => ({
  id: "user-1",
  firstName: "Valery",
  lastName: "MBELE",
  platformRoles,
  memberships: [{ schoolId: "school-1", role: "PARENT" as const }],
  profileCompleted: true,
  role: "PARENT" as const,
  activeRole: "PARENT" as const,
  isTester,
});

const executionDetail = {
  id: "exec-1",
  status: "PASSED" as const,
  resultText: "Scénario OK",
  comment: "RAS",
  executedAt: "2026-06-11T10:00:00.000Z",
  adminReviewedAt: null,
  adminReviewNote: null,
  deviceInfo: "android",
  appVersion: "1.0.0",
  createdAt: "2026-06-11T10:00:00.000Z",
  user: { id: "user-1", fullName: "Valery MBELE" },
  adminReviewedBy: null,
  testCase: { id: "case-1", title: "Login" },
  campaign: { id: "camp-1", title: "v1.4" },
  attachments: [],
};

function setup(isTester: boolean, platformRoles: string[] = []) {
  useSuccessToastStore.getState().hide();
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    user: makeUser(isTester, platformRoles),
    schoolSlug: "college-vogt",
    isAuthenticated: true,
    isLoading: false,
    accessToken: "tok",
    authErrorMessage: null,
  });
  (testsApi.listExecutions as jest.Mock).mockResolvedValue({
    items: [{ id: "exec-1" }],
  });
  (testsApi.getExecution as jest.Mock).mockResolvedValue(executionDetail);
  (testsApi.updateExecution as jest.Mock).mockResolvedValue(executionDetail);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TestExecutionRoute — FAB modifier & formulaire inline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("n'affiche pas le FAB pour un utilisateur sans droits (non testeur, non admin)", async () => {
    setup(false, []);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.queryByTestId("mock-execution-detail-card")).toBeTruthy(),
    );
    expect(screen.queryByTestId("execution-edit-fab")).toBeNull();
  });

  it("affiche le FAB pour un testeur", async () => {
    setup(true, []);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
  });

  it("affiche le FAB pour un admin platform", async () => {
    setup(false, ["ADMIN"]);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
  });

  it("affiche le FAB pour un super_admin platform", async () => {
    setup(false, ["SUPER_ADMIN"]);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
  });

  it("presse FAB → charge les données et affiche le hero du formulaire", async () => {
    setup(true, []);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("execution-edit-fab"));

    await waitFor(() => {
      expect(screen.getByTestId("execution-edit-form-hero")).toBeTruthy();
    });
    expect(testsApi.getExecution).toHaveBeenCalledWith("exec-1");
  });

  it("annuler depuis le formulaire ramène au détail sans appel API", async () => {
    setup(true, []);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("execution-edit-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-form-hero")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("edit-execution-cancel-btn"));

    await waitFor(() =>
      expect(screen.getByTestId("mock-execution-detail-card")).toBeTruthy(),
    );
    expect(testsApi.updateExecution).not.toHaveBeenCalled();
  });

  it("flèche header depuis le formulaire ramène au détail sans router.back()", async () => {
    const mockBack = jest.fn();
    jest.mock("expo-router", () => ({
      useRouter: () => ({
        back: mockBack,
        navigate: jest.fn(),
        canGoBack: () => true,
      }),
      useLocalSearchParams: () => ({
        executionId: "exec-1",
        status: undefined,
        campaignId: undefined,
      }),
    }));

    setup(true, []);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("execution-edit-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-form-hero")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("module-header-back"));

    await waitFor(() =>
      expect(screen.getByTestId("mock-execution-detail-card")).toBeTruthy(),
    );
  });

  it("soumettre avec resultText vide affiche une erreur de validation", async () => {
    setup(true, []);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("execution-edit-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-form-hero")).toBeTruthy(),
    );

    // Effacer le resultText pré-rempli
    fireEvent.changeText(screen.getByTestId("edit-execution-result-input"), "");
    fireEvent.press(screen.getByTestId("edit-execution-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("edit-execution-result-error")).toBeTruthy();
    });
    expect(testsApi.updateExecution).not.toHaveBeenCalled();
  });

  it("succès : appelle updateExecution, affiche toast, revient au détail après 2s", async () => {
    setup(true, []);
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("execution-edit-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-form-hero")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("edit-execution-result-input"),
      "Mise à jour OK",
    );
    fireEvent.press(screen.getByTestId("edit-execution-submit-btn"));

    await waitFor(() =>
      expect(testsApi.updateExecution).toHaveBeenCalledWith(
        "exec-1",
        expect.objectContaining({ resultText: "Mise à jour OK" }),
      ),
    );

    // Après 2 secondes → retour au détail
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() =>
      expect(screen.getByTestId("mock-execution-detail-card")).toBeTruthy(),
    );
  });

  it("erreur API : affiche showError, reste sur le formulaire", async () => {
    setup(true, []);
    (testsApi.updateExecution as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );
    render(<TestExecutionRoute />);
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("execution-edit-fab"));
    await waitFor(() =>
      expect(screen.getByTestId("execution-edit-form-hero")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId("edit-execution-result-input"),
      "Tentative",
    );
    fireEvent.press(screen.getByTestId("edit-execution-submit-btn"));

    await waitFor(() => {
      // Le formulaire est toujours visible après une erreur
      expect(screen.getByTestId("execution-edit-form-hero")).toBeTruthy();
    });
    // Le détail ne doit pas être affiché
    expect(screen.queryByTestId("mock-execution-detail-card")).toBeNull();
  });
});
