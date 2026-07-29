import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { CreateClassScreen } from "../../src/components/classes/CreateClassScreen";
import { classroomsApi } from "../../src/api/classrooms.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { teachersApi } from "../../src/api/teachers.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/classrooms.api");
jest.mock("../../src/api/curriculums.api");
jest.mock("../../src/api/teachers.api");

const mockBack = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: mockCanGoBack,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
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
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;

const LEVEL_6E = { id: "lvl-6e", code: "6E", label: "6e" };
const LEVEL_5E = { id: "lvl-5e", code: "5E", label: "5e" };
const TRACK_A = { id: "track-a", code: "A", label: "Filière A" };
const CURRICULUM_6E = {
  id: "curr-6e",
  name: "Tronc commun",
  academicLevelId: "lvl-6e",
  trackId: null,
  academicLevel: LEVEL_6E,
  track: null,
  _count: { classes: 0, subjects: 0 },
};
const CURRICULUM_5E = {
  id: "curr-5e",
  name: "Tronc commun",
  academicLevelId: "lvl-5e",
  trackId: null,
  academicLevel: LEVEL_5E,
  track: null,
  _count: { classes: 0, subjects: 0 },
};
const TEACHER_1 = {
  userId: "teacher-1",
  firstName: "Amina",
  lastName: "Fouda",
  email: "amina@example.com",
};

beforeEach(() => {
  jest.clearAllMocks();
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([LEVEL_6E, LEVEL_5E]);
  curriculumsApiMock.listTracks.mockResolvedValue([TRACK_A]);
  curriculumsApiMock.listCurriculums.mockResolvedValue([
    CURRICULUM_6E,
    CURRICULUM_5E,
  ]);
  teachersApiMock.listTeachers.mockResolvedValue([TEACHER_1]);
  classroomsApiMock.createClassroom.mockResolvedValue({
    id: "class-new",
    name: "6e A",
    capacity: 30,
    schoolYear: { id: "sy-1", label: "2025-2026" },
    academicLevel: LEVEL_6E,
    track: null,
    curriculum: { id: "curr-6e", name: "Tronc commun" },
    referentTeacher: null,
  });
});

describe("CreateClassScreen — chargement des options", () => {
  it("charge niveaux/filières/curriculums/enseignants au montage", async () => {
    render(<CreateClassScreen />);
    await waitFor(() =>
      expect(curriculumsApiMock.listAcademicLevels).toHaveBeenCalledWith(
        "college-vogt",
      ),
    );
    expect(curriculumsApiMock.listTracks).toHaveBeenCalledWith("college-vogt");
    expect(curriculumsApiMock.listCurriculums).toHaveBeenCalledWith(
      "college-vogt",
    );
    expect(teachersApiMock.listTeachers).toHaveBeenCalledWith("college-vogt");
  });

  it("affiche le hero de création", async () => {
    render(<CreateClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("create-class-form-hero")).toBeTruthy(),
    );
  });

  it("affiche une erreur si le chargement des options échoue", async () => {
    curriculumsApiMock.listAcademicLevels.mockRejectedValueOnce(
      new Error("Erreur réseau"),
    );
    render(<CreateClassScreen />);
    await waitFor(() => expect(screen.getByText("Erreur réseau")).toBeTruthy());
  });
});

describe("CreateClassScreen — validation", () => {
  it("affiche une erreur si le nom est vide au submit", async () => {
    render(<CreateClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("create-class-form-hero")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("create-class-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("create-class-name-error")).toBeTruthy(),
    );
    expect(classroomsApiMock.createClassroom).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le curriculum n'est pas choisi", async () => {
    render(<CreateClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("create-class-form-hero")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("create-class-name"), "6e A");
    fireEvent.press(screen.getByTestId("create-class-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("create-class-curriculum-error")).toBeTruthy(),
    );
    expect(classroomsApiMock.createClassroom).not.toHaveBeenCalled();
  });

  it("rejette une capacité non numérique", async () => {
    render(<CreateClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("create-class-form-hero")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId("create-class-name"), "6e A");
    fireEvent.changeText(screen.getByTestId("create-class-capacity"), "abc");
    fireEvent.press(screen.getByTestId("create-class-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("create-class-capacity-error")).toBeTruthy(),
    );
    expect(classroomsApiMock.createClassroom).not.toHaveBeenCalled();
  });
});

describe("CreateClassScreen — soumission", () => {
  async function fillMinimalValidForm() {
    await waitFor(() =>
      expect(screen.getByTestId("create-class-form-hero")).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByTestId("create-class-name"), "6e A");
    fireEvent.press(screen.getByTestId("create-class-curriculum"));
    fireEvent.press(screen.getByText(/Tronc commun — 6e/));
  }

  it("appelle createClassroom avec le payload attendu", async () => {
    render(<CreateClassScreen />);
    await fillMinimalValidForm();

    fireEvent.press(screen.getByTestId("create-class-submit"));

    await waitFor(() =>
      expect(classroomsApiMock.createClassroom).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          name: "6e A",
          curriculumId: "curr-6e",
        }),
      ),
    );
  });

  it("affiche le toast succès et revient en arrière après succès", async () => {
    render(<CreateClassScreen />);
    await fillMinimalValidForm();

    fireEvent.press(screen.getByTestId("create-class-submit"));

    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche le toast erreur et reste sur le formulaire si l'API échoue", async () => {
    classroomsApiMock.createClassroom.mockRejectedValueOnce(
      new Error("Nom déjà utilisé"),
    );
    render(<CreateClassScreen />);
    await fillMinimalValidForm();

    fireEvent.press(screen.getByTestId("create-class-submit"));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Nom déjà utilisé" }),
      ),
    );
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.getByTestId("create-class-form-hero")).toBeTruthy();
  });

  it("envoie capacity/level/track/referent uniquement si renseignés", async () => {
    render(<CreateClassScreen />);
    await fillMinimalValidForm();
    fireEvent.changeText(screen.getByTestId("create-class-capacity"), "30");

    fireEvent.press(screen.getByTestId("create-class-submit"));

    await waitFor(() =>
      expect(classroomsApiMock.createClassroom).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          capacity: 30,
          academicLevelId: undefined,
          trackId: undefined,
          referentTeacherUserId: undefined,
        }),
      ),
    );
  });
});

describe("CreateClassScreen — annulation / retour", () => {
  it("le bouton Annuler ne déclenche pas d'appel API", async () => {
    render(<CreateClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("create-class-form-hero")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("create-class-cancel"));
    expect(classroomsApiMock.createClassroom).not.toHaveBeenCalled();
  });

  it("la flèche du header revient en arrière", async () => {
    render(<CreateClassScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("create-class-header")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("create-class-header"));
    expect(mockBack).toHaveBeenCalled();
  });
});
