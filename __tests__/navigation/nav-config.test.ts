import {
  getViewType,
  getRoleLabel,
  buildTeacherSubtitle,
  buildTeacherClassItems,
  buildTeacherClassSections,
  buildTeacherClassFeedTarget,
  buildTeacherClassNotesTarget,
  buildTeacherClassDisciplineTarget,
  buildTeacherClassTimetableTarget,
  buildTeacherClassHomeworkTarget,
  buildDrawerNavigationConfig,
} from "../../src/components/navigation/nav-config";
import type { AuthUser } from "../../src/types/auth.types";

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: "u1",
    firstName: "Test",
    lastName: "User",
    platformRoles: [],
    memberships: [],
    profileCompleted: true,
    role: null,
    activeRole: null,
    ...overrides,
  };
}

describe("getViewType", () => {
  describe("sans activeRole explicite", () => {
    it("retourne 'platform' si l'utilisateur a des rôles plateforme", () => {
      const user = makeUser({ platformRoles: ["ADMIN"], role: "ADMIN" });
      expect(getViewType(user)).toBe("platform");
    });

    it("retourne 'teacher' pour un enseignant sans rôle plateforme", () => {
      const user = makeUser({
        role: "TEACHER",
        memberships: [{ schoolId: "s1", role: "TEACHER" }],
      });
      expect(getViewType(user)).toBe("teacher");
    });

    it("retourne 'school' pour un SCHOOL_ADMIN sans rôle plateforme", () => {
      const user = makeUser({ role: "SCHOOL_ADMIN" });
      expect(getViewType(user)).toBe("school");
    });

    it("retourne 'parent' pour un parent sans rôle plateforme", () => {
      const user = makeUser({ role: "PARENT" });
      expect(getViewType(user)).toBe("parent");
    });

    it("retourne 'student' pour un élève sans rôle plateforme", () => {
      const user = makeUser({ role: "STUDENT" });
      expect(getViewType(user)).toBe("student");
    });

    it("retourne 'unknown' si aucun rôle n'est défini", () => {
      const user = makeUser({});
      expect(getViewType(user)).toBe("unknown");
    });
  });

  describe("avec activeRole explicite — cas du changement de profil", () => {
    it("affiche 'teacher' quand activeRole=TEACHER même si l'user a des rôles plateforme", () => {
      // Régression : un ADMIN qui choisit le profil Enseignant doit voir la vue enseignant
      const user = makeUser({
        platformRoles: ["ADMIN"],
        role: "ADMIN",
        activeRole: "TEACHER",
        memberships: [{ schoolId: "s1", role: "TEACHER" }],
      });
      expect(getViewType(user)).toBe("teacher");
    });

    it("affiche 'parent' quand activeRole=PARENT même si l'user est ADMIN", () => {
      const user = makeUser({
        platformRoles: ["ADMIN"],
        role: "ADMIN",
        activeRole: "PARENT",
        memberships: [{ schoolId: "s1", role: "PARENT" }],
      });
      expect(getViewType(user)).toBe("parent");
    });

    it("affiche 'school' quand activeRole=SCHOOL_ADMIN même si l'user est SUPER_ADMIN", () => {
      const user = makeUser({
        platformRoles: ["SUPER_ADMIN"],
        role: "SUPER_ADMIN",
        activeRole: "SCHOOL_ADMIN",
      });
      expect(getViewType(user)).toBe("school");
    });

    it("affiche 'student' quand activeRole=STUDENT", () => {
      const user = makeUser({
        platformRoles: ["ADMIN"],
        role: "ADMIN",
        activeRole: "STUDENT",
      });
      expect(getViewType(user)).toBe("student");
    });

    it("affiche 'platform' quand activeRole est un rôle plateforme (ADMIN)", () => {
      const user = makeUser({
        platformRoles: ["ADMIN"],
        role: "ADMIN",
        activeRole: "ADMIN",
      });
      expect(getViewType(user)).toBe("platform");
    });

    it("revient à 'platform' quand activeRole est null et que l'user a des rôles plateforme", () => {
      const user = makeUser({
        platformRoles: ["ADMIN"],
        role: "ADMIN",
        activeRole: null,
      });
      expect(getViewType(user)).toBe("platform");
    });
  });

  describe("cohérence school staff roles", () => {
    it.each([
      ["SCHOOL_MANAGER", "school"],
      ["SUPERVISOR", "school"],
      ["SCHOOL_ACCOUNTANT", "school"],
      ["SCHOOL_STAFF", "school"],
    ] as const)("activeRole=%s → vue '%s'", (activeRole, expected) => {
      const user = makeUser({ activeRole, role: activeRole });
      expect(getViewType(user)).toBe(expected);
    });
  });
});

