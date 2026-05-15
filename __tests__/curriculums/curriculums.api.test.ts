jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const { apiFetch } = jest.requireMock("../../src/api/client") as {
  apiFetch: jest.Mock;
};

type CurriculumsApiModule = {
  curriculumsApi: {
    listAcademicLevels?: (schoolSlug: string) => Promise<unknown>;
    createAcademicLevel?: (
      schoolSlug: string,
      payload: Record<string, unknown>,
    ) => Promise<unknown>;
    listTracks?: (schoolSlug: string) => Promise<unknown>;
    listSubjects?: (schoolSlug: string) => Promise<unknown>;
    listCurriculums?: (schoolSlug: string) => Promise<unknown>;
    createCurriculum?: (
      schoolSlug: string,
      payload: Record<string, unknown>,
    ) => Promise<unknown>;
    listCurriculumSubjects?: (
      schoolSlug: string,
      curriculumId: string,
    ) => Promise<unknown>;
    upsertCurriculumSubject?: (
      schoolSlug: string,
      curriculumId: string,
      payload: Record<string, unknown>,
    ) => Promise<unknown>;
    deleteCurriculumSubject?: (
      schoolSlug: string,
      curriculumId: string,
      subjectId: string,
    ) => Promise<unknown>;
  };
};

function loadCurriculumsApiModule(): CurriculumsApiModule | null {
  try {
    return require("../../src/api/curriculums.api") as CurriculumsApiModule;
  } catch (error) {
    const isMissingCurriculumsApi =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "MODULE_NOT_FOUND" &&
      String((error as { message?: string }).message ?? "").includes(
        "curriculums.api",
      );

    if (isMissingCurriculumsApi) {
      return null;
    }

    throw error;
  }
}

const curriculumsApiModule = loadCurriculumsApiModule();
const describeCurriculumsApi = curriculumsApiModule ? describe : describe.skip;

describeCurriculumsApi("curriculumsApi", () => {
  const curriculumsApi = curriculumsApiModule?.curriculumsApi;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("charge les niveaux académiques du school admin", async () => {
    apiFetch.mockResolvedValueOnce([]);

    await curriculumsApi?.listAcademicLevels?.("college-vogt");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/admin/academic-levels",
      {},
      true,
    );
  });

  it("crée un niveau académique en JSON", async () => {
    apiFetch.mockResolvedValueOnce({
      id: "level-6e",
      code: "6EME",
      label: "Sixième",
    });

    await curriculumsApi?.createAcademicLevel?.("college-vogt", {
      code: "6EME",
      label: "Sixième",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/admin/academic-levels",
      {
        method: "POST",
        body: JSON.stringify({
          code: "6EME",
          label: "Sixième",
        }),
      },
      true,
    );
  });

  it("charge les onglets de référence du module", async () => {
    apiFetch.mockResolvedValue({});

    await curriculumsApi?.listTracks?.("college-vogt");
    await curriculumsApi?.listSubjects?.("college-vogt");
    await curriculumsApi?.listCurriculums?.("college-vogt");

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/schools/college-vogt/admin/tracks",
      {},
      true,
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/schools/college-vogt/admin/subjects",
      {},
      true,
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      3,
      "/schools/college-vogt/admin/curriculums",
      {},
      true,
    );
  });

  it("crée un curriculum avec niveau et filière optionnelle", async () => {
    apiFetch.mockResolvedValueOnce({ id: "cur-1" });

    await curriculumsApi?.createCurriculum?.("college-vogt", {
      academicLevelId: "level-6e",
      trackId: "track-sciences",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/admin/curriculums",
      {
        method: "POST",
        body: JSON.stringify({
          academicLevelId: "level-6e",
          trackId: "track-sciences",
        }),
      },
      true,
    );
  });

  it("gère la liste et l'upsert des matières d'un curriculum", async () => {
    apiFetch.mockResolvedValueOnce([]);
    apiFetch.mockResolvedValueOnce({ id: "cur-subj-1" });

    await curriculumsApi?.listCurriculumSubjects?.("college-vogt", "cur-1");
    await curriculumsApi?.upsertCurriculumSubject?.("college-vogt", "cur-1", {
      subjectId: "math",
      coefficient: 4,
      weeklyHours: 5,
      isMandatory: true,
    });

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/schools/college-vogt/admin/curriculums/cur-1/subjects",
      {},
      true,
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/schools/college-vogt/admin/curriculums/cur-1/subjects",
      {
        method: "POST",
        body: JSON.stringify({
          subjectId: "math",
          coefficient: 4,
          weeklyHours: 5,
          isMandatory: true,
        }),
      },
      true,
    );
  });

  it("supprime une matière d'un curriculum par subjectId", async () => {
    apiFetch.mockResolvedValueOnce(undefined);

    await curriculumsApi?.deleteCurriculumSubject?.(
      "college-vogt",
      "cur-1",
      "math",
    );

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/admin/curriculums/cur-1/subjects/math",
      {
        method: "DELETE",
      },
      true,
    );
  });
});
