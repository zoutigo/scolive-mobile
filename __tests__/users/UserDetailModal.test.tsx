/**
 * Tests unitaires et fonctionnels : UserDetailModal
 * Couvre : header "Utilisateurs"/nom, carte profil, sections par rôle,
 *          contact, activité, erreur, retry, fermeture.
 */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { UserDetailModal } from "../../src/components/users/UserDetailModal";
import { usersApi } from "../../src/api/users.api";
import {
  TEACHER_USER,
  PARENT_USER,
  STUDENT_USER,
  ADMIN_USER,
  makeSchoolUserDetail,
  makeStudentOnlyUser,
} from "../../test-utils/users.fixtures";
import type { SchoolRole } from "../../src/types/users.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/users.api");
jest.mock("../../src/api/teachers.api", () => ({
  teachersApi: {
    listSchoolYears: jest.fn().mockResolvedValue([]),
    listClassrooms: jest.fn().mockResolvedValue([]),
    listSubjects: jest.fn().mockResolvedValue([]),
    listTeachers: jest.fn().mockResolvedValue([]),
    createAssignment: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock("../../src/api/family.api", () => ({
  familyApi: {
    listAdminStudents: jest
      .fn()
      .mockResolvedValue({ students: [], total: 0, page: 1, hasMore: false }),
    linkExistingParent: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({ schoolSlug: "college-vogt", user: null }),
}));
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const SLUG = "college-vogt";

describe("UserDetailModal", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Visibilité ──────────────────────────────────────────────────────────────

  it("ne s'affiche pas quand user est null", () => {
    render(
      <UserDetailModal user={null} schoolSlug={SLUG} onClose={jest.fn()} />,
    );
    expect(screen.queryByTestId("user-detail-modal")).toBeNull();
  });

  // ── Header ──────────────────────────────────────────────────────────────────

  it('le titre du header est "Utilisateurs"', async () => {
    mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user-detail-title")).toBeOnTheScreen();
    });
    expect(screen.getByText("Utilisateurs")).toBeOnTheScreen();
  });

  it("le sous-titre du header contient le nom complet du user", async () => {
    mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user-detail-name")).toBeOnTheScreen();
    });
    // Le nom apparaît dans le sous-titre ET dans la carte profil
    expect(screen.getAllByText("Ebelle Marie").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  // ── Carte profil ────────────────────────────────────────────────────────────

  it("la carte profil affiche le statut actif", async () => {
    mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user-detail-profile")).toBeOnTheScreen();
    });
    expect(screen.getByText("Actif")).toBeOnTheScreen();
  });

  it("la carte profil affiche le badge de rôle", async () => {
    mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user-detail-profile")).toBeOnTheScreen();
    });
    expect(screen.getAllByText("Enseignant").length).toBeGreaterThanOrEqual(1);
  });

  it("la carte profil affiche le nom complet en grand", async () => {
    mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user-detail-fullname")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("user-detail-fullname")).toBeOnTheScreen();
  });

  it("affiche un loader pendant le chargement", async () => {
    mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user-detail-loading")).toBeOnTheScreen();
    });
  });

  // ── Section enseignant ──────────────────────────────────────────────────────

  it("affiche la section enseignant avec classes et matières", async () => {
    const detail = makeSchoolUserDetail({
      ...TEACHER_USER,
      teachingClasses: [
        {
          classId: "cls-1",
          className: "5e A",
          subjects: [
            { id: "sub-1", name: "Mathématiques" },
            { id: "sub-2", name: "Physique" },
          ],
        },
        {
          classId: "cls-2",
          className: "4e B",
          subjects: [{ id: "sub-1", name: "Mathématiques" }],
        },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-teacher")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("teacher-class-cls-1")).toBeOnTheScreen();
    expect(screen.getByText("5e A")).toBeOnTheScreen();
    expect(screen.getByText("4e B")).toBeOnTheScreen();
    expect(screen.getAllByText("Mathématiques").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("Physique")).toBeOnTheScreen();
  });

  it("affiche un message si l'enseignant n'a pas de classes assignées", async () => {
    const detail = makeSchoolUserDetail({
      ...TEACHER_USER,
      teachingClasses: [],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-teacher")).toBeOnTheScreen();
    });
    expect(screen.getByText("Aucune classe assignée")).toBeOnTheScreen();
  });

  // ── Section parent ──────────────────────────────────────────────────────────

  it("affiche la section parent avec les enfants et leurs classes", async () => {
    const detail = makeSchoolUserDetail({
      ...PARENT_USER,
      children: [
        {
          id: "child-1",
          firstName: "Cédric",
          lastName: "Atangana",
          className: "3e B",
        },
        {
          id: "child-2",
          firstName: "Lucie",
          lastName: "Atangana",
          className: null,
        },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={PARENT_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-parent")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("parent-child-child-1")).toBeOnTheScreen();
    expect(screen.getByText("Atangana Cédric")).toBeOnTheScreen();
    expect(screen.getByText("3e B")).toBeOnTheScreen();
    expect(screen.getByText("Atangana Lucie")).toBeOnTheScreen();
  });

  it("affiche un message si le parent n'a aucun enfant enregistré", async () => {
    const detail = makeSchoolUserDetail({ ...PARENT_USER, children: [] });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={PARENT_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-parent")).toBeOnTheScreen();
    });
    expect(screen.getByText("Aucun enfant enregistré")).toBeOnTheScreen();
  });

  // ── Section élève ───────────────────────────────────────────────────────────

  it("affiche la section élève avec la classe et les parents", async () => {
    const detail = makeSchoolUserDetail({
      ...STUDENT_USER,
      enrollments: [
        {
          id: "enr-1",
          classId: "cls-6eA",
          className: "6e A",
          schoolYear: "2025-2026",
        },
      ],
      studentParents: [
        {
          id: "par-1",
          firstName: "Henri",
          lastName: "Mballa",
          phone: "+237 677 000 000",
        },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={STUDENT_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-student")).toBeOnTheScreen();
    });
    expect(screen.getByText("6e A")).toBeOnTheScreen();
    expect(screen.getByText("2025-2026")).toBeOnTheScreen();
    expect(screen.getByTestId("student-parents")).toBeOnTheScreen();
    expect(screen.getByTestId("student-parent-par-1")).toBeOnTheScreen();
    expect(screen.getByText("Mballa Henri")).toBeOnTheScreen();
    expect(screen.getByText("+237 677 000 000")).toBeOnTheScreen();
  });

  it("affiche un message si l'élève n'a pas d'inscription active", async () => {
    const detail = makeSchoolUserDetail({
      ...STUDENT_USER,
      enrollments: [],
      studentParents: [],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={STUDENT_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-student")).toBeOnTheScreen();
    });
    expect(screen.getByText("Aucune inscription active")).toBeOnTheScreen();
  });

  it("ne plante pas pour un student-only si le backend omet studentParents", async () => {
    const studentOnly = makeStudentOnlyUser({
      id: "student-only-42",
      studentId: "student-42",
      firstName: "Jean",
      lastName: "Dupont",
    });
    mockUsersApi.getStudentProfile.mockResolvedValueOnce({
      type: "student-only",
      studentId: "student-42",
      firstName: "Jean",
      lastName: "Dupont",
      enrollments: [],
    } as never);

    render(
      <UserDetailModal
        user={studentOnly}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-student")).toBeOnTheScreen();
    });
    expect(screen.getByText("Aucune inscription active")).toBeOnTheScreen();
    expect(screen.queryByTestId("student-parents")).toBeNull();
    expect(mockUsersApi.getStudentProfile).toHaveBeenCalledWith(
      SLUG,
      "student-42",
    );
  });

  // ── Section admin ───────────────────────────────────────────────────────────

  it("affiche la section admin pour un SCHOOL_ADMIN", async () => {
    const detail = makeSchoolUserDetail({ ...ADMIN_USER });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={ADMIN_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-school_admin")).toBeOnTheScreen();
    });
    expect(screen.getByText("Rôle administratif")).toBeOnTheScreen();
  });

  // ── Section staff ───────────────────────────────────────────────────────────

  it("affiche la section staff avec les fonctions", async () => {
    const staffUser = {
      ...TEACHER_USER,
      id: "staff-1",
      roles: ["SCHOOL_STAFF"] as SchoolRole[],
    };
    const detail = makeSchoolUserDetail({
      ...staffUser,
      staffFunctions: [
        { id: "fn-1", name: "Responsable bibliothèque" },
        { id: "fn-2", name: "Surveillant général" },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={staffUser}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-staff")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("staff-function-fn-1")).toBeOnTheScreen();
    expect(screen.getByText("Responsable bibliothèque")).toBeOnTheScreen();
    expect(screen.getByText("Surveillant général")).toBeOnTheScreen();
  });

  it("affiche un message si le personnel n'a aucune fonction assignée", async () => {
    const staffUser = {
      ...TEACHER_USER,
      id: "staff-2",
      roles: ["SCHOOL_STAFF"] as SchoolRole[],
    };
    const detail = makeSchoolUserDetail({ ...staffUser, staffFunctions: [] });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={staffUser}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-staff")).toBeOnTheScreen();
    });
    expect(screen.getByText("Aucune fonction assignée")).toBeOnTheScreen();
  });

  // ── Multi-rôle ──────────────────────────────────────────────────────────────

  it("affiche toutes les sections pour un utilisateur multi-rôle", async () => {
    const multiRole = {
      ...TEACHER_USER,
      roles: ["TEACHER", "PARENT"] as SchoolRole[],
    };
    const detail = makeSchoolUserDetail({
      ...multiRole,
      teachingClasses: [
        {
          classId: "cls-1",
          className: "5e A",
          subjects: [{ id: "s1", name: "SVT" }],
        },
      ],
      children: [
        {
          id: "child-1",
          firstName: "Lea",
          lastName: "Ebelle",
          className: "6e A",
        },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={multiRole}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-teacher")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("role-section-parent")).toBeOnTheScreen();
    expect(screen.getByText("5e A")).toBeOnTheScreen();
    expect(screen.getByText("Ebelle Lea")).toBeOnTheScreen();
  });

  // ── Contact & activité ──────────────────────────────────────────────────────

  it("affiche les infos de contact après chargement", async () => {
    const detail = makeSchoolUserDetail({
      ...TEACHER_USER,
      lastLoginAt: "2026-05-20T14:30:00.000Z",
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-detail-contact")).toBeOnTheScreen();
    });
    expect(screen.getByText(TEACHER_USER.email!)).toBeOnTheScreen();
    expect(screen.getByText(TEACHER_USER.phone!)).toBeOnTheScreen();
  });

  it("affiche la section activité", async () => {
    const detail = makeSchoolUserDetail(TEACHER_USER);
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-detail-activity")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("user-detail-created-at")).toBeOnTheScreen();
    expect(
      screen.getByTestId("user-detail-profile-completed"),
    ).toBeOnTheScreen();
  });

  // ── Erreur & retry ──────────────────────────────────────────────────────────

  it("affiche un message d'erreur si l'API échoue", async () => {
    mockUsersApi.get.mockRejectedValueOnce(new Error("Network error"));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-detail-error")).toBeOnTheScreen();
    });
    expect(
      screen.getByText("Impossible de charger les détails de cet utilisateur."),
    ).toBeOnTheScreen();
  });

  it("recharge les données quand on clique sur Réessayer", async () => {
    mockUsersApi.get
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(makeSchoolUserDetail(TEACHER_USER));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Réessayer")).toBeOnTheScreen();
    });

    await act(async () => {
      fireEvent.press(screen.getByText("Réessayer"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-detail-contact")).toBeOnTheScreen();
    });
    expect(mockUsersApi.get).toHaveBeenCalledTimes(2);
  });

  // ── Fermeture ───────────────────────────────────────────────────────────────

  it("appelle onClose quand on clique sur fermer", async () => {
    mockUsersApi.get.mockResolvedValueOnce(makeSchoolUserDetail(TEACHER_USER));
    const onClose = jest.fn();
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByTestId("user-detail-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Layout compact — tests de régression ─────────────────────────────────────

  it("le nom et le statut sont dans le même conteneur (layout compact)", async () => {
    mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("user-detail-fullname")).toBeOnTheScreen();
    });
    // Le nom et "Actif" doivent être co-localisés dans le même bloc
    const mainRow = screen.getByTestId("user-detail-fullname");
    expect(
      within(mainRow).getAllByText(/Ebelle Marie/).length,
    ).toBeGreaterThanOrEqual(1);
    expect(within(mainRow).getByText("Actif")).toBeOnTheScreen();
  });

  it("la ligne de classe enseignant contient le nom de classe ET les matières (inline)", async () => {
    const detail = makeSchoolUserDetail({
      ...TEACHER_USER,
      teachingClasses: [
        {
          classId: "cls-x",
          className: "3e C",
          subjects: [
            { id: "s1", name: "Histoire" },
            { id: "s2", name: "Géographie" },
          ],
        },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("teacher-class-cls-x")).toBeOnTheScreen();
    });
    // Classe ET matières dans le même conteneur = layout inline
    const classRow = screen.getByTestId("teacher-class-cls-x");
    expect(within(classRow).getByText("3e C")).toBeOnTheScreen();
    expect(within(classRow).getByText("Histoire")).toBeOnTheScreen();
    expect(within(classRow).getByText("Géographie")).toBeOnTheScreen();
  });

  it("la ligne enfant (parent) contient le nom ET la classe dans le même conteneur", async () => {
    const detail = makeSchoolUserDetail({
      ...PARENT_USER,
      children: [
        {
          id: "c-inline",
          firstName: "Sophie",
          lastName: "Ndongo",
          className: "4e A",
        },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={PARENT_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("parent-child-c-inline")).toBeOnTheScreen();
    });
    // Nom ET classe dans le même row = layout inline
    const childRow = screen.getByTestId("parent-child-c-inline");
    expect(within(childRow).getByText("Ndongo Sophie")).toBeOnTheScreen();
    expect(within(childRow).getByText("4e A")).toBeOnTheScreen();
  });

  it("la ligne élève contient la classe ET l'année dans le même conteneur", async () => {
    const detail = makeSchoolUserDetail({
      ...STUDENT_USER,
      enrollments: [
        {
          id: "enr-c",
          classId: "cls-5eB",
          className: "5e B",
          schoolYear: "2025-2026",
        },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={STUDENT_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("role-section-student")).toBeOnTheScreen();
    });
    // Les deux textes doivent être visibles (layout horizontal)
    expect(screen.getByText("5e B")).toBeOnTheScreen();
    expect(screen.getByText("2025-2026")).toBeOnTheScreen();
  });

  it("plusieurs sections de rôle sont dans un seul conteneur commun", async () => {
    const multiRole = {
      ...TEACHER_USER,
      roles: ["TEACHER", "PARENT"] as SchoolRole[],
    };
    const detail = makeSchoolUserDetail({ ...multiRole });
    mockUsersApi.get.mockResolvedValueOnce(detail);
    render(
      <UserDetailModal
        user={multiRole}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-detail-role-sections")).toBeOnTheScreen();
    });
    const wrapper = screen.getByTestId("user-detail-role-sections");
    expect(
      within(wrapper).getByTestId("role-section-teacher"),
    ).toBeOnTheScreen();
    expect(
      within(wrapper).getByTestId("role-section-parent"),
    ).toBeOnTheScreen();
  });

  // ── Actions communes ────────────────────────────────────────────────────────

  describe("Boutons d'action communs", () => {
    it("le bouton Message est toujours visible dans la carte profil", async () => {
      mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
      render(
        <UserDetailModal
          user={TEACHER_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(
          screen.getByTestId("user-detail-common-actions"),
        ).toBeOnTheScreen(),
      );
      expect(screen.getByTestId("action-send-message")).toBeOnTheScreen();
    });

    it("le bouton Modifier les rôles est toujours visible dans la carte profil", async () => {
      mockUsersApi.get.mockImplementation(() => new Promise(() => {}));
      render(
        <UserDetailModal
          user={TEACHER_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("action-edit-roles")).toBeOnTheScreen(),
      );
    });

    it("le clic sur Modifier les rôles ouvre le sheet", async () => {
      mockUsersApi.get.mockResolvedValueOnce(
        makeSchoolUserDetail(TEACHER_USER),
      );
      render(
        <UserDetailModal
          user={TEACHER_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("action-edit-roles")).toBeOnTheScreen(),
      );
      fireEvent.press(screen.getByTestId("action-edit-roles"));
      await waitFor(() =>
        expect(screen.getByTestId("edit-roles-sheet")).toBeOnTheScreen(),
      );
    });

    it("le sheet Modifier les rôles affiche les rôles actuels cochés", async () => {
      mockUsersApi.get.mockResolvedValueOnce(
        makeSchoolUserDetail(TEACHER_USER),
      );
      render(
        <UserDetailModal
          user={TEACHER_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("action-edit-roles")).toBeOnTheScreen(),
      );
      fireEvent.press(screen.getByTestId("action-edit-roles"));
      await waitFor(() =>
        expect(screen.getByTestId("role-check-teacher")).toBeOnTheScreen(),
      );
      // Le rôle TEACHER doit être présent (listé)
      expect(screen.getByTestId("role-check-teacher")).toBeOnTheScreen();
      expect(screen.getByTestId("role-check-parent")).toBeOnTheScreen();
    });
  });

  // ── Actions enseignant ──────────────────────────────────────────────────────

  describe("Section ENSEIGNANT — boutons d'action", () => {
    it("les boutons Agenda et Affectations sont visibles dans la section enseignant", async () => {
      mockUsersApi.get.mockResolvedValueOnce(
        makeSchoolUserDetail(TEACHER_USER),
      );
      render(
        <UserDetailModal
          user={TEACHER_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("teacher-actions")).toBeOnTheScreen(),
      );
      expect(screen.getByTestId("action-teacher-agenda")).toBeOnTheScreen();
      expect(
        screen.getByTestId("action-teacher-assignments"),
      ).toBeOnTheScreen();
    });

    it("le clic sur Affectations ouvre le sheet TeacherAssignmentSheet", async () => {
      mockUsersApi.get.mockResolvedValueOnce(
        makeSchoolUserDetail(TEACHER_USER),
      );
      render(
        <UserDetailModal
          user={TEACHER_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(
          screen.getByTestId("action-teacher-assignments"),
        ).toBeOnTheScreen(),
      );
      fireEvent.press(screen.getByTestId("action-teacher-assignments"));
      await waitFor(() =>
        expect(
          screen.getByTestId("teacher-assignment-sheet"),
        ).toBeOnTheScreen(),
      );
    });
  });

  // ── Actions parent ──────────────────────────────────────────────────────────

  describe("Section PARENT — boutons d'action", () => {
    it("les boutons Affecter un enfant et Paiements sont dans la section parent", async () => {
      mockUsersApi.get.mockResolvedValueOnce(
        makeSchoolUserDetail({ ...PARENT_USER, children: [] }),
      );
      render(
        <UserDetailModal
          user={PARENT_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("parent-actions")).toBeOnTheScreen(),
      );
      expect(screen.getByTestId("action-assign-child")).toBeOnTheScreen();
      expect(screen.getByTestId("action-payments-disabled")).toBeOnTheScreen();
    });

    it("le bouton Paiements est désactivé", async () => {
      mockUsersApi.get.mockResolvedValueOnce(
        makeSchoolUserDetail({ ...PARENT_USER, children: [] }),
      );
      render(
        <UserDetailModal
          user={PARENT_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(
          screen.getByTestId("action-payments-disabled"),
        ).toBeOnTheScreen(),
      );
      const btn = screen.getByTestId("action-payments-disabled");
      expect(btn).toBeDisabled();
    });

    it("le clic sur Affecter un enfant ouvre le sheet", async () => {
      mockUsersApi.get.mockResolvedValueOnce(
        makeSchoolUserDetail({ ...PARENT_USER, children: [] }),
      );
      render(
        <UserDetailModal
          user={PARENT_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("action-assign-child")).toBeOnTheScreen(),
      );
      fireEvent.press(screen.getByTestId("action-assign-child"));
      await waitFor(() =>
        expect(screen.getByTestId("assign-child-sheet")).toBeOnTheScreen(),
      );
    });

    it("chaque enfant parent affiche Discipline, Notes et Agenda", async () => {
      const detail = makeSchoolUserDetail({
        ...PARENT_USER,
        children: [
          {
            id: "c-btn-test",
            firstName: "Paul",
            lastName: "Ekwé",
            className: "3e A",
          },
        ],
      });
      mockUsersApi.get.mockResolvedValueOnce(detail);
      render(
        <UserDetailModal
          user={PARENT_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(
          screen.getByTestId("action-child-discipline-c-btn-test"),
        ).toBeOnTheScreen(),
      );
      expect(
        screen.getByTestId("action-child-notes-c-btn-test"),
      ).toBeOnTheScreen();
      expect(
        screen.getByTestId("action-child-agenda-c-btn-test"),
      ).toBeOnTheScreen();
    });
  });

  // ── Actions élève ───────────────────────────────────────────────────────────

  describe("Section ÉLÈVE — boutons d'action", () => {
    it("les 4 boutons d'action sont visibles dans la section élève", async () => {
      const detail = makeSchoolUserDetail({
        ...STUDENT_USER,
        enrollments: [
          {
            id: "enr-1",
            classId: "cls-6eA",
            className: "6e A",
            schoolYear: "2025-2026",
          },
        ],
      });
      mockUsersApi.get.mockResolvedValueOnce(detail);
      render(
        <UserDetailModal
          user={STUDENT_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("student-actions")).toBeOnTheScreen(),
      );
      expect(screen.getByTestId("action-student-discipline")).toBeOnTheScreen();
      expect(screen.getByTestId("action-student-notes")).toBeOnTheScreen();
      expect(screen.getByTestId("action-student-agenda")).toBeOnTheScreen();
      expect(screen.getByTestId("action-student-devoirs")).toBeOnTheScreen();
    });

    it("le bouton Devoirs est activé quand classId est disponible", async () => {
      const detail = makeSchoolUserDetail({
        ...STUDENT_USER,
        enrollments: [
          {
            id: "enr-1",
            classId: "cls-6eA",
            className: "6e A",
            schoolYear: "2025-2026",
          },
        ],
      });
      mockUsersApi.get.mockResolvedValueOnce(detail);
      render(
        <UserDetailModal
          user={STUDENT_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("action-student-devoirs")).toBeOnTheScreen(),
      );
      expect(screen.getByTestId("action-student-devoirs")).not.toBeDisabled();
    });

    it("le bouton Devoirs est désactivé quand aucune inscription", async () => {
      const detail = makeSchoolUserDetail({ ...STUDENT_USER, enrollments: [] });
      mockUsersApi.get.mockResolvedValueOnce(detail);
      render(
        <UserDetailModal
          user={STUDENT_USER}
          schoolSlug={SLUG}
          onClose={jest.fn()}
        />,
      );
      await waitFor(() =>
        expect(screen.getByTestId("action-student-devoirs")).toBeOnTheScreen(),
      );
      expect(screen.getByTestId("action-student-devoirs")).toBeDisabled();
    });
  });
});
