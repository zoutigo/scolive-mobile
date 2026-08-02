/**
 * Tour d'aide guidée "parent-landing" — intégration AppShell + ParentHome.
 * Ce tour est entièrement centré sur le menu de navigation (drawer), jamais
 * sur le contenu de la landing page : vérifie que les 4 cibles (icône menu,
 * messagerie dans le drawer, ligne enfant dans le drawer, icône compte) sont
 * bien montées à travers le chrome global, que presser l'icône menu ouvre le
 * drawer ET avance le tour, que l'étape messagerie force l'ouverture de la
 * section générale du drawer même si un enfant était actif, que presser la
 * ligne enfant avance le tour sans fermer le drawer, que le drawer se referme
 * automatiquement avant l'étape compte, et que la progression complète marque
 * bien "parent-landing" comme terminé pour le rôle parent.
 */
import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react-native";
import { AppShell } from "../../src/components/navigation/AppShell";
import { ParentHome } from "../../src/components/home/ParentHome";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import {
  PARENT_LANDING_TOUR_ID,
  PARENT_LANDING_TOUR_STEPS,
  PARENT_LANDING_TOUR_TARGETS,
} from "../../src/components/home/parent-landing-tour.config";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    canDismiss: () => false,
    dismissAll: jest.fn(),
  }),
  usePathname: () => "/",
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => {
      return callback();
    }, [callback]);
  },
}));

function parentUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "u1",
    firstName: "Robert",
    lastName: "Ntamack",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    profileCompleted: true,
    role: "PARENT",
    activeRole: "PARENT",
    ...overrides,
  };
}

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

