import React from "react";
import { StyleSheet } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ChildClassFeedScreen } from "../../src/components/feed/ChildClassFeedScreen";
import { feedApi } from "../../src/api/feed.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { colors } from "../../src/theme";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/feed.api");
jest.mock("../../src/api/timetable.api");

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
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
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
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

describe("ChildClassFeedScreen", () => {
  it("charge le feed de classe avec le scope CLASS et affiche le header homogène", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(api.list).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          viewScope: "CLASS",
          classId: "class-1",
          filter: "all",
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
    expect(screen.queryByTestId("child-class-feed-search-btn")).toBeNull();
    expect(screen.getByTestId("child-class-feed-hero-card")).toHaveStyle({
      borderRadius: 12,
      backgroundColor: "rgba(12,95,168,0.1)",
      borderColor: "rgba(12,95,168,0.2)",
    });
    expect(
      screen.getByTestId("child-class-feed-hero-controls-row"),
    ).toHaveStyle({
      flexDirection: "row",
    });
    expect(screen.getByTestId("child-class-feed-hero-search-btn")).toBeTruthy();
    expect(
      screen.getByTestId("child-class-feed-open-composer-post"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("child-class-feed-open-composer-poll"),
    ).toBeTruthy();
    expect(screen.getByText("Info")).toBeTruthy();
    expect(screen.getByText("Sondage")).toBeTruthy();
    expect(
      screen.getByTestId("child-class-feed-open-composer-post"),
    ).toHaveStyle({
      backgroundColor: "#FFF8F0",
      borderColor: "#E8CCAE",
    });
    expect(
      screen.getByTestId("child-class-feed-open-composer-poll"),
    ).toHaveStyle({
      backgroundColor: "#FFF8F0",
      borderColor: "#E8CCAE",
    });
  });

  it("change le filtre du fil de classe", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(api.list).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-filter-featured"));

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({
          viewScope: "CLASS",
          classId: "class-1",
          filter: "featured",
        }),
      );
    });
  });

  it("filtre localement sur mes posts depuis la bottom navigation", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(screen.getByText("CONSEIL DE CLASSE")).toBeTruthy();
      expect(screen.getByText("INFORMATION PARENTS")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-filter-mine"));

    await waitFor(() => {
      expect(screen.getByText("CONSEIL DE CLASSE")).toBeTruthy();
      expect(screen.queryByText("INFORMATION PARENTS")).toBeNull();
    });

    expect(api.list).toHaveBeenLastCalledWith(
      "college-vogt",
      expect.objectContaining({
        viewScope: "CLASS",
        classId: "class-1",
        filter: "all",
      }),
    );
  });

  it("ouvre le formulaire inline de reaction dans le fil de classe", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-class-feed-filter-all")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-post-react-post-1"));
    fireEvent.changeText(
      screen.getByTestId("feed-comment-input-post-1"),
      "Super",
    );
    fireEvent.press(screen.getByTestId("feed-comment-submit-post-1"));

    await waitFor(() => {
      expect(api.addComment).toHaveBeenCalledWith(
        "college-vogt",
        "post-1",
        "Super",
      );
    });
  });

  it("ouvre la recherche depuis le bloc Fil de la classe", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("child-class-feed-hero-search-btn"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-hero-search-btn"));
    expect(screen.getByTestId("child-class-feed-search-input")).toBeTruthy();
  });

  it("recherche un post depuis le bloc Fil de la classe", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("child-class-feed-hero-search-btn"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-hero-search-btn"));
    fireEvent.changeText(
      screen.getByTestId("child-class-feed-search-input"),
      "parents",
    );

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({
          viewScope: "CLASS",
          classId: "class-1",
          q: "parents",
        }),
      );
    });
  });

  it("ouvre le composeur en mode sondage depuis le bloc Fil de la classe", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(
        screen.getByTestId("child-class-feed-open-composer-poll"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-open-composer-poll"));
    expect(screen.getByTestId("feed-composer-card")).toBeTruthy();
    expect(screen.getByTestId("feed-composer-type-poll")).toHaveStyle({
      backgroundColor: "#08467D",
    });
  });

  it("revient vers l'accueil enfant via le bouton retour", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-class-feed-back")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-back"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("ouvre le menu de navigation enfant via l'icone droite", async () => {
    render(<ChildClassFeedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("child-class-feed-menu-btn")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("child-class-feed-menu-btn"));
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });
});
