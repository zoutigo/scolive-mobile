import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { resourcesApi } from "../../api/resources.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import {
  EXAM_TYPE_KEYS,
  ResourceStatusBadge,
  SEQUENCE_LABELS,
} from "./ResourceCard";
import type { ResourceDetail } from "../../types/resources.types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ResourceDetailScreen(props: {
  resourceId: string;
  part: "statement" | "correction";
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resourceId, part } = props;

  const [detail, setDetail] = useState<ResourceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await resourcesApi.getResource(resourceId);
      setDetail(result);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const headerTitle =
    part === "statement"
      ? t("resources.detail.statement")
      : t("resources.detail.correction");
  const content =
    part === "statement" ? detail?.statementContent : detail?.correctionContent;
  const status =
    part === "statement" ? detail?.statementStatus : detail?.correctionStatus;
  const attachments = (detail?.attachments ?? []).filter(
    (attachment) =>
      attachment.part === (part === "statement" ? "STATEMENT" : "CORRECTION"),
  );

  async function openAttachment(url?: string | null) {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) return;
      await Linking.openURL(url);
    } catch {
      // ignore, l'ouverture externe n'est pas critique
    }
  }

  return (
    <View style={styles.root} testID={`resources-detail-screen-${part}`}>
      <ModuleHeader
        title={headerTitle}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID={`resources-detail-header-${part}`}
        backTestID={`resources-detail-back-${part}`}
      />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : errorMessage || !detail ? (
        <View style={styles.centerMessage}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.warmBorder}
          />
          <Text style={styles.errorText}>
            {errorMessage ?? t("resources.detail.notFound")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FormHero
            icon={
              part === "statement"
                ? "document-text-outline"
                : "checkmark-done-outline"
            }
            title={detail.title}
            subtitle={`${detail.subject.name} • ${detail.academicLevel.label}${
              detail.school ? ` • ${detail.school.name}` : ""
            }`}
            palette="teal"
            testID={`resources-detail-hero-${part}`}
            footer={
              <View style={styles.pillsRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {detail.academicYearLabel}
                  </Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    {t(EXAM_TYPE_KEYS[detail.examType] ?? detail.examType)}
                  </Text>
                </View>
                {detail.sequence ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      {SEQUENCE_LABELS[detail.sequence] ?? detail.sequence}
                    </Text>
                  </View>
                ) : null}
              </View>
            }
          />

          {status && status !== "APPROVED" ? (
            <View style={styles.statusRow}>
              <ResourceStatusBadge
                label={headerTitle}
                status={status}
                testID={`resources-detail-status-${part}`}
              />
            </View>
          ) : null}

          <View style={styles.contentCard}>
            <Text
              style={styles.contentText}
              testID={`resources-detail-content-${part}`}
            >
              {stripHtml(content ?? "") || t("resources.detail.noContent")}
            </Text>
          </View>

          {attachments.length > 0 ? (
            <View style={styles.attachmentsList}>
              {attachments.map((attachment, idx) => (
                <TouchableOpacity
                  key={attachment.id ?? idx}
                  style={styles.attachmentChip}
                  onPress={() => openAttachment(attachment.fileUrl)}
                  disabled={!attachment.fileUrl}
                  testID={`resources-detail-attachment-${part}-${idx}`}
                >
                  <Ionicons
                    name="document-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.attachmentText} numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 40 },
  centerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusRow: { flexDirection: "row" },
  contentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  attachmentsList: { gap: 8 },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentText: { flex: 1, fontSize: 13, color: colors.textPrimary },
});
