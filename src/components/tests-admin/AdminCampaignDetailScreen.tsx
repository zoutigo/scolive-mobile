import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { testsAdminApi } from "../../api/tests-admin.api";
import type {
  AdminAssignmentRow,
  AdminCampaignDetail,
  AdminCaseRow,
  AdminTesterRow,
} from "../../types/tests-admin.types";
import { AssignCampaignSheet } from "./AssignCampaignSheet";
import {
  CampaignFormSheet,
  type CampaignFormValues,
} from "./CampaignFormSheet";
import { TestCaseFormSheet } from "./TestCaseFormSheet";
import { QuickMessageSheet } from "./QuickMessageSheet";

export function AdminCampaignDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();

  const [campaign, setCampaign] = useState<AdminCampaignDetail | null>(null);
  const [assignments, setAssignments] = useState<AdminAssignmentRow[]>([]);
  const [testers, setTesters] = useState<AdminTesterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recyclingId, setRecyclingId] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<AdminCaseRow | null>(null);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [savingCase, setSavingCase] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [messageTarget, setMessageTarget] = useState<AdminTesterRow | null>(
    null,
  );
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const [detail, assignmentList, testerList] = await Promise.all([
        testsAdminApi.getCampaign(campaignId),
        testsAdminApi.listAssignments(campaignId),
        testsAdminApi.listTesters({ limit: 100 }),
      ]);
      setCampaign(detail);
      setAssignments(assignmentList);
      setTesters(testerList.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleRecycle(testCaseId: string) {
    setRecyclingId(testCaseId);
    try {
      await testsAdminApi.recycleCase(testCaseId);
      await load();
    } finally {
      setRecyclingId(null);
    }
  }

  type CaseFormValues = {
    title: string;
    module: string;
    objective: string;
    preconditions: string;
    expectedResult: string;
    priority: AdminCaseRow["priority"];
    evidenceRequired: boolean;
    dueAt: string;
  };

  async function handleEditCaseSubmit(values: CaseFormValues) {
    if (!editingCase) return;
    setSavingCase(true);
    setCaseError(null);
    try {
      await testsAdminApi.updateCase(editingCase.id, {
        title: values.title,
        module: values.module || null,
        objective: values.objective || null,
        preconditions: values.preconditions || null,
        expectedResult: values.expectedResult,
        priority: values.priority,
        evidenceRequired: values.evidenceRequired,
        dueAt: values.dueAt || null,
      });
      setEditingCase(null);
      await load();
    } catch (err) {
      setCaseError(
        err instanceof Error
          ? err.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setSavingCase(false);
    }
  }

  async function handleCreateCaseSubmit(values: CaseFormValues) {
    if (!campaignId) return;
    setSavingCase(true);
    setCaseError(null);
    try {
      await testsAdminApi.createCase(campaignId, {
        title: values.title,
        module: values.module || undefined,
        objective: values.objective || undefined,
        preconditions: values.preconditions || undefined,
        expectedResult: values.expectedResult,
        priority: values.priority,
        evidenceRequired: values.evidenceRequired,
        dueAt: values.dueAt || undefined,
      });
      setShowCreateCase(false);
      await load();
    } catch (err) {
      setCaseError(
        err instanceof Error
          ? err.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setSavingCase(false);
    }
  }

  function handleDeleteCase(testCaseId: string) {
    Alert.alert(
      t("testsAdmin.detail.deleteCaseConfirmTitle"),
      t("testsAdmin.detail.deleteCaseConfirmMessage"),
      [
        { text: t("testsAdmin.common.cancel"), style: "cancel" },
        {
          text: t("testsAdmin.detail.delete"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              await testsAdminApi.deleteCase(testCaseId);
              await load();
            })();
          },
        },
      ],
    );
  }

  async function handleEditCampaignSubmit(values: CampaignFormValues) {
    if (!campaignId) return;
    setSavingCampaign(true);
    setCampaignError(null);
    try {
      await testsAdminApi.updateCampaign(campaignId, {
        title: values.title,
        description: values.description || null,
        targetVersion: values.targetVersion || null,
        startsAt: values.startsAt || null,
        dueAt: values.dueAt || null,
        status: values.status,
      });
      setShowEditCampaign(false);
      await load();
    } catch (err) {
      setCampaignError(
        err instanceof Error
          ? err.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setSavingCampaign(false);
    }
  }

  function handleDeleteCampaign() {
    if (!campaignId) return;
    Alert.alert(
      t("testsAdmin.detail.deleteCampaignConfirmTitle"),
      t("testsAdmin.detail.deleteCampaignConfirmMessage"),
      [
        { text: t("testsAdmin.common.cancel"), style: "cancel" },
        {
          text: t("testsAdmin.detail.delete"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              await testsAdminApi.deleteCampaign(campaignId);
              router.back();
            })();
          },
        },
      ],
    );
  }

  async function handleAssignSubmit(values: {
    testerId: string;
    note?: string;
  }) {
    if (!campaignId) return;
    setSavingAssign(true);
    setAssignError(null);
    try {
      await testsAdminApi.assignCampaign(campaignId, values);
      setShowAssignSheet(false);
      await load();
    } catch (err) {
      setAssignError(
        err instanceof Error
          ? err.message
          : t("testsAdmin.common.errors.submitGeneric"),
      );
    } finally {
      setSavingAssign(false);
    }
  }

  async function handleUnassign(assignmentId: string) {
    await testsAdminApi.unassignCampaign(assignmentId);
    await load();
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={campaign?.title ?? t("testsAdmin.title")}
        subtitle={t("testsAdmin.detail.back")}
        onBack={() => router.back()}
        topInset={insets.top}
        testID="admin-campaign-detail-header"
      />

      {loading || !campaign ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.caseActions}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => setShowEditCampaign(true)}
              testID="admin-edit-campaign-btn"
            >
              <Text style={styles.smallButtonText}>
                {t("testsAdmin.detail.editCampaign")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={handleDeleteCampaign}
              testID="admin-delete-campaign-btn"
            >
              <Text style={styles.outlineButtonText}>
                {t("testsAdmin.detail.deleteCampaign")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("testsAdmin.detail.testersTitle")}
              </Text>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setShowAssignSheet(true)}
                testID="admin-open-assign-btn"
              >
                <Text style={styles.smallButtonText}>
                  {t("testsAdmin.detail.assignButton")}
                </Text>
              </TouchableOpacity>
            </View>

            {assignments.length === 0 ? (
              <Text style={styles.empty}>
                {t("testsAdmin.detail.noAssignments")}
              </Text>
            ) : (
              <View style={styles.list}>
                {assignments.map((assignment) => (
                  <View
                    key={assignment.id}
                    style={styles.assignmentCard}
                    testID={`admin-assignment-${assignment.id}`}
                  >
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentName}>
                        {assignment.user.firstName} {assignment.user.lastName}
                      </Text>
                      {assignment.note ? (
                        <Text style={styles.assignmentNote}>
                          {assignment.note}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.assignmentActions}>
                      <TouchableOpacity
                        onPress={() => {
                          const tester = testers.find(
                            (item) => item.id === assignment.user.id,
                          );
                          if (tester) setMessageTarget(tester);
                        }}
                        testID={`admin-assignment-message-${assignment.id}`}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => void handleUnassign(assignment.id)}
                        testID={`admin-assignment-unassign-${assignment.id}`}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color={colors.notification}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("testsAdmin.detail.casesTitle").replace(
                  "{count}",
                  String(campaign.testCases.length),
                )}
              </Text>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setShowCreateCase(true)}
                testID="admin-open-create-case-btn"
              >
                <Text style={styles.smallButtonText}>
                  {t("testsAdmin.detail.addCase")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {campaign.testCases.map((testCase) => (
                <View
                  key={testCase.id}
                  style={styles.caseCard}
                  testID={`admin-case-row-${testCase.id}`}
                >
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/admin-tests/cases/${testCase.id}?campaignId=${campaignId}`,
                      )
                    }
                    testID={`admin-case-open-${testCase.id}`}
                  >
                    <View style={styles.caseHeader}>
                      <Text style={styles.reference}>
                        {t("testsAdmin.detail.referencePrefix").replace(
                          "{reference}",
                          String(testCase.reference).padStart(6, "0"),
                        )}
                      </Text>
                      <Text style={styles.caseTitle}>{testCase.title}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </View>
                    <Text style={styles.caseMeta}>
                      {t("testsAdmin.detail.executionsCount").replace(
                        "{count}",
                        String(testCase.executionsCount),
                      )}
                    </Text>
                    {testCase.recycledAt ? (
                      <Text style={styles.caseMeta}>
                        {t("testsAdmin.detail.recycledOn").replace(
                          "{date}",
                          formatDate(testCase.recycledAt),
                        )}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.caseActions}>
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={() => setEditingCase(testCase)}
                      testID={`admin-case-edit-${testCase.id}`}
                    >
                      <Text style={styles.smallButtonText}>
                        {t("testsAdmin.detail.edit")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outlineButton}
                      disabled={recyclingId === testCase.id}
                      onPress={() => void handleRecycle(testCase.id)}
                      testID={`admin-case-recycle-${testCase.id}`}
                    >
                      <Text style={styles.outlineButtonText}>
                        {recyclingId === testCase.id
                          ? t("testsAdmin.detail.recycling")
                          : t("testsAdmin.detail.recycle")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={() => handleDeleteCase(testCase.id)}
                      testID={`admin-case-delete-${testCase.id}`}
                    >
                      <Text style={styles.outlineButtonText}>
                        {t("testsAdmin.detail.delete")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {showAssignSheet ? (
        <AssignCampaignSheet
          testers={testers}
          saving={savingAssign}
          error={assignError}
          onSubmit={handleAssignSubmit}
          onCancel={() => setShowAssignSheet(false)}
        />
      ) : null}

      {editingCase ? (
        <TestCaseFormSheet
          testCase={editingCase}
          saving={savingCase}
          error={caseError}
          onSubmit={handleEditCaseSubmit}
          onCancel={() => setEditingCase(null)}
        />
      ) : null}

      {showCreateCase ? (
        <TestCaseFormSheet
          saving={savingCase}
          error={caseError}
          onSubmit={handleCreateCaseSubmit}
          onCancel={() => setShowCreateCase(false)}
        />
      ) : null}

      {showEditCampaign && campaign ? (
        <CampaignFormSheet
          campaign={campaign}
          saving={savingCampaign}
          error={campaignError}
          onSubmit={handleEditCampaignSubmit}
          onCancel={() => setShowEditCampaign(false)}
        />
      ) : null}

      {messageTarget ? (
        <QuickMessageSheet
          tester={messageTarget}
          onClose={() => setMessageTarget(null)}
        />
      ) : null}
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, gap: 20 },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  empty: { fontSize: 14, color: colors.textSecondary },
  list: { gap: 10 },
  assignmentCard: {
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E8DCCD",
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  assignmentInfo: { flex: 1, gap: 2 },
  assignmentName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  assignmentNote: { fontSize: 12, color: colors.textSecondary },
  assignmentActions: { flexDirection: "row", gap: 14 },
  caseCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E8DCCD",
  },
  caseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reference: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  caseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
  },
  caseMeta: { fontSize: 12, color: colors.textSecondary },
  caseActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  smallButton: {
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  smallButtonText: { fontSize: 12, fontWeight: "700", color: colors.white },
  outlineButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  outlineButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
