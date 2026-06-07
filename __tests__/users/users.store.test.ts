/**
 * Tests unitaires : useUsersStore (Zustand)
 */
import { act } from "@testing-library/react-native";
import { useUsersStore } from "../../src/store/users.store";
import { makeSchoolUser } from "../../test-utils/users.fixtures";

describe("useUsersStore", () => {
  beforeEach(() => {
    act(() => {
      useUsersStore.getState().reset();
    });
  });

  it("etat initial vide", () => {
    const state = useUsersStore.getState();
    expect(state.users).toHaveLength(0);
    expect(state.page).toBe(1);
    expect(state.hasMore).toBe(false);
    expect(state.total).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.isLoadingMore).toBe(false);
    expect(state.isRefreshing).toBe(false);
    expect(state.error).toBeNull();
    expect(state.filters.search).toBe("");
    expect(state.filters.role).toBe("ALL");
  });

  describe("setUsers", () => {
    it("remplace la liste et la pagination", () => {
      const users = [
        makeSchoolUser({ id: "u1" }),
        makeSchoolUser({ id: "u2" }),
      ];
      act(() => {
        useUsersStore.getState().setUsers(users, true, 1, 50);
      });

      const state = useUsersStore.getState();
      expect(state.users).toHaveLength(2);
      expect(state.hasMore).toBe(true);
      expect(state.page).toBe(1);
      expect(state.total).toBe(50);
      expect(state.error).toBeNull();
    });
  });

  describe("appendUsers", () => {
    it("ajoute les utilisateurs a la liste existante", () => {
      act(() => {
        useUsersStore
          .getState()
          .setUsers([makeSchoolUser({ id: "u1" })], true, 1, 40);
      });
      act(() => {
        useUsersStore
          .getState()
          .appendUsers([makeSchoolUser({ id: "u2" })], false, 2);
      });

      const state = useUsersStore.getState();
      expect(state.users).toHaveLength(2);
      expect(state.users[0].id).toBe("u1");
      expect(state.users[1].id).toBe("u2");
      expect(state.hasMore).toBe(false);
      expect(state.page).toBe(2);
    });
  });

  describe("setFilters", () => {
    it("met a jour un filtre de facon incrementale", () => {
      act(() => {
        useUsersStore.getState().setFilters({ search: "kouam" });
      });
      expect(useUsersStore.getState().filters.search).toBe("kouam");
      expect(useUsersStore.getState().filters.role).toBe("ALL");

      act(() => {
        useUsersStore.getState().setFilters({ role: "TEACHER" });
      });
      expect(useUsersStore.getState().filters.search).toBe("kouam");
      expect(useUsersStore.getState().filters.role).toBe("TEACHER");
    });
  });

  describe("états de chargement", () => {
    it("setLoading met a jour isLoading", () => {
      act(() => useUsersStore.getState().setLoading(true));
      expect(useUsersStore.getState().isLoading).toBe(true);
      act(() => useUsersStore.getState().setLoading(false));
      expect(useUsersStore.getState().isLoading).toBe(false);
    });

    it("setLoadingMore met a jour isLoadingMore", () => {
      act(() => useUsersStore.getState().setLoadingMore(true));
      expect(useUsersStore.getState().isLoadingMore).toBe(true);
    });

    it("setRefreshing met a jour isRefreshing", () => {
      act(() => useUsersStore.getState().setRefreshing(true));
      expect(useUsersStore.getState().isRefreshing).toBe(true);
    });
  });

  describe("setError", () => {
    it("stocke et efface le message d'erreur", () => {
      act(() =>
        useUsersStore
          .getState()
          .setError("Impossible de charger les utilisateurs."),
      );
      expect(useUsersStore.getState().error).toBe(
        "Impossible de charger les utilisateurs.",
      );
      act(() => useUsersStore.getState().setError(null));
      expect(useUsersStore.getState().error).toBeNull();
    });
  });

  describe("reset", () => {
    it("remet l'etat complet a zero", () => {
      act(() => {
        const s = useUsersStore.getState();
        s.setUsers([makeSchoolUser()], true, 2, 100);
        s.setFilters({ search: "test", role: "TEACHER" });
        s.setLoading(true);
        s.setError("erreur");
      });
      act(() => useUsersStore.getState().reset());

      const state = useUsersStore.getState();
      expect(state.users).toHaveLength(0);
      expect(state.page).toBe(1);
      expect(state.hasMore).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.filters.search).toBe("");
      expect(state.filters.role).toBe("ALL");
    });
  });
});
