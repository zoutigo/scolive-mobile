import { teacherClassNavApi } from "../../src/api/teacher-class-nav.api";

jest.mock("../../src/api/client", () => {
  const actual = jest.requireActual("../../src/api/client");
  return {
    ...actual,
    apiFetch: jest.fn(),
  };
});

const { apiFetch } = jest.requireMock("../../src/api/client") as {
  apiFetch: jest.Mock;
};

describe("teacherClassNavApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("charge et normalise les classes enseignant depuis student-grades/context", async () => {
    apiFetch.mockResolvedValueOnce({
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      assignments: [
        {
          classId: "class-1",
          className: "6e C",
          schoolYearId: "sy1",
          subjectId: "math",
          subjectName: "Mathématiques",
        },
        {
          classId: "class-1",
          className: "6e C",
          schoolYearId: "sy1",
          subjectId: "hist",
          subjectName: "Histoire",
        },
      ],
      students: [
        {
          classId: "class-1",
          className: "6e C",
          studentId: "stu-1",
          studentFirstName: "Lisa",
          studentLastName: "Ntamack",
        },
      ],
    });

    const payload = await teacherClassNavApi.getClassOptions(
      "college-vogt",
      "sy1",
    );

    expect(apiFetch).toHaveBeenCalledWith(
      "/schools/college-vogt/student-grades/context?schoolYearId=sy1",
      {},
      true,
    );
    expect(payload.classes).toEqual([
      {
        classId: "class-1",
        className: "6e C",
        schoolYearId: "sy1",
        schoolYearLabel: "2025-2026",
        subjects: [
          { id: "hist", name: "Histoire" },
          { id: "math", name: "Mathématiques" },
        ],
        studentCount: 1,
      },
    ]);
  });
});
