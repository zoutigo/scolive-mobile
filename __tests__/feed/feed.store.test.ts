import { feedApi } from "../../src/api/feed.api";
import { useFeedStore } from "../../src/store/feed.store";

jest.mock("../../src/api/feed.api");

const api = feedApi as jest.Mocked<typeof feedApi>;

const post1 = {
  id: "post-1",
  schoolSlug: "college-vogt",
  type: "POST" as const,
  author: {
    id: "u1",
    fullName: "Alice Martin",
    roleLabel: "Parent",
    avatarText: "AM",
  },
  title: "Réunion",
  bodyHtml: "<p>Bonsoir</p>",
  createdAt: "2026-04-05T10:00:00.000Z",
  featuredUntil: null,
  audience: { scope: "SCHOOL_ALL" as const, label: "Toute l'école" },
  attachments: [],
  likedByViewer: false,
  likesCount: 0,
  comments: [],
};

const post2 = {
  ...post1,
  id: "post-2",
  title: "Sondage transport",
  type: "POLL" as const,
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
});

describe("feed.store", () => {
  it("charge le feed avec le filtre et la recherche", async () => {
    useFeedStore.setState({ filter: "featured", search: "réunion" });
    api.list.mockResolvedValueOnce({
      items: [post1],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    await useFeedStore.getState().loadFeed("college-vogt");

    expect(api.list).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ filter: "featured", q: "réunion" }),
    );
    expect(useFeedStore.getState().posts).toHaveLength(1);
  });

  it("charge la page suivante sans doublons", async () => {
    useFeedStore.setState({
      posts: [post1],
      meta: { page: 1, limit: 12, total: 24, totalPages: 2 },
    });
    api.list.mockResolvedValueOnce({
      items: [post1, post2],
      meta: { page: 2, limit: 12, total: 24, totalPages: 2 },
    });

    await useFeedStore.getState().loadMoreFeed("college-vogt");

    expect(useFeedStore.getState().posts).toHaveLength(2);
  });

  it("ne charge pas de page suivante quand tout est déjà chargé", async () => {
    useFeedStore.setState({
      posts: [post1],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });

    await useFeedStore.getState().loadMoreFeed("college-vogt");

    expect(api.list).not.toHaveBeenCalled();
  });

  it("réinitialise isLoading après un échec de chargement", async () => {
    api.list.mockRejectedValueOnce(new Error("FEED_DOWN"));

    await expect(
      useFeedStore.getState().loadFeed("college-vogt"),
    ).rejects.toThrow("FEED_DOWN");

    expect(useFeedStore.getState().isLoading).toBe(false);
  });

  it("réinitialise isRefreshing après un échec de refresh", async () => {
    api.list.mockRejectedValueOnce(new Error("REFRESH_DOWN"));

    await expect(
      useFeedStore.getState().refreshFeed("college-vogt"),
    ).rejects.toThrow("REFRESH_DOWN");

    expect(useFeedStore.getState().isRefreshing).toBe(false);
  });

  it("préfixe une publication nouvellement créée", () => {
    useFeedStore.setState({ posts: [post1] });
    useFeedStore.getState().prependPost(post2);
    expect(useFeedStore.getState().posts[0]?.id).toBe("post-2");
  });

  it("remplace une publication existante", () => {
    useFeedStore.setState({ posts: [post1] });
    useFeedStore
      .getState()
      .replacePost({ ...post1, title: "Réunion mise à jour" });
    expect(useFeedStore.getState().posts[0]?.title).toBe("Réunion mise à jour");
  });

  it("retire une publication et décrémente le total", () => {
    useFeedStore.setState({
      posts: [post1, post2],
      meta: { page: 1, limit: 12, total: 2, totalPages: 1 },
    });
    useFeedStore.getState().removePost("post-1");
    expect(useFeedStore.getState().posts).toHaveLength(1);
    expect(useFeedStore.getState().meta?.total).toBe(1);
  });

  it("applique un like local", () => {
    useFeedStore.setState({ posts: [post1] });
    useFeedStore.getState().applyLike("post-1", true, 4);
    expect(useFeedStore.getState().posts[0]).toMatchObject({
      likedByViewer: true,
      likesCount: 4,
    });
  });

  it("ajoute un commentaire local", () => {
    useFeedStore.setState({ posts: [post1] });
    useFeedStore.getState().appendComment("post-1", {
      id: "comment-1",
      authorName: "Robert Ntamack",
      text: "Merci",
      createdAt: "2026-04-05T10:00:00.000Z",
    });
    expect(useFeedStore.getState().posts[0]?.comments).toHaveLength(1);
  });

  it("applique un vote persiste sur un sondage", () => {
    useFeedStore.setState({ posts: [post2] });
    useFeedStore.getState().applyPollVote("post-2", "opt-2", [
      { id: "opt-1", label: "07:30", votes: 1 },
      { id: "opt-2", label: "08:00", votes: 1 },
    ]);
    expect(useFeedStore.getState().posts[0]?.poll?.votedOptionId).toBe("opt-2");
    expect(useFeedStore.getState().posts[0]?.poll?.options[1]?.votes).toBe(1);
  });

  it("remplace l'etat du sondage par la reponse backend", () => {
    useFeedStore.setState({
      posts: [{ ...post2, poll: { ...post2.poll, votedOptionId: "opt-1" } }],
    });
    useFeedStore.getState().applyPollVote("post-2", "opt-1", [
      { id: "opt-1", label: "07:30", votes: 2 },
      { id: "opt-2", label: "08:00", votes: 0 },
    ]);
    expect(useFeedStore.getState().posts[0]?.poll?.votedOptionId).toBe("opt-1");
    expect(useFeedStore.getState().posts[0]?.poll?.options[0]?.votes).toBe(2);
  });
});
