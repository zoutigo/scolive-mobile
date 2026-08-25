import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ClassLifeFeedScreen } from "../../src/components/feed/ClassLifeFeedScreen";
import { SuccessToastHost } from "../../src/components/feedback/SuccessToastHost";
import { feedApi } from "../../src/api/feed.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/feed.api");
jest.mock("../../src/api/timetable.api");

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
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

const api = feedApi as jest.Mocked<typeof feedApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;

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

const samplePollPost = {
  ...samplePost,
  id: "poll-1",
  type: "POLL" as const,
  title: "Sondage classe",
  poll: {
    question: "Quel jour pour la sortie ?",
    votedOptionId: null,
    options: [
      { id: "opt-1", label: "Mardi", votes: 1 },
      { id: "opt-2", label: "Jeudi", votes: 0 },
    ],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
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
    items: [samplePost],
    meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
  });
  api.create.mockResolvedValue({
    ...samplePost,
    id: "created-1",
    title: "Nouvelle publication",
  });
  api.uploadInlineImage.mockResolvedValue({
    url: "http://10.0.2.2:3001/mock/media/feed.png",
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
  api.remove.mockResolvedValue(undefined);
});

/**
 * Un parent qui consulte le fil de classe via le menu d'un enfant ne peut
 * que le lire : ni like, ni commentaire, ni vote, ni publication ne doivent
 * atteindre l'API. Régression du bug où un parent pouvait agir comme s'il
 * était dans la classe de son enfant.
 */
describe("Child class feed integration — consultation seule du parent", () => {
  it("n'appelle jamais toggleLike : le bouton like est désactivé", async () => {
    render(
      <>
        <ClassLifeFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-like-post-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-post-like-post-1"));

    expect(api.toggleLike).not.toHaveBeenCalled();
  });

  it("ne propose aucun moyen de commenter un post du fil de classe", async () => {
    render(
      <>
        <ClassLifeFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-post-1")).toBeTruthy();
    });

    expect(screen.queryByTestId("feed-post-react-post-1")).toBeNull();
    expect(screen.queryByTestId("feed-comment-input-post-1")).toBeNull();
    expect(api.addComment).not.toHaveBeenCalled();
  });

  it("n'autorise pas le vote sur un sondage du fil de classe", async () => {
    api.list.mockResolvedValue({
      items: [samplePollPost],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    render(
      <>
        <ClassLifeFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jeudi")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Jeudi"));

    expect(api.votePoll).not.toHaveBeenCalled();
  });

  it("ne propose aucun FAB pour créer une info", async () => {
    render(
      <>
        <ClassLifeFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-post-1")).toBeTruthy();
    });

    expect(screen.queryByTestId("child-class-feed-compose-fab")).toBeNull();
    expect(api.create).not.toHaveBeenCalled();
  });
});
