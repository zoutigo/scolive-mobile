import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
import { promotionsApi } from "../../api/promotions.api";
import { teachersApi } from "../../api/teachers.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { EmptyState, LoadingBlock } from "../timetable/TimetableCommon";
import type {
  TeacherSchoolYearOption,
  TeacherClassroomOption,
} from "../../types/teachers.types";
import type { CurriculumAcademicLevel } from "../../types/curriculums.types";
import type {
  PromotionDecision,
  TermReportForDecisionRow,
  WaitingEnrollmentRow,
} from "../../types/promotions.types";

type SubTab = "decisions" | "waiting" | "years";

function roleAllowsPromotions(role: string | null | undefined) {
  return (
    role === "SCHOOL_ADMIN" ||
    role === "SCHOOL_MANAGER" ||
    role === "SUPERVISOR" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

function roleCanManageYears(role: string | null | undefined) {
  return role === "SCHOOL_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
}

function roleCanActivateYear(role: string | null | undefined) {
  return roleCanManageYears(role) || role === "SCHOOL_MANAGER";
}

type DecisionDraft = {
  decision: PromotionDecision;
  nextAcademicLevelId: string;
};

export function PromotionsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const effectiveRole = user?.activeRole ?? null;
  const canAccessModule = roleAllowsPromotions(effectiveRole);

  const [subTab, setSubTab] = useState<SubTab>("decisions");
  const [classrooms, setClassrooms] = useState<TeacherClassroomOption[]>([]);
  const [schoolYears, setSchoolYears] = useState<TeacherSchoolYearOption[]>([]);
  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [loadingReference, setLoadingReference] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [termReports, setTermReports] = useState<TermReportForDecisionRow[]>(
    [],
  );
  const [decisionDrafts, setDecisionDrafts] = useState<
    Record<string, DecisionDraft>
  >({});
  const [savingReportId, setSavingReportId] = useState<string | null>(null);

  const [targetSchoolYearId, setTargetSchoolYearId] = useState("");
  const [waitingLevelId, setWaitingLevelId] = useState("");
  const [waiting, setWaiting] = useState<WaitingEnrollmentRow[]>([]);
  const [assignDrafts, setAssignDrafts] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const [newYearLabel, setNewYearLabel] = useState("");
  const [creatingYear, setCreatingYear] = useState(false);
  const [activatingYearId, setActivatingYearId] = useState<string | null>(null);
  const [rolloverSourceId, setRolloverSourceId] = useState("");
  const [rolloverTargetId, setRolloverTargetId] = useState("");
  const [rollingOver, setRollingOver] = useState(false);

  const loadReferenceData = useCallback(async () => {
    if (!schoolSlug) return;
    setLoadingReference(true);
    try {
      const [classroomRows, yearRows, levelRows] = await Promise.all([
        teachersApi.listClassrooms(schoolSlug),
        teachersApi.listSchoolYears(schoolSlug),
        curriculumsApi.listAcademicLevels(schoolSlug),
      ]);
      setClassrooms(classroomRows);
      setSchoolYears(yearRows);
      setLevels(levelRows);
    } finally {
      setLoadingReference(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  const loadTermReports = useCallback(async () => {
    if (!schoolSlug || !selectedClassId) return;
    try {
      const rows = await promotionsApi.listTermReportsForDecision(
        schoolSlug,
        selectedClassId,
      );
      setTermReports(rows);
      setDecisionDrafts(
        Object.fromEntries(
          rows.map((row) => [
            row.id,
            {
              decision: row.decision ?? "PROMOTED",
              nextAcademicLevelId: row.nextAcademicLevel?.id ?? "",
            },
          ]),
        ),
      );
    } catch (error) {
      showError({
        title: t("promotionsAdmin.errors.loadReports"),
        message: extractApiError(error),
      });
    }
    // `t`/`showError` intentionally omitted: `t` is a new reference every
    // render and would retrigger this callback's identity on each render.
  }, [schoolSlug, selectedClassId]);

  useEffect(() => {
    if (selectedClassId) void loadTermReports();
    else setTermReports([]);
  }, [selectedClassId, loadTermReports]);

  const loadWaiting = useCallback(async () => {
    if (!schoolSlug || !targetSchoolYearId) return;
    try {
      const rows = await promotionsApi.listWaitingEnrollments(schoolSlug, {
        schoolYearId: targetSchoolYearId,
        academicLevelId: waitingLevelId || undefined,
      });
      setWaiting(rows);
    } catch (error) {
      showError({
        title: t("promotionsAdmin.errors.loadWaiting"),
        message: extractApiError(error),
      });
    }
    // `t`/`showError` intentionally omitted (see loadTermReports above).
  }, [schoolSlug, targetSchoolYearId, waitingLevelId]);

  useEffect(() => {
    if (targetSchoolYearId) void loadWaiting();
    else setWaiting([]);
  }, [targetSchoolYearId, waitingLevelId, loadWaiting]);

  async function saveDecision(reportId: string) {
    if (!schoolSlug) return;
    const draft = decisionDrafts[reportId];
    if (!draft) return;
    setSavingReportId(reportId);
    try {
      await promotionsApi.setTermReportDecision(schoolSlug, reportId, {
        decision: draft.decision,
        nextAcademicLevelId:
          draft.decision === "LEFT"
            ? undefined
            : draft.nextAcademicLevelId || undefined,
      });
      showSuccess({
        title: t("promotionsAdmin.success.decisionSaved"),
        message: "",
      });
      await loadTermReports();
    } catch (error) {
      showError({
        title: t("promotionsAdmin.errors.saveDecision"),
        message: extractApiError(error),
      });
    } finally {
      setSavingReportId(null);
    }
  }

  async function assignToClass(enrollmentId: string) {
    if (!schoolSlug) return;
    const classId = assignDrafts[enrollmentId];
    if (!classId) return;
    setAssigningId(enrollmentId);
    try {
      await promotionsApi.assignEnrollmentToClass(
        schoolSlug,
        enrollmentId,
        classId,
      );
      showSuccess({
        title: t("promotionsAdmin.success.assigned"),
        message: "",
      });
      await loadWaiting();
    } catch (error) {
      showError({
        title: t("promotionsAdmin.errors.assign"),
        message: extractApiError(error),
      });
    } finally {
      setAssigningId(null);
    }
  }

  async function createYear() {
    if (!schoolSlug || !newYearLabel.trim()) return;
    setCreatingYear(true);
    try {
      await promotionsApi.createSchoolYear(schoolSlug, {
        label: newYearLabel.trim(),
      });
      showSuccess({
        title: t("promotionsAdmin.years.success.created"),
        message: "",
      });
      setNewYearLabel("");
      await loadReferenceData();
    } catch (error) {
      showError({
        title: t("promotionsAdmin.years.errors.create"),
        message: extractApiError(error),
      });
    } finally {
      setCreatingYear(false);
    }
  }

  async function activateYear(schoolYearId: string) {
    if (!schoolSlug) return;
    setActivatingYearId(schoolYearId);
    try {
      await promotionsApi.activateSchoolYear(schoolSlug, schoolYearId);
      showSuccess({
        title: t("promotionsAdmin.years.success.activated"),
        message: "",
      });
      await loadReferenceData();
    } catch (error) {
      showError({
        title: t("promotionsAdmin.years.errors.activate"),
        message: extractApiError(error),
      });
    } finally {
      setActivatingYearId(null);
    }
  }

  async function triggerRollover() {
    if (!schoolSlug || !rolloverSourceId || !rolloverTargetId) return;
    setRollingOver(true);
    try {
      await promotionsApi.rolloverSchoolYear(schoolSlug, {
        sourceSchoolYearId: rolloverSourceId,
        targetSchoolYearId: rolloverTargetId,
      });
      showSuccess({
        title: t("promotionsAdmin.years.success.rolledOver"),
        message: "",
      });
      await loadReferenceData();
    } catch (error) {
      showError({
        title: t("promotionsAdmin.years.errors.rollover"),
        message: extractApiError(error),
      });
    } finally {
      setRollingOver(false);
    }
  }

  const canManageYears = roleCanManageYears(effectiveRole);
  const canActivateYear = roleCanActivateYear(effectiveRole);

  const classroomOptions = useMemo(
    () =>
      classrooms.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.schoolYear.label})`,
      })),
    [classrooms],
  );
  const yearOptions = useMemo(
    () => schoolYears.map((y) => ({ value: y.id, label: y.label })),
    [schoolYears],
  );
  const levelOptions = useMemo(
    () => levels.map((l) => ({ value: l.id, label: l.label })),
    [levels],
  );
  const waitingLevelOptions = useMemo(
    () => [
      { value: "", label: t("promotionsAdmin.waiting.allLevels") },
      ...levelOptions,
    ],
    [levelOptions, t],
  );
  const decisionOptions = useMemo(
    () => [
      { value: "PROMOTED", label: t("promotionsAdmin.decision.PROMOTED") },
      { value: "REPEATED", label: t("promotionsAdmin.decision.REPEATED") },
      { value: "LEFT", label: t("promotionsAdmin.decision.LEFT") },
    ],
    [t],
  );
  const targetYearClassrooms = useMemo(
    () => classrooms.filter((c) => c.schoolYear.id === targetSchoolYearId),
    [classrooms, targetSchoolYearId],
  );

  if (!canAccessModule) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title={t("promotionsAdmin.title")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="promotions-admin-header"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="school-outline"
            title={t("financeAdmin.lockedTitle")}
            message={t("financeAdmin.lockedMessage")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title={t("promotionsAdmin.title")}
        onBack={() => moduleBack(router)}
        topInset={insets.top}
        testID="promotions-admin-header"
        backTestID="promotions-admin-back-btn"
      />
      <UnderlineTabs<SubTab>
        items={[
          { key: "decisions", label: t("promotionsAdmin.tab.decisions") },
          {
            key: "waiting",
            label: targetSchoolYearId
              ? `${t("promotionsAdmin.tab.waiting")} (${waiting.length})`
              : t("promotionsAdmin.tab.waiting"),
          },
          { key: "years", label: t("promotionsAdmin.tab.years") },
        ]}
        activeKey={subTab}
        onSelect={setSubTab}
        testIDPrefix="promotions-admin-tab"
      />

      {loadingReference ? (
        <LoadingBlock label={t("common.loading")} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {schoolYears.length <= 1 ? (
            <View style={styles.alertBox} testID="promotions-admin-years-alert">
              <Text style={styles.alertText}>
                {t("promotionsAdmin.years.alert")}
              </Text>
            </View>
          ) : null}

          {subTab === "years" ? (
            <>
              {schoolYears.map((year) => (
                <View
                  key={year.id}
                  style={styles.card}
                  testID={`school-year-${year.id}`}
                >
                  <Text style={styles.cardTitle}>{year.label}</Text>
                  {year.isActive ? (
                    <Text style={styles.activeLabel}>
                      {t("promotionsAdmin.years.active")}
                    </Text>
                  ) : canActivateYear ? (
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        activatingYearId === year.id &&
                          styles.submitButtonDisabled,
                      ]}
                      disabled={activatingYearId === year.id}
                      onPress={() => activateYear(year.id)}
                      testID={`school-year-${year.id}-activate`}
                    >
                      <Text style={styles.submitButtonText}>
                        {t("promotionsAdmin.years.activate")}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}

              {canManageYears ? (
                <>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {t("promotionsAdmin.years.create.title")}
                    </Text>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t("promotionsAdmin.years.create.label")}
                      </Text>
                      <TextInput
                        value={newYearLabel}
                        onChangeText={setNewYearLabel}
                        style={styles.textInput}
                        testID="promotions-admin-new-year-label"
                        placeholder="2026-2027"
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (creatingYear || !newYearLabel.trim()) &&
                          styles.submitButtonDisabled,
                      ]}
                      disabled={creatingYear || !newYearLabel.trim()}
                      onPress={createYear}
                      testID="promotions-admin-create-year-submit"
                    >
                      <Text style={styles.submitButtonText}>
                        {t("promotionsAdmin.years.create.submit")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {t("promotionsAdmin.years.rollover.title")}
                    </Text>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t("promotionsAdmin.years.rollover.source")}
                      </Text>
                      <InlineSelectDropDown
                        options={yearOptions}
                        value={rolloverSourceId}
                        onChange={setRolloverSourceId}
                        testID="promotions-admin-rollover-source"
                      />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>
                        {t("promotionsAdmin.years.rollover.target")}
                      </Text>
                      <InlineSelectDropDown
                        options={yearOptions}
                        value={rolloverTargetId}
                        onChange={setRolloverTargetId}
                        testID="promotions-admin-rollover-target"
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (rollingOver ||
                          !rolloverSourceId ||
                          !rolloverTargetId) &&
                          styles.submitButtonDisabled,
                      ]}
                      disabled={
                        rollingOver || !rolloverSourceId || !rolloverTargetId
                      }
                      onPress={triggerRollover}
                      testID="promotions-admin-rollover-submit"
                    >
                      <Text style={styles.submitButtonText}>
                        {t("promotionsAdmin.years.rollover.submit")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </>
          ) : null}

          {subTab === "decisions" ? (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t("promotionsAdmin.decisions.selectClass")}
                </Text>
                <InlineSelectDropDown
                  options={classroomOptions}
                  value={selectedClassId}
                  onChange={setSelectedClassId}
                  testID="promotions-admin-class-select"
                />
              </View>

              {termReports.map((report) => {
                const draft = decisionDrafts[report.id];
                return (
                  <View
                    key={report.id}
                    style={styles.card}
                    testID={`term-report-${report.id}`}
                  >
                    <Text style={styles.cardTitle}>
                      {report.student.lastName} {report.student.firstName}
                    </Text>
                    <InlineSelectDropDown
                      options={decisionOptions}
                      value={draft?.decision ?? "PROMOTED"}
                      onChange={(value) =>
                        setDecisionDrafts((current) => ({
                          ...current,
                          [report.id]: {
                            ...current[report.id],
                            decision: value as PromotionDecision,
                          },
                        }))
                      }
                      testID={`term-report-${report.id}-decision`}
                    />
                    {draft?.decision !== "LEFT" ? (
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>
                          {t("promotionsAdmin.decisions.nextLevel")}
                        </Text>
                        <InlineSelectDropDown
                          options={levelOptions}
                          value={draft?.nextAcademicLevelId ?? ""}
                          onChange={(value) =>
                            setDecisionDrafts((current) => ({
                              ...current,
                              [report.id]: {
                                ...current[report.id],
                                nextAcademicLevelId: value,
                              },
                            }))
                          }
                          testID={`term-report-${report.id}-level`}
                        />
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        savingReportId === report.id &&
                          styles.submitButtonDisabled,
                      ]}
                      disabled={savingReportId === report.id}
                      onPress={() => saveDecision(report.id)}
                      testID={`term-report-${report.id}-save`}
                    >
                      <Text style={styles.submitButtonText}>
                        {t("common.save")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              {selectedClassId && termReports.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t("promotionsAdmin.decisions.empty")}
                </Text>
              ) : null}
            </>
          ) : null}

          {subTab === "waiting" ? (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t("promotionsAdmin.waiting.targetYear")}
                </Text>
                <InlineSelectDropDown
                  options={yearOptions}
                  value={targetSchoolYearId}
                  onChange={setTargetSchoolYearId}
                  testID="promotions-admin-target-year"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {t("promotionsAdmin.waiting.level")}
                </Text>
                <InlineSelectDropDown
                  options={waitingLevelOptions}
                  value={waitingLevelId}
                  onChange={setWaitingLevelId}
                  testID="promotions-admin-waiting-level"
                />
              </View>

              {waiting.map((row) => (
                <View
                  key={row.id}
                  style={styles.card}
                  testID={`waiting-enrollment-${row.id}`}
                >
                  <Text style={styles.cardTitle}>
                    {row.student.lastName} {row.student.firstName}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {row.academicLevel?.label ?? ""}
                    {row.track ? ` - ${row.track.label}` : ""}
                  </Text>
                  <InlineSelectDropDown
                    options={targetYearClassrooms.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    value={assignDrafts[row.id] ?? ""}
                    onChange={(value) =>
                      setAssignDrafts((current) => ({
                        ...current,
                        [row.id]: value,
                      }))
                    }
                    testID={`waiting-enrollment-${row.id}-class`}
                  />
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (assigningId === row.id || !assignDrafts[row.id]) &&
                        styles.submitButtonDisabled,
                    ]}
                    disabled={assigningId === row.id || !assignDrafts[row.id]}
                    onPress={() => assignToClass(row.id)}
                    testID={`waiting-enrollment-${row.id}-assign`}
                  >
                    <Text style={styles.submitButtonText}>
                      {t("promotionsAdmin.waiting.assign")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              {targetSchoolYearId && waiting.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t("promotionsAdmin.waiting.empty")}
                </Text>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  lockedWrap: { flex: 1, padding: 16, justifyContent: "center" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: colors.textSecondary },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
  },
  submitButton: {
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 13, fontWeight: "700", color: colors.white },
  alertBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
  },
  alertText: { fontSize: 12, color: colors.textSecondary },
  activeLabel: { fontSize: 12, fontWeight: "700", color: colors.primary },
  textInput: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
