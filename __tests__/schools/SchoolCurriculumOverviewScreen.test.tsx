import React from "react";
import { render, screen } from "@testing-library/react-native";
import { SchoolCurriculumOverviewScreen } from "../../src/components/schools/SchoolCurriculumOverviewScreen";
import { schoolsApi } from "../../src/api/schools.api";
import type { SchoolDetails } from "../../src/types/schools.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/schools.api");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
    push: jest.fn(),
  }),
  useLocalSearchParams: () => ({ schoolId: "school-2" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: null,
    user: {
      id: "super-admin-1",
      firstName: "Alice",
      lastName: "Ngassa",
      role: "SUPER_ADMIN",
      activeRole: "SUPER_ADMIN",
      schoolName: null,
    },
    logout: jest.fn(),
  }),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockSchoolsApi = schoolsApi as jest.Mocked<typeof schoolsApi>;

function makeDetails(overrides?: Partial<SchoolDetails>): SchoolDetails {
  return {
    id: "school-2",
    slug: "lycee-du-poisson-d-avril",
    name: "Lycée du Poisson d'Avril",
    country: "Cameroun",
    region: "Centre",
    city: "Yaoundé",
    cycle: "SECONDARY",
    languageSystem: "FRANCOPHONE",
    logoUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    academicYear: null,
    tracks: [{ id: "track-1", code: "S", label: "Scientifique" }],
    curriculums: [
      {
        id: "curriculum-1",
        name: "Programme Terminale C",
        academicLevelLabel: "Terminale",
        trackLabel: "Scientifique",
      },
    ],
    stats: {
      usersCount: 0,
      classesCount: 0,
      studentsCount: 0,
      teachersCount: 0,
      gradesCount: 0,
    },
    roleBreakdown: { staff: 0, teachers: 0, parents: 0, students: 0 },
    schoolAdmins: [],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SchoolCurriculumOverviewScreen", () => {
  it("charge et affiche les filières et curriculums de l'école demandée, en lecture seule", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(makeDetails());

    render(<SchoolCurriculumOverviewScreen />);

    expect(
      await screen.findByTestId("school-curriculum-overview-tracks"),
    ).toBeTruthy();
    expect(mockSchoolsApi.getSchoolDetails).toHaveBeenCalledWith("school-2");
    expect(
      screen.getByTestId("school-curriculum-overview-tracks"),
    ).toHaveTextContent(/Scientifique/);
    expect(
      screen.getByTestId("school-curriculum-overview-curriculums"),
    ).toHaveTextContent(/Programme Terminale C/);
  });

  it("affiche un état vide quand l'école n'a ni filière ni curriculum", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(
      makeDetails({ tracks: [], curriculums: [] }),
    );

    render(<SchoolCurriculumOverviewScreen />);

    expect(
      await screen.findByTestId("school-curriculum-overview-tracks"),
    ).toHaveTextContent(/Aucune filière/);
    expect(
      screen.getByTestId("school-curriculum-overview-curriculums"),
    ).toHaveTextContent(/Aucun curriculum/);
  });

  it("affiche un état d'erreur si le chargement échoue", async () => {
    mockSchoolsApi.getSchoolDetails.mockRejectedValue(
      new Error("network down"),
    );

    render(<SchoolCurriculumOverviewScreen />);

    expect(
      await screen.findByTestId("school-curriculum-overview-error-banner"),
    ).toBeTruthy();
  });
});
