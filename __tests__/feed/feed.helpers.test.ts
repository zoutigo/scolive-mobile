import {
  formatAuthorName,
  getAttachmentSummary,
  getCommentSummary,
  getFeedAudienceLabel,
  isStaffRole,
  stripHtml,
} from "../../src/components/feed/feed.helpers";

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

  it("résume les pièces jointes", () => {
    expect(getAttachmentSummary([])).toBe("");
    expect(
      getAttachmentSummary([
        { id: "a1", fileName: "note.pdf", sizeLabel: "12 Ko" },
      ]),
    ).toBe("note.pdf");
    expect(
      getAttachmentSummary([
        { id: "a1", fileName: "note.pdf", sizeLabel: "12 Ko" },
        { id: "a2", fileName: "photo.jpg", sizeLabel: "88 Ko" },
      ]),
    ).toBe("2 pièces jointes");
  });

  it("résume les commentaires", () => {
    expect(getCommentSummary([])).toBe("Soyez le premier à réagir");
    expect(
      getCommentSummary([
        {
          id: "c1",
          authorName: "Alice Martin",
          text: "Bonjour",
          createdAt: "2026-04-05T10:00:00.000Z",
        },
      ]),
    ).toBe("1 commentaire");
  });

  it("retourne un libellé d'audience adapté", () => {
    expect(getFeedAudienceLabel("SCHOOL_ALL", "fallback")).toBe(
      "Toute l'école",
    );
    expect(getFeedAudienceLabel("CLASS", "Classe 6e A")).toBe("Classe 6e A");
  });
});
