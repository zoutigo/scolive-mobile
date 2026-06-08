import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AdminClassDetailScreen } from "../../src/components/classes/AdminClassDetailScreen";
import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
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
    },
  }),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
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
        <Text testID="admin-class-detail-title">{title}</Text>
        {subtitle ? (
          <Text testID="admin-class-detail-subtitle">{subtitle}</Text>
        ) : null}
      </View>
    );
  },
}));

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
        <Text testID={`discipline-screen-showHeader-${String(showHeader)}`}>
          DisciplineScreen
        </Text>
      );
    },
  }),
);

jest.mock("../../src/components/timetable/TeacherAgendaScreen", () => ({
  TeacherAgendaScreenInner: ({
    showHeader,
    lockedClassId,
  }: {
    showHeader?: boolean;
    lockedClassId?: string;
  }) => {
    const { Text } = require("react-native");
    return (
      <Text
        testID={`agenda-screen-showHeader-${String(showHeader)}-${lockedClassId}`}
      >
        AgendaScreen
      </Text>
    );
  },
}));

jest.mock("../../src/components/homework/ClassHomeworkScreen", () => ({
  ClassHomeworkScreen: ({ showHeader }: { showHeader?: boolean }) => {
    const { Text } = require("react-native");
    return (
      <Text testID={`homework-screen-showHeader-${String(showHeader)}`}>
        HomeworkScreen
      </Text>
    );
  },
}));

jest.mock("../../src/components/notes/ClassNotesManagerScreen", () => ({
  ClassNotesManagerScreen: ({ showHeader }: { showHeader?: boolean }) => {
    const { Text } = require("react-native");
    return (
      <Text testID={`notes-screen-showHeader-${String(showHeader)}`}>
        NotesScreen
      </Text>
    );
  },
}));

jest.mock("../../src/components/feed/TeacherClassFeedScreen", () => ({
  TeacherClassFeedScreen: ({ showHeader }: { showHeader?: boolean }) => {
    const { Text } = require("react-native");
    return (
      <Text testID={`feed-screen-showHeader-${String(showHeader)}`}>
        FeedScreen
      </Text>
    );
  },
}));

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

beforeEach(() => {
  jest.clearAllMocks();
  useTeacherClassNavStore.setState({
    classOptions,
    isLoadingClassOptions: false,
    errorMessage: null,
  });
});

describe("AdminClassDetailScreen", () => {
  it("affiche le header 'Classes' avec le subtitle = nom de la classe", () => {
    render(<AdminClassDetailScreen />);
    expect(screen.getByTestId("admin-class-detail-title")).toBeTruthy();
    expect(screen.getByText("Classes")).toBeTruthy();
    expect(screen.getByTestId("admin-class-detail-subtitle")).toBeTruthy();
    expect(screen.getByText("6e A")).toBeTruthy();
  });

  it("affiche les 5 onglets", () => {
    render(<AdminClassDetailScreen />);
    expect(
      screen.getByTestId("admin-class-detail-tab-discipline"),
    ).toBeTruthy();
    expect(screen.getByTestId("admin-class-detail-tab-agenda")).toBeTruthy();
    expect(screen.getByTestId("admin-class-detail-tab-devoirs")).toBeTruthy();
    expect(screen.getByTestId("admin-class-detail-tab-notes")).toBeTruthy();
    expect(screen.getByTestId("admin-class-detail-tab-fil")).toBeTruthy();
  });

  it("affiche l'écran Discipline par défaut avec showHeader=false", () => {
    render(<AdminClassDetailScreen />);
    expect(
      screen.getByTestId("discipline-screen-showHeader-false"),
    ).toBeTruthy();
  });

  it("affiche l'écran Agenda avec showHeader=false et classId en prop quand on clique sur l'onglet", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-agenda"));
    expect(
      screen.getByTestId("agenda-screen-showHeader-false-class-1"),
    ).toBeTruthy();
  });

  it("affiche l'écran Devoirs avec showHeader=false quand on clique sur l'onglet", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-devoirs"));
    expect(screen.getByTestId("homework-screen-showHeader-false")).toBeTruthy();
  });

  it("affiche l'écran Notes avec showHeader=false quand on clique sur l'onglet", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-notes"));
    expect(screen.getByTestId("notes-screen-showHeader-false")).toBeTruthy();
  });

  it("affiche l'écran Fil avec showHeader=false quand on clique sur l'onglet", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-fil"));
    expect(screen.getByTestId("feed-screen-showHeader-false")).toBeTruthy();
  });

  it("affiche le FAB pour changer de classe", () => {
    render(<AdminClassDetailScreen />);
    expect(screen.getByTestId("admin-class-detail-fab")).toBeTruthy();
  });

  it("ouvre la modale de sélection au clic sur le FAB", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-fab"));
    expect(screen.getByTestId("class-select-modal")).toBeTruthy();
    expect(screen.getByText("5e B")).toBeTruthy();
  });

  it("navigue via router.replace vers le nouveau classId après changement de classe", async () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-fab"));
    fireEvent.press(screen.getByTestId("class-select-item-class-2"));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/(home)/admin-classes/[classId]",
        params: { classId: "class-2" },
      });
    });
  });

  it("réinitialise l'onglet actif à 'discipline' après changement de classe", async () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-notes"));
    expect(screen.getByTestId("notes-screen-showHeader-false")).toBeTruthy();

    fireEvent.press(screen.getByTestId("admin-class-detail-fab"));
    fireEvent.press(screen.getByTestId("class-select-item-class-2"));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it("ferme la modale sans changer de classe au clic sur 'close'", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-fab"));
    expect(screen.getByTestId("class-select-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("class-select-close"));
    expect(screen.queryByTestId("class-select-sheet")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("affiche subtitle null si la classe n'est pas trouvée dans le store", () => {
    useTeacherClassNavStore.setState({
      classOptions: {
        schoolYears: [],
        selectedSchoolYearId: null,
        classes: [],
      },
      isLoadingClassOptions: false,
      errorMessage: null,
    });
    render(<AdminClassDetailScreen />);
    expect(screen.queryByTestId("admin-class-detail-subtitle")).toBeNull();
  });
});
