import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { ChildTimetableScreen } from "../../src/components/timetable/ChildTimetableScreen";
import { TimetableClassesScreen } from "../../src/components/timetable/TimetableClassesScreen";
import {
  TeacherAgendaScreen,
  TeacherAgendaScreenInner,
} from "../../src/components/timetable/TeacherAgendaScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useTimetableStore } from "../../src/store/timetable.store";
import { useLocaleStore } from "../../src/store/locale.store";
import { DEFAULT_LOCALE, translations } from "../../src/i18n/translations";
import { translate } from "../../src/i18n/useTranslation";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockLoadMyTimetable = jest.fn();
const mockLoadClassOptions = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => ({ childId: "stu-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(() => ({
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  })),
}));

jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({
    openDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest
    .fn()
    .mockReturnValue({ width: 360, height: 800, scale: 2, fontScale: 1 }),
}));

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-04-14T12:00:00Z"));
});

afterAll(() => {
  jest.useRealTimers();
});

afterEach(() => {
  useLocaleStore.setState({ locale: DEFAULT_LOCALE });
});

beforeEach(() => {
  jest.clearAllMocks();

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
      occurrences: [],
      calendarEvents: [],
      subjectStyles: [],
    },
    classOptions: {
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      classes: [
        {
          classId: "class-1",
          className: "6e A",
          schoolYearId: "sy1",
          schoolYearLabel: "2025-2026",
          subjects: [{ id: "math", name: "Maths" }],
          studentCount: 18,
        },
      ],
    },
    isLoadingMyTimetable: false,
    isLoadingClassOptions: false,
    errorMessage: null,
    loadMyTimetable: mockLoadMyTimetable,
    loadClassOptions: mockLoadClassOptions,
    clearError: jest.fn(),
  } as never);
});

