import { healthApi } from "../../src/api/health.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("healthApi", () => {
  it("liste les conditions de santé d'un élève", async () => {
    mockApiFetch.mockResolvedValueOnce([]);

    await healthApi.listConditions("college-vogt", "student-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/conditions",
      {},
      true,
    );
  });

  it("crée une condition en POST JSON", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: "cond-1" });

    await healthApi.createCondition("college-vogt", "student-1", {
      type: "ALLERGY",
      alertLevel: "URGENT",
      label: "Allergie arachides",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/conditions",
      {
        method: "POST",
        body: JSON.stringify({
          type: "ALLERGY",
          alertLevel: "URGENT",
          label: "Allergie arachides",
        }),
      },
      true,
    );
  });

  it("crée un soin en POST JSON", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: "care-1" });

    await healthApi.createCareEvent("college-vogt", "student-1", {
      summary: "Chute dans la cour",
      alertLevel: "INFO",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/care-events",
      {
        method: "POST",
        body: JSON.stringify({
          summary: "Chute dans la cour",
          alertLevel: "INFO",
        }),
      },
      true,
    );
  });

  it("crée un signalement en POST JSON", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: "report-1" });

    await healthApi.createReport("college-vogt", "student-1", {
      type: "ACCIDENT",
      alertLevel: "ATTENTION",
      description: "Crise d'asthme hier soir",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/reports",
      {
        method: "POST",
        body: JSON.stringify({
          type: "ACCIDENT",
          alertLevel: "ATTENTION",
          description: "Crise d'asthme hier soir",
        }),
      },
      true,
    );
  });

  it("acquitte un signalement en POST", async () => {
    mockApiFetch.mockResolvedValueOnce({
      id: "report-1",
      acknowledgedAt: "now",
    });

    await healthApi.acknowledgeReport("college-vogt", "student-1", "report-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/reports/report-1/acknowledge",
      { method: "POST" },
      true,
    );
  });

  it("récupère la synthèse d'urgence", async () => {
    mockApiFetch.mockResolvedValueOnce({
      student: { id: "student-1", firstName: "Nathan", lastName: "Mbele" },
      conditions: [],
      emergencyContacts: [],
    });

    await healthApi.getUrgencySummary("college-vogt", "student-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/urgence",
      {},
      true,
    );
  });
});
