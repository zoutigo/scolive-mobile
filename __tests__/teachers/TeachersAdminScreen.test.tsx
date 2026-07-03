import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { teachersApi } from "../../src/api/teachers.api";
import {
  teacherAssignmentFormSchema,
  teacherCreateFormSchema,
  TeachersAdminScreen,
} from "../../src/components/teachers/TeachersAdminScreen";
import type { AuthUser } from "../../src/types/auth.types";
import type {
  TeacherAssignmentRow,
  TeacherClassroomOption,
  TeacherRow,
  TeacherSchoolYearOption,
  TeacherSubjectOption,
} from "../../src/types/teachers.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/teachers.api");

const mockBack = jest.fn();
const mockNavigate = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    navigate: mockNavigate,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockOpenDrawer = jest.fn();
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: mockOpenDrawer }),
}));

let mockAuthState: { schoolSlug: string | null; user: AuthUser | null };
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => mockAuthState,
}));

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: (selector: (state: unknown) => unknown) =>
    selector({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    }),
}));

const mockTeachersApi = teachersApi as jest.Mocked<typeof teachersApi>;

let teachersState: TeacherRow[];
let schoolYearsState: TeacherSchoolYearOption[];
let classroomsState: TeacherClassroomOption[];
let subjectsState: TeacherSubjectOption[];
let assignmentsState: TeacherAssignmentRow[];

function makeSchoolAdminUser(): AuthUser {
  return {
    id: "school-admin-1",
    firstName: "Sarah",
    lastName: "Moukouri",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
    profileCompleted: true,
    role: "SCHOOL_ADMIN",
    activeRole: "SCHOOL_ADMIN",
    schoolName: "Collège Vogt",
  };
}

function seedApiState() {
  teachersState = [
    {
      userId: "teacher-1",
      firstName: "Albert",
      lastName: "Mvondo",
      email: "albert@example.test",
      phone: null,
    },
    {
      userId: "teacher-2",
      firstName: "Laure",
      lastName: "Fotsing",
      email: null,
      phone: "237699001122",
    },
  ];
  schoolYearsState = [
    { id: "sy-1", label: "2025-2026", isActive: true },
    { id: "sy-2", label: "2024-2025", isActive: false },
  ];
  classroomsState = [
    {
      id: "class-1",
      name: "6eC",
      schoolYear: { id: "sy-1", label: "2025-2026" },
    },
    {
      id: "class-2",
      name: "5eA",
      schoolYear: { id: "sy-2", label: "2024-2025" },
    },
  ];
  subjectsState = [
    { id: "subject-1", name: "Mathématiques" },
    { id: "subject-2", name: "Physique" },
  ];
  assignmentsState = [
    {
      id: "assign-1",
      schoolYearId: "sy-1",
      teacherUserId: "teacher-1",
      classId: "class-1",
      subjectId: "subject-1",
      createdAt: "2026-05-10T08:30:00.000Z",
      schoolYear: { id: "sy-1", label: "2025-2026" },
      teacherUser: {
        id: "teacher-1",
        firstName: "Albert",
        lastName: "Mvondo",
        email: "albert@example.test",
      },
      class: { id: "class-1", name: "6eC" },
      subject: { id: "subject-1", name: "Mathématiques" },
    },
  ];
}

