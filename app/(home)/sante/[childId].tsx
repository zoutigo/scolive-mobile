/**
 * Écran Santé — Vue parent.
 * 4 onglets : Informations importantes / Soins à l'école / Événements hors école / Historique.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors } from "../../../src/theme";
import { useTranslation } from "../../../src/i18n/useTranslation";
import { useAuthStore } from "../../../src/store/auth.store";
import { useFamilyStore } from "../../../src/store/family.store";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { buildChildHomeTarget } from "../../../src/components/navigation/nav-config";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { healthApi } from "../../../src/api/health.api";
import {
  ALERT_LEVEL_COLORS,
  HEALTH_ALERT_LEVELS,
  HEALTH_CONDITION_TYPES,
  HEALTH_REPORT_TYPES,
  alertLevelLabel,
  conditionTypeLabel,
  createConditionFormSchema,
  createReportFormSchema,
  reportTypeLabel,
  type HealthAlertLevel,
  type HealthConditionType,
  type HealthReportType,
  type StudentHealthCareEvent,
  type StudentHealthCondition,
  type StudentHealthReport,
} from "../../../src/types/health.types";
import {
  HEALTH_PARENT_TOUR_ID,
  HEALTH_PARENT_TOUR_TARGETS,
  HEALTH_PARENT_TOUR_STEPS,
} from "../../../src/components/health/health-parent-tour.config";
import { useOnboardingTourTrigger } from "../../../src/hooks/useOnboardingTourTrigger";
import { OnboardingTarget } from "../../../src/components/onboarding/OnboardingTarget";

type TabKey = "conditions" | "care" | "reports" | "history";

export default function SanteScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <SanteScreenContent />
    </AppShell>
  );
}

function SanteScreenContent() {
  const { t } = useTranslation();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { schoolSlug, user } = useAuthStore();
  const { children } = useFamilyStore();

  const [tab, setTab] = useState<TabKey>("conditions");
  const [conditions, setConditions] = useState<StudentHealthCondition[]>([]);
  const [careEvents, setCareEvents] = useState<StudentHealthCareEvent[]>([]);
  const [reports, setReports] = useState<StudentHealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const child = children.find((c) => c.id === childId) ?? null;

  useOnboardingTourTrigger({
    tourId: HEALTH_PARENT_TOUR_ID,
    role: "parent",
    steps: HEALTH_PARENT_TOUR_STEPS,
  });

  const load = useCallback(async () => {
    if (!schoolSlug || !childId) return;
    setLoading(true);
    setError(null);
    try {
      const [conditionsRes, careRes, reportsRes] = await Promise.all([
        healthApi.listConditions(schoolSlug, childId),
        healthApi.listCareEvents(schoolSlug, childId),
        healthApi.listReports(schoolSlug, childId),
      ]);
      setConditions(conditionsRes);
      setCareEvents(careRes);
      setReports(reportsRes);
    } catch {
      setError(t("health.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [schoolSlug, childId]);

  useEffect(() => {
    void load();
  }, [load]);

  const conditionSchema = useMemo(() => createConditionFormSchema(t), [t]);
  const reportSchema = useMemo(() => createReportFormSchema(t), [t]);

  const conditionForm = useForm<{
    type: HealthConditionType;
    alertLevel: HealthAlertLevel;
    label: string;
    description: string;
  }>({
    resolver: zodResolver(conditionSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      type: "ALLERGY",
      alertLevel: "INFO",
      label: "",
      description: "",
    },
  });
  const reportForm = useForm<{
    type: HealthReportType;
    alertLevel: HealthAlertLevel;
    description: string;
    sportRestriction: boolean;
  }>({
    resolver: zodResolver(reportSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      type: "MALADIE",
      alertLevel: "INFO",
      description: "",
      sportRestriction: false,
    },
  });

  async function submitCondition(values: {
    type: HealthConditionType;
    alertLevel: HealthAlertLevel;
    label: string;
    description: string;
  }) {
    if (!schoolSlug || !childId) return;
    setSaving(true);
    setFormError(null);
    try {
      await healthApi.createCondition(schoolSlug, childId, {
        type: values.type,
        alertLevel: values.alertLevel,
        label: values.label,
        description: values.description || undefined,
      });
      conditionForm.reset({
        type: "ALLERGY",
        alertLevel: "INFO",
        label: "",
        description: "",
      });
      await load();
    } catch {
      setFormError(t("health.errors.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function submitReport(values: {
    type: HealthReportType;
    alertLevel: HealthAlertLevel;
    description: string;
    sportRestriction: boolean;
  }) {
    if (!schoolSlug || !childId) return;
    setSaving(true);
    setFormError(null);
    try {
      await healthApi.createReport(schoolSlug, childId, {
        type: values.type,
        alertLevel: values.alertLevel,
        description: values.description,
        sportRestriction: values.sportRestriction,
      });
      reportForm.reset({
        type: "MALADIE",
        alertLevel: "INFO",
        description: "",
        sportRestriction: false,
      });
      await load();
    } catch {
      setFormError(t("health.errors.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "conditions", label: t("health.tabs.conditions") },
    { key: "care", label: t("health.tabs.care") },
    { key: "reports", label: t("health.tabs.reports") },
    { key: "history", label: t("health.tabs.history") },
  ];

  const historyItems = useMemo(() => {
    const items = [
      ...conditions.map((row) => ({
        key: `condition-${row.id}`,
        title: row.label,
        alertLevel: row.alertLevel,
        at: row.createdAt,
      })),
      ...careEvents.map((row) => ({
        key: `care-${row.id}`,
        title: row.summary,
        alertLevel: row.alertLevel,
        at: row.occurredAt,
      })),
      ...reports.map((row) => ({
        key: `report-${row.id}`,
        title: reportTypeLabel(t, row.type),
        alertLevel: row.alertLevel,
        at: row.createdAt,
      })),
    ];
    return items.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [conditions, careEvents, reports, t]);

  return (
    <View style={styles.root} testID="sante-screen">
      <ModuleHeader
        title={t("health.title")}
        subtitle={child ? `${child.firstName} ${child.lastName}` : undefined}
        onBack={() => router.push(buildChildHomeTarget(childId ?? "") as never)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingTarget id={HEALTH_PARENT_TOUR_TARGETS.tabs}>
          <View style={styles.tabRow}>
            {tabs.map((entry) => (
              <TouchableOpacity
                key={entry.key}
                onPress={() => setTab(entry.key)}
                style={[
                  styles.tabChip,
                  tab === entry.key && styles.tabChipActive,
                ]}
                testID={`sante-tab-${entry.key}`}
              >
                <Text
                  style={[
                    styles.tabChipLabel,
                    tab === entry.key && styles.tabChipLabelActive,
                  ]}
                >
                  {entry.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </OnboardingTarget>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}

            {tab === "conditions" ? (
              <View>
                {conditions.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t("health.conditions.empty")}
                  </Text>
                ) : (
                  conditions.map((row) => (
                    <View key={row.id} style={styles.card}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{row.label}</Text>
                        <AlertBadge level={row.alertLevel} t={t} />
                      </View>
                      <Text style={styles.cardMeta}>
                        {conditionTypeLabel(t, row.type)}
                      </Text>
                      {row.description ? (
                        <Text style={styles.cardBody}>{row.description}</Text>
                      ) : null}
                    </View>
                  ))
                )}

                <OnboardingTarget id={HEALTH_PARENT_TOUR_TARGETS.conditionForm}>
                  <View style={styles.form} testID="condition-form">
                    <ChipRow
                      label={t("health.form.conditionType")}
                      options={HEALTH_CONDITION_TYPES.map((type) => ({
                        value: type,
                        label: conditionTypeLabel(t, type),
                      }))}
                      value={conditionForm.watch("type")}
                      onChange={(value) =>
                        conditionForm.setValue(
                          "type",
                          value as HealthConditionType,
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                    <AlertLevelChipRow
                      t={t}
                      value={conditionForm.watch("alertLevel")}
                      onChange={(value) =>
                        conditionForm.setValue("alertLevel", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <Controller
                      control={conditionForm.control}
                      name="label"
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
                            placeholder={t("health.form.labelPlaceholder")}
                            placeholderTextColor={colors.textSecondary}
                            testID="condition-label-input"
                          />
                          {fieldState.error ? (
                            <Text style={styles.errorText}>
                              {fieldState.error.message}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    />
                    <Controller
                      control={conditionForm.control}
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
                            testID="condition-description-input"
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
                      onPress={conditionForm.handleSubmit(submitCondition)}
                      testID="condition-submit"
                    >
                      <Text style={styles.submitButtonLabel}>
                        {t("health.form.submitCondition")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </OnboardingTarget>
              </View>
            ) : null}

            {tab === "care" ? (
              <View>
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
                        {row.authorUser
                          ? ` · ${row.authorUser.firstName} ${row.authorUser.lastName}`
                          : ""}
                      </Text>
                      {row.description ? (
                        <Text style={styles.cardBody}>{row.description}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            ) : null}

            {tab === "reports" ? (
              <View>
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
                      <Text style={styles.cardMeta}>
                        {row.acknowledgedAt
                          ? t("health.reports.acknowledged")
                          : t("health.reports.pending")}
                      </Text>
                    </View>
                  ))
                )}

                <OnboardingTarget id={HEALTH_PARENT_TOUR_TARGETS.reportForm}>
                  <View style={styles.form} testID="report-form">
                    <ChipRow
                      label={t("health.form.reportType")}
                      options={HEALTH_REPORT_TYPES.map((type) => ({
                        value: type,
                        label: reportTypeLabel(t, type),
                      }))}
                      value={reportForm.watch("type")}
                      onChange={(value) =>
                        reportForm.setValue("type", value as HealthReportType, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <AlertLevelChipRow
                      t={t}
                      value={reportForm.watch("alertLevel")}
                      onChange={(value) =>
                        reportForm.setValue("alertLevel", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <Controller
                      control={reportForm.control}
                      name="description"
                      render={({ field, fieldState }) => (
                        <View style={styles.field}>
                          <Text style={styles.label}>
                            {t("health.form.description")}
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              styles.textarea,
                              fieldState.error && styles.inputError,
                            ]}
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            multiline
                            placeholder={t(
                              "health.form.descriptionPlaceholder",
                            )}
                            placeholderTextColor={colors.textSecondary}
                            testID="report-description-input"
                          />
                          {fieldState.error ? (
                            <Text style={styles.errorText}>
                              {fieldState.error.message}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    />
                    <Controller
                      control={reportForm.control}
                      name="sportRestriction"
                      render={({ field }) => (
                        <View style={styles.switchRow}>
                          <Text style={styles.label}>
                            {t("health.form.sportRestriction")}
                          </Text>
                          <Switch
                            value={field.value}
                            onValueChange={field.onChange}
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
                      onPress={reportForm.handleSubmit(submitReport)}
                      testID="report-submit"
                    >
                      <Text style={styles.submitButtonLabel}>
                        {t("health.form.submitReport")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </OnboardingTarget>
              </View>
            ) : null}

            {tab === "history" ? (
              <View>
                {historyItems.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t("health.history.empty")}
                  </Text>
                ) : (
                  historyItems.map((item) => (
                    <View key={item.key} style={styles.card}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <AlertBadge level={item.alertLevel} t={t} />
                      </View>
                      <Text style={styles.cardMeta}>
                        {new Date(item.at).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      {user ? null : null}
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

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipRow}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onChange(option.value)}
                testID={`chip-${option.value}`}
              >
                <Text
                  style={[styles.chipLabel, active && styles.chipLabelActive]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function AlertLevelChipRow({
  t,
  value,
  onChange,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  value: HealthAlertLevel;
  onChange: (value: HealthAlertLevel) => void;
}) {
  return (
    <ChipRow
      label={t("health.form.alertLevel")}
      options={HEALTH_ALERT_LEVELS.map((level) => ({
        value: level,
        label: alertLevelLabel(t, level),
      }))}
      value={value}
      onChange={(v) => onChange(v as HealthAlertLevel)}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48 },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabChipLabelActive: { color: colors.white },
  loader: { marginTop: 24 },
  errorText: { color: colors.notification, fontSize: 13, marginBottom: 8 },
  emptyText: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
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
  form: { marginTop: 12, gap: 12 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonLabel: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
