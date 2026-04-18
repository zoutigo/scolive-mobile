import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FeedPostCard } from "../../src/components/feed/FeedPostCard";
import { formatFeedDate } from "../../src/components/feed/feed.helpers";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const post = {
  id: "post-1",
  schoolSlug: "college-vogt",
  type: "POST" as const,
  author: {
    id: "u1",
    fullName: "Mme Alice Martin",
    civility: "Mme" as const,
    roleLabel: "Parent délégué",
    avatarText: "AM",
  },
  title: "Réunion des parents",
  bodyHtml: "<p>Merci de votre présence.</p>",
  createdAt: "2026-04-05T10:00:00.000Z",
  featuredUntil: "2026-04-08T10:00:00.000Z",
  audience: {
    scope: "PARENTS_ONLY" as const,
    label: "Parents uniquement",
  },
  attachments: [
    { id: "a1", fileName: "ordre-du-jour.pdf", sizeLabel: "44 Ko" },
  ],
  likedByViewer: false,
  likesCount: 2,
  comments: [
    {
      id: "c1",
      authorName: "Robert Ntamack",
      text: "Merci",
      createdAt: "2026-04-05T11:00:00.000Z",
    },
  ],
};

const pollPost = {
  ...post,
  id: "poll-1",
  type: "POLL" as const,
  poll: {
    question: "Quel créneau préférez-vous ?",
    votedOptionId: null,
    options: [
      { id: "option-1", label: "Mercredi matin", votes: 4 },
      { id: "option-2", label: "Vendredi après-midi", votes: 2 },
    ],
  },
};

describe("FeedPostCard", () => {
  it("affiche les informations principales du post", () => {
    const expectedMeta = `Mme A.MARTIN · Parent délégué · ${formatFeedDate(post.createdAt)}`;

    render(
      <FeedPostCard
        post={post}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );

    expect(screen.getByTestId("feed-post-post-1")).toHaveStyle({
      borderRadius: 12,
      paddingTop: 14,
    });
    expect(screen.getByText("RÉUNION DES PARENTS")).toBeTruthy();
    expect(screen.getByText(expectedMeta)).toBeTruthy();
    expect(screen.getByText(expectedMeta)).toHaveStyle({
      fontSize: 11,
    });
    expect(screen.getByText(expectedMeta)).toHaveProp("numberOfLines", 1);
    expect(screen.getAllByText("ordre-du-jour.pdf")).toHaveLength(2);
    expect(screen.queryByText("Parents uniquement")).toBeNull();
    expect(screen.queryByText("AM")).toBeNull();
    expect(screen.queryByTestId("feed-post-delete-post-1")).toBeNull();
  });

  it("affiche le titre en uppercase primary et le badge à la une sans texte", () => {
    render(
      <FeedPostCard
        post={post}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );

    const title = screen.getByText("RÉUNION DES PARENTS");
    expect(title).toBeTruthy();
    expect(title).toHaveStyle({
      color: "#0C5FA8",
      textTransform: "uppercase",
      fontSize: 13,
    });
    expect(screen.queryByText("À la une")).toBeNull();
    expect(screen.getByTestId("feed-post-featured-post-1")).toHaveStyle({
      backgroundColor: "#FFFBEB",
      borderColor: "#FCD34D",
      borderWidth: 1,
    });
  });

  it("déclenche le like", () => {
    const onToggleLike = jest.fn();
    render(
      <FeedPostCard
        post={post}
        onToggleLike={onToggleLike}
        onAddComment={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-post-like-post-1"));
    expect(onToggleLike).toHaveBeenCalledWith("post-1");
    expect(screen.getByLabelText("Réactions 2")).toBeTruthy();
    expect(
      screen.getByTestId("feed-post-comments-count-post-1-1"),
    ).toHaveTextContent("1");
  });

  it("applique les couleurs web aux badges d'action", () => {
    render(
      <FeedPostCard
        post={post}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );

    expect(screen.getByTestId("feed-post-like-post-1")).toHaveStyle({
      backgroundColor: "#FEF2F2",
      borderColor: "#FECACA",
    });
    expect(screen.getByTestId("feed-post-comments-toggle-post-1")).toHaveStyle({
      backgroundColor: "#EFF6FF",
      borderColor: "#BFDBFE",
    });
    expect(screen.getByTestId("feed-post-react-post-1")).toHaveStyle({
      backgroundColor: "#ECFDF5",
      borderColor: "#A7F3D0",
    });
  });

  it("ouvre les commentaires sans afficher le composer de reaction", () => {
    const onAddComment = jest.fn();
    render(
      <FeedPostCard
        post={post}
        onToggleLike={jest.fn()}
        onAddComment={onAddComment}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-post-comments-toggle-post-1"));
    expect(screen.getByText("Robert Ntamack")).toBeTruthy();
    expect(screen.queryByTestId("feed-comment-input-post-1")).toBeNull();
    expect(screen.queryByText("1 commentaire")).toBeNull();
    expect(screen.queryByText("R")).toBeNull();
  });

  it("ouvre le composer inline depuis Réagir et envoie un commentaire", () => {
    const onAddComment = jest.fn();
    render(
      <FeedPostCard
        post={post}
        onToggleLike={jest.fn()}
        onAddComment={onAddComment}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-post-react-post-1"));
    expect(screen.getByTestId("feed-reaction-emoji-post-1-😀")).toBeTruthy();
    expect(screen.getByTestId("feed-comment-submit-post-1")).toHaveStyle({
      borderRadius: 6,
      minHeight: 40,
      backgroundColor: "#0C5FA8",
    });
    fireEvent.changeText(
      screen.getByTestId("feed-comment-input-post-1"),
      "Merci",
    );
    fireEvent.press(screen.getByTestId("feed-comment-submit-post-1"));

    expect(onAddComment).toHaveBeenCalledWith("post-1", "Merci");
    expect(screen.queryByTestId("feed-comment-input-post-1")).toBeNull();
  });

  it("rend l'action de suppression si la publication est gérable", () => {
    render(
      <FeedPostCard
        post={{ ...post, canManage: true }}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(screen.getByTestId("feed-post-delete-post-1")).toBeTruthy();
  });

  it("expose des testID stables pour les votes du sondage", () => {
    const onVote = jest.fn();
    render(
      <FeedPostCard
        post={pollPost}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
        onVote={onVote}
      />,
    );

    fireEvent.press(
      screen.getByTestId("feed-post-poll-option-poll-1-option-1"),
    );

    expect(onVote).toHaveBeenCalledWith("poll-1", "option-1");
    expect(screen.getByLabelText("Mercredi matin, 4 votes")).toBeTruthy();
    expect(screen.getByLabelText("Vendredi après-midi, 2 votes")).toBeTruthy();
  });
});
