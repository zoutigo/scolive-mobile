import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Application from "expo-application";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppShell,
  useDrawer,
} from "../../../../src/components/navigation/AppShell";
import { ModuleHeader } from "../../../../src/components/navigation/ModuleHeader";
import { testsApi } from "../../../../src/api/tests.api";
import { useAuthStore } from "../../../../src/store/auth.store";
import { useTranslation } from "../../../../src/i18n/useTranslation";
import { colors } from "../../../../src/theme";
import type {
  TestCaseDetail,
  TestExecutionStatus,
} from "../../../../src/types/tests.types";

type LocalAttachment = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
};

const SUBMIT_STATUSES: TestExecutionStatus[] = [
  "PASSED",
  "FAILED",
  "BLOCKED",
  "SKIPPED",
  "IN_PROGRESS",
];

export default function TestCaseRoute() {
  return (
    <AppShell showHeader={false}>
      <TestCaseScreen />
    </AppShell>
  );
}

function TestCaseScreen() {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { testCaseId } = useLocalSearchParams<{ testCaseId: string }>();
  const { openDrawer } = useDrawer();
  const { schoolSlug, user } = useAuthStore();
  const [detail, setDetail] = useState<TestCaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<TestExecutionStatus>("PASSED");
  const [resultText, setResultText] = useState("");
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);

  const load = useCallback(
    async (refresh = false) => {
      if (!schoolSlug || !testCaseId) return;
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const response = await testsApi.getTestCase(schoolSlug, testCaseId);
        setDetail(response);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("tests.common.errors.loadGeneric"),
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [schoolSlug, testCaseId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const canSubmit = useMemo(() => {
    if (!resultText.trim()) return false;
    if (!detail) return false;
    if (detail.evidenceRequired && attachments.length === 0) return false;
    return !isSubmitting;
  }, [attachments.length, detail, isSubmitting, resultText]);

  async function pickFromGallery() {
    const { status: permission } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission !== "granted") {
      Alert.alert(
        t("tests.detail.permissions.title"),
        t("tests.detail.permissions.gallery"),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.map((asset) => ({
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName ?? `capture_${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        })),
      ]);
    }
  }

  async function takePhoto() {
    const { status: permission } =
      await ImagePicker.requestCameraPermissionsAsync();
    if (permission !== "granted") {
      Alert.alert(
        t("tests.detail.permissions.title"),
        t("tests.detail.permissions.camera"),
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      exif: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName ?? `capture_${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        },
      ]);
    }
  }

  function openAttachmentMenu() {
    Alert.alert(
      t("tests.detail.attachments.title"),
      t("tests.detail.attachments.message"),
      [
        {
          text: t("tests.detail.attachments.camera"),
          onPress: () => void takePhoto(),
        },
        {
          text: t("tests.detail.attachments.gallery"),
          onPress: () => void pickFromGallery(),
        },
        { text: t("tests.common.cancel"), style: "cancel" },
      ],
    );
  }

  async function handleSubmit() {
    if (!schoolSlug || !testCaseId || !canSubmit) return;
    setIsSubmitting(true);
    try {
      await testsApi.createExecution(schoolSlug, testCaseId, {
        status,
        resultText: resultText.trim(),
        comment: comment.trim() || undefined,
        deviceInfo: `${Platform.OS}`,
        appVersion:
          Application.nativeApplicationVersion ??
          Application.nativeBuildVersion ??
          undefined,
        attachments: attachments.map((attachment) => ({
          uri: attachment.uri,
          name: attachment.name,
          mimeType: attachment.mimeType,
        })),
      });
      setResultText("");
      setComment("");
      setAttachments([]);
      await load(true);
    } catch (error) {
      Alert.alert(
        t("tests.common.errors.submitTitle"),
        error instanceof Error
          ? error.message
          : t("tests.common.errors.submitGeneric"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={detail?.title ?? t("tests.title")}
        subtitle={detail?.campaign.title ?? t("tests.detail.subtitle")}
        onBack={() => router.back()}
        rightIcon="menu-outline"
        onRightPress={openDrawer}
        topInset={insets.top}
      />

      {!user?.isTester ? (
        <CenteredMessage
          icon="lock-closed-outline"
          title={t("tests.common.restrictedTitle")}
          message={t("tests.common.restrictedMessage")}
        />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMessage || !detail ? (
        <CenteredMessage
          icon="alert-circle-outline"
          title={t("tests.common.errors.loadTitle")}
          message={errorMessage ?? t("tests.common.errors.loadGeneric")}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void load(true)}
            />
          }
        >
          <InfoCard
            title={t("tests.detail.objective")}
            value={detail.objective}
            noValue={t("tests.common.noValue")}
          />
          <InfoCard
            title={t("tests.detail.preconditions")}
            value={detail.preconditions}
            noValue={t("tests.common.noValue")}
          />
          <InfoCard
            title={t("tests.detail.expectedResult")}
            value={detail.expectedResult}
            noValue={t("tests.common.noValue")}
          />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("tests.detail.steps")}</Text>
            {detail.steps.length === 0 ? (
              <Text style={styles.cardBody}>{t("tests.detail.noSteps")}</Text>
            ) : (
              detail.steps.map((step, index) => (
                <Text key={`${index}-${step}`} style={styles.stepLine}>
                  {index + 1}. {step}
                </Text>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tests.detail.completedBy")}
            </Text>
            {detail.completedByUsers.length === 0 ? (
              <Text style={styles.cardBody}>
                {t("tests.detail.noCompletedUsers")}
              </Text>
            ) : (
              detail.completedByUsers.map((entry) => (
                <View key={entry.userId} style={styles.userRow}>
                  <Text style={styles.userName}>{entry.fullName}</Text>
                  <Text style={styles.userMeta}>
                    {statusLabel(t, entry.status)} ·{" "}
                    {formatDateTime(entry.executedAt, locale)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tests.detail.submitTitle")}
            </Text>
            <View style={styles.statusWrap}>
              {SUBMIT_STATUSES.map((entry) => {
                const selected = entry === status;
                return (
                  <TouchableOpacity
                    key={entry}
                    style={[
                      styles.statusChip,
                      selected && styles.statusChipSelected,
                    ]}
                    onPress={() => setStatus(entry)}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        selected && styles.statusChipTextSelected,
                      ]}
                    >
                      {statusLabel(t, entry)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t("tests.detail.resultPlaceholder")}
              value={resultText}
              onChangeText={setResultText}
              multiline
              testID="tests-result-input"
            />
            <TextInput
              style={[styles.input, styles.textAreaSmall]}
              placeholder={t("tests.detail.commentPlaceholder")}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={styles.attachButton}
              onPress={openAttachmentMenu}
            >
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={styles.attachButtonText}>
                {t("tests.detail.attachments.add")}
              </Text>
            </TouchableOpacity>
            {attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentRow}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setAttachments((prev) =>
                      prev.filter((entry) => entry.id !== attachment.id),
                    )
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#A33E2B"
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
              ]}
              disabled={!canSubmit}
              onPress={() => void handleSubmit()}
              testID="tests-submit-btn"
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting
                  ? t("tests.detail.submitting")
                  : t("tests.detail.submit")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tests.detail.historyTitle")}
            </Text>
            {detail.executions.length === 0 ? (
              <Text style={styles.cardBody}>
                {t("tests.detail.historyEmpty")}
              </Text>
            ) : (
              detail.executions.map((execution) => (
                <View key={execution.id} style={styles.historyCard}>
                  <Text style={styles.historyTitle}>
                    {execution.user.fullName} ·{" "}
                    {statusLabel(t, execution.status)}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {formatDateTime(execution.executedAt, locale)}
                  </Text>
                  {execution.resultText ? (
                    <Text style={styles.historyBody}>
                      {execution.resultText}
                    </Text>
                  ) : null}
                  {execution.comment ? (
                    <Text style={styles.historyComment}>
                      {execution.comment}
                    </Text>
                  ) : null}
                  <View style={styles.imageRow}>
                    {execution.attachments.map((attachment) => (
                      <Image
                        key={attachment.id}
                        source={{ uri: attachment.url }}
                        style={styles.previewImage}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function CenteredMessage(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.centerMessage}>
      <Ionicons name={props.icon} size={42} color={colors.warmBorder} />
      <Text style={styles.centerTitle}>{props.title}</Text>
      <Text style={styles.centerBody}>{props.message}</Text>
    </View>
  );
}

function InfoCard(props: {
  title: string;
  value: string | null;
  noValue: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{props.title}</Text>
      <Text style={styles.cardBody}>
        {props.value?.trim() || props.noValue}
      </Text>
    </View>
  );
}

function statusLabel(t: (key: string) => string, value: TestExecutionStatus) {
  switch (value) {
    case "PASSED":
      return t("tests.status.passed");
    case "FAILED":
      return t("tests.status.failed");
    case "BLOCKED":
      return t("tests.status.blocked");
    case "SKIPPED":
      return t("tests.status.skipped");
    case "IN_PROGRESS":
      return t("tests.status.inProgress");
    default:
      return t("tests.status.todo");
  }
}

function formatDateTime(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  centerBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    padding: 16,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  cardBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  stepLine: { fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  userRow: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6DED5",
  },
  userName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  userMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  statusChipTextSelected: { color: colors.white },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9CBBF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: "#FFFDFC",
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  textAreaSmall: { minHeight: 80, textAlignVertical: "top" },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  attachButtonText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  attachmentName: { flex: 1, fontSize: 13, color: colors.textSecondary },
  submitButton: {
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  historyCard: {
    borderRadius: 14,
    backgroundColor: "#FBF7F2",
    padding: 12,
    gap: 8,
  },
  historyTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  historyMeta: { fontSize: 12, color: colors.textSecondary },
  historyBody: { fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  historyComment: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  previewImage: {
    width: 92,
    height: 92,
    borderRadius: 10,
    backgroundColor: "#EEE7DE",
  },
});
