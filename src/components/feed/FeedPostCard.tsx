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
  formatCompactAuthorName,
  formatFeedDate,
  getAttachmentSummary,
  stripHtml,
} from "./feed.helpers";

type Props = {
  post: FeedPost;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onVote?: (postId: string, optionId: string) => void;
  onDelete?: (post: FeedPost) => void;
};

const COMMENT_EMOJIS = ["😀", "👍", "❤️", "🎉", "👏"];

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
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
          <Text style={styles.commentDate}>
            {formatFeedDate(comment.createdAt)}
          </Text>
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
  const [reactionOpen, setReactionOpen] = useState(false);
  const [draftComment, setDraftComment] = useState("");
  const excerpt = useMemo(() => stripHtml(post.bodyHtml), [post.bodyHtml]);
  const totalVotes =
    post.poll?.options.reduce((sum, option) => sum + option.votes, 0) ?? 0;

  function submitReaction() {
    const trimmed = draftComment.trim();
    if (!trimmed) {
      return;
    }
    onAddComment(post.id, trimmed);
    setDraftComment("");
    setReactionOpen(false);
  }

  function appendEmoji(emoji: string) {
    setDraftComment((current) => `${current}${emoji}`);
  }

  return (
    <View style={styles.card} testID={`feed-post-${post.id}`}>
      {post.canManage && onDelete ? (
        <View style={styles.headerRow}>
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
        </View>
      ) : null}

      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{post.title.toUpperCase()}</Text>
          {post.featuredUntil ? (
            <View
              style={styles.featuredBadge}
              testID={`feed-post-featured-${post.id}`}
            >
              <Ionicons name="sparkles" size={13} color="#B45309" />
            </View>
          ) : null}
        </View>
        <View style={styles.metaFooter}>
          <Text
            style={styles.metaFooterText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {formatCompactAuthorName(post.author)}
            {post.author.roleLabel ? ` · ${post.author.roleLabel}` : ""}
            {` · ${formatFeedDate(post.createdAt)}`}
          </Text>
        </View>
      </View>
      <Text style={styles.bodyText}>
        {excerpt || "Publication sans texte."}
      </Text>

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
          style={[
            styles.actionButton,
            styles.actionButtonLike,
            post.likedByViewer && styles.actionButtonLiked,
          ]}
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
          style={[
            styles.actionButton,
            styles.actionButtonComment,
            commentsOpen && styles.actionButtonCommentActive,
          ]}
          onPress={() => setCommentsOpen((value) => !value)}
          testID={`feed-post-comments-toggle-${post.id}`}
          accessibilityLabel={`Commentaires ${post.comments.length}`}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.primary}
          />
          <Text
            style={[
              styles.actionLabel,
              commentsOpen && styles.actionLabelActive,
            ]}
            testID={`feed-post-comments-count-${post.id}-${post.comments.length}`}
          >
            {post.comments.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonReact,
            reactionOpen && styles.actionButtonReactActive,
          ]}
          onPress={() => setReactionOpen((value) => !value)}
          testID={`feed-post-react-${post.id}`}
          accessibilityLabel={reactionOpen ? "Masquer reaction" : "Reagir"}
        >
          <Ionicons name="send-outline" size={18} color={colors.accentTeal} />
          <Text
            style={[
              styles.actionLabel,
              reactionOpen && styles.actionLabelReactActive,
            ]}
          >
            {reactionOpen ? "Masquer reaction" : "Reagir"}
          </Text>
        </TouchableOpacity>
      </View>

      {reactionOpen ? (
        <View style={styles.reactionComposer}>
          <TextInput
            style={styles.reactionInput}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor={colors.textSecondary}
            value={draftComment}
            onChangeText={setDraftComment}
            testID={`feed-comment-input-${post.id}`}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.reactionFooter}>
            <View style={styles.reactionEmojiRow}>
              {COMMENT_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={`${post.id}-${emoji}`}
                  style={styles.reactionEmojiButton}
                  onPress={() => appendEmoji(emoji)}
                  accessibilityLabel={`Ajouter ${emoji}`}
                  testID={`feed-reaction-emoji-${post.id}-${emoji}`}
                >
                  <Text style={styles.reactionEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.commentSend,
                !draftComment.trim() && styles.commentSendDisabled,
              ]}
              disabled={!draftComment.trim()}
              onPress={submitReaction}
              testID={`feed-comment-submit-${post.id}`}
            >
              <Ionicons name="send" size={14} color={colors.white} />
              <Text style={styles.commentSendLabel}>Commenter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {commentsOpen ? (
        <View style={styles.commentsPanel}>
          {post.comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerBlock: {
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    paddingBottom: 10,
  },
  featuredBadge: {
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FCD34D",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
    flexShrink: 0,
  },
  title: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    flex: 1,
  },
  bodyText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  metaFooter: {
    marginTop: 0,
  },
  metaFooterText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    flexShrink: 1,
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
    borderWidth: 1,
  },
  actionButtonLike: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  actionButtonComment: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  actionButtonReact: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  actionButtonLiked: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  actionButtonCommentActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  actionButtonReactActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
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
    color: "#B91C1C",
  },
  actionLabelReactActive: {
    color: "#047857",
  },
  reactionEmojiRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    flexWrap: "wrap",
  },
  reactionEmojiButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionEmojiText: {
    fontSize: 14,
  },
  reactionComposer: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 16,
    padding: 10,
    backgroundColor: colors.surface,
  },
  reactionInput: {
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.textPrimary,
  },
  reactionFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  commentSend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  commentSendDisabled: {
    opacity: 0.6,
  },
  commentSendLabel: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 12,
  },
  commentsPanel: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  commentRow: {
    gap: 8,
  },
  commentBody: {
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
});
