/**
 * Tests d'intégration : vue hebdomadaire responsive
 *
 * Simule le rendu complet de ChildTimetableScreen avec différentes tailles
 * d'écran et vérifie que la grille hebdomadaire remplit correctement l'espace
 * disponible, quel que soit le profil (parent, enseignant) et le nombre de
 * jours affichés.
 */
import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ChildTimetableScreen } from "../../src/components/timetable/ChildTimetableScreen";
import { computeWeekDayColumnWidth } from "../../src/components/timetable/ChildTimetableScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({ childId: "stu-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));
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
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;

// Occurrences couvrant lundi→vendredi de la semaine du 14 avril 2026
const BASE_OCCURRENCES = [
  {
    id: "occ-lun",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: "2026-04-13",
    weekday: 1,
    startMinute: 480,
    endMinute: 570,
    room: "A01",
    reason: null,
    subject: { id: "math", name: "Maths" },
    teacherUser: { id: "t1", firstName: "A", lastName: "B" },
  },
  {
    id: "occ-mar",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: "2026-04-14",
    weekday: 2,
    startMinute: 480,
    endMinute: 570,
    room: "B02",
    reason: null,
    subject: { id: "ang", name: "Anglais" },
    teacherUser: { id: "t2", firstName: "C", lastName: "D" },
  },
  {
    id: "occ-mer",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: "2026-04-15",
    weekday: 3,
    startMinute: 600,
    endMinute: 660,
    room: "C03",
    reason: null,
    subject: { id: "geo", name: "Géo" },
    teacherUser: { id: "t3", firstName: "E", lastName: "F" },
  },
  {
    id: "occ-jeu",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: "2026-04-16",
    weekday: 4,
    startMinute: 660,
    endMinute: 720,
    room: "D04",
    reason: null,
    subject: { id: "his", name: "Histoire" },
    teacherUser: { id: "t4", firstName: "G", lastName: "H" },
  },
  {
    id: "occ-ven",
    source: "RECURRING" as const,
    status: "PLANNED" as const,
    occurrenceDate: "2026-04-17",
    weekday: 5,
    startMinute: 720,
    endMinute: 780,
    room: "E05",
    reason: null,
    subject: { id: "sco", name: "Sciences" },
    teacherUser: { id: "t5", firstName: "I", lastName: "J" },
  },
];

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-14T12:00:00Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseWindowDimensions.mockReturnValue(screen$(360, 800));
  mockUseDrawer.mockReturnValue({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    isDrawerOpen: false,
  });

  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Parent",
      lastName: "Test",
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
      student: { id: "stu-1", firstName: "Lea", lastName: "Test" },
      class: {
        id: "class-1",
        name: "5e B",
        schoolYearId: "sy1",
        academicLevelId: null,
      },
      slots: [],
      oneOffSlots: [],
      slotExceptions: [],
      occurrences: BASE_OCCURRENCES,
      calendarEvents: [],
      subjectStyles: [
        { subjectId: "math", colorHex: "#3B82F6" },
        { subjectId: "ang", colorHex: "#11C5C6" },
        { subjectId: "geo", colorHex: "#7AC943" },
        { subjectId: "his", colorHex: "#EF4444" },
        { subjectId: "sco", colorHex: "#F59E0B" },
      ],
    },
    isLoadingMyTimetable: false,
    errorMessage: null,
    loadMyTimetable: jest.fn(),
    clearError: jest.fn(),
  } as never);
});

function goToWeekView() {
  fireEvent.press(screen.getByTestId("child-timetable-mode-week"));
}

