/**
 * Tests unitaires : types et structures du module Utilisateurs.
 * Vérifie la cohérence des fixtures et des fonctions utilitaires.
 */
import {
  makeSchoolUser,
  makeSchoolUserDetail,
  makeUsersPage,
  SAMPLE_USERS,
} from "../../test-utils/users.fixtures";
import type {
  SchoolUser,
  UserActivationStatus,
} from "../../src/types/users.types";

describe("users.types", () => {
  describe("makeSchoolUser", () => {
    it("produit un utilisateur valide avec les valeurs par defaut", () => {
      const user = makeSchoolUser();
      expect(user.id).toBeDefined();
      expect(user.firstName).toBeTruthy();
      expect(user.lastName).toBeTruthy();
      expect(user.roles.length).toBeGreaterThan(0);
      expect(["PENDING", "ACTIVE", "SUSPENDED"]).toContain(
        user.activationStatus,
      );
    });

    it("applique les overrides correctement", () => {
      const user = makeSchoolUser({
        id: "custom-1",
        firstName: "Alain",
        roles: ["PARENT", "STUDENT"],
        activationStatus: "PENDING",
      });
      expect(user.id).toBe("custom-1");
      expect(user.firstName).toBe("Alain");
      expect(user.roles).toEqual(["PARENT", "STUDENT"]);
      expect(user.activationStatus).toBe("PENDING");
    });

    it("accepte des valeurs nulles pour email et telephone", () => {
      const user = makeSchoolUser({ email: null, phone: null });
      expect(user.email).toBeNull();
      expect(user.phone).toBeNull();
    });
  });

  describe("makeSchoolUserDetail", () => {
    it("inclut les champs supplementaires", () => {
      const detail = makeSchoolUserDetail();
      expect(detail.enrollments).toBeDefined();
      expect(detail.children).toBeDefined();
      expect(detail.teachingClasses).toBeDefined();
      expect(detail.studentParents).toBeDefined();
      expect(detail.staffFunctions).toBeDefined();
      expect(detail.updatedAt).toBeDefined();
    });

    it("accepte des inscriptions et des enfants", () => {
      const detail = makeSchoolUserDetail({
        enrollments: [
          {
            id: "enr-1",
            classId: "cls-6eA",
            className: "6e A",
            schoolYear: "2025-2026",
          },
        ],
        children: [
          {
            id: "child-1",
            firstName: "Emma",
            lastName: "Kamga",
            className: "3e B",
          },
        ],
      });
      expect(detail.enrollments).toHaveLength(1);
      expect(detail.children).toHaveLength(1);
      expect(detail.children[0].firstName).toBe("Emma");
    });

    it("accepte des classes enseignées avec matières", () => {
      const detail = makeSchoolUserDetail({
        roles: ["TEACHER"],
        teachingClasses: [
          {
            classId: "cls-1",
            className: "5e A",
            subjects: [
              { id: "s1", name: "Mathématiques" },
              { id: "s2", name: "Physique" },
            ],
          },
        ],
      });
      expect(detail.teachingClasses).toHaveLength(1);
      expect(detail.teachingClasses[0].className).toBe("5e A");
      expect(detail.teachingClasses[0].subjects).toHaveLength(2);
    });

    it("accepte des parents pour un élève", () => {
      const detail = makeSchoolUserDetail({
        roles: ["STUDENT"],
        studentParents: [
          {
            id: "par-1",
            firstName: "Henri",
            lastName: "Mballa",
            phone: "+237 677 000 000",
          },
        ],
      });
      expect(detail.studentParents).toHaveLength(1);
      expect(detail.studentParents[0].lastName).toBe("Mballa");
    });

    it("accepte des fonctions pour un personnel", () => {
      const detail = makeSchoolUserDetail({
        roles: ["SCHOOL_STAFF"],
        staffFunctions: [{ id: "fn-1", name: "Responsable bibliothèque" }],
      });
      expect(detail.staffFunctions).toHaveLength(1);
      expect(detail.staffFunctions[0].name).toBe("Responsable bibliothèque");
    });
  });

  describe("makeUsersPage", () => {
    it("construit une page correcte", () => {
      const users = [
        makeSchoolUser({ id: "u1" }),
        makeSchoolUser({ id: "u2" }),
      ];
      const page = makeUsersPage(users);
      expect(page.data).toHaveLength(2);
      expect(page.total).toBe(2);
      expect(page.hasMore).toBe(false);
    });

    it("permet de simuler une page avec suite", () => {
      const users = [makeSchoolUser()];
      const page = makeUsersPage(users, { total: 50, hasMore: true, page: 1 });
      expect(page.hasMore).toBe(true);
      expect(page.total).toBe(50);
    });
  });

  describe("SAMPLE_USERS", () => {
    it("contient des utilisateurs avec des roles distincts", () => {
      const roles = SAMPLE_USERS.flatMap((u) => u.roles);
      expect(roles).toContain("TEACHER");
      expect(roles).toContain("PARENT");
      expect(roles).toContain("STUDENT");
      expect(roles).toContain("SCHOOL_ADMIN");
    });

    it("inclut des statuts differents", () => {
      const statuses = SAMPLE_USERS.map((u) => u.activationStatus);
      const uniqueStatuses = new Set<UserActivationStatus>(statuses);
      expect(uniqueStatuses.size).toBeGreaterThan(1);
    });
  });

  describe("contraintes de type SchoolUser", () => {
    it("gender accepte null, M, F ou OTHER", () => {
      const genders: SchoolUser["gender"][] = [null, "M", "F", "OTHER"];
      genders.forEach((gender) => {
        const user = makeSchoolUser({ gender });
        expect(user.gender).toBe(gender);
      });
    });

    it("profileCompleted est un booleen", () => {
      const complete = makeSchoolUser({ profileCompleted: true });
      const incomplete = makeSchoolUser({ profileCompleted: false });
      expect(complete.profileCompleted).toBe(true);
      expect(incomplete.profileCompleted).toBe(false);
    });
  });
});
