import { disciplineApi } from "../../src/api/discipline.api";
import { apiFetch } from "../../src/api/client";
import { makeLifeEvent } from "../../test-utils/discipline.fixtures";

jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("disciplineApi", () => {
  it("liste les evenements avec les filtres et les valeurs par defaut", async () => {
    mockApiFetch.mockResolvedValueOnce([makeLifeEvent()]);

    await disciplineApi.list("college-vogt", "student-1", {
      type: "ABSENCE",
      schoolYearId: "year-1",
      classId: "class-1",
      limit: 50,
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/life-events?scope=current&type=ABSENCE&schoolYearId=year-1&classId=class-1&limit=50",
      {},
      true,
    );
  });

  it("applique scope=current et limit=200 par defaut", async () => {
    mockApiFetch.mockResolvedValueOnce([]);

    await disciplineApi.list("college-vogt", "student-1");

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/life-events?scope=current&limit=200",
      {},
      true,
    );
  });

  it("cree un evenement en POST JSON", async () => {
    mockApiFetch.mockResolvedValueOnce(makeLifeEvent({ id: "created-1" }));

    await disciplineApi.create("college-vogt", "student-1", {
      type: "RETARD",
      reason: "Retard au portail",
      occurredAt: "2026-04-09T08:30:00.000Z",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/life-events",
      {
        method: "POST",
        body: JSON.stringify({
          type: "RETARD",
          reason: "Retard au portail",
          occurredAt: "2026-04-09T08:30:00.000Z",
        }),
      },
      true,
    );
  });

  it("met a jour un evenement en PATCH JSON", async () => {
    mockApiFetch.mockResolvedValueOnce(makeLifeEvent({ id: "event-1" }));

    await disciplineApi.update("college-vogt", "student-1", "event-1", {
      comment: "Mis a jour",
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/life-events/event-1",
      {
        method: "PATCH",
        body: JSON.stringify({ comment: "Mis a jour" }),
      },
      true,
    );
  });

  it("supprime un evenement en DELETE", async () => {
    mockApiFetch.mockResolvedValueOnce({ id: "event-1", deleted: true });

    await expect(
      disciplineApi.remove("college-vogt", "student-1", "event-1"),
    ).resolves.toBeUndefined();

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/students/student-1/life-events/event-1",
      { method: "DELETE" },
      true,
    );
  });
});
