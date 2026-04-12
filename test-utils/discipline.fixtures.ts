import type {
  DisciplineSummary,
  StudentLifeEvent,
  StudentLifeEventType,
} from "../src/types/discipline.types";
import type { AuthUser } from "../src/types/auth.types";

export function makeLifeEvent(
  overrides: Partial<StudentLifeEvent> = {},
): StudentLifeEvent {
  return {
    id: "event-1",
    schoolId: "school-1",
    studentId: "student-1",
    classId: "class-1",
    schoolYearId: "year-1",
    authorUserId: "teacher-1",
    type: "ABSENCE",
    occurredAt: "2026-04-08T08:15:00.000Z",
    durationMinutes: 45,
    justified: false,
    reason: "Absence non justifiee",
    comment: "Parent a contacter",
    createdAt: "2026-04-08T08:20:00.000Z",
    updatedAt: "2026-04-08T08:20:00.000Z",
    class: { id: "class-1", name: "6e A" },
    schoolYear: { id: "year-1", label: "2025-2026" },
    authorUser: {
      id: "teacher-1",
      firstName: "Anne",
      lastName: "Rousselot",
      email: "anne.rousselot@ecole.cm",
    },
    ...overrides,
  };
}

export function makeEventsByTypes(
  types: StudentLifeEventType[],
): StudentLifeEvent[] {
  return types.map((type, index) =>
    makeLifeEvent({
      id: `event-${index + 1}`,
      type,
      reason: `${type} reason ${index + 1}`,
      occurredAt: `2026-04-0${Math.min(index + 1, 9)}T08:15:00.000Z`,
      justified:
        type === "ABSENCE" ? index % 2 === 0 : type === "RETARD" ? true : null,
      durationMinutes: type === "SANCTION" ? null : 15 + index,
      comment: index % 2 === 0 ? `Comment ${index + 1}` : null,
    }),
  );
}

export function makeSummary(
  overrides: Partial<DisciplineSummary> = {},
): DisciplineSummary {
  return {
    absences: 2,
    retards: 1,
    sanctions: 1,
    punitions: 1,
    lastAbsence: makeLifeEvent({ id: "abs-last", type: "ABSENCE" }),
    lastRetard: makeLifeEvent({ id: "ret-last", type: "RETARD" }),
    lastSanction: makeLifeEvent({ id: "san-last", type: "SANCTION" }),
    lastPunition: makeLifeEvent({ id: "pun-last", type: "PUNITION" }),
    unjustifiedAbsences: 1,
    ...overrides,
  };
}

export function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    firstName: "Robert",
    lastName: "Ntamack",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    profileCompleted: true,
    role: "PARENT",
    activeRole: "PARENT",
    ...overrides,
  };
}
