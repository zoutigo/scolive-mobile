import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AddStudentToClassScreen } from "../../src/components/classes/AddStudentToClassScreen";
import { familyApi } from "../../src/api/family.api";
import { classroomsApi } from "../../src/api/classrooms.api";
import type { AdminStudentRow } from "../../src/api/family.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/family.api");
jest.mock("../../src/api/classrooms.api");

const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
}));

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: (selector: unknown) => {
    const state = { showSuccess: mockShowSuccess, showError: mockShowError };
    return typeof selector === "function" ? selector(state) : state;
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

const familyApiMock = familyApi as jest.Mocked<typeof familyApi>;
const classroomsApiMock = classroomsApi as jest.Mocked<typeof classroomsApi>;

const STUDENT_1: AdminStudentRow = {
  id: "student-1",
  firstName: "Kevin",
  lastName: "Fouda",
  currentEnrollment: null,
};
const STUDENT_2: AdminStudentRow = {
  id: "student-2",
  firstName: "Lisa",
  lastName: "Mbele",
  currentEnrollment: {
    id: "enr-1",
    class: { id: "class-9", name: "5e C" },
    schoolYear: { id: "sy-1", label: "2025-2026" },
  },
};

function mockList(students: AdminStudentRow[]) {
  familyApiMock.listAdminStudents.mockResolvedValue({
    students,
    total: students.length,
    page: 1,
    hasMore: false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockList([STUDENT_1, STUDENT_2]);
  classroomsApiMock.createEnrollment.mockResolvedValue({
    id: "enr-2",
    schoolYearId: "sy-1",
    status: "ACTIVE",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    schoolYear: { id: "sy-1", label: "2025-2026" },
    class: { id: "class-1", name: "6e A" },
  });
});

describe("AddStudentToClassScreen — chargement", () => {
  it("charge la liste des élèves de l'école au montage", async () => {
    render(<AddStudentToClassScreen />);
    await waitFor(() =>
      expect(familyApiMock.listAdminStudents).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ page: 1, limit: 20 }),
      ),
    );
  });

  it("affiche les élèves avec leur classe actuelle si inscrits ailleurs", async () => {
    render(<AddStudentToClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("add-student-row-student-1")).toBeTruthy(),
    );
    expect(screen.getByText("Kevin Fouda")).toBeTruthy();
    expect(screen.getByText("Lisa Mbele")).toBeTruthy();
    expect(screen.getByText("5e C")).toBeTruthy();
  });

  it("affiche l'état vide sans résultat", async () => {
    mockList([]);
    render(<AddStudentToClassScreen />);
    await waitFor(() => expect(screen.getByText("Aucun élève")).toBeTruthy());
  });
});

describe("AddStudentToClassScreen — recherche live", () => {
  it("relance listAdminStudents avec search après le debounce", async () => {
    render(<AddStudentToClassScreen />);
    await waitFor(() =>
      expect(familyApiMock.listAdminStudents).toHaveBeenCalledTimes(1),
    );

    fireEvent.changeText(
      screen.getByTestId("add-student-search-input"),
      "Kevin",
    );
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() =>
      expect(familyApiMock.listAdminStudents).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ search: "Kevin", page: 1 }),
      ),
    );
  });
});

describe("AddStudentToClassScreen — ajout d'un élève", () => {
  it("appelle createEnrollment avec le classId courant au tap sur un élève", async () => {
    render(<AddStudentToClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("add-student-row-student-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("add-student-row-student-1"));

    await waitFor(() =>
      expect(classroomsApiMock.createEnrollment).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        { classId: "class-1" },
      ),
    );
  });

  it("affiche le toast succès et revient en arrière après ajout", async () => {
    render(<AddStudentToClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("add-student-row-student-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("add-student-row-student-1"));

    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche le toast erreur et reste sur l'écran si l'API échoue", async () => {
    classroomsApiMock.createEnrollment.mockRejectedValueOnce(
      new Error("Classe complète"),
    );
    render(<AddStudentToClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("add-student-row-student-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("add-student-row-student-1"));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Classe complète" }),
      ),
    );
    expect(mockBack).not.toHaveBeenCalled();
  });
});
