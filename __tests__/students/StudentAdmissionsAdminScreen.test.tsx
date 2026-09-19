import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { StudentAdmissionsAdminScreen } from "../../src/components/students/StudentAdmissionsAdminScreen";
import { studentAdmissionsApi } from "../../src/api/student-admissions.api";
import { classroomsApi } from "../../src/api/classrooms.api";
import { teachersApi } from "../../src/api/teachers.api";
import { curriculumsApi } from "../../src/api/curriculums.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import type { UnassignedPoolEntry } from "../../src/types/student-admissions.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/student-admissions.api");
jest.mock("../../src/api/classrooms.api");
jest.mock("../../src/api/teachers.api");
jest.mock("../../src/api/curriculums.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/DatePickerField", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    DatePickerField: ({
      value,
      onChange,
      testID,
    }: {
      value: string;
      onChange: (v: string) => void;
      testID?: string;
    }) => (
      <TouchableOpacity testID={testID} onPress={() => onChange("2016-03-10")}>
        <Text>{value || "date-vide"}</Text>
      </TouchableOpacity>
    ),
  };
});

const studentAdmissionsApiMock = studentAdmissionsApi as jest.Mocked<
  typeof studentAdmissionsApi
>;
const classroomsApiMock = classroomsApi as jest.Mocked<typeof classroomsApi>;
const teachersApiMock = teachersApi as jest.Mocked<typeof teachersApi>;
const curriculumsApiMock = curriculumsApi as jest.Mocked<typeof curriculumsApi>;

const POOL_ENTRY: UnassignedPoolEntry = {
  id: "enr-1",
  studentId: "student-1",
  confirmedAt: "2026-09-10T00:00:00.000Z",
  confirmationSource: "PAYMENT_THRESHOLD",
  student: { id: "student-1", firstName: "Awa", lastName: "Njoya" },
  academicLevel: { id: "level-1", label: "CE2", code: "CE2" },
  track: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Valery",
      lastName: "Mbele",
      onboardingHelpEnabled: false,
      activeRole: "SCHOOL_ADMIN",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
    },
  } as never);

  studentAdmissionsApiMock.listUnassignedPool.mockResolvedValue([POOL_ENTRY]);
  studentAdmissionsApiMock.createAdmission.mockResolvedValue({
    student: { id: "student-new", firstName: "Fouda", lastName: "Kevin" },
    admission: {
      id: "admission-1",
      schoolYearId: "sy-1",
      academicLevelId: "level-1",
      trackId: null,
    },
  });
  classroomsApiMock.createEnrollment.mockResolvedValue({
    id: "enr-assigned-1",
    schoolYearId: "sy-1",
    status: "ACTIVE",
    createdAt: "",
    updatedAt: "",
    schoolYear: { id: "sy-1", label: "2026-2027" },
    class: { id: "class-1", name: "6eB" },
  });
  teachersApiMock.listClassrooms.mockResolvedValue([
    {
      id: "class-1",
      name: "6eB",
      schoolYear: { id: "sy-1", label: "2026-2027" },
    } as never,
  ]);
  teachersApiMock.listSchoolYears.mockResolvedValue([
    { id: "sy-1", label: "2026-2027", isActive: true },
  ]);
  curriculumsApiMock.listAcademicLevels.mockResolvedValue([
    { id: "level-1", code: "CE2", label: "CE2" },
  ]);
  curriculumsApiMock.listTracks.mockResolvedValue([]);
});

describe("StudentAdmissionsAdminScreen", () => {
  it("charge et affiche le pool d'eleves en attente d'affectation", async () => {
    render(<StudentAdmissionsAdminScreen />);
    expect(
      await screen.findByTestId("admission-pool-student-1"),
    ).toBeOnTheScreen();
  });

  it("affiche un etat verrouille pour un role non autorise", async () => {
    useAuthStore.setState({
      schoolSlug: "college-vogt",
      user: {
        id: "teacher-1",
        firstName: "Awa",
        lastName: "Ekwalla",
        onboardingHelpEnabled: false,
        activeRole: "TEACHER",
        platformRoles: [],
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
        profileCompleted: true,
      },
    } as never);

    render(<StudentAdmissionsAdminScreen />);

    expect(
      await screen.findByText("Module réservé au personnel administratif"),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId("admissions-fab")).not.toBeOnTheScreen();
  });

  it("ouvre le formulaire via le FAB et revient a la liste apres Annuler", async () => {
    render(<StudentAdmissionsAdminScreen />);
    await screen.findByTestId("admission-pool-student-1");

    fireEvent.press(screen.getByTestId("admissions-fab"));
    expect(await screen.findByTestId("admission-form-tab")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("admission-form-cancel"));
    await waitFor(() =>
      expect(screen.getByTestId("admissions-fab")).toBeOnTheScreen(),
    );
  });

  it("cree une admission avec prenom, nom et niveau", async () => {
    render(<StudentAdmissionsAdminScreen />);
    await screen.findByTestId("admission-pool-student-1");

    fireEvent.press(screen.getByTestId("admissions-fab"));
    await screen.findByTestId("admission-form-tab");

    fireEvent.changeText(
      screen.getByTestId("admission-form-first-name"),
      "Fouda",
    );
    fireEvent.changeText(
      screen.getByTestId("admission-form-last-name"),
      "Kevin",
    );
    fireEvent.press(screen.getByTestId("admission-form-level"));
    fireEvent.press(screen.getByTestId("admission-form-level-option-level-1"));

    fireEvent.press(screen.getByTestId("admission-form-submit"));

    await waitFor(() =>
      expect(studentAdmissionsApiMock.createAdmission).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          firstName: "Fouda",
          lastName: "Kevin",
          academicLevelId: "level-1",
        }),
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Admission enregistrée.",
      ),
    );
  });

  it("bloque l'envoi tant que le niveau n'est pas renseigne", async () => {
    render(<StudentAdmissionsAdminScreen />);
    await screen.findByTestId("admission-pool-student-1");

    fireEvent.press(screen.getByTestId("admissions-fab"));
    await screen.findByTestId("admission-form-tab");

    fireEvent.changeText(
      screen.getByTestId("admission-form-first-name"),
      "Fouda",
    );
    fireEvent.changeText(
      screen.getByTestId("admission-form-last-name"),
      "Kevin",
    );
    fireEvent.press(screen.getByTestId("admission-form-submit"));

    expect(studentAdmissionsApiMock.createAdmission).not.toHaveBeenCalled();
  });

  it("affecte un eleve du pool a une classe", async () => {
    render(<StudentAdmissionsAdminScreen />);
    await screen.findByTestId("admission-pool-student-1");

    fireEvent.press(screen.getByTestId("admission-pool-student-1-assign"));
    fireEvent.press(
      screen.getByTestId("admission-pool-student-1-class-select"),
    );
    fireEvent.press(
      screen.getByTestId(
        "admission-pool-student-1-class-select-option-class-1",
      ),
    );
    fireEvent.press(screen.getByTestId("admission-pool-student-1-confirm"));

    await waitFor(() =>
      expect(classroomsApiMock.createEnrollment).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        { classId: "class-1", status: "ACTIVE" },
      ),
    );
    await waitFor(() =>
      expect(useSuccessToastStore.getState().title).toBe(
        "Élève affecté à la classe.",
      ),
    );
  });
});
