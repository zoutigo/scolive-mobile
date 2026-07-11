import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { TranslateFn } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { resourcesApi, resourcesAdminApi } from "../../api/resources.api";
import type { ApiClientError } from "../../api/client";
import { extractApiError } from "../../utils/api-error";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { SelectDropdown, type SelectOption } from "../SelectDropdown";
import { SelectField } from "../tests-admin/SelectField";
import {
  ResourceCard,
  canContributeToResources,
  isResourcePlatformAdmin,
} from "./ResourceCard";
import { ResourceCreationOnboardingModal } from "./ResourceCreationOnboardingModal";
import { moduleBack } from "../../utils/moduleBack";
import type {
  ResourceAdminSubmission,
  ResourceCatalog,
  ResourceDetail,
  ResourceExamType,
  ResourceKind,
  ResourceRow,
  ResourceSchoolOption,
  ResourceSequence,
  UpsertResourcePayload,
} from "../../types/resources.types";

const ONBOARDING_DISMISSED_KEY = "scolive-resources-onboarding-dismissed";

type TabKey =
  | "ASSESSMENT"
  | "EXAM"
  | "mine"
  | "favorites"
  | "moderation"
  | "forms";

type FormContext = {
  type: "create" | "edit";
  kind: ResourceKind;
  originTab: TabKey;
  item: ResourceDetail | null;
};

const SEQUENCE_OPTIONS: SelectOption[] = [
  { value: "SEQ_1", label: "Séquence 1" },
  { value: "SEQ_2", label: "Séquence 2" },
  { value: "SEQ_3", label: "Séquence 3" },
  { value: "SEQ_4", label: "Séquence 4" },
  { value: "SEQ_5", label: "Séquence 5" },
  { value: "SEQ_6", label: "Séquence 6" },
];

function currentAcademicYearLabel(now = new Date()): string {
  const year = now.getFullYear();
  return now.getMonth() >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function academicYearOptions(): SelectOption[] {
  const [startYear] = currentAcademicYearLabel().split("-").map(Number);
  const years: string[] = [];
  for (let offset = -2; offset <= 1; offset += 1) {
    const start = startYear + offset;
    years.push(`${start}-${start + 1}`);
  }
  return years.map((label) => ({ value: label, label }));
}

function examTypeOptions(t: TranslateFn): SelectOption[] {
  return [
    { value: "SEQUENCE_TEST", label: t("resources.examType.sequenceTest") },
    { value: "POP_QUIZ", label: t("resources.examType.popQuiz") },
    { value: "MOCK_EXAM", label: t("resources.examType.mockExam") },
  ];
}

function buildResourceFormSchema(t: TranslateFn, kind: ResourceKind) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, t("resources.form.validation.titleRequired")),
    academicLevelId: z
      .string()
      .trim()
      .min(1, t("resources.form.validation.levelRequired")),
    subjectId: z
      .string()
      .trim()
      .min(1, t("resources.form.validation.subjectRequired")),
    examType: z
      .string()
      .trim()
      .min(1, t("resources.form.validation.examTypeRequired")),
    sequence:
      kind === "ASSESSMENT"
        ? z
            .string()
            .trim()
            .min(1, t("resources.form.validation.sequenceRequired"))
        : z.string(),
    academicYearLabel: z
      .string()
      .trim()
      .min(1, t("resources.form.validation.academicYearRequired")),
  });
}

type ResourceFormValues = {
  title: string;
  academicLevelId: string;
  subjectId: string;
  examType: string;
  sequence: string;
  academicYearLabel: string;
};

