import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import type {
  ResourceApprovalStatus,
  ResourceRow,
} from "../../types/resources.types";

export function isResourcePlatformAdmin(
  platformRoles: readonly string[] | undefined,
): boolean {
  return (platformRoles ?? []).some(
    (role) => role === "ADMIN" || role === "SUPER_ADMIN",
  );
}

export const SEQUENCE_LABELS: Record<string, string> = {
  SEQ_1: "Séq. 1",
  SEQ_2: "Séq. 2",
  SEQ_3: "Séq. 3",
  SEQ_4: "Séq. 4",
  SEQ_5: "Séq. 5",
  SEQ_6: "Séq. 6",
};

export const EXAM_TYPE_KEYS: Record<string, string> = {
  SEQUENCE_TEST: "resources.examType.sequenceTest",
  POP_QUIZ: "resources.examType.popQuiz",
  MOCK_EXAM: "resources.examType.mockExam",
};

function statusTone(status: ResourceApprovalStatus) {
  if (status === "APPROVED") return { bg: "#DCF3EE", text: "#0F766E" };
  if (status === "REJECTED") return { bg: "#FDE2E2", text: "#B91C1C" };
  return { bg: "#FDF0DC", text: "#A05010" };
}

export function ResourceStatusBadge(props: {
  label: string;
  status: ResourceApprovalStatus;
  testID?: string;
}) {
  const tone = statusTone(props.status);
  return (
    <View
      style={[styles.badge, { backgroundColor: tone.bg }]}
      testID={props.testID}
    >
      <Text style={[styles.badgeText, { color: tone.text }]}>
        {props.label}
      </Text>
    </View>
  );
}

export function ResourceCard(props: {
  resource: ResourceRow;
  onPressStatement: () => void;
  onPressCorrection?: () => void;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  showStatuses?: boolean;
  testID?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { resource } = props;

  const isOwner = resource.authorUserId === user?.id;
  const isAdmin = isResourcePlatformAdmin(user?.platformRoles);
  const canSeeCorrection =
    !!resource.correctionContent &&
    (resource.correctionStatus === "APPROVED" || isOwner || isAdmin);

  return (
    <View style={styles.card} testID={props.testID}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {resource.title}
        </Text>
        {props.onToggleFavorite ? (
          <TouchableOpacity
            onPress={props.onToggleFavorite}
            testID={`${props.testID}-favorite`}
            hitSlop={8}
          >
            <Ionicons
              name={resource.isFavorite ? "star" : "star-outline"}
              size={20}
              color={
                resource.isFavorite ? colors.warmAccent : colors.textSecondary
              }
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.meta} numberOfLines={1}>
        {resource.subject.name}
        {resource.school ? ` • ${resource.school.name}` : ""}
      </Text>

      <View style={styles.pillsRow}>
        <View style={styles.pill} testID={`${props.testID}-academic-year`}>
          <Text style={styles.pillText}>{resource.academicYearLabel}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{resource.academicLevel.label}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {t(EXAM_TYPE_KEYS[resource.examType] ?? resource.examType)}
          </Text>
        </View>
        {resource.sequence ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>
              {SEQUENCE_LABELS[resource.sequence] ?? resource.sequence}
            </Text>
          </View>
        ) : null}
      </View>

      {props.showStatuses ? (
        <View style={styles.statusRow}>
          <ResourceStatusBadge
            label={t("resources.status.statement")}
            status={resource.statementStatus}
            testID={`${props.testID}-statement-status`}
          />
          {resource.correctionContent !== undefined &&
          resource.correctionContent !== null ? (
            <ResourceStatusBadge
              label={t("resources.status.correction")}
              status={resource.correctionStatus}
              testID={`${props.testID}-correction-status`}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.statementBtn]}
          onPress={props.onPressStatement}
          testID={`${props.testID}-statement-btn`}
        >
          <Ionicons
            name="document-text-outline"
            size={15}
            color={colors.primary}
          />
          <Text style={styles.statementBtnText}>
            {t("resources.card.statementButton")}
          </Text>
        </TouchableOpacity>

        {canSeeCorrection && props.onPressCorrection ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.correctionBtn]}
            onPress={props.onPressCorrection}
            testID={`${props.testID}-correction-btn`}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={15}
              color={colors.accentTeal}
            />
            <Text style={styles.correctionBtnText}>
              {t("resources.card.correctionButton")}
            </Text>
          </TouchableOpacity>
        ) : null}

        {props.onEdit && (isOwner || isAdmin) ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtnAction]}
            onPress={props.onEdit}
            testID={`${props.testID}-edit-btn`}
          >
            <Ionicons
              name="create-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.editBtnActionText}>
              {t("resources.card.editButton")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  pill: {
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statementBtn: {
    borderColor: colors.primary,
    backgroundColor: colors.warmSurface,
  },
  statementBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  correctionBtn: {
    borderColor: colors.accentTeal,
    backgroundColor: "#DCF3EE",
  },
  correctionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentTeal,
  },
  editBtnAction: {
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  editBtnActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
