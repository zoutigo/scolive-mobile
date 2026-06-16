import type {
  FeedAttachment,
  FeedAudienceScope,
  FeedAuthor,
  FeedComment,
  FeedPost,
  FeedViewerRole,
} from "../../types/feed.types";
import type { TranslateFn } from "../../i18n/useTranslation";
import type { Locale } from "../../i18n/translations";

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

export function formatFeedDate(dateIso: string, locale: Locale = "fr") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
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
  t: TranslateFn,
) {
  switch (scope) {
    case "SCHOOL_ALL":
      return t("feed.audience.wholeSchool");
    case "STAFF_ONLY":
      return t("feed.audience.staffOnly");
    case "PARENTS_STUDENTS":
      return t("feed.audience.parentsAndStudents");
    case "PARENTS_ONLY":
      return t("feed.audience.parentsOnly");
    case "LEVEL":
    case "CLASS":
      return fallbackLabel;
    default:
      return fallbackLabel;
  }
}

export function getAttachmentSummary(
  attachments: FeedAttachment[],
  t: TranslateFn,
) {
  if (attachments.length === 0) {
    return "";
  }
  if (attachments.length === 1) {
    return attachments[0]?.fileName ?? "";
  }
  return t("feed.attachments.summaryMultiple").replace(
    "{count}",
    String(attachments.length),
  );
}

export function getCommentSummary(comments: FeedComment[], t: TranslateFn) {
  if (comments.length === 0) {
    return t("feed.comments.summaryNone");
  }
  if (comments.length === 1) {
    return t("feed.comments.summaryOne");
  }
  return t("feed.comments.summaryMany").replace(
    "{count}",
    String(comments.length),
  );
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
