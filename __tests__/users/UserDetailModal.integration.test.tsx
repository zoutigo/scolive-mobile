/**
 * Tests d'intégration : UserDetailModal
 * Simule le cycle de vie complet : ouverture → chargement API → affichage des sections.
 * Les données transitent par usersApi.get (mocké) et les sections sont vérifiées dans le DOM.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { UserDetailModal } from "../../src/components/users/UserDetailModal";
import { usersApi } from "../../src/api/users.api";
import {
  TEACHER_USER,
  PARENT_USER,
  STUDENT_USER,
  ADMIN_USER,
  makeSchoolUserDetail,
} from "../../test-utils/users.fixtures";
import type { SchoolRole } from "../../src/types/users.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/users.api");
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const SLUG = "college-vogt";

describe("UserDetailModal — intégration flux complet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("flux enseignant : header → profil → section classe/matières → contact", async () => {
    const detail = makeSchoolUserDetail({
      ...TEACHER_USER,
      email: "m.ebelle@college-vogt.cm",
      phone: "+237 691 234 567",
      teachingClasses: [
        {
          classId: "cls-a",
          className: "Terminale C",
          subjects: [
            { id: "s1", name: "Mathématiques" },
            { id: "s2", name: "Sciences Physiques" },
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

    // Header
    await waitFor(() =>
      expect(screen.getByText("Utilisateurs")).toBeOnTheScreen(),
    );
    // Le nom apparaît dans le sous-titre du header et dans la carte profil
    expect(screen.getAllByText("Ebelle Marie").length).toBeGreaterThanOrEqual(
      1,
    );

    // Profil
    expect(screen.getByTestId("user-detail-profile")).toBeOnTheScreen();
    expect(screen.getByText("Actif")).toBeOnTheScreen();

    // Section enseignant
    await waitFor(() =>
      expect(screen.getByTestId("role-section-teacher")).toBeOnTheScreen(),
    );
    expect(screen.getByText("Terminale C")).toBeOnTheScreen();
    expect(screen.getByText("Mathématiques")).toBeOnTheScreen();
    expect(screen.getByText("Sciences Physiques")).toBeOnTheScreen();

    // Contact
    expect(screen.getByTestId("user-detail-contact")).toBeOnTheScreen();
    expect(screen.getByText("m.ebelle@college-vogt.cm")).toBeOnTheScreen();

    // API appelée une seule fois
    expect(mockUsersApi.get).toHaveBeenCalledWith(SLUG, TEACHER_USER.id);
    expect(mockUsersApi.get).toHaveBeenCalledTimes(1);
  });

  it("flux parent : section parent avec enfants et classes", async () => {
    const detail = makeSchoolUserDetail({
      ...PARENT_USER,
      children: [
        {
          id: "c1",
          firstName: "Cédric",
          lastName: "Atangana",
          className: "3e B",
        },
        {
          id: "c2",
          firstName: "Lucie",
          lastName: "Atangana",
          className: "5e A",
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
      expect(screen.getByTestId("role-section-parent")).toBeOnTheScreen(),
    );

    expect(screen.getByText("Atangana Cédric")).toBeOnTheScreen();
    expect(screen.getByText("3e B")).toBeOnTheScreen();
    expect(screen.getByText("Atangana Lucie")).toBeOnTheScreen();
    expect(screen.getByText("5e A")).toBeOnTheScreen();
  });

  it("flux élève : classe active + parents/tuteurs", async () => {
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
          firstName: "Brigitte",
          lastName: "Mballa",
          phone: "+237 655 000 000",
        },
        { id: "par-2", firstName: "Eric", lastName: "Mballa", phone: null },
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
      expect(screen.getByTestId("role-section-student")).toBeOnTheScreen(),
    );

    expect(screen.getByText("6e A")).toBeOnTheScreen();
    expect(screen.getByText("2025-2026")).toBeOnTheScreen();
    expect(screen.getByTestId("student-parents")).toBeOnTheScreen();
    expect(screen.getByText("Mballa Brigitte")).toBeOnTheScreen();
    expect(screen.getByText("+237 655 000 000")).toBeOnTheScreen();
    expect(screen.getByText("Mballa Eric")).toBeOnTheScreen();
  });

  it("flux admin : section admin présente", async () => {
    mockUsersApi.get.mockResolvedValueOnce(makeSchoolUserDetail(ADMIN_USER));

    render(
      <UserDetailModal
        user={ADMIN_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("role-section-school_admin")).toBeOnTheScreen(),
    );
    expect(screen.getByText("Rôle administratif")).toBeOnTheScreen();
  });

  it("flux multi-rôle TEACHER+PARENT : toutes les sections visibles", async () => {
    const multiUser = {
      ...TEACHER_USER,
      roles: ["TEACHER", "PARENT"] as SchoolRole[],
    };
    const detail = makeSchoolUserDetail({
      ...multiUser,
      teachingClasses: [
        {
          classId: "cls-1",
          className: "4e A",
          subjects: [{ id: "s1", name: "Français" }],
        },
      ],
      children: [
        { id: "c1", firstName: "Ange", lastName: "Ebelle", className: "6e C" },
      ],
    });
    mockUsersApi.get.mockResolvedValueOnce(detail);

    render(
      <UserDetailModal
        user={multiUser}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("role-section-teacher")).toBeOnTheScreen(),
    );
    expect(screen.getByTestId("role-section-parent")).toBeOnTheScreen();

    expect(screen.getByText("4e A")).toBeOnTheScreen();
    expect(screen.getByText("Français")).toBeOnTheScreen();
    expect(screen.getByText("Ebelle Ange")).toBeOnTheScreen();
    expect(screen.getByText("6e C")).toBeOnTheScreen();
  });

  it("flux staff avec fonctions : pills de fonctions affichées", async () => {
    const staffUser = {
      ...TEACHER_USER,
      id: "staff-1",
      roles: ["SCHOOL_STAFF"] as SchoolRole[],
    };
    const detail = makeSchoolUserDetail({
      ...staffUser,
      staffFunctions: [
        { id: "fn-1", name: "Bibliothécaire" },
        { id: "fn-2", name: "Agent d'entretien" },
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

    await waitFor(() =>
      expect(screen.getByTestId("role-section-staff")).toBeOnTheScreen(),
    );
    expect(screen.getByText("Bibliothécaire")).toBeOnTheScreen();
    expect(screen.getByText("Agent d'entretien")).toBeOnTheScreen();
  });

  it("la modale se réinitialise quand l'utilisateur change", async () => {
    const detail1 = makeSchoolUserDetail({
      ...TEACHER_USER,
      teachingClasses: [
        {
          classId: "cls-1",
          className: "3e A",
          subjects: [{ id: "s1", name: "SVT" }],
        },
      ],
    });
    const detail2 = makeSchoolUserDetail({
      ...PARENT_USER,
      children: [
        { id: "c1", firstName: "Lea", lastName: "Atangana", className: "5e B" },
      ],
    });
    mockUsersApi.get
      .mockResolvedValueOnce(detail1)
      .mockResolvedValueOnce(detail2);

    const { rerender } = render(
      <UserDetailModal
        user={TEACHER_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText("3e A")).toBeOnTheScreen());

    rerender(
      <UserDetailModal
        user={PARENT_USER}
        schoolSlug={SLUG}
        onClose={jest.fn()}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("role-section-parent")).toBeOnTheScreen(),
    );
    expect(screen.getByText("Atangana Lea")).toBeOnTheScreen();
    expect(mockUsersApi.get).toHaveBeenCalledTimes(2);
  });
});
