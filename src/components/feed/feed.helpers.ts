import type {
  FeedAttachment,
  FeedAudienceScope,
  FeedAuthor,
  FeedComment,
  FeedPost,
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

function normalizeCivility(civility?: string) {
  if (!civility) {
    return "";
  }
  const cleaned = civility.trim();
  if (/^m\.?$/i.test(cleaned)) {
    return "M.";
  }
  if (/^mme$/i.test(cleaned)) {
    return "Mme";
  }
  if (/^mlle$/i.test(cleaned)) {
    return "Mlle";
  }
  return cleaned;
}

export function formatCompactAuthorName(author: FeedAuthor) {
  const civility = normalizeCivility(author.civility);
  const rawName = author.fullName.replace(/^(m\.?|mme|mlle)\s+/i, "").trim();
  const parts = rawName.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] : first;
  const compact = `${first.charAt(0).toUpperCase()}.${last.toUpperCase()}`;
  return civility ? `${civility} ${compact}` : compact;
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

function isFeatured(post: FeedPost) {
  if (!post.featuredUntil) {
    return false;
  }
  return new Date(post.featuredUntil).getTime() > Date.now();
}

export function orderFeedPosts(posts: FeedPost[]) {
  const featured = posts
    .filter((post) => isFeatured(post))
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const featuredIds = new Set(featured.map((post) => post.id));
  const regular = posts
    .filter((post) => !featuredIds.has(post.id))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return [...featured, ...regular];
}