beforeEach(() => {
  jest.clearAllMocks();
  seedApiState();
  mockAuthState = {
    schoolSlug: "college-vogt",
    user: makeSchoolAdminUser(),
  };

  mockTeachersApi.listTeachers.mockImplementation(async () => teachersState);
  mockTeachersApi.listSchoolYears.mockImplementation(
    async () => schoolYearsState,
  );
  mockTeachersApi.listClassrooms.mockImplementation(
    async () => classroomsState,
  );
  mockTeachersApi.listSubjects.mockImplementation(async () => subjectsState);
  mockTeachersApi.listAssignments.mockImplementation(
    async () => assignmentsState,
  );
  mockTeachersApi.createTeacher.mockImplementation(async (_slug, payload) => {
    if ("phone" in payload) {
      teachersState = [
        ...teachersState,
        {
          userId: "teacher-created",
          firstName: "Enseignant",
          lastName: "1122",
          email: null,
          phone: payload.phone,
        },
      ];
    } else {
      teachersState = [
        ...teachersState,
        {
          userId: "teacher-created",
          firstName: "Prof",
          lastName: "Test",
          email: payload.email,
          phone: null,
        },
      ];
    }
    return { success: true };
  });
  mockTeachersApi.createAssignment.mockImplementation(
    async (_slug, payload) => {
      const teacher = teachersState.find(
        (entry) => entry.userId === payload.teacherUserId,
      );
      const schoolYear = schoolYearsState.find(
        (entry) => entry.id === payload.schoolYearId,
      );
      const classroom = classroomsState.find(
        (entry) => entry.id === payload.classId,
      );
      const subject = subjectsState.find(
        (entry) => entry.id === payload.subjectId,
      );
      const created: TeacherAssignmentRow = {
        id: "assign-created",
        schoolYearId: payload.schoolYearId,
        teacherUserId: payload.teacherUserId,
        classId: payload.classId,
        subjectId: payload.subjectId,
        createdAt: "2026-05-14T10:00:00.000Z",
        schoolYear: {
          id: schoolYear?.id ?? "",
          label: schoolYear?.label ?? "",
        },
        teacherUser: {
          id: teacher?.userId ?? "",
          firstName: teacher?.firstName ?? "",
          lastName: teacher?.lastName ?? "",
          email: teacher?.email ?? null,
        },
        class: { id: classroom?.id ?? "", name: classroom?.name ?? "" },
        subject: { id: subject?.id ?? "", name: subject?.name ?? "" },
      };
      assignmentsState = [...assignmentsState, created];
      return created;
    },
  );
  mockTeachersApi.updateAssignment.mockImplementation(
    async (_slug, assignmentId, payload) => {
      assignmentsState = assignmentsState.map((entry) =>
        entry.id === assignmentId
          ? {
              ...entry,
              schoolYearId: payload.schoolYearId,
              teacherUserId: payload.teacherUserId,
              classId: payload.classId,
              subjectId: payload.subjectId,
              schoolYear:
                schoolYearsState.find(
                  (row) => row.id === payload.schoolYearId,
                ) ?? entry.schoolYear,
              teacherUser: {
                id: payload.teacherUserId,
                firstName:
                  teachersState.find(
                    (row) => row.userId === payload.teacherUserId,
                  )?.firstName ?? entry.teacherUser.firstName,
                lastName:
                  teachersState.find(
                    (row) => row.userId === payload.teacherUserId,
                  )?.lastName ?? entry.teacherUser.lastName,
                email:
                  teachersState.find(
                    (row) => row.userId === payload.teacherUserId,
                  )?.email ?? entry.teacherUser.email,
              },
              class:
                classroomsState.find((row) => row.id === payload.classId) ??
                entry.class,
              subject:
                subjectsState.find((row) => row.id === payload.subjectId) ??
                entry.subject,
            }
          : entry,
      );
      return assignmentsState.find((entry) => entry.id === assignmentId)!;
    },
  );
  mockTeachersApi.deleteAssignment.mockImplementation(
    async (_slug, assignmentId) => {
      assignmentsState = assignmentsState.filter(
        (entry) => entry.id !== assignmentId,
      );
      return { success: true };
    },
  );
});

// ---------------------------------------------------------------------------
// Schema unit tests
// ---------------------------------------------------------------------------

