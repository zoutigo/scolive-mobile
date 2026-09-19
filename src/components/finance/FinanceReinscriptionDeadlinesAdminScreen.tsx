import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
import { financeApi } from "../../api/finance.api";
import { teachersApi } from "../../api/teachers.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { DatePickerField } from "../DatePickerField";
import { ConfirmDialog } from "../ConfirmDialog";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import type { TeacherSchoolYearOption } from "../../types/teachers.types";
import type { CurriculumAcademicLevel } from "../../types/curriculums.types";
import type { ReinscriptionDeadlineRow } from "../../types/finance-admin.types";

type TabKey = "deadlines" | "form";

function roleAllowsFinance(role: string | null | undefined) {
  return (
    role === "SCHOOL_ADMIN" ||
    role === "SCHOOL_MANAGER" ||
    role === "SCHOOL_ACCOUNTANT" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

const deadlineFormSchema = z.object({
  schoolYearId: z.string().min(1, "Année scolaire requise"),
  academicLevelId: z.string().min(1, "Niveau requis"),
  deadline: z.string().min(1, "Date limite requise"),
});
type DeadlineFormValues = z.input<typeof deadlineFormSchema>;

function formatDeadline(dateIso: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function FinanceReinscriptionDeadlinesAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("deadlines");
  const [deadlines, setDeadlines] = useState<ReinscriptionDeadlineRow[]>([]);
  const [schoolYears, setSchoolYears] = useState<TeacherSchoolYearOption[]>([]);
  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<ReinscriptionDeadlineRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const effectiveRole = user?.activeRole ?? null;
  const canAccessModule = roleAllowsFinance(effectiveRole);

  const form = useForm<DeadlineFormValues>({
    resolver: zodResolver(deadlineFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { schoolYearId: "", academicLevelId: "", deadline: "" },
  });

  const loadModuleData = useCallback(async () => {
    if (!schoolSlug) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [deadlineRows, yearRows, levelRows] = await Promise.all([
        financeApi.listReinscriptionDeadlines(schoolSlug),
        teachersApi.listSchoolYears(schoolSlug),
        curriculumsApi.listAcademicLevels(schoolSlug),
      ]);
      setDeadlines(deadlineRows);
      setSchoolYears(yearRows);
      setLevels(levelRows);
      if (!form.getValues("schoolYearId")) {
        const active = yearRows.find((year) => year.isActive);
        if (active) form.setValue("schoolYearId", active.id);
      }
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
      schoolYearId: form.getValues("schoolYearId"),
      academicLevelId: "",
      deadline: "",
    });
    setTab("form");
  }

  function exitForm() {
    setTab("deadlines");
  }

  async function onSubmit(values: DeadlineFormValues) {
    if (!schoolSlug) return;
    setSubmitting(true);
    try {
      await financeApi.createReinscriptionDeadline(schoolSlug, {
        schoolYearId: values.schoolYearId,
        academicLevelId: values.academicLevelId,
        deadline: values.deadline,
      });
      await loadModuleData();
      showSuccess({
        title: t("financeAdmin.reinscriptionDeadlines.success.saved"),
        message: "",
      });
      setTimeout(() => {
        exitForm();
      }, 2000);
    } catch (error) {
      showError({
        title: t("financeAdmin.reinscriptionDeadlines.errors.save"),
        message: extractApiError(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!schoolSlug || !deleteTarget) return;
    setDeleting(true);
    try {
      await financeApi.deleteReinscriptionDeadline(schoolSlug, deleteTarget.id);
      setDeleteTarget(null);
      await loadModuleData();
      showSuccess({
        title: t("financeAdmin.reinscriptionDeadlines.success.deleted"),
        message: "",
      });
    } catch (error) {
      showError({
        title: t("financeAdmin.reinscriptionDeadlines.errors.delete"),
        message: extractApiError(error),
      });
    } finally {
      setDeleting(false);
    }
  }

  const yearOptions = useMemo(
    () => schoolYears.map((year) => ({ value: year.id, label: year.label })),
    [schoolYears],
  );
  const levelOptions = useMemo(
    () => levels.map((level) => ({ value: level.id, label: level.label })),
    [levels],
  );

  const sortedDeadlines = useMemo(
    () =>
      [...deadlines].sort((a, b) =>
        `${a.schoolYear.label}${a.academicLevel.code}`.localeCompare(
          `${b.schoolYear.label}${b.academicLevel.code}`,
        ),
      ),
    [deadlines],
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
          title={t("financeAdmin.reinscriptionDeadlines.title")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="reinscription-deadlines-header"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="calendar-outline"
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
        title={t("financeAdmin.reinscriptionDeadlines.title")}
        onBack={() => (tab === "form" ? exitForm() : moduleBack(router))}
        topInset={insets.top}
        testID="reinscription-deadlines-header"
        backTestID="reinscription-deadlines-back-btn"
      />

      {tab === "deadlines" ? (
        <View style={styles.content}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          {isLoading ? (
            <LoadingBlock label={t("common.loading")} />
          ) : sortedDeadlines.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title={t("financeAdmin.reinscriptionDeadlines.empty")}
              message=""
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              testID="reinscription-deadlines-list"
            >
              {sortedDeadlines.map((deadline) => (
                <View
                  key={deadline.id}
                  style={styles.entityRow}
                  testID={`reinscription-deadline-${deadline.id}`}
                >
                  <View style={styles.entityMain}>
                    <Text style={styles.entityTitle}>
                      {deadline.academicLevel.label}
                    </Text>
                    <Text style={styles.entityMeta}>
                      {deadline.schoolYear.label} —{" "}
                      {formatDeadline(deadline.deadline)}
                    </Text>
                  </View>
                  <View style={styles.iconActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setDeleteTarget(deadline)}
                      disabled={deleting}
                      testID={`reinscription-deadline-delete-${deadline.id}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.notification}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {tab === "form" ? (
        <View
          style={styles.formTabContent}
          testID="reinscription-deadline-form-tab"
        >
          <View style={styles.heroWrapper}>
            <FormHero
              icon="calendar-outline"
              title={t("financeAdmin.reinscriptionDeadlines.form.title")}
              subtitle={t("financeAdmin.reinscriptionDeadlines.form.subtitle")}
              palette="primary"
              testID="reinscription-deadline-form-hero"
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
                  {t("financeAdmin.reinscriptionDeadlines.form.schoolYear")}
                </Text>
                <Controller
                  control={form.control}
                  name="schoolYearId"
                  render={({ field: { onChange, value } }) => (
                    <InlineSelectDropDown
                      options={yearOptions}
                      value={value}
                      onChange={onChange}
                      hasError={!!form.formState.errors.schoolYearId}
                      testID="reinscription-deadline-form-year"
                    />
                  )}
                />
                {form.formState.errors.schoolYearId ? (
                  <Text style={styles.formError}>
                    {form.formState.errors.schoolYearId.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("financeAdmin.reinscriptionDeadlines.form.academicLevel")}
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
                      testID="reinscription-deadline-form-level"
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
                  {t("financeAdmin.reinscriptionDeadlines.form.deadline")}
                </Text>
                <Controller
                  control={form.control}
                  name="deadline"
                  render={({ field: { onChange, value } }) => (
                    <DatePickerField
                      value={value ?? ""}
                      onChange={onChange}
                      placeholder={t(
                        "financeAdmin.reinscriptionDeadlines.form.deadlinePlaceholder",
                      )}
                      hasError={!!form.formState.errors.deadline}
                      testID="reinscription-deadline-form-deadline"
                    />
                  )}
                />
                {form.formState.errors.deadline ? (
                  <Text style={styles.formError}>
                    {form.formState.errors.deadline.message}
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.formActionsBar}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={exitForm}
                testID="reinscription-deadline-form-cancel"
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
                testID="reinscription-deadline-form-submit"
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
          testID="reinscription-deadlines-fab"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={deleteTarget != null}
        title={t("financeAdmin.reinscriptionDeadlines.deleteConfirm.title")}
        message={
          deleteTarget
            ? `${deleteTarget.academicLevel.label} (${deleteTarget.schoolYear.label})`
            : ""
        }
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entityMain: { flex: 1, gap: 4 },
  entityTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  entityMeta: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  iconActions: { flexDirection: "row", gap: 6 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
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
