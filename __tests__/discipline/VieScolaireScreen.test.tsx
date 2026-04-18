import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import VieScolaireScreen from "../../app/(home)/vie-scolaire/[childId]";
import { disciplineApi } from "../../src/api/discipline.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
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
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
  usePathname: () => "/(home)/vie-scolaire/[childId]",
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  DrawerContext: require("react").createContext({
    openDrawer: () => {},
    closeDrawer: () => {},
    isDrawerOpen: false,
  }),
  useDrawer: jest.fn(),
}));

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;
const { useAuthStore } = jest.requireMock("../../src/store/auth.store") as {
  useAuthStore: jest.Mock;
};
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
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
  useAuthStore.mockReturnValue({ schoolSlug: "college-vogt" });
  api.list.mockResolvedValue([]);
});

describe("VieScolaireScreen", () => {
  it("charge les donnees et affiche le nom de l'enfant", async () => {
    api.list.mockResolvedValueOnce([makeLifeEvent({ studentId: "child-1" })]);

    render(<VieScolaireScreen />);

    expect(screen.getByText("Vie scolaire")).toBeOnTheScreen();
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

    render(<VieScolaireScreen />);

    expect(screen.getByTestId("unjustified-banner")).toBeOnTheScreen();
  });

  it("affiche un header de type module mobile avec fond primary et retour", () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<VieScolaireScreen />);

    expect(screen.getByTestId("vie-scolaire-header")).toHaveStyle({
      backgroundColor: "#0C5FA8",
      marginHorizontal: -16,
    });
    expect(screen.getByTestId("btn-back")).toHaveStyle({
      backgroundColor: "rgba(255,255,255,0.14)",
    });
  });

  it("declenche le retour via le bouton du header", () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<VieScolaireScreen />);

    fireEvent.press(screen.getByTestId("btn-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("bascule vers l'onglet absences depuis le KPI", () => {
    useDisciplineStore.setState({
      eventsMap: {
        "child-1": makeEventsByTypes(["ABSENCE", "RETARD", "SANCTION"]).map(
          (event) => ({ ...event, studentId: "child-1" }),
        ),
      },
    });

    render(<VieScolaireScreen />);

    fireEvent.press(screen.getByTestId("kpi-absences"));
    expect(screen.getByTestId("list-absences")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("tab-sanctions"));
    expect(screen.getByTestId("list-sanctions")).toBeOnTheScreen();
  });

  it("redirige le bouton tout voir vers l'onglet sanctions si le dernier evenement en est une", () => {
    useDisciplineStore.setState({
      eventsMap: {
        "child-1": [
          makeLifeEvent({
            id: "san-1",
            studentId: "child-1",
            type: "SANCTION",
            occurredAt: "2026-04-15T10:20:00.000Z",
          }),
          makeLifeEvent({
            id: "ret-1",
            studentId: "child-1",
            type: "RETARD",
            occurredAt: "2026-04-02T12:49:00.000Z",
          }),
        ],
      },
    });

    render(<VieScolaireScreen />);

    fireEvent.press(screen.getByTestId("btn-see-all"));

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

    render(<VieScolaireScreen />);

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

    render(<VieScolaireScreen />);

    expect(screen.getByTestId("synthese-empty")).toBeOnTheScreen();
  });

  it("affiche une erreur de chargement et permet de reessayer", async () => {
    api.list.mockRejectedValueOnce(new Error("DOWN")).mockResolvedValueOnce([]);

    render(<VieScolaireScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("load-error")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("btn-retry"));

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(2);
    });
  });

  it("ouvre le menu de navigation enfant via le bouton header droit", async () => {
    useDisciplineStore.setState({
      eventsMap: { "child-1": [makeLifeEvent({ studentId: "child-1" })] },
    });

    render(<VieScolaireScreen />);
    fireEvent.press(screen.getByTestId("btn-menu"));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });
});