describe("teacherCreateFormSchema", () => {
  it("exige téléphone et pin en mode téléphone", () => {
    const result = teacherCreateFormSchema.safeParse({
      mode: "phone",
      phone: "",
      pin: "",
      email: "",
      password: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.phone).toContain(
      "Le téléphone enseignant est obligatoire.",
    );
    expect(result.error?.flatten().fieldErrors.pin).toContain(
      "Le PIN initial est obligatoire.",
    );
  });

  it("exige email et mot de passe robuste en mode email", () => {
    const result = teacherCreateFormSchema.safeParse({
      mode: "email",
      phone: "",
      pin: "",
      email: "prof@test",
      password: "weak",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain(
      "Adresse email invalide.",
    );
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.",
    );
  });

  it("valide correctement un profil téléphone complet", () => {
    const result = teacherCreateFormSchema.safeParse({
      mode: "phone",
      phone: "699001122",
      pin: "123456",
      email: "",
      password: "",
    });
    expect(result.success).toBe(true);
  });

  it("valide correctement un profil email complet", () => {
    const result = teacherCreateFormSchema.safeParse({
      mode: "email",
      phone: "",
      pin: "",
      email: "prof@example.com",
      password: "StrongPass1",
    });
    expect(result.success).toBe(true);
  });
});

describe("teacherAssignmentFormSchema", () => {
  it("retourne les erreurs zod attendues pour une affectation vide", () => {
    const result = teacherAssignmentFormSchema.safeParse({
      schoolYearId: "",
      teacherUserId: "",
      classId: "",
      subjectId: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.schoolYearId).toContain(
      "L'année scolaire est obligatoire.",
    );
    expect(result.error?.flatten().fieldErrors.teacherUserId).toContain(
      "L'enseignant est obligatoire.",
    );
    expect(result.error?.flatten().fieldErrors.classId).toContain(
      "La classe est obligatoire.",
    );
    expect(result.error?.flatten().fieldErrors.subjectId).toContain(
      "La matière est obligatoire.",
    );
  });

  it("valide correctement une affectation complète", () => {
    const result = teacherAssignmentFormSchema.safeParse({
      schoolYearId: "sy-1",
      teacherUserId: "user-1",
      classId: "class-1",
      subjectId: "subject-1",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Chargement et liste
// ---------------------------------------------------------------------------

describe("TeachersAdminScreen — chargement et liste", () => {
  it("charge le module et affiche les enseignants", async () => {
    render(<TeachersAdminScreen />);

    expect(await screen.findByTestId("teachers-admin-header")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-summary-card")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-summary-text")).toBeTruthy();
    expect(screen.getByText("2 enseignants")).toBeTruthy();
    expect(screen.getByText("1 affectation")).toBeTruthy();
    expect(
      await screen.findByTestId("teachers-admin-teacher-row-teacher-1"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-teacher-row-teacher-2"),
    ).toBeTruthy();
  });

  it("affiche un banner d'erreur si le chargement initial échoue", async () => {
    mockTeachersApi.listTeachers.mockRejectedValueOnce(
      new Error("Erreur réseau"),
    );

    render(<TeachersAdminScreen />);

    expect(
      await screen.findByTestId("teachers-admin-error-banner"),
    ).toBeTruthy();
  });

  it("affiche le fallback verrouillé hors rôle admin", async () => {
    mockAuthState = {
      schoolSlug: "college-vogt",
      user: {
        ...makeSchoolAdminUser(),
        role: "TEACHER",
        activeRole: "TEACHER",
        memberships: [{ schoolId: "school-1", role: "TEACHER" }],
      },
    };

    render(<TeachersAdminScreen />);

    expect(
      await screen.findByText("Module réservé aux comptes admin"),
    ).toBeTruthy();
    expect(mockTeachersApi.listTeachers).not.toHaveBeenCalled();
  });

  it("les tabs Enseignants, Affectations et Aide sont affichés", async () => {
    render(<TeachersAdminScreen />);
    await screen.findByTestId("teachers-admin-header");

    expect(
      await screen.findByTestId("teachers-admin-tab-teachers"),
    ).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-tab-assignments")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-tab-help")).toBeTruthy();
  });

  it("le FAB est visible sur le tab enseignants", async () => {
    render(<TeachersAdminScreen />);
    expect(await screen.findByTestId("teachers-admin-fab")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Expansion inline des affectations
// ---------------------------------------------------------------------------

describe("TeachersAdminScreen — expansion inline", () => {
  it("ouvre les affectations inline depuis l'oeil d'un enseignant", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-1",
      ),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("teachers-admin-teacher-assignments-teacher-1"),
      ).toBeTruthy();
    });
    expect(
      screen.getByTestId("teachers-admin-teacher-inline-assignment-assign-1"),
    ).toBeTruthy();
  });

  it("referme le détail inline quand on reclique sur l'oeil", async () => {
    render(<TeachersAdminScreen />);

    const eyeButton = await screen.findByTestId(
      "teachers-admin-teacher-open-assignments-teacher-1",
    );
    fireEvent.press(eyeButton);
    expect(
      await screen.findByTestId("teachers-admin-teacher-assignments-teacher-1"),
    ).toBeTruthy();

    fireEvent.press(eyeButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId("teachers-admin-teacher-assignments-teacher-1"),
      ).toBeNull();
    });
  });

  it("affiche un état vide inline quand un enseignant n'a aucune affectation", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-2",
      ),
    );

    const emptyState = await screen.findByTestId(
      "teachers-admin-teacher-assignments-empty-teacher-2",
    );
    expect(emptyState).toBeTruthy();
    expect(emptyState.props.children).toBe("Aucun créneau pédagogique.");
  });

  it("affiche la mention Non affecté pour un enseignant sans affectation", async () => {
    render(<TeachersAdminScreen />);

    const summary = await screen.findByTestId(
      "teachers-admin-teacher-classes-summary-teacher-2",
    );
    expect(summary.props.children).toBe("Non affecté");
  });

  it("affiche le contact sur la même ligne que le nom", async () => {
    render(<TeachersAdminScreen />);

    expect(
      await screen.findByTestId("teachers-admin-teacher-identity-teacher-1"),
    ).toBeTruthy();
    expect(screen.getByText("Mvondo Albert")).toBeTruthy();
    expect(screen.getByText("albert@example.test")).toBeTruthy();
  });

  it("affiche le résumé de classes condensé pour un enseignant affecté", async () => {
    render(<TeachersAdminScreen />);

    const summary = await screen.findByTestId(
      "teachers-admin-teacher-classes-summary-teacher-1",
    );
    expect(summary.props.children).toBe("6eC");
  });
});

// ---------------------------------------------------------------------------
// Navigation vers le tab forms — FAB enseignants
// ---------------------------------------------------------------------------

describe("TeachersAdminScreen — tab forms / création enseignant", () => {
  it("FAB sur tab enseignants → tab forms actif avec hero et champs de formulaire", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));

    expect(await screen.findByTestId("teachers-admin-forms-tab")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-form-hero")).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-create-form-content"),
    ).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-create-phone")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-create-pin")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-create-submit")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-create-cancel")).toBeTruthy();
  });

  it("hero création enseignant affiche le bon titre et le sous-titre", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));

    await screen.findByTestId("teachers-admin-form-hero");
    expect(screen.getByText("Créer un enseignant")).toBeTruthy();
    expect(
      screen.getByText("Téléphone + PIN ou email + mot de passe initial."),
    ).toBeTruthy();
  });

  it("les tabs Enseignants/Affectations/Aide sont masqués sur le tab forms", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));

    await screen.findByTestId("teachers-admin-forms-tab");
    expect(screen.queryByTestId("teachers-admin-tab-teachers")).toBeNull();
    expect(screen.queryByTestId("teachers-admin-tab-assignments")).toBeNull();
  });

  it("le FAB est masqué sur le tab forms", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));

    await screen.findByTestId("teachers-admin-forms-tab");
    expect(screen.queryByTestId("teachers-admin-fab")).toBeNull();
  });

  it("flèche header depuis tab forms enseignant → retour au tab enseignants, formulaire démonte", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-forms-tab");

    fireEvent.press(screen.getByTestId("teachers-admin-back-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-teacher-row-teacher-1"),
    ).toBeTruthy();
    expect(mockTeachersApi.createTeacher).not.toHaveBeenCalled();
  });

  it("flèche header (ModuleHeader) sur tab forms → exitForms, retour au tab enseignants", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-forms-tab");

    fireEvent.press(screen.getByTestId("teachers-admin-back-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-teacher-row-teacher-1"),
    ).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("bouton Annuler du formulaire → retour au tab enseignants sans appel API", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-create-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-teacher-row-teacher-1"),
    ).toBeTruthy();
    expect(mockTeachersApi.createTeacher).not.toHaveBeenCalled();
  });

  it("affiche les erreurs de validation téléphone en temps réel", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");

    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-phone"),
      "12",
    );
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-pin"),
      "123",
    );

    expect(
      await screen.findByTestId("teachers-admin-create-phone-error"),
    ).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-create-pin-error")).toBeTruthy();
  });

  it("bouton submit toujours actif même sur formulaire vide", async () => {
    render(<TeachersAdminScreen />);
    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");

    const submitBtn = screen.getByTestId("teachers-admin-create-submit");
    expect(submitBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("submit sur form vide → erreurs sans appel API", async () => {
    render(<TeachersAdminScreen />);
    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-create-submit"));

    expect(
      await screen.findByTestId("teachers-admin-create-phone-error"),
    ).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-create-pin-error")).toBeTruthy();
    expect(mockTeachersApi.createTeacher).not.toHaveBeenCalled();
  });

  it("submit form email vide → erreurs email et mot de passe sans appel API", async () => {
    render(<TeachersAdminScreen />);
    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-create-mode-email"));
    fireEvent.press(screen.getByTestId("teachers-admin-create-submit"));

    expect(
      await screen.findByTestId("teachers-admin-create-email-error"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-create-password-error"),
    ).toBeTruthy();
    expect(mockTeachersApi.createTeacher).not.toHaveBeenCalled();
  });

  it("création enseignant par téléphone → API appelée + showSuccess", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");

    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("teachers-admin-create-submit"));

    await waitFor(() => {
      expect(mockTeachersApi.createTeacher).toHaveBeenCalledWith(
        "college-vogt",
        { phone: "699001122", pin: "123456" },
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Enseignant ajouté" }),
    );
  });

  it("succès création enseignant → retour au tab enseignants après 2 secondes", async () => {
    jest.useFakeTimers();

    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("teachers-admin-create-submit"));

    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());

    // Pendant les 2 secondes, le tab forms est encore visible
    expect(screen.getByTestId("teachers-admin-forms-tab")).toBeTruthy();

    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-teacher-row-teacher-created"),
    ).toBeTruthy();

    jest.useRealTimers();
  });

  it("création par email → API appelée + showSuccess", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");
    fireEvent.press(screen.getByTestId("teachers-admin-create-mode-email"));
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-email"),
      "prof@example.test",
    );
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-password"),
      "StrongPass1",
    );
    fireEvent.press(screen.getByTestId("teachers-admin-create-submit"));

    await waitFor(() => {
      expect(mockTeachersApi.createTeacher).toHaveBeenCalledWith(
        "college-vogt",
        { email: "prof@example.test", password: "StrongPass1" },
      );
    });
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  it("erreur création → showError + formulaire toujours visible", async () => {
    mockTeachersApi.createTeacher.mockRejectedValueOnce(
      new Error("Teacher already exists"),
    );

    render(<TeachersAdminScreen />);

    fireEvent.press(await screen.findByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-create-form-content");
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-phone"),
      "699001122",
    );
    fireEvent.changeText(
      screen.getByTestId("teachers-admin-create-pin"),
      "123456",
    );
    fireEvent.press(screen.getByTestId("teachers-admin-create-submit"));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Création impossible",
          message: "Teacher already exists",
        }),
      );
    });
    // Le formulaire reste affiché après l'erreur
    expect(screen.getByTestId("teachers-admin-forms-tab")).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-create-form-content"),
    ).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Navigation vers le tab forms — FAB affectations
