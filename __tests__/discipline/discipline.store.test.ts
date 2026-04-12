import { disciplineApi } from "../../src/api/discipline.api";
import { useDisciplineStore } from "../../src/store/discipline.store";
import {
  makeEventsByTypes,
  makeLifeEvent,
} from "../../test-utils/discipline.fixtures";

jest.mock("../../src/api/discipline.api");

const api = disciplineApi as jest.Mocked<typeof disciplineApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useDisciplineStore.getState().reset();
});

describe("discipline.store", () => {
  it("charge les evenements et met a jour l'etudiant actif", async () => {
    api.list.mockResolvedValueOnce(makeEventsByTypes(["ABSENCE", "RETARD"]));

    await useDisciplineStore
      .getState()
      .loadEvents("college-vogt", "student-1", { scope: "current" });

    expect(api.list).toHaveBeenCalledWith("college-vogt", "student-1", {
      scope: "current",
    });
    expect(useDisciplineStore.getState().activeStudentId).toBe("student-1");
    expect(useDisciplineStore.getState().getEvents("student-1")).toHaveLength(
      2,
    );
  });

  it("ne recharge pas un etudiant deja en cache", async () => {
    useDisciplineStore.setState({
      eventsMap: { "student-1": [makeLifeEvent()] },
    });

    await useDisciplineStore.getState().loadEvents("college-vogt", "student-1");

    expect(api.list).not.toHaveBeenCalled();
  });

  it("force un refresh meme si le cache existe", async () => {
    useDisciplineStore.setState({
      eventsMap: { "student-1": [makeLifeEvent({ id: "old-1" })] },
    });
    api.list.mockResolvedValueOnce([makeLifeEvent({ id: "fresh-1" })]);

    await useDisciplineStore
      .getState()
      .refreshEvents("college-vogt", "student-1");

    expect(api.list).toHaveBeenCalledTimes(1);
    expect(useDisciplineStore.getState().getEvents("student-1")[0]?.id).toBe(
      "fresh-1",
    );
  });

  it("reinitialise isLoading apres un echec de chargement", async () => {
    api.list.mockRejectedValueOnce(new Error("DISCIPLINE_DOWN"));

    await expect(
      useDisciplineStore.getState().loadEvents("college-vogt", "student-1"),
    ).rejects.toThrow("DISCIPLINE_DOWN");

    expect(useDisciplineStore.getState().isLoading).toBe(false);
  });

  it("reinitialise isRefreshing apres un echec de refresh", async () => {
    api.list.mockRejectedValueOnce(new Error("REFRESH_DISCIPLINE_DOWN"));

    await expect(
      useDisciplineStore.getState().refreshEvents("college-vogt", "student-1"),
    ).rejects.toThrow("REFRESH_DISCIPLINE_DOWN");

    expect(useDisciplineStore.getState().isRefreshing).toBe(false);
  });

  it("ajoute un evenement en tete de liste", () => {
    useDisciplineStore.setState({
      eventsMap: { "student-1": [makeLifeEvent({ id: "existing-1" })] },
    });

    useDisciplineStore
      .getState()
      .addEvent("student-1", makeLifeEvent({ id: "new-1" }));

    expect(
      useDisciplineStore
        .getState()
        .getEvents("student-1")
        .map((event) => event.id),
    ).toEqual(["new-1", "existing-1"]);
  });

  it("met a jour un evenement existant", () => {
    useDisciplineStore.setState({
      eventsMap: { "student-1": [makeLifeEvent({ id: "event-1" })] },
    });

    useDisciplineStore
      .getState()
      .updateEvent(
        "student-1",
        makeLifeEvent({ id: "event-1", reason: "Motif mis a jour" }),
      );

    expect(
      useDisciplineStore.getState().getEvents("student-1")[0]?.reason,
    ).toBe("Motif mis a jour");
  });

  it("retire un evenement", () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [
          makeLifeEvent({ id: "event-1" }),
          makeLifeEvent({ id: "event-2" }),
        ],
      },
    });

    useDisciplineStore.getState().removeEvent("student-1", "event-1");

    expect(useDisciplineStore.getState().getEvents("student-1")).toHaveLength(
      1,
    );
    expect(useDisciplineStore.getState().getEvents("student-1")[0]?.id).toBe(
      "event-2",
    );
  });

  it("invalide le cache d'un eleve", () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": [makeLifeEvent({ id: "event-1" })],
        "student-2": [makeLifeEvent({ id: "event-2", studentId: "student-2" })],
      },
    });

    useDisciplineStore.getState().invalidateStudent("student-1");

    expect(
      useDisciplineStore.getState().eventsMap["student-1"],
    ).toBeUndefined();
    expect(useDisciplineStore.getState().eventsMap["student-2"]).toHaveLength(
      1,
    );
  });

  it("calcule la synthese a partir des evenements du store", () => {
    useDisciplineStore.setState({
      eventsMap: {
        "student-1": makeEventsByTypes([
          "ABSENCE",
          "ABSENCE",
          "RETARD",
          "SANCTION",
        ]),
      },
    });

    expect(useDisciplineStore.getState().getSummary("student-1")).toMatchObject(
      {
        absences: 2,
        retards: 1,
        sanctions: 1,
        punitions: 0,
      },
    );
  });

  it("reset remet le store a zero", () => {
    useDisciplineStore.setState({
      eventsMap: { "student-1": [makeLifeEvent()] },
      activeStudentId: "student-1",
      isLoading: true,
      isRefreshing: true,
      typeFilter: "ABSENCE",
    });

    useDisciplineStore.getState().reset();

    expect(useDisciplineStore.getState()).toMatchObject({
      eventsMap: {},
      activeStudentId: null,
      isLoading: false,
      isRefreshing: false,
      typeFilter: null,
    });
  });
});
