import type {
  FeedAttachment,
  FeedAudienceScope,
  FeedAuthor,
  FeedComment,
  FeedViewerRole,
} from "../../types/feed.types";

const STAFF_ROLES = new Set<FeedViewerRole>([
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
  "SCHOOL_STAFF",
  "TEACHER",
]);

export function isStaffRole(role: FeedViewerRole) {
  return STAFF_ROLES.has(role);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function formatFeedDate(dateIso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateIso));
}

export function formatAuthorName(author: FeedAuthor) {
  if (!author.civility) {
    return author.fullName;
  }
  const withoutCivility = author.fullName.replace(/^(m\.?|mme|mlle)\s+/i, "");
  return `${author.civility} ${withoutCivility}`.trim();
}

export function getFeedAudienceLabel(
  scope: FeedAudienceScope,
  fallbackLabel: string,
) {
  switch (scope) {
    case "SCHOOL_ALL":
      return "Toute l'école";
    case "STAFF_ONLY":
      return "Équipe interne";
    case "PARENTS_STUDENTS":
      return "Parents & élèves";
    case "PARENTS_ONLY":
      return "Parents uniquement";
    case "LEVEL":
    case "CLASS":
      return fallbackLabel;
    default:
      return fallbackLabel;
  }
}

export function getAttachmentSummary(attachments: FeedAttachment[]) {
  if (attachments.length === 0) {
    return "";
  }
  if (attachments.length === 1) {
    return attachments[0]?.fileName ?? "";
  }
  return `${attachments.length} pièces jointes`;
}

export function getCommentSummary(comments: FeedComment[]) {
  if (comments.length === 0) {
    return "Soyez le premier à réagir";
  }
  if (comments.length === 1) {
    return "1 commentaire";
  }
  return `${comments.length} commentaires`;
}
