import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import DisciplineChildScreen from "../../app/(home)/discipline/[childId]";
import { disciplineApi } from "../../src/api/discipline.api";
import { badgesApi } from "../../src/api/badges.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
import { useBadgesStore } from "../../src/store/badges.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import {
  makeEventsByTypes,
  makeLifeEvent,
} from "../../test-utils/discipline.fixtures";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/api/badges.api");
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
  usePathname: () => "/(home)/discipline/[childId]",
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
jest.mock("../../src/components/navigation/drawer-context", () => ({
  DrawerContext: require("react").createContext({
    openDrawer: () => {},
    closeDrawer: () => {},
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  }),
  useDrawer: jest.fn(),
}));

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;
const mockBadgesApi = badgesApi as jest.Mocked<typeof badgesApi>;
const { useAuthStore } = jest.requireMock("../../src/store/auth.store") as {
  useAuthStore: jest.Mock;
};
// useAuthStore is fully mocked (not the real zustand store), so it must
// apply the selector itself when one is passed — otherwise selector-based
// callers (e.g. useOnboardingTourTrigger's `(state) => state.user`) get the
// whole mocked object back instead of just `.user`.
function setAuthState(state: Record<string, unknown>) {
  useAuthStore.mockImplementation((selector?: (s: unknown) => unknown) =>
    selector ? selector(state) : state,
  );
}
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  });
  useDisciplineStore.getState().reset();
  useFamilyStore.setState({
    children: [
      {
        id: "child-1",
        firstName: "Remi",
        lastName: "Ntamack",
        className: "6e C",
      },
    ],
    isLoading: false,
    activeChildId: null,
    loadChildren: jest.fn(async () => {}),
    clearChildren: jest.fn(),
  });
  setAuthState({ schoolSlug: "college-vogt" });
  api.list.mockResolvedValue([]);
  mockBadgesApi.markRead.mockResolvedValue(undefined);
  mockBadgesApi.getUnreadSummary.mockResolvedValue({
    messagesUnread: 0,
    feedUnread: 0,
    reinscriptionPending: 0,
    ticketsNeedingResponse: 0,
    ticketsUnreadReplies: 0,
    children: [],
    teacherClasses: [],
    total: 0,
  });
  useBadgesStore.getState().clear();
});

