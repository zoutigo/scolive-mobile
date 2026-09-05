/**
 * Tests du composant ParentHome.
 * - Rendu des enfants (nom seul, pas de boutons rapides)
 * - Clic sur un enfant → setActiveChild + navigation vers Accueil enfant
 * - Compteur d'enfants intact
 * - États : chargement, vide, avec enfants
 */
import React from "react";
import { act, render, screen, fireEvent } from "@testing-library/react-native";
import { ParentHome } from "../../src/components/home/ParentHome";
import { useFamilyStore } from "../../src/store/family.store";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useHomeHeaderHelpStore } from "../../src/store/home-header-help.store";
import { disciplineApi } from "../../src/api/discipline.api";
import { notesApi } from "../../src/api/notes.api";
import { authApi } from "../../src/api/auth.api";
import type { AuthUser } from "../../src/types/auth.types";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("../../src/api/discipline.api", () => ({
  disciplineApi: { list: jest.fn().mockResolvedValue([]) },
}));
jest.mock("../../src/api/notes.api", () => ({
  notesApi: { listStudentNotes: jest.fn().mockResolvedValue([]) },
}));
jest.mock("../../src/api/auth.api", () => ({
  authApi: {
    parentDashboardSummary: jest
      .fn()
      .mockRejectedValue(new Error("no summary")),
  },
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => {
      return callback();
    }, [callback]);
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const parentUser: AuthUser = {
  id: "u1",
  firstName: "Robert",
  lastName: "Ntamack",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "PARENT" }],
  profileCompleted: true,
  role: "PARENT",
  activeRole: "PARENT",
};

const child1 = {
  id: "c1",
  firstName: "Lisa",
  lastName: "Ntamack",
  className: "6e A",
};
const child2 = {
  id: "c2",
  firstName: "Paul",
  lastName: "Ntamack",
  className: "5e B",
};

beforeEach(() => {
  jest.clearAllMocks();
  (disciplineApi.list as jest.Mock).mockResolvedValue([]);
  (notesApi.listStudentNotes as jest.Mock).mockResolvedValue([]);
  (authApi.parentDashboardSummary as jest.Mock).mockRejectedValue(
    new Error("no summary"),
  );
  useFamilyStore.setState({
    children: [],
    isLoading: false,
    activeChildId: null,
  });
  useMessagingStore.setState({
    folder: "inbox",
    messages: [],
    meta: null,
    isLoading: false,
    isRefreshing: false,
    search: "",
    unreadCount: 0,
    loadUnreadCount: jest.fn().mockResolvedValue(undefined),
  });
  useHomeHeaderHelpStore.getState().setHelpAction(null);
});

// ── Rendu — état vide ─────────────────────────────────────────────────────────

describe("État vide", () => {
  it("affiche le message quand aucun enfant n'est associé", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Aucun enfant associé")).toBeTruthy();
  });

  it("n'affiche pas le compteur quand il n'y a pas d'enfants", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.queryByTestId("children-count-badge")).toBeNull();
  });
});

// ── Rendu — avec enfants ──────────────────────────────────────────────────────

describe("Avec enfants", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
  });

  it("affiche le nom complet de chaque enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("Ntamack Lisa")).toBeTruthy();
    expect(screen.getByText("Ntamack Paul")).toBeTruthy();
  });

  it("n'affiche pas de boutons d'accès rapide sur la carte enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.queryByText("Notes")).toBeNull();
    expect(screen.queryByText("Emploi du temps")).toBeNull();
  });

  it("affiche le compteur avec le bon nombre", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("children-count-badge")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("affiche une carte par enfant avec le bon testID", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByTestId("child-card-c1")).toBeTruthy();
    expect(screen.getByTestId("child-card-c2")).toBeTruthy();
  });
});

// ── Clic sur un enfant ────────────────────────────────────────────────────────

