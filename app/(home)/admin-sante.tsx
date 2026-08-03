/**
 * Écran Santé — Vue école (responsable santé / admin / manager).
 * Recherche d'élève puis fiche santé : bandeau urgence, soins, signalements.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors } from "../../src/theme";
import { moduleBack } from "../../src/utils/moduleBack";
import { useTranslation } from "../../src/i18n/useTranslation";
import { useAuthStore } from "../../src/store/auth.store";
import { ModuleHeader } from "../../src/components/navigation/ModuleHeader";
import { AppShell } from "../../src/components/navigation/AppShell";
import { familyApi, type AdminStudentRow } from "../../src/api/family.api";
import { healthApi } from "../../src/api/health.api";
import {
  ALERT_LEVEL_COLORS,
  HEALTH_ALERT_LEVELS,
  alertLevelLabel,
  createCareEventFormSchema,
  reportTypeLabel,
  type HealthAlertLevel,
  type StudentHealthCareEvent,
  type StudentHealthReport,
  type StudentHealthUrgencySummary,
} from "../../src/types/health.types";
import {
  HEALTH_SCHOOL_TOUR_ID,
  HEALTH_SCHOOL_TOUR_TARGETS,
  HEALTH_SCHOOL_TOUR_STEPS,
} from "../../src/components/health/health-school-tour.config";
import { useOnboardingTourTrigger } from "../../src/hooks/useOnboardingTourTrigger";
import { OnboardingTarget } from "../../src/components/onboarding/OnboardingTarget";

export default function AdminSanteScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminSanteScreenContent />
    </AppShell>
  );
}

function AdminSanteScreenContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { schoolSlug } = useAuthStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminStudentRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  const [urgency, setUrgency] = useState<StudentHealthUrgencySummary | null>(
    null,
  );
  const [careEvents, setCareEvents] = useState<StudentHealthCareEvent[]>([]);
  const [reports, setReports] = useState<StudentHealthReport[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useOnboardingTourTrigger({
    tourId: HEALTH_SCHOOL_TOUR_ID,
    role: "school",
    steps: HEALTH_SCHOOL_TOUR_STEPS,
  });

  const search = useCallback(
    async (value: string) => {
      if (!schoolSlug) return;
      setSearching(true);
      try {
        const page = await familyApi.listAdminStudents(schoolSlug, {
          search: value,
          limit: 20,
        });
        setResults(page.students);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    void search("");
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const loadDetail = useCallback(
    async (studentId: string) => {
      if (!schoolSlug) return;
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const [urgencyRes, careRes, reportsRes] = await Promise.all([
          healthApi.getUrgencySummary(schoolSlug, studentId),
          healthApi.listCareEvents(schoolSlug, studentId),
          healthApi.listReports(schoolSlug, studentId),
        ]);
        setUrgency(urgencyRes);
        setCareEvents(careRes);
        setReports(reportsRes);
      } catch {
        setDetailError(t("health.errors.load"));
      } finally {
        setLoadingDetail(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (!selectedStudentId) return;
    void loadDetail(selectedStudentId);
  }, [selectedStudentId, loadDetail]);

  const careEventSchema = useMemo(() => createCareEventFormSchema(t), [t]);
  const careEventForm = useForm<{
    summary: string;
    alertLevel: HealthAlertLevel;
    description: string;
  }>({
    resolver: zodResolver(careEventSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { summary: "", alertLevel: "INFO", description: "" },
  });

  async function submitCareEvent(values: {
    summary: string;
    alertLevel: HealthAlertLevel;
    description: string;
  }) {
    if (!schoolSlug || !selectedStudentId) return;
    setSaving(true);
    setFormError(null);
    try {
      await healthApi.createCareEvent(schoolSlug, selectedStudentId, {
        summary: values.summary,
        alertLevel: values.alertLevel,
        description: values.description || undefined,
      });
      careEventForm.reset({ summary: "", alertLevel: "INFO", description: "" });
      await loadDetail(selectedStudentId);
    } catch {
      setFormError(t("health.errors.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function acknowledgeReport(reportId: string) {
    if (!schoolSlug || !selectedStudentId) return;
    try {
      await healthApi.acknowledgeReport(
        schoolSlug,
        selectedStudentId,
        reportId,
      );
      await loadDetail(selectedStudentId);
    } catch {
      // Silent: the user can retry from the list.
    }
  }

  return (
    <View style={styles.root} testID="admin-sante-screen">
      <ModuleHeader
        title={t("health.title")}
        onBack={() => moduleBack(router)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingTarget id={HEALTH_SCHOOL_TOUR_TARGETS.search}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={t("health.school.searchPlaceholder")}
            placeholderTextColor={colors.textSecondary}
            testID="admin-sante-search-input"
          />
        </OnboardingTarget>

        <View style={styles.resultsList}>
          {searching ? (
            <ActivityIndicator color={colors.primary} />
          ) : results.length === 0 ? (
            <Text style={styles.emptyText}>{t("health.school.noStudent")}</Text>
          ) : (
            results.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.studentRow,
                  selectedStudentId === student.id && styles.studentRowActive,
                ]}
                onPress={() => setSelectedStudentId(student.id)}
                testID={`admin-sante-student-${student.id}`}
              >
                <Text style={styles.studentName}>
                  {student.lastName} {student.firstName}
                </Text>
                <Text style={styles.cardMeta}>
                  {student.currentEnrollment?.class.name ?? "-"}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {selectedStudentId ? (
          loadingDetail ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : detailError ? (
            <Text style={styles.errorText}>{detailError}</Text>
          ) : (
            <OnboardingTarget id={HEALTH_SCHOOL_TOUR_TARGETS.urgencyBanner}>
              <View>
                {urgency && urgency.conditions.length > 0 ? (
                  <View style={styles.urgencyBanner}>
                    <Text style={styles.urgencyTitle}>
                      {t("health.school.urgencyTitle")}
                    </Text>
                    {urgency.conditions.map((row) => (
                      <View key={row.id} style={styles.cardHeaderRow}>
                        <Text style={styles.urgencyLabel}>{row.label}</Text>
                        <AlertBadge level={row.alertLevel} t={t} />
                      </View>
                    ))}
                    {urgency.emergencyContacts.length > 0 ? (
                      <Text style={styles.urgencyContacts}>
                        {t("health.school.contacts")}:{" "}
                        {urgency.emergencyContacts
                          .map((c) => `${c.fullName} (${c.phone ?? "-"})`)
                          .join(", ")}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {formError ? (
                  <Text style={styles.errorText}>{formError}</Text>
                ) : null}

                <Text style={styles.sectionTitle}>{t("health.tabs.care")}</Text>
                {careEvents.length === 0 ? (
                  <Text style={styles.emptyText}>{t("health.care.empty")}</Text>
                ) : (
                  careEvents.map((row) => (
                    <View key={row.id} style={styles.card}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{row.summary}</Text>
                        <AlertBadge level={row.alertLevel} t={t} />
                      </View>
                      <Text style={styles.cardMeta}>
                        {new Date(row.occurredAt).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}

                <OnboardingTarget id={HEALTH_SCHOOL_TOUR_TARGETS.careEventForm}>
                  <View style={styles.form} testID="admin-care-event-form">
                    <Controller
                      control={careEventForm.control}
                      name="summary"
                      render={({ field, fieldState }) => (
                        <View style={styles.field}>
                          <Text style={styles.label}>
                            {t("health.form.label")}
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              fieldState.error && styles.inputError,
                            ]}
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            placeholder={t(
                              "health.form.careSummaryPlaceholder",
                            )}
                            placeholderTextColor={colors.textSecondary}
                            testID="admin-care-summary-input"
                          />
                          {fieldState.error ? (
                            <Text style={styles.errorText}>
                              {fieldState.error.message}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    />
                    <View style={styles.field}>
                      <Text style={styles.label}>
                        {t("health.form.alertLevel")}
                      </Text>
                      <View style={styles.chipRow}>
                        {HEALTH_ALERT_LEVELS.map((level) => {
                          const active =
                            careEventForm.watch("alertLevel") === level;
                          return (
                            <TouchableOpacity
                              key={level}
                              style={[styles.chip, active && styles.chipActive]}
                              onPress={() =>
                                careEventForm.setValue("alertLevel", level, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              testID={`admin-care-alert-${level}`}
                            >
                              <Text
                                style={[
                                  styles.chipLabel,
                                  active && styles.chipLabelActive,
                                ]}
                              >
                                {alertLevelLabel(t, level)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    <Controller
                      control={careEventForm.control}
                      name="description"
                      render={({ field }) => (
                        <View style={styles.field}>
                          <Text style={styles.label}>
                            {t("health.form.description")}
                          </Text>
                          <TextInput
                            style={[styles.input, styles.textarea]}
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            multiline
                            testID="admin-care-description-input"
                          />
                        </View>
                      )}
                    />
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        saving && styles.submitButtonDisabled,
                      ]}
                      disabled={saving}
                      onPress={careEventForm.handleSubmit(submitCareEvent)}
                      testID="admin-care-submit"
                    >
                      <Text style={styles.submitButtonLabel}>
                        {t("health.form.submitCareEvent")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </OnboardingTarget>

                <Text style={styles.sectionTitle}>
                  {t("health.tabs.reports")}
                </Text>
                {reports.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t("health.reports.empty")}
                  </Text>
                ) : (
                  reports.map((row) => (
                    <View key={row.id} style={styles.card}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>
                          {reportTypeLabel(t, row.type)}
                        </Text>
                        <AlertBadge level={row.alertLevel} t={t} />
                      </View>
                      <Text style={styles.cardBody}>{row.description}</Text>
                      {row.acknowledgedAt ? (
                        <Text style={styles.cardMeta}>
                          {t("health.reports.acknowledged")}
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => void acknowledgeReport(row.id)}
                          testID={`admin-acknowledge-${row.id}`}
                        >
                          <Text style={styles.acknowledgeLink}>
                            {t("health.reports.acknowledgeAction")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            </OnboardingTarget>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

function AlertBadge({
  level,
  t,
}: {
  level: HealthAlertLevel;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const palette = ALERT_LEVEL_COLORS[level];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeLabel, { color: palette.text }]}>
        {alertLevelLabel(t, level)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.notification },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  resultsList: { marginTop: 12, gap: 8 },
  studentRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  studentRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.warmHighlight,
  },
  studentName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  loader: { marginTop: 24 },
  errorText: { color: colors.notification, fontSize: 13, marginBottom: 8 },
  emptyText: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  urgencyBanner: {
    borderWidth: 1,
    borderColor: "#F1AEAE",
    backgroundColor: "#FFF0F0",
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  urgencyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8A2E2E",
    marginBottom: 6,
  },
  urgencyLabel: { fontSize: 13, color: "#8A2E2E" },
  urgencyContacts: { fontSize: 11, color: "#8A2E2E", marginTop: 6 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  cardMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  cardBody: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeLabel: { fontSize: 11, fontWeight: "700" },
  form: { marginTop: 4, marginBottom: 16, gap: 12 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  chipLabelActive: { color: colors.white },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonLabel: { color: colors.white, fontWeight: "700", fontSize: 14 },
  acknowledgeLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
});
