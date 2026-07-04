import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import { notesApi } from "../../api/notes.api";
import { useAuthStore } from "../../store/auth.store";
import { useNotesStore } from "../../store/notes.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import type {
  EvaluationRow,
  StudentNotesTerm,
  TermReport,
  UpsertEvaluationPayload,
} from "../../types/notes.types";
import {
  StudentScoreCard,
  type StudentScoreSaveData,
} from "./StudentScoreCard";
import {
  buildEvaluationProgress,
  formatEvaluationDate,
  formatScore,
  sequenceLabel,
  sortEvaluations,
} from "../../utils/notes";
import { getViewType } from "../navigation/nav-config";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { NotesTabs } from "./NotesTabs";
import type { NotesTabKey } from "./NotesTabs";
import { TeacherClassNotesTab } from "./TeacherClassNotesTab";
import { EvaluationForm } from "./EvaluationForm";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PillSelector,
  SectionCard,
  TextField,
} from "../timetable/TimetableCommon";
import { moduleBack } from "../../utils/moduleBack";

const DANGER_COLOR = "#DC3545";

type CouncilDrafts = Record<
  string,
  {
    generalAppreciation: string;
    subjects: Record<string, string>;
  }
>;

const TERM_OPTIONS: Array<{ value: StudentNotesTerm; label: string }> = [
  { value: "TERM_1", label: "T1" },
  { value: "TERM_2", label: "T2" },
  { value: "TERM_3", label: "T3" },
];

function createEmptyEvaluationForm(): UpsertEvaluationPayload {
  return {
    subjectId: "",
    subjectBranchId: "",
    evaluationTypeId: "",
    title: "",
    description: "",
    coefficient: 1,
    maxScore: 20,
    sequence: "SEQ_1",
    isFinalExam: false,
    scheduledAt: "",
    status: "DRAFT",
    attachments: [],
  };
}