describe("Clic sur un enfant", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
  });

  it("appelle setActiveChild avec l'id de l'enfant cliqué", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(useFamilyStore.getState().activeChildId).toBe("c1");
  });

  it("navigue vers l'accueil enfant du premier enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "c1" },
    });
  });

  it("setActiveChild est appelé avec le bon id pour le deuxième enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c2"));
    expect(useFamilyStore.getState().activeChildId).toBe("c2");
  });

  it("navigue vers l'accueil enfant du deuxième enfant", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c2"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "c2" },
    });
  });
});

// ── Synchronisation avec le store ─────────────────────────────────────────────

describe("Synchronisation activeChildId", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
  });

  it("après clic, activeChildId est mis à jour dans le store", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(useFamilyStore.getState().activeChildId).toBeNull();
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(useFamilyStore.getState().activeChildId).toBe("c1");
  });

  it("changer d'enfant met à jour activeChildId", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    fireEvent.press(screen.getByTestId("child-card-c1"));
    expect(useFamilyStore.getState().activeChildId).toBe("c1");
    fireEvent.press(screen.getByTestId("child-card-c2"));
    expect(useFamilyStore.getState().activeChildId).toBe("c2");
  });
});

// ── Compteur d'enfants ────────────────────────────────────────────────────────

describe("Compteur d'enfants", () => {
  it("affiche '1' avec un seul enfant", () => {
    useFamilyStore.setState({ children: [child1], isLoading: false });
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("affiche '2' avec deux enfants", () => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);
    expect(screen.getByText("2")).toBeTruthy();
  });
});

describe("Accès rapides", () => {
  it("navigue vers le fil d'actualité depuis le raccourci d'accueil", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByTestId("quick-link-fil-d-actualit"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/feed");
  });

  it("navigue vers la messagerie depuis le raccourci d'accueil", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByTestId("quick-link-messagerie"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("charge le compteur de messages non lus à l'ouverture", () => {
    const loadUnreadCountSpy = jest.fn().mockResolvedValue(undefined);
    useMessagingStore.setState({ loadUnreadCount: loadUnreadCountSpy });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(loadUnreadCountSpy).toHaveBeenCalledWith("college-vogt");
  });

  it("affiche le badge de non lus sur le raccourci messagerie", () => {
    useMessagingStore.setState({ unreadCount: 7 });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.getByTestId("quick-link-messagerie-badge")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("masque le badge si aucun message n'est non lu", () => {
    useMessagingStore.setState({ unreadCount: 0 });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.queryByTestId("quick-link-messagerie-badge")).toBeNull();
  });

  it("borne l'affichage du badge à 99+", () => {
    useMessagingStore.setState({ unreadCount: 124 });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.getByText("99+")).toBeTruthy();
  });

  describe("modale d'aide (déclenchée depuis le menu de l'en-tête partagé)", () => {
    it("est masquée par défaut", () => {
      render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

      expect(
        screen.queryByTestId("parent-landing-help-modal-title"),
      ).toBeNull();
    });

    it("enregistre son entrée d'aide dans le store partagé de l'en-tête", () => {
      render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

      expect(useHomeHeaderHelpStore.getState().helpAction?.testID).toBe(
        "parent-landing-help-toggle",
      );
    });

    it("s'ouvre quand l'entrée d'aide enregistrée est déclenchée et affiche titre/corps", () => {
      render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

      act(() => {
        useHomeHeaderHelpStore.getState().helpAction?.onPress();
      });

      expect(
        screen.getByTestId("parent-landing-help-modal-title"),
      ).toBeTruthy();
      expect(screen.getByTestId("parent-landing-help-modal-body")).toBeTruthy();
    });

    it("se ferme au tap sur le bouton de fermeture", () => {
      render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

      act(() => {
        useHomeHeaderHelpStore.getState().helpAction?.onPress();
      });
      fireEvent.press(screen.getByTestId("parent-landing-help-modal-close"));

      expect(
        screen.queryByTestId("parent-landing-help-modal-title"),
      ).toBeNull();
    });
  });
});

// ── Résumés discipline / évaluations / compte ──────────────────────────────────

describe("Résumé discipline", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1, child2], isLoading: false });
  });

  it("affiche une carte de suivi disciplinaire par enfant avec ses statistiques", async () => {
    (disciplineApi.list as jest.Mock).mockImplementation(
      async (_slug: string, studentId: string) =>
        studentId === "c1"
          ? [
              {
                id: "evt-1",
                schoolId: "s1",
                studentId: "c1",
                classId: null,
                schoolYearId: null,
                authorUserId: "author",
                type: "ABSENCE",
                occurredAt: "2026-03-01T08:00:00.000Z",
                durationMinutes: 60,
                justified: false,
                reason: "Absence",
              },
            ]
          : [],
    );

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(await screen.findByTestId("discipline-summary-c1")).toBeTruthy();
    expect(screen.getByText("Priorité parent")).toBeTruthy();
    expect(screen.getByText("1 absence(s) à justifier.")).toBeTruthy();
  });

  it("navigue vers le détail discipline de l'enfant au tap sur la carte", async () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    fireEvent.press(await screen.findByTestId("discipline-summary-c1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/discipline/[childId]",
      params: { childId: "c1" },
    });
  });

  it("n'affiche pas la section discipline quand il n'y a pas d'enfant", () => {
    useFamilyStore.setState({ children: [], isLoading: false });
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.queryByTestId("parent-discipline-section")).toBeNull();
  });
});

