export type SchoolCycle = "PRIMARY" | "SECONDARY";
export type SchoolLanguageSystem = "FRANCOPHONE" | "ANGLOPHONE" | "BILINGUAL";

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
  usersCount: number;
  classesCount: number;
  studentsCount: number;
};

export type CreateSchoolPayload = {
  name: string;
  country?: string;
  region?: string;
  city?: string;
  cycle?: SchoolCycle;
  languageSystem?: SchoolLanguageSystem;
  schoolAdminEmail: string;
};

export type UpdateSchoolPayload = {
  name?: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  cycle?: SchoolCycle | null;
  languageSystem?: SchoolLanguageSystem | null;
};

export type AddSchoolAdminPayload = {
  email: string;
};

export type AddSchoolAdminResult = {
  schoolAdmin: {
    id: string;
    email: string;
    firstName: string;
  };
  userExisted: boolean;
  setupCompleted: boolean;
};

export type CreateSchoolResult = {
  userExisted: boolean;
  setupCompleted: boolean;
};
