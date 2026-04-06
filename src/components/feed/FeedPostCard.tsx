import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import type { FeedComment, FeedPost } from "../../types/feed.types";
import {
  formatAuthorName,
  formatFeedDate,
  getAttachmentSummary,
  getCommentSummary,
  stripHtml,
} from "./feed.helpers";

type Props = {
  post: FeedPost;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onVote?: (postId: string, optionId: string) => void;
  onDelete?: (post: FeedPost) => void;
};

function PollBar({
  postId,
  optionId,
  label,
  votes,
  totalVotes,
  selected,
  disabled,
  onPress,
}: {
  postId: string;
  optionId: string;
  label: string;
  votes: number;
  totalVotes: number;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const ratio = totalVotes > 0 ? votes / totalVotes : 0;

  return (
    <TouchableOpacity
      style={[styles.pollOption, selected && styles.pollOptionSelected]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      testID={`feed-post-poll-option-${postId}-${optionId}`}
      accessibilityLabel={`${label}, ${votes} vote${votes > 1 ? "s" : ""}${selected ? ", sélectionné" : ""}`}
    >
      <View
        style={[
          styles.pollOptionFill,
          { width: `${Math.max(10, Math.round(ratio * 100))}%` },
          selected && styles.pollOptionFillSelected,
        ]}
      />
      <View style={styles.pollOptionContent}>
        <Text style={styles.pollOptionLabel}>{label}</Text>
        <View
          testID={`feed-poll-state-${postId}-${optionId}-${selected ? "selected" : "idle"}-${votes}`}
        >
          <Text style={styles.pollOptionVotes}>{votes}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CommentRow({ comment }: { comment: FeedComment }) {
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {comment.authorName.slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
          <Text style={styles.commentDate}>{formatFeedDate(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
}

export function FeedPostCard({
  post,
  onToggleLike,
  onAddComment,
  onVote,
  onDelete,
}: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draftComment, setDraftComment] = useState("");
  const excerpt = useMemo(() => stripHtml(post.bodyHtml), [post.bodyHtml]);
  const totalVotes =
    post.poll?.options.reduce((sum, option) => sum + option.votes, 0) ?? 0;

  return (
    <View style={styles.card} testID={`feed-post-${post.id}`}>
      <View style={styles.headerRow}>
        {post.featuredUntil ? (
          <View style={styles.featuredBadge}>
            <Ionicons name="sparkles-outline" size={12} color={colors.white} />
            <Text style={styles.featuredBadgeText}>À la une</Text>
          </View>
        ) : (
          <View />
        )}

        {post.canManage && onDelete ? (
          <TouchableOpacity
            onPress={() => onDelete(post)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID={`feed-post-delete-${post.id}`}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.notification}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.bodyText}>{excerpt || "Publication sans texte."}</Text>
      <View style={styles.metaFooter}>
        <Text style={styles.metaFooterText}>
          {formatAuthorName(post.author)}
          {post.author.roleLabel ? ` · ${post.author.roleLabel}` : ""}
        </Text>
        <Text style={styles.metaFooterText}>{formatFeedDate(post.createdAt)}</Text>
      </View>

      {post.attachments.length > 0 ? (
        <View style={styles.attachmentPanel}>
          <View style={styles.attachmentHeader}>
            <Ionicons name="attach-outline" size={16} color={colors.primary} />
            <Text style={styles.attachmentTitle}>
              {getAttachmentSummary(post.attachments)}
            </Text>
          </View>
          {post.attachments.slice(0, 3).map((attachment) => (
            <View key={attachment.id} style={styles.attachmentRow}>
              <Text style={styles.attachmentName}>{attachment.fileName}</Text>
              <Text style={styles.attachmentSize}>{attachment.sizeLabel}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {post.type === "POLL" && post.poll ? (
        <View style={styles.pollPanel}>
          <Text style={styles.pollQuestion}>{post.poll.question}</Text>
          <View style={styles.pollOptions}>
            {post.poll.options.map((option) => (
              <PollBar
                key={option.id}
                postId={post.id}
                optionId={option.id}
                label={option.label}
                votes={option.votes}
                totalVotes={totalVotes}
                selected={option.id === post.poll?.votedOptionId}
                disabled={Boolean(post.poll?.votedOptionId)}
                onPress={() => onVote?.(post.id, option.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onToggleLike(post.id)}
          testID={`feed-post-like-${post.id}`}
          accessibilityLabel={`Réactions ${post.likesCount}${post.likedByViewer ? ", aimée" : ""}`}
        >
          <View
            style={styles.actionState}
            testID={`feed-post-like-state-${post.id}-${post.likedByViewer ? "liked" : "idle"}-${post.likesCount}`}
          >
            <Ionicons
              name={post.likedByViewer ? "heart" : "heart-outline"}
              size={18}
              color={post.likedByViewer ? colors.notification : colors.primary}
            />
            <Text
              style={[
                styles.actionLabel,
                post.likedByViewer && styles.actionLabelActive,
              ]}
            >
              {post.likesCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setCommentsOpen((value) => !value)}
          testID={`feed-post-comments-toggle-${post.id}`}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.primary}
          />
          <Text
            style={styles.actionLabel}
            testID={`feed-post-comments-count-${post.id}-${post.comments.length}`}
          >
            {post.comments.length}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.commentsSummary}>{getCommentSummary(post.comments)}</Text>

      {commentsOpen ? (
        <View style={styles.commentsPanel}>
          {post.comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}

          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire"
              placeholderTextColor={colors.textSecondary}
              value={draftComment}
              onChangeText={setDraftComment}
              testID={`feed-comment-input-${post.id}`}
            />
            <TouchableOpacity
              style={[
                styles.commentSend,
                !draftComment.trim() && styles.commentSendDisabled,
              ]}
              disabled={!draftComment.trim()}
              onPress={() => {
                const trimmed = draftComment.trim();
                if (!trimmed) return;
                onAddComment(post.id, trimmed);
                setDraftComment("");
              }}
              testID={`feed-comment-submit-${post.id}`}
            >
              <Ionicons name="send" size={15} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warmAccent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featuredBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  bodyText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  metaFooter: {
    gap: 3,
  },
  metaFooterText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  attachmentPanel: {
    borderRadius: 16,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
    gap: 8,
  },
  attachmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachmentTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  attachmentName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },
  attachmentSize: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pollPanel: {
    gap: 10,
  },
  pollQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pollOptions: {
    gap: 8,
  },
  pollOption: {
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
  },
  pollOptionSelected: {
    borderColor: colors.primary,
  },
  pollOptionFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.warmHighlight,
  },
  pollOptionFillSelected: {
    backgroundColor: "#D7E7F5",
  },
  pollOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  pollOptionLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  pollOptionVotes: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
  },
  actionState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
  },
  actionLabelActive: {
    color: colors.notification,
  },
  commentsSummary: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: -6,
  },
  commentsPanel: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  commentBody: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.background,
    padding: 10,
    gap: 4,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  commentAuthor: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 12,
  },
  commentDate: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  commentText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.textPrimary,
  },
  commentSend: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  commentSendDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
});
