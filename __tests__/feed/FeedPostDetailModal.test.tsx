import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FeedPostDetailModal } from "../../src/components/feed/FeedPostDetailModal";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const makePost = (id: string) => ({
  id,
  schoolSlug: "college-vogt",
  type: "POST" as const,
  author: {
    id: "u1",
    fullName: "Alice Martin",
    roleLabel: "Enseignant",
    avatarText: "AM",
  },
  title: `Post ${id}`,
  bodyHtml: `<p>Contenu du post ${id}</p>`,
  createdAt: "2026-04-05T10:00:00.000Z",
  featuredUntil: null,
  audience: { scope: "SCHOOL_ALL" as const, label: "Toute l'école" },
  attachments: [],
  likedByViewer: false,
  likesCount: 0,
  comments: [],
  canManage: false,
});

const posts = [makePost("p1"), makePost("p2"), makePost("p3")];

describe("FeedPostDetailModal", () => {
  it("s'affiche avec le bouton fermer", () => {
    render(
      <FeedPostDetailModal
        posts={posts}
        initialIndex={0}
        onClose={jest.fn()}
        onMarkRead={jest.fn()}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );
    expect(screen.getByTestId("feed-detail-close")).toBeTruthy();
  });

  it("appelle onClose au press du bouton fermer", () => {
    const onClose = jest.fn();
    render(
      <FeedPostDetailModal
        posts={posts}
        initialIndex={0}
        onClose={onClose}
        onMarkRead={jest.fn()}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByTestId("feed-detail-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("affiche la pagination du post courant", () => {
    render(
      <FeedPostDetailModal
        posts={posts}
        initialIndex={0}
        onClose={jest.fn()}
        onMarkRead={jest.fn()}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );
    expect(screen.getByText("1 / 3")).toBeTruthy();
  });

  it("n'affiche pas le bouton suppression si canManage=false", () => {
    render(
      <FeedPostDetailModal
        posts={posts}
        initialIndex={0}
        onClose={jest.fn()}
        onMarkRead={jest.fn()}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("feed-post-delete-p1")).toBeNull();
  });

  it("affiche le bouton suppression si canManage=true et onDelete fourni", () => {
    const postWithManage = { ...makePost("p-del"), canManage: true };
    render(
      <FeedPostDetailModal
        posts={[postWithManage]}
        initialIndex={0}
        onClose={jest.fn()}
        onMarkRead={jest.fn()}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
        onDelete={jest.fn()}
      />,
    );
    expect(screen.getByTestId("feed-post-delete-p-del")).toBeTruthy();
  });

  it("déclenche onToggleLike depuis le modal", () => {
    const onToggleLike = jest.fn();
    render(
      <FeedPostDetailModal
        posts={[makePost("p-like")]}
        initialIndex={0}
        onClose={jest.fn()}
        onMarkRead={jest.fn()}
        onToggleLike={onToggleLike}
        onAddComment={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByTestId("feed-post-like-p-like"));
    expect(onToggleLike).toHaveBeenCalledWith("p-like");
  });

  it("le header affiche le titre 'Publication'", () => {
    render(
      <FeedPostDetailModal
        posts={posts}
        initialIndex={0}
        onClose={jest.fn()}
        onMarkRead={jest.fn()}
        onToggleLike={jest.fn()}
        onAddComment={jest.fn()}
      />,
    );
    expect(screen.getByText("Publication")).toBeTruthy();
  });
});
