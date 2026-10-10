/**
 * Tests unitaires : usersApi
 * Vérifie la construction des URLs et le passage des paramètres.
 */
import { usersApi } from "../../src/api/users.api";
import { apiFetch } from "../../src/api/client";
import {
  makeUsersPage,
  makeSchoolUser,
  makeSchoolUserDetail,
} from "../../test-utils/users.fixtures";

jest.mock("../../src/api/client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SLUG = "college-vogt";

describe("usersApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("list", () => {
    it("appelle le bon endpoint avec les params par defaut", async () => {
      const page = makeUsersPage([makeSchoolUser()]);
      mockApiFetch.mockResolvedValueOnce(page);

      await usersApi.list(SLUG, {});

      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/schools/${SLUG}/users`),
        {},
        true,
      );
    });

    it("inclut le parametre search dans la query", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { search: "kouam" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("search=kouam");
    });

    it("inclut le parametre role quand different de ALL", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { role: "TEACHER" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("role=TEACHER");
    });

    it("n'inclut pas le parametre role quand ALL", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { role: "ALL" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).not.toContain("role=");
    });

    it("inclut le numero de page", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { page: 3 });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("page=3");
    });

    it("n'inclut pas search vide", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { search: "   " });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).not.toContain("search=");
    });

    it("retourne la reponse de l'API", async () => {
      const users = [
        makeSchoolUser({ id: "u1" }),
        makeSchoolUser({ id: "u2" }),
      ];
      const page = makeUsersPage(users, { total: 2 });
      mockApiFetch.mockResolvedValueOnce(page);

      const result = await usersApi.list(SLUG, {});

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("propage les erreurs", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(usersApi.list(SLUG, {})).rejects.toThrow("Network error");
    });

    it("traduit hasAccount=WITH_ACCOUNT en hasAccount=true", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { hasAccount: "WITH_ACCOUNT" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("hasAccount=true");
    });

    it("traduit hasAccount=WITHOUT_ACCOUNT en hasAccount=false", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { hasAccount: "WITHOUT_ACCOUNT" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("hasAccount=false");
    });

    it("n'inclut pas hasAccount quand ALL", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { hasAccount: "ALL" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).not.toContain("hasAccount=");
    });

    it("inclut schoolYearId quand fourni", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { schoolYearId: "sy-1" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).toContain("schoolYearId=sy-1");
    });

    it("n'inclut pas schoolYearId quand vide", async () => {
      mockApiFetch.mockResolvedValueOnce(makeUsersPage([]));

      await usersApi.list(SLUG, { schoolYearId: "" });

      const [url] = mockApiFetch.mock.calls[0];
      expect(url).not.toContain("schoolYearId=");
    });
  });

  describe("listSchoolYears", () => {
    it("appelle le bon endpoint", async () => {
      mockApiFetch.mockResolvedValueOnce([]);

      await usersApi.listSchoolYears(SLUG);

      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/admin/school-years`,
        {},
        true,
      );
    });

    it("retourne la liste des années", async () => {
      const years = [
        { id: "sy-1", label: "2025-2026", isActive: true },
        { id: "sy-2", label: "2024-2025", isActive: false },
      ];
      mockApiFetch.mockResolvedValueOnce(years);

      const result = await usersApi.listSchoolYears(SLUG);

      expect(result).toEqual(years);
    });
  });

  describe("get", () => {
    it("appelle le bon endpoint pour un utilisateur specifique", async () => {
      const detail = makeSchoolUserDetail({ id: "user-42" });
      mockApiFetch.mockResolvedValueOnce(detail);

      await usersApi.get(SLUG, "user-42");

      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/users/user-42`,
        {},
        true,
      );
    });

    it("retourne le detail complet", async () => {
      const detail = makeSchoolUserDetail({
        enrollments: [
          {
            id: "enr-1",
            classId: "cls-6eA",
            className: "6e A",
            schoolYear: "2025-2026",
          },
        ],
        children: [],
      });
      mockApiFetch.mockResolvedValueOnce(detail);

      const result = await usersApi.get(SLUG, "user-1");

      expect(result.enrollments).toHaveLength(1);
      expect(result.lastLoginAt).toBeDefined();
    });

    it("propage les erreurs 404", async () => {
      const err = new Error("Ressource introuvable.");
      mockApiFetch.mockRejectedValueOnce(err);

      await expect(usersApi.get(SLUG, "inexistant")).rejects.toThrow(
        "Ressource introuvable.",
      );
    });
  });

  describe("updateRoles", () => {
    it("appelle PATCH sur le bon endpoint avec les rôles", async () => {
      mockApiFetch.mockResolvedValueOnce({ roles: ["TEACHER"] });

      await usersApi.updateRoles(SLUG, "user-1", ["TEACHER"]);

      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/users/user-1/roles`,
        {
          method: "PATCH",
          body: JSON.stringify({ roles: ["TEACHER"] }),
        },
        true,
      );
    });

    it("passe plusieurs rôles simultanément", async () => {
      mockApiFetch.mockResolvedValueOnce({
        roles: ["TEACHER", "SCHOOL_MANAGER"],
      });

      await usersApi.updateRoles(SLUG, "user-1", ["TEACHER", "SCHOOL_MANAGER"]);

      const [, options] = mockApiFetch.mock.calls[0];
      expect(JSON.parse((options as { body: string }).body)).toEqual({
        roles: ["TEACHER", "SCHOOL_MANAGER"],
      });
    });

    it("retourne la liste des rôles confirmés par le serveur", async () => {
      mockApiFetch.mockResolvedValueOnce({ roles: ["SCHOOL_ADMIN"] });

      const result = await usersApi.updateRoles(SLUG, "user-1", [
        "SCHOOL_ADMIN",
      ]);

      expect(result.roles).toEqual(["SCHOOL_ADMIN"]);
    });

    it("propage les erreurs réseau", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        usersApi.updateRoles(SLUG, "user-1", ["TEACHER"]),
      ).rejects.toThrow("Network error");
    });
  });

  describe("resetPin", () => {
    it("appelle POST sur le bon endpoint", async () => {
      mockApiFetch.mockResolvedValueOnce({ temporaryPin: "123456" });

      await usersApi.resetPin(SLUG, "user-1");

      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/users/user-1/reset-pin`,
        { method: "POST", body: JSON.stringify({}) },
        true,
      );
    });

    it("retourne le PIN temporaire généré par le serveur", async () => {
      mockApiFetch.mockResolvedValueOnce({ temporaryPin: "654321" });

      const result = await usersApi.resetPin(SLUG, "user-1");

      expect(result.temporaryPin).toBe("654321");
    });

    it("propage les erreurs (ex: pas d'identifiant téléphone)", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("Not Found"));

      await expect(usersApi.resetPin(SLUG, "user-1")).rejects.toThrow(
        "Not Found",
      );
    });
  });

  describe("removeMember", () => {
    it("appelle DELETE sur le bon endpoint avec auth", async () => {
      mockApiFetch.mockResolvedValueOnce({
        action: "EXCLUDED",
        remainingRoles: [],
      });

      const result = await usersApi.removeMember(SLUG, "user-1");

      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/users/user-1`,
        { method: "DELETE" },
        true,
      );
      expect(result.action).toBe("EXCLUDED");
    });

    it("propage les refus serveur (admin principal, soi-même, dernier admin)", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("Conflict"));
      await expect(usersApi.removeMember(SLUG, "user-1")).rejects.toThrow(
        "Conflict",
      );
    });
  });

  describe("exclusion et réinvitation", () => {
    it("list n'envoie membershipStatus que pour les exclus", async () => {
      mockApiFetch.mockResolvedValue(makeUsersPage([]));
      await usersApi.list(SLUG, { membershipStatus: "active" });
      await usersApi.list(SLUG, {});
      await usersApi.list(SLUG, { membershipStatus: "excluded" });
      expect(mockApiFetch.mock.calls[0][0]).not.toContain("membershipStatus");
      expect(mockApiFetch.mock.calls[1][0]).not.toContain("membershipStatus");
      expect(mockApiFetch.mock.calls[2][0]).toContain(
        "membershipStatus=excluded",
      );
    });

    it("excludeMember : POST users/:id/exclude avec motif nettoyé", async () => {
      mockApiFetch.mockResolvedValueOnce({ action: "EXCLUDED" });
      await usersApi.excludeMember(SLUG, "u-1", "  Fin de contrat ");
      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/users/u-1/exclude`,
        { method: "POST", body: JSON.stringify({ reason: "Fin de contrat" }) },
        true,
      );
    });

    it("excludeMember sans motif : corps vide", async () => {
      mockApiFetch.mockResolvedValueOnce({ action: "EXCLUDED" });
      await usersApi.excludeMember(SLUG, "u-1", "   ");
      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/users/u-1/exclude`,
        { method: "POST", body: "{}" },
        true,
      );
    });

    it("excludeStudent : POST users/students/:studentId/exclude", async () => {
      mockApiFetch.mockResolvedValueOnce({ action: "EXCLUDED" });
      await usersApi.excludeStudent(SLUG, "s-1", "Départ");
      expect(mockApiFetch).toHaveBeenCalledWith(
        `/schools/${SLUG}/users/students/s-1/exclude`,
        { method: "POST", body: JSON.stringify({ reason: "Départ" }) },
        true,
      );
    });

    it("reinviteMember / reinviteStudent : POST sur les bonnes routes", async () => {
      mockApiFetch.mockResolvedValue({ action: "REINVITED" });
      await usersApi.reinviteMember(SLUG, "u-1");
      await usersApi.reinviteStudent(SLUG, "s-1");
      expect(mockApiFetch.mock.calls[0][0]).toBe(
        `/schools/${SLUG}/users/u-1/reinvite`,
      );
      expect(mockApiFetch.mock.calls[1][0]).toBe(
        `/schools/${SLUG}/users/students/s-1/reinvite`,
      );
      expect(mockApiFetch.mock.calls[0][1]).toEqual(
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("propage l'erreur serveur", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("409"));
      await expect(usersApi.excludeMember(SLUG, "u-1")).rejects.toThrow("409");
    });
  });
});
