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
  it("liste les conditions de santé d'un élève, paginées par défaut (page=1, limit=20)", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    await healthApi.listConditions("college-vogt", "student-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/conditions?page=1&limit=20",
      {},
      true,
    );
  });

  it("liste les conditions avec recherche, filtres et pagination explicites", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 2,
      limit: 10,
      total: 0,
    });

    await healthApi.listConditions("college-vogt", "student-1", {
      page: 2,
      limit: 10,
      search: "arachide",
      filters: { type: "ALLERGY", alertLevel: "URGENT", active: true },
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/conditions?search=arachide&type=ALLERGY&alertLevel=URGENT&active=true&page=2&limit=10",
      {},
      true,
    );
  });

  it("met à jour une condition en PATCH JSON", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: "cond-1", active: false });

    await healthApi.updateCondition("college-vogt", "student-1", "cond-1", {
      type: "ALLERGY",
      alertLevel: "URGENT",
      label: "Allergie arachides",
      active: false,
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/conditions/cond-1",
      {
        method: "PATCH",
        body: JSON.stringify({
          type: "ALLERGY",
          alertLevel: "URGENT",
          label: "Allergie arachides",
          active: false,
        }),
      },
      true,
    );
  });

  it("récupère l'historique fusionné (soins + signalements), paginé par défaut", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    await healthApi.getHistory("college-vogt", "student-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/history?page=1&limit=20",
      {},
      true,
    );
  });

  it("récupère l'historique avec filtres origin/alertLevel/reportType", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    await healthApi.getHistory("college-vogt", "student-1", {
      filters: {
        alertLevel: "URGENT",
        origin: "REPORT",
        reportType: "ACCIDENT",
      },
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/history?alertLevel=URGENT&origin=REPORT&reportType=ACCIDENT&page=1&limit=20",
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

  it("modifie un soin en PATCH JSON", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: "care-1", summary: "Maj" });

    await healthApi.updateCareEvent("college-vogt", "student-1", "care-1", {
      summary: "Maj",
      alertLevel: "ATTENTION",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/health/care-events/care-1",
      {
        method: "PATCH",
        body: JSON.stringify({ summary: "Maj", alertLevel: "ATTENTION" }),
      },
      true,
    );
  });

  it("liste les élèves de l'école (santé), paginés par défaut", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    await healthApi.listSchoolStudents("college-vogt");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/health/students?page=1&limit=20",
      {},
      true,
    );
  });

  it("liste les élèves avec recherche, filtre classe et pagination explicites", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 2,
      limit: 10,
      total: 0,
    });

    await healthApi.listSchoolStudents("college-vogt", {
      page: 2,
      limit: 10,
      search: "mbele",
      filters: { classId: "class-1" },
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/health/students?search=mbele&classId=class-1&page=2&limit=10",
      {},
      true,
    );
  });

  it("liste les signalements de l'école (santé), paginés par défaut", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    await healthApi.listSchoolReports("college-vogt");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/health/reports?page=1&limit=20",
      {},
      true,
    );
  });

  it("liste les signalements avec recherche et filtres explicites", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    await healthApi.listSchoolReports("college-vogt", {
      search: "ateba",
      filters: {
        alertLevel: "URGENT",
        reportType: "ACCIDENT",
        acknowledged: false,
      },
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/health/reports?search=ateba&alertLevel=URGENT&reportType=ACCIDENT&acknowledged=false&page=1&limit=20",
      {},
      true,
    );
  });

  it("récupère les stats école (sans filtre)", async () => {
    mockApiFetch.mockResolvedValueOnce({ scope: "SCHOOL" });

    await healthApi.getSchoolStats("college-vogt");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/health/stats",
      {},
      true,
    );
  });

  it("récupère les stats filtrées par classe", async () => {
    mockApiFetch.mockResolvedValueOnce({ scope: "CLASS" });

    await healthApi.getSchoolStats("college-vogt", { classId: "class-1" });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/health/stats?classId=class-1",
      {},
      true,
    );
  });
});
