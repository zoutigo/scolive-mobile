import {
  sortHomework,
  sortHomeworkComments,
  isHomeworkDone,
  htmlToText,
  extractImageUrls,
  isoToLocalInput,
  localInputToIso,
  homeworkDateKey,
  parseHomeworkExpectedDate,
} from "../../src/utils/homework";
import type {
  HomeworkDetail,
  HomeworkRow,
} from "../../src/types/homework.types";

function makeRow(overrides: Partial<HomeworkRow> = {}): HomeworkRow {
  return {
    id: "hw-1",
    classId: "class-1",
    title: "Exercices",
    contentHtml: "<p>Faire les exercices</p>",
    expectedAt: "2026-05-03T08:00:00.000Z",
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z",
    authorUserId: "teacher-1",
    authorDisplayName: "Mme Mbele",
    subject: { id: "math", name: "Mathématiques" },
    attachments: [],
    commentsCount: 0,
    summary: null,
    myDoneAt: null,
    ...overrides,
  };
}

function makeDetail(overrides: Partial<HomeworkDetail> = {}): HomeworkDetail {
  return {
    ...makeRow(),
    comments: [],
    completionStatuses: [],
    ...overrides,
  };
}

// ─── sortHomework ──────────────────────────────────────────────────────────

describe("sortHomework", () => {
  it("trie par date croissante", () => {
    const items = [
      makeRow({ id: "hw-b", expectedAt: "2026-05-10T08:00:00Z" }),
      makeRow({ id: "hw-a", expectedAt: "2026-05-05T08:00:00Z" }),
    ];
    const sorted = sortHomework(items);
    expect(sorted[0].id).toBe("hw-a");
    expect(sorted[1].id).toBe("hw-b");
  });

  it("trie par titre si les dates sont identiques", () => {
    const sameDate = "2026-05-05T08:00:00Z";
    const items = [
      makeRow({ id: "hw-z", title: "Z - Titre", expectedAt: sameDate }),
      makeRow({ id: "hw-a", title: "A - Titre", expectedAt: sameDate }),
    ];
    const sorted = sortHomework(items);
    expect(sorted[0].id).toBe("hw-a");
    expect(sorted[1].id).toBe("hw-z");
  });

  it("ne mute pas le tableau original", () => {
    const items = [
      makeRow({ id: "hw-b", expectedAt: "2026-05-10T08:00:00Z" }),
      makeRow({ id: "hw-a", expectedAt: "2026-05-05T08:00:00Z" }),
    ];
    const original = [...items];
    sortHomework(items);
    expect(items[0].id).toBe(original[0].id);
  });
});

// ─── sortHomeworkComments ──────────────────────────────────────────────────

describe("sortHomeworkComments", () => {
  it("trie les commentaires par date croissante", () => {
    const detail = makeDetail({
      comments: [
        {
          id: "cmt-b",
          body: "B",
          authorUserId: "u1",
          authorDisplayName: "Alice",
          createdAt: "2026-05-02T10:00:00Z",
          updatedAt: "2026-05-02T10:00:00Z",
        },
        {
          id: "cmt-a",
          body: "A",
          authorUserId: "u2",
          authorDisplayName: "Bob",
          createdAt: "2026-05-01T09:00:00Z",
          updatedAt: "2026-05-01T09:00:00Z",
        },
      ],
    });

    const sorted = sortHomeworkComments(detail);
    expect(sorted.comments[0].id).toBe("cmt-a");
    expect(sorted.comments[1].id).toBe("cmt-b");
  });

  it("trie les completionStatuses par nom puis prénom", () => {
    const detail = makeDetail({
      completionStatuses: [
        {
          studentId: "s2",
          firstName: "Alice",
          lastName: "Dupont",
          doneAt: null,
        },
        { studentId: "s1", firstName: "Zoé", lastName: "Adam", doneAt: null },
      ],
    });

    const sorted = sortHomeworkComments(detail);
    expect(sorted.completionStatuses[0].studentId).toBe("s1");
    expect(sorted.completionStatuses[1].studentId).toBe("s2");
  });

  it("ne mute pas le détail original", () => {
    const detail = makeDetail({
      comments: [
        {
          id: "cmt-b",
          body: "B",
          authorUserId: "u",
          authorDisplayName: "A",
          createdAt: "2026-05-02T10:00:00Z",
          updatedAt: "2026-05-02T10:00:00Z",
        },
      ],
    });
    const originalFirst = detail.comments[0].id;
    sortHomeworkComments(detail);
    expect(detail.comments[0].id).toBe(originalFirst);
  });
});

// ─── isHomeworkDone ────────────────────────────────────────────────────────

