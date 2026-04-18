import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import FeedScreen from "../../app/(home)/feed";
import { feedApi } from "../../src/api/feed.api";
import { SuccessToastHost } from "../../src/components/feedback/SuccessToastHost";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useFeedStore } from "../../src/store/feed.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { __setMockEditorContentHtml } from "../../__mocks__/react-native-pell-rich-editor";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/feed.api");

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

const api = feedApi as jest.Mocked<typeof feedApi>;

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
  canManage: true,
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
  useFeedStore.getState().reset();
  useSuccessToastStore.getState().hide();
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
  api.create.mockResolvedValue({
    ...samplePost,
    id: "post-2",
    title: "Conseil de classe",
  });
  api.votePoll.mockResolvedValue({
    votedOptionId: "opt-2",
    options: [
      { id: "opt-1", label: "07:30", votes: 1 },
      { id: "opt-2", label: "08:00", votes: 1 },
    ],
  });
  api.remove.mockResolvedValue(undefined);
  api.uploadInlineImage.mockResolvedValue({
    url: "http://10.0.2.2:3001/mock/media/feed.png",
  });
});

describe("Feed integration", () => {
  it("garde la barre basse des filtres visible hors composition", async () => {
    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-filter-bottom-bar")).toBeTruthy();
    });
  });

  it("publie une actualité et affiche le toast global", async () => {
    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-open-composer")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-open-composer"));
    expect(screen.queryByTestId("feed-filter-bottom-bar")).toBeNull();
    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Conseil de classe",
    );
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Actualité publiée",
    );
    expect(useFeedStore.getState().posts[0]?.id).toBe("post-2");
  });

  it("affiche un toast d'erreur si la publication échoue", async () => {
    api.create.mockRejectedValueOnce(new Error("Publication verrouillée"));

    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-open-composer")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-open-composer"));
    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Conseil bloqué",
    );
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });
    expect(screen.getByTestId("success-toast-variant")).toHaveTextContent(
      "Échec",
    );
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Publication impossible",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Publication verrouillée",
    );
  });

  it("publie aussi si le rich editor n'a pas encore propagé onChange", async () => {
    __setMockEditorContentHtml("<p>Contenu lu au submit</p>");

    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-open-composer")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-open-composer"));
    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Conseil pédagogique",
    );
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(api.create).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          title: "Conseil pédagogique",
          bodyHtml: "<p>Contenu lu au submit</p>",
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });
  });

  it("supprime une publication et la retire du store", async () => {
    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-delete-post-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-post-delete-post-1"));
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(api.remove).toHaveBeenCalledWith("college-vogt", "post-1");
    });

    expect(useFeedStore.getState().posts).toHaveLength(0);
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Publication supprimée",
    );
  });

  it("affiche un toast d'erreur si le like échoue", async () => {
    api.toggleLike.mockRejectedValueOnce(new Error("Like indisponible"));

    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-like-post-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-post-like-post-1"));

    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Réaction indisponible",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Like indisponible",
    );
  });

  it("ouvre le formulaire inline de reaction et ajoute le commentaire au post", async () => {
    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-react-post-1")).toBeTruthy();
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
    await waitFor(() => {
      expect(screen.queryByTestId("feed-comment-input-post-1")).toBeNull();
    });
  });

  it("affiche un toast d'erreur si le commentaire échoue", async () => {
    api.addComment.mockRejectedValueOnce(new Error("Commentaire fermé"));

    render(
      <>
        <FeedScreen />
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
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Commentaire non envoyé",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Commentaire fermé",
    );
  });

  it("persiste un vote de sondage dans le store", async () => {
    api.list.mockResolvedValueOnce({
      items: [samplePollPost],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("08:00")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("08:00"));

    await waitFor(() => {
      expect(api.votePoll).toHaveBeenCalledWith(
        "college-vogt",
        "poll-1",
        "opt-2",
      );
    });
    expect(useFeedStore.getState().posts[0]?.poll?.votedOptionId).toBe("opt-2");
    expect(useFeedStore.getState().posts[0]?.poll?.options[1]?.votes).toBe(1);
  });

  it("affiche un toast d'erreur si le vote échoue", async () => {
    api.list.mockResolvedValueOnce({
      items: [samplePollPost],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
    api.votePoll.mockRejectedValueOnce(new Error("Vote déjà enregistré"));

    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("08:00")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("08:00"));

    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Vote indisponible",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Vote déjà enregistré",
    );
  });

  it("affiche un toast d'erreur si la suppression échoue", async () => {
    api.remove.mockRejectedValueOnce(new Error("Suppression refusée"));

    render(
      <>
        <FeedScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("feed-post-delete-post-1")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("feed-post-delete-post-1"));
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Suppression impossible",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Suppression refusée",
    );
  });
});
