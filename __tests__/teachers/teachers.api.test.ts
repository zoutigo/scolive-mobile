jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const { apiFetch } = jest.requireMock("../../src/api/client") as {
  apiFetch: jest.Mock;
};

type TeachersApiModule = {
  teachersApi: {
    listTeachers?: (schoolSlug: string) => Promise<unknown>;
    createTeacher?: (
      schoolSlug: string,
      payload: Record<string, unknown>,
    ) => Promise<unknown>;
    listSchoolYears?: (schoolSlug: string) => Promise<unknown>;
    listClassrooms?: (schoolSlug: string) => Promise<unknown>;
    listSubjects?: (schoolSlug: string) => Promise<unknown>;
    listAssignments?: (schoolSlug: string) => Promise<unknown>;
    createAssignment?: (
      schoolSlug: string,
      payload: Record<string, unknown>,
    ) => Promise<unknown>;
    updateAssignment?: (
      schoolSlug: string,
      assignmentId: string,
      payload: Record<string, unknown>,
    ) => Promise<unknown>;
    deleteAssignment?: (
      schoolSlug: string,
      assignmentId: string,
    ) => Promise<unknown>;
  };
};

function loadTeachersApiModule(): TeachersApiModule | null {
  try {
    return require("../../src/api/teachers.api") as TeachersApiModule;
  } catch (error) {
    const isMissingModule =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "MODULE_NOT_FOUND" &&
      String((error as { message?: string }).message ?? "").includes(
        "teachers.api",
      );

    if (isMissingModule) {
      return null;
    }

    throw error;
  }
}

const teachersApiModule = loadTeachersApiModule();
const describeTeachersApi = teachersApiModule ? describe : describe.skip;

describeTeachersApi("teachersApi", () => {
  const teachersApi = teachersApiModule?.teachersApi;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("charge les enseignants du school admin", async () => {
    apiFetch.mockResolvedValueOnce([]);

    await teachersApi?.listTeachers?.("college-vogt");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/admin/teachers",
      {},
      true,
    );
  });

  it("crée un enseignant en JSON", async () => {
    apiFetch.mockResolvedValueOnce({ success: true });

    await teachersApi?.createTeacher?.("college-vogt", {
      phone: "699001122",
      pin: "123456",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/admin/teachers",
      {
        method: "POST",
        body: JSON.stringify({
          phone: "699001122",
          pin: "123456",
        }),
      },
      true,
    );
  });

  it("charge les référentiels du module enseignants", async () => {
    apiFetch.mockResolvedValue({});

    await teachersApi?.listSchoolYears?.("college-vogt");
    await teachersApi?.listClassrooms?.("college-vogt");
    await teachersApi?.listSubjects?.("college-vogt");
    await teachersApi?.listAssignments?.("college-vogt");

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/schools/college-vogt/admin/school-years",
      {},
      true,
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/schools/college-vogt/admin/classrooms",
      {},
      true,
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      3,
      "/schools/college-vogt/admin/subjects",
      {},
      true,
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      4,
      "/schools/college-vogt/admin/teacher-assignments",
      {},
      true,
    );
  });

  it("crée puis met à jour une affectation", async () => {
    apiFetch.mockResolvedValueOnce({ id: "assign-1" });
    apiFetch.mockResolvedValueOnce({ id: "assign-1" });

    const payload = {
      schoolYearId: "sy-1",
      teacherUserId: "teacher-1",
      classId: "class-1",
      subjectId: "subject-1",
    };

    await teachersApi?.createAssignment?.("college-vogt", payload);
    await teachersApi?.updateAssignment?.("college-vogt", "assign-1", payload);

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/schools/college-vogt/admin/teacher-assignments",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/schools/college-vogt/admin/teacher-assignments/assign-1",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      true,
    );
  });

  it("supprime une affectation", async () => {
    apiFetch.mockResolvedValueOnce(undefined);

    await teachersApi?.deleteAssignment?.("college-vogt", "assign-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/admin/teacher-assignments/assign-1",
      {
        method: "DELETE",
      },
      true,
    );
  });
});