describe("buildTeacherSubtitle", () => {
  it("retourne 'École · Classe' quand les deux sont présents", () => {
    const user = makeUser({
      schoolName: "Collège Vogt",
      referentClass: { name: "6eC" },
    });
    expect(buildTeacherSubtitle(user)).toBe("Collège Vogt · 6eC");
  });

  it("retourne uniquement le nom de l'école si pas de classe référente", () => {
    const user = makeUser({
      schoolName: "Lycée Bilingue",
      referentClass: null,
    });
    expect(buildTeacherSubtitle(user)).toBe("Lycée Bilingue");
  });

  it("retourne uniquement la classe si pas de schoolName", () => {
    const user = makeUser({ schoolName: null, referentClass: { name: "3eA" } });
    expect(buildTeacherSubtitle(user)).toBe("3eA");
  });

  it("retourne null si ni école ni classe", () => {
    const user = makeUser({ schoolName: null, referentClass: null });
    expect(buildTeacherSubtitle(user)).toBeNull();
  });

  it("retourne null si les champs sont absents (user sans ces props)", () => {
    const user = makeUser({});
    expect(buildTeacherSubtitle(user)).toBeNull();
  });

  it("retourne null si schoolName est une chaîne vide", () => {
    const user = makeUser({ schoolName: "", referentClass: null });
    expect(buildTeacherSubtitle(user)).toBeNull();
  });
});

describe("getRoleLabel", () => {
  it("retourne le libellé du activeRole en priorité", () => {
    const user = makeUser({
      platformRoles: ["ADMIN"],
      role: "ADMIN",
      activeRole: "TEACHER",
    });
    expect(getRoleLabel(user)).toBe("Enseignant(e)");
  });

  it("retourne le libellé du role quand activeRole est null", () => {
    const user = makeUser({ role: "PARENT", activeRole: null });
    expect(getRoleLabel(user)).toBe("Parent");
  });

  it("retourne une chaîne vide si aucun rôle n'est défini", () => {
    const user = makeUser({});
    expect(getRoleLabel(user)).toBe("");
  });
});

describe("teacher class navigation model", () => {
  it("construit les 5 sous-modules attendus pour une classe enseignant", () => {
    expect(buildTeacherClassItems("class-1")).toEqual([
      {
        key: "teacher-class-class-1-feed",
        label: "Fil de classe",
        icon: "newspaper-outline",
        route: "/(home)/classes/[classId]/feed",
        params: { classId: "class-1" },
      },
      {
        key: "teacher-class-class-1-notes",
        label: "Notes",
        icon: "journal-outline",
        route: "/(home)/classes/[classId]/notes",
        params: { classId: "class-1" },
      },
      {
        key: "teacher-class-class-1-discipline",
        label: "Discipline",
        icon: "shield-outline",
        route: "/(home)/classes/[classId]/discipline",
        params: { classId: "class-1" },
      },
      {
        key: "teacher-class-class-1-timetable",
        label: "Emploi du temps",
        icon: "calendar-outline",
        route: "/(home)/classes/[classId]/timetable",
        params: { classId: "class-1" },
      },
      {
        key: "teacher-class-class-1-homework",
        label: "Devoirs",
        icon: "document-text-outline",
        route: "/(home)/classes/[classId]/homework",
        params: { classId: "class-1" },
      },
    ]);
  });

  it("enveloppe une liste de classes dans des sections prêtes pour le drawer", () => {
    const sections = buildTeacherClassSections([
      {
        classId: "class-1",
        className: "6e C",
        schoolYearId: "sy1",
        schoolYearLabel: "2025-2026",
        subjects: [{ id: "math", name: "Mathématiques" }],
        studentCount: 12,
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({
      classId: "class-1",
      className: "6e C",
      schoolYearId: "sy1",
    });
    expect(sections[0].navItems.map((item) => item.label)).toEqual([
      "Fil de classe",
      "Notes",
      "Discipline",
      "Emploi du temps",
      "Devoirs",
    ]);
  });

  it("expose les route builders cibles pour les modules de classe", () => {
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

describe("buildDrawerNavigationConfig", () => {
  it("conserve la navigation générale enseignant tout en préparant les sections par classe", () => {
    const teacherUser = makeUser({
      role: "TEACHER",
      activeRole: "TEACHER",
      memberships: [{ schoolId: "s1", role: "TEACHER" }],
    });

    const config = buildDrawerNavigationConfig({
      user: teacherUser,
      teacherClasses: [
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

    expect(config.navItems.map((item) => item.key)).toEqual([
      "home",
      "feed",
      "agenda",
      "timetable",
      "gradebook",
      "discipline",
      "messages",
      "account",
    ]);
    expect(config.teacherClassSections).toHaveLength(1);
    expect(config.childSections).toBeUndefined();
  });

  it("réutilise les sections enfant pour un parent", () => {
    const parentUser = makeUser({
      role: "PARENT",
      activeRole: "PARENT",
      memberships: [{ schoolId: "s1", role: "PARENT" }],
    });

    const config = buildDrawerNavigationConfig({
      user: parentUser,
      familyChildren: [
        {
          id: "child-1",
          firstName: "Lisa",
          lastName: "Ntamack",
        },
      ],
    });

    expect(config.childSections).toHaveLength(1);
    expect(config.teacherClassSections).toBeUndefined();
  });

  it("retourne une config vide sans utilisateur", () => {
    expect(
      buildDrawerNavigationConfig({
        user: null,
      }),
    ).toEqual({ navItems: [] });
  });
});
