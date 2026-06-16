import {
  formatAuthorName,
  formatCompactAuthorName,
  formatFeedDate,
  getAttachmentSummary,
  getCommentSummary,
  getFeedAudienceLabel,
  orderFeedPosts,
  isStaffRole,
  stripHtml,
} from "../../src/components/feed/feed.helpers";
import { translate } from "../../src/i18n/useTranslation";

const tFr = (key: string) => translate("fr", key);
const tEn = (key: string) => translate("en", key);

describe("feed.helpers", () => {
  it("détecte correctement les rôles staff", () => {
    expect(isStaffRole("TEACHER")).toBe(true);
    expect(isStaffRole("PARENT")).toBe(false);
  });

  it("retire le HTML en conservant un texte lisible", () => {
    expect(stripHtml("<p>Bonjour<br>à <strong>tous</strong></p>")).toBe(
      "Bonjour\nà tous",
    );
  });

  it("formate l'auteur avec civilité si disponible", () => {
    expect(
      formatAuthorName({
        id: "u1",
        fullName: "Mme Alice Martin",
        civility: "Mme",
        roleLabel: "Parent",
        avatarText: "AM",
      }),
    ).toBe("Mme Alice Martin");
  });

  it("formate l'auteur compact avec la même civilité que le web", () => {
    expect(
      formatCompactAuthorName({
        id: "u2",
        fullName: "M Valery Mbele",
        civility: "M.",
        roleLabel: "Vie scolaire",
        avatarText: "VM",
      }),
    ).toBe("M. V.MBELE");
  });

  it("résume les pièces jointes", () => {
    expect(getAttachmentSummary([], tFr)).toBe("");
    expect(
      getAttachmentSummary(
        [{ id: "a1", fileName: "note.pdf", sizeLabel: "12 Ko" }],
        tFr,
      ),
    ).toBe("note.pdf");
    expect(
      getAttachmentSummary(
        [
          { id: "a1", fileName: "note.pdf", sizeLabel: "12 Ko" },
          { id: "a2", fileName: "photo.jpg", sizeLabel: "88 Ko" },
        ],
        tFr,
      ),
    ).toBe("2 pièces jointes");
    expect(
      getAttachmentSummary(
        [
          { id: "a1", fileName: "note.pdf", sizeLabel: "12 KB" },
          { id: "a2", fileName: "photo.jpg", sizeLabel: "88 KB" },
        ],
        tEn,
      ),
    ).toBe("2 attachments");
  });

  it("résume les commentaires", () => {
    expect(getCommentSummary([], tFr)).toBe("Soyez le premier à réagir");
    expect(getCommentSummary([], tEn)).toBe("Be the first to react");
    expect(
      getCommentSummary(
        [
          {
            id: "c1",
            authorName: "Alice Martin",
            text: "Bonjour",
            createdAt: "2026-04-05T10:00:00.000Z",
          },
        ],
        tFr,
      ),
    ).toBe("1 commentaire");
    expect(
      getCommentSummary(
        [
          {
            id: "c1",
            authorName: "Alice Martin",
            text: "Bonjour",
            createdAt: "2026-04-05T10:00:00.000Z",
          },
          {
            id: "c2",
            authorName: "Paul Durand",
            text: "Merci",
            createdAt: "2026-04-05T11:00:00.000Z",
          },
        ],
        tFr,
      ),
    ).toBe("2 commentaires");
  });

  it("retourne un libellé d'audience adapté", () => {
    expect(getFeedAudienceLabel("SCHOOL_ALL", "fallback", tFr)).toBe(
      "Toute l'école",
    );
    expect(getFeedAudienceLabel("SCHOOL_ALL", "fallback", tEn)).toBe(
      "Whole school",
    );
    expect(getFeedAudienceLabel("CLASS", "Classe 6e A", tFr)).toBe(
      "Classe 6e A",
    );
  });

  it("formate la date selon la locale", () => {
    const dateIso = "2026-04-17T11:00:00.000Z";
    expect(formatFeedDate(dateIso, "fr")).toEqual(
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateIso)),
    );
    expect(formatFeedDate(dateIso, "en")).toEqual(
      new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateIso)),
    );
  });

  it("ordonne les posts en mettant les publications en vedette en premier", () => {
    const posts = [
      {
        id: "recent",
        createdAt: "2026-04-17T11:00:00.000Z",
        featuredUntil: null,
      },
      {
        id: "featured-new",
        createdAt: "2026-04-17T09:00:00.000Z",
        featuredUntil: "2099-04-18T09:00:00.000Z",
      },
      {
        id: "featured-old",
        createdAt: "2026-04-16T09:00:00.000Z",
        featuredUntil: "2099-04-18T09:00:00.000Z",
      },
    ] as never;

    expect(orderFeedPosts(posts).map((post) => post.id)).toEqual([
      "featured-old",
      "featured-new",
      "recent",
    ]);
  });
});