describe("Résumé évaluations", () => {
  beforeEach(() => {
    useFamilyStore.setState({ children: [child1], isLoading: false });
  });

  it("affiche la moyenne et les dernières évaluations de l'enfant", async () => {
    (notesApi.listStudentNotes as jest.Mock).mockResolvedValue([
      {
        term: "TERM_1",
        label: "1er trimestre",
        councilLabel: "",
        generatedAtLabel: "",
        generalAverage: { student: 15.5, class: 12, min: 5, max: 18 },
        sequences: [],
        subjects: [
          {
            id: "subj-1",
            subjectLabel: "Anglais",
            teachers: [],
            coefficient: 2,
            studentAverage: 15.5,
            classAverage: 12,
            classMin: 5,
            classMax: 18,
            evaluations: [
              {
                id: "eval-1",
                label: "Devoir",
                score: 15.5,
                maxScore: 20,
                recordedAt: "2026-03-10T08:00:00.000Z",
                countsForAverage: true,
                isFinalExam: false,
              },
            ],
          },
        ],
      },
    ]);

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(await screen.findByTestId("notes-summary-c1")).toBeTruthy();
    expect(screen.getByText("15,5/20")).toBeTruthy();
    expect(screen.getByText("Anglais")).toBeTruthy();
  });

  it("navigue vers les évaluations de l'enfant au tap sur la carte", async () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    fireEvent.press(await screen.findByTestId("notes-summary-c1"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId: "c1" },
    });
  });
});

describe("Résumé compte parent", () => {
  it("affiche le panneau compte quand le résumé est disponible", async () => {
    (authApi.parentDashboardSummary as jest.Mock).mockResolvedValue({
      unreadMessages: 5,
      payments: {
        connected: false,
        pendingCount: null,
        overdueCount: null,
        detail: "Non connecte",
      },
      documents: {
        recentCount: 1,
        totalPublishedCount: 3,
        detail: "1 bulletin publie",
        latest: [{ id: "doc-1", title: "Bulletin T1", publishedAt: null }],
      },
    });

    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(await screen.findByTestId("parent-account-section")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("n'affiche pas le panneau compte tant que le résumé n'a pas pu être chargé", () => {
    render(<ParentHome user={parentUser} schoolSlug="college-vogt" />);

    expect(screen.queryByTestId("parent-account-section")).toBeNull();
  });
});
