/**
 * Fiche santé élève — vue responsable santé / admin / manager.
 * Hero (nom, classe, âge) + 2 onglets : Cares (historique fusionné soins +
 * signalements, du plus récent au plus ancien) / Conditions. FAB "+" pour
 * enregistrer un soin (formulaire inline, aussi utilisé en modification).
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors } from "../../../src/theme";
import { useTranslation } from "../../../src/i18n/useTranslation";
import type { TranslateFn } from "../../../src/i18n/useTranslation";
import { useAuthStore } from "../../../src/store/auth.store";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { UnderlineTabs } from "../../../src/components/navigation/UnderlineTabs";
import { MultiActionFab } from "../../../src/components/navigation/MultiActionFab";
import { BOTTOM_TAB_BAR_HEIGHT } from "../../../src/components/navigation/BottomTabBar";
import { InfiniteScrollList } from "../../../src/components/lists/InfiniteScrollList";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../../../src/components/timetable/TimetableCommon";
import { FormHero } from "../../../src/components/forms/FormHero";
import { useScrollToFirstError } from "../../../src/hooks/useScrollToFirstError";
import { OnboardingTarget } from "../../../src/components/onboarding/OnboardingTarget";
import { HEALTH_SCHOOL_TOUR_TARGETS } from "../../../src/components/health/health-school-tour.config";
import { healthApi } from "../../../src/api/health.api";
import {
  ALERT_LEVEL_COLORS,
  HEALTH_ALERT_LEVELS,
  HISTORY_ORIGIN_ICONS,
  alertLevelLabel,
  conditionTypeLabel,
  createCareEventFormSchema,
  reportTypeLabel,
  type HealthAlertLevel,
  type HealthHistoryItem,
  type StudentHealthCareEvent,
  type StudentHealthCondition,
} from "../../../src/types/health.types";

const SEARCH_PAGE_LIMIT = 20;
type SubTab = "cares" | "conditions";
type TabKey = SubTab | "forms";
type ListMeta = { page: number; limit: number; total: number };
type CareEventFormValues = {
  summary: string;
  alertLevel: HealthAlertLevel;
  description: string;
};

export default function AdminHealthStudentScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <AdminHealthStudentScreenContent />
    </AppShell>
  );
}

function AdminHealthStudentScreenContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug } = useAuthStore();
  const showSuccess = useSuccessToastStore((s) => s.showSuccess);
  const showError = useSuccessToastStore((s) => s.showError);
  const params = useLocalSearchParams<{
    studentId: string;
    firstName?: string;
    lastName?: string;
    className?: string;
    age?: string;
  }>();
  const studentId = params.studentId;

  const [tab, setTab] = useState<TabKey>("cares");
  const [editingCareEvent, setEditingCareEvent] =
    useState<StudentHealthCareEvent | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const studentName = [params.lastName, params.firstName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const studentAge = params.age ? Number(params.age) : null;

  // ── Cares (historique fusionné) ─────────────────────────────────────────────

  const [cares, setCares] = useState<HealthHistoryItem[]>([]);
  const [caresMeta, setCaresMeta] = useState<ListMeta | null>(null);
  const [isCaresLoading, setIsCaresLoading] = useState(true);
  const [isCaresLoadingMore, setIsCaresLoadingMore] = useState(false);
  const [caresError, setCaresError] = useState<string | null>(null);

  const loadCares = useCallback(
    async (page: number, mode: "reset" | "append") => {
      if (!schoolSlug || !studentId) return;
      setCaresError(null);
      if (mode === "append") setIsCaresLoadingMore(true);
      else setIsCaresLoading(true);
      try {
        const result = await healthApi.getHistory(schoolSlug, studentId, {
          page,
          limit: SEARCH_PAGE_LIMIT,
        });
        setCares((prev) =>
          mode === "append" ? [...prev, ...result.items] : result.items,
        );
        setCaresMeta({
          page: result.page,
          limit: result.limit,
          total: result.total,
        });
      } catch {
        setCaresError(t("health.admin.profile.errors.load"));
      } finally {
        setIsCaresLoading(false);
        setIsCaresLoadingMore(false);
      }
    },
    [schoolSlug, studentId],
  );

  useEffect(() => {
    void loadCares(1, "reset");
  }, [loadCares]);

  const handleLoadMoreCares = useCallback(() => {
    if (!caresMeta || isCaresLoadingMore) return;
    const totalPages = Math.max(
      1,
      Math.ceil(caresMeta.total / caresMeta.limit),
    );
    if (caresMeta.page >= totalPages) return;
    void loadCares(caresMeta.page + 1, "append");
  }, [caresMeta, isCaresLoadingMore, loadCares]);

  // ── Conditions ───────────────────────────────────────────────────────────────

  const [conditions, setConditions] = useState<StudentHealthCondition[]>([]);
  const [conditionsMeta, setConditionsMeta] = useState<ListMeta | null>(null);
  const [isConditionsLoading, setIsConditionsLoading] = useState(true);
  const [isConditionsLoadingMore, setIsConditionsLoadingMore] = useState(false);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  const loadConditions = useCallback(
    async (page: number, mode: "reset" | "append") => {
      if (!schoolSlug || !studentId) return;
      setConditionsError(null);
      if (mode === "append") setIsConditionsLoadingMore(true);
      else setIsConditionsLoading(true);
      try {
        const result = await healthApi.listConditions(schoolSlug, studentId, {
          page,
          limit: SEARCH_PAGE_LIMIT,
        });
        setConditions((prev) =>
          mode === "append" ? [...prev, ...result.items] : result.items,
        );
        setConditionsMeta({
          page: result.page,
          limit: result.limit,
          total: result.total,
        });
      } catch {
        setConditionsError(t("health.admin.profile.errors.load"));
      } finally {
        setIsConditionsLoading(false);
        setIsConditionsLoadingMore(false);
      }
    },
    [schoolSlug, studentId],
  );

  useEffect(() => {
    if (tab === "conditions") void loadConditions(1, "reset");
  }, [tab, loadConditions]);

  const handleLoadMoreConditions = useCallback(() => {
    if (!conditionsMeta || isConditionsLoadingMore) return;
    const totalPages = Math.max(
      1,
      Math.ceil(conditionsMeta.total / conditionsMeta.limit),
    );
    if (conditionsMeta.page >= totalPages) return;
    void loadConditions(conditionsMeta.page + 1, "append");
  }, [conditionsMeta, isConditionsLoadingMore, loadConditions]);

  // ── Form (create / edit soin) ────────────────────────────────────────────────

  function openCreateForm() {
    setEditingCareEvent(null);
    setFormError(null);
    setTab("forms");
  }

  function openEditForm(event: StudentHealthCareEvent) {
    setEditingCareEvent(event);
    setFormError(null);
    setTab("forms");
  }

  function exitForm() {
    setEditingCareEvent(null);
    setFormError(null);
    setTab("cares");
  }

  async function submitCareEventForm(values: CareEventFormValues) {
    if (!schoolSlug || !studentId) return;
    setIsSavingForm(true);
    setFormError(null);
    try {
      if (editingCareEvent) {
        await healthApi.updateCareEvent(
          schoolSlug,
          studentId,
          editingCareEvent.id,
          {
            summary: values.summary,
            alertLevel: values.alertLevel,
            description: values.description || undefined,
          },
        );
        showSuccess({
          title: t("health.admin.profile.toasts.careUpdatedTitle"),
          message: t("health.admin.profile.toasts.careUpdatedMessage"),
        });
      } else {
        await healthApi.createCareEvent(schoolSlug, studentId, {
          summary: values.summary,
          alertLevel: values.alertLevel,
          description: values.description || undefined,
        });
        showSuccess({
          title: t("health.admin.profile.toasts.careCreatedTitle"),
          message: t("health.admin.profile.toasts.careCreatedMessage"),
        });
      }
      setEditingCareEvent(null);
      setTab("cares");
      await loadCares(1, "reset");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("health.admin.profile.errors.saveGeneric");
      setFormError(message);
      showError({
        title: t("health.admin.profile.errors.saveGeneric"),
        message,
      });
    } finally {
      setIsSavingForm(false);
    }
  }

  return (
    <View style={styles.root} testID="admin-sante-student-screen">
      <ModuleHeader
        title={studentName || t("health.title")}
        onBack={() => {
          if (tab === "forms") return exitForm();
          router.back();
        }}
      />

      <View style={styles.hero} testID="admin-sante-student-hero">
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>
            {(params.firstName?.[0] ?? "").toUpperCase()}
            {(params.lastName?.[0] ?? "").toUpperCase()}
          </Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{studentName}</Text>
          <Text style={styles.heroMeta}>
            {params.className || t("health.admin.profile.hero.noClass")}
            {" · "}
            {studentAge != null
              ? `${studentAge} ${t("health.admin.eleves.card.ageUnit")}`
              : t("health.admin.profile.hero.ageUnknown")}
          </Text>
        </View>
      </View>

      {tab === "forms" ? (
        <CareEventFormContent
          t={t}
          editing={editingCareEvent}
          isSubmitting={isSavingForm}
          formError={formError}
          onCancel={exitForm}
          onSubmit={submitCareEventForm}
        />
      ) : (
        <>
          <UnderlineTabs
            items={[
              { key: "cares", label: t("health.admin.profile.tabs.cares") },
              {
                key: "conditions",
                label: t("health.admin.profile.tabs.conditions"),
              },
            ]}
            activeKey={tab}
            onSelect={setTab}
            testIDPrefix="admin-sante-student-tab"
          />

          {tab === "cares" ? (
            isCaresLoading ? (
              <LoadingBlock label={t("health.parent.loading")} />
            ) : caresError ? (
              <ErrorBanner
                message={caresError}
                testID="admin-sante-student-cares-error"
              />
            ) : (
              <InfiniteScrollList
                data={cares}
                keyExtractor={(item) => `${item.kind}-${item.payload.id}`}
                onLoadMore={handleLoadMoreCares}
                hasMore={
                  !!caresMeta &&
                  caresMeta.page <
                    Math.max(1, Math.ceil(caresMeta.total / caresMeta.limit))
                }
                isLoadingMore={isCaresLoadingMore}
                contentContainerStyle={styles.listContent}
                testID="admin-sante-student-cares-list"
                emptyComponent={
                  <EmptyState
                    icon="medkit-outline"
                    title={t("health.admin.profile.empty.caresTitle")}
                    message={t("health.admin.profile.empty.cares")}
                  />
                }
                renderItem={({ item }) => (
                  <HistoryCard
                    t={t}
                    item={item}
                    onEdit={
                      item.kind === "CARE_EVENT"
                        ? () => openEditForm(item.payload)
                        : undefined
                    }
                  />
                )}
              />
            )
          ) : isConditionsLoading ? (
            <LoadingBlock label={t("health.parent.loading")} />
          ) : conditionsError ? (
            <ErrorBanner
              message={conditionsError}
              testID="admin-sante-student-conditions-error"
            />
          ) : (
            <InfiniteScrollList
              data={conditions}
              keyExtractor={(item) => item.id}
              onLoadMore={handleLoadMoreConditions}
              hasMore={
                !!conditionsMeta &&
                conditionsMeta.page <
                  Math.max(
                    1,
                    Math.ceil(conditionsMeta.total / conditionsMeta.limit),
                  )
              }
              isLoadingMore={isConditionsLoadingMore}
              contentContainerStyle={styles.listContent}
              testID="admin-sante-student-conditions-list"
              emptyComponent={
                <EmptyState
                  icon="clipboard-outline"
                  title={t("health.admin.profile.empty.conditionsTitle")}
                  message={t("health.admin.profile.empty.conditions")}
                />
              }
              renderItem={({ item }) => (
                <View style={styles.card} testID={`condition-item-${item.id}`}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{item.label}</Text>
                    <AlertBadge level={item.alertLevel} t={t} />
                  </View>
                  <Text style={styles.cardMeta}>
                    {conditionTypeLabel(t, item.type)}
                    {!item.active
                      ? ` · ${t("health.parent.card.inactive")}`
                      : ""}
                  </Text>
                  {item.description ? (
                    <Text style={styles.cardBody}>{item.description}</Text>
                  ) : null}
                </View>
              )}
            />
          )}

          <OnboardingTarget id={HEALTH_SCHOOL_TOUR_TARGETS.studentFab}>
            <MultiActionFab
              actions={[
                {
                  key: "add-care",
                  icon: "add",
                  label: t("health.admin.profile.fab.addCare"),
                  onPress: openCreateForm,
                  testID: "admin-sante-student-fab",
                },
              ]}
              bottom={insets.bottom + 18 + BOTTOM_TAB_BAR_HEIGHT}
            />
          </OnboardingTarget>
        </>
      )}
    </View>
  );
}

function HistoryCard({
  t,
  item,
  onEdit,
}: {
  t: TranslateFn;
  item: HealthHistoryItem;
  onEdit?: () => void;
}) {
  if (item.kind === "CARE_EVENT") {
    const event = item.payload;
    const authorName = event.authorUser
      ? `${event.authorUser.firstName} ${event.authorUser.lastName}`.trim()
      : null;
    return (
      <View style={styles.card} testID={`care-event-item-${event.id}`}>
        <View style={styles.cardRow}>
          <View style={styles.cardIconWrap}>
            <Ionicons
              name={HISTORY_ORIGIN_ICONS.CARE_EVENT}
              size={16}
              color={colors.accentTealDark}
            />
          </View>
          <View style={styles.cardBodyWrap}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{event.summary}</Text>
              <AlertBadge level={event.alertLevel} t={t} />
            </View>
            <Text style={styles.cardMeta}>
              {new Date(event.occurredAt).toLocaleString()}
              {authorName
                ? ` · ${t("health.admin.profile.byPrefix")} ${authorName}`
                : ""}
            </Text>
            {event.description ? (
              <Text style={styles.cardBody}>{event.description}</Text>
            ) : null}
          </View>
        </View>
        {onEdit ? (
          <TouchableOpacity
            style={styles.editLink}
            onPress={onEdit}
            testID={`care-event-edit-${event.id}`}
          >
            <Text style={styles.editLinkLabel}>
              {t("health.admin.profile.editAction")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const report = item.payload;
  const reporterName = report.reportedByUser
    ? `${report.reportedByUser.firstName} ${report.reportedByUser.lastName}`.trim()
    : null;
  return (
    <View style={styles.card} testID={`report-item-${report.id}`}>
      <View style={styles.cardRow}>
        <View style={styles.cardIconWrap}>
          <Ionicons
            name={HISTORY_ORIGIN_ICONS.REPORT}
            size={16}
            color={colors.accentTealDark}
          />
        </View>
        <View style={styles.cardBodyWrap}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>
              {reportTypeLabel(t, report.type)}
            </Text>
            <AlertBadge level={report.alertLevel} t={t} />
          </View>
          <Text style={styles.cardMeta}>
            {new Date(report.createdAt).toLocaleString()}
            {reporterName
              ? ` · ${t("health.admin.profile.byPrefix")} ${reporterName}`
              : ""}
          </Text>
          <Text style={styles.cardBody}>{report.description}</Text>
          <Text
            style={
              report.acknowledgedAt
                ? styles.acknowledgedLabel
                : styles.pendingLabel
            }
          >
            {report.acknowledgedAt
              ? t("health.admin.cares.card.acknowledged")
              : t("health.admin.cares.card.pending")}
          </Text>
        </View>
      </View>
    </View>
  );
}

function AlertBadge({ level, t }: { level: HealthAlertLevel; t: TranslateFn }) {
  const palette = ALERT_LEVEL_COLORS[level];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeLabel, { color: palette.text }]}>
        {alertLevelLabel(t, level)}
      </Text>
    </View>
  );
}

function CareEventFormContent({
  t,
  editing,
  isSubmitting,
  formError,
  onCancel,
  onSubmit,
}: {
  t: TranslateFn;
  editing: StudentHealthCareEvent | null;
  isSubmitting: boolean;
  formError: string | null;
  onCancel: () => void;
  onSubmit: (values: CareEventFormValues) => void;
}) {
  const schema = useMemo(() => createCareEventFormSchema(t), [t]);
  const summaryInputRef = useRef<TextInput>(null);
  const {
    scrollViewRef,
    registerFieldOffset,
    registerFieldInputRef,
    focusFirstInvalidField,
  } = useScrollToFirstError<"summary" | "alertLevel" | "description">();
  registerFieldInputRef("summary", summaryInputRef);

  const form = useForm<CareEventFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      summary: editing?.summary ?? "",
      alertLevel: editing?.alertLevel ?? "INFO",
      description: editing?.description ?? "",
    },
  });

  const FIELD_ORDER: Array<"summary" | "alertLevel" | "description"> = [
    "summary",
    "alertLevel",
    "description",
  ];

  const handleSave = form.handleSubmit(onSubmit, (errors) =>
    focusFirstInvalidField(FIELD_ORDER, errors),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="admin-care-form"
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormHero
          icon={editing ? "create-outline" : "add-circle-outline"}
          title={
            editing
              ? t("health.admin.profile.form.hero.editTitle")
              : t("health.admin.profile.form.hero.createTitle")
          }
          subtitle={
            editing
              ? t("health.admin.profile.form.hero.editSubtitle")
              : t("health.admin.profile.form.hero.createSubtitle")
          }
          palette={editing ? "warm" : "teal"}
          testID="admin-care-form-hero"
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <Controller
          control={form.control}
          name="summary"
          render={({ field, fieldState }) => (
            <View
              style={styles.field}
              onLayout={registerFieldOffset("summary")}
            >
              <Text style={styles.label}>{t("health.form.label")}</Text>
              <TextInput
                ref={summaryInputRef}
                style={[styles.input, fieldState.error && styles.inputError]}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder={t("health.form.careSummaryPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                testID="care-form-summary"
              />
              {fieldState.error ? (
                <Text
                  style={styles.formFieldError}
                  testID="care-form-summary-error"
                >
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <View onLayout={registerFieldOffset("alertLevel")}>
          <Text style={styles.label}>{t("health.form.alertLevel")}</Text>
          <View style={styles.chipRow}>
            {HEALTH_ALERT_LEVELS.map((level) => {
              const active = form.watch("alertLevel") === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    form.setValue("alertLevel", level, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  testID={`care-form-alertLevel-${level}`}
                >
                  <Text
                    style={[styles.chipLabel, active && styles.chipLabelActive]}
                  >
                    {alertLevelLabel(t, level)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Controller
          control={form.control}
          name="description"
          render={({ field }) => (
            <View
              style={styles.field}
              onLayout={registerFieldOffset("description")}
            >
              <Text style={styles.label}>{t("health.form.description")}</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                multiline
                placeholder={t("health.form.descriptionPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                testID="care-form-description"
              />
            </View>
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.formCancelButton}
          onPress={onCancel}
          testID="care-form-cancel"
        >
          <Text style={styles.formCancelButtonLabel}>
            {t("health.parent.form.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.formSubmitButton,
            isSubmitting && styles.formSubmitButtonDisabled,
          ]}
          disabled={isSubmitting}
          onPress={() => void handleSave()}
          testID="care-form-submit"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.formSubmitButtonLabel}>
              {editing
                ? t("health.admin.profile.form.submitEdit")
                : t("health.form.submitCareEvent")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  heroInfo: { flex: 1, gap: 2 },
  heroName: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  heroMeta: { fontSize: 12, color: colors.textSecondary },

  listContent: { padding: 16, paddingBottom: 96, gap: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
    gap: 4,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.accentTeal}1F`,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBodyWrap: { flex: 1, gap: 2 },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  cardMeta: { fontSize: 11, color: colors.textSecondary },
  cardBody: { fontSize: 13, color: colors.textSecondary },
  pendingLabel: { fontSize: 11, fontWeight: "700", color: colors.warmAccent },
  acknowledgedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accentTealDark,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeLabel: { fontSize: 11, fontWeight: "700" },
  editLink: { alignSelf: "flex-end", marginTop: 2 },
  editLinkLabel: {
    color: colors.accentTealDark,
    fontSize: 12,
    fontWeight: "700",
  },

  formsKeyboardArea: { flex: 1 },
  formScroll: { flex: 1 },
  formScrollContent: { padding: 16, gap: 14 },
  formError: { color: colors.notification, fontSize: 13 },
  formFieldError: { color: colors.notification, fontSize: 12, marginTop: 2 },
  formActionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  formCancelButton: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  formCancelButtonLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  formSubmitButton: {
    flex: 1.4,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  formSubmitButtonDisabled: { opacity: 0.6 },
  formSubmitButtonLabel: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
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
});
