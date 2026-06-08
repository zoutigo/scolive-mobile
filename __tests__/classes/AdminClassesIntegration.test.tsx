/**
 * Tests d'intégration — flux école admin → classes.
 *
 * Vérifie :
 * - nav-config : SCHOOL_NAV route classes = /admin-classes (non-placeholder)
 * - showHeader=false passe bien à chaque écran embarqué
 * - AdminClassDetailScreen + ClassSelectModal travaillent ensemble
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { buildDrawerNavigationConfig } from "../../src/components/navigation/nav-config";
import { AdminClassDetailScreen } from "../../src/components/classes/AdminClassDetailScreen";
import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";

// ─── Mocks communs ────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Valery",
      lastName: "Mbele",
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
      schoolName: "Collège Vogt",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
    },
  }),
}));

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
}));

jest.mock("../../src/components/navigation/ModuleHeader", () => ({
  ModuleHeader: ({
    title,
    subtitle,
    testID,
  }: {
    title: string;
    subtitle?: string | null;
    testID?: string;
  }) => {
    const { Text, View } = require("react-native");
    return (
      <View testID={testID}>
        <Text testID="header-title">{title}</Text>
        {subtitle ? <Text testID="header-subtitle">{subtitle}</Text> : null}
      </View>
    );
  },
}));

// Stub minimal pour chaque screen embarqué
jest.mock(
  "../../src/components/discipline/TeacherClassDisciplineScreen",
  () => ({
    TeacherClassDisciplineScreen: ({
      showHeader,
    }: {
      showHeader?: boolean;
    }) => {
      const { Text } = require("react-native");
      return (
        <Text testID={`disc-header-${String(showHeader)}`}>Discipline</Text>
      );
    },
  }),
);
jest.mock("../../src/components/timetable/TeacherAgendaScreen", () => ({
  TeacherAgendaScreenInner: () => {
    const { Text } = require("react-native");
    return <Text>Agenda</Text>;
  },
}));
jest.mock("../../src/components/homework/ClassHomeworkScreen", () => ({
  ClassHomeworkScreen: ({ showHeader }: { showHeader?: boolean }) => {
    const { Text } = require("react-native");
    return <Text testID={`hw-header-${String(showHeader)}`}>Devoirs</Text>;
  },
}));
jest.mock("../../src/components/notes/ClassNotesManagerScreen", () => ({
  ClassNotesManagerScreen: ({ showHeader }: { showHeader?: boolean }) => {
    const { Text } = require("react-native");
    return <Text testID={`notes-header-${String(showHeader)}`}>Notes</Text>;
  },
}));
jest.mock("../../src/components/feed/TeacherClassFeedScreen", () => ({
  TeacherClassFeedScreen: ({ showHeader }: { showHeader?: boolean }) => {
    const { Text } = require("react-native");
    return <Text testID={`feed-header-${String(showHeader)}`}>Fil</Text>;
  },
}));

// ─── Données de test ──────────────────────────────────────────────────────────

const classOptions = {
  schoolYears: [{ id: "sy-1", label: "2025-2026", isActive: true }],
  selectedSchoolYearId: "sy-1",
  classes: [
    {
      classId: "class-1",
      className: "6e A",
      schoolYearId: "sy-1",
      schoolYearLabel: "2025-2026",
      subjects: [],
      studentCount: 28,
    },
    {
      classId: "class-2",
      className: "5e B",
      schoolYearId: "sy-1",
      schoolYearLabel: "2025-2026",
      subjects: [],
      studentCount: 30,
    },
  ],
};

const schoolAdminUser = {
  id: "admin-1",
  firstName: "Valery",
  lastName: "Mbele",
  platformRoles: [] as never[],
  memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" as const }],
  profileCompleted: true,
  role: "SCHOOL_ADMIN" as const,
  activeRole: "SCHOOL_ADMIN" as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  useTeacherClassNavStore.setState({
    classOptions,
    isLoadingClassOptions: false,
    errorMessage: null,
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Intégration — nav-config SCHOOL_NAV", () => {
  it("SCHOOL_NAV contient la route /admin-classes pour la clé 'classes'", () => {
    const { navItems } = buildDrawerNavigationConfig({
      user: schoolAdminUser,
      familyChildren: [],
      teacherClasses: [],
    });

    const classItem = navItems.find((item) => item.key === "classes");
    expect(classItem).toBeDefined();
    expect(classItem?.route).toBe("/admin-classes");
    expect(classItem?.route).not.toBe("/placeholder");
  });
});

describe("Intégration — flux de sélection de classe dans AdminClassDetailScreen", () => {
  it("le flux FAB → modal → sélection → router.replace fonctionne de bout en bout", async () => {
    render(<AdminClassDetailScreen />);

    // Header affiché avec le bon nom de classe
    expect(screen.getByText("Classes")).toBeTruthy();
    expect(screen.getByText("6e A")).toBeTruthy();

    // Onglet Discipline visible par défaut avec showHeader=false
    expect(screen.getByTestId("disc-header-false")).toBeTruthy();

    // On ouvre la modale via le FAB
    fireEvent.press(screen.getByTestId("admin-class-detail-fab"));
    expect(screen.getByText("Choisir une classe")).toBeTruthy();
    expect(screen.getByText("5e B")).toBeTruthy();

    // On sélectionne une autre classe
    fireEvent.press(screen.getByTestId("class-select-item-class-2"));

    // router.replace appelé avec le bon classId
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/(home)/admin-classes/[classId]",
        params: { classId: "class-2" },
      });
    });
  });

  it("chaque écran embarqué reçoit showHeader=false", () => {
    render(<AdminClassDetailScreen />);

    // Discipline (tab actif par défaut)
    expect(screen.getByTestId("disc-header-false")).toBeTruthy();

    // Homework
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-devoirs"));
    expect(screen.getByTestId("hw-header-false")).toBeTruthy();

    // Notes
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-notes"));
    expect(screen.getByTestId("notes-header-false")).toBeTruthy();

    // Fil
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-fil"));
    expect(screen.getByTestId("feed-header-false")).toBeTruthy();
  });
});
