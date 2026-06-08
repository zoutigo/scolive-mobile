import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AdminClassesScreen } from "../../src/components/classes/AdminClassesScreen";
import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({}),
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

jest.mock("../../src/components/timetable/TimetableCommon", () => ({
  LoadingBlock: ({ label }: { label: string }) => {
    const { Text } = require("react-native");
    return <Text>{label}</Text>;
  },
  ErrorBanner: ({
    message,
    onDismiss,
    testID,
  }: {
    message: string;
    onDismiss?: () => void;
    testID?: string;
  }) => {
    const { Text, TouchableOpacity } = require("react-native");
    return (
      <TouchableOpacity testID={testID} onPress={onDismiss}>
        <Text>{message}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock("../../src/components/navigation/ModuleHeader", () => ({
  ModuleHeader: ({ title, testID }: { title: string; testID?: string }) => {
    const { Text } = require("react-native");
    return <Text testID={testID}>{title}</Text>;
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
    classOptions: null,
    isLoadingClassOptions: false,
    errorMessage: null,
  });
});

describe("AdminClassesScreen", () => {
  it("affiche le header 'Classes'", () => {
    useTeacherClassNavStore.setState({
      classOptions,
      isLoadingClassOptions: false,
    });
    render(<AdminClassesScreen />);
    expect(screen.getByTestId("admin-classes-header")).toBeTruthy();
  });

  it("affiche le FAB de sélection de classe", () => {
    useTeacherClassNavStore.setState({
      classOptions,
      isLoadingClassOptions: false,
    });
    render(<AdminClassesScreen />);
    expect(screen.getByTestId("admin-classes-fab")).toBeTruthy();
  });

  it("affiche l'état vide par défaut", () => {
    useTeacherClassNavStore.setState({
      classOptions,
      isLoadingClassOptions: false,
    });
    render(<AdminClassesScreen />);
    expect(screen.getByTestId("admin-classes-empty-title")).toBeTruthy();
    expect(screen.getByText("Aucune classe sélectionnée")).toBeTruthy();
  });

  it("affiche le chargement quand isLoadingClassOptions=true", () => {
    useTeacherClassNavStore.setState({
      classOptions: null,
      isLoadingClassOptions: true,
    });
    render(<AdminClassesScreen />);
    expect(screen.getByText("Chargement des classes…")).toBeTruthy();
  });

  it("affiche l'erreur quand errorMessage est défini", () => {
    useTeacherClassNavStore.setState({
      classOptions: null,
      isLoadingClassOptions: false,
      errorMessage: "Erreur de chargement",
    });
    render(<AdminClassesScreen />);
    expect(screen.getByText("Erreur de chargement")).toBeTruthy();
  });

  it("ouvre la modale au clic sur le FAB", () => {
    useTeacherClassNavStore.setState({
      classOptions,
      isLoadingClassOptions: false,
    });
    render(<AdminClassesScreen />);
    fireEvent.press(screen.getByTestId("admin-classes-fab"));
    expect(screen.getByTestId("class-select-modal")).toBeTruthy();
    expect(screen.getByText("6e A")).toBeTruthy();
    expect(screen.getByText("5e B")).toBeTruthy();
  });

  it("navigue vers [classId] après sélection d'une classe", async () => {
    useTeacherClassNavStore.setState({
      classOptions,
      isLoadingClassOptions: false,
    });
    render(<AdminClassesScreen />);
    fireEvent.press(screen.getByTestId("admin-classes-fab"));
    fireEvent.press(screen.getByTestId("class-select-item-class-1"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/(home)/admin-classes/[classId]",
        params: { classId: "class-1" },
      });
    });
  });

  it("ferme la modale au clic sur 'close'", () => {
    useTeacherClassNavStore.setState({
      classOptions,
      isLoadingClassOptions: false,
    });
    render(<AdminClassesScreen />);
    fireEvent.press(screen.getByTestId("admin-classes-fab"));
    expect(screen.getByTestId("class-select-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("class-select-close"));
    expect(screen.queryByTestId("class-select-sheet")).toBeNull();
  });

  it("charge les classes depuis le store au montage si pas encore chargées", async () => {
    const loadClassOptions = jest.fn().mockResolvedValue(classOptions);
    useTeacherClassNavStore.setState({
      classOptions: null,
      isLoadingClassOptions: false,
      loadClassOptions,
    } as never);

    render(<AdminClassesScreen />);

    await waitFor(() => {
      expect(loadClassOptions).toHaveBeenCalledWith("college-vogt");
    });
  });
});
