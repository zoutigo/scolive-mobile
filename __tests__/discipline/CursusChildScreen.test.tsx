import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import CursusChildScreen from "../../app/(home)/cursus/[childId]";
import { disciplineApi } from "../../src/api/discipline.api";
import { useFamilyStore } from "../../src/store/family.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/discipline.api");
jest.mock("../../src/store/auth.store", () => ({ useAuthStore: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
  usePathname: () => "/(home)/cursus/[childId]",
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
const { useAuthStore } = jest.requireMock("../../src/store/auth.store") as {
  useAuthStore: jest.Mock;
};
function setAuthState(state: Record<string, unknown>) {
  useAuthStore.mockImplementation((selector?: (s: unknown) => unknown) =>
    selector ? selector(state) : state,
  );
}
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;

const EVENTS_TWO_YEARS = [
  makeLifeEvent({
    id: "evt-1",
    studentId: "child-1",
    type: "ABSENCE",
    justified: false,
    reason: "Absence 2025-2026",
    occurredAt: "2026-03-01T08:00:00.000Z",
    classId: "class-2",
    class: { id: "class-2", name: "5e B" },
    schoolYearId: "year-2",
    schoolYear: { id: "year-2", label: "2025-2026" },
  }),
  makeLifeEvent({
    id: "evt-2",
    studentId: "child-1",
    type: "SANCTION",
    reason: "Sanction 2024-2025",
    occurredAt: "2025-02-01T08:00:00.000Z",
    classId: "class-1",
    class: { id: "class-1", name: "6e A" },
    schoolYearId: "year-1",
    schoolYear: { id: "year-1", label: "2024-2025" },
  }),
  makeLifeEvent({
    id: "evt-3",
    studentId: "child-1",
    type: "RETARD",
    justified: true,
    reason: "Retard 2024-2025",
    occurredAt: "2025-03-01T08:00:00.000Z",
    classId: "class-1",
    class: { id: "class-1", name: "6e A" },
    schoolYearId: "year-1",
    schoolYear: { id: "year-1", label: "2024-2025" },
  }),
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  });
  useFamilyStore.setState({
    children: [
      {
        id: "child-1",
        firstName: "Remi",
        lastName: "Ntamack",
        className: "5e B",
      },
    ],
    isLoading: false,
    activeChildId: null,
    loadChildren: jest.fn(async () => {}),
    clearChildren: jest.fn(),
  });
  setAuthState({ schoolSlug: "college-vogt" });
  api.list.mockResolvedValue([]);
});

describe("CursusChildScreen", () => {
  it("charge le cursus sur tout l'historique (scope=all) et affiche le nom de l'enfant", async () => {
    api.list.mockResolvedValueOnce(EVENTS_TWO_YEARS);

    render(<CursusChildScreen />);

    expect(screen.getByText("Cursus")).toBeOnTheScreen();
    expect(screen.getByText("Ntamack Remi")).toBeOnTheScreen();

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith("college-vogt", "child-1", {
        scope: "all",
        limit: 500,
      });
    });
  });

  it("regroupe les événements par année scolaire puis par classe", async () => {
    api.list.mockResolvedValueOnce(EVENTS_TWO_YEARS);

    render(<CursusChildScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("cursus-groups")).toBeOnTheScreen();
    });

    expect(screen.getByText("2025-2026 · 5e B")).toBeOnTheScreen();
    expect(screen.getByText("2024-2025 · 6e A")).toBeOnTheScreen();
    expect(screen.getByText("Absence 2025-2026")).toBeOnTheScreen();
    expect(screen.getByText("Sanction 2024-2025")).toBeOnTheScreen();
    expect(screen.getByText("Retard 2024-2025")).toBeOnTheScreen();
  });

  it("affiche la synthèse chiffrée : nb années/classes et compteurs par type", async () => {
    api.list.mockResolvedValueOnce(EVENTS_TWO_YEARS);

    render(<CursusChildScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("cursus-kpi-groups-value")).toHaveTextContent(
        "2",
      );
    });
    expect(screen.getByTestId("cursus-kpi-absences-value")).toHaveTextContent(
      "1",
    );
    expect(screen.getByTestId("cursus-kpi-retards-value")).toHaveTextContent(
      "1",
    );
    expect(
      screen.getByTestId("cursus-kpi-sanctions-value"),
    ).toHaveTextContent("1");
    expect(
      screen.getByTestId("cursus-kpi-punitions-value"),
    ).toHaveTextContent("0");
  });

  it("filtre l'historique par année scolaire", async () => {
    api.list.mockResolvedValueOnce(EVENTS_TWO_YEARS);

    render(<CursusChildScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("cursus-groups")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("cursus-filter-year-trigger"));
    fireEvent.press(screen.getByTestId("cursus-filter-year-item-year-1"));

    expect(screen.queryByText("2025-2026 · 5e B")).toBeNull();
    expect(screen.getByText("2024-2025 · 6e A")).toBeOnTheScreen();
    expect(screen.getByTestId("cursus-kpi-groups-value")).toHaveTextContent(
      "1",
    );

    fireEvent.press(screen.getByTestId("cursus-filters-reset"));

    expect(screen.getByText("2025-2026 · 5e B")).toBeOnTheScreen();
  });

  it("filtre l'historique par type d'événement", async () => {
    api.list.mockResolvedValueOnce(EVENTS_TWO_YEARS);

    render(<CursusChildScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("cursus-groups")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("cursus-filter-type-trigger"));
    fireEvent.press(screen.getByTestId("cursus-filter-type-item-SANCTION"));

    expect(screen.getByText("Sanction 2024-2025")).toBeOnTheScreen();
    expect(screen.queryByText("Retard 2024-2025")).toBeNull();
    expect(screen.queryByText("Absence 2025-2026")).toBeNull();
  });

  it("affiche un état vide quand l'élève n'a aucun événement", async () => {
    api.list.mockResolvedValueOnce([]);

    render(<CursusChildScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("cursus-groups-empty")).toBeOnTheScreen();
    });
  });

  it("affiche une erreur de chargement et permet de réessayer", async () => {
    api.list
      .mockRejectedValueOnce(new Error("DOWN"))
      .mockResolvedValueOnce([]);

    render(<CursusChildScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("cursus-error")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByTestId("cursus-retry"));

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledTimes(2);
    });
  });

  it("déclenche le retour vers l'accueil enfant via le bouton du header", async () => {
    api.list.mockResolvedValueOnce([]);

    render(<CursusChildScreen />);

    await waitFor(() => expect(api.list).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("cursus-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("affiche l'entrée d'aide dans le menu et ouvre/ferme la modale", async () => {
    api.list.mockResolvedValueOnce([]);

    render(<CursusChildScreen />);
    await waitFor(() => expect(api.list).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("cursus-help-menu-item"));

    await waitFor(() =>
      expect(screen.getByTestId("cursus-help-modal-title")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("cursus-help-modal-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("cursus-help-modal-title")).toBeNull(),
    );
  });
});
