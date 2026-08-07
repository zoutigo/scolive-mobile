/**
 * Écran Santé — Vue parent.
 * 2 onglets : Conditions (allergies, pathologies, traitements, consignes —
 * état durable) / Historique (soins reçus à l'école + événements déclarés
 * par le parent — fusionnés, triés par date).
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
  Switch,
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
import { useFamilyStore } from "../../../src/store/family.store";
import { useSuccessToastStore } from "../../../src/store/success-toast.store";
import { extractApiError } from "../../../src/utils/api-error";
import { ModuleHeader } from "../../../src/components/navigation/ModuleHeader";
import { buildChildHomeTarget } from "../../../src/components/navigation/nav-config";
import { AppShell } from "../../../src/components/navigation/AppShell";
import { BOTTOM_TAB_BAR_HEIGHT } from "../../../src/components/navigation/BottomTabBar";
import { UnderlineTabs } from "../../../src/components/navigation/UnderlineTabs";
import { MultiActionFab } from "../../../src/components/navigation/MultiActionFab";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../../../src/components/timetable/TimetableCommon";
import { InfiniteScrollList } from "../../../src/components/lists/InfiniteScrollList";
import { FormHero } from "../../../src/components/forms/FormHero";
import { InlineSelectDropDown } from "../../../src/components/InlineSelectDropDown";
import { useScrollToFirstError } from "../../../src/hooks/useScrollToFirstError";
import { healthApi } from "../../../src/api/health.api";
import {
  ALERT_LEVEL_COLORS,
  ALERT_LEVEL_ICONS,
  CONDITION_TYPE_ICONS,
  HEALTH_ALERT_LEVELS,
  HEALTH_CONDITION_TYPES,
  HEALTH_REPORT_TYPES,
  HISTORY_ORIGIN_ICONS,
  NO_CONDITION_FILTERS,
  NO_HISTORY_FILTERS,
  hasActiveConditionFilters,
  hasActiveHistoryFilters,
  alertLevelLabel,
  conditionTypeLabel,
  createReportFormSchema,
  editConditionFormSchema,
  reportTypeLabel,
  type HealthAlertLevel,
  type HealthConditionType,
  type HealthConditionsFilters,
  type HealthHistoryFilters,
  type HealthHistoryItem,
  type HealthHistoryOrigin,
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
import { PageHelpModal } from "../../../src/components/help/PageHelpModal";

const SEARCH_DEBOUNCE_MS = 300;

type ListTabKey = "conditions" | "history";
type TabKey = ListTabKey | "forms" | "detail";

type ConditionFormValues = {
  type: HealthConditionType;
  alertLevel: HealthAlertLevel;
  label: string;
  description: string;
  active: boolean;
};

type ReportFormValues = {
  type: HealthReportType;
  alertLevel: HealthAlertLevel;
  description: string;
  sportRestriction: boolean;
};

type FormContext =
  | { type: "create-condition"; originTab: "conditions"; item: null }
  | {
      type: "edit-condition";
      originTab: "conditions";
      item: StudentHealthCondition;
    }
  | { type: "create-report"; originTab: "history"; item: null };

type DetailContext =
  | { type: "condition"; originTab: "conditions"; item: StudentHealthCondition }
  | { type: "care-event"; originTab: "history"; item: StudentHealthCareEvent }
  | { type: "report"; originTab: "history"; item: StudentHealthReport };

type ListMeta = { page: number; limit: number; total: number };

export default function SanteScreenRoute() {
  return (
    <AppShell showHeader={false}>
      <SanteScreenContent />
    </AppShell>
  );
}

function SanteScreenContent() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const { schoolSlug } = useAuthStore();
  const { children } = useFamilyStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const child = children.find((c) => c.id === childId) ?? null;

  const [tab, setTab] = useState<TabKey>("conditions");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [detailContext, setDetailContext] = useState<DetailContext | null>(
    null,
  );
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  useOnboardingTourTrigger({
    tourId: HEALTH_PARENT_TOUR_ID,
    role: "parent",
    steps: HEALTH_PARENT_TOUR_STEPS,
  });

  // ── Conditions tab state ────────────────────────────────────────────────

  const [conditions, setConditions] = useState<StudentHealthCondition[]>([]);
  const [conditionsMeta, setConditionsMeta] = useState<ListMeta | null>(null);
  const [isConditionsLoading, setIsConditionsLoading] = useState(true);
  const [isConditionsLoadingMore, setIsConditionsLoadingMore] = useState(false);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  const [conditionsSearchInput, setConditionsSearchInput] = useState("");
  const [conditionsAppliedSearch, setConditionsAppliedSearch] = useState("");
  const [conditionsFiltersOpen, setConditionsFiltersOpen] = useState(false);
  const [conditionsDraftFilters, setConditionsDraftFilters] =
    useState<HealthConditionsFilters>(NO_CONDITION_FILTERS);
  const [conditionsAppliedFilters, setConditionsAppliedFilters] =
    useState<HealthConditionsFilters>(NO_CONDITION_FILTERS);
  const conditionsSearchDebounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // ── History tab state ───────────────────────────────────────────────────

  const [historyItems, setHistoryItems] = useState<HealthHistoryItem[]>([]);
  const [historyMeta, setHistoryMeta] = useState<ListMeta | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isHistoryLoadingMore, setIsHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [historySearchInput, setHistorySearchInput] = useState("");
  const [historyAppliedSearch, setHistoryAppliedSearch] = useState("");
  const [historyFiltersOpen, setHistoryFiltersOpen] = useState(false);
  const [historyDraftFilters, setHistoryDraftFilters] =
    useState<HealthHistoryFilters>(NO_HISTORY_FILTERS);
  const [historyAppliedFilters, setHistoryAppliedFilters] =
    useState<HealthHistoryFilters>(NO_HISTORY_FILTERS);
  const historySearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadConditions = useCallback(
    async (
      page: number,
      filters: HealthConditionsFilters,
      search: string,
      mode: "reset" | "append",
    ) => {
      if (!schoolSlug || !childId) return;
      setConditionsError(null);
      if (mode === "append") setIsConditionsLoadingMore(true);
      else setIsConditionsLoading(true);
      try {
        const result = await healthApi.listConditions(schoolSlug, childId, {
          page,
          search,
          filters,
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
        setConditionsError(t("health.errors.load"));
      } finally {
        setIsConditionsLoading(false);
        setIsConditionsLoadingMore(false);
      }
    },
    [schoolSlug, childId],
  );

  const loadHistory = useCallback(
    async (
      page: number,
      filters: HealthHistoryFilters,
      search: string,
      mode: "reset" | "append",
    ) => {
      if (!schoolSlug || !childId) return;
      setHistoryError(null);
      if (mode === "append") setIsHistoryLoadingMore(true);
      else setIsHistoryLoading(true);
      try {
        const result = await healthApi.getHistory(schoolSlug, childId, {
          page,
          search,
          filters,
        });
        setHistoryItems((prev) =>
          mode === "append" ? [...prev, ...result.items] : result.items,
        );
        setHistoryMeta({
          page: result.page,
          limit: result.limit,
          total: result.total,
        });
      } catch {
        setHistoryError(t("health.errors.load"));
      } finally {
        setIsHistoryLoading(false);
        setIsHistoryLoadingMore(false);
      }
    },
    [schoolSlug, childId],
  );

  useEffect(() => {
    void loadConditions(
      1,
      conditionsAppliedFilters,
      conditionsAppliedSearch,
      "reset",
    );
  }, [conditionsAppliedFilters, conditionsAppliedSearch, loadConditions]);

  useEffect(() => {
    void loadHistory(1, historyAppliedFilters, historyAppliedSearch, "reset");
  }, [historyAppliedFilters, historyAppliedSearch, loadHistory]);

  useEffect(() => {
    if (conditionsSearchDebounceRef.current) {
      clearTimeout(conditionsSearchDebounceRef.current);
    }
    conditionsSearchDebounceRef.current = setTimeout(() => {
      setConditionsAppliedSearch(conditionsSearchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (conditionsSearchDebounceRef.current) {
        clearTimeout(conditionsSearchDebounceRef.current);
      }
    };
  }, [conditionsSearchInput]);

  useEffect(() => {
    if (historySearchDebounceRef.current) {
      clearTimeout(historySearchDebounceRef.current);
    }
    historySearchDebounceRef.current = setTimeout(() => {
      setHistoryAppliedSearch(historySearchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (historySearchDebounceRef.current) {
        clearTimeout(historySearchDebounceRef.current);
      }
    };
  }, [historySearchInput]);

  const handleLoadMoreConditions = useCallback(() => {
    if (!conditionsMeta || isConditionsLoadingMore) return;
    const totalPages = Math.max(
      1,
      Math.ceil(conditionsMeta.total / conditionsMeta.limit),
    );
    if (conditionsMeta.page >= totalPages) return;
    void loadConditions(
      conditionsMeta.page + 1,
      conditionsAppliedFilters,
      conditionsAppliedSearch,
      "append",
    );
  }, [
    conditionsMeta,
    isConditionsLoadingMore,
    conditionsAppliedFilters,
    conditionsAppliedSearch,
    loadConditions,
  ]);

  const handleLoadMoreHistory = useCallback(() => {
    if (!historyMeta || isHistoryLoadingMore) return;
    const totalPages = Math.max(
      1,
      Math.ceil(historyMeta.total / historyMeta.limit),
    );
    if (historyMeta.page >= totalPages) return;
    void loadHistory(
      historyMeta.page + 1,
      historyAppliedFilters,
      historyAppliedSearch,
      "append",
    );
  }, [
    historyMeta,
    isHistoryLoadingMore,
    historyAppliedFilters,
    historyAppliedSearch,
    loadHistory,
  ]);

  // ── Filters panel handlers ──────────────────────────────────────────────

  function openConditionsFilters() {
    setConditionsDraftFilters(conditionsAppliedFilters);
    setConditionsFiltersOpen(true);
  }
  function closeConditionsFilters() {
    setConditionsDraftFilters(conditionsAppliedFilters);
    setConditionsFiltersOpen(false);
  }
  function toggleConditionsFilters() {
    if (conditionsFiltersOpen) closeConditionsFilters();
    else openConditionsFilters();
  }
  function applyConditionsFilters() {
    setConditionsAppliedFilters(conditionsDraftFilters);
    setConditionsFiltersOpen(false);
  }
  function resetConditionsFilters() {
    setConditionsDraftFilters(NO_CONDITION_FILTERS);
    setConditionsAppliedFilters(NO_CONDITION_FILTERS);
  }

  function openHistoryFilters() {
    setHistoryDraftFilters(historyAppliedFilters);
    setHistoryFiltersOpen(true);
  }
  function closeHistoryFilters() {
    setHistoryDraftFilters(historyAppliedFilters);
    setHistoryFiltersOpen(false);
  }
  function toggleHistoryFilters() {
    if (historyFiltersOpen) closeHistoryFilters();
    else openHistoryFilters();
  }
  function applyHistoryFilters() {
    setHistoryAppliedFilters(historyDraftFilters);
    setHistoryFiltersOpen(false);
  }
  function resetHistoryFilters() {
    setHistoryDraftFilters(NO_HISTORY_FILTERS);
    setHistoryAppliedFilters(NO_HISTORY_FILTERS);
  }

  // ── Navigation: forms / detail ──────────────────────────────────────────

  function exitForms() {
    const origin = formContext?.originTab ?? "conditions";
    setFormContext(null);
    setFormError(null);
    setTab(origin);
  }

  function exitDetail() {
    const origin = detailContext?.originTab ?? "conditions";
    setDetailContext(null);
    setTab(origin);
  }

  function openFab() {
    if (tab === "conditions") {
      setFormContext({
        type: "create-condition",
        originTab: "conditions",
        item: null,
      });
      setFormError(null);
      setTab("forms");
    } else if (tab === "history") {
      setFormContext({
        type: "create-report",
        originTab: "history",
        item: null,
      });
      setFormError(null);
      setTab("forms");
    }
  }

  function openConditionDetail(item: StudentHealthCondition) {
    setDetailContext({ type: "condition", originTab: "conditions", item });
    setTab("detail");
  }

  function openHistoryDetail(item: HealthHistoryItem) {
    setDetailContext(
      item.kind === "CARE_EVENT"
        ? { type: "care-event", originTab: "history", item: item.payload }
        : { type: "report", originTab: "history", item: item.payload },
    );
    setTab("detail");
  }

  function openEditConditionFromDetail() {
    if (!detailContext || detailContext.type !== "condition") return;
    setFormContext({
      type: "edit-condition",
      originTab: "conditions",
      item: detailContext.item,
    });
    setFormError(null);
    setDetailContext(null);
    setTab("forms");
  }

  // ── Submit handlers ──────────────────────────────────────────────────────

  async function submitCreateCondition(values: ConditionFormValues) {
    if (!schoolSlug || !childId) return;
    setIsSavingForm(true);
    setFormError(null);
    try {
      await healthApi.createCondition(schoolSlug, childId, {
        type: values.type,
        alertLevel: values.alertLevel,
        label: values.label,
        description: values.description || undefined,
      });
      showSuccess({
        title: t("health.parent.form.successTitle"),
        message: t("health.parent.form.createConditionSuccess"),
      });
      void loadConditions(
        1,
        conditionsAppliedFilters,
        conditionsAppliedSearch,
        "reset",
      );
      setTimeout(() => exitForms(), 2000);
    } catch (error) {
      setFormError(extractApiError(error));
      showError({
        title: t("health.parent.form.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSavingForm(false);
    }
  }

  async function submitEditCondition(values: ConditionFormValues) {
    if (
      !schoolSlug ||
      !childId ||
      !formContext ||
      formContext.type !== "edit-condition"
    ) {
      return;
    }
    setIsSavingForm(true);
    setFormError(null);
    try {
      await healthApi.updateCondition(
        schoolSlug,
        childId,
        formContext.item.id,
        {
          type: values.type,
          alertLevel: values.alertLevel,
          label: values.label,
          description: values.description || undefined,
          active: values.active,
        },
      );
      showSuccess({
        title: t("health.parent.form.successTitle"),
        message: t("health.parent.form.editConditionSuccess"),
      });
      void loadConditions(
        1,
        conditionsAppliedFilters,
        conditionsAppliedSearch,
        "reset",
      );
      setTimeout(() => exitForms(), 2000);
    } catch (error) {
      setFormError(extractApiError(error));
      showError({
        title: t("health.parent.form.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSavingForm(false);
    }
  }

  async function submitCreateReport(values: ReportFormValues) {
    if (!schoolSlug || !childId) return;
    setIsSavingForm(true);
    setFormError(null);
    try {
      await healthApi.createReport(schoolSlug, childId, {
        type: values.type,
        alertLevel: values.alertLevel,
        description: values.description,
        sportRestriction: values.sportRestriction,
      });
      showSuccess({
        title: t("health.parent.form.successTitle"),
        message: t("health.parent.form.createReportSuccess"),
      });
      void loadHistory(1, historyAppliedFilters, historyAppliedSearch, "reset");
      setTimeout(() => exitForms(), 2000);
    } catch (error) {
      setFormError(extractApiError(error));
      showError({
        title: t("health.parent.form.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSavingForm(false);
    }
  }

  const anyFiltersOpen =
    (tab === "conditions" && conditionsFiltersOpen) ||
    (tab === "history" && historyFiltersOpen);

  return (
    <View style={styles.root} testID="sante-screen">
      <ModuleHeader
        title={t("health.title")}
        subtitle={child ? `${child.firstName} ${child.lastName}` : undefined}
        onBack={() => {
          if (tab === "forms") return exitForms();
          if (tab === "detail") return exitDetail();
          router.push(buildChildHomeTarget(childId ?? "") as never);
        }}
        testID="sante-header"
        backTestID="sante-back"
        topInset={insets.top}
        helpAction={{
          label: t("health.parent.help.menuLabel"),
          onPress: () => setHelpVisible(true),
          testID: "sante-help-menu-item",
        }}
        menuTourTargetId={HEALTH_PARENT_TOUR_TARGETS.helpToggle}
      />

      {tab === "conditions" || tab === "history" ? (
        <OnboardingTarget id={HEALTH_PARENT_TOUR_TARGETS.tabs}>
          <UnderlineTabs
            items={[
              { key: "conditions", label: t("health.parent.tabs.conditions") },
              { key: "history", label: t("health.parent.tabs.history") },
            ]}
            activeKey={tab as ListTabKey}
            onSelect={(key) => setTab(key as TabKey)}
            testIDPrefix="sante-tab"
            fitWidth
          />
        </OnboardingTarget>
      ) : null}

      {tab === "forms" && formContext ? (
        <FormsTabContent
          t={t}
          formContext={formContext}
          isSaving={isSavingForm}
          formError={formError}
          onCancel={exitForms}
          onSubmitCreateCondition={submitCreateCondition}
          onSubmitEditCondition={submitEditCondition}
          onSubmitCreateReport={submitCreateReport}
        />
      ) : tab === "detail" && detailContext ? (
        <DetailTabContent
          t={t}
          detailContext={detailContext}
          onEditCondition={openEditConditionFromDetail}
        />
      ) : tab === "conditions" ? (
        <ConditionsTabContent
          t={t}
          conditions={conditions}
          meta={conditionsMeta}
          isLoading={isConditionsLoading}
          isLoadingMore={isConditionsLoadingMore}
          error={conditionsError}
          searchInput={conditionsSearchInput}
          setSearchInput={setConditionsSearchInput}
          appliedSearch={conditionsAppliedSearch}
          appliedFilters={conditionsAppliedFilters}
          draftFilters={conditionsDraftFilters}
          setDraftFilters={setConditionsDraftFilters}
          filtersOpen={conditionsFiltersOpen}
          onToggleFilters={toggleConditionsFilters}
          onCloseFilters={closeConditionsFilters}
          onApplyFilters={applyConditionsFilters}
          onResetFilters={resetConditionsFilters}
          onLoadMore={handleLoadMoreConditions}
          onCardPress={openConditionDetail}
        />
      ) : tab === "history" ? (
        <HistoryTabContent
          t={t}
          items={historyItems}
          meta={historyMeta}
          isLoading={isHistoryLoading}
          isLoadingMore={isHistoryLoadingMore}
          error={historyError}
          searchInput={historySearchInput}
          setSearchInput={setHistorySearchInput}
          appliedSearch={historyAppliedSearch}
          appliedFilters={historyAppliedFilters}
          draftFilters={historyDraftFilters}
          setDraftFilters={setHistoryDraftFilters}
          filtersOpen={historyFiltersOpen}
          onToggleFilters={toggleHistoryFilters}
          onCloseFilters={closeHistoryFilters}
          onApplyFilters={applyHistoryFilters}
          onResetFilters={resetHistoryFilters}
          onLoadMore={handleLoadMoreHistory}
          onCardPress={openHistoryDetail}
        />
      ) : null}

      {(tab === "conditions" || tab === "history") && !anyFiltersOpen ? (
        <OnboardingTarget id={HEALTH_PARENT_TOUR_TARGETS.fab}>
          <MultiActionFab
            bottom={insets.bottom + 18 + BOTTOM_TAB_BAR_HEIGHT}
            testID="sante-fab"
            actions={[
              {
                key: "add",
                icon: "add",
                label:
                  tab === "conditions"
                    ? t("health.parent.fab.addCondition")
                    : t("health.parent.fab.addReport"),
                onPress: openFab,
                testID: "sante-fab",
              },
            ]}
          />
        </OnboardingTarget>
      ) : null}

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("health.parent.help.title")}
        sections={[
          {
            title: t("health.parent.help.section1Title"),
            body: [t("health.parent.help.section1Body")],
          },
          {
            title: t("health.parent.help.section2Title"),
            body: [t("health.parent.help.section2Body")],
          },
          {
            title: t("health.parent.help.section3Title"),
            body: [t("health.parent.help.section3Body")],
          },
        ]}
        closeLabel={t("health.parent.help.close")}
        testID="sante-help-modal"
      />
    </View>
  );
}

// ── Alert level icon badge ──────────────────────────────────────────────────

function AlertLevelIcon({
  level,
  t,
  size = 22,
}: {
  level: HealthAlertLevel;
  t: TranslateFn;
  size?: number;
}) {
  const palette = ALERT_LEVEL_COLORS[level];
  return (
    <View
      style={[styles.alertIconWrap, { backgroundColor: palette.bg }]}
      accessibilityLabel={alertLevelLabel(t, level)}
      testID={`alert-icon-${level}`}
    >
      <Ionicons
        name={ALERT_LEVEL_ICONS[level]}
        size={size}
        color={palette.text}
      />
    </View>
  );
}

// ── Chip select field (≤5 options, no search needed) ───────────────────────

function ChipSelectField<TValue extends string>({
  label,
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  label: string;
  options: Array<{ value: TValue; label: string }>;
  value: TValue;
  onChange: (value: TValue) => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChange(option.value)}
              testID={`${testIDPrefix}-${option.value}`}
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
    </View>
  );
}

// ── Filter chip group (for the teal filter panel — includes an "all" chip) ─

function FilterChipGroup<TValue extends string>({
  label,
  allLabel,
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  label: string;
  allLabel: string;
  options: Array<{ value: TValue; label: string }>;
  value: TValue | null;
  onChange: (value: TValue | null) => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{label}</Text>
      <View style={styles.filterChipsRow}>
        <TouchableOpacity
          style={[styles.filterChip, value == null && styles.filterChipActive]}
          onPress={() => onChange(null)}
          testID={`${testIDPrefix}-all`}
        >
          <Text
            style={[
              styles.filterChipLabel,
              value == null && styles.filterChipLabelActive,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {allLabel}
          </Text>
        </TouchableOpacity>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onChange(option.value)}
              testID={`${testIDPrefix}-${option.value}`}
            >
              <Text
                style={[
                  styles.filterChipLabel,
                  active && styles.filterChipLabelActive,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Filter groups with more than 5 options switch from chips to a searchable
// dropdown (InlineSelectDropDown) — same >5 threshold as form dropdowns
// (see skill improve-mobile-form), applied here to the filter panel.
const FILTER_DROPDOWN_ALL_VALUE = "__ALL__";

function FilterDropdownField<TValue extends string>({
  label,
  allLabel,
  options,
  value,
  onChange,
  testID,
}: {
  label: string;
  allLabel: string;
  options: Array<{ value: TValue; label: string }>;
  value: TValue | null;
  onChange: (value: TValue | null) => void;
  testID: string;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{label}</Text>
      <InlineSelectDropDown
        options={[
          { value: FILTER_DROPDOWN_ALL_VALUE, label: allLabel },
          ...options,
        ]}
        value={value ?? FILTER_DROPDOWN_ALL_VALUE}
        onChange={(next) =>
          onChange(next === FILTER_DROPDOWN_ALL_VALUE ? null : (next as TValue))
        }
        testID={testID}
      />
    </View>
  );
}

// ── Conditions tab ───────────────────────────────────────────────────────

function ConditionsTabContent(props: {
  t: TranslateFn;
  conditions: StudentHealthCondition[];
  meta: ListMeta | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchInput: string;
  setSearchInput: (value: string) => void;
  appliedSearch: string;
  appliedFilters: HealthConditionsFilters;
  draftFilters: HealthConditionsFilters;
  setDraftFilters: (value: HealthConditionsFilters) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onCloseFilters: () => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onLoadMore: () => void;
  onCardPress: (item: StudentHealthCondition) => void;
}) {
  const { t } = props;

  return (
    <View style={styles.tabBody} testID="sante-conditions-tab">
      <OnboardingTarget id={HEALTH_PARENT_TOUR_TARGETS.search}>
        <View style={styles.searchRow} testID="sante-conditions-search-row">
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={props.searchInput}
              onChangeText={props.setSearchInput}
              placeholder={t("health.parent.search.placeholderConditions")}
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              autoCapitalize="none"
              accessibilityLabel={t("health.parent.search.accessibilityLabel")}
              testID="sante-conditions-search-input"
            />
            {props.searchInput.length > 0 ? (
              <TouchableOpacity
                onPress={() => props.setSearchInput("")}
                testID="sante-conditions-search-clear"
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              styles.filterToggle,
              hasActiveConditionFilters(props.appliedFilters) &&
                styles.filterToggleActive,
            ]}
            onPress={props.onToggleFilters}
            testID="sante-conditions-filter-toggle"
            accessibilityLabel={t(
              "health.parent.filters.toggleAccessibilityLabel",
            )}
          >
            <Ionicons
              name={
                hasActiveConditionFilters(props.appliedFilters)
                  ? "filter"
                  : "filter-outline"
              }
              size={18}
              color={
                hasActiveConditionFilters(props.appliedFilters)
                  ? colors.white
                  : colors.accentTeal
              }
            />
          </TouchableOpacity>
        </View>
      </OnboardingTarget>

      {props.filtersOpen ? (
        <View style={styles.filterPanel} testID="sante-conditions-filter-panel">
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelHeaderIcon}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentTealDark}
              />
            </View>
            <Text style={styles.filterPanelHeaderTitle}>
              {t("health.parent.filters.toggleAccessibilityLabel")}
            </Text>
          </View>

          <View style={styles.filterScrollWrapper}>
            <ScrollView
              style={styles.filterScrollArea}
              contentContainerStyle={styles.filterScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              testID="sante-conditions-filter-scroll"
            >
              <FilterChipGroup
                label={t("health.parent.filters.typeLabel")}
                allLabel={t("health.parent.filters.allTypes")}
                options={HEALTH_CONDITION_TYPES.map((type) => ({
                  value: type,
                  label: conditionTypeLabel(t, type),
                }))}
                value={props.draftFilters.type}
                onChange={(value) =>
                  props.setDraftFilters({ ...props.draftFilters, type: value })
                }
                testIDPrefix="sante-conditions-filter-type"
              />
              <FilterChipGroup
                label={t("health.parent.filters.alertLevelLabel")}
                allLabel={t("health.parent.filters.allLevels")}
                options={HEALTH_ALERT_LEVELS.map((level) => ({
                  value: level,
                  label: alertLevelLabel(t, level),
                }))}
                value={props.draftFilters.alertLevel}
                onChange={(value) =>
                  props.setDraftFilters({
                    ...props.draftFilters,
                    alertLevel: value,
                  })
                }
                testIDPrefix="sante-conditions-filter-alertLevel"
              />
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("health.parent.filters.statusLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  {(
                    [
                      { key: "all", value: null },
                      { key: "active", value: true },
                      { key: "inactive", value: false },
                    ] as const
                  ).map((entry) => {
                    const active = props.draftFilters.active === entry.value;
                    return (
                      <TouchableOpacity
                        key={entry.key}
                        style={[
                          styles.filterChip,
                          active && styles.filterChipActive,
                        ]}
                        onPress={() =>
                          props.setDraftFilters({
                            ...props.draftFilters,
                            active: entry.value,
                          })
                        }
                        testID={`sante-conditions-filter-status-${entry.key}`}
                      >
                        <Text
                          style={[
                            styles.filterChipLabel,
                            active && styles.filterChipLabelActive,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {t(`health.parent.filters.status.${entry.key}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={props.onResetFilters}
              testID="sante-conditions-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("health.parent.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={props.onCloseFilters}
              testID="sante-conditions-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("health.parent.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={props.onApplyFilters}
              testID="sante-conditions-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("health.parent.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : props.isLoading && props.conditions.length === 0 ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("health.parent.loading")} />
        </View>
      ) : (
        <>
          {props.error ? <ErrorBanner message={props.error} /> : null}
          <InfiniteScrollList
            data={props.conditions}
            renderItem={({ item }) => (
              <ConditionCard
                t={t}
                item={item}
                onPress={() => props.onCardPress(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            onLoadMore={props.onLoadMore}
            hasMore={
              props.meta
                ? props.meta.page <
                  Math.max(1, Math.ceil(props.meta.total / props.meta.limit))
                : false
            }
            isLoadingMore={props.isLoadingMore}
            emptyComponent={
              <EmptyState
                icon="medkit-outline"
                title={t("health.parent.empty.conditionsTitle")}
                message={
                  props.appliedSearch ||
                  hasActiveConditionFilters(props.appliedFilters)
                    ? t("health.parent.empty.conditionsSearch")
                    : t("health.conditions.empty")
                }
              />
            }
            contentContainerStyle={styles.listContent}
            testID="sante-conditions-list"
          />
        </>
      )}
    </View>
  );
}

function ConditionCard({
  t,
  item,
  onPress,
}: {
  t: TranslateFn;
  item: StudentHealthCondition;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      testID={`sante-condition-card-${item.id}`}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardIconWrap}>
          <Ionicons
            name={CONDITION_TYPE_ICONS[item.type]}
            size={20}
            color={colors.accentTealDark}
          />
        </View>
        <View style={styles.cardBodyWrap}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.label}
            </Text>
            <AlertLevelIcon level={item.alertLevel} t={t} size={18} />
          </View>
          <Text style={styles.cardMeta}>
            {conditionTypeLabel(t, item.type)}
          </Text>
          {!item.active ? (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeLabel}>
                {t("health.parent.card.inactive")}
              </Text>
            </View>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

// ── History tab ───────────────────────────────────────────────────────────

function HistoryTabContent(props: {
  t: TranslateFn;
  items: HealthHistoryItem[];
  meta: ListMeta | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchInput: string;
  setSearchInput: (value: string) => void;
  appliedSearch: string;
  appliedFilters: HealthHistoryFilters;
  draftFilters: HealthHistoryFilters;
  setDraftFilters: (value: HealthHistoryFilters) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onCloseFilters: () => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onLoadMore: () => void;
  onCardPress: (item: HealthHistoryItem) => void;
}) {
  const { t } = props;

  return (
    <View style={styles.tabBody} testID="sante-history-tab">
      <View style={styles.searchRow} testID="sante-history-search-row">
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={props.searchInput}
            onChangeText={props.setSearchInput}
            placeholder={t("health.parent.search.placeholderHistory")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={t("health.parent.search.accessibilityLabel")}
            testID="sante-history-search-input"
          />
          {props.searchInput.length > 0 ? (
            <TouchableOpacity
              onPress={() => props.setSearchInput("")}
              testID="sante-history-search-clear"
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.filterToggle,
            hasActiveHistoryFilters(props.appliedFilters) &&
              styles.filterToggleActive,
          ]}
          onPress={props.onToggleFilters}
          testID="sante-history-filter-toggle"
          accessibilityLabel={t(
            "health.parent.filters.toggleAccessibilityLabel",
          )}
        >
          <Ionicons
            name={
              hasActiveHistoryFilters(props.appliedFilters)
                ? "filter"
                : "filter-outline"
            }
            size={18}
            color={
              hasActiveHistoryFilters(props.appliedFilters)
                ? colors.white
                : colors.accentTeal
            }
          />
        </TouchableOpacity>
      </View>

      {props.filtersOpen ? (
        <View style={styles.filterPanel} testID="sante-history-filter-panel">
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelHeaderIcon}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentTealDark}
              />
            </View>
            <Text style={styles.filterPanelHeaderTitle}>
              {t("health.parent.filters.toggleAccessibilityLabel")}
            </Text>
          </View>

          <View style={styles.filterScrollWrapper}>
            <ScrollView
              style={styles.filterScrollArea}
              contentContainerStyle={styles.filterScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              testID="sante-history-filter-scroll"
            >
              <FilterChipGroup
                label={t("health.parent.filters.alertLevelLabel")}
                allLabel={t("health.parent.filters.allLevels")}
                options={HEALTH_ALERT_LEVELS.map((level) => ({
                  value: level,
                  label: alertLevelLabel(t, level),
                }))}
                value={props.draftFilters.alertLevel}
                onChange={(value) =>
                  props.setDraftFilters({
                    ...props.draftFilters,
                    alertLevel: value,
                  })
                }
                testIDPrefix="sante-history-filter-alertLevel"
              />
              <FilterChipGroup
                label={t("health.parent.filters.originLabel")}
                allLabel={t("health.parent.filters.allOrigins")}
                options={[
                  {
                    value: "CARE_EVENT" as HealthHistoryOrigin,
                    label: t("health.parent.filters.originSchool"),
                  },
                  {
                    value: "REPORT" as HealthHistoryOrigin,
                    label: t("health.parent.filters.originParent"),
                  },
                ]}
                value={props.draftFilters.origin}
                onChange={(value) =>
                  props.setDraftFilters({
                    ...props.draftFilters,
                    origin: value,
                  })
                }
                testIDPrefix="sante-history-filter-origin"
              />
              <FilterDropdownField
                label={t("health.parent.filters.reportTypeLabel")}
                allLabel={t("health.parent.filters.allReportTypes")}
                options={HEALTH_REPORT_TYPES.map((type) => ({
                  value: type,
                  label: reportTypeLabel(t, type),
                }))}
                value={props.draftFilters.reportType}
                onChange={(value) =>
                  props.setDraftFilters({
                    ...props.draftFilters,
                    reportType: value,
                  })
                }
                testID="sante-history-filter-reportType"
              />
            </ScrollView>
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={props.onResetFilters}
              testID="sante-history-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("health.parent.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={props.onCloseFilters}
              testID="sante-history-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("health.parent.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={props.onApplyFilters}
              testID="sante-history-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("health.parent.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : props.isLoading && props.items.length === 0 ? (
        <View style={styles.centered}>
          <LoadingBlock label={t("health.parent.loading")} />
        </View>
      ) : (
        <>
          {props.error ? <ErrorBanner message={props.error} /> : null}
          <InfiniteScrollList
            data={props.items}
            renderItem={({ item }) => (
              <HistoryCard
                t={t}
                item={item}
                onPress={() => props.onCardPress(item)}
              />
            )}
            keyExtractor={(item) => `${item.kind}-${item.payload.id}`}
            onLoadMore={props.onLoadMore}
            hasMore={
              props.meta
                ? props.meta.page <
                  Math.max(1, Math.ceil(props.meta.total / props.meta.limit))
                : false
            }
            isLoadingMore={props.isLoadingMore}
            emptyComponent={
              <EmptyState
                icon="time-outline"
                title={t("health.parent.empty.historyTitle")}
                message={
                  props.appliedSearch ||
                  hasActiveHistoryFilters(props.appliedFilters)
                    ? t("health.parent.empty.historySearch")
                    : t("health.history.empty")
                }
              />
            }
            contentContainerStyle={styles.listContent}
            testID="sante-history-list"
          />
        </>
      )}
    </View>
  );
}

function HistoryCard({
  t,
  item,
  onPress,
}: {
  t: TranslateFn;
  item: HealthHistoryItem;
  onPress: () => void;
}) {
  const title =
    item.kind === "CARE_EVENT"
      ? item.payload.summary
      : reportTypeLabel(t, item.payload.type);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      testID={`sante-history-card-${item.kind}-${item.payload.id}`}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardIconWrap}>
          <Ionicons
            name={HISTORY_ORIGIN_ICONS[item.kind]}
            size={20}
            color={colors.accentTealDark}
          />
        </View>
        <View style={styles.cardBodyWrap}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {title}
            </Text>
            <AlertLevelIcon level={item.payload.alertLevel} t={t} size={18} />
          </View>
          <Text style={styles.cardMeta}>
            {new Date(item.at).toLocaleString()}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

// ── Forms tab (create/edit condition, create report) ────────────────────────

function FormsTabContent(props: {
  t: TranslateFn;
  formContext: FormContext;
  isSaving: boolean;
  formError: string | null;
  onCancel: () => void;
  onSubmitCreateCondition: (values: ConditionFormValues) => void;
  onSubmitEditCondition: (values: ConditionFormValues) => void;
  onSubmitCreateReport: (values: ReportFormValues) => void;
}) {
  const { t, formContext } = props;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="sante-forms-tab"
    >
      {formContext.type === "create-condition" ||
      formContext.type === "edit-condition" ? (
        <ConditionFormContent
          t={t}
          editing={
            formContext.type === "edit-condition" ? formContext.item : null
          }
          isSubmitting={props.isSaving}
          formError={props.formError}
          onCancel={props.onCancel}
          onSubmit={
            formContext.type === "edit-condition"
              ? props.onSubmitEditCondition
              : props.onSubmitCreateCondition
          }
        />
      ) : (
        <ReportFormContent
          t={t}
          isSubmitting={props.isSaving}
          formError={props.formError}
          onCancel={props.onCancel}
          onSubmit={props.onSubmitCreateReport}
        />
      )}
    </KeyboardAvoidingView>
  );
}

function ConditionFormContent({
  t,
  editing,
  isSubmitting,
  formError,
  onCancel,
  onSubmit,
}: {
  t: TranslateFn;
  editing: StudentHealthCondition | null;
  isSubmitting: boolean;
  formError: string | null;
  onCancel: () => void;
  onSubmit: (values: ConditionFormValues) => void;
}) {
  // Always validate against the superset schema (includes `active`) so the
  // resolver type matches ConditionFormValues regardless of create/edit mode;
  // the `active` switch is simply not rendered (and not sent) on create.
  const schema = useMemo(() => editConditionFormSchema(t), [t]);
  const labelInputRef = useRef<TextInput>(null);
  const {
    scrollViewRef,
    registerFieldOffset,
    registerFieldInputRef,
    focusFirstInvalidField,
  } = useScrollToFirstError<
    "type" | "alertLevel" | "label" | "description" | "active"
  >();
  registerFieldInputRef("label", labelInputRef);

  const form = useForm<ConditionFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      type: editing?.type ?? "ALLERGY",
      alertLevel: editing?.alertLevel ?? "INFO",
      label: editing?.label ?? "",
      description: editing?.description ?? "",
      active: editing?.active ?? true,
    },
  });

  const FIELD_ORDER: Array<
    "type" | "alertLevel" | "label" | "description" | "active"
  > = ["type", "alertLevel", "label", "description", "active"];

  const handleSave = form.handleSubmit(onSubmit, (errors) =>
    focusFirstInvalidField(FIELD_ORDER, errors),
  );

  return (
    <>
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
              ? t("health.parent.form.hero.editConditionTitle")
              : t("health.parent.form.hero.createConditionTitle")
          }
          subtitle={
            editing
              ? t("health.parent.form.hero.editConditionSubtitle")
              : t("health.parent.form.hero.createConditionSubtitle")
          }
          palette={editing ? "warm" : "teal"}
          testID="sante-condition-form-hero"
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View onLayout={registerFieldOffset("type")}>
          <ChipSelectField
            label={t("health.form.conditionType")}
            options={HEALTH_CONDITION_TYPES.map((type) => ({
              value: type,
              label: conditionTypeLabel(t, type),
            }))}
            value={form.watch("type")}
            onChange={(value) =>
              form.setValue("type", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            testIDPrefix="condition-form-type"
          />
        </View>

        <View onLayout={registerFieldOffset("alertLevel")}>
          <ChipSelectField
            label={t("health.form.alertLevel")}
            options={HEALTH_ALERT_LEVELS.map((level) => ({
              value: level,
              label: alertLevelLabel(t, level),
            }))}
            value={form.watch("alertLevel")}
            onChange={(value) =>
              form.setValue("alertLevel", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            testIDPrefix="condition-form-alertLevel"
          />
        </View>

        <Controller
          control={form.control}
          name="label"
          render={({ field, fieldState }) => (
            <View style={styles.field} onLayout={registerFieldOffset("label")}>
              <Text style={styles.label}>{t("health.form.label")}</Text>
              <TextInput
                ref={labelInputRef}
                style={[styles.input, fieldState.error && styles.inputError]}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder={t("health.form.labelPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                testID="condition-form-label"
              />
              {fieldState.error ? (
                <Text
                  style={styles.formFieldError}
                  testID="condition-form-label-error"
                >
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

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
                testID="condition-form-description"
              />
            </View>
          )}
        />

        {editing ? (
          <Controller
            control={form.control}
            name="active"
            render={({ field }) => (
              <View
                style={styles.switchRow}
                onLayout={registerFieldOffset("active")}
              >
                <Text style={styles.label}>
                  {t("health.parent.form.active")}
                </Text>
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  testID="condition-form-active"
                />
              </View>
            )}
          />
        ) : null}
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.formCancelButton}
          onPress={onCancel}
          testID="condition-form-cancel"
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
          testID="condition-form-submit"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.formSubmitButtonLabel}>
              {t("health.form.submitCondition")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

function ReportFormContent({
  t,
  isSubmitting,
  formError,
  onCancel,
  onSubmit,
}: {
  t: TranslateFn;
  isSubmitting: boolean;
  formError: string | null;
  onCancel: () => void;
  onSubmit: (values: ReportFormValues) => void;
}) {
  const schema = useMemo(() => createReportFormSchema(t), [t]);
  const { scrollViewRef, registerFieldOffset, focusFirstInvalidField } =
    useScrollToFirstError<
      "type" | "alertLevel" | "description" | "sportRestriction"
    >();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      type: "MALADIE",
      alertLevel: "INFO",
      description: "",
      sportRestriction: false,
    },
  });

  const FIELD_ORDER: Array<
    "type" | "alertLevel" | "description" | "sportRestriction"
  > = ["type", "alertLevel", "description", "sportRestriction"];

  const handleSave = form.handleSubmit(onSubmit, (errors) =>
    focusFirstInvalidField(FIELD_ORDER, errors),
  );

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormHero
          icon="add-circle-outline"
          title={t("health.parent.form.hero.createReportTitle")}
          subtitle={t("health.parent.form.hero.createReportSubtitle")}
          palette="teal"
          testID="sante-report-form-hero"
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <View style={styles.field} onLayout={registerFieldOffset("type")}>
          <Text style={styles.label}>{t("health.form.reportType")}</Text>
          <InlineSelectDropDown
            options={HEALTH_REPORT_TYPES.map((type) => ({
              value: type,
              label: reportTypeLabel(t, type),
            }))}
            value={form.watch("type")}
            onChange={(value) =>
              form.setValue("type", value as HealthReportType, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            testID="report-form-type"
          />
        </View>

        <View onLayout={registerFieldOffset("alertLevel")}>
          <ChipSelectField
            label={t("health.form.alertLevel")}
            options={HEALTH_ALERT_LEVELS.map((level) => ({
              value: level,
              label: alertLevelLabel(t, level),
            }))}
            value={form.watch("alertLevel")}
            onChange={(value) =>
              form.setValue("alertLevel", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            testIDPrefix="report-form-alertLevel"
          />
        </View>

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <View
              style={styles.field}
              onLayout={registerFieldOffset("description")}
            >
              <Text style={styles.label}>{t("health.form.description")}</Text>
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
                placeholder={t("health.form.descriptionPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                testID="report-form-description"
              />
              {fieldState.error ? (
                <Text
                  style={styles.formFieldError}
                  testID="report-form-description-error"
                >
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={form.control}
          name="sportRestriction"
          render={({ field }) => (
            <View
              style={styles.switchRow}
              onLayout={registerFieldOffset("sportRestriction")}
            >
              <Text style={styles.label}>
                {t("health.form.sportRestriction")}
              </Text>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                testID="report-form-sportRestriction"
              />
            </View>
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.formCancelButton}
          onPress={onCancel}
          testID="report-form-cancel"
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
          testID="report-form-submit"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.formSubmitButtonLabel}>
              {t("health.form.submitReport")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Detail tab ────────────────────────────────────────────────────────────

function DetailTabContent({
  t,
  detailContext,
  onEditCondition,
}: {
  t: TranslateFn;
  detailContext: DetailContext;
  onEditCondition: () => void;
}) {
  return (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formScrollContent}
      testID="sante-detail-tab"
    >
      {detailContext.type === "condition" ? (
        <ConditionDetail
          t={t}
          item={detailContext.item}
          onEdit={onEditCondition}
        />
      ) : detailContext.type === "care-event" ? (
        <CareEventDetail t={t} item={detailContext.item} />
      ) : (
        <ReportDetail t={t} item={detailContext.item} />
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value}</Text>
    </View>
  );
}

function ConditionDetail({
  t,
  item,
  onEdit,
}: {
  t: TranslateFn;
  item: StudentHealthCondition;
  onEdit: () => void;
}) {
  return (
    <View testID="sante-condition-detail">
      <FormHero
        icon={CONDITION_TYPE_ICONS[item.type]}
        title={item.label}
        subtitle={conditionTypeLabel(t, item.type)}
        palette={item.active ? "teal" : "slate"}
        testID="sante-condition-detail-hero"
      />

      <View style={styles.detailCard}>
        <View style={styles.detailHeaderRow}>
          <AlertLevelIcon level={item.alertLevel} t={t} />
          <Text style={styles.detailHeaderLabel}>
            {alertLevelLabel(t, item.alertLevel)}
          </Text>
        </View>

        <DetailRow
          label={t("health.parent.detail.statusLabel")}
          value={
            item.active
              ? t("health.parent.card.active")
              : t("health.parent.card.inactive")
          }
        />

        {item.description ? (
          <DetailRow
            label={t("health.form.description")}
            value={item.description}
          />
        ) : null}

        <DetailRow
          label={t("health.parent.detail.visibleToTeachers")}
          value={
            item.isVisibleToAllTeachers
              ? t("health.parent.detail.yes")
              : t("health.parent.detail.no")
          }
        />
      </View>

      <TouchableOpacity
        style={styles.detailEditButton}
        onPress={onEdit}
        testID="sante-condition-detail-edit"
      >
        <Ionicons name="create-outline" size={16} color={colors.white} />
        <Text style={styles.detailEditButtonLabel}>
          {t("health.parent.detail.editAction")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CareEventDetail({
  t,
  item,
}: {
  t: TranslateFn;
  item: StudentHealthCareEvent;
}) {
  return (
    <View testID="sante-care-event-detail">
      <FormHero
        icon={HISTORY_ORIGIN_ICONS.CARE_EVENT}
        title={item.summary}
        subtitle={new Date(item.occurredAt).toLocaleString()}
        palette="primary"
        testID="sante-care-event-detail-hero"
      />

      <View style={styles.detailCard}>
        <View style={styles.detailHeaderRow}>
          <AlertLevelIcon level={item.alertLevel} t={t} />
          <Text style={styles.detailHeaderLabel}>
            {alertLevelLabel(t, item.alertLevel)}
          </Text>
        </View>

        {item.description ? (
          <DetailRow
            label={t("health.form.description")}
            value={item.description}
          />
        ) : null}

        <DetailRow
          label={t("health.parent.detail.careBy")}
          value={
            item.authorUser
              ? `${item.authorUser.firstName} ${item.authorUser.lastName}`
              : t("health.parent.detail.origin.school")
          }
        />

        <DetailRow
          label={t("health.parent.detail.followUpNeeded")}
          value={
            item.followUpNeeded
              ? t("health.parent.detail.yes")
              : t("health.parent.detail.no")
          }
        />
      </View>
    </View>
  );
}

function ReportDetail({
  t,
  item,
}: {
  t: TranslateFn;
  item: StudentHealthReport;
}) {
  return (
    <View testID="sante-report-detail">
      <FormHero
        icon={HISTORY_ORIGIN_ICONS.REPORT}
        title={reportTypeLabel(t, item.type)}
        subtitle={new Date(item.createdAt).toLocaleString()}
        palette="warm"
        testID="sante-report-detail-hero"
      />

      <View style={styles.detailCard}>
        <View style={styles.detailHeaderRow}>
          <AlertLevelIcon level={item.alertLevel} t={t} />
          <Text style={styles.detailHeaderLabel}>
            {alertLevelLabel(t, item.alertLevel)}
          </Text>
        </View>

        <DetailRow
          label={t("health.form.description")}
          value={item.description}
        />

        <DetailRow
          label={t("health.parent.detail.reportedBy")}
          value={
            item.reportedByUser
              ? `${item.reportedByUser.firstName} ${item.reportedByUser.lastName}`
              : t("health.parent.detail.origin.parent")
          }
        />

        <DetailRow
          label={t("health.form.sportRestriction")}
          value={
            item.sportRestriction
              ? t("health.parent.detail.yes")
              : t("health.parent.detail.no")
          }
        />

        <DetailRow
          label={t("health.reports.acknowledged")}
          value={
            item.acknowledgedAt
              ? item.acknowledgedByUser
                ? `${item.acknowledgedByUser.firstName} ${item.acknowledgedByUser.lastName}`
                : t("health.parent.detail.yes")
              : t("health.reports.pending")
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabBody: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 96, gap: 8 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterToggleActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}33`,
    backgroundColor: colors.surface,
    gap: 14,
  },
  filterScrollWrapper: { flex: 1, position: "relative" },
  filterScrollArea: { flex: 1 },
  filterScrollContent: { gap: 14, paddingBottom: 12 },
  filterPanelHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterPanelHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.accentTeal}1F`,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPanelHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  filterGroup: { gap: 8 },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    flexBasis: "31%",
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  filterChipLabelActive: { color: colors.white },
  filterActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterActionReset: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionResetLabel: {
    color: colors.warmAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionClose: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionCloseLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionApply: {
    flex: 1.3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 11,
  },
  filterActionApplyLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  alertIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.surface,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconWrap: {
    width: 36,
    height: 36,
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
  inactiveBadge: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  inactiveBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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

  detailCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 10,
  },
  detailHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailHeaderLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  detailRow: { gap: 2 },
  detailRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailRowValue: { fontSize: 14, color: colors.textPrimary },
  detailEditButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accentTeal,
    borderRadius: 6,
    paddingVertical: 12,
  },
  detailEditButtonLabel: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