describe("WeekGrid responsive — intégration écran complet", () => {
  describe("téléphone — largeur minimale et scrollabilité", () => {
    it("affiche la grille en vue semaine sur téléphone 360px", () => {
      render(<ChildTimetableScreen />);
      goToWeekView();
      expect(screen.getByTestId("child-timetable-week-grid")).toBeTruthy();
    });

    it("sur téléphone 360px, chaque colonne jour a exactement 56px", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(360, 800));
      render(<ChildTimetableScreen />);
      goToWeekView();

      for (let weekday = 1; weekday <= 5; weekday++) {
        const col = screen.getByTestId(`child-timetable-week-col-${weekday}`);
        const { width } = StyleSheet.flatten(col.props.style);
        expect(width).toBe(56);
      }
    });

    it("sur téléphone 375px, les colonnes restent à 56px (raw < 56)", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(375, 812));
      render(<ChildTimetableScreen />);
      goToWeekView();

      const col = screen.getByTestId("child-timetable-week-col-1");
      expect(StyleSheet.flatten(col.props.style).width).toBe(56);
    });
  });

  describe("tablette — adaptation à l'espace disponible", () => {
    it("sur tablette 768px, chaque colonne jour est plus large que 56px", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
      render(<ChildTimetableScreen />);
      goToWeekView();

      for (let weekday = 1; weekday <= 5; weekday++) {
        const col = screen.getByTestId(`child-timetable-week-col-${weekday}`);
        const { width } = StyleSheet.flatten(col.props.style);
        expect(width).toBeGreaterThan(56);
      }
    });

    it("sur tablette 768px, toutes les colonnes ont la même largeur", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
      render(<ChildTimetableScreen />);
      goToWeekView();

      const widths = [1, 2, 3, 4, 5].map((wd) => {
        const col = screen.getByTestId(`child-timetable-week-col-${wd}`);
        return StyleSheet.flatten(col.props.style).width as number;
      });
      const unique = new Set(widths);
      expect(unique.size).toBe(1);
    });

    it("sur tablette 768px / 5 jours, la grille ne dépasse pas la largeur disponible", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
      const nDays = 5;
      const dayColWidth = computeWeekDayColumnWidth(768, nDays);
      const timelineWidth = 36 + nDays * (dayColWidth + 2);
      const available = 768 - 68;
      expect(timelineWidth).toBeLessThanOrEqual(available);
    });

    it("sur tablette 1024px, les colonnes sont encore plus larges que sur 768px", () => {
      // 768px
      mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
      const { unmount } = render(<ChildTimetableScreen />);
      goToWeekView();
      const col768 = screen.getByTestId("child-timetable-week-col-1");
      const width768 = StyleSheet.flatten(col768.props.style).width as number;
      unmount();

      // 1024px
      mockUseWindowDimensions.mockReturnValue(screen$(1024, 768));
      render(<ChildTimetableScreen />);
      goToWeekView();
      const col1024 = screen.getByTestId("child-timetable-week-col-1");
      const width1024 = StyleSheet.flatten(col1024.props.style).width as number;

      expect(width1024).toBeGreaterThan(width768);
    });
  });

  describe("semaine avec samedi — 6 jours", () => {
    beforeEach(() => {
      const state = useTimetableStore.getState();
      if (!state.myTimetable) return;
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
              teacherUser: { id: "t6", firstName: "Paul", lastName: "Biya" },
            },
          ],
          occurrences: [
            ...BASE_OCCURRENCES,
            {
              id: "occ-sam",
              source: "RECURRING" as const,
              status: "PLANNED" as const,
              occurrenceDate: "2026-04-18",
              weekday: 6,
              startMinute: 480,
              endMinute: 540,
              room: "Gym",
              reason: null,
              subject: { id: "sport", name: "Sport" },
              teacherUser: { id: "t6", firstName: "Paul", lastName: "Biya" },
            },
          ],
        },
      });
    });

    it("sur tablette 768px / 6 jours, la grille tient dans l'espace disponible", () => {
      const nDays = 6;
      const dayColWidth = computeWeekDayColumnWidth(768, nDays);
      const timelineWidth = 36 + nDays * (dayColWidth + 2);
      expect(timelineWidth).toBeLessThanOrEqual(768 - 68);
    });

    it("sur tablette 768px, les 6 colonnes (lun-sam) sont identiques en largeur", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
      render(<ChildTimetableScreen />);
      goToWeekView();

      const widths = [1, 2, 3, 4, 5, 6].map((wd) => {
        const col = screen.getByTestId(`child-timetable-week-col-${wd}`);
        return StyleSheet.flatten(col.props.style).width as number;
      });
      expect(new Set(widths).size).toBe(1);
      expect(widths[0]).toBeGreaterThan(56);
    });

    it("sur téléphone 360px / 6 jours, les colonnes restent à la largeur minimale 56px", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(360, 800));
      render(<ChildTimetableScreen />);
      goToWeekView();

      const col = screen.getByTestId("child-timetable-week-col-6");
      expect(StyleSheet.flatten(col.props.style).width).toBe(56);
    });
  });

  describe("interaction utilisateur sur tablette", () => {
    it("le clic sur un créneau fonctionne normalement sur tablette 768px", async () => {
      mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
      render(<ChildTimetableScreen />);
      goToWeekView();

      fireEvent.press(screen.getByTestId("child-timetable-week-slot-occ-mar"));

      await screen.findByText("Matiere: Anglais");
      expect(screen.getByText("Salle: B02")).toBeTruthy();
    });

    it("la navigation semaine précédente/suivante conserve les largeurs sur tablette", () => {
      mockUseWindowDimensions.mockReturnValue(screen$(768, 1024));
      render(<ChildTimetableScreen />);
      goToWeekView();

      const before = StyleSheet.flatten(
        screen.getByTestId("child-timetable-week-col-1").props.style,
      ).width as number;

      fireEvent.press(screen.getByTestId("child-timetable-nav-next"));

      const after = StyleSheet.flatten(
        screen.getByTestId("child-timetable-week-col-1").props.style,
      ).width as number;

      expect(after).toBe(before);
    });
  });
});
