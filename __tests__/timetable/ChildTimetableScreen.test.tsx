import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ChildTimetableScreen } from "../../src/components/timetable/ChildTimetableScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";
import { colors } from "../../src/theme";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest
    .fn()
    .mockReturnValue({ width: 360, height: 800, scale: 2, fontScale: 1 }),
}));

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

function screen$(w: number, h = 800) {
  return { width: w, height: h, scale: 2, fontScale: 1 } as const;
}

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockLoadMyTimetable = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ childId: "stu-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-14T12:00:00Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWindowDimensions.mockReturnValue(screen$(360));
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
    isDrawerOpen: false,
  });
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Robert",
      lastName: "Ntamack",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "PARENT" }],
      profileCompleted: true,
      role: "PARENT",
      activeRole: "PARENT",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });
  useTimetableStore.setState({
    myTimetable: {
      student: { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
      class: {
        id: "class-1",
        name: "6e A",
        schoolYearId: "sy1",
        academicLevelId: null,
      },
      slots: [],
      oneOffSlots: [],
      slotExceptions: [],
      occurrences: [
        {
          id: "occ-ang-14",
          source: "RECURRING",
          status: "PLANNED",
          occurrenceDate: "2026-04-14",
          weekday: 2,
          startMinute: 525,
          endMinute: 600,
          room: "B45",
          reason: null,
          subject: { id: "ang", name: "Anglais" },
          teacherUser: { id: "t1", firstName: "Albert", lastName: "Mvondo" },
        },
        {
          id: "occ-geo-14",
          source: "RECURRING",
          status: "PLANNED",
          occurrenceDate: "2026-04-14",
          weekday: 2,
          startMinute: 600,
          endMinute: 705,
          room: "A08",
          reason: null,
          subject: { id: "geo", name: "Geographie" },
          teacherUser: { id: "t2", firstName: "Francois", lastName: "Mbarga" },
        },
        {
          id: "occ-tech-15",
          source: "RECURRING",
          status: "PLANNED",
          occurrenceDate: "2026-04-15",
          weekday: 3,
          startMinute: 765,
          endMinute: 820,
          room: "Atelier",
          reason: null,
          subject: { id: "tech", name: "Technologie" },
          teacherUser: { id: "t3", firstName: "Aline", lastName: "Mekongo" },
        },
        {
          id: "occ-chi-23",
          source: "RECURRING",
          status: "PLANNED",
          occurrenceDate: "2026-04-23",
          weekday: 4,
          startMinute: 820,
          endMinute: 865,
          room: "Labo",
          reason: null,
          subject: { id: "chi", name: "Chimie" },
          teacherUser: { id: "t4", firstName: "Guy", lastName: "Ndem" },
        },
      ],
      calendarEvents: [],
      subjectStyles: [
        { subjectId: "ang", colorHex: "#11C5C6" },
        { subjectId: "geo", colorHex: "#7AC943" },
        { subjectId: "tech", colorHex: "#3B82F6" },
        { subjectId: "chi", colorHex: "#EF4444" },
      ],
    },
    isLoadingMyTimetable: false,
    errorMessage: null,
    loadMyTimetable: mockLoadMyTimetable,
    clearError: jest.fn(),
  } as never);
});

