/**
 * Tour d'aide guidée "tests" — testeur (rôle transverse, non lié à un
 * ViewType). Vérifie le point délicat : l'étape "Démarrez un test" cible le
 * bouton Start/Review d'une carte de campagne, dans l'onglet Campagnes.
 * Une carte de démonstration (fallback) doit remplacer la vraie liste
 * pendant cette étape — que la liste réelle soit vide ou non — et
 * l'écran doit forcer le passage sur l'onglet Campagnes pour que la cible
 * existe, sans action manuelle de l'utilisateur.
 */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import TestsScreen from "../../app/(home)/tests/index";
import { useAuthStore } from "../../src/store/auth.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import { testsApi } from "../../src/api/tests.api";
import {
  TESTS_TOUR_FALLBACK_CAMPAIGN_ID,
  TESTS_TOUR_ID,
  TESTS_TOUR_ROLE,
} from "../../src/components/tests/tests-tour.config";
import { buildTourCompletionKey } from "../../src/store/onboarding-tour.store";
import { translate } from "../../src/i18n/useTranslation";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/store/auth.store");
jest.mock("../../src/api/tests.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/tests",
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => callback(), [callback]);
  },
}));

const TESTER_USER = {
  id: "u1",
  firstName: "Valery",
  lastName: "MBELE",
  platformRoles: [],
  memberships: [{ schoolId: "school-1", role: "PARENT" }],
  profileCompleted: true,
  role: "PARENT",
  activeRole: "PARENT",
  isTester: true,
};

const CAMPAIGN = {
  id: "camp-1",
  title: "Messagerie mobile",
  description: "Parcours parent",
  targetVersion: "1.2.0",
  startsAt: null,
  dueAt: "2026-06-20T08:00:00.000Z",
  status: "ACTIVE",
  assignedToMe: false,
  summary: { totalCases: 4, completedCases: 1, totalExecutions: 2 },
};

function resetOnboardingTourStore() {
  useOnboardingTourStore.setState({
    completedTours: {},
    activeTourId: null,
    activeRole: null,
    steps: [],
    stepIndex: 0,
    targetLayout: null,
  });
}

function mockAuth(userOverrides: Partial<typeof TESTER_USER> = {}) {
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    schoolSlug: "college-vogt",
    user: { ...TESTER_USER, ...userOverrides },
  });
}

describe("Tour tests — testeur", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOnboardingTourStore();
    (testsApi.listToRedo as jest.Mock).mockResolvedValue([]);
  });

  it("starts the tests tour for a tester user", async () => {
    mockAuth();
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([CAMPAIGN]);

    render(<TestsScreen />);

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        TESTS_TOUR_ID,
      ),
    );
  });

  it("does not start when onboardingHelpEnabled is false", async () => {
    mockAuth({ onboardingHelpEnabled: false } as never);
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([CAMPAIGN]);

    render(<TestsScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("tests-summary-tab")).toBeTruthy(),
    );
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("does not restart if already completed", async () => {
    useOnboardingTourStore.setState({
      completedTours: {
        [buildTourCompletionKey(TESTS_TOUR_ROLE, TESTS_TOUR_ID)]: true,
      },
    });
    mockAuth();
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([CAMPAIGN]);

    render(<TestsScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("tests-summary-tab")).toBeTruthy(),
    );
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("forces the Campaigns tab and shows a fallback card with a spotlighted Start button on the 'start a test' step, even with real campaigns loaded", async () => {
    mockAuth();
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([CAMPAIGN]);

    render(<TestsScreen />);

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        TESTS_TOUR_ID,
      ),
    );

    act(() => {
      useOnboardingTourStore.getState().next();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(
          `test-campaign-action-${TESTS_TOUR_FALLBACK_CAMPAIGN_ID}`,
        ),
      ).toBeTruthy();
    });
    expect(
      screen.getByText(translate("fr", "tests.tourFallback.title")),
    ).toBeTruthy();
    // The real campaign is temporarily hidden while the fallback card is
    // shown, since the demo card replaces the whole list for this step.
    expect(screen.queryByText("Messagerie mobile")).toBeNull();
  });

  it("the fallback card disappears and the real campaign reappears once the tour ends", async () => {
    mockAuth();
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([CAMPAIGN]);

    render(<TestsScreen />);

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        TESTS_TOUR_ID,
      ),
    );
    act(() => {
      useOnboardingTourStore.getState().next();
    });
    await waitFor(() =>
      expect(
        screen.getByTestId(
          `test-campaign-action-${TESTS_TOUR_FALLBACK_CAMPAIGN_ID}`,
        ),
      ).toBeTruthy(),
    );

    act(() => {
      useOnboardingTourStore.getState().finish();
    });

    await waitFor(() =>
      expect(screen.getByText("Messagerie mobile")).toBeTruthy(),
    );
    expect(
      screen.queryByTestId(
        `test-campaign-action-${TESTS_TOUR_FALLBACK_CAMPAIGN_ID}`,
      ),
    ).toBeNull();
  });
});

describe("Aide (modale) — module Tests", () => {
  it("l'entrée « Aide » du menu ouvre la modale avec ses 4 chapitres, et se ferme au tap sur Fermer", async () => {
    mockAuth({ onboardingHelpEnabled: false } as never);
    (testsApi.listCampaigns as jest.Mock).mockResolvedValue([CAMPAIGN]);

    render(<TestsScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("tests-summary-tab")).toBeTruthy(),
    );

    expect(screen.queryByTestId("tests-help-modal-title")).toBeNull();

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("tests-help-menu-item"));

    expect(screen.getByTestId("tests-help-modal-title")).toBeTruthy();
    const modalBody = within(screen.getByTestId("tests-help-modal-body"));
    expect(
      modalBody.getByText(translate("fr", "tests.help.section1Title")),
    ).toBeTruthy();
    expect(
      modalBody.getByText(translate("fr", "tests.help.section2Title")),
    ).toBeTruthy();
    expect(
      modalBody.getByText(translate("fr", "tests.help.section3Title")),
    ).toBeTruthy();
    expect(
      modalBody.getByText(translate("fr", "tests.help.section4Title")),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("tests-help-modal-close"));

    expect(screen.queryByTestId("tests-help-modal-title")).toBeNull();
  });
});
