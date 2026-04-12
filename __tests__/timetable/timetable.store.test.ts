import { timetableApi } from "../../src/api/timetable.api";
import { useTimetableStore } from "../../src/store/timetable.store";

jest.mock("../../src/api/timetable.api");

const api = timetableApi as jest.Mocked<typeof timetableApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useTimetableStore.getState().reset();
});

describe("timetable.store", () => {
  it("charge l'emploi du temps parent et alimente le store", async () => {
    api.getMyTimetable.mockResolvedValueOnce({
      student: { id: "stu-1", firstName: "Lisa", lastName: "Ntamack" },
      class: {
        id: "class-1",
        name: "6e A",
        schoolYearId: "sy1",
        academicLevelId: null,
      },
      slots: [],
      oneOffSlots: [],
      slotExceptions: [],
      occurrences: [],
      calendarEvents: [],
      subjectStyles: [],
    });

    await useTimetableStore
      .getState()
      .loadMyTimetable("college-vogt", { childId: "stu-1" });

    expect(api.getMyTimetable).toHaveBeenCalledWith("college-vogt", {
      childId: "stu-1",
    });
    expect(useTimetableStore.getState().myTimetable?.student.id).toBe("stu-1");
  });

  it("charge les classes accessibles", async () => {
    api.getClassOptions.mockResolvedValueOnce({
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      classes: [
        {
          classId: "class-1",
          className: "6e A",
          schoolYearId: "sy1",
          schoolYearLabel: "2025-2026",
          subjects: [{ id: "math", name: "Maths" }],
          studentCount: 12,
        },
      ],
    });

    await useTimetableStore.getState().loadClassOptions("college-vogt", "sy1");

    expect(useTimetableStore.getState().classOptions?.classes).toHaveLength(1);
  });

  it("remonte le message d'erreur backend et remet isSubmitting à false", async () => {
    api.createRecurringSlot.mockRejectedValueOnce(
      new Error("Conflit enseignant"),
    );

    await expect(
      useTimetableStore
        .getState()
        .createRecurringSlot("college-vogt", "class-1", {
          weekday: 1,
          startMinute: 450,
          endMinute: 510,
          subjectId: "math",
          teacherUserId: "t1",
        }),
    ).rejects.toThrow("Conflit enseignant");

    expect(useTimetableStore.getState().errorMessage).toBe(
      "Conflit enseignant",
    );
    expect(useTimetableStore.getState().isSubmitting).toBe(false);
  });
});
