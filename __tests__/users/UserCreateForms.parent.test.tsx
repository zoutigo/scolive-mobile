/**
 * Tests unitaires : ParentCreateFormContent — recherche d'élève
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ParentCreateFormContent } from "../../src/components/users/UserCreateForms";
import { familyApi } from "../../src/api/family.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/family.api");

const mockFamilyApi = familyApi as jest.Mocked<typeof familyApi>;
const SLUG = "college-vogt";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ParentCreateFormContent — recherche d'élève", () => {
  it("affiche les résultats de recherche avec nom, prénom et classe", async () => {
    mockFamilyApi.listAdminStudents.mockResolvedValue({
      students: [
        {
          id: "stu-1",
          firstName: "Amina",
          lastName: "Fouda",
          currentEnrollment: {
            id: "enr-1",
            class: { id: "cls-1", name: "6ème A" },
            schoolYear: { id: "sy-1", label: "2025-2026" },
          },
        },
      ],
      total: 1,
      page: 1,
      hasMore: false,
    });

    render(
      <ParentCreateFormContent
        schoolSlug={SLUG}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("users-create-parent-student-search"),
      "Fouda",
    );

    await waitFor(() =>
      expect(mockFamilyApi.listAdminStudents).toHaveBeenCalledWith(SLUG, {
        search: "Fouda",
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("users-create-parent-student-option-stu-1"),
      ).toBeOnTheScreen(),
    );
    expect(screen.getByText("Fouda Amina")).toBeOnTheScreen();
    expect(screen.getByText("6ème A")).toBeOnTheScreen();
  });

  it("sélectionne un élève trouvé et le fixe comme studentId du formulaire", async () => {
    mockFamilyApi.listAdminStudents.mockResolvedValue({
      students: [
        {
          id: "stu-2",
          firstName: "Paul",
          lastName: "Biya",
          currentEnrollment: null,
        },
      ],
      total: 1,
      page: 1,
      hasMore: false,
    });
    const onSubmit = jest.fn();

    render(
      <ParentCreateFormContent
        schoolSlug={SLUG}
        onCancel={jest.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("users-create-parent-student-search"),
      "Biya",
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("users-create-parent-student-option-stu-2"),
      ).toBeOnTheScreen(),
    );

    fireEvent.press(
      screen.getByTestId("users-create-parent-student-option-stu-2"),
    );

    expect(
      screen.getByTestId("users-create-parent-student-selected"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Biya Paul")).toBeOnTheScreen();
  });

  it("affiche un message quand la recherche ne donne aucun résultat", async () => {
    mockFamilyApi.listAdminStudents.mockResolvedValue({
      students: [],
      total: 0,
      page: 1,
      hasMore: false,
    });

    render(
      <ParentCreateFormContent
        schoolSlug={SLUG}
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("users-create-parent-student-search"),
      "Introuvable",
    );

    await waitFor(() =>
      expect(mockFamilyApi.listAdminStudents).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(screen.getByText(/Aucun élève trouvé/i)).toBeOnTheScreen(),
    );
  });
});
