import {
  buildTimetableClassOptions,
  groupOccurrencesByDate,
  minuteToTimeLabel,
  timeLabelToMinute,
} from "../../src/utils/timetable";

describe("timetable utils", () => {
  it("convertit correctement les minutes en heure texte", () => {
    expect(minuteToTimeLabel(450)).toBe("07:30");
    expect(minuteToTimeLabel(600)).toBe("10:00");
  });

  it("parse correctement une heure HH:MM", () => {
    expect(timeLabelToMinute("07:30")).toBe(450);
    expect(timeLabelToMinute("24:00")).toBeNull();
    expect(timeLabelToMinute("abc")).toBeNull();
  });

  it("groupe les occurrences par date et trie les créneaux", () => {
    const grouped = groupOccurrencesByDate([
      {
        id: "b",
        source: "RECURRING",
        status: "PLANNED",
        occurrenceDate: "2026-04-15",
        weekday: 3,
        startMinute: 600,
        endMinute: 660,
        room: "B2",
        reason: null,
        subject: { id: "math", name: "Maths" },
        teacherUser: { id: "t1", firstName: "Paul", lastName: "Manga" },
      },
      {
        id: "a",
        source: "RECURRING",
        status: "PLANNED",
        occurrenceDate: "2026-04-15",
        weekday: 3,
        startMinute: 450,
        endMinute: 510,
        room: "A1",
        reason: null,
        subject: { id: "fr", name: "Français" },
        teacherUser: { id: "t2", firstName: "Anne", lastName: "Biloa" },
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.items.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("construit les options de classes à partir du contexte notes", () => {
    const classes = buildTimetableClassOptions({
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      assignments: [
        {
          classId: "c1",
          className: "6e A",
          schoolYearId: "sy1",
          subjectId: "math",
          subjectName: "Maths",
        },
        {
          classId: "c1",
          className: "6e A",
          schoolYearId: "sy1",
          subjectId: "fr",
          subjectName: "Français",
        },
      ],
      students: [
        {
          classId: "c1",
          className: "6e A",
          studentId: "s1",
          studentFirstName: "Lisa",
          studentLastName: "Ntamack",
        },
        {
          classId: "c1",
          className: "6e A",
          studentId: "s2",
          studentFirstName: "Paul",
          studentLastName: "Ntamack",
        },
      ],
    });

    expect(classes).toEqual([
      expect.objectContaining({
        classId: "c1",
        className: "6e A",
        studentCount: 2,
      }),
    ]);
    expect(classes[0]?.subjects).toHaveLength(2);
  });
});
