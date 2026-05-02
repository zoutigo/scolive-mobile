import {
  buildTeacherClassDisciplineTarget,
  buildTeacherClassFeedTarget,
  buildTeacherClassHomeworkTarget,
  buildTeacherClassNotesTarget,
  buildTeacherClassTimetableTarget,
} from "../../src/components/navigation/nav-config";

describe("teacher class routing targets", () => {
  it("génère des routes cohérentes pour tous les modules de classe", () => {
    expect(buildTeacherClassFeedTarget("class-1")).toEqual({
      pathname: "/(home)/classes/[classId]/feed",
      params: { classId: "class-1" },
    });
    expect(buildTeacherClassNotesTarget("class-1")).toEqual({
      pathname: "/(home)/classes/[classId]/notes",
      params: { classId: "class-1" },
    });
    expect(buildTeacherClassDisciplineTarget("class-1")).toEqual({
      pathname: "/(home)/classes/[classId]/discipline",
      params: { classId: "class-1" },
    });
    expect(buildTeacherClassTimetableTarget("class-1")).toEqual({
      pathname: "/(home)/classes/[classId]/timetable",
      params: { classId: "class-1" },
    });
    expect(buildTeacherClassHomeworkTarget("class-1")).toEqual({
      pathname: "/(home)/classes/[classId]/homework",
      params: { classId: "class-1" },
    });
  });
});