export function ResourcesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const memberships = user?.memberships ?? [];
  const activeRole = user?.activeRole ?? null;
  const canSubmit = canContributeToResources(activeRole);
  const isPlatformRole = isResourcePlatformAdmin(activeRole);
  const submitterSchoolId = canSubmit
    ? (memberships.find((m) => m.role === activeRole)?.schoolId ?? null)
    : null;

  const [tab, setTab] = useState<TabKey>("ASSESSMENT");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [catalog, setCatalog] = useState<ResourceCatalog>({
    academicLevels: [],
    subjects: [],
  });
  const [schools, setSchools] = useState<ResourceSchoolOption[]>([]);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedAcademicYear, setAppliedAcademicYear] = useState("");
  const [appliedSchoolId, setAppliedSchoolId] = useState("");
  const [appliedAcademicLevelId, setAppliedAcademicLevelId] = useState("");
  const [appliedSequence, setAppliedSequence] = useState("");
  const [appliedExamType, setAppliedExamType] = useState("");

  const [draftSearch, setDraftSearch] = useState("");
  const [draftAcademicYear, setDraftAcademicYear] = useState("");
  const [draftSchoolId, setDraftSchoolId] = useState("");
  const [draftAcademicLevelId, setDraftAcademicLevelId] = useState("");
  const [draftSequence, setDraftSequence] = useState("");
  const [draftExamType, setDraftExamType] = useState("");

  const hasActiveDraftFilters =
    !!draftSearch ||
    !!draftAcademicYear ||
    !!draftSchoolId ||
    !!draftAcademicLevelId ||
    !!draftSequence ||
    !!draftExamType;

  function openFiltersPanel() {
    setDraftSearch(appliedSearch);
    setDraftAcademicYear(appliedAcademicYear);
    setDraftSchoolId(appliedSchoolId);
    setDraftAcademicLevelId(appliedAcademicLevelId);
    setDraftSequence(appliedSequence);
    setDraftExamType(appliedExamType);
    setFiltersOpen(true);
  }

  function cancelFilters() {
    setFiltersOpen(false);
  }

  function resetDraftFilters() {
    setDraftSearch("");
    setDraftAcademicYear("");
    setDraftSchoolId("");
    setDraftAcademicLevelId("");
    setDraftSequence("");
    setDraftExamType("");
  }

  function applyFilters() {
    setAppliedSearch(draftSearch.trim());
    setAppliedAcademicYear(draftAcademicYear);
    setAppliedSchoolId(draftSchoolId);
    setAppliedAcademicLevelId(draftAcademicLevelId);
    setAppliedSequence(draftSequence);
    setAppliedExamType(draftExamType);
    setFiltersOpen(false);
  }

  const [lists, setLists] = useState<
    Record<Exclude<TabKey, "forms" | "moderation">, ResourceRow[]>
  >({
    ASSESSMENT: [],
    EXAM: [],
    mine: [],
    favorites: [],
  });
  const [moderationPart, setModerationPart] = useState<
    "statement" | "correction"
  >("statement");
  const [moderationItems, setModerationItems] = useState<
    ResourceAdminSubmission[]
  >([]);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [onboardingDontShowAgain, setOnboardingDontShowAgain] = useState(false);

  useEffect(() => {
    resourcesApi
      .getCatalog()
      .then(setCatalog)
      .catch(() => {});
    resourcesApi
      .listSchoolsWithResources()
      .then(setSchools)
      .catch(() => {});
  }, []);

  const loadList = useCallback(
    async (targetTab: Exclude<TabKey, "forms" | "moderation">) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (targetTab === "favorites") {
          const items = await resourcesApi.listFavorites();
          setLists((current) => ({ ...current, favorites: items }));
        } else if (targetTab === "mine") {
          const result = await resourcesApi.listMyResources();
          setLists((current) => ({ ...current, mine: result.items }));
        } else {
          const result = await resourcesApi.listResources({
            kind: targetTab,
            search: appliedSearch || undefined,
            academicYearLabel: appliedAcademicYear || undefined,
            schoolId: appliedSchoolId || undefined,
            academicLevelId: appliedAcademicLevelId || undefined,
            sequence:
              targetTab === "ASSESSMENT" && appliedSequence
                ? (appliedSequence as ResourceSequence)
                : undefined,
            examType: appliedExamType
              ? (appliedExamType as ResourceExamType)
              : undefined,
          });
          setLists((current) => ({ ...current, [targetTab]: result.items }));
        }
      } catch (error) {
        setLoadError(extractApiError(error));
      } finally {
        setIsLoading(false);
      }
    },
    [
      appliedSearch,
      appliedAcademicYear,
      appliedSchoolId,
      appliedAcademicLevelId,
      appliedSequence,
      appliedExamType,
    ],
  );

  const loadModeration = useCallback(
    async (part: "statement" | "correction") => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await resourcesAdminApi.listAdminSubmissions({
          part,
          status: "AWAITING",
        });
        setModerationItems(result.items);
      } catch (error) {
        setLoadError(extractApiError(error));
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (tab === "forms") return;
    if (tab === "moderation") {
      void loadModeration(moderationPart);
      return;
    }
    void loadList(tab);
  }, [tab, moderationPart, loadList, loadModeration]);

  function goToResourcePart(
    resourceId: string,
    part: "statement" | "correction",
  ) {
    router.push({
      pathname: (part === "statement"
        ? "/(home)/resources/[resourceId]/statement"
        : "/(home)/resources/[resourceId]/correction") as never,
      params: { resourceId },
    });
  }

  async function handleEditPress(resource: ResourceRow, originTab: TabKey) {
    try {
      const detail = await resourcesApi.getResource(resource.id);
      openEdit(detail, originTab);
    } catch (error) {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
    }
  }

  async function toggleFavorite(
    resource: ResourceRow,
    listKey: Exclude<TabKey, "forms" | "moderation">,
  ) {
    try {
      if (resource.isFavorite) {
        await resourcesApi.unfavoriteResource(resource.id);
      } else {
        await resourcesApi.favoriteResource(resource.id);
      }
      setLists((current) => ({
        ...current,
        [listKey]: current[listKey].map((r) =>
          r.id === resource.id ? { ...r, isFavorite: !r.isFavorite } : r,
        ),
      }));
      if (listKey !== "favorites" && !resource.isFavorite === false) {
        // no-op, kept simple
      }
    } catch (error) {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
    }
  }

  function enterCreateForm() {
    const kind: ResourceKind = tab === "EXAM" ? "EXAM" : "ASSESSMENT";
    setFormContext({ type: "create", kind, originTab: tab, item: null });
    setTab("forms");
  }

  function openFab() {
    AsyncStorage.getItem(ONBOARDING_DISMISSED_KEY)
      .then((value) => {
        if (value === "true") {
          enterCreateForm();
        } else {
          setOnboardingVisible(true);
        }
      })
      .catch(() => enterCreateForm());
  }

  function closeOnboarding() {
    setOnboardingVisible(false);
    if (onboardingDontShowAgain) {
      void AsyncStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    }
    enterCreateForm();
  }

  function openEdit(resource: ResourceDetail, originTab: TabKey) {
    setFormContext({
      type: "edit",
      kind: resource.kind,
      originTab,
      item: resource,
    });
    setTab("forms");
  }

  function exitForms() {
    const origin = formContext?.originTab ?? "ASSESSMENT";
    setFormContext(null);
    setTab(origin);
  }

  async function submitResourcePayload(
    payload: UpsertResourcePayload,
  ): Promise<void> {
    if (formContext?.type === "edit" && formContext.item) {
      await resourcesApi.updateResource(formContext.item.id, payload);
    } else {
      await resourcesApi.createResource(payload);
    }
  }

  function finishResourceSubmission() {
    showSuccess({
      title: t("resources.toast.successTitle"),
      message: t("resources.toast.successMessage"),
    });
    const originTab = formContext?.originTab ?? "ASSESSMENT";
    setTimeout(() => {
      setFormContext(null);
      setTab(originTab);
    }, 2000);
  }

  async function handleSubmitResource(payload: UpsertResourcePayload) {
    setIsSubmitting(true);
    try {
      await submitResourcePayload(payload);
      finishResourceSubmission();
    } catch (error) {
      const apiError = error as ApiClientError;
      const body = apiError.body as
        | { warning?: boolean; candidates?: Array<{ title: string }> }
        | undefined;
      if (apiError.statusCode === 409 && body?.warning) {
        setIsSubmitting(false);
        Alert.alert(
          t("resources.form.duplicateWarningTitle"),
          t("resources.form.duplicateWarningMessage"),
          [
            { text: t("resources.form.duplicateCancel"), style: "cancel" },
            {
              text: t("resources.form.duplicateConfirm"),
              style: "destructive",
              onPress: () => {
                setIsSubmitting(true);
                submitResourcePayload({ ...payload, confirmDuplicate: true })
                  .then(finishResourceSubmission)
                  .catch((confirmError) =>
                    showError({
                      title: t("resources.toast.errorTitle"),
                      message: extractApiError(confirmError),
                    }),
                  )
                  .finally(() => setIsSubmitting(false));
              },
            },
          ],
        );
        return;
      }
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  }

  async function handleModerationApprove(submissionId: string) {
    try {
      await resourcesAdminApi.approveSubmission(submissionId);
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.moderation.approveSuccess"),
      });
      void loadModeration(moderationPart);
    } catch (error) {
      const apiError = error as ApiClientError;
      showError({
        title: t("resources.toast.errorTitle"),
        message:
          apiError.statusCode === 409
            ? t("resources.moderation.conflictError")
            : extractApiError(error),
      });
      void loadModeration(moderationPart);
    }
  }

  async function handleModerationReject(submissionId: string) {
    try {
      await resourcesAdminApi.rejectSubmission(
        submissionId,
        rejectReasons[submissionId]?.trim() || undefined,
      );
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.moderation.rejectSuccess"),
      });
      setRejectReasons((current) => {
        const next = { ...current };
        delete next[submissionId];
        return next;
      });
      void loadModeration(moderationPart);
    } catch (error) {
      const apiError = error as ApiClientError;
      showError({
        title: t("resources.toast.errorTitle"),
        message:
          apiError.statusCode === 409
            ? t("resources.moderation.conflictError")
            : extractApiError(error),
      });
      void loadModeration(moderationPart);
    }
  }

  const isFormsTab = tab === "forms";

  const tabItems = useMemo(() => {
    const items: Array<{ key: TabKey; label: string }> = [
      { key: "ASSESSMENT", label: t("resources.tabs.assessments") },
      { key: "EXAM", label: t("resources.tabs.exams") },
    ];
    if (canSubmit) {
      items.push({ key: "mine", label: t("resources.tabs.mine") });
    }
    items.push({ key: "favorites", label: t("resources.tabs.favorites") });
    if (isPlatformRole) {
      items.push({ key: "moderation", label: t("resources.tabs.moderation") });
    }
    return items;
  }, [t, canSubmit, isPlatformRole]);

  const headerTitle = t("resources.header.title");
  const isSearchableTab = tab === "ASSESSMENT" || tab === "EXAM";

  const schoolOptions: SelectOption[] = [
    { value: "", label: t("resources.filters.allSchools") },
    ...schools.map((s) => ({ value: s.id, label: s.name })),
  ];
  const levelFilterOptions: SelectOption[] = [
    { value: "", label: t("resources.filters.allLevels") },
    ...catalog.academicLevels.map((l) => ({ value: l.id, label: l.label })),
  ];
  const sequenceFilterOptions: SelectOption[] = [
    { value: "", label: t("resources.filters.allSequences") },
    ...SEQUENCE_OPTIONS,
  ];
  const examTypeFilterOptions: SelectOption[] = [
    { value: "", label: t("resources.filters.allExamTypes") },
    ...examTypeOptions(t),
  ];
  const academicYearFilterOptions: SelectOption[] = [
    { value: "", label: t("resources.filters.allYears") },
    ...academicYearOptions(),
  ];

  return (
    <View style={styles.root} testID="resources-screen">
      <View style={styles.headerWrap}>
        <ModuleHeader
          title={headerTitle}
          onBack={() => (isFormsTab ? exitForms() : moduleBack(router))}
          testID="resources-header"
          backTestID="resources-back-btn"
          topInset={insets.top}
          secondaryAction={
            isSearchableTab && !isFormsTab
              ? {
                  icon: "search-outline",
                  onPress: () =>
                    filtersOpen ? cancelFilters() : openFiltersPanel(),
                  testID: "resources-search-toggle",
                  accessibilityLabel: t("resources.filters.toggleLabel"),
                  active: filtersOpen,
                }
              : undefined
          }
        />
      </View>

      {!isFormsTab ? (
        <UnderlineTabs
          items={tabItems}
          activeKey={tab}
          onSelect={(key) => setTab(key)}
          testIDPrefix="resources-tab"
        />
      ) : null}

      {loadError ? (
        <View style={styles.errorBanner} testID="resources-load-error">
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colors.notification}
          />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      {tab === "moderation" ? (
        <View style={styles.moderationSubTabs}>
          <TouchableOpacity
            style={[
              styles.moderationSubTab,
              moderationPart === "statement" && styles.moderationSubTabActive,
            ]}
            onPress={() => setModerationPart("statement")}
            testID="resources-moderation-part-statement"
          >
            <Text style={styles.moderationSubTabText}>
              {t("resources.status.statement")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.moderationSubTab,
              moderationPart === "correction" && styles.moderationSubTabActive,
            ]}
            onPress={() => setModerationPart("correction")}
            testID="resources-moderation-part-correction"
          >
            <Text style={styles.moderationSubTabText}>
              {t("resources.status.correction")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.body}>
        {isSearchableTab && filtersOpen ? (
          <View style={styles.filterPanel} testID="resources-filter-panel">
            <View style={styles.searchRow}>
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.textSecondary}
              />
              <TextInput
                value={draftSearch}
                onChangeText={setDraftSearch}
                placeholder={t("resources.filters.searchPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                testID="resources-filter-search-input"
              />
            </View>

            <View style={styles.filterFieldRow}>
              <Text style={styles.filterFieldRowLabel}>
                {t("resources.filters.academicYear")}
              </Text>
              <View style={styles.filterFieldInputWrap}>
                <SelectField
                  options={academicYearFilterOptions}
                  value={draftAcademicYear}
                  onChange={setDraftAcademicYear}
                  placeholder={t("resources.filters.allYears")}
                  closeLabel={t("resources.filters.close")}
                  testIDPrefix="resources-filter-academic-year"
                />
              </View>
            </View>

            <View style={styles.filterFieldRow}>
              <Text style={styles.filterFieldRowLabel}>
                {t("resources.filters.school")}
              </Text>
              <View style={styles.filterFieldInputWrap}>
                <SelectField
                  options={schoolOptions}
                  value={draftSchoolId}
                  onChange={setDraftSchoolId}
                  placeholder={t("resources.filters.allSchools")}
                  closeLabel={t("resources.filters.close")}
                  testIDPrefix="resources-filter-school"
                />
              </View>
            </View>

            <View style={styles.filterFieldRow}>
              <Text style={styles.filterFieldRowLabel}>
                {t("resources.filters.level")}
              </Text>
              <View style={styles.filterFieldInputWrap}>
                <SelectField
                  options={levelFilterOptions}
                  value={draftAcademicLevelId}
                  onChange={setDraftAcademicLevelId}
                  placeholder={t("resources.filters.allLevels")}
                  closeLabel={t("resources.filters.close")}
                  testIDPrefix="resources-filter-level"
                />
              </View>
            </View>

            {tab === "ASSESSMENT" ? (
              <View style={styles.filterFieldRow}>
                <Text style={styles.filterFieldRowLabel}>
                  {t("resources.filters.sequence")}
                </Text>
                <View style={styles.filterFieldInputWrap}>
                  <SelectField
                    options={sequenceFilterOptions}
                    value={draftSequence}
                    onChange={setDraftSequence}
                    placeholder={t("resources.filters.allSequences")}
                    closeLabel={t("resources.filters.close")}
                    testIDPrefix="resources-filter-sequence"
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.filterFieldRow}>
              <Text style={styles.filterFieldRowLabel}>
                {t("resources.filters.examType")}
              </Text>
              <View style={styles.filterFieldInputWrap}>
                <SelectField
                  options={examTypeFilterOptions}
                  value={draftExamType}
                  onChange={setDraftExamType}
                  placeholder={t("resources.filters.allExamTypes")}
                  closeLabel={t("resources.filters.close")}
                  testIDPrefix="resources-filter-exam-type"
                />
              </View>
            </View>

            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={[styles.filterActionBtn, styles.filterCancelBtn]}
                onPress={cancelFilters}
                testID="resources-filter-cancel"
              >
                <Text
                  style={[
                    styles.filterActionBtnText,
                    styles.filterCancelBtnText,
                  ]}
                >
                  {t("resources.filters.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterActionBtn,
                  styles.filterResetBtn,
                  !hasActiveDraftFilters && styles.filterResetBtnDisabled,
                ]}
                onPress={resetDraftFilters}
                disabled={!hasActiveDraftFilters}
                testID="resources-filter-reset"
              >
                <Text
                  style={[
                    styles.filterActionBtnText,
                    styles.filterResetBtnText,
                    !hasActiveDraftFilters && styles.filterResetBtnTextDisabled,
                  ]}
                >
                  {t("resources.filters.reset")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterActionBtn, styles.filterApplyBtn]}
                onPress={applyFilters}
                testID="resources-filter-apply"
              >
                <Text
                  style={[
                    styles.filterActionBtnText,
                    styles.filterApplyBtnText,
                  ]}
                >
                  {t("resources.filters.apply")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {isLoading && tab !== "forms" ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}

        {tab === "ASSESSMENT" ||
        tab === "EXAM" ||
        tab === "mine" ||
        tab === "favorites" ? (
          <InfiniteScrollList
            data={lists[tab]}
            keyExtractor={(item) => item.id}
            testID={`resources-list-${tab}`}
            renderItem={({ item }) => (
              <ResourceCard
                resource={item}
                onPressStatement={() => goToResourcePart(item.id, "statement")}
                onPressCorrection={() =>
                  goToResourcePart(item.id, "correction")
                }
                onToggleFavorite={() => toggleFavorite(item, tab)}
                onEdit={
                  tab === "mine" ? () => handleEditPress(item, tab) : undefined
                }
                canContribute={canSubmit}
                showStatuses={tab === "mine"}
                testID={`resources-card-${item.id}`}
              />
            )}
            emptyComponent={
              <Text style={styles.emptyText} testID={`resources-empty-${tab}`}>
                {t("resources.empty.message")}
              </Text>
            }
          />
        ) : null}

        {tab === "moderation" ? (
          <InfiniteScrollList
            data={moderationItems}
            keyExtractor={(item) => item.id}
            testID="resources-moderation-list"
            renderItem={({ item }) => (
              <View
                style={styles.moderationCard}
                testID={`resources-moderation-card-${item.id}`}
              >
                <Text style={styles.moderationResourceTitle}>
                  {item.resource.title}
                </Text>
                <Text style={styles.meta}>
                  {item.resource.subject.name} •{" "}
                  {item.resource.academicLevel.label}
                  {item.resource.school
                    ? ` • ${item.resource.school.name}`
                    : ""}
                </Text>
                <Text
                  style={styles.moderationAuthor}
                  testID={`resources-moderation-author-${item.id}`}
                >
                  {t("resources.moderation.proposedByLabel")}{" "}
                  {item.authorUser.firstName} {item.authorUser.lastName}
                </Text>
                <Text
                  style={styles.moderationContentPreview}
                  numberOfLines={4}
                  testID={`resources-moderation-content-${item.id}`}
                >
                  {item.content
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()}
                </Text>
                <TextInput
                  value={rejectReasons[item.id] ?? ""}
                  onChangeText={(value) =>
                    setRejectReasons((current) => ({
                      ...current,
                      [item.id]: value,
                    }))
                  }
                  placeholder={t(
                    "resources.moderation.rejectReasonPlaceholder",
                  )}
                  placeholderTextColor={colors.textSecondary}
                  style={styles.moderationReasonInput}
                  testID={`resources-moderation-reason-${item.id}`}
                />
                <View style={styles.moderationActions}>
                  <TouchableOpacity
                    style={[styles.moderationBtn, styles.moderationApprove]}
                    onPress={() => handleModerationApprove(item.id)}
                    testID={`resources-moderation-approve-${item.id}`}
                  >
                    <Text style={styles.moderationBtnText}>
                      {t("resources.moderation.approveThis")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moderationBtn, styles.moderationReject]}
                    onPress={() => handleModerationReject(item.id)}
                    testID={`resources-moderation-reject-${item.id}`}
                  >
                    <Text style={styles.moderationBtnText}>
                      {t("resources.moderation.rejectThis")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            emptyComponent={
              <Text
                style={styles.emptyText}
                testID="resources-moderation-empty"
              >
                {t("resources.moderation.empty")}
              </Text>
            }
          />
        ) : null}

        {isFormsTab && formContext ? (
          <ResourceFormContent
            formContext={formContext}
            catalog={catalog}
            submitterSchoolId={submitterSchoolId}
            onSubmit={handleSubmitResource}
            onCancel={exitForms}
            isSubmitting={isSubmitting}
          />
        ) : null}
      </View>

      {canSubmit && !isFormsTab && (tab === "ASSESSMENT" || tab === "EXAM") ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: 20 + BOTTOM_TAB_BAR_HEIGHT }]}
          onPress={openFab}
          testID="resources-fab"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ResourceCreationOnboardingModal
        visible={onboardingVisible}
        dontShowAgain={onboardingDontShowAgain}
        onToggleDontShowAgain={setOnboardingDontShowAgain}
        onClose={closeOnboarding}
      />
    </View>
  );
}

function ResourceFormContent(props: {
  formContext: FormContext;
  catalog: ResourceCatalog;
  submitterSchoolId: string | null;
  onSubmit: (payload: UpsertResourcePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const initialValue = props.formContext.item;
  const kind = props.formContext.kind;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(buildResourceFormSchema(t, kind)),
    defaultValues: {
      title: initialValue?.title ?? "",
      academicLevelId: initialValue?.academicLevelId ?? "",
      subjectId: initialValue?.subjectId ?? "",
      examType: initialValue?.examType ?? "SEQUENCE_TEST",
      sequence: initialValue?.sequence ?? "SEQ_1",
      academicYearLabel:
        initialValue?.academicYearLabel ?? currentAcademicYearLabel(),
    },
  });

  const levelOptions: SelectOption[] = props.catalog.academicLevels.map(
    (l) => ({
      value: l.id,
      label: l.label,
    }),
  );
  const subjectOptions: SelectOption[] = props.catalog.subjects.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const heroTitle =
    props.formContext.type === "edit"
      ? (initialValue?.title ?? t("resources.form.editTitle"))
      : kind === "EXAM"
        ? t("resources.form.createExamHeroTitle")
        : t("resources.form.createAssessmentHeroTitle");

  const handleSave = handleSubmit(async (values) => {
    setErrorMessage(null);
    try {
      const payload: UpsertResourcePayload = {
        kind,
        schoolId:
          kind === "ASSESSMENT"
            ? (props.submitterSchoolId ?? undefined)
            : undefined,
        academicLevelId: values.academicLevelId,
        subjectId: values.subjectId,
        examType: values.examType as ResourceExamType,
        sequence:
          kind === "ASSESSMENT"
            ? (values.sequence as ResourceSequence)
            : undefined,
        academicYearLabel: values.academicYearLabel,
        title: values.title.trim(),
      };
      await props.onSubmit(payload);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    }
  });

  return (
    <View style={styles.formsTabContent} testID="resources-form-tab">
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormHero
          icon={
            props.formContext.type === "edit"
              ? "create-outline"
              : "add-circle-outline"
          }
          title={heroTitle}
          subtitle={
            kind === "ASSESSMENT"
              ? t("resources.form.assessmentHeroSubtitle")
              : t("resources.form.examHeroSubtitle")
          }
          palette="teal"
          testID="resources-form-hero"
        />

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color={colors.notification}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {t("resources.form.titleLabel")}
          </Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder={t("resources.form.titlePlaceholder")}
                style={styles.textInput}
                placeholderTextColor={colors.textSecondary}
                testID="resources-form-title"
              />
            )}
          />
          {errors.title?.message ? (
            <Text style={styles.fieldError} testID="resources-form-title-error">
              {errors.title.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {t("resources.form.levelLabel")}
          </Text>
          <Controller
            control={control}
            name="academicLevelId"
            render={({ field: { value, onChange } }) => (
              <SelectDropdown
                options={levelOptions}
                value={value}
                onChange={onChange}
                placeholder={t("resources.form.levelPlaceholder")}
                hasError={!!errors.academicLevelId}
                testID="resources-form-level"
              />
            )}
          />
          {errors.academicLevelId?.message ? (
            <Text style={styles.fieldError} testID="resources-form-level-error">
              {errors.academicLevelId.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {t("resources.form.subjectLabel")}
          </Text>
          <Controller
            control={control}
            name="subjectId"
            render={({ field: { value, onChange } }) => (
              <SelectDropdown
                options={subjectOptions}
                value={value}
                onChange={onChange}
                placeholder={t("resources.form.subjectPlaceholder")}
                hasError={!!errors.subjectId}
                testID="resources-form-subject"
              />
            )}
          />
          {errors.subjectId?.message ? (
            <Text
              style={styles.fieldError}
              testID="resources-form-subject-error"
            >
              {errors.subjectId.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {t("resources.form.examTypeLabel")}
          </Text>
          <Controller
            control={control}
            name="examType"
            render={({ field: { value, onChange } }) => (
              <SelectDropdown
                options={examTypeOptions(t)}
                value={value}
                onChange={onChange}
                placeholder={t("resources.form.examTypePlaceholder")}
                hasError={!!errors.examType}
                testID="resources-form-exam-type"
              />
            )}
          />
          {errors.examType?.message ? (
            <Text
              style={styles.fieldError}
              testID="resources-form-exam-type-error"
            >
              {errors.examType.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {t("resources.form.academicYearLabel")}
          </Text>
          <Controller
            control={control}
            name="academicYearLabel"
            render={({ field: { value, onChange } }) => (
              <SelectDropdown
                options={academicYearOptions()}
                value={value}
                onChange={onChange}
                placeholder={t("resources.form.academicYearPlaceholder")}
                hasError={!!errors.academicYearLabel}
                testID="resources-form-academic-year"
              />
            )}
          />
          {errors.academicYearLabel?.message ? (
            <Text
              style={styles.fieldError}
              testID="resources-form-academic-year-error"
            >
              {errors.academicYearLabel.message}
            </Text>
          ) : null}
        </View>

        {kind === "ASSESSMENT" ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("resources.form.sequenceLabel")}
            </Text>
            <Controller
              control={control}
              name="sequence"
              render={({ field: { value, onChange } }) => (
                <SelectDropdown
                  options={SEQUENCE_OPTIONS}
                  value={value}
                  onChange={onChange}
                  placeholder={t("resources.form.sequencePlaceholder")}
                  hasError={!!errors.sequence}
                  testID="resources-form-sequence"
                />
              )}
            />
            {errors.sequence?.message ? (
              <Text
                style={styles.fieldError}
                testID="resources-form-sequence-error"
              >
                {errors.sequence.message}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.formActionsBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={props.onCancel}
          testID="resources-form-cancel"
        >
          <Text style={styles.cancelBtnText}>
            {t("resources.common.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            props.isSubmitting && styles.submitBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={props.isSubmitting}
          testID="resources-form-submit"
        >
          {props.isSubmitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {t("resources.common.submit")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerWrap: {},
  body: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  loader: { marginTop: 24 },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: 40,
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.notification },
  filterPanel: {
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: "#E0D0BA",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  filterFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filterFieldRowLabel: {
    width: 128,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    flexShrink: 0,
  },
  filterFieldInputWrap: { flex: 1 },
  filterActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
  },
  filterActionBtn: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1.5,
  },
  filterActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  filterCancelBtn: {
    backgroundColor: colors.surface,
    borderColor: "#E0D0BA",
  },
  filterCancelBtnText: {
    color: colors.textSecondary,
  },
  filterResetBtn: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  filterResetBtnDisabled: {
    borderColor: "#E0D0BA",
  },
  filterResetBtnText: {
    color: colors.primary,
  },
  filterResetBtnTextDisabled: {
    color: colors.textSecondary,
  },
  filterApplyBtn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  filterApplyBtnText: {
    color: colors.white,
  },
  moderationSubTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  moderationSubTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
  },
  moderationSubTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  moderationSubTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  moderationCard: {
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 14,
    gap: 6,
  },
  moderationResourceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moderationAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  moderationContentPreview: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  moderationReasonInput: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  moderationActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: -4,
    marginBottom: 8,
  },
  moderationBtn: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  moderationApprove: { backgroundColor: colors.accentTeal },
  moderationReject: { backgroundColor: colors.notification },
  moderationBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  formsTabContent: { flex: 1 },
  formsKeyboardArea: { flex: 1 },
  formScroll: { flex: 1 },
  formScrollContent: { padding: 16, gap: 16 },
  formActionsBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  fieldGroup: { gap: 6, marginBottom: 4 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  fieldError: {
    fontSize: 12,
    color: colors.notification,
  },
  addAttachmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  addAttachmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  attachmentsList: { gap: 6, marginTop: 8 },
  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  attachmentText: { flex: 1, fontSize: 12, color: colors.textPrimary },
  cancelBtn: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  submitBtn: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontWeight: "700", color: colors.white },
});
