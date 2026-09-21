import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
import { studentAdmissionsApi } from "../../api/student-admissions.api";
import { classroomsApi } from "../../api/classrooms.api";
import { teachersApi } from "../../api/teachers.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { DatePickerField } from "../DatePickerField";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import type { TeacherSchoolYearOption } from "../../types/teachers.types";
import type {
  CurriculumAcademicLevel,
  CurriculumTrack,
} from "../../types/curriculums.types";
import type { UnassignedPoolEntry } from "../../types/student-admissions.types";

type TabKey = "pool" | "form";

function roleAllowsAdmissions(role: string | null | undefined) {
  return (
    role === "SCHOOL_ADMIN" ||
    role === "SCHOOL_MANAGER" ||
    role === "SUPERVISOR" ||
    role === "SUPER_ADMIN"
  );
}

const admissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  dateOfBirth: z.string().optional(),
  academicLevelId: z.string().min(1, "Niveau requis"),
  trackId: z.string().optional(),
  schoolYearId: z.string().optional(),
});
type AdmissionFormValues = z.input<typeof admissionFormSchema>;

export function StudentAdmissionsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("pool");
  const [pool, setPool] = useState<UnassignedPoolEntry[]>([]);
  const [classrooms, setClassrooms] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [schoolYears, setSchoolYears] = useState<TeacherSchoolYearOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assigningStudentId, setAssigningStudentId] = useState<string | null>(
    null,
  );
  const [assignClassId, setAssignClassId] = useState("");
  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(
    null,
  );

  const effectiveRole = user?.activeRole ?? null;
  const canAccessModule = roleAllowsAdmissions(effectiveRole);

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      academicLevelId: "",
      trackId: "",
      schoolYearId: "",
    },
  });

  const loadModuleData = useCallback(async () => {
    if (!schoolSlug) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [poolRows, classroomRows, levelRows, trackRows, yearRows] =
        await Promise.all([
          studentAdmissionsApi.listUnassignedPool(schoolSlug),
          teachersApi.listClassrooms(schoolSlug),
          curriculumsApi.listAcademicLevels(schoolSlug),
          curriculumsApi.listTracks(schoolSlug),
          teachersApi.listSchoolYears(schoolSlug),
        ]);
      setPool(poolRows);
      setClassrooms(classroomRows.map((c) => ({ id: c.id, name: c.name })));
      setLevels(levelRows);
      setTracks(trackRows);
      setSchoolYears(yearRows);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    void loadModuleData();
  }, [loadModuleData]);

  function openCreate() {
    form.reset({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      academicLevelId: "",
      trackId: "",
      schoolYearId: "",
    });
    setTab("form");
  }

  function exitForm() {
    setTab("pool");
  }

  async function onSubmit(values: AdmissionFormValues) {
    if (!schoolSlug) return;
    setSubmitting(true);
    try {
      await studentAdmissionsApi.createAdmission(schoolSlug, {
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: values.dateOfBirth || undefined,
        academicLevelId: values.academicLevelId,
        trackId: values.trackId || undefined,
        schoolYearId: values.schoolYearId || undefined,
      });
      showSuccess({ title: t("admissionsAdmin.form.success"), message: "" });
      setTimeout(() => {
        exitForm();
      }, 2000);
    } catch (error) {
      showError({
        title: t("admissionsAdmin.form.error"),
        message: extractApiError(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  function startAssign(studentId: string) {
    setAssigningStudentId(studentId);
    setAssignClassId("");
  }

  function cancelAssign() {
    setAssigningStudentId(null);
    setAssignClassId("");
  }

  async function confirmAssign(studentId: string) {
    if (!schoolSlug || !assignClassId) return;
    setSavingAssignmentId(studentId);
    try {
      await classroomsApi.createEnrollment(schoolSlug, studentId, {
        classId: assignClassId,
        status: "ACTIVE",
      });
      setAssigningStudentId(null);
      setAssignClassId("");
      await loadModuleData();
      showSuccess({
        title: t("admissionsAdmin.pool.assignSuccess"),
        message: "",
      });
    } catch (error) {
      showError({
        title: t("admissionsAdmin.pool.assignError"),
        message: extractApiError(error),
      });
    } finally {
      setSavingAssignmentId(null);
    }
  }

  const levelOptions = useMemo(
    () => levels.map((l) => ({ value: l.id, label: l.label })),
    [levels],
  );
  const trackOptions = useMemo(
    () => [
      { value: "", label: t("admissionsAdmin.form.trackNone") },
      ...tracks.map((tr) => ({ value: tr.id, label: tr.label })),
    ],
    [tracks, t],
  );
  const yearOptions = useMemo(
    () => schoolYears.map((y) => ({ value: y.id, label: y.label })),
    [schoolYears],
  );
  const classroomOptions = useMemo(
    () => classrooms.map((c) => ({ value: c.id, label: c.name })),
    [classrooms],
  );

  if (!user) {
    return (
      <View style={styles.screen}>
        <LoadingBlock label={t("common.loading")} />
      </View>
    );
  }

  if (!canAccessModule) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title={t("admissionsAdmin.title")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="admissions-header"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="person-add-outline"
            title={t("financeAdmin.lockedTitle")}
            message={t("admissionsAdmin.lockedMessage")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title={t("admissionsAdmin.title")}
        onBack={() => (tab === "form" ? exitForm() : moduleBack(router))}
        topInset={insets.top}
        testID="admissions-header"
        backTestID="admissions-back-btn"
      />

      {tab === "pool" ? (
        <View style={styles.content}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          {isLoading ? (
            <LoadingBlock label={t("common.loading")} />
          ) : pool.length === 0 ? (
            <EmptyState
              icon="person-add-outline"
              title={t("admissionsAdmin.pool.empty")}
              message=""
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              testID="admissions-pool-list"
            >
              {pool.map((entry) => (
                <View
                  key={entry.id}
                  style={styles.entityRow}
                  testID={`admission-pool-${entry.studentId}`}
                >
                  <View style={styles.entityMain}>
                    <Text style={styles.entityTitle}>
                      {entry.student.lastName} {entry.student.firstName}
                    </Text>
                    <Text style={styles.entityMeta}>
                      {entry.academicLevel?.label ?? "-"}
                      {entry.track ? ` - ${entry.track.label}` : ""}
                    </Text>

                    {assigningStudentId === entry.studentId ? (
                      <View style={styles.assignBlock}>
                        <InlineSelectDropDown
                          options={classroomOptions}
                          value={assignClassId}
                          onChange={setAssignClassId}
                          placeholder={t("admissionsAdmin.pool.assignTitle")}
                          testID={`admission-pool-${entry.studentId}-class-select`}
                        />
                        <View style={styles.assignActions}>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={cancelAssign}
                            testID={`admission-pool-${entry.studentId}-cancel`}
                          >
                            <Text style={styles.cancelButtonText}>
                              {t("admissionsAdmin.pool.assignCancel")}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.submitButton,
                              (!assignClassId ||
                                savingAssignmentId === entry.studentId) &&
                                styles.submitButtonDisabled,
                            ]}
                            disabled={
                              !assignClassId ||
                              savingAssignmentId === entry.studentId
                            }
                            onPress={() => confirmAssign(entry.studentId)}
                            testID={`admission-pool-${entry.studentId}-confirm`}
                          >
                            <Text style={styles.submitButtonText}>
                              {t("admissionsAdmin.pool.assignConfirm")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.assignButton}
                        onPress={() => startAssign(entry.studentId)}
                        testID={`admission-pool-${entry.studentId}-assign`}
                      >
                        <Text style={styles.assignButtonText}>
                          {t("admissionsAdmin.pool.assign")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {tab === "form" ? (
        <View style={styles.formTabContent} testID="admission-form-tab">
          <View style={styles.heroWrapper}>
            <FormHero
              icon="person-add-outline"
              title={t("admissionsAdmin.form.title")}
              subtitle={t("admissionsAdmin.form.subtitle")}
              palette="primary"
              testID="admission-form-hero"
            />
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.formKeyboardArea}
          >
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("admissionsAdmin.form.firstName")}
                </Text>
                <Controller
                  control={form.control}
                  name="firstName"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[
                        styles.formInput,
                        form.formState.errors.firstName &&
                          styles.formInputError,
                      ]}
                      value={value}
                      onChangeText={onChange}
                      testID="admission-form-first-name"
                    />
                  )}
                />
                {form.formState.errors.firstName ? (
                  <Text style={styles.formError}>
                    {form.formState.errors.firstName.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("admissionsAdmin.form.lastName")}
                </Text>
                <Controller
                  control={form.control}
                  name="lastName"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[
                        styles.formInput,
                        form.formState.errors.lastName && styles.formInputError,
                      ]}
                      value={value}
                      onChangeText={onChange}
                      testID="admission-form-last-name"
                    />
                  )}
                />
                {form.formState.errors.lastName ? (
                  <Text style={styles.formError}>
                    {form.formState.errors.lastName.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("admissionsAdmin.form.dateOfBirth")}
                </Text>
                <Controller
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field: { onChange, value } }) => (
                    <DatePickerField
                      value={value ?? ""}
                      onChange={onChange}
                      testID="admission-form-date-of-birth"
                    />
                  )}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("admissionsAdmin.form.academicLevel")}
                </Text>
                <Controller
                  control={form.control}
                  name="academicLevelId"
                  render={({ field: { onChange, value } }) => (
                    <InlineSelectDropDown
                      options={levelOptions}
                      value={value}
                      onChange={onChange}
                      hasError={!!form.formState.errors.academicLevelId}
                      testID="admission-form-level"
                    />
                  )}
                />
                {form.formState.errors.academicLevelId ? (
                  <Text style={styles.formError}>
                    {form.formState.errors.academicLevelId.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("admissionsAdmin.form.track")}
                </Text>
                <Controller
                  control={form.control}
                  name="trackId"
                  render={({ field: { onChange, value } }) => (
                    <InlineSelectDropDown
                      options={trackOptions}
                      value={value ?? ""}
                      onChange={onChange}
                      testID="admission-form-track"
                    />
                  )}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("admissionsAdmin.form.schoolYear")}
                </Text>
                <Controller
                  control={form.control}
                  name="schoolYearId"
                  render={({ field: { onChange, value } }) => (
                    <InlineSelectDropDown
                      options={yearOptions}
                      value={value ?? ""}
                      onChange={onChange}
                      testID="admission-form-year"
                    />
                  )}
                />
              </View>
            </ScrollView>

            <View style={styles.formActionsBar}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={exitForm}
                testID="admission-form-cancel"
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                disabled={submitting}
                onPress={form.handleSubmit(onSubmit)}
                testID="admission-form-submit"
              >
                <Text style={styles.submitButtonText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}

      {tab !== "form" ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openCreate}
          testID="admissions-fab"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  lockedWrap: { flex: 1, padding: 16, justifyContent: "center" },
  content: { flex: 1, gap: 12, paddingHorizontal: 16, paddingTop: 10 },
  listContent: { paddingBottom: 108, gap: 8 },
  entityRow: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entityMain: { gap: 8 },
  entityTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  entityMeta: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  assignButton: {
    alignSelf: "flex-start",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  assignButtonText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  assignBlock: { gap: 8 },
  assignActions: { flexDirection: "row", gap: 8 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24 + BOTTOM_TAB_BAR_HEIGHT,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  formTabContent: { flex: 1 },
  heroWrapper: { padding: 16 },
  formKeyboardArea: { flex: 1 },
  formScroll: { flex: 1 },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  formField: { gap: 8 },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
  },
  formInputError: { borderColor: colors.notification },
  formError: { color: colors.notification, fontSize: 12, lineHeight: 16 },
  cancelButton: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 14, fontWeight: "700", color: colors.white },
});