// ---------------------------------------------------------------------------

describe("TeachersAdminScreen — tab forms / création affectation", () => {
  it("FAB sur tab affectations → tab forms avec formulaire affectation", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));

    expect(await screen.findByTestId("teachers-admin-forms-tab")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-form-hero")).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-assignment-form-content"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-assignment-school-year"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-assignment-teacher"),
    ).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-assignment-class")).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-assignment-subject"),
    ).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-assignment-submit")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-assignment-cancel")).toBeTruthy();
  });

  it("hero création affectation affiche le bon titre et le sous-titre", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));

    await screen.findByTestId("teachers-admin-form-hero");
    expect(screen.getByText("Nouvelle affectation")).toBeTruthy();
    expect(
      screen.getByText(
        "Associez un enseignant, une classe, une matière et une année scolaire.",
      ),
    ).toBeTruthy();
  });

  it("bouton Annuler affectation → retour au tab affectations sans appel API", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-assignment-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(mockTeachersApi.createAssignment).not.toHaveBeenCalled();
    expect(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    ).toBeTruthy();
  });

  it("flèche header depuis tab forms affectation → retour au tab affectations", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-forms-tab");

    fireEvent.press(screen.getByTestId("teachers-admin-back-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    ).toBeTruthy();
    expect(mockTeachersApi.createAssignment).not.toHaveBeenCalled();
  });

  it("bouton submit affectation toujours actif même sur formulaire vide", async () => {
    render(<TeachersAdminScreen />);
    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-assignment-form-content");

    const submitBtn = screen.getByTestId("teachers-admin-assignment-submit");
    expect(submitBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("submit affectation sans classe → erreur classe sans appel API", async () => {
    render(<TeachersAdminScreen />);
    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-assignment-submit"));

    expect(
      await screen.findByTestId("teachers-admin-assignment-class-error"),
    ).toBeTruthy();
    expect(mockTeachersApi.createAssignment).not.toHaveBeenCalled();
  });

  it("crée une affectation et affiche un toast succès", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-assignment-class"));
    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-assignment-class-option-class-1",
      ),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-assignment-submit"));

    await waitFor(() => {
      expect(mockTeachersApi.createAssignment).toHaveBeenCalledWith(
        "college-vogt",
        {
          schoolYearId: "sy-1",
          teacherUserId: "teacher-1",
          classId: "class-1",
          subjectId: "subject-1",
        },
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Affectation créée" }),
    );
  });

  it("succès création affectation → retour au tab affectations après 2 secondes", async () => {
    jest.useFakeTimers();

    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-assignment-class"));
    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-assignment-class-option-class-1",
      ),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-assignment-submit"));

    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());

    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    ).toBeTruthy();

    jest.useRealTimers();
  });

  it("erreur création affectation → showError + formulaire toujours visible", async () => {
    mockTeachersApi.createAssignment.mockRejectedValueOnce(
      new Error("Conflit affectation"),
    );

    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-fab"));
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-assignment-class"));
    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-assignment-class-option-class-1",
      ),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-assignment-submit"));

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Opération impossible" }),
      );
    });
    expect(screen.getByTestId("teachers-admin-forms-tab")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Édition d'affectation — depuis la liste inline de l'enseignant
// ---------------------------------------------------------------------------

describe("TeachersAdminScreen — édition affectation depuis vue inline enseignant", () => {
  it("bouton édition inline → tab forms avec formulaire pré-rempli (mode edit)", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-edit-assign-1"),
    );

    expect(await screen.findByTestId("teachers-admin-forms-tab")).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-form-hero")).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-assignment-form-content"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-assignment-school-year"),
    ).toBeTruthy();
    expect(screen.getByTestId("teachers-admin-assignment-class")).toBeTruthy();
  });

  it("hero édition affectation affiche 'Modifier l'affectation'", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-edit-assign-1"),
    );

    await screen.findByTestId("teachers-admin-form-hero");
    expect(screen.getByText("Modifier l'affectation")).toBeTruthy();
    expect(
      screen.getByText(
        "Associez un enseignant, une classe, une matière et une année scolaire.",
      ),
    ).toBeTruthy();
  });

  it("annuler depuis édition inline → retour au tab enseignants", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-edit-assign-1"),
    );
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-assignment-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-tab-teachers"),
    ).toBeTruthy();
    expect(mockTeachersApi.updateAssignment).not.toHaveBeenCalled();
  });

  it("met à jour une affectation et affiche un toast succès", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-edit-assign-1"),
    );
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(
      screen.getByTestId("teachers-admin-assignment-school-year"),
    );
    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-assignment-school-year-option-sy-2",
      ),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-assignment-class"));
    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-assignment-class-option-class-2",
      ),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-assignment-subject"));
    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-assignment-subject-option-subject-2",
      ),
    );
    fireEvent.press(screen.getByTestId("teachers-admin-assignment-submit"));

    await waitFor(() => {
      expect(mockTeachersApi.updateAssignment).toHaveBeenCalledWith(
        "college-vogt",
        "assign-1",
        {
          schoolYearId: "sy-2",
          teacherUserId: "teacher-1",
          classId: "class-2",
          subjectId: "subject-2",
        },
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Affectation mise à jour" }),
    );
  });

  it("succès mise à jour → retour au tab enseignants après 2 secondes", async () => {
    jest.useFakeTimers();

    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-edit-assign-1"),
    );
    await screen.findByTestId("teachers-admin-assignment-form-content");
    fireEvent.press(screen.getByTestId("teachers-admin-assignment-submit"));

    await waitFor(() => expect(mockShowSuccess).toHaveBeenCalled());

    act(() => jest.advanceTimersByTime(2000));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-tab-teachers"),
    ).toBeTruthy();

    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Édition d'affectation — depuis la liste des affectations
