import type {
  UserItem,
  SchoolUser,
  SchoolUserDetail,
  SchoolUserRoleFilter,
  PaginatedSchoolUsers,
  StudentOnlyItem,
} from "../src/types/users.types";

export function makeSchoolUser(overrides: Partial<UserItem> = {}): UserItem {
  return {
    type: "user",
    id: "user-1",
    studentId: null,
    hasAccount: true,
    firstName: "Kouam",
    lastName: "Nguessie",
    email: "kouam.nguessie@college-vogt.cm",
    phone: "+237 677 123 456",
    gender: "M",
    avatarUrl: null,
    roles: ["TEACHER"],
    activationStatus: "ACTIVE",
    profileCompleted: true,
    createdAt: "2025-09-01T08:00:00.000Z",
    ...overrides,
  };
}

export function makeStudentOnlyUser(
  overrides: Partial<StudentOnlyItem> = {},
): StudentOnlyItem {
  return {
    type: "student-only",
    id: "student-only-1",
    studentId: "student-only-1",
    hasAccount: false,
    firstName: "Amina",
    lastName: "Fouda",
    email: null,
    phone: null,
    gender: null,
    avatarUrl: null,
    roles: ["STUDENT"],
    activationStatus: null,
    profileCompleted: false,
    createdAt: "2025-09-01T08:00:00.000Z",
    ...overrides,
  };
}

export function makeSchoolUserDetail(
  overrides: Partial<SchoolUserDetail> = {},
): SchoolUserDetail {
  // Extract only UserItem-compatible fields for base generation
  const {
    lastLoginAt,
    enrollments,
    children,
    teachingClasses,
    studentParents,
    staffFunctions,
    updatedAt,
    ...userOverrides
  } = overrides as Partial<SchoolUserDetail>;
  const base = makeSchoolUser(userOverrides as Partial<UserItem>);
  return {
    ...base,
    lastLoginAt: lastLoginAt ?? "2026-05-20T14:30:00.000Z",
    enrollments: enrollments ?? [],
    children: children ?? [],
    teachingClasses: teachingClasses ?? [],
    studentParents: studentParents ?? [],
    staffFunctions: staffFunctions ?? [],
    updatedAt: updatedAt ?? "2026-01-15T10:00:00.000Z",
  };
}

export function makeUsersPage(
  users: SchoolUser[],
  overrides: Partial<PaginatedSchoolUsers> = {},
): PaginatedSchoolUsers {
  return {
    data: users,
    total: users.length,
    page: 1,
    limit: 20,
    hasMore: false,
    ...overrides,
  };
}

export const TEACHER_USER = makeSchoolUser({
  id: "user-teacher-1",
  firstName: "Marie",
  lastName: "Ebelle",
  email: "m.ebelle@college-vogt.cm",
  phone: "+237 691 234 567",
  roles: ["TEACHER"],
  activationStatus: "ACTIVE",
});

export const PARENT_USER = makeSchoolUser({
  id: "user-parent-1",
  firstName: "Pierre",
  lastName: "Atangana",
  email: "p.atangana@gmail.com",
  phone: "+237 670 987 654",
  roles: ["PARENT"],
  activationStatus: "ACTIVE",
});

export const STUDENT_USER = makeSchoolUser({
  id: "user-student-1",
  firstName: "Cédric",
  lastName: "Mballa",
  email: null,
  phone: null,
  roles: ["STUDENT"],
  activationStatus: "ACTIVE",
  profileCompleted: false,
});

export const PENDING_USER = makeSchoolUser({
  id: "user-pending-1",
  firstName: "Sophie",
  lastName: "Biya",
  email: "s.biya@college-vogt.cm",
  phone: "+237 699 111 222",
  roles: ["TEACHER"],
  activationStatus: "PENDING",
});

export const ADMIN_USER = makeSchoolUser({
  id: "user-admin-1",
  firstName: "Jean",
  lastName: "Foko",
  email: "j.foko@college-vogt.cm",
  phone: "+237 677 000 111",
  roles: ["SCHOOL_ADMIN"],
  activationStatus: "ACTIVE",
});

export const SAMPLE_USERS: UserItem[] = [
  TEACHER_USER,
  PARENT_USER,
  STUDENT_USER,
  PENDING_USER,
  ADMIN_USER,
];

export function makeFilterParam(role: SchoolUserRoleFilter) {
  return role === "ALL" ? undefined : role;
}