describe("isHomeworkDone", () => {
  it("renvoie true si myDoneAt est défini", () => {
    expect(isHomeworkDone(makeRow({ myDoneAt: "2026-05-01T10:00:00Z" }))).toBe(
      true,
    );
  });

  it("renvoie false si myDoneAt est null", () => {
    expect(isHomeworkDone(makeRow({ myDoneAt: null }))).toBe(false);
  });

  it("fonctionne aussi avec HomeworkDetail", () => {
    expect(
      isHomeworkDone(makeDetail({ myDoneAt: "2026-05-01T10:00:00Z" })),
    ).toBe(true);
    expect(isHomeworkDone(makeDetail({ myDoneAt: null }))).toBe(false);
  });
});

// ─── htmlToText ────────────────────────────────────────────────────────────

describe("htmlToText", () => {
  it("supprime les balises HTML simples", () => {
    expect(htmlToText("<strong>Texte</strong>")).toBe("Texte");
  });

  it("convertit les <br> en saut de ligne", () => {
    const result = htmlToText("Ligne 1<br>Ligne 2");
    expect(result).toContain("Ligne 1");
    expect(result).toContain("Ligne 2");
    expect(result).toContain("\n");
  });

  it("convertit les </p> en double saut de ligne", () => {
    const result = htmlToText("<p>Paragraphe 1</p><p>Paragraphe 2</p>");
    expect(result).toMatch(/Paragraphe 1\s+Paragraphe 2/);
  });

  it("remplace &nbsp; par un espace", () => {
    const result = htmlToText("Mot&nbsp;suivant");
    expect(result).toBe("Mot suivant");
  });

  it("retourne une chaîne vide si le HTML est vide", () => {
    expect(htmlToText("")).toBe("");
    expect(htmlToText("   ")).toBe("");
  });

  it("préserve le texte brut sans balises", () => {
    expect(htmlToText("Texte sans balise")).toBe("Texte sans balise");
  });
});

// ─── extractImageUrls ──────────────────────────────────────────────────────

describe("extractImageUrls", () => {
  it("extrait les URLs src des balises img", () => {
    const html =
      '<p>Texte <img src="http://cdn/img1.jpg" alt="img1"> suite</p>';
    expect(extractImageUrls(html)).toEqual(["http://cdn/img1.jpg"]);
  });

  it("extrait plusieurs images", () => {
    const html = '<img src="http://cdn/a.jpg"><img src="http://cdn/b.png">';
    expect(extractImageUrls(html)).toHaveLength(2);
    expect(extractImageUrls(html)).toContain("http://cdn/a.jpg");
    expect(extractImageUrls(html)).toContain("http://cdn/b.png");
  });

  it("renvoie un tableau vide si aucune image", () => {
    expect(extractImageUrls("<p>Pas d'image</p>")).toEqual([]);
    expect(extractImageUrls("")).toEqual([]);
  });

  it("supporte les guillemets simples pour src", () => {
    const html = "<img src='http://cdn/img.jpg'>";
    expect(extractImageUrls(html)).toEqual(["http://cdn/img.jpg"]);
  });
});

// ─── isoToLocalInput ──────────────────────────────────────────────────────

describe("isoToLocalInput", () => {
  it("convertit une ISO date en format datetime-local", () => {
    const result = isoToLocalInput("2026-05-03T18:00:00.000Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("renvoie une chaîne vide pour une valeur invalide", () => {
    expect(isoToLocalInput("not-a-date")).toBe("");
  });

  it("renvoie une chaîne vide pour une chaîne vide", () => {
    expect(isoToLocalInput("")).toBe("");
  });
});

// ─── localInputToIso ──────────────────────────────────────────────────────

describe("localInputToIso", () => {
  it("convertit un datetime-local en ISO string", () => {
    const result = localInputToIso("2026-05-03T18:00");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("renvoie la valeur brute si elle est invalide", () => {
    expect(localInputToIso("not-a-date")).toBe("not-a-date");
  });

  it("renvoie une chaîne vide pour une entrée vide", () => {
    expect(localInputToIso("")).toBe("");
    expect(localInputToIso("   ")).toBe("");
  });
});

// ─── homeworkDateKey ──────────────────────────────────────────────────────

describe("homeworkDateKey", () => {
  it("renvoie une clé de date YYYY-MM-DD", () => {
    const key = homeworkDateKey("2026-05-03T18:00:00.000Z");
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("renvoie les 10 premiers caractères pour une date invalide", () => {
    const key = homeworkDateKey("2026-05-03T99:99:99");
    expect(key.length).toBeGreaterThanOrEqual(10);
  });
});

// ─── parseHomeworkExpectedDate ────────────────────────────────────────────

describe("parseHomeworkExpectedDate", () => {
  it("parse une date ISO valide", () => {
    const date = parseHomeworkExpectedDate("2026-05-03T18:00:00.000Z");
    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(2026);
  });

  it("renvoie null pour une chaîne vide", () => {
    expect(parseHomeworkExpectedDate("")).toBeNull();
  });

  it("renvoie null pour une date invalide", () => {
    expect(parseHomeworkExpectedDate("not-a-date")).toBeNull();
  });
});
