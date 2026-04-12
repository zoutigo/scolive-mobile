import { timetableApi } from "../../src/api/timetable.api";
import { tokenStorage } from "../../src/api/client";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("token"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001/api";
  jest.spyOn(tokenStorage, "getAccessToken").mockResolvedValue("token");
});

describe("timetableApi.getMyTimetable()", () => {
  it("appelle l'endpoint parent avec childId et plage", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
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
      }),
    );

    await timetableApi.getMyTimetable("college-vogt", {
      childId: "stu-1",
      fromDate: "2026-04-13",
      toDate: "2026-04-20",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/schools/college-vogt/timetable/me?");
    expect(url).toContain("childId=stu-1");
    expect(url).toContain("fromDate=2026-04-13");
    expect(options.headers.Authorization).toBe("Bearer token");
  });
});

describe("timetableApi.getClassOptions()", () => {
  it("transforme le contexte notes en options de classes", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
        selectedSchoolYearId: "sy1",
        assignments: [
          {
            classId: "class-1",
            className: "6e A",
            schoolYearId: "sy1",
            subjectId: "math",
            subjectName: "Maths",
          },
        ],
        students: [
          {
            classId: "class-1",
            className: "6e A",
            studentId: "stu-1",
            studentFirstName: "Lisa",
            studentLastName: "Ntamack",
          },
        ],
      }),
    );

    const payload = await timetableApi.getClassOptions("college-vogt", "sy1");
    expect(payload.classes[0]).toMatchObject({
      classId: "class-1",
      className: "6e A",
      studentCount: 1,
    });
  });
});

describe("timetableApi CRUD", () => {
  it("poste la création d'un créneau récurrent", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        id: "slot-1",
        weekday: 1,
        startMinute: 450,
        endMinute: 510,
        room: "A1",
        subject: { id: "math", name: "Maths" },
        teacherUser: { id: "t1", firstName: "Paul", lastName: "Manga" },
      }),
    );

    await timetableApi.createRecurringSlot("college-vogt", "class-1", {
      weekday: 1,
      startMinute: 450,
      endMinute: 510,
      subjectId: "math",
      teacherUserId: "t1",
      room: "A1",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain(
      "/schools/college-vogt/timetable/classes/class-1/slots",
    );
    expect(options.method).toBe("POST");
    expect(String(options.body)).toContain('"subjectId":"math"');
  });
});