describe("ChildTimetableScreen", () => {
  it("charge le planning au montage avec la plage du jour courant", async () => {
    render(<ChildTimetableScreen />);

    await waitFor(() => {
      expect(mockLoadMyTimetable).toHaveBeenCalledWith("college-vogt", {
        childId: "stu-1",
        fromDate: "2026-04-14",
        toDate: "2026-04-14",
      });
    });
  });

  it("affiche la vue jour par defaut avec les creneaux du jour et leur couleur", () => {
    render(<ChildTimetableScreen />);

    expect(screen.getByText("Aujourd'hui")).toBeTruthy();
    expect(screen.getByText("08:45 - 10:00 · Anglais")).toBeTruthy();
    expect(screen.getByText("10:00 - 11:45 · Geographie")).toBeTruthy();
    expect(screen.getByText("Mvondo Albert")).toBeTruthy();
    expect(screen.getByText("SALLE B45")).toBeTruthy();

    const card = screen.getByTestId("child-timetable-day-card-occ-ang-14");
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle.backgroundColor).toBe("#E7F9F9");
    expect(cardStyle.borderColor).toBe("#B3ECED");
  });

  it("affiche un header compact pleine largeur avec le nom et la classe", () => {
    render(<ChildTimetableScreen />);

    const header = screen.getByTestId("child-timetable-header");
    const title = screen.getByTestId("child-timetable-header-title");
    const subtitle = screen.getByTestId("child-timetable-header-subtitle");

    const headerStyle = StyleSheet.flatten(header.props.style);
    const titleStyle = StyleSheet.flatten(title.props.style);
    const subtitleStyle = StyleSheet.flatten(subtitle.props.style);

    expect(screen.getByText("Emploi du temps")).toBeTruthy();
    expect(screen.getByText("Lisa Ntamack • 6e A")).toBeTruthy();
    expect(headerStyle.backgroundColor).toBe(colors.primary);
    expect(headerStyle.marginHorizontal).toBe(-16);
    expect(headerStyle.paddingVertical).toBe(10);
    expect(titleStyle.fontWeight).toBe("600");
    expect(titleStyle.fontSize).toBe(19);
    expect(subtitleStyle.fontSize).toBe(11);
  });

  it("revient à l'écran précédent via le bouton retour", () => {
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-back"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "stu-1" },
    });
  });

  it("ouvre le menu de navigation enfant via l'icone droite", () => {
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-menu"));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });

  it("permet de basculer en vue semaine et de consulter le detail d'un creneau", async () => {
    render(<ChildTimetableScreen />);

    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    expect(screen.getByText("Cette semaine")).toBeTruthy();
    expect(screen.getByTestId("child-timetable-week-grid")).toBeTruthy();
    expect(screen.getByText("DETAIL DU CRENEAU SELECTIONNE")).toBeTruthy();
    expect(screen.getByText("Matiere: Anglais")).toBeTruthy();

    fireEvent.press(
      screen.getByTestId("child-timetable-week-slot-occ-tech-15"),
    );

    await waitFor(() => {
      expect(screen.getByText("Matiere: Technologie")).toBeTruthy();
      expect(screen.getByText("Salle: Atelier")).toBeTruthy();
    });
  });

  it("permet de basculer en vue mois et d'afficher l'agenda du jour selectionne", async () => {
    render(<ChildTimetableScreen />);

    fireEvent.press(screen.getByTestId("child-timetable-mode-month"));

    expect(screen.getByText("Ce mois")).toBeTruthy();
    expect(screen.getByTestId("child-timetable-month-grid")).toBeTruthy();
    expect(screen.getByText("AGENDA DU JOUR SELECTIONNE")).toBeTruthy();
    expect(screen.getByText("mardi 14 avril")).toBeTruthy();
    expect(screen.getByText("08:45 - 10:00 · Anglais")).toBeTruthy();

    fireEvent.press(screen.getByTestId("child-timetable-month-day-2026-04-15"));

    await waitFor(() => {
      expect(screen.getByText("mercredi 15 avril")).toBeTruthy();
      expect(screen.getByText("12:45 - 13:40 · Technologie")).toBeTruthy();
    });
  });

  it("rend la grille mensuelle en lignes explicites sans espace résiduel en bas (5 colonnes, pas de cours weekend)", () => {
    render(<ChildTimetableScreen />);

    fireEvent.press(screen.getByTestId("child-timetable-mode-month"));

    // Avril 2026 (showSaturday=false, showSunday=false) : 5 colonnes
    // 2 vides + 22 jours ouvrés → 24 cellules → 5 lignes de 5
    for (let row = 0; row < 5; row += 1) {
      expect(
        screen.getByTestId(`child-timetable-month-row-${row}`),
      ).toBeTruthy();
    }
    // Pas de 6e ligne
    expect(screen.queryByTestId("child-timetable-month-row-5")).toBeNull();
  });

  it("place les bons jours dans les bonnes lignes de la grille mensuelle", () => {
    render(<ChildTimetableScreen />);

    fireEvent.press(screen.getByTestId("child-timetable-mode-month"));

    // Ligne 0 : vide, vide, 1, 2, 3 (avril commence un mercredi)
    expect(
      screen.getByTestId("child-timetable-month-day-2026-04-01"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("child-timetable-month-day-2026-04-03"),
    ).toBeTruthy();

    // Ligne 4 (dernière) : 27, 28, 29, 30 + vide
    expect(
      screen.getByTestId("child-timetable-month-day-2026-04-27"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("child-timetable-month-day-2026-04-30"),
    ).toBeTruthy();
  });

  it("affiche la colonne samedi si le planning récurrent inclut le samedi (weekday:6)", () => {
    const state = useTimetableStore.getState();
    if (!state.myTimetable) {
      throw new Error("Missing myTimetable fixture");
    }

    useTimetableStore.setState({
      myTimetable: {
        ...state.myTimetable,
        // La source de vérité est slots (planning récurrent), comme le web
        slots: [
          {
            id: "slot-sat",
            weekday: 6,
            startMinute: 480,
            endMinute: 540,
            room: "Gym",
            subject: { id: "sport", name: "Sport" },
            teacherUser: { id: "t5", firstName: "Paul", lastName: "Biya" },
          },
        ],
        occurrences: [
          {
            id: "occ-sat",
            source: "RECURRING",
            status: "PLANNED",
            occurrenceDate: "2026-04-18",
            weekday: 6,
            startMinute: 480,
            endMinute: 540,
            room: "Gym",
            reason: null,
            subject: { id: "sport", name: "Sport" },
            teacherUser: { id: "t5", firstName: "Paul", lastName: "Biya" },
          },
        ],
      },
    });

    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-month"));

    // Samedi 18 avril doit être présent dans la grille
    expect(
      screen.getByTestId("child-timetable-month-day-2026-04-18"),
    ).toBeTruthy();
    // Le dimanche ne doit pas apparaître (pas de cours ce jour)
    expect(
      screen.queryByTestId("child-timetable-month-day-2026-04-19"),
    ).toBeNull();
    // La grille doit avoir 6 colonnes → nombre de cellules multiple de 6
    // Avril 2026 avec S visible : 5 lignes × 6 = 30 cellules
    const rows = screen
      .getAllByTestId(/^child-timetable-month-row-/)
      .filter(Boolean);
    expect(rows).toHaveLength(5);
  });

  it("affiche le label de colonne S en vue mois si le planning récurrent inclut le samedi", () => {
    const state = useTimetableStore.getState();
    if (!state.myTimetable) {
      throw new Error("Missing myTimetable fixture");
    }

    useTimetableStore.setState({
      myTimetable: {
        ...state.myTimetable,
        slots: [
          {
            id: "slot-sat",
            weekday: 6,
            startMinute: 480,
            endMinute: 540,
            room: "Gym",
            subject: { id: "sport", name: "Sport" },
            teacherUser: { id: "t5", firstName: "Paul", lastName: "Biya" },
          },
        ],
      },
    });

    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-month"));

    // En-tête de colonne S présent, D absent
    expect(screen.getByText("S")).toBeTruthy();
    expect(screen.queryByText("D")).toBeNull();
  });

  it("masque les labels S et D en vue mois si aucun cours le week-end", () => {
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-month"));

    // Ni S ni D dans l'en-tête de colonnes
    expect(screen.queryByText("S")).toBeNull();
    expect(screen.queryByText("D")).toBeNull();
    // Colonnes de semaine toujours présentes
    expect(screen.getByText("L")).toBeTruthy();
    expect(screen.getByText("V")).toBeTruthy();
  });
});

describe("WeekGrid — responsive (largeur colonnes)", () => {
  it("sur téléphone 360px, les colonnes jour ont la largeur minimale 56px", () => {
    mockUseWindowDimensions.mockReturnValue(screen$(360));
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    // Sur téléphone le calcul donne raw < 56 → on clamp à 56
    const col = screen.getByTestId("child-timetable-week-col-2");
    const colStyle = StyleSheet.flatten(col.props.style);
    expect(colStyle.width).toBe(56);
  });

  it("sur tablette 768px, les colonnes jour sont plus larges que 56px", () => {
    mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    const col = screen.getByTestId("child-timetable-week-col-2");
    const colStyle = StyleSheet.flatten(col.props.style);
    expect(colStyle.width).toBeGreaterThan(56);
  });

  it("sur tablette 768px / 5 jours, la largeur de colonne est 130px", () => {
    // raw = (768-68-36-10)/5 = 130.8 → floor = 130
    mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    const col = screen.getByTestId("child-timetable-week-col-2");
    const colStyle = StyleSheet.flatten(col.props.style);
    expect(colStyle.width).toBe(130);
  });

  it("sur tablette 768px, les colonnes jour ont toutes la même largeur", () => {
    mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    // Récupérer la largeur d'une colonne corps
    const col = screen.getByTestId("child-timetable-week-col-2");
    const colWidth = StyleSheet.flatten(col.props.style).width as number;

    // Vérifier que toutes les colonnes ont la même largeur (cohérence)
    const col3 = screen.getByTestId("child-timetable-week-col-3");
    const col3Width = StyleSheet.flatten(col3.props.style).width as number;
    expect(colWidth).toBe(col3Width);
  });

  it("les créneaux restent cliquables sur tablette après adaptation de la largeur", async () => {
    mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    fireEvent.press(
      screen.getByTestId("child-timetable-week-slot-occ-tech-15"),
    );

    await waitFor(() => {
      expect(screen.getByText("Matiere: Technologie")).toBeTruthy();
    });
  });

  it("sur téléphone 375px, les créneaux sont toujours visibles et navigables", async () => {
    mockUseWindowDimensions.mockReturnValue(screen$(375, 812));
    render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    expect(screen.getByTestId("child-timetable-week-grid")).toBeTruthy();
    fireEvent.press(screen.getByTestId("child-timetable-week-slot-occ-ang-14"));

    await waitFor(() => {
      expect(screen.getByText("Matiere: Anglais")).toBeTruthy();
    });
  });

  it("la grille s'adapte après un changement de dimensions (rotation)", () => {
    // Portrait
    mockUseWindowDimensions.mockReturnValue(screen$(360));
    const { rerender } = render(<ChildTimetableScreen />);
    fireEvent.press(screen.getByTestId("child-timetable-mode-week"));

    const colPortrait = screen.getByTestId("child-timetable-week-col-2");
    const widthPortrait = StyleSheet.flatten(colPortrait.props.style).width;
    expect(widthPortrait).toBe(56);

    // Paysage (landscape) → réinitialiser les dimensions et re-render
    mockUseWindowDimensions.mockReturnValue(screen$(800, 360));
    rerender(<ChildTimetableScreen />);

    const colLandscape = screen.getByTestId("child-timetable-week-col-2");
    const widthLandscape = StyleSheet.flatten(colLandscape.props.style).width;
    expect(widthLandscape).toBeGreaterThan(56);
  });
});
