import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ClassStudentsScreen } from "../../src/components/classes/ClassStudentsScreen";
import { classroomsApi } from "../../src/api/classrooms.api";
import { familyApi } from "../../src/api/family.api";
import type { AdminStudentRow } from "../../src/api/family.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/classrooms.api");
jest.mock("../../src/api/family.api");

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
let latestFocusCallback: (() => void) | null = null;
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    canGoBack: mockCanGoBack,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      latestFocusCallback = callback;
      callback();
    }, [callback]);
  },
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({ schoolSlug: "college-vogt" }),
}));

jest.mock("../../src/components/navigation/ModuleHeader", () => ({
  ModuleHeader: ({ title, testID }: { title: string; testID?: string }) => {
    const { Text } = require("react-native");
    return <Text testID={testID}>{title}</Text>;
  },
}));

const classroomsApiMock = classroomsApi as jest.Mocked<typeof classroomsApi>;
const familyApiMock = familyApi as jest.Mocked<typeof familyApi>;

const CLASSROOM = {
  id: "class-1",
  name: "6e A",
  capacity: 30,
  schoolYear: { id: "sy-1", label: "2025-2026" },
  academicLevel: null,
  track: null,
  curriculum: null,
  referentTeacher: {
    id: "teacher-1",
    firstName: "Amina",
    lastName: "Fouda",
    email: null,
  },
  _count: { enrollments: 24 },
};

const STUDENT_1: AdminStudentRow = {
  id: "student-1",
  firstName: "Kevin",
  lastName: "Fouda",
  currentEnrollment: null,
};

function mockStudents(students: AdminStudentRow[]) {
  familyApiMock.listAdminStudents.mockResolvedValue({
    students,
    total: students.length,
    page: 1,
    hasMore: false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  classroomsApiMock.getClassroom.mockResolvedValue(CLASSROOM);
  mockStudents([STUDENT_1]);
});

describe("ClassStudentsScreen — chargement", () => {
  it("charge la classe et ses élèves actifs au montage", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(classroomsApiMock.getClassroom).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
      ),
    );
    expect(familyApiMock.listAdminStudents).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ classId: "class-1", status: "ACTIVE" }),
    );
  });

  it("affiche le hero avec nom de classe, enseignant référent et effectif/capacité", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("class-students-hero")).toBeTruthy(),
    );
    expect(screen.getByText("6e A")).toBeTruthy();
    expect(screen.getByText("Amina Fouda")).toBeTruthy();
    expect(screen.getByText("24/30 élèves")).toBeTruthy();
  });

  it("affiche 'Aucun enseignant référent' quand la classe n'en a pas", async () => {
    classroomsApiMock.getClassroom.mockResolvedValueOnce({
      ...CLASSROOM,
      referentTeacher: null,
    });
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByText("Aucun enseignant référent")).toBeTruthy(),
    );
  });

  it("affiche la liste des élèves", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("class-students-row-student-1")).toBeTruthy(),
    );
    expect(screen.getByText("Kevin Fouda")).toBeTruthy();
  });

  it("affiche l'état vide si la classe n'a aucun élève", async () => {
    mockStudents([]);
    render(<ClassStudentsScreen />);
    await waitFor(() => expect(screen.getByText("Aucun élève")).toBeTruthy());
  });

  it("affiche une erreur si le chargement échoue", async () => {
    classroomsApiMock.getClassroom.mockRejectedValueOnce(
      new Error("Erreur réseau"),
    );
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByText("Erreur réseau")).toBeTruthy(),
    );
  });
});

describe("ClassStudentsScreen — FAB actions", () => {
  it("rend un seul FAB '⋮' regroupant les deux actions (jamais deux FAB superposés)", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("class-students-fab")).toBeTruthy(),
    );
    expect(screen.queryByTestId("class-students-fab-add")).toBeNull();
    expect(screen.queryByTestId("class-students-fab-referent")).toBeNull();
  });

  it("déplie le menu avec 'Ajouter un élève' et 'Enseignant référent'", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("class-students-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-students-fab"));
    expect(screen.getByTestId("class-students-fab-add")).toBeTruthy();
    expect(screen.getByTestId("class-students-fab-referent")).toBeTruthy();
  });

  it("navigue vers l'écran d'ajout d'élève", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("class-students-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-students-fab"));
    fireEvent.press(screen.getByTestId("class-students-fab-add"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/admin-classes/[classId]/students/add",
      params: { classId: "class-1" },
    });
  });

  it("navigue vers l'écran de définition de l'enseignant référent", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("class-students-fab")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("class-students-fab"));
    fireEvent.press(screen.getByTestId("class-students-fab-referent"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/admin-classes/[classId]/students/referent",
      params: { classId: "class-1" },
    });
  });
});

describe("ClassStudentsScreen — rafraîchissement au focus", () => {
  it("recharge la classe et les élèves quand l'écran regagne le focus", async () => {
    render(<ClassStudentsScreen />);
    await waitFor(() =>
      expect(classroomsApiMock.getClassroom).toHaveBeenCalledTimes(1),
    );

    latestFocusCallback?.();

    await waitFor(() =>
      expect(classroomsApiMock.getClassroom).toHaveBeenCalledTimes(2),
    );
  });
});
