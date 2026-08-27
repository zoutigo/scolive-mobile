import React from "react";
import { StyleSheet } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ClassLifeFeedScreen } from "../../src/components/feed/ClassLifeFeedScreen";
import { feedApi } from "../../src/api/feed.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";
import { colors } from "../../src/theme";
import { useDrawer } from "../../src/components/navigation/drawer-context";
import {
  FEED_FILTERS_TOUR_ID,
  FEED_FILTERS_TOUR_TARGETS,
} from "../../src/components/feed/feed-filters-tour.config";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/feed.api");
jest.mock("../../src/api/timetable.api");

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const api = feedApi as jest.Mocked<typeof feedApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

const samplePost = {
  id: "post-1",
  schoolSlug: "college-vogt",
  type: "POST" as const,
  author: {
    id: "u1",
    fullName: "Alice Martin",
    roleLabel: "Professeur principal",
    avatarText: "AM",
  },
  title: "Conseil de classe",
  bodyHtml: "<p>Le conseil de classe aura lieu jeudi.</p>",
  createdAt: "2026-04-17T10:00:00.000Z",
  featuredUntil: null,
  audience: {
    scope: "CLASS" as const,
    label: "Classe 6e C",
    classId: "class-1",
  },
  attachments: [],
  likedByViewer: false,
  likesCount: 2,
  comments: [],
  authoredByViewer: true,
};

const otherPost = {
  ...samplePost,
  id: "post-2",
  title: "Information parents",
  authoredByViewer: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  useOnboardingTourStore.setState({
    completedTours: {},
    activeTourId: null,
    activeRole: null,
    steps: [],
    stepIndex: 0,
    targetLayout: null,
  });
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  });
  useAuthStore.setState({
    user: {
      id: "user-1",
      firstName: "Robert",
      lastName: "Ntamack",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
      role: "PARENT",
      activeRole: "PARENT",
    },
    schoolSlug: "college-vogt",
    isLoading: false,
    isAuthenticated: true,
    accessToken: "token",
  } as never);
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
    activeChildId: null,
    isLoading: false,
  });
  mockTimetableApi.getMyTimetable.mockResolvedValue({
    student: { id: "child-1", firstName: "Remi", lastName: "Ntamack" },
    class: {
      id: "class-1",
      name: "6e C",
      schoolYearId: "sy-1",
      academicLevelId: null,
    },
    slots: [],
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: [],
    calendarEvents: [],
    subjectStyles: [],
  });
  api.list.mockResolvedValue({
    items: [samplePost, otherPost],
    meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
  });
  api.toggleLike.mockResolvedValue({ liked: true, likesCount: 3 });
  api.addComment.mockResolvedValue({
    comment: {
      id: "comment-1",
      authorName: "Robert Ntamack",
      text: "Merci",
      createdAt: "2026-04-17T11:00:00.000Z",
    },
    commentsCount: 1,
  });
  api.votePoll.mockResolvedValue({
    votedOptionId: "opt-1",
    options: [{ id: "opt-1", label: "Oui", votes: 1 }],
  });
  api.create.mockResolvedValue(samplePost);
  api.uploadInlineImage.mockResolvedValue({
    url: "http://10.0.2.2:3001/mock/media/feed.png",
  });
  api.remove.mockResolvedValue(undefined);
});

