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
});
