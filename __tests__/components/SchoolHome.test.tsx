import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SchoolHome } from "../../src/components/home/SchoolHome";
import { dashboardApi } from "../../src/api/dashboard.api";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../../src/api/dashboard.api", () => ({
  dashboardApi: { getSchoolKpis: jest.fn() },
}));

const mockGetSchoolKpis = dashboardApi.getSchoolKpis as jest.Mock;

const schoolUser: AuthUser = {
  id: "u1",
  firstName: "Valery",
  lastName: "Mbele",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
  profileCompleted: true,
  role: "SCHOOL_ADMIN",
  activeRole: "SCHOOL_ADMIN",
};

describe("SchoolHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSchoolKpis.mockResolvedValue({
      academicYear: { id: "year-1", label: "2025-2026" },
      classesCount: 18,
      studentsCount: 420,
      teachersCount: 32,
      subjectsCount: 12,
      parentsCount: 380,
      roomsCount: 15,
    });
  });

  it("affiche le titre du tableau de bord avec l'année scolaire active et les valeurs des KPI", async () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    expect(mockGetSchoolKpis).toHaveBeenCalledWith("college-vogt");
    await waitFor(() => {
      expect(screen.getByText("Tableau de bord 2025-2026")).toBeTruthy();
    });
    expect(screen.getByText("18")).toBeTruthy();
    expect(screen.getByText("420")).toBeTruthy();
    expect(screen.getByText("32")).toBeTruthy();
    expect(screen.getByText("380")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });

  it("navigue vers le fil depuis la navigation rapide", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Fil d'actualité"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/feed");
  });

  it("navigue vers la messagerie depuis la navigation rapide", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Messagerie"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("navigue vers les notes depuis la navigation rapide", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Notes"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/notes");
  });

  it("navigue vers les utilisateurs depuis la navigation rapide (remplace l'ancien raccourci Élèves)", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Utilisateurs"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/users");
  });

  it("navigue vers les inscriptions depuis la navigation rapide", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Inscriptions"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/inscriptions");
  });

  it("navigue vers chaque module depuis les cartes KPI", async () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    await waitFor(() => {
      expect(screen.getByText("18")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Classes"));
    expect(mockPush).toHaveBeenLastCalledWith("/(home)/admin-classes");

    fireEvent.press(screen.getByText("Élèves"));
    expect(mockPush).toHaveBeenLastCalledWith("/(home)/users");

    fireEvent.press(screen.getByText("Enseignants"));
    expect(mockPush).toHaveBeenLastCalledWith("/(home)/teachers");

    fireEvent.press(screen.getByText("Parents"));
    expect(mockPush).toHaveBeenLastCalledWith("/(home)/users");

    fireEvent.press(screen.getByText("Matières"));
    expect(mockPush).toHaveBeenLastCalledWith("/(home)/matieres");

    fireEvent.press(screen.getByText("Salles"));
    expect(mockPush).toHaveBeenLastCalledWith("/(home)/salles");
  });
});