describe("ClassLifeFeedScreen", () => {
  it("charge le feed de classe avec le scope CLASS et affiche le header homogène", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          viewScope: "CLASS",
          classId: "class-1",
          types: [],
        }),
      );
    });

    const header = screen.getByTestId("child-class-feed-header");
    const headerStyle = StyleSheet.flatten(header.props.style);

    expect(screen.getByText("Vie de classe")).toBeTruthy();
    expect(screen.getByText("Remi Ntamack • 6e C")).toBeTruthy();
    expect(screen.getByText("CONSEIL DE CLASSE")).toBeTruthy();
    expect(screen.getByText("INFORMATION PARENTS")).toBeTruthy();
    expect(headerStyle.backgroundColor).toBe(colors.primary);
    expect(screen.getByTestId("child-class-feed-search-input")).toBeTruthy();
    expect(screen.getByTestId("child-class-feed-filter-toggle")).toBeTruthy();
    // Consultation seule pour un parent en contexte enfant : pas de FAB de
    // publication.
    expect(screen.queryByTestId("child-class-feed-compose-fab")).toBeNull();
  });

  // Régression : le bouton d'aide du header n'était jamais branché.
  it("ouvre la modale d'aide via le bouton du header", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => expect(api.list).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("child-class-feed-help-menu-item"));

    expect(screen.getByTestId("child-class-feed-help-title")).toBeTruthy();
  });

  it("change le filtre du fil de classe via le panneau de filtres", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(api.list).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    fireEvent.press(
      screen.getByTestId("child-class-feed-filter-chip-featured"),
    );
    fireEvent.press(screen.getByTestId("child-class-feed-filter-apply"));

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({
          viewScope: "CLASS",
          classId: "class-1",
          types: ["featured"],
        }),
      );
    });
  });

  it("combine plusieurs chips de type dans le panneau de filtres", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(api.list).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    fireEvent.press(
      screen.getByTestId("child-class-feed-filter-chip-featured"),
    );
    fireEvent.press(screen.getByTestId("child-class-feed-filter-chip-polls"));
    fireEvent.press(screen.getByTestId("child-class-feed-filter-apply"));

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({
          types: ["featured", "polls"],
        }),
      );
    });
  });

  it("filtre localement sur mes posts via le chip 'Les miens'", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(screen.getByText("CONSEIL DE CLASSE")).toBeTruthy();
      expect(screen.getByText("INFORMATION PARENTS")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    fireEvent.press(screen.getByTestId("child-class-feed-filter-chip-mine"));
    fireEvent.press(screen.getByTestId("child-class-feed-filter-apply"));

    await waitFor(() => {
      expect(screen.getByText("CONSEIL DE CLASSE")).toBeTruthy();
      expect(screen.queryByText("INFORMATION PARENTS")).toBeNull();
    });

    expect(api.list).toHaveBeenLastCalledWith(
      "college-vogt",
      expect.objectContaining({
        viewScope: "CLASS",
        classId: "class-1",
        types: [],
      }),
    );
  });

  it("le bouton filtre devient actif seulement après Apply, et Reset l'efface", async () => {
    render(<ClassLifeFeedScreen />);
    await waitFor(() => expect(api.list).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    fireEvent.press(
      screen.getByTestId("child-class-feed-filter-chip-featured"),
    );

    let toggle = screen.getByTestId("child-class-feed-filter-toggle");
    expect(StyleSheet.flatten(toggle.props.style).backgroundColor).not.toBe(
      colors.accentTeal,
    );

    fireEvent.press(screen.getByTestId("child-class-feed-filter-apply"));

    await waitFor(() => {
      toggle = screen.getByTestId("child-class-feed-filter-toggle");
      expect(StyleSheet.flatten(toggle.props.style).backgroundColor).toBe(
        colors.accentTeal,
      );
    });

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    fireEvent.press(screen.getByTestId("child-class-feed-filter-reset"));

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ types: [] }),
      );
    });
    toggle = screen.getByTestId("child-class-feed-filter-toggle");
    expect(StyleSheet.flatten(toggle.props.style).backgroundColor).not.toBe(
      colors.accentTeal,
    );
  });

  it("Close referme le panneau sans appliquer le brouillon en cours", async () => {
    render(<ClassLifeFeedScreen />);
    await waitFor(() => expect(api.list).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    fireEvent.press(screen.getByTestId("child-class-feed-filter-chip-polls"));
    fireEvent.press(screen.getByTestId("child-class-feed-filter-close"));

    expect(screen.queryByTestId("child-class-feed-filter-panel")).toBeNull();
    expect(api.list).not.toHaveBeenLastCalledWith(
      "college-vogt",
      expect.objectContaining({ types: ["polls"] }),
    );

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    const pollsChip = screen.getByTestId("child-class-feed-filter-chip-polls");
    expect(StyleSheet.flatten(pollsChip.props.style).backgroundColor).not.toBe(
      colors.accentTeal,
    );
  });

  describe("consultation seule (parent en contexte enfant)", () => {
    it("ne propose ni FAB de publication, ni bouton reagir, ni suppression", async () => {
      render(<ClassLifeFeedScreen />);

      await waitFor(() => {
        expect(screen.getByTestId("feed-post-post-1")).toBeTruthy();
      });

      expect(screen.queryByTestId("child-class-feed-compose-fab")).toBeNull();
      expect(screen.queryByTestId("feed-post-react-post-1")).toBeNull();
      expect(screen.queryByTestId("feed-post-react-post-2")).toBeNull();
      expect(screen.queryByTestId("feed-comment-input-post-1")).toBeNull();
      expect(screen.queryByTestId("feed-post-delete-post-1")).toBeNull();
    });

    it("desactive le bouton like sans masquer le compteur (consultation possible)", async () => {
      render(<ClassLifeFeedScreen />);

      await waitFor(() => {
        expect(screen.getByTestId("feed-post-like-post-1")).toBeTruthy();
      });

      const likeButton = screen.getByTestId("feed-post-like-post-1");
      expect(likeButton.props.accessibilityState?.disabled).toBe(true);

      fireEvent.press(likeButton);
      expect(api.toggleLike).not.toHaveBeenCalled();
    });

    it("garde la consultation des commentaires existants possible", async () => {
      render(<ClassLifeFeedScreen />);

      await waitFor(() => {
        expect(
          screen.getByTestId("feed-post-comments-toggle-post-1"),
        ).toBeTruthy();
      });

      // Le bouton de consultation des commentaires reste actif : ce n'est
      // pas une action, seulement de la lecture.
      fireEvent.press(screen.getByTestId("feed-post-comments-toggle-post-1"));
      expect(
        screen.getByTestId("feed-post-comments-toggle-post-1"),
      ).toBeTruthy();
    });
  });

  it("revient vers l'accueil enfant via le bouton retour", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-class-feed-back")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });
});

