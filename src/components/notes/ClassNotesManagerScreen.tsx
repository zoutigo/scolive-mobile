import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { notesApi } from "../../api/notes.api";
import { useAuthStore } from "../../store/auth.store";
import { useNotesStore } from "../../store/notes.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import type {
  EvaluationDetail,
  EvaluationRow,
  StudentEvaluationStatus,
  StudentNotesTerm,
  TermReport,
  UpsertEvaluationPayload,
} from "../../types/notes.types";
import {
  buildEvaluationProgress,
  formatEvaluationDate,
  formatScore,
  sortEvaluations,
  termLabel,
} from "../../utils/notes";
import { getViewType } from "../navigation/nav-config";
import { useDrawer } from "../navigation/AppShell";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PillSelector,
  SectionCard,
  TextField,
} from "../timetable/TimetableCommon";

type TabKey = "evaluations" | "scores" | "council" | "help";

type ScoreDrafts = Record<
  string,
  {
    score: string;
    status: StudentEvaluationStatus;
    comment: string;
  }
>;

type CouncilDrafts = Record<
  string,
  {
    generalAppreciation: string;
    subjects: Record<string, string>;
  }
>;

const TAB_OPTIONS: Array<{ value: TabKey; label: string }> = [
  { value: "evaluations", label: "Évaluations" },
  { value: "scores", label: "Saisie" },
  { value: "council", label: "Conseil" },
  { value: "help", label: "Aide" },
];

const TERM_OPTIONS: Array<{ value: StudentNotesTerm; label: string }> = [
  { value: "TERM_1", label: "T1" },
  { value: "TERM_2", label: "T2" },
  { value: "TERM_3", label: "T3" },
];

const SCORE_STATUS_OPTIONS: Array<{
  value: StudentEvaluationStatus;
  label: string;
}> = [
  { value: "ENTERED", label: "Noté" },
  { value: "ABSENT", label: "Absent" },
  { value: "EXCUSED", label: "Disp." },
  { value: "NOT_GRADED", label: "NE" },
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
    term: "TERM_1",
    scheduledAt: "",
    status: "DRAFT",
    attachments: [],
  };
}

