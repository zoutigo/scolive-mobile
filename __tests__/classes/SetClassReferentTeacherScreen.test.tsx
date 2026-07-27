import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SetClassReferentTeacherScreen } from "../../src/components/classes/SetClassReferentTeacherScreen";
import { classroomsApi } from "../../src/api/classrooms.api";
import { teachersApi } from "../../src/api/teachers.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/classrooms.api");
jest.mock("../../src/api/teachers.api");

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
  ModuleHeader: ({
    title,
    onBack,
    testID,
    backTestID,
  }: {
    title: string;
    onBack: () => void;
    testID?: string;
    backTestID?: string;
  }) => {
    const { Text, TouchableOpacity } = require("react-native");
    return (
      <TouchableOpacity testID={testID} onPress={onBack}>
        <Text testID={backTestID}>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

const classroomsApiMock = classroomsApi as jest.Mocked<typeof classroomsApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;

const TEACHER_1 = {
  userId: "teacher-1",
  firstName: "Amina",
  lastName: "Fouda",
  email: "amina@example.com",
};
const TEACHER_2 = {
  userId: "teacher-2",
  firstName: "Lionel",
  lastName: "Ateba",
  email: "lionel@example.com",
};

beforeEach(() => {
  jest.clearAllMocks();
  classroomsApiMock.getClassroom.mockResolvedValue({
    id: "class-1",
    name: "6e A",
    capacity: 30,
    schoolYear: { id: "sy-1", label: "2025-2026" },
    academicLevel: null,
    track: null,
    curriculum: null,
    referentTeacher: null,
  });
  teachersApiMock.listTeachers.mockResolvedValue([TEACHER_1, TEACHER_2]);
  classroomsApiMock.updateClassroom.mockResolvedValue({
    id: "class-1",
    name: "6e A",
    capacity: 30,
    schoolYear: { id: "sy-1", label: "2025-2026" },
    academicLevel: null,
    track: null,
    curriculum: null,
    referentTeacher: {
      id: TEACHER_1.userId,
      firstName: TEACHER_1.firstName,
      lastName: TEACHER_1.lastName,
      email: TEACHER_1.email,
    },
  });
});

describe("SetClassReferentTeacherScreen — chargement", () => {
  it("charge la classe et la liste des enseignants au montage", async () => {
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(classroomsApiMock.getClassroom).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
      ),
    );
    expect(teachersApiMock.listTeachers).toHaveBeenCalledWith(
      "college-vogt",
    );
  });

  it("affiche une erreur si le chargement échoue", async () => {
    classroomsApiMock.getClassroom.mockRejectedValueOnce(
      new Error("Erreur réseau"),
    );
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(screen.getByText("Erreur réseau")).toBeTruthy(),
    );
  });

  it("pré-sélectionne l'enseignant référent actuel de la classe", async () => {
    classroomsApiMock.getClassroom.mockResolvedValueOnce({
      id: "class-1",
      name: "6e A",
      capacity: 30,
      schoolYear: { id: "sy-1", label: "2025-2026" },
      academicLevel: null,
      track: null,
      curriculum: null,
      referentTeacher: {
        id: TEACHER_2.userId,
        firstName: TEACHER_2.firstName,
        lastName: TEACHER_2.lastName,
        email: TEACHER_2.email,
      },
    });
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(screen.getByText("Lionel Ateba")).toBeTruthy(),
    );
  });
});

describe("SetClassReferentTeacherScreen — validation et soumission", () => {
  it("affiche une erreur si aucun enseignant n'est choisi", async () => {
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("set-referent-form-hero")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("set-referent-submit"));
    await waitFor(() =>
      expect(screen.getByTestId("set-referent-teacher-error")).toBeTruthy(),
    );
    expect(classroomsApiMock.updateClassroom).not.toHaveBeenCalled();
  });

  it("appelle updateClassroom avec l'enseignant choisi et affiche le succès", async () => {
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("set-referent-form-hero")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("set-referent-teacher"));
    fireEvent.press(screen.getByText("Amina Fouda"));
    fireEvent.press(screen.getByTestId("set-referent-submit"));

    await waitFor(() =>
      expect(classroomsApiMock.updateClassroom).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        { referentTeacherUserId: "teacher-1" },
      ),
    );
    expect(mockShowSuccess).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche le toast erreur et reste sur le formulaire si l'API échoue", async () => {
    classroomsApiMock.updateClassroom.mockRejectedValueOnce(
      new Error("Erreur serveur"),
    );
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("set-referent-form-hero")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("set-referent-teacher"));
    fireEvent.press(screen.getByText("Amina Fouda"));
    fireEvent.press(screen.getByTestId("set-referent-submit"));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Erreur serveur" }),
      ),
    );
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe("SetClassReferentTeacherScreen — annulation / retour", () => {
  it("Annuler ne déclenche pas d'appel API", async () => {
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("set-referent-form-hero")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("set-referent-cancel"));
    expect(classroomsApiMock.updateClassroom).not.toHaveBeenCalled();
  });

  it("la flèche du header revient en arrière", async () => {
    render(<SetClassReferentTeacherScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("set-referent-header")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("set-referent-header"));
    expect(mockBack).toHaveBeenCalled();
  });
});
