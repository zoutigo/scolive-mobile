import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ChildClassFeedScreen } from "../../src/components/feed/ChildClassFeedScreen";
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

describe("Child class feed integration", () => {
  it("ajoute un like sur un post du fil de classe", async () => {
    render(
      <>
        <ChildClassFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-like-post-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-post-like-post-1"));

    await waitFor(() => {
      expect(api.toggleLike).toHaveBeenCalledWith("college-vogt", "post-1");
    });
  });

  it("ajoute un commentaire sur un post du fil de classe", async () => {
    render(
      <>
        <ChildClassFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-react-post-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-post-react-post-1"));
    fireEvent.changeText(
      screen.getByTestId("feed-comment-input-post-1"),
      "Merci",
    );
    fireEvent.press(screen.getByTestId("feed-comment-submit-post-1"));

    await waitFor(() => {
      expect(api.addComment).toHaveBeenCalledWith(
        "college-vogt",
        "post-1",
        "Merci",
      );
    });
  });

  it("participe a un sondage du fil de classe", async () => {
    api.list.mockResolvedValue({
      items: [samplePollPost],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    render(
      <>
        <ChildClassFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("Jeudi")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Jeudi"));

    await waitFor(() => {
      expect(api.votePoll).toHaveBeenCalledWith(
        "college-vogt",
        "poll-1",
        "opt-2",
      );
    });
  });

  it("crée une info depuis le bouton hero Info", async () => {
    render(
      <>
        <ChildClassFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("child-class-feed-open-composer-post"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-open-composer-post"));
    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Info familles",
    );
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          type: "POST",
          title: "Info familles",
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
        "Actualité publiée",
      );
    });
  });

  it("crée un sondage depuis le bouton hero Sondage", async () => {
    render(
      <>
        <ChildClassFeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("child-class-feed-open-composer-poll"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("child-class-feed-open-composer-poll"));
    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Sondage sortie",
    );
    fireEvent.changeText(
      screen.getByTestId("feed-composer-poll-question"),
      "Quel jour vous convient ?",
    );
    fireEvent.changeText(
      screen.getByTestId("feed-composer-poll-option-1"),
      "Mardi",
    );
    fireEvent.changeText(
      screen.getByTestId("feed-composer-poll-option-2"),
      "Jeudi",
    );
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          type: "POLL",
          title: "Sondage sortie",
          pollQuestion: "Quel jour vous convient ?",
          pollOptions: ["Mardi", "Jeudi"],
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
        "Sondage publié",
      );
    });
  });
});
