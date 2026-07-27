import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AdminClassDetailScreen } from "../../src/components/classes/AdminClassDetailScreen";
import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
const mockNavigate = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    canGoBack: mockCanGoBack,
    navigate: mockNavigate,
    push: mockPush,
  }),
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
    onBack,
    backTestID,
  }: {
    title: string;
    subtitle?: string | null;
    testID?: string;
    onBack?: () => void;
    backTestID?: string;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");
    return (
      <View testID={testID}>
        <Text testID="admin-class-detail-title">{title}</Text>
        {subtitle ? (
          <Text testID="admin-class-detail-subtitle">{subtitle}</Text>
        ) : null}
        <TouchableOpacity testID={backTestID} onPress={onBack}>
          <Text>back</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock(
  "../../src/components/discipline/TeacherClassDisciplineScreen",
  () => ({
    TeacherClassDisciplineScreen: ({
      showHeader,
      extraFabActions = [],
    }: {
      showHeader?: boolean;
      extraFabActions?: Array<{
        key: string;
        testID: string;
        onPress: () => void;
      }>;
    }) => {
      const { Text, TouchableOpacity, View } = require("react-native");
      return (
        <View>
          <Text testID={`discipline-screen-showHeader-${String(showHeader)}`}>
            DisciplineScreen
          </Text>
          {extraFabActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              testID={action.testID}
              onPress={action.onPress}
            >
              <Text>{action.key}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  ClassHomeworkScreen: ({
    showHeader,
    extraFabActions = [],
  }: {
    showHeader?: boolean;
    extraFabActions?: Array<{
      key: string;
      testID: string;
      onPress: () => void;
    }>;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");
    return (
      <View>
        <Text testID={`homework-screen-showHeader-${String(showHeader)}`}>
          HomeworkScreen
        </Text>
        {extraFabActions.map((action) => (
          <TouchableOpacity
            key={action.key}
            testID={action.testID}
            onPress={action.onPress}
          >
            <Text>{action.key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

jest.mock("../../src/components/notes/ClassNotesManagerScreen", () => ({
  ClassNotesManagerScreen: ({
    showHeader,
    extraFabActions = [],
  }: {
    showHeader?: boolean;
    extraFabActions?: Array<{
      key: string;
      testID: string;
      onPress: () => void;
    }>;
  }) => {
    const { Text, TouchableOpacity, View } = require("react-native");
    return (
      <View>
        <Text testID={`notes-screen-showHeader-${String(showHeader)}`}>
          NotesScreen
        </Text>
        {extraFabActions.map((action) => (
          <TouchableOpacity
            key={action.key}
            testID={action.testID}
            onPress={action.onPress}
          >
            <Text>{action.key}</Text>
          </TouchableOpacity>
        ))}
      </View>
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

  it("n'affiche plus de FAB de changement de classe (retour à la liste via la flèche du header)", () => {
    render(<AdminClassDetailScreen />);
    expect(screen.queryByTestId("class-select-modal")).toBeNull();
  });

  it("sur les onglets avec FAB propre (Discipline/Devoirs/Notes), le FAB 'voir élèves' est fusionné dans l'écran embarqué, pas dupliqué au niveau de la fiche", () => {
    render(<AdminClassDetailScreen />);
    // Discipline (tab par défaut) : le wrapper ne rend pas son propre FAB...
    expect(screen.queryByTestId("admin-class-detail-fab")).toBeNull();
    // ...mais transmet bien l'action "voir élèves" au screen embarqué
    expect(screen.getByTestId("admin-class-detail-fab-students")).toBeTruthy();
  });

  it("transmet l'action 'voir élèves' à Devoirs et Notes", () => {
    render(<AdminClassDetailScreen />);

    fireEvent.press(screen.getByTestId("admin-class-detail-tab-devoirs"));
    expect(screen.getByTestId("admin-class-detail-fab-students")).toBeTruthy();

    fireEvent.press(screen.getByTestId("admin-class-detail-tab-notes"));
    expect(screen.getByTestId("admin-class-detail-fab-students")).toBeTruthy();
  });

  it("sur les onglets sans FAB propre (Agenda/Fil), la fiche rend son propre FAB 'voir élèves'", () => {
    render(<AdminClassDetailScreen />);

    fireEvent.press(screen.getByTestId("admin-class-detail-tab-agenda"));
    expect(screen.getByTestId("admin-class-detail-fab-students")).toBeTruthy();

    fireEvent.press(screen.getByTestId("admin-class-detail-tab-fil"));
    expect(screen.getByTestId("admin-class-detail-fab-students")).toBeTruthy();
  });

  it("le FAB 'voir élèves' navigue vers l'écran des élèves de la classe", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-tab-fil"));
    fireEvent.press(screen.getByTestId("admin-class-detail-fab-students"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/admin-classes/[classId]/students",
      params: { classId: "class-1" },
    });
  });

  it("la flèche du header revient à l'écran précédent (liste des classes)", () => {
    render(<AdminClassDetailScreen />);
    fireEvent.press(screen.getByTestId("admin-class-detail-back"));
    expect(mockBack).toHaveBeenCalled();
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