export function ClassNotesManagerScreen({
  showHeader = true,
}: {
  showHeader?: boolean;
} = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    classId?: string;
    schoolYearId?: string;
    preStudentId?: string;
  }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const preStudentId =
    typeof params.preStudentId === "string" && params.preStudentId
      ? params.preStudentId
      : null;
  const { schoolSlug, user } = useAuthStore();
  const {
    teacherContext,
    evaluations,
    termReports,
    evaluationDetails,
    isLoadingTeacherContext,
    isLoadingEvaluations,
    isLoadingEvaluationDetail,
    isLoadingTermReports,
    isSubmitting,
    errorMessage,
    loadTeacherContext,
    loadEvaluations,
    loadEvaluationDetail,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    saveScores,
    loadTermReports,
    saveTermReports,
    clearError,
  } = useNotesStore();
  const { t } = useTranslation();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const viewType = user ? getViewType(user) : "unknown";
  const canManage = viewType === "teacher" || viewType === "school";

  const [tab, setTab] = useState<NotesTabKey>(
    preStudentId ? "notes" : "evaluations",
  );
  const [evaluationView, setEvaluationView] = useState<
    "list" | "form" | "detail" | "scores"
  >("list");
  const [evalSearchQuery, setEvalSearchQuery] = useState("");
  const [scoresFilterStudentId, setScoresFilterStudentId] = useState<
    string | null
  >(preStudentId);
  const [studentFilterOpen, setStudentFilterOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<"create" | "edit">(
    "create",
  );
  const [evaluationForm, setEvaluationForm] = useState<UpsertEvaluationPayload>(
    createEmptyEvaluationForm(),
  );
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const selectedEvaluation = evaluationDetails[selectedEvaluationId] ?? null;
  const [councilTerm, setCouncilTerm] = useState<StudentNotesTerm>("TERM_1");
  const [councilStatus, setCouncilStatus] = useState<"DRAFT" | "PUBLISHED">(
    "DRAFT",
  );
  const [councilHeldAt, setCouncilHeldAt] = useState("");
  const [councilDrafts, setCouncilDrafts] = useState<CouncilDrafts>({});
  const sortedEvaluations = useMemo(
    () => sortEvaluations(evaluations),
    [evaluations],
  );
  const filteredEvaluations = useMemo(() => {
    const q = evalSearchQuery.trim().toLowerCase();
    if (!q) return sortedEvaluations;
    return sortedEvaluations.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.subject.name.toLowerCase().includes(q),
    );
  }, [sortedEvaluations, evalSearchQuery]);

  const selectedEvalRow = useMemo(
    () => sortedEvaluations.find((e) => e.id === selectedEvaluationId) ?? null,
    [sortedEvaluations, selectedEvaluationId],
  );

  const sortedScoreStudents = useMemo(() => {
    if (!selectedEvaluation) return [];
    return [...selectedEvaluation.students].sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    );
  }, [selectedEvaluation]);

  const filteredScoreStudents = useMemo(() => {
    if (!scoresFilterStudentId) return sortedScoreStudents;
    return sortedScoreStudents.filter((s) => s.id === scoresFilterStudentId);
  }, [sortedScoreStudents, scoresFilterStudentId]);

  const filterStudentLabel = useMemo(() => {
    if (!scoresFilterStudentId) return t("notes.manager.scores.allStudents");
    const s = sortedScoreStudents.find((x) => x.id === scoresFilterStudentId);
    return s
      ? `${s.lastName} ${s.firstName}`
      : t("notes.manager.scores.allStudents");
  }, [scoresFilterStudentId, sortedScoreStudents, t]);

  const load = useCallback(async () => {
    if (!schoolSlug || !classId || !canManage) return;
    const [context, loadedEvaluations, reports] = await Promise.all([
      loadTeacherContext(schoolSlug, classId),
      loadEvaluations(schoolSlug, classId),
      loadTermReports(schoolSlug, classId),
    ]);

    setEvaluationForm((current) => ({
      ...current,
      subjectId: current.subjectId || context.subjects[0]?.id || "",
      subjectBranchId:
        current.subjectBranchId || context.subjects[0]?.branches[0]?.id || "",
      evaluationTypeId:
        current.evaluationTypeId || context.evaluationTypes[0]?.id || "",
    }));

    const firstEvaluation = loadedEvaluations[0];
    if (firstEvaluation) {
      setSelectedEvaluationId((current) => current || firstEvaluation.id);
    }

    hydrateCouncilState(reports);
  }, [
    canManage,
    classId,
    loadEvaluations,
    loadTeacherContext,
    loadTermReports,
    schoolSlug,
  ]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!schoolSlug || !classId || !selectedEvaluationId) return;
    void loadEvaluationDetail(schoolSlug, classId, selectedEvaluationId).catch(
      () => {},
    );
  }, [classId, loadEvaluationDetail, schoolSlug, selectedEvaluationId]);

  function hydrateCouncilState(reports: TermReport[]) {
    const report =
      reports.find((entry) => entry.term === councilTerm) ?? reports[0];
    if (!report) return;
    setCouncilTerm(report.term);
    setCouncilStatus(report.status);
    setCouncilHeldAt(report.councilHeldAt ?? "");
    setCouncilDrafts(
      report.students.reduce<CouncilDrafts>((acc, student) => {
        acc[student.studentId] = {
          generalAppreciation: student.generalAppreciation ?? "",
          subjects: student.subjects.reduce<Record<string, string>>(
            (subjectAcc, entry) => {
              subjectAcc[entry.subjectId] = entry.appreciation;
              return subjectAcc;
            },
            {},
          ),
        };
        return acc;
      }, {}),
    );
  }

  useEffect(() => {
    const report = termReports[councilTerm];
    if (!report) return;
    hydrateCouncilState([report]);
  }, [councilTerm, termReports]);

  function resetEvaluationForm() {
    setEvaluationMode("create");
    setEvaluationForm({
      ...createEmptyEvaluationForm(),
      subjectId: teacherContext?.subjects[0]?.id ?? "",
      subjectBranchId: teacherContext?.subjects[0]?.branches[0]?.id ?? "",
      evaluationTypeId: teacherContext?.evaluationTypes[0]?.id ?? "",
    });
  }

  function startEditEvaluation(entry: EvaluationRow) {
    setEvaluationMode("edit");
    setTab("evaluations");
    setEvaluationView("form");
    setEvaluationForm({
      subjectId: entry.subject.id,
      subjectBranchId: entry.subjectBranch?.id ?? "",
      evaluationTypeId: entry.evaluationType.id,
      title: entry.title,
      description: entry.description ?? "",
      coefficient: entry.coefficient,
      maxScore: entry.maxScore,
      sequence: entry.sequence,
      isFinalExam: entry.isFinalExam,
      scheduledAt: entry.scheduledAt ?? "",
      status: entry.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      attachments: entry.attachments ?? [],
    });
    setSelectedEvaluationId(entry.id);
  }

  async function handleSaveSingleScore(data: StudentScoreSaveData) {
    if (!schoolSlug || !classId || !selectedEvaluationId) return;
    try {
      await saveScores(schoolSlug, classId, selectedEvaluationId, {
        scores: [
          {
            studentId: data.studentId,
            score: data.score,
            status: data.status,
            comment: data.comment,
          },
        ],
      });
      showSuccess({
        title: t("notes.manager.toast.scoreTitle"),
        message: t("notes.manager.toast.scoreMessage"),
      });
    } catch (error) {
      showError({
        title: t("notes.manager.toast.scoreErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("notes.manager.toast.scoreErrorMessage"),
      });
      throw error;
    }
  }

  async function handleDeleteEvaluation(evalId: string) {
    if (!schoolSlug || !classId) return;
    try {
      await deleteEvaluation(schoolSlug, classId, evalId);
      showSuccess({
        title: t("notes.manager.toast.deleteTitle"),
        message: t("notes.manager.toast.deleteMessage"),
      });
    } catch (error) {
      showError({
        title: t("notes.manager.toast.deleteErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("notes.manager.toast.deleteErrorMessage"),
      });
    }
  }

  async function handleSaveCouncil() {
    if (!schoolSlug || !classId || !teacherContext) return;
    try {
      await saveTermReports(schoolSlug, classId, councilTerm, {
        status: councilStatus,
        councilHeldAt: councilHeldAt.trim() || null,
        students: teacherContext.students.map((student) => ({
          studentId: student.id,
          generalAppreciation:
            councilDrafts[student.id]?.generalAppreciation?.trim() || null,
          subjects: teacherContext.subjects.map((subject) => ({
            subjectId: subject.id,
            appreciation:
              councilDrafts[student.id]?.subjects?.[subject.id] ?? "",
          })),
        })),
      });
      showSuccess({
        title: t("notes.manager.toast.councilTitle"),
        message: t("notes.manager.toast.councilMessage"),
      });
    } catch (error) {
      showError({
        title: t("notes.manager.toast.councilErrorTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("notes.manager.toast.councilErrorMessage"),
      });
    }
  }

  if (!canManage) {
    return (
      <View style={[styles.root, styles.centered]}>
        <EmptyState
          icon="lock-closed-outline"
          title={t("notes.manager.access.title")}
          message={t("notes.manager.access.message")}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      {showHeader ? (
        <ModuleHeader
          title={t("notes.manager.header.title")}
          subtitle={
            teacherContext?.class.name ??
            (classId
              ? `${t("notes.manager.header.classPrefix")} ${classId}`
              : undefined)
          }
          onBack={() => moduleBack(router)}
          testID="class-notes-header"
          backTestID="class-notes-back"
          titleTestID="class-notes-title"
          subtitleTestID="class-notes-subtitle"
        />
      ) : null}
      <NotesTabs activeTab={tab} onSelect={setTab} />

      {/* ── Évaluations — vue liste ────────────────────────────── */}
      {tab === "evaluations" && evaluationView === "list" ? (
        <View style={styles.listContainer}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

          <View style={styles.searchRow} testID="class-notes-search-bar">
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              value={evalSearchQuery}
              onChangeText={setEvalSearchQuery}
              placeholder={t("notes.manager.search.placeholder")}
              placeholderTextColor={colors.textSecondary}
              clearButtonMode="while-editing"
              testID="class-notes-search-input"
            />
            {evalSearchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setEvalSearchQuery("")}
                testID="class-notes-search-clear"
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {isLoadingTeacherContext && !teacherContext ? (
            <View style={styles.centered}>
              <LoadingBlock label={t("notes.manager.loading.notebook")} />
            </View>
          ) : (
            <InfiniteScrollList
              data={filteredEvaluations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.evaluationRow,
                    selectedEvaluationId === item.id &&
                      styles.evaluationRowActive,
                  ]}
                  testID={`class-evaluation-row-${item.id}`}
                >
                  <View style={styles.evaluationRowTop}>
                    <Text style={styles.evaluationTitle}>{item.title}</Text>
                    <Text style={styles.evaluationStatus}>
                      {item.status === "PUBLISHED"
                        ? t("notes.manager.evalList.statusPublished")
                        : t("notes.manager.evalList.statusDraft")}
                    </Text>
                  </View>
                  <Text style={styles.evaluationMeta}>
                    {item.subject.name}
                    {item.subjectBranch?.name
                      ? ` • ${item.subjectBranch.name}`
                      : ""}
                  </Text>
                  <Text style={styles.evaluationMeta}>
                    {sequenceLabel(item.sequence, t)} •{" "}
                    {formatEvaluationDate(item.scheduledAt, t)}
                  </Text>
                  {teacherContext ? (
                    <Text style={styles.evaluationMeta}>
                      {buildEvaluationProgress(
                        item,
                        teacherContext.students.length,
                      )}{" "}
                      {t("notes.manager.evalList.scoresSaisies")}{" "}
                      {formatScore(item.coefficient)}
                    </Text>
                  ) : null}

                  {/* ── Footer actions ── */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.cardAction}
                      onPress={() => {
                        setSelectedEvaluationId(item.id);
                        setEvaluationView("detail");
                      }}
                      testID={`eval-action-detail-${item.id}`}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.cardActionLabel}>
                        {t("notes.manager.evalList.actionDetails")}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.cardActionSeparator} />
                    <TouchableOpacity
                      style={styles.cardAction}
                      onPress={() => startEditEvaluation(item)}
                      testID={`eval-action-edit-${item.id}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.cardActionLabel}>
                        {t("notes.manager.evalList.actionEdit")}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.cardActionSeparator} />
                    <TouchableOpacity
                      style={styles.cardAction}
                      onPress={() => {
                        setSelectedEvaluationId(item.id);
                        setEvaluationView("scores");
                      }}
                      testID={`eval-action-scores-${item.id}`}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.cardActionLabel}>
                        {t("notes.manager.evalList.actionScores")}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.cardActionSeparator} />
                    <TouchableOpacity
                      style={styles.cardAction}
                      onPress={() => setDeleteConfirmId(item.id)}
                      testID={`eval-action-delete-${item.id}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={DANGER_COLOR}
                      />
                      <Text
                        style={[
                          styles.cardActionLabel,
                          styles.cardActionDanger,
                        ]}
                      >
                        {t("notes.manager.evalList.actionDelete")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              refreshing={isLoadingEvaluations && sortedEvaluations.length > 0}
              onRefresh={() => {
                clearError();
                void load().catch(() => {});
              }}
              emptyComponent={
                isLoadingEvaluations ? (
                  <View style={styles.centered}>
                    <LoadingBlock
                      label={t("notes.manager.loading.evaluations")}
                    />
                  </View>
                ) : (
                  <View style={styles.centered}>
                    <EmptyState
                      icon="document-text-outline"
                      title={t("notes.manager.evalList.empty.title")}
                      message={t("notes.manager.evalList.empty.message")}
                    />
                  </View>
                )
              }
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 80 },
              ]}
              testID="class-evaluations-list"
            />
          )}

          <TouchableOpacity
            style={[
              styles.fab,
              { bottom: insets.bottom + 16 + BOTTOM_TAB_BAR_HEIGHT },
            ]}
            onPress={() => {
              resetEvaluationForm();
              setEvaluationView("form");
            }}
            testID="class-notes-fab-create"
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Évaluations — vue formulaire ──────────────────────── */}
      {tab === "evaluations" && evaluationView === "form" ? (
        teacherContext ? (
          <EvaluationForm
            teacherContext={teacherContext}
            initialValues={
              evaluationMode === "edit" ? evaluationForm : undefined
            }
            mode={evaluationMode}
            isSubmitting={isSubmitting}
            onBack={() => setEvaluationView("list")}
            onSubmit={async (payload) => {
              if (!schoolSlug || !classId) return;
              if (evaluationMode === "create") {
                const created = await createEvaluation(
                  schoolSlug,
                  classId,
                  payload,
                );
                setSelectedEvaluationId(created.id);
                showSuccess({
                  title: t("notes.manager.toast.createTitle"),
                  message: t("notes.manager.toast.createMessage"),
                });
              } else {
                await updateEvaluation(
                  schoolSlug,
                  classId,
                  selectedEvaluationId,
                  payload,
                );
                showSuccess({
                  title: t("notes.manager.toast.updateTitle"),
                  message: t("notes.manager.toast.updateMessage"),
                });
              }
              await loadEvaluations(schoolSlug, classId);
              resetEvaluationForm();
              setEvaluationView("list");
              setEvalSearchQuery("");
            }}
            onUploadAttachment={(file) =>
              notesApi.uploadAttachment(schoolSlug!, file)
            }
            onUploadInlineImage={(file) =>
              notesApi.uploadInlineImage(schoolSlug!, file)
            }
          />
        ) : (
          <View style={styles.centered}>
            <LoadingBlock label={t("notes.manager.loading.form")} />
          </View>
        )
      ) : null}

      {/* ── Évaluations — vue détail ──────────────────────────── */}
      {tab === "evaluations" && evaluationView === "detail" ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 8, paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => setEvaluationView("list")}
            testID="class-notes-detail-back"
          >
            <Ionicons
              name="arrow-back-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.backText}>
              {t("notes.manager.evalList.backToList")}
            </Text>
          </TouchableOpacity>

          {selectedEvalRow ? (
            <>
              <SectionCard title={t("notes.manager.detail.sectionTitle")}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelTitle")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedEvalRow.title}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelStatus")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedEvalRow.status === "PUBLISHED"
                      ? t("notes.manager.evalList.statusPublished")
                      : t("notes.manager.evalList.statusDraft")}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelSubject")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedEvalRow.subject.name}
                    {selectedEvalRow.subjectBranch?.name
                      ? ` — ${selectedEvalRow.subjectBranch.name}`
                      : ""}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelType")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedEvalRow.evaluationType.label}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelPeriod")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {sequenceLabel(selectedEvalRow.sequence, t)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelDate")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatEvaluationDate(selectedEvalRow.scheduledAt, t)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelCoefficient")}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatScore(selectedEvalRow.coefficient)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t("notes.manager.detail.labelMaxScore")}
                  </Text>
                  <Text style={styles.detailValue}>
                    /{selectedEvalRow.maxScore}
                  </Text>
                </View>
                {selectedEvalRow.description ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {t("notes.manager.detail.labelDescription")}
                    </Text>
                    <Text style={styles.detailValue}>
                      {selectedEvalRow.description}
                    </Text>
                  </View>
                ) : null}
                {teacherContext ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {t("notes.manager.detail.labelProgress")}
                    </Text>
                    <Text style={styles.detailValue}>
                      {buildEvaluationProgress(
                        selectedEvalRow,
                        teacherContext.students.length,
                      )}{" "}
                      {t("notes.manager.detail.scoresSaisies")}
                    </Text>
                  </View>
                ) : null}
              </SectionCard>

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailActionBtn}
                  onPress={() => startEditEvaluation(selectedEvalRow)}
                  testID="class-notes-detail-edit"
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.detailActionText}>
                    {t("notes.manager.detail.editEval")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.detailActionBtn,
                    styles.detailActionBtnPrimary,
                  ]}
                  onPress={() => setEvaluationView("scores")}
                  testID="class-notes-detail-scores"
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={colors.white}
                  />
                  <Text
                    style={[
                      styles.detailActionText,
                      styles.detailActionTextPrimary,
                    ]}
                  >
                    {t("notes.manager.detail.enterScores")}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </ScrollView>
      ) : null}

      {/* ── Évaluations — vue saisie notes ────────────────────── */}
      {tab === "evaluations" && evaluationView === "scores" ? (
        <View style={styles.listContainer}>
          {/* Info bar */}
          <View style={styles.scoresInfoBar}>
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => setEvaluationView("list")}
              testID="class-notes-scores-back"
            >
              <Ionicons
                name="arrow-back-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.backText}>
                {t("notes.manager.evalList.backToList")}
              </Text>
            </TouchableOpacity>
            {selectedEvalRow ? (
              <>
                <Text style={styles.scoresInfoTitle}>
                  {selectedEvalRow.title}
                </Text>
                <Text style={styles.scoresInfoMeta}>
                  {selectedEvalRow.subject.name} •{" "}
                  {t("notes.manager.detail.labelMaxScore")} /
                  {selectedEvalRow.maxScore}
                </Text>
              </>
            ) : null}
          </View>

          {/* Bandeau brouillon */}
          {selectedEvalRow?.status === "DRAFT" ? (
            <View
              style={styles.draftBanner}
              testID="class-notes-scores-draft-warning"
            >
              <Ionicons
                name="alert-circle-outline"
                size={15}
                color={colors.warmAccent}
              />
              <Text style={styles.draftBannerText}>
                {t("notes.manager.scores.draftBanner")}
              </Text>
            </View>
          ) : null}

          {/* Filtre élève — liste déroulante */}
          <View style={styles.filterRow} testID="class-notes-scores-filter-bar">
            <Ionicons
              name="person-outline"
              size={18}
              color={colors.textSecondary}
            />
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setStudentFilterOpen(true)}
              testID="class-notes-scores-filter-btn"
            >
              <Text style={styles.filterDropdownText}>
                {filterStudentLabel}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {scoresFilterStudentId ? (
              <TouchableOpacity
                onPress={() => setScoresFilterStudentId(null)}
                testID="class-notes-scores-filter-clear"
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Modal filtre élève */}
          <Modal
            visible={studentFilterOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setStudentFilterOpen(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setStudentFilterOpen(false)}
              testID="class-notes-scores-filter-modal"
            >
              <Pressable
                style={styles.pickerCard}
                onPress={(e) => e.stopPropagation()}
              >
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    !scoresFilterStudentId && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setScoresFilterStudentId(null);
                    setStudentFilterOpen(false);
                  }}
                  testID="class-notes-scores-filter-all"
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      !scoresFilterStudentId && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {t("notes.manager.scores.allStudents")}
                  </Text>
                  {!scoresFilterStudentId ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
                {sortedScoreStudents.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.pickerOption,
                      scoresFilterStudentId === s.id &&
                        styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setScoresFilterStudentId(s.id);
                      setStudentFilterOpen(false);
                    }}
                    testID={`class-notes-scores-filter-${s.id}`}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        scoresFilterStudentId === s.id &&
                          styles.pickerOptionTextSelected,
                      ]}
                    >
                      {s.lastName} {s.firstName}
                    </Text>
                    {scoresFilterStudentId === s.id ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </Pressable>
            </Pressable>
          </Modal>

          {/* Liste élèves */}
          {isLoadingEvaluationDetail && !selectedEvaluation ? (
            <View style={styles.centered}>
              <LoadingBlock label={t("notes.manager.loading.scores")} />
            </View>
          ) : (
            <InfiniteScrollList
              data={filteredScoreStudents}
              keyExtractor={(student) => student.id}
              renderItem={({ item: student }) => (
                <StudentScoreCard
                  key={`${selectedEvaluationId}-${student.id}`}
                  student={student}
                  maxScore={selectedEvaluation?.maxScore ?? 20}
                  onSave={handleSaveSingleScore}
                />
              )}
              emptyComponent={
                <View style={styles.centered}>
                  <EmptyState
                    icon="people-outline"
                    title={t("notes.manager.scores.emptyTitle")}
                    message={t("notes.manager.scores.emptyMessage")}
                  />
                </View>
              }
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              testID="class-scores-list"
            />
          )}
        </View>
      ) : null}

      {/* ── Dialog de confirmation de suppression ─────────────── */}
      <ConfirmDialog
        visible={deleteConfirmId !== null}
        title={t("notes.manager.deleteConfirm.title")}
        message={t("notes.manager.deleteConfirm.message")}
        variant="danger"
        confirmLabel={t("notes.manager.deleteConfirm.confirm")}
        cancelLabel={t("notes.manager.deleteConfirm.cancel")}
        onConfirm={() => {
          if (deleteConfirmId) {
            void handleDeleteEvaluation(deleteConfirmId);
          }
          setDeleteConfirmId(null);
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* ── Tab Notes : vue synthétique par élève ─────────────── */}
      {tab === "notes" && teacherContext ? (
        <TeacherClassNotesTab
          teacherContext={teacherContext}
          schoolSlug={schoolSlug ?? ""}
          bottomInset={insets.bottom}
          initialStudentId={preStudentId ?? undefined}
        />
      ) : null}

      {/* ── Autres tabs : ScrollView partagé ──────────────────── */}
      {tab !== "evaluations" && tab !== "notes" ? (
        <ScrollView
          style={styles.root}
          contentContainerStyle={[
            styles.content,
            { paddingTop: 8, paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={
                isLoadingTeacherContext ||
                isLoadingEvaluations ||
                isLoadingTermReports
              }
              onRefresh={() => {
                clearError();
                void load().catch(() => {});
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

          {isLoadingTeacherContext && !teacherContext ? (
            <SectionCard title={t("notes.manager.loading.section")}>
              <LoadingBlock label={t("notes.manager.loading.notebook")} />
            </SectionCard>
          ) : null}

          {teacherContext ? (
            <>
              {tab === "scores" ? (
                <SectionCard
                  title={t("notes.manager.scoresTab.sectionTitle")}
                  subtitle={t("notes.manager.scoresTab.subtitle")}
                >
                  {sortedEvaluations.length > 0 ? (
                    <PillSelector
                      label={t("notes.manager.scoresTab.evalLabel")}
                      value={selectedEvaluationId}
                      options={sortedEvaluations.map((entry) => ({
                        value: entry.id,
                        label:
                          entry.title.length > 18
                            ? `${entry.title.slice(0, 18)}…`
                            : entry.title,
                      }))}
                      onChange={setSelectedEvaluationId}
                      testIDPrefix="class-notes-score-evaluation"
                    />
                  ) : null}

                  {isLoadingEvaluationDetail && !selectedEvaluation ? (
                    <LoadingBlock label={t("notes.manager.loading.detail")} />
                  ) : selectedEvaluation ? (
                    <View style={styles.studentList}>
                      {sortedScoreStudents.map((student) => (
                        <StudentScoreCard
                          key={`tab-${selectedEvaluationId}-${student.id}`}
                          student={student}
                          maxScore={selectedEvaluation.maxScore}
                          onSave={handleSaveSingleScore}
                          testID={`class-notes-score-card-${student.id}`}
                        />
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="create-outline"
                      title={t("notes.manager.scoresTab.emptyTitle")}
                      message={t("notes.manager.scoresTab.emptyMessage")}
                    />
                  )}
                </SectionCard>
              ) : null}

              {tab === "council" ? (
                <SectionCard
                  title={t("notes.manager.council.sectionTitle")}
                  subtitle={t("notes.manager.council.subtitle")}
                >
                  <PillSelector
                    label={t("notes.manager.council.periodLabel")}
                    value={councilTerm}
                    options={TERM_OPTIONS}
                    onChange={(value) =>
                      setCouncilTerm(value as StudentNotesTerm)
                    }
                    testIDPrefix="class-notes-council-term"
                  />
                  <PillSelector
                    label={t("notes.manager.council.statusLabel")}
                    value={councilStatus}
                    options={[
                      {
                        value: "DRAFT",
                        label: t("notes.manager.council.statusDraft"),
                      },
                      {
                        value: "PUBLISHED",
                        label: t("notes.manager.council.statusPublished"),
                      },
                    ]}
                    onChange={(value) =>
                      setCouncilStatus(value as "DRAFT" | "PUBLISHED")
                    }
                    testIDPrefix="class-notes-council-status"
                  />
                  <TextField
                    label={t("notes.manager.council.dateLabel")}
                    value={councilHeldAt}
                    onChangeText={setCouncilHeldAt}
                    placeholder="2026-04-18T15:00:00.000Z"
                    testID="class-notes-council-heldAt"
                  />

                  {teacherContext.students.map((student) => (
                    <View key={student.id} style={styles.studentCard}>
                      <Text style={styles.studentName}>
                        {student.lastName} {student.firstName}
                      </Text>
                      <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>
                          {t("notes.manager.council.generalAppreciation")}
                        </Text>
                        <TextInput
                          value={
                            councilDrafts[student.id]?.generalAppreciation ?? ""
                          }
                          onChangeText={(value) =>
                            setCouncilDrafts((current) => ({
                              ...current,
                              [student.id]: {
                                generalAppreciation: value,
                                subjects: current[student.id]?.subjects ?? {},
                              },
                            }))
                          }
                          placeholder={t(
                            "notes.manager.council.generalPlaceholder",
                          )}
                          placeholderTextColor={colors.textSecondary}
                          multiline
                          style={[
                            styles.compactTextArea,
                            styles.textInputShared,
                          ]}
                          testID={`class-notes-council-general-${student.id}`}
                        />
                      </View>

                      {teacherContext.subjects.map((subject) => (
                        <View
                          key={`${student.id}-${subject.id}`}
                          style={styles.fieldBlock}
                        >
                          <Text style={styles.fieldLabel}>{subject.name}</Text>
                          <TextInput
                            value={
                              councilDrafts[student.id]?.subjects?.[
                                subject.id
                              ] ?? ""
                            }
                            onChangeText={(value) =>
                              setCouncilDrafts((current) => ({
                                ...current,
                                [student.id]: {
                                  generalAppreciation:
                                    current[student.id]?.generalAppreciation ??
                                    "",
                                  subjects: {
                                    ...(current[student.id]?.subjects ?? {}),
                                    [subject.id]: value,
                                  },
                                },
                              }))
                            }
                            placeholder={t(
                              "notes.manager.council.subjectPlaceholder",
                            )}
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            style={[
                              styles.compactTextArea,
                              styles.textInputShared,
                            ]}
                            testID={`class-notes-council-subject-${student.id}-${subject.id}`}
                          />
                        </View>
                      ))}
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      isSubmitting && styles.submitBtnDisabled,
                    ]}
                    onPress={() => void handleSaveCouncil()}
                    disabled={isSubmitting}
                    testID="class-notes-save-council"
                  >
                    <Text style={styles.submitBtnText}>
                      {t("notes.manager.council.save")}
                    </Text>
                  </TouchableOpacity>
                </SectionCard>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", padding: 16 },
  content: { paddingHorizontal: 16, gap: 16 },
  listContainer: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFF8EE",
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  draftBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.warmAccent,
    fontWeight: "600",
    lineHeight: 17,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  filterDropdownText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 8,
    minWidth: 240,
    maxHeight: 400,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  pickerOptionSelected: { backgroundColor: "#eef5fb" },
  pickerOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 10,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  fieldBlock: { gap: 6 },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInputShared: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  compactTextArea: { minHeight: 84, textAlignVertical: "top" },
  evaluationRow: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 4,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  evaluationRowActive: {
    borderColor: colors.primary,
    backgroundColor: "#eef5fb",
  },
  evaluationRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  evaluationTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  evaluationStatus: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  evaluationMeta: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  longPressHint: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    marginTop: 10,
  },
  cardAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 3,
  },
  cardActionSeparator: {
    width: 1,
    backgroundColor: colors.warmBorder,
    marginVertical: 8,
  },
  cardActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  cardActionDanger: { color: DANGER_COLOR },
  scoresInfoBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
    gap: 2,
  },
  scoresInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scoresInfoMeta: { fontSize: 12, color: colors.textSecondary },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 5,
  },
  detailLabel: {
    width: 110,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingTop: 2,
  },
  detailValue: { flex: 1, fontSize: 14, color: colors.textPrimary },
  detailActions: { gap: 10 },
  detailActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
  },
  detailActionBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  detailActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  detailActionTextPrimary: { color: colors.white },
  studentList: { gap: 12 },
  studentCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    padding: 14,
    gap: 10,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  studentName: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  submitBtn: {
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: colors.white, fontSize: 14, fontWeight: "800" },
});
