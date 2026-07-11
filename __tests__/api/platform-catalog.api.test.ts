import { platformCatalogApi } from "../../src/api/platform-catalog.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  BASE_URL: "http://localhost:3001/api",
  apiFetch: jest.fn(),
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue("token"),
  },
}));

describe("platformCatalogApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("liste les matières nationales", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([]);

    await platformCatalogApi.listNationalSubjects();

    expect(apiFetch).toHaveBeenCalledWith("/system/subjects", {}, true);
  });

  it("crée une matière nationale", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ id: "subject-1" });

    await platformCatalogApi.createNationalSubject({
      code: "MATH",
      name: "Mathematiques",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/system/subjects",
      {
        method: "POST",
        body: JSON.stringify({ code: "MATH", name: "Mathematiques" }),
      },
      true,
    );
  });

  it("supprime une matière nationale", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ success: true });

    await platformCatalogApi.deleteNationalSubject("subject-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/system/subjects/subject-1",
      { method: "DELETE" },
      true,
    );
  });

  it("liste les niveaux académiques nationaux", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([]);

    await platformCatalogApi.listNationalAcademicLevels();

    expect(apiFetch).toHaveBeenCalledWith("/system/academic-levels", {}, true);
  });

  it("crée un niveau académique national", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ id: "level-1" });

    await platformCatalogApi.createNationalAcademicLevel({
      code: "6EME",
      label: "6eme",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/system/academic-levels",
      {
        method: "POST",
        body: JSON.stringify({ code: "6EME", label: "6eme" }),
      },
      true,
    );
  });

  it("crée un niveau académique national avec cycle et languageSystem", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ id: "level-en-1" });

    await platformCatalogApi.createNationalAcademicLevel({
      code: "FORM1",
      label: "Form 1",
      cycle: "SECONDARY",
      languageSystem: "ANGLOPHONE",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/system/academic-levels",
      {
        method: "POST",
        body: JSON.stringify({
          code: "FORM1",
          label: "Form 1",
          cycle: "SECONDARY",
          languageSystem: "ANGLOPHONE",
        }),
      },
      true,
    );
  });

  it("supprime un niveau académique national", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ success: true });

    await platformCatalogApi.deleteNationalAcademicLevel("level-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/system/academic-levels/level-1",
      { method: "DELETE" },
      true,
    );
  });

  it("liste les curriculums nationaux", async () => {
    (apiFetch as jest.Mock).mockResolvedValue([]);

    await platformCatalogApi.listNationalCurriculums();

    expect(apiFetch).toHaveBeenCalledWith("/system/curriculums", {}, true);
  });

  it("crée un curriculum national", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ id: "curriculum-1" });

    await platformCatalogApi.createNationalCurriculum({
      academicLevelId: "level-1",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/system/curriculums",
      {
        method: "POST",
        body: JSON.stringify({ academicLevelId: "level-1" }),
      },
      true,
    );
  });

  it("supprime un curriculum national", async () => {
    (apiFetch as jest.Mock).mockResolvedValue({ success: true });

    await platformCatalogApi.deleteNationalCurriculum("curriculum-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/system/curriculums/curriculum-1",
      { method: "DELETE" },
      true,
    );
  });
});
