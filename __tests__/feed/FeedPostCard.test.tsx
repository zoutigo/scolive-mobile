import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FeedPostCard } from "../../src/components/feed/FeedPostCard";

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
    render(
      <FeedPostCard
        post={post}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );

    expect(screen.getByText("Réunion des parents")).toBeTruthy();
    expect(screen.getAllByText("ordre-du-jour.pdf")).toHaveLength(2);
    expect(screen.queryByText("Parents uniquement")).toBeNull();
    expect(screen.getByText("Mme Alice Martin · Parent délégué")).toBeTruthy();
    expect(screen.queryByText("AM")).toBeNull();
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

  it("ouvre les commentaires et envoie un nouveau commentaire", () => {
    const onAddComment = jest.fn();
    render(
      <FeedPostCard
        post={post}
        onToggleLike={jest.fn()}
        onAddComment={onAddComment}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-post-comments-toggle-post-1"));
    fireEvent.changeText(
      screen.getByTestId("feed-comment-input-post-1"),
      "Bonsoir",
    );
    fireEvent.press(screen.getByTestId("feed-comment-submit-post-1"));

    expect(onAddComment).toHaveBeenCalledWith("post-1", "Bonsoir");
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
