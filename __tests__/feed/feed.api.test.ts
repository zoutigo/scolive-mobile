import { feedApi } from "../../src/api/feed.api";
import { tokenStorage } from "../../src/api/client";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("feed-token"),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function okJson(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001/api";
  jest.spyOn(tokenStorage, "getAccessToken").mockResolvedValue("feed-token");
});

describe("feedApi.list()", () => {
  it("appelle le bon endpoint avec les filtres", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        items: [],
        meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
      }),
    );

    await feedApi.list("college-vogt", {
      filter: "featured",
      q: "conseil",
      page: 2,
      limit: 12,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/schools/college-vogt/feed?");
    expect(url).toContain("filter=featured");
    expect(url).toContain("q=conseil");
    expect(url).toContain("page=2");
    expect(options.headers.Authorization).toBe("Bearer feed-token");
  });

  it("mappe les posts en ajoutant schoolSlug", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        items: [
          {
            id: "post-1",
            type: "POST",
            author: {
              id: "u1",
              fullName: "Alice Martin",
              roleLabel: "Parent",
              avatarText: "AM",
            },
            title: "Conseil de classe",
            bodyHtml: "<p>Bonjour</p>",
            createdAt: "2026-04-05T10:00:00.000Z",
            featuredUntil: null,
            audience: { scope: "SCHOOL_ALL", label: "Toute l'école" },
            attachments: [],
            likedByViewer: false,
            likesCount: 0,
            comments: [],
          },
        ],
        meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
      }),
    );

    const result = await feedApi.list("college-vogt");
    expect(result.items[0]?.schoolSlug).toBe("college-vogt");
  });
});

describe("feedApi.create()", () => {
  it("poste une création de publication en JSON", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        id: "post-1",
        type: "POST",
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
        audience: { scope: "PARENTS_ONLY", label: "Parents uniquement" },
        attachments: [],
        likedByViewer: false,
        likesCount: 0,
        comments: [],
      }),
    );

    await feedApi.create("college-vogt", {
      type: "POST",
      title: "Réunion",
      bodyHtml: "<p>Bonsoir</p>",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/schools/college-vogt/feed");
    expect(options.method).toBe("POST");
    expect(options.body).toContain("\"title\":\"Réunion\"");
  });
});

describe("feedApi.remove()", () => {
  it("accepte une réponse 204", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () => Promise.resolve(undefined),
    });

    await expect(feedApi.remove("college-vogt", "post-1")).resolves.toBeUndefined();
    expect(mockFetch.mock.calls[0]?.[0]).toContain(
      "/schools/college-vogt/feed/post-1",
    );
    expect(mockFetch.mock.calls[0]?.[1]?.method).toBe("DELETE");
  });
});

describe("feedApi.toggleLike()", () => {
  it("appelle le toggle like", async () => {
    mockFetch.mockResolvedValueOnce(okJson({ liked: true, likesCount: 3 }));
    const result = await feedApi.toggleLike("college-vogt", "post-1");
    expect(result.likesCount).toBe(3);
    expect(mockFetch.mock.calls[0]?.[0]).toContain(
      "/schools/college-vogt/feed/post-1/likes/toggle",
    );
  });
});

describe("feedApi.addComment()", () => {
  it("ajoute un commentaire", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        comment: {
          id: "c1",
          authorName: "Alice Martin",
          text: "Merci",
          createdAt: "2026-04-05T10:00:00.000Z",
        },
        commentsCount: 1,
      }),
    );
    const result = await feedApi.addComment(
      "college-vogt",
      "post-1",
      "Merci",
    );
    expect(result.comment.text).toBe("Merci");
  });
});

describe("feedApi.votePoll()", () => {
  it("poste un vote de sondage", async () => {
    mockFetch.mockResolvedValueOnce(
      okJson({
        votedOptionId: "opt-1",
        options: [
          { id: "opt-1", label: "Mercredi", votes: 5 },
          { id: "opt-2", label: "Vendredi", votes: 3 },
        ],
      }),
    );

    const result = await feedApi.votePoll("college-vogt", "post-1", "opt-1");

    expect(result.votedOptionId).toBe("opt-1");
    expect(mockFetch.mock.calls[0]?.[0]).toContain(
      "/schools/college-vogt/feed/post-1/polls/opt-1/vote",
    );
    expect(mockFetch.mock.calls[0]?.[1]?.method).toBe("POST");
  });
});

describe("feedApi.uploadInlineImage()", () => {
  it("envoie un multipart avec auth", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({ url: "http://10.0.2.2:3001/mock/media/feed.png" }),
    });

    const result = await feedApi.uploadInlineImage("college-vogt", {
      uri: "file:///tmp/feed.png",
      name: "feed.png",
      mimeType: "image/png",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/schools/college-vogt/feed/uploads/inline-image");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer feed-token");
    expect(result.url).toContain("feed.png");
  });

  it("remonte le message backend en cas d'échec", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Format non supporté" }),
    });

    await expect(
      feedApi.uploadInlineImage("college-vogt", {
        uri: "file:///tmp/feed.svg",
        name: "feed.svg",
        mimeType: "image/svg+xml",
      }),
    ).rejects.toThrow("Format non supporté");
  });
});
