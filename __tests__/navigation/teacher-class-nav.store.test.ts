import { useTeacherClassNavStore } from "../../src/store/teacher-class-nav.store";

jest.mock("../../src/api/teacher-class-nav.api", () => ({
  teacherClassNavApi: {
    getClassOptions: jest.fn(),
  },
}));

const { teacherClassNavApi } = jest.requireMock(
  "../../src/api/teacher-class-nav.api",
) as {
  teacherClassNavApi: Record<string, jest.Mock>;
};

describe("useTeacherClassNavStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTeacherClassNavStore.getState().reset();
  });

  it("charge la source canonique des classes enseignant", async () => {
    teacherClassNavApi.getClassOptions.mockResolvedValueOnce({
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      classes: [
        {
          classId: "class-1",
          className: "6e C",
          schoolYearId: "sy1",
          schoolYearLabel: "2025-2026",
          subjects: [{ id: "math", name: "Mathématiques" }],
          studentCount: 12,
        },
      ],
    });

    await useTeacherClassNavStore
      .getState()
      .loadClassOptions("college-vogt", "sy1");

    expect(teacherClassNavApi.getClassOptions).toHaveBeenCalledWith(
      "college-vogt",
      "sy1",
    );
    expect(
      useTeacherClassNavStore.getState().classOptions?.classes[0],
    ).toMatchObject({
      classId: "class-1",
      className: "6e C",
    });
  });

  it("expose une erreur claire si le chargement échoue", async () => {
    teacherClassNavApi.getClassOptions.mockRejectedValueOnce(
      new Error("Erreur API"),
    );

    await expect(
      useTeacherClassNavStore
        .getState()
        .loadClassOptions("college-vogt", "sy1"),
    ).rejects.toThrow("Erreur API");

    expect(useTeacherClassNavStore.getState().errorMessage).toBe("Erreur API");
  });
});