export function ClassNotesManagerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const params = useLocalSearchParams<{
    classId?: string;
    schoolYearId?: string;
  }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const { schoolSlug, user } = useAuthStore();
  const {
    teacherContext,
    evaluations,
    termReports,
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
    saveScores,
    loadTermReports,
    saveTermReports,
    clearError,
  } = useNotesStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);
  const viewType = user ? getViewType(user) : "unknown";
  const canManage = viewType === "teacher" || viewType === "school";

  const [tab, setTab] = useState<TabKey>("evaluations");
  const [evaluationMode, setEvaluationMode] = useState<"create" | "edit">(
    "create",
  );
  const [evaluationForm, setEvaluationForm] = useState<UpsertEvaluationPayload>(
    createEmptyEvaluationForm(),
  );
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<EvaluationDetail | null>(null);
  const [scoreDrafts, setScoreDrafts] = useState<ScoreDrafts>({});
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
    if (!schoolSlug || !classId || !selectedEvaluationId) {
      setSelectedEvaluation(null);
      return;
    }

    void loadEvaluationDetail(schoolSlug, classId, selectedEvaluationId)
      .then((detail) => {
        setSelectedEvaluation(detail);
        setScoreDrafts(
          detail.students.reduce<ScoreDrafts>((acc, student) => {
            acc[student.id] = {
              score: student.score === null ? "" : String(student.score),
              status: student.scoreStatus,
              comment: student.comment ?? "",
            };
            return acc;
          }, {}),
        );
      })
      .catch(() => {});
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

  const selectedSubject = useMemo(
    () =>
      teacherContext?.subjects.find(
        (entry) => entry.id === evaluationForm.subjectId,
      ) ?? null,
    [evaluationForm.subjectId, teacherContext?.subjects],
  );

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
    setEvaluationForm({
      subjectId: entry.subject.id,
      subjectBranchId: entry.subjectBranch?.id ?? "",
      evaluationTypeId: entry.evaluationType.id,
      title: entry.title,
      description: entry.description ?? "",
      coefficient: entry.coefficient,
      maxScore: entry.maxScore,
      term: entry.term,
      scheduledAt: entry.scheduledAt ?? "",
      status: entry.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      attachments: entry.attachments ?? [],
    });
    setSelectedEvaluationId(entry.id);
  }

  async function handleAttachmentPick() {
    if (!schoolSlug) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const uploads = await Promise.all(
        result.assets.map((asset) =>
          notesApi.uploadAttachment(schoolSlug, {
            uri: asset.uri,
            mimeType: asset.mimeType ?? "application/octet-stream",
            fileName: asset.name,
          }),
        ),
      );

      setEvaluationForm((current) => ({
        ...current,
        attachments: [...(current.attachments ?? []), ...uploads],
      }));

      showSuccess({
        title: "Pièce jointe ajoutée",
        message:
          uploads.length > 1
            ? `${uploads.length} pièces jointes ont été ajoutées.`
            : "La pièce jointe a été ajoutée à l'évaluation.",
      });
    } catch (error) {
      showError({
        title: "Ajout impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de téléverser cette pièce jointe.",
      });
    }
  }

  async function handleSubmitEvaluation() {
    if (!schoolSlug || !classId) return;
    try {
      if (!evaluationForm.subjectId || !evaluationForm.evaluationTypeId) {
        throw new Error("Choisissez une matière et un type d'évaluation.");
      }
      if (!evaluationForm.title.trim()) {
        throw new Error("Le titre de l'évaluation est obligatoire.");
      }
      if (!evaluationForm.scheduledAt.trim()) {
        throw new Error("La date prévue est obligatoire.");
      }

      if (evaluationMode === "create") {
        const created = await createEvaluation(
          schoolSlug,
          classId,
          evaluationForm,
        );
        setSelectedEvaluationId(created.id);
        showSuccess({
          title: "Évaluation créée",
          message: "L'évaluation a bien été enregistrée.",
        });
      } else {
        if (!selectedEvaluationId) {
          throw new Error("Aucune évaluation sélectionnée.");
        }
        await updateEvaluation(
          schoolSlug,
          classId,
          selectedEvaluationId,
          evaluationForm,
        );
        showSuccess({
          title: "Évaluation mise à jour",
          message: "Les modifications ont bien été enregistrées.",
        });
      }

      await loadEvaluations(schoolSlug, classId);
      resetEvaluationForm();
    } catch (error) {
      showError({
        title: "Enregistrement impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer cette évaluation.",
      });
    }
  }

  async function handleSaveScores() {
    if (!schoolSlug || !classId || !selectedEvaluationId || !selectedEvaluation)
      return;
    try {
      await saveScores(schoolSlug, classId, selectedEvaluationId, {
        scores: selectedEvaluation.students.map((student) => {
          const draft = scoreDrafts[student.id];
          return {
            studentId: student.id,
            status: draft?.status ?? "NOT_GRADED",
            score:
              draft?.status === "ENTERED" && draft.score.trim()
                ? Number(draft.score)
                : null,
            comment: draft?.comment?.trim() || null,
          };
        }),
      });
      showSuccess({
        title: "Notes enregistrées",
        message: "La saisie des scores a bien été sauvegardée.",
      });
    } catch (error) {
      showError({
        title: "Saisie impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer les notes.",
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
        title: "Conseil de classe enregistré",
        message: "Les appréciations de période ont bien été sauvegardées.",
      });
    } catch (error) {
      showError({
        title: "Enregistrement impossible",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer les appréciations.",
      });
    }
  }

  if (!canManage) {
    return (
      <View style={[styles.root, styles.centered]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Accès non autorisé"
          message="Ce module est réservé aux enseignants et aux rôles établissement."
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
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
        <View style={styles.headerCard} testID="class-notes-header">
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            testID="class-notes-back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              {viewType === "teacher"
                ? "Portail enseignant"
                : "Portail établissement"}
            </Text>
            <Text style={styles.title}>
              {teacherContext?.class.name ?? "Cahier de notes"}
            </Text>
            <Text style={styles.subtitle}>
              Évaluations, saisie des notes et appréciations de période.
            </Text>
          </View>
          <TouchableOpacity
            onPress={openDrawer}
            style={styles.backBtn}
            testID="class-notes-menu-btn"
          >
            <Ionicons name="menu-outline" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <SectionCard
          title="Navigation du module"
          subtitle="Retrouvez la même logique que sur le web, structurée en quatre volets."
        >
          <PillSelector
            label="Section"
            value={tab}
            options={TAB_OPTIONS}
            onChange={(value) => setTab(value as TabKey)}
            testIDPrefix="class-notes-tab"
          />
        </SectionCard>

        {isLoadingTeacherContext && !teacherContext ? (
          <SectionCard title="Chargement">
            <LoadingBlock label="Chargement du cahier de notes..." />
          </SectionCard>
        ) : null}

        {teacherContext ? (
          <>
            {tab === "evaluations" ? (
              <>
                <SectionCard
                  title={
                    evaluationMode === "create"
                      ? "Créer une évaluation"
                      : "Modifier l'évaluation"
                  }
                  subtitle="Définissez la matière, le type, la période, le barème et les pièces jointes."
                  action={
                    evaluationMode === "edit" ? (
                      <TouchableOpacity
                        style={styles.resetBtn}
                        onPress={resetEvaluationForm}
                      >
                        <Text style={styles.resetBtnText}>Nouvelle</Text>
                      </TouchableOpacity>
                    ) : undefined
                  }
                >
                  <PillSelector
                    label="Période"
                    value={evaluationForm.term}
                    options={TERM_OPTIONS}
                    onChange={(value) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        term: value as StudentNotesTerm,
                      }))
                    }
                    testIDPrefix="class-notes-form-term"
                  />
                  <PillSelector
                    label="Statut"
                    value={evaluationForm.status}
                    options={[
                      { value: "DRAFT", label: "Brouillon" },
                      { value: "PUBLISHED", label: "Publié" },
                    ]}
                    onChange={(value) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        status: value as "DRAFT" | "PUBLISHED",
                      }))
                    }
                    testIDPrefix="class-notes-form-status"
                  />
                  <PillSelector
                    label="Matière"
                    value={evaluationForm.subjectId}
                    options={teacherContext.subjects.map((subject) => ({
                      value: subject.id,
                      label: subject.name,
                    }))}
                    onChange={(value) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        subjectId: value,
                        subjectBranchId:
                          teacherContext.subjects.find(
                            (subject) => subject.id === value,
                          )?.branches[0]?.id ?? "",
                      }))
                    }
                    testIDPrefix="class-notes-form-subject"
                  />
                  {selectedSubject && selectedSubject.branches.length > 0 ? (
                    <PillSelector
                      label="Sous-branche"
                      value={evaluationForm.subjectBranchId ?? ""}
                      options={selectedSubject.branches.map((branch) => ({
                        value: branch.id,
                        label: branch.name,
                      }))}
                      onChange={(value) =>
                        setEvaluationForm((current) => ({
                          ...current,
                          subjectBranchId: value,
                        }))
                      }
                      testIDPrefix="class-notes-form-branch"
                    />
                  ) : null}
                  <PillSelector
                    label="Type"
                    value={evaluationForm.evaluationTypeId}
                    options={teacherContext.evaluationTypes.map((entry) => ({
                      value: entry.id,
                      label: entry.label,
                    }))}
                    onChange={(value) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        evaluationTypeId: value,
                      }))
                    }
                    testIDPrefix="class-notes-form-type"
                  />
                  <TextField
                    label="Titre"
                    value={evaluationForm.title}
                    onChangeText={(title) =>
                      setEvaluationForm((current) => ({ ...current, title }))
                    }
                    placeholder="Composition de mathématiques"
                    testID="class-notes-form-title"
                  />
                  <TextField
                    label="Date prévue"
                    value={evaluationForm.scheduledAt}
                    onChangeText={(scheduledAt) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        scheduledAt,
                      }))
                    }
                    placeholder="2026-04-12T08:00:00.000Z"
                    testID="class-notes-form-scheduledAt"
                  />
                  <View style={styles.dualRow}>
                    <TextField
                      label="Coefficient"
                      value={String(evaluationForm.coefficient)}
                      onChangeText={(value) =>
                        setEvaluationForm((current) => ({
                          ...current,
                          coefficient: Number(value || 0),
                        }))
                      }
                      keyboardType="numeric"
                      testID="class-notes-form-coefficient"
                    />
                    <TextField
                      label="Barème"
                      value={String(evaluationForm.maxScore)}
                      onChangeText={(value) =>
                        setEvaluationForm((current) => ({
                          ...current,
                          maxScore: Number(value || 0),
                        }))
                      }
                      keyboardType="numeric"
                      testID="class-notes-form-maxScore"
                    />
                  </View>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput
                      value={evaluationForm.description ?? ""}
                      onChangeText={(description) =>
                        setEvaluationForm((current) => ({
                          ...current,
                          description,
                        }))
                      }
                      placeholder="Consignes, compétences visées, modalités…"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      style={[styles.textArea, styles.textInputShared]}
                      testID="class-notes-form-description"
                    />
                  </View>

                  <View style={styles.attachmentSection}>
                    <View style={styles.attachmentHeader}>
                      <Text style={styles.fieldLabel}>Pièces jointes</Text>
                      <TouchableOpacity
                        style={styles.inlineAction}
                        onPress={() => void handleAttachmentPick()}
                        disabled={isSubmitting}
                      >
                        <Ionicons
                          name="attach-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.inlineActionText}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>
                    {evaluationForm.attachments?.length ? (
                      <View style={styles.attachmentList}>
                        {evaluationForm.attachments.map((attachment, index) => (
                          <View
                            key={`${attachment.fileName}-${index}`}
                            style={styles.attachmentRow}
                          >
                            <Text style={styles.attachmentName}>
                              {attachment.fileName}
                            </Text>
                            <Text style={styles.attachmentMeta}>
                              {attachment.sizeLabel ||
                                attachment.mimeType ||
                                "Fichier"}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.inlineHint}>
                        Ajoutez un support d'évaluation, un sujet ou une
                        consigne.
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      isSubmitting && styles.submitBtnDisabled,
                    ]}
                    onPress={() => void handleSubmitEvaluation()}
                    disabled={isSubmitting}
                    testID="class-notes-save-evaluation"
                  >
                    <Text style={styles.submitBtnText}>
                      {evaluationMode === "create"
                        ? "Enregistrer l'évaluation"
                        : "Mettre à jour l'évaluation"}
                    </Text>
                  </TouchableOpacity>
                </SectionCard>

                <SectionCard
                  title="Évaluations de la classe"
                  subtitle="Sélectionnez une évaluation pour la modifier ou basculer vers la saisie."
                >
                  {isLoadingEvaluations && sortedEvaluations.length === 0 ? (
                    <LoadingBlock label="Chargement des évaluations..." />
                  ) : sortedEvaluations.length === 0 ? (
                    <EmptyState
                      icon="document-text-outline"
                      title="Aucune évaluation"
                      message="Commencez par créer une première évaluation pour cette classe."
                    />
                  ) : (
                    <View style={styles.listBlock}>
                      {sortedEvaluations.map((entry) => (
                        <TouchableOpacity
                          key={entry.id}
                          style={[
                            styles.evaluationRow,
                            selectedEvaluationId === entry.id &&
                              styles.evaluationRowActive,
                          ]}
                          onPress={() => {
                            setSelectedEvaluationId(entry.id);
                            setTab("scores");
                          }}
                          onLongPress={() => startEditEvaluation(entry)}
                          testID={`class-evaluation-row-${entry.id}`}
                        >
                          <View style={styles.evaluationRowTop}>
                            <Text style={styles.evaluationTitle}>
                              {entry.title}
                            </Text>
                            <Text style={styles.evaluationStatus}>
                              {entry.status === "PUBLISHED"
                                ? "Publié"
                                : "Brouillon"}
                            </Text>
                          </View>
                          <Text style={styles.evaluationMeta}>
                            {entry.subject.name}
                            {entry.subjectBranch?.name
                              ? ` • ${entry.subjectBranch.name}`
                              : ""}
                          </Text>
                          <Text style={styles.evaluationMeta}>
                            {termLabel(entry.term)} •{" "}
                            {formatEvaluationDate(entry.scheduledAt)}
                          </Text>
                          <Text style={styles.evaluationMeta}>
                            {buildEvaluationProgress(
                              entry,
                              teacherContext.students.length,
                            )}{" "}
                            scores saisis • coeff.{" "}
                            {formatScore(entry.coefficient)}
                          </Text>
                          <Text style={styles.longPressHint}>
                            Appui long pour modifier cette évaluation.
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </SectionCard>
              </>
            ) : null}

            {tab === "scores" ? (
              <SectionCard
                title="Saisie des notes"
                subtitle="Choisissez une évaluation puis renseignez note, statut et commentaire."
              >
                {sortedEvaluations.length > 0 ? (
                  <PillSelector
                    label="Évaluation"
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
                  <LoadingBlock label="Chargement du détail de l'évaluation..." />
                ) : selectedEvaluation ? (
                  <View style={styles.studentList}>
                    {selectedEvaluation.students.map((student) => {
                      const draft = scoreDrafts[student.id] ?? {
                        score: "",
                        status: "NOT_GRADED",
                        comment: "",
                      };
                      return (
                        <View key={student.id} style={styles.studentCard}>
                          <Text style={styles.studentName}>
                            {student.lastName} {student.firstName}
                          </Text>
                          <PillSelector
                            label="Statut"
                            value={draft.status}
                            options={SCORE_STATUS_OPTIONS}
                            onChange={(value) =>
                              setScoreDrafts((current) => ({
                                ...current,
                                [student.id]: {
                                  ...current[student.id],
                                  score:
                                    value === "ENTERED"
                                      ? (current[student.id]?.score ?? "")
                                      : "",
                                  status: value as StudentEvaluationStatus,
                                  comment: current[student.id]?.comment ?? "",
                                },
                              }))
                            }
                            testIDPrefix={`class-notes-score-status-${student.id}`}
                          />
                          <TextField
                            label="Note"
                            value={draft.score}
                            onChangeText={(score) =>
                              setScoreDrafts((current) => ({
                                ...current,
                                [student.id]: {
                                  ...current[student.id],
                                  score,
                                  status:
                                    current[student.id]?.status ?? "ENTERED",
                                  comment: current[student.id]?.comment ?? "",
                                },
                              }))
                            }
                            keyboardType="numeric"
                            placeholder={`/ ${selectedEvaluation.maxScore}`}
                            testID={`class-notes-score-value-${student.id}`}
                          />
                          <View style={styles.fieldBlock}>
                            <Text style={styles.fieldLabel}>Commentaire</Text>
                            <TextInput
                              value={draft.comment}
                              onChangeText={(comment) =>
                                setScoreDrafts((current) => ({
                                  ...current,
                                  [student.id]: {
                                    ...current[student.id],
                                    score: current[student.id]?.score ?? "",
                                    status:
                                      current[student.id]?.status ??
                                      "NOT_GRADED",
                                    comment,
                                  },
                                }))
                              }
                              placeholder="Observation individuelle"
                              placeholderTextColor={colors.textSecondary}
                              multiline
                              style={[
                                styles.compactTextArea,
                                styles.textInputShared,
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                    <TouchableOpacity
                      style={[
                        styles.submitBtn,
                        isSubmitting && styles.submitBtnDisabled,
                      ]}
                      onPress={() => void handleSaveScores()}
                      disabled={isSubmitting}
                      testID="class-notes-save-scores"
                    >
                      <Text style={styles.submitBtnText}>
                        Enregistrer la saisie
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <EmptyState
                    icon="create-outline"
                    title="Aucune évaluation sélectionnée"
                    message="Créez ou sélectionnez une évaluation pour commencer la saisie."
                  />
                )}
              </SectionCard>
            ) : null}

            {tab === "council" ? (
              <SectionCard
                title="Conseil de classe"
                subtitle="Saisissez les appréciations générales et par matière pour chaque élève."
              >
                <PillSelector
                  label="Période"
                  value={councilTerm}
                  options={TERM_OPTIONS}
                  onChange={(value) =>
                    setCouncilTerm(value as StudentNotesTerm)
                  }
                  testIDPrefix="class-notes-council-term"
                />
                <PillSelector
                  label="Statut"
                  value={councilStatus}
                  options={[
                    { value: "DRAFT", label: "Brouillon" },
                    { value: "PUBLISHED", label: "Publié" },
                  ]}
                  onChange={(value) =>
                    setCouncilStatus(value as "DRAFT" | "PUBLISHED")
                  }
                  testIDPrefix="class-notes-council-status"
                />
                <TextField
                  label="Date du conseil"
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
                        Appréciation générale
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
                        placeholder="Bilan général de l'élève"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        style={[styles.compactTextArea, styles.textInputShared]}
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
                            councilDrafts[student.id]?.subjects?.[subject.id] ??
                            ""
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
                          placeholder="Appréciation par matière"
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
                    Enregistrer le conseil
                  </Text>
                </TouchableOpacity>
              </SectionCard>
            ) : null}

            {tab === "help" ? (
              <SectionCard
                title="Aide rapide"
                subtitle="Rappels de fonctionnement pour limiter les erreurs de saisie."
              >
                <View style={styles.helpList}>
                  <HelpRow text="Créez d'abord une évaluation, puis passez dans l'onglet Saisie pour noter les élèves." />
                  <HelpRow text="Le statut 'Publié' rend l'évaluation visible côté famille dans le module Notes." />
                  <HelpRow text="Les notes absentes, dispensées et non évaluées sont restituées telles quelles dans la vue parent." />
                  <HelpRow text="Les appréciations du conseil de classe alimentent la présentation synthétique des notes sur mobile et sur web." />
                  <HelpRow text="Un appui long sur une évaluation de la liste recharge le formulaire en mode édition." />
                </View>
              </SectionCard>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function HelpRow({ text }: { text: string }) {
  return (
    <View style={styles.helpRow}>
      <Ionicons
        name="checkmark-circle-outline"
        size={18}
        color={colors.accentTeal}
      />
      <Text style={styles.helpText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: "center", padding: 16 },
  content: { paddingHorizontal: 16, gap: 16 },
  headerCard: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: -8,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 4 },
  eyebrow: {
    color: "rgba(255,255,255,0.78)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
  },
  title: { color: colors.white, fontSize: 22, fontWeight: "700" },
  subtitle: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    lineHeight: 18,
  },
  resetBtn: {
    borderRadius: 999,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetBtnText: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  dualRow: { flexDirection: "row", gap: 10 },
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
  textArea: { minHeight: 112, textAlignVertical: "top" },
  compactTextArea: { minHeight: 84, textAlignVertical: "top" },
  attachmentSection: { gap: 8 },
  attachmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  inlineAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  inlineActionText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  inlineHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  attachmentList: { gap: 8 },
  attachmentRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 3,
  },
  attachmentName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  attachmentMeta: { color: colors.textSecondary, fontSize: 11 },
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
  listBlock: { gap: 10 },
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
  longPressHint: { color: colors.warmAccent, fontSize: 11, fontWeight: "600" },
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
  helpList: { gap: 12 },
  helpRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  helpText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
});