describe("ClassLifeFeedScreen — tour d'aide guidée sur les filtres", () => {
  it("démarre le tour au premier affichage pour le rôle parent", async () => {
    render(<ClassLifeFeedScreen />);

    await waitFor(() => {
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        FEED_FILTERS_TOUR_ID,
      );
    });
    expect(useOnboardingTourStore.getState().steps[0]?.targetKey).toBe(
      FEED_FILTERS_TOUR_TARGETS.filterToggle,
    );
  });

  it("avance à l'étape suivante quand on appuie sur le bouton filtre, puis sur Appliquer une fois sur l'étape apply", async () => {
    render(<ClassLifeFeedScreen />);
    await waitFor(() => {
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        FEED_FILTERS_TOUR_ID,
      );
    });

    fireEvent.press(screen.getByTestId("child-class-feed-filter-toggle"));
    expect(useOnboardingTourStore.getState().stepIndex).toBe(1);
    expect(useOnboardingTourStore.getState().steps[1]?.targetKey).toBe(
      FEED_FILTERS_TOUR_TARGETS.typeChips,
    );

    // L'étape "chips" est informative (pas advanceOnTargetPress) : elle
    // avance via le bouton "Suivant" du tooltip global, simulé ici par un
    // appel direct au store plutôt que par l'overlay (non monté dans ce test).
    useOnboardingTourStore.getState().next();
    expect(useOnboardingTourStore.getState().steps[2]?.targetKey).toBe(
      FEED_FILTERS_TOUR_TARGETS.apply,
    );

    fireEvent.press(screen.getByTestId("child-class-feed-filter-apply"));
    expect(useOnboardingTourStore.getState().stepIndex).toBe(3);
    expect(useOnboardingTourStore.getState().steps[3]?.targetKey).toBe(
      FEED_FILTERS_TOUR_TARGETS.helpToggle,
    );
  });

  it("ouvre la modale d'aide au tap sur le bouton d'aide même quand ce dernier est l'étape active du tour", async () => {
    render(<ClassLifeFeedScreen />);
    await waitFor(() => {
      expect(useOnboardingTourStore.getState().activeTourId).toBe(
        FEED_FILTERS_TOUR_ID,
      );
    });

    useOnboardingTourStore.setState({ stepIndex: 3 });
    expect(useOnboardingTourStore.getState().steps[3]?.targetKey).toBe(
      FEED_FILTERS_TOUR_TARGETS.helpToggle,
    );

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("child-class-feed-help-menu-item"));

    expect(screen.getByTestId("child-class-feed-help-title")).toBeTruthy();
  });
});