describe("DisciplineChildScreen", () => {
  it("charge les donnees et affiche le nom de l'enfant", async () => {
    api.list.mockResolvedValueOnce([makeLifeEvent({ studentId: "child-1" })]);

    render(<DisciplineChildScreen />);

    expect(screen.getByText("Discipline")).toBeOnTheScreen();
    expect(screen.getByText("Ntamack Remi")).toBeOnTheScreen();

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith("college-vogt", "child-1", {
        scope: "current",
        limit: 200,
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId("school-year-section-title")).toHaveTextContent(
        "Cette année scolaire",
      );
    });
  });

  it("affiche la banniere des absences non justifiees", () => {
    useDisciplineStore.setState({
      eventsMap: {
        "child-1": [
          makeLifeEvent({
            id: "abs-1",
            studentId: "child-1",
            justified: false,
          }),
          makeLifeEvent({ id: "ret-1", studentId: "child-1", type: "RETARD" }),
        ],
      },
    });

    render(<DisciplineChildScreen />);

    expect(screen.getByTestId("unjustified-banner")).toBeOnTheScreen();
  });

  it("affiche un header de type module mobile avec fond primary et retour", () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<DisciplineChildScreen />);

    expect(screen.getByTestId("discipline-self-header")).toHaveStyle({
      backgroundColor: "#08467D",
      paddingHorizontal: 20,
    });
    expect(screen.getByTestId("btn-back")).toHaveStyle({
      backgroundColor: "rgba(255,255,255,0.14)",
    });
  });

  it("declenche le retour via le bouton du header", () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<DisciplineChildScreen />);

    fireEvent.press(screen.getByTestId("btn-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("affiche l'entrée d'aide dans le menu et ouvre/ferme la modale (vue parent)", async () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<DisciplineChildScreen />);

    fireEvent.press(screen.getByTestId("module-header-menu"));
    expect(screen.getByTestId("discipline-self-help-menu-item")).toBeTruthy();

    fireEvent.press(screen.getByTestId("discipline-self-help-menu-item"));
    await waitFor(() =>
      expect(screen.getByTestId("discipline-self-help-modal-title")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("discipline-self-help-modal-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("discipline-self-help-modal-title")).toBeNull(),
    );
  });

  it("filtre les evenements inline depuis le KPI dans l'onglet synthese", () => {
    const events = makeEventsByTypes(["ABSENCE", "RETARD", "SANCTION"]).map(
      (event) => ({ ...event, studentId: "child-1" }),
    );
    useDisciplineStore.setState({ eventsMap: { "child-1": events } });

    render(<DisciplineChildScreen />);

    // Avant filtre : tous les événements visibles dans la synthèse
    expect(screen.getByTestId("synthese-tab")).toBeOnTheScreen();
    expect(screen.getByText("ABSENCE reason 1")).toBeOnTheScreen();

    // Clic sur KPI ABSENCES → filtre inline
    fireEvent.press(screen.getByTestId("kpi-absences"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : ABSENCES",
    );
    expect(screen.getByText("ABSENCE reason 1")).toBeOnTheScreen();
    expect(screen.queryByText("RETARD reason 2")).toBeNull();

    // On est toujours dans l'onglet synthèse, pas de navigation
    expect(screen.getByTestId("synthese-tab")).toBeOnTheScreen();
    expect(screen.queryByTestId("list-absences")).toBeNull();
  });

  it("Tout voir reinitialise le filtre dans l'onglet synthese", () => {
    const events = makeEventsByTypes(["ABSENCE", "RETARD"]).map((event) => ({
      ...event,
      studentId: "child-1",
    }));
    useDisciplineStore.setState({ eventsMap: { "child-1": events } });

    render(<DisciplineChildScreen />);

    fireEvent.press(screen.getByTestId("kpi-retards"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements : RETARDS",
    );

    fireEvent.press(screen.getByTestId("btn-see-all"));
    expect(screen.getByTestId("events-section-title")).toHaveTextContent(
      "Derniers événements",
    );
    expect(screen.getByText("ABSENCE reason 1")).toBeOnTheScreen();
    expect(screen.getByText("RETARD reason 2")).toBeOnTheScreen();
  });

  it("les onglets Absences et Sanctions restent navigables via la barre d'onglets", () => {
    useDisciplineStore.setState({
      eventsMap: {
        "child-1": makeEventsByTypes(["ABSENCE", "RETARD", "SANCTION"]).map(
          (event) => ({ ...event, studentId: "child-1" }),
        ),
      },
    });

    render(<DisciplineChildScreen />);

    fireEvent.press(screen.getByTestId("tab-absences"));
    expect(screen.getByTestId("list-absences")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("tab-sanctions"));
    expect(screen.getByTestId("list-sanctions")).toBeOnTheScreen();
  });

  it("utilise l'infinite scroll sur la liste lecture seule des absences", () => {
    const events = Array.from({ length: 9 }, (_, index) =>
      makeLifeEvent({
        id: `abs-${index + 1}`,
        studentId: "child-1",
        type: index % 2 === 0 ? "ABSENCE" : "RETARD",
        reason: `Absence lecture ${index + 1}`,
      }),
    );

    useDisciplineStore.setState({
      eventsMap: { "child-1": events },
    });

    render(<DisciplineChildScreen />);

    fireEvent.press(screen.getByTestId("tab-absences"));

    expect(screen.getByText("Absence lecture 1")).toBeOnTheScreen();
    expect(screen.getByText("Absence lecture 8")).toBeOnTheScreen();
    expect(screen.queryByText("Absence lecture 9")).toBeNull();

    fireEvent(screen.getByTestId("list-absences"), "onMomentumScrollBegin");
    fireEvent(screen.getByTestId("list-absences"), "onEndReached", {
      distanceFromEnd: 20,
    });

    expect(screen.getByText("Absence lecture 9")).toBeOnTheScreen();
    expect(screen.getByTestId("infinite-scroll-end-footer")).toBeOnTheScreen();
  });

  it("affiche l'etat vide sur la synthese sans evenement", () => {
    useDisciplineStore.setState({ eventsMap: { "child-1": [] } });

    render(<DisciplineChildScreen />);

    expect(screen.getByTestId("synthese-empty")).toBeOnTheScreen();
  });

  // Régression : le badge discipline (icône app + nav) n'était jamais remis
  // à zéro après consultation, car aucun écran n'appelait badgesApi.markRead.
  it("marque la discipline comme lue pour cet enfant à l'ouverture de l'écran", async () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<DisciplineChildScreen />);

    await waitFor(() => {
      expect(mockBadgesApi.markRead).toHaveBeenCalledWith(
        "college-vogt",
        "DISCIPLINE",
        "child-1",
      );
    });
  });

  it("recharge le résumé des badges après avoir marqué la discipline comme lue", async () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<DisciplineChildScreen />);

    await waitFor(() => {
      expect(mockBadgesApi.getUnreadSummary).toHaveBeenCalledWith(
        "college-vogt",
      );
    });
  });

  it("n'appelle pas markRead si l'école n'est pas encore connue", () => {
    setAuthState({ schoolSlug: null });
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<DisciplineChildScreen />);

    expect(mockBadgesApi.markRead).not.toHaveBeenCalled();
  });

  it("affiche une erreur de chargement et permet de reessayer", async () => {
    api.list.mockRejectedValueOnce(new Error("DOWN")).mockResolvedValueOnce([]);

    render(<DisciplineChildScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("load-error")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("btn-retry"));

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(2);
    });
  });
});
