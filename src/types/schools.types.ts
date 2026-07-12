export type SchoolCycle = "PRIMARY" | "SECONDARY";
export type SchoolLanguageSystem = "FRANCOPHONE" | "ANGLOPHONE" | "BILINGUAL";

export type SchoolAcademicYear = {
  id: string;
  label: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  region: string | null;
  city: string | null;
  cycle: SchoolCycle | null;
  languageSystem: SchoolLanguageSystem | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: SchoolAcademicYear | null;
  usersCount: number;
  classesCount: number;
  studentsCount: number;
};

export type SchoolsListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SchoolsListParams = {
  search?: string;
  cycle?: SchoolCycle;
  languageSystem?: SchoolLanguageSystem;
  page?: number;
  limit?: number;
};

export type SchoolsListResult = {
  items: SchoolRow[];
  meta: SchoolsListMeta;
};

export type SchoolsCycleBreakdown = {
  schools: number;
  students: number;
  classes: number;
};

export type SchoolsOverview = {
  totals: {
    schools: number;
    students: number;
    classes: number;
  };
  byCycle: {
    PRIMARY: SchoolsCycleBreakdown;
    SECONDARY: SchoolsCycleBreakdown;
    UNSET: SchoolsCycleBreakdown;
  };
};

export type SchoolAdminRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  mustChangePassword: boolean;
  profileCompleted: boolean;
  activationRequired: boolean;
  canResendInvite: boolean;
};

export type SchoolRoleBreakdown = {
  staff: number;
  teachers: number;
  parents: number;
  students: number;
};

export type SchoolDetails = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  region: string | null;
  city: string | null;
  cycle: SchoolCycle | null;
  languageSystem: SchoolLanguageSystem | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  academicYear: SchoolAcademicYear | null;
  stats: {
    usersCount: number;
    classesCount: number;
    studentsCount: number;
    teachersCount: number;
    gradesCount: number;
  };
  roleBreakdown: SchoolRoleBreakdown;
  schoolAdmins: SchoolAdminRow[];
};

export type SchoolAdminIdentity =
  | { email: string; phone?: undefined; pin?: undefined }
  | { email?: undefined; phone: string; pin: string };

export type CreateSchoolPayload = {
  name: string;
  country?: string;
  region?: string;
  city?: string;
  cycle?: SchoolCycle;
  languageSystem?: SchoolLanguageSystem;
  schoolAdminEmail?: string;
  schoolAdminPhone?: string;
  schoolAdminPin?: string;
};

export type UpdateSchoolPayload = {
  name?: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  cycle?: SchoolCycle | null;
  languageSystem?: SchoolLanguageSystem | null;
};

export type AddSchoolAdminPayload = SchoolAdminIdentity;

export type AddSchoolAdminResult = {
  schoolAdmin: {
    id: string;
    email: string | null;
    firstName: string;
  };
  userExisted: boolean;
  setupCompleted: boolean;
  activationRequired?: boolean;
  activationCode?: string | null;
};

export type CreatedSchoolSummary = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  region: string | null;
  city: string | null;
  cycle: SchoolCycle | null;
  languageSystem: SchoolLanguageSystem | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSchoolResult = {
  school: CreatedSchoolSummary;
  userExisted: boolean;
  setupCompleted: boolean;
  activationRequired?: boolean;
  activationCode?: string | null;
};