describe("Agenda/Emploi du temps — traduction selon la locale (mobile)", () => {
  it("a un namespace timetable.* avec des clés fr/en alignées et non vides", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("timetable."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("timetable."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });

  describe("ChildTimetableScreen", () => {
    it("affiche les libellés en français par défaut", () => {
      render(<ChildTimetableScreen />);

      expect(
        screen.getByText(
          translate("fr", "timetable.classManager.defaultTitle"),
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(translate("fr", "timetable.common.viewDay")),
      ).toBeTruthy();
      expect(
        screen.getByText(translate("fr", "timetable.common.viewWeek")),
      ).toBeTruthy();
      expect(
        screen.getByText(translate("fr", "timetable.common.viewMonth")),
      ).toBeTruthy();
    });

    it("affiche les libellés en anglais quand locale=en", () => {
      useLocaleStore.setState({ locale: "en" });
      render(<ChildTimetableScreen />);

      expect(
        screen.getByText(
          translate("en", "timetable.classManager.defaultTitle"),
        ),
      ).toBeTruthy();
      expect(
        screen.getByText(translate("en", "timetable.common.viewDay")),
      ).toBeTruthy();
      expect(
        screen.getByText(translate("en", "timetable.common.viewWeek")),
      ).toBeTruthy();
      expect(
        screen.getByText(translate("en", "timetable.common.viewMonth")),
      ).toBeTruthy();

      expect(
        screen.queryByText(
          translate("fr", "timetable.classManager.defaultTitle"),
        ),
      ).toBeNull();
    });
  });

  describe("TimetableClassesScreen", () => {
    it("affiche le titre 'Mes classes' en français par défaut", async () => {
      render(<TimetableClassesScreen />);

      await waitFor(() =>
        expect(
          screen.getByText(
            translate("fr", "timetable.classesScreen.headerTitle"),
          ),
        ).toBeTruthy(),
      );
      expect(
        screen.getByText(
          translate("fr", "timetable.classesScreen.schoolYear.title"),
        ),
      ).toBeTruthy();
    });

    it("affiche le titre 'My classes' en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });
      render(<TimetableClassesScreen />);

      await waitFor(() =>
        expect(
          screen.getByText(
            translate("en", "timetable.classesScreen.headerTitle"),
          ),
        ).toBeTruthy(),
      );
      expect(
        screen.getByText(
          translate("en", "timetable.classesScreen.schoolYear.title"),
        ),
      ).toBeTruthy();
      expect(
        screen.queryByText(
          translate("fr", "timetable.classesScreen.headerTitle"),
        ),
      ).toBeNull();
    });
  });

  describe("TeacherAgendaScreen", () => {
    function setupTeacher() {
      useAuthStore.setState({
        user: {
          id: "t1",
          firstName: "Albert",
          lastName: "Mvondo",
          platformRoles: [],
          memberships: [{ schoolId: "s1", role: "TEACHER" }],
          profileCompleted: true,
          role: "TEACHER",
          activeRole: "TEACHER",
          schoolName: "Collège Vogt",
        },
        schoolSlug: "college-vogt",
        accessToken: "token",
        isAuthenticated: true,
        isLoading: false,
        authErrorMessage: null,
      } as never);

      useTimetableStore.setState({
        myTimetable: null,
        classTimetable: {
          class: { id: "class-1", schoolYearId: "sy1", academicLevelId: null },
          slots: [],
          oneOffSlots: [],
          slotExceptions: [],
          occurrences: [],
          calendarEvents: [],
          subjectStyles: [],
        },
        classOptions: {
          selectedSchoolYearId: "sy1",
          schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
          classes: [
            {
              classId: "class-1",
              className: "6e A",
              schoolYearId: "sy1",
              schoolYearLabel: "2025-2026",
              studentCount: 20,
              subjects: [{ id: "math", name: "Maths" }],
            },
          ],
        },
        isLoadingMyTimetable: false,
        isLoadingClassOptions: false,
        isLoadingClassTimetable: false,
        isLoadingClassContext: false,
        isSubmitting: false,
        classContext: null,
        errorMessage: null,
        loadClassOptions: mockLoadClassOptions.mockResolvedValue({
          selectedSchoolYearId: "sy1",
          schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
          classes: [
            {
              classId: "class-1",
              className: "6e A",
              schoolYearId: "sy1",
              schoolYearLabel: "2025-2026",
              studentCount: 20,
              subjects: [{ id: "math", name: "Maths" }],
            },
          ],
        }),
        loadClassTimetable: jest.fn().mockResolvedValue(undefined),
        clearError: jest.fn(),
      } as never);
    }

    it("affiche les onglets enseignant en français par défaut", async () => {
      setupTeacher();
      render(<TeacherAgendaScreen />);

      await waitFor(() =>
        expect(
          screen.getByText(
            translate("fr", "timetable.teacherAgenda.tabs.mine"),
          ),
        ).toBeTruthy(),
      );
      expect(
        screen.getByText(
          translate("fr", "timetable.teacherAgenda.tabs.myClasses"),
        ),
      ).toBeTruthy();
    });

    it("affiche les onglets enseignant en anglais quand locale=en", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupTeacher();
      render(<TeacherAgendaScreen />);

      await waitFor(() =>
        expect(
          screen.getByText(
            translate("en", "timetable.teacherAgenda.tabs.mine"),
          ),
        ).toBeTruthy(),
      );
      expect(
        screen.getByText(
          translate("en", "timetable.teacherAgenda.tabs.myClasses"),
        ),
      ).toBeTruthy();
      expect(
        screen.queryByText(
          translate("fr", "timetable.teacherAgenda.tabs.mine"),
        ),
      ).toBeNull();
    });

    it("affiche le titre par défaut de l'écran en anglais via TeacherAgendaScreenInner", async () => {
      useLocaleStore.setState({ locale: "en" });
      setupTeacher();
      render(<TeacherAgendaScreenInner showHeader headerTitle={undefined} />);

      await waitFor(() =>
        expect(
          screen.getByText(
            translate("en", "timetable.teacherAgenda.headerTitle"),
          ),
        ).toBeTruthy(),
      );
    });
  });
});
