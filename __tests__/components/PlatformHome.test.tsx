import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { PlatformHome } from "../../src/components/home/PlatformHome";
import { platformIndicatorsApi } from "../../src/api/platform-indicators.api";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("../../src/api/platform-indicators.api", () => ({
  platformIndicatorsApi: { getIndicators: jest.fn() },
}));

const mockGetIndicators = platformIndicatorsApi.getIndicators as jest.Mock;

const superAdminUser: AuthUser = {
  id: "u1",
  firstName: "Ada",
  lastName: "Admin",
  platformRoles: ["SUPER_ADMIN"],
  memberships: [],
  profileCompleted: true,
  role: "SUPER_ADMIN",
  activeRole: "SUPER_ADMIN",
};

const indicatorsFixture = {
  schoolsCount: 12,
  usersCount: 340,
  studentsCount: 250,
  teachersCount: 40,
  gradesCount: 1000,
  adminsCount: 3,
  schoolAdminsCount: 12,
  resources: {
    assessments: {
      withoutStatement: 5,
      withoutCorrection: 8,
      statementsToApprove: 2,
      correctionsToApprove: 1,
    },
    exams: {
      withoutStatement: 3,
      withoutCorrection: 6,
      statementsToApprove: 4,
      correctionsToApprove: 7,
    },
  },
};

describe("PlatformHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche les valeurs des indicateurs plateforme une fois chargées", async () => {
    mockGetIndicators.mockResolvedValue(indicatorsFixture);

    render(<PlatformHome user={superAdminUser} />);

    expect(mockGetIndicators).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText("12")).toBeTruthy();
    });
    expect(screen.getByText("340")).toBeTruthy();
    expect(screen.getByText("250")).toBeTruthy();
  });

  it("affiche les compteurs de ressources pour les devoirs et les examens", async () => {
    mockGetIndicators.mockResolvedValue(indicatorsFixture);

    render(<PlatformHome user={superAdminUser} />);

    await waitFor(() => {
      expect(screen.getByText("Devoirs")).toBeTruthy();
    });
    expect(screen.getByText("Examens")).toBeTruthy();

    // Assessments: 5 / 8 / 2 / 1
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
    // Exams: 3 / 6 / 4 / 7
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("6")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();

    expect(screen.getAllByText("Sans énoncé")).toHaveLength(2);
    expect(screen.getAllByText("Sans corrigé")).toHaveLength(2);
    expect(screen.getAllByText("Énoncés à approuver")).toHaveLength(2);
    expect(screen.getAllByText("Corrigés à approuver")).toHaveLength(2);
  });

  it("affiche des tirets tant que les indicateurs ne sont pas encore chargés", () => {
    mockGetIndicators.mockReturnValue(new Promise(() => {}));

    render(<PlatformHome user={superAdminUser} />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("reste sur des tirets si le chargement des indicateurs échoue", async () => {
    mockGetIndicators.mockRejectedValue(new Error("network error"));

    render(<PlatformHome user={superAdminUser} />);

    await waitFor(() => {
      expect(mockGetIndicators).toHaveBeenCalledTimes(1);
    });
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