describe("Tour parent-landing — intégration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOnboardingTourStore();
    useAuthStore.setState({
      user: parentUser(),
      schoolSlug: "college-vogt",
      isLoading: false,
      isAuthenticated: true,
      accessToken: "token",
    } as never);
    useFamilyStore.setState({
      children: [
        { id: "c1", firstName: "Lisa", lastName: "Ntamack", className: "6e A" },
      ],
      activeChildId: null,
      isLoading: false,
      loadChildren: jest.fn(),
      clearChildren: jest.fn(),
      setActiveChild: jest.fn(),
    } as never);
    useMessagingStore.setState({
      folder: "inbox",
      messages: [],
      meta: null,
      isLoading: false,
      isRefreshing: false,
      search: "",
      unreadCount: 3,
      loadUnreadCount: jest.fn().mockResolvedValue(undefined),
    } as never);
  });

  function renderParentLanding() {
    return render(
      <AppShell>
        <ParentHome user={parentUser()} schoolSlug="college-vogt" />
      </AppShell>,
    );
  }

  it("démarre le tour parent-landing au premier passage sur la landing page", async () => {
    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );
    expect(useOnboardingTourStore.getState().activeRole).toBe("parent");
    expect(useOnboardingTourStore.getState().steps).toHaveLength(5);
  });

  it("ne démarre pas le tour si onboardingHelpEnabled est explicitement désactivé", async () => {
    useAuthStore.setState({
      user: parentUser({ onboardingHelpEnabled: false }),
    } as never);

    renderParentLanding();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("ne redémarre pas le tour s'il a déjà été complété pour ce rôle", async () => {
    useOnboardingTourStore.setState({
      completedTours: { [`parent:${PARENT_LANDING_TOUR_ID}`]: true },
    });

    renderParentLanding();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
  });

  it("monte les 4 cibles du tour à travers le chrome global (bottom tab bar + drawer), jamais le contenu de la landing", () => {
    renderParentLanding();

    // Cibles portées par la barre de tabs (chrome global).
    expect(screen.getByTestId("bottom-tab-menu")).toBeTruthy();
    expect(screen.getByTestId("bottom-tab-account")).toBeTruthy();
    // Cibles portées par le drawer (menu de navigation), pas par ParentHome.
    expect(screen.getByTestId("nav-item-messages")).toBeTruthy();
    expect(screen.getByTestId("drawer-section-child-c1")).toBeTruthy();
  });

  it("presser l'icône menu ouvre réellement le drawer ET avance le tour à l'étape suivante", async () => {
    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );
    expect(useOnboardingTourStore.getState().steps[0].targetKey).toBe(
      PARENT_LANDING_TOUR_TARGETS.menu,
    );

    act(() => {
      fireEvent.press(screen.getByTestId("bottom-tab-menu"));
    });

    expect(useOnboardingTourStore.getState().stepIndex).toBe(1);
    expect(useOnboardingTourStore.getState().steps[1].targetKey).toBe(
      PARENT_LANDING_TOUR_TARGETS.drawerMessaging,
    );
    // Le drawer est réellement ouvert (pointerEvents "auto"), pas seulement
    // "comme si" — reproduit l'action normale du bouton.
    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("auto");
  });

  it("l'étape messagerie force l'ouverture de la section générale du drawer même si un enfant était déjà actif", async () => {
    useFamilyStore.setState({ activeChildId: "c1" } as never);

    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );

    // Sans forçage, la section "générale" (qui contient "Messagerie") ne
    // serait pas montée car le drawer ouvre par défaut la section de
    // l'enfant actif.
    expect(screen.queryByTestId("nav-item-messages")).toBeNull();

    act(() => {
      useOnboardingTourStore.setState({
        activeTourId: PARENT_LANDING_TOUR_ID,
        activeRole: "parent",
        steps: PARENT_LANDING_TOUR_STEPS,
        stepIndex: 1,
        targetLayout: null,
      });
    });

    expect(screen.getByTestId("nav-item-messages")).toBeTruthy();
  });

  it("presser la ligne du premier enfant dans le drawer avance le tour à l'étape compte", async () => {
    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );

    // Étape 1 (menu) : presser l'icône ouvre réellement le drawer — les
    // cibles suivantes vivent dedans et ne réagiraient pas aux presses tant
    // qu'il n'est pas réellement ouvert (pointerEvents "none" sinon).
    act(() => {
      fireEvent.press(screen.getByTestId("bottom-tab-menu"));
    });
    expect(useOnboardingTourStore.getState().stepIndex).toBe(1);

    // Étape 2 (messagerie) : purement informative, on simule l'appui sur
    // "Suivant" directement via le store (l'overlay lui-même n'est pas monté
    // dans cet arbre de test — il vit dans app/_layout.tsx).
    act(() => {
      useOnboardingTourStore.getState().next();
    });
    expect(useOnboardingTourStore.getState().stepIndex).toBe(2);

    act(() => {
      fireEvent.press(screen.getByTestId("drawer-section-child-c1"));
    });

    expect(useOnboardingTourStore.getState().stepIndex).toBe(3);
    expect(useOnboardingTourStore.getState().steps[3].targetKey).toBe(
      PARENT_LANDING_TOUR_TARGETS.account,
    );
    // La ligne enfant s'est bien dépliée (action réelle exécutée en plus de
    // l'avancement du tour) — l'item "Accueil" de l'enfant est visible.
    expect(screen.getByTestId("nav-item-child-c1-home")).toBeTruthy();
  });

  it("referme automatiquement le drawer quand le tour atteint l'étape compte", async () => {
    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );

    act(() => {
      fireEvent.press(screen.getByTestId("bottom-tab-menu"));
    });
    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("auto");

    act(() => {
      useOnboardingTourStore.setState({
        activeTourId: PARENT_LANDING_TOUR_ID,
        activeRole: "parent",
        steps: PARENT_LANDING_TOUR_STEPS,
        stepIndex: 3,
        targetLayout: null,
      });
    });

    expect(screen.getByTestId("drawer-root").props.pointerEvents).toBe("none");
  });

  it("progresse à travers les 5 étapes et marque le tour comme complété pour le rôle parent", async () => {
    renderParentLanding();

    await waitFor(() =>
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        PARENT_LANDING_TOUR_ID,
      ),
    );

    const steps = useOnboardingTourStore.getState().steps;
    expect(steps.map((step) => step.targetKey)).toEqual([
      PARENT_LANDING_TOUR_TARGETS.menu,
      PARENT_LANDING_TOUR_TARGETS.drawerMessaging,
      PARENT_LANDING_TOUR_TARGETS.drawerChild,
      PARENT_LANDING_TOUR_TARGETS.account,
      PARENT_LANDING_TOUR_TARGETS.helpButton,
    ]);

    act(() => {
      useOnboardingTourStore.getState().next();
      useOnboardingTourStore.getState().next();
      useOnboardingTourStore.getState().next();
      useOnboardingTourStore.getState().next();
    });
    expect(useOnboardingTourStore.getState().stepIndex).toBe(4);

    act(() => {
      useOnboardingTourStore.getState().finish();
    });

    expect(useOnboardingTourStore.getState().activeTourId).toBeNull();
    expect(
      useOnboardingTourStore
        .getState()
        .isCompleted("parent", PARENT_LANDING_TOUR_ID),
    ).toBe(true);
  });
});