// ---------------------------------------------------------------------------

describe("TeachersAdminScreen — édition affectation depuis liste affectations", () => {
  it("bouton édition liste affectations → tab forms avec bon contexte", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-edit-assign-1"),
    );

    expect(await screen.findByTestId("teachers-admin-forms-tab")).toBeTruthy();
    expect(
      screen.getByTestId("teachers-admin-assignment-form-content"),
    ).toBeTruthy();
  });

  it("annuler depuis liste affectations → retour au tab affectations", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-edit-assign-1"),
    );
    await screen.findByTestId("teachers-admin-assignment-form-content");

    fireEvent.press(screen.getByTestId("teachers-admin-assignment-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("teachers-admin-forms-tab")).toBeNull();
    });
    expect(
      await screen.findByTestId("teachers-admin-tab-assignments"),
    ).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Suppression d'affectation
// ---------------------------------------------------------------------------

describe("TeachersAdminScreen — suppression affectation", () => {
  it("supprime une affectation et affiche un toast succès", async () => {
    render(<TeachersAdminScreen />);

    fireEvent.press(
      await screen.findByTestId(
        "teachers-admin-teacher-open-assignments-teacher-1",
      ),
    );
    fireEvent.press(
      await screen.findByTestId("teachers-admin-assignment-delete-assign-1"),
    );
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(mockTeachersApi.deleteAssignment).toHaveBeenCalledWith(
        "college-vogt",
        "assign-1",
      );
    });
    expect(mockShowSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Affectation supprimée" }),
    );
  });
});
