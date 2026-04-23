import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../theme";
import { ticketsApi } from "../../api/tickets.api";
import { useAuthStore } from "../../store/auth.store";
import { useTicketsStore } from "../../store/tickets.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { ConfirmDialog } from "../ConfirmDialog";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketTypeChip } from "./TicketTypeChip";
import type { TicketDetail, TicketStatus } from "../../types/tickets.types";
import { TICKET_STATUS_LABELS } from "../../types/tickets.types";

const STATUS_TRANSITIONS: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "ANSWERED",
  "RESOLVED",
  "CLOSED",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketDetailScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { updateStatus, removeTicket, addResponse } = useTicketsStore();
  const { show } = useSuccessToastStore();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const isPlatformStaff =
    user?.platformRoles.some((r) =>
      ["SUPER_ADMIN", "ADMIN", "SUPPORT"].includes(r),
    ) ?? false;

  const isPlatformAny = (user?.platformRoles.length ?? 0) > 0;

  const androidStatusInset =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

  const loadTicket = useCallback(async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const data = await ticketsApi.get(ticketId);
      setTicket(data);
    } catch {
      show({
        variant: "error",
        title: "Erreur",
        message: "Ticket introuvable.",
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, router, show]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket) return;
    setShowStatusPicker(false);
    try {
      await updateStatus(ticket.id, status);
      setTicket((prev) => (prev ? { ...prev, status } : prev));
      show({
        title: "Statut mis à jour",
        message: TICKET_STATUS_LABELS[status],
      });
    } catch {
      show({
        variant: "error",
        title: "Erreur",
        message: "Impossible de mettre à jour le statut.",
      });
    }
  };

  const handleToggleVote = async () => {
    if (!ticket || !isPlatformAny) return;
    try {
      const { voted } = await ticketsApi.toggleVote(ticket.id);
      await loadTicket();
      show({
        title: voted ? "Vote enregistré" : "Vote retiré",
        message: voted
          ? "Vous suivez ce ticket."
          : "Vous ne suivez plus ce ticket.",
      });
    } catch {
      show({
        variant: "error",
        title: "Erreur",
        message: "Impossible de voter.",
      });
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    setShowDeleteDialog(false);
    try {
      await removeTicket(ticket.id);
      show({ title: "Ticket supprimé", message: "" });
      router.back();
    } catch {
      show({
        variant: "error",
        title: "Erreur",
        message: "Impossible de supprimer le ticket.",
      });
    }
  };

  const handleReply = async () => {
    if (!ticket || !replyText.trim() || !isPlatformStaff) return;
    setIsReplying(true);
    try {
      await addResponse(ticket.id, replyText.trim(), false);
      setReplyText("");
      await loadTicket();
      show({
        title: "Réponse envoyée",
        message: "L'utilisateur a été notifié.",
      });
    } catch {
      show({
        variant: "error",
        title: "Erreur",
        message: "Impossible d'envoyer la réponse.",
      });
    } finally {
      setIsReplying(false);
    }
  };

  const canDelete =
    ticket &&
    (ticket.author.id === user?.id ||
      user?.platformRoles.some((r) => ["SUPER_ADMIN", "ADMIN"].includes(r)));

  const hasVoted = ticket?.votes.some((v) => v.userId === user?.id) ?? false;

  if (isLoading || !ticket) {
    return (
      <View style={styles.loader} testID="ticket-detail-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[styles.container, { paddingBottom: insets.bottom }]}
        testID="ticket-detail-screen"
      >
        <ModuleHeader
          title="Ticket"
          subtitle={`#${ticket.id.slice(-6).toUpperCase()}`}
          onBack={() => router.back()}
          topInset={androidStatusInset}
          testID="ticket-detail-header"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card principale */}
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <TicketTypeChip type={ticket.type} />
              <TicketStatusBadge
                status={ticket.status}
                testID="ticket-status"
              />
            </View>

            <Text style={styles.title} testID="ticket-detail-title">
              {ticket.title}
            </Text>
            <Text style={styles.description} testID="ticket-detail-description">
              {ticket.description}
            </Text>

            {ticket.screenPath && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="navigate-outline"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{ticket.screenPath}</Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.textSecondary}
              />
              <Text style={styles.metaText}>
                {formatDate(ticket.createdAt)}
              </Text>
            </View>

            {ticket.school && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="school-outline"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{ticket.school.name}</Text>
              </View>
            )}

            {/* Pièces jointes */}
            {ticket.attachments.length > 0 && (
              <View style={styles.attachmentsSection}>
                <Text style={styles.sectionTitle}>Pièces jointes</Text>
                {ticket.attachments.map((att) => (
                  <View key={att.id} style={styles.attachRow}>
                    <Ionicons
                      name="attach-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.attachName} numberOfLines={1}>
                      {att.fileName}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions (vote, statut, suppression) */}
            <View style={styles.actionRow}>
              {isPlatformAny && (
                <TouchableOpacity
                  style={[styles.actionBtn, hasVoted && styles.actionBtnActive]}
                  onPress={handleToggleVote}
                  testID="ticket-vote-btn"
                >
                  <Ionicons
                    name={hasVoted ? "thumbs-up" : "thumbs-up-outline"}
                    size={14}
                    color={hasVoted ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      hasVoted && styles.actionBtnTextActive,
                    ]}
                  >
                    {ticket._count.votes}
                  </Text>
                </TouchableOpacity>
              )}

              {isPlatformStaff && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setShowStatusPicker(true)}
                  testID="ticket-status-btn"
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.actionBtnText}>Statut</Text>
                </TouchableOpacity>
              )}

              {canDelete && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => setShowDeleteDialog(true)}
                  testID="ticket-delete-btn"
                >
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color={colors.notification}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: colors.notification },
                    ]}
                  >
                    Supprimer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Réponses */}
          {ticket.responses.length > 0 && (
            <View style={styles.responsesSection}>
              <Text style={styles.sectionTitle}>
                {ticket.responses.length} réponse
                {ticket.responses.length > 1 ? "s" : ""}
              </Text>
              {ticket.responses.map((resp) => (
                <View
                  key={resp.id}
                  style={[
                    styles.responseCard,
                    resp.isInternal && styles.responseCardInternal,
                  ]}
                  testID={`response-${resp.id}`}
                >
                  {resp.isInternal && (
                    <View style={styles.internalBadge}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={10}
                        color={colors.warmAccent}
                      />
                      <Text style={styles.internalLabel}>Note interne</Text>
                    </View>
                  )}
                  <Text style={styles.responseMeta}>
                    {resp.author.firstName} {resp.author.lastName} ·{" "}
                    {formatDate(resp.createdAt)}
                  </Text>
                  <Text style={styles.responseBody}>{resp.body}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Zone réponse admin */}
          {isPlatformStaff && (
            <View style={styles.replySection}>
              <Text style={styles.sectionTitle}>Répondre à l'utilisateur</Text>
              <TextInput
                style={styles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Votre réponse…"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                testID="reply-input"
              />
              <TouchableOpacity
                style={[
                  styles.replyBtn,
                  (!replyText.trim() || isReplying) && styles.replyBtnDisabled,
                ]}
                onPress={handleReply}
                disabled={!replyText.trim() || isReplying}
                testID="reply-submit-btn"
              >
                {isReplying ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="send-outline"
                      size={14}
                      color={colors.white}
                    />
                    <Text style={styles.replyBtnText}>Envoyer la réponse</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Picker de statut */}
        {showStatusPicker && (
          <View style={styles.statusPicker} testID="status-picker">
            <Text style={styles.statusPickerTitle}>Changer le statut</Text>
            {STATUS_TRANSITIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusOption,
                  ticket.status === s && styles.statusOptionActive,
                ]}
                onPress={() => handleStatusChange(s)}
                testID={`status-option-${s}`}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    ticket.status === s && styles.statusOptionTextActive,
                  ]}
                >
                  {TICKET_STATUS_LABELS[s]}
                </Text>
                {ticket.status === s && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.statusCancelBtn}
              onPress={() => setShowStatusPicker(false)}
              testID="status-picker-cancel"
            >
              <Text style={styles.statusCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        <ConfirmDialog
          visible={showDeleteDialog}
          variant="danger"
          icon="trash-outline"
          title="Supprimer ce ticket ?"
          message="Cette action est irréversible. Le ticket et ses pièces jointes seront définitivement supprimés."
          confirmLabel="Supprimer"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  attachmentsSection: { gap: 4 },
  attachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  attachName: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  actionBtnDanger: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  actionBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionBtnTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  responsesSection: { marginTop: 16, gap: 0 },
  responseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 6,
  },
  responseCardInternal: {
    backgroundColor: colors.warmSurface,
    borderColor: colors.warmBorder,
  },
  internalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  internalLabel: {
    fontSize: 10,
    color: colors.warmAccent,
    fontWeight: "600",
  },
  responseMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  responseBody: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  replySection: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 90,
    backgroundColor: colors.background,
    textAlignVertical: "top",
  },
  replyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  replyBtnDisabled: { opacity: 0.45 },
  replyBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },

  statusPicker: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 4,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  statusPickerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  statusOptionActive: { backgroundColor: "#EFF6FF" },
  statusOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  statusOptionTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  statusCancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  statusCancelText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
