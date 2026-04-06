import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import FeedScreen from "../../app/(home)/feed";
import { feedApi } from "../../src/api/feed.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useFeedStore } from "../../src/store/feed.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/feed.api");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

const api = feedApi as jest.Mocked<typeof feedApi>;
let consoleErrorSpy: jest.SpyInstance | undefined;
let consoleWarnSpy: jest.SpyInstance | undefined;

const samplePost = {
  id: "post-1",
  schoolSlug: "college-vogt",
  type: "POST" as const,
  author: {
    id: "u1",
    fullName: "Alice Martin",
    roleLabel: "Parent délégué",
    avatarText: "AM",
  },
  title: "Réunion des parents",
  bodyHtml: "<p>Merci pour votre présence.</p>",
  createdAt: "2026-04-05T10:00:00.000Z",
  featuredUntil: null,
  audience: {
    scope: "PARENTS_ONLY" as const,
    label: "Parents uniquement",
  },
  attachments: [],
  likedByViewer: false,
  likesCount: 2,
  comments: [],
};

const samplePollPost = {
  ...samplePost,
  id: "poll-1",
  type: "POLL" as const,
  title: "Sondage transport",
  poll: {
    question: "Quel horaire ?",
    votedOptionId: null,
    options: [
      { id: "opt-1", label: "07:30", votes: 1 },
      { id: "opt-2", label: "08:00", votes: 0 },
    ],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  const shouldSilenceActWarning = (args: unknown[]) => {
    const message = args
      .map((value) =>
        typeof value === "string"
          ? value
          : value instanceof Error
            ? value.message
            : "",
      )
      .join(" ");
    return message.includes("not wrapped in act");
  };
  consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation((...args) => {
      if (shouldSilenceActWarning(args)) {
        return;
      }
      jest.requireActual("console").error(...args);
    });
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation((...args) => {
    if (shouldSilenceActWarning(args)) {
      return;
    }
    jest.requireActual("console").warn(...args);
  });
  useFeedStore.getState().reset();
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
    authErrorMessage: null,
  });
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
    activeChildId: "child-1",
    isLoading: false,
  });
  api.list.mockResolvedValue({
    items: [samplePost],
    meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
  });
  api.create.mockResolvedValue(samplePost);
  api.toggleLike.mockResolvedValue({ liked: true, likesCount: 3 });
  api.addComment.mockResolvedValue({
    comment: {
      id: "comment-1",
      authorName: "Robert Ntamack",
      text: "Merci",
      createdAt: "2026-04-05T11:00:00.000Z",
    },
    commentsCount: 1,
  });
  api.remove.mockResolvedValue(undefined);
  api.votePoll.mockResolvedValue({
    votedOptionId: "opt-2",
    options: [
      { id: "opt-1", label: "07:30", votes: 1 },
      { id: "opt-2", label: "08:00", votes: 1 },
    ],
  });
  api.uploadInlineImage.mockResolvedValue({
    url: "http://10.0.2.2:3001/mock/media/feed.png",
  });
});

afterEach(() => {
  consoleErrorSpy?.mockRestore();
  consoleWarnSpy?.mockRestore();
});

async function renderFeedScreen() {
  render(<FeedScreen />);
  await waitFor(() => {
    expect(api.list).toHaveBeenCalled();
  });
}

describe("FeedScreen", () => {
  it("charge le feed au montage", async () => {
    await renderFeedScreen();

    expect(api.list).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ page: 1, limit: 12 }),
    );

    expect(screen.getByText("Réunion des parents")).toBeTruthy();
  });

  it("ouvre et referme la recherche", async () => {
    await renderFeedScreen();

    fireEvent.press(screen.getByTestId("feed-search-btn"));
    expect(screen.getByTestId("feed-search-input")).toBeTruthy();

    fireEvent.changeText(screen.getByTestId("feed-search-input"), "forum");
    fireEvent.press(screen.getByTestId("feed-search-close"));
    expect(screen.queryByTestId("feed-search-input")).toBeNull();
  });

  it("affiche un header sans sous-titre", async () => {
    await renderFeedScreen();

    expect(screen.queryByText(/La vie de l'école|contexte actif/i)).toBeNull();
  });

  it("affiche les filtres dans une barre basse avec 'Tout' actif par défaut", async () => {
    await renderFeedScreen();

    expect(screen.getByTestId("feed-filter-all")).toBeTruthy();
    expect(screen.getByTestId("feed-filter-featured")).toBeTruthy();
    expect(screen.getByTestId("feed-filter-polls")).toBeTruthy();
    expect(screen.getByTestId("feed-filter-all")).toHaveStyle({
      flex: 1,
    });
  });

  it("ouvre le composeur depuis le CTA", async () => {
    await renderFeedScreen();

    fireEvent.press(screen.getByTestId("feed-open-composer"));

    expect(screen.getByTestId("feed-composer-card")).toBeTruthy();
  });

  it("change le filtre du feed", async () => {
    await renderFeedScreen();

    fireEvent.press(screen.getByTestId("feed-filter-featured"));

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ filter: "featured" }),
      );
    });
  });

  it("recherche une publication", async () => {
    await renderFeedScreen();

    fireEvent.press(screen.getByTestId("feed-search-btn"));
    fireEvent.changeText(screen.getByTestId("feed-search-input"), "transport");

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ q: "transport" }),
      );
    });
  });

  it("charge plus quand on atteint la fin de liste", async () => {
    api.list
      .mockResolvedValueOnce({
        items: [samplePost],
        meta: { page: 1, limit: 12, total: 24, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [{ ...samplePost, id: "post-2", title: "Deuxième actualité" }],
        meta: { page: 2, limit: 12, total: 24, totalPages: 2 },
      });

    await renderFeedScreen();

    fireEvent(screen.getByTestId("feed-list"), "onEndReached", {
      distanceFromEnd: 20,
    });

    await waitFor(() => {
      expect(api.list).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("réagit à un like", async () => {
    await renderFeedScreen();

    fireEvent.press(screen.getByTestId("feed-post-like-post-1"));

    await waitFor(() => {
      expect(api.toggleLike).toHaveBeenCalledWith("college-vogt", "post-1");
    });
  });

  it("enregistre un vote de sondage via l'api", async () => {
    api.list.mockResolvedValueOnce({
      items: [samplePollPost],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    await renderFeedScreen();

    fireEvent.press(screen.getByText("08:00"));

    await waitFor(() => {
      expect(api.votePoll).toHaveBeenCalledWith(
        "college-vogt",
        "poll-1",
        "opt-2",
      );
    });
  });
});
