import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useFocusEffect } from "@react-navigation/native";
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
import {
  InlineSelectDropDown,
  type InlineSelectDropDownOption,
} from "../InlineSelectDropDown";
import { InlineSearchSelect } from "../InlineSearchSelect";
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
  ResourceSchoolSearchOption,
  ResourceSequence,
  UpsertResourcePayload,
} from "../../types/resources.types";

const ONBOARDING_DISMISSED_KEY = "scolive-resources-onboarding-dismissed";
const SEARCH_DEBOUNCE_MS = 300;
const RESOURCES_PAGE_SIZE = 20;

type PaginatedTabKey = "ASSESSMENT" | "EXAM";

type ResourceListMeta = {
  page: number;
  limit: number;
  total: number;
};

type ResourceFilters = {
  academicYear: string;
  schoolId: string;
  academicLevelId: string;
  sequence: string;
  examType: string;
};

const NO_FILTERS: ResourceFilters = {
  academicYear: "",
  schoolId: "",
  academicLevelId: "",
  sequence: "",
  examType: "",
};

function hasActiveFilters(filters: ResourceFilters) {
  return (
    !!filters.academicYear ||
    !!filters.schoolId ||
    !!filters.academicLevelId ||
    !!filters.sequence ||
    !!filters.examType
  );
}

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

const SEQUENCE_OPTIONS: InlineSelectDropDownOption[] = [
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

function academicYearOptions(): InlineSelectDropDownOption[] {
  const [startYear] = currentAcademicYearLabel().split("-").map(Number);
  const years: string[] = [];
  for (let offset = -2; offset <= 1; offset += 1) {
    const start = startYear + offset;
    years.push(`${start}-${start + 1}`);
  }
  return years.map((label) => ({ value: label, label }));
}

function examTypeOptions(t: TranslateFn): InlineSelectDropDownOption[] {
  return [
    { value: "SEQUENCE_TEST", label: t("resources.examType.sequenceTest") },
    { value: "POP_QUIZ", label: t("resources.examType.popQuiz") },
    { value: "MOCK_EXAM", label: t("resources.examType.mockExam") },
  ];
}

function buildResourceFormSchema(
  t: TranslateFn,
  kind: ResourceKind,
  levelIdsWithTracks: Set<string>,
) {
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(1, t("resources.form.validation.titleRequired")),
      schoolId:
        kind === "ASSESSMENT"
          ? z
              .string()
              .trim()
              .min(1, t("resources.form.validation.schoolRequired"))
          : z.string(),
      cycleId: z
        .string()
        .trim()
        .min(1, t("resources.form.validation.cycleRequired")),
      academicLevelId: z
        .string()
        .trim()
        .min(1, t("resources.form.validation.levelRequired")),
      trackId: z.string(),
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
    })
    .superRefine((values, ctx) => {
      if (
        levelIdsWithTracks.has(values.academicLevelId) &&
        !values.trackId.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trackId"],
          message: t("resources.form.validation.trackRequired"),
        });
      }
    });
}

type ResourceFormValues = {
  title: string;
  schoolId: string;
  cycleId: string;
  academicLevelId: string;
  trackId: string;
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

  const activeRole = user?.activeRole ?? null;
  const canSubmit = canContributeToResources(activeRole);
  const isPlatformRole = isResourcePlatformAdmin(activeRole);

  const [tab, setTab] = useState<TabKey>("ASSESSMENT");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [catalog, setCatalog] = useState<ResourceCatalog>({
    cycles: [],
    academicLevels: [],
    tracks: [],
    curriculums: [],
    curriculumSubjects: [],
    subjects: [],
  });
  const [schools, setSchools] = useState<ResourceSchoolOption[]>([]);
  const [formSchools, setFormSchools] = useState<ResourceSchoolSearchOption[]>(
    [],
  );
  const [formSchoolsLoading, setFormSchoolsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ResourceFilters>(NO_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ResourceFilters>(NO_FILTERS);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  function openFilters() {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  }

  function closeFilters() {
    setDraftFilters(appliedFilters);
    setFiltersOpen(false);
  }

  function toggleFilters() {
    if (filtersOpen) closeFilters();
    else openFilters();
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  }

  function resetFilters() {
    setDraftFilters(NO_FILTERS);
    setAppliedFilters(NO_FILTERS);
  }

  const [lists, setLists] = useState<
    Record<Exclude<TabKey, "forms" | "moderation">, ResourceRow[]>
  >({
    ASSESSMENT: [],
    EXAM: [],
    mine: [],
    favorites: [],
  });
  const [listMeta, setListMeta] = useState<
    Record<PaginatedTabKey, ResourceListMeta | null>
  >({ ASSESSMENT: null, EXAM: null });
  const [isLoadingMore, setIsLoadingMore] = useState<
    Record<PaginatedTabKey, boolean>
  >({ ASSESSMENT: false, EXAM: false });
  const [moderationPart, setModerationPart] = useState<
    "statement" | "correction"
  >("statement");
  const [moderationItems, setModerationItems] = useState<
    ResourceAdminSubmission[]
  >([]);
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
    resourcesApi
      .searchSchools()
      .then(setFormSchools)
      .catch(() => {})
      .finally(() => setFormSchoolsLoading(false));
  }, []);

  const loadList = useCallback(
    async (
      targetTab: Exclude<TabKey, "forms" | "moderation">,
      page: number,
      mode: "reset" | "append" = "reset",
    ) => {
      const isPaginated = targetTab === "ASSESSMENT" || targetTab === "EXAM";
      if (isPaginated && mode === "append") {
        setIsLoadingMore((current) => ({
          ...current,
          [targetTab as PaginatedTabKey]: true,
        }));
      } else {
        setIsLoading(true);
      }
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
            academicYearLabel: appliedFilters.academicYear || undefined,
            schoolId: appliedFilters.schoolId || undefined,
            academicLevelId: appliedFilters.academicLevelId || undefined,
            sequence:
              targetTab === "ASSESSMENT" && appliedFilters.sequence
                ? (appliedFilters.sequence as ResourceSequence)
                : undefined,
            examType: appliedFilters.examType
              ? (appliedFilters.examType as ResourceExamType)
              : undefined,
            page,
            limit: RESOURCES_PAGE_SIZE,
          });
          setLists((current) => ({
            ...current,
            [targetTab]:
              mode === "append"
                ? [...current[targetTab], ...result.items]
                : result.items,
          }));
          setListMeta((current) => ({
            ...current,
            [targetTab]: {
              page: result.page,
              limit: result.limit,
              total: result.total,
            },
          }));
        }
      } catch (error) {
        setLoadError(extractApiError(error));
      } finally {
        if (isPaginated && mode === "append") {
          setIsLoadingMore((current) => ({
            ...current,
            [targetTab as PaginatedTabKey]: false,
          }));
        } else {
          setIsLoading(false);
        }
      }
    },
    [appliedSearch, appliedFilters],
  );

  const handleLoadMoreResources = useCallback(
    (targetTab: PaginatedTabKey) => {
      const meta = listMeta[targetTab];
      if (!meta) return;
      if (isLoadingMore[targetTab]) return;
      const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
      if (meta.page >= totalPages) return;
      void loadList(targetTab, meta.page + 1, "append");
    },
    [listMeta, isLoadingMore, loadList],
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
    if (tab === "forms" || tab === "moderation") return;
    void loadList(tab, 1, "reset");
  }, [tab, loadList]);

  useFocusEffect(
    useCallback(() => {
      if (tab === "moderation") {
        void loadModeration(moderationPart);
      }
    }, [tab, moderationPart, loadModeration]),
  );

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

  const isFormsTab = tab === "forms";

  const tabItems = useMemo(() => {
    const items: Array<{ key: TabKey; label: string }> = [
      { key: "ASSESSMENT", label: t("resources.tabs.assessments") },
      { key: "EXAM", label: t("resources.tabs.exams") },
    ];
    if (canSubmit) {
      items.push({ key: "mine", label: t("resources.tabs.mine") });
    }
    if (!isPlatformRole) {
      items.push({ key: "favorites", label: t("resources.tabs.favorites") });
    }
    if (isPlatformRole) {
      items.push({ key: "moderation", label: t("resources.tabs.moderation") });
    }
    return items;
  }, [t, canSubmit, isPlatformRole]);

  const headerTitle = t("resources.header.title");
  const isSearchableTab = tab === "ASSESSMENT" || tab === "EXAM";

  const schoolOptions: InlineSelectDropDownOption[] = [
    { value: "", label: t("resources.filters.allSchools") },
    ...schools.map((s) => ({ value: s.id, label: s.name })),
  ];
  const levelFilterOptions: InlineSelectDropDownOption[] = [
    { value: "", label: t("resources.filters.allLevels") },
    ...catalog.academicLevels.map((l) => ({ value: l.id, label: l.label })),
  ];
  const sequenceFilterOptions: InlineSelectDropDownOption[] = [
    { value: "", label: t("resources.filters.allSequences") },
    ...SEQUENCE_OPTIONS,
  ];
  const examTypeFilterOptions: InlineSelectDropDownOption[] = [
    { value: "", label: t("resources.filters.allExamTypes") },
    ...examTypeOptions(t),
  ];
  const academicYearFilterOptions: InlineSelectDropDownOption[] = [
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
        {isSearchableTab && !isFormsTab ? (
          <View style={styles.searchRow} testID="resources-search-row">
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder={t("resources.filters.searchPlaceholder")}
                placeholderTextColor={colors.textSecondary}
                returnKeyType="search"
                autoCapitalize="none"
                accessibilityLabel={t("resources.filters.searchPlaceholder")}
                testID="resources-search-input"
              />
              {searchInput.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchInput("")}
                  testID="resources-search-clear"
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
                hasActiveFilters(appliedFilters) && styles.filterToggleActive,
              ]}
              onPress={toggleFilters}
              testID="resources-filter-toggle"
              accessibilityLabel={t("resources.filters.toggleLabel")}
            >
              <Ionicons
                name={
                  hasActiveFilters(appliedFilters) ? "filter" : "filter-outline"
                }
                size={18}
                color={
                  hasActiveFilters(appliedFilters)
                    ? colors.white
                    : colors.accentTeal
                }
              />
            </TouchableOpacity>
          </View>
        ) : null}

        {isSearchableTab && filtersOpen ? (
          <View style={styles.filterPanel} testID="resources-filter-panel">
            <View style={styles.filterPanelHeader}>
              <View style={styles.filterPanelHeaderIcon}>
                <Ionicons
                  name="options-outline"
                  size={16}
                  color={colors.accentTealDark}
                />
              </View>
              <Text style={styles.filterPanelHeaderTitle}>
                {t("resources.filters.toggleLabel")}
              </Text>
            </View>

            <View style={styles.filterFieldRow}>
              <Text style={styles.filterFieldRowLabel}>
                {t("resources.filters.academicYear")}
              </Text>
              <View style={styles.filterFieldInputWrap}>
                <SelectField
                  options={academicYearFilterOptions}
                  value={draftFilters.academicYear}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      academicYear: value,
                    }))
                  }
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
                  value={draftFilters.schoolId}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      schoolId: value,
                    }))
                  }
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
                  value={draftFilters.academicLevelId}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      academicLevelId: value,
                    }))
                  }
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
                    value={draftFilters.sequence}
                    onChange={(value) =>
                      setDraftFilters((current) => ({
                        ...current,
                        sequence: value,
                      }))
                    }
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
                  value={draftFilters.examType}
                  onChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      examType: value,
                    }))
                  }
                  placeholder={t("resources.filters.allExamTypes")}
                  closeLabel={t("resources.filters.close")}
                  testIDPrefix="resources-filter-exam-type"
                />
              </View>
            </View>

            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={[
                  styles.filterActionReset,
                  !hasActiveFilters(draftFilters) &&
                    styles.filterActionResetDisabled,
                ]}
                onPress={resetFilters}
                disabled={!hasActiveFilters(draftFilters)}
                testID="resources-filter-reset"
              >
                <Text
                  style={[
                    styles.filterActionResetLabel,
                    !hasActiveFilters(draftFilters) &&
                      styles.filterActionResetLabelDisabled,
                  ]}
                >
                  {t("resources.filters.reset")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterActionClose}
                onPress={closeFilters}
                testID="resources-filter-close"
              >
                <Text style={styles.filterActionCloseLabel}>
                  {t("resources.filters.close")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterActionApply}
                onPress={applyFilters}
                testID="resources-filter-apply"
              >
                <Ionicons name="checkmark" size={15} color={colors.white} />
                <Text style={styles.filterActionApplyLabel}>
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
                onToggleFavorite={
                  isPlatformRole ? undefined : () => toggleFavorite(item, tab)
                }
                onEdit={
                  tab === "mine" ? () => handleEditPress(item, tab) : undefined
                }
                canContribute={canSubmit}
                showStatuses={tab === "mine"}
                testID={`resources-card-${item.id}`}
              />
            )}
            onLoadMore={
              tab === "ASSESSMENT" || tab === "EXAM"
                ? () => handleLoadMoreResources(tab)
                : undefined
            }
            hasMore={
              tab === "ASSESSMENT" || tab === "EXAM"
                ? (() => {
                    const meta = listMeta[tab];
                    if (!meta) return false;
                    return (
                      meta.page <
                      Math.max(1, Math.ceil(meta.total / meta.limit))
                    );
                  })()
                : false
            }
            isLoadingMore={
              tab === "ASSESSMENT" || tab === "EXAM"
                ? isLoadingMore[tab]
                : false
            }
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
              <TouchableOpacity
                style={styles.moderationCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname:
                      "/(home)/resources/moderation/[submissionId]" as never,
                    params: {
                      submissionId: item.id,
                      resourceId: item.resourceId,
                      part: moderationPart,
                    },
                  })
                }
                testID={`resources-moderation-card-${item.id}`}
              >
                <View style={styles.moderationCardMain}>
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
                    numberOfLines={2}
                    testID={`resources-moderation-content-${item.id}`}
                  >
                    {item.content
                      .replace(/<[^>]*>/g, " ")
                      .replace(/\s+/g, " ")
                      .trim()}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
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
            schools={formSchools}
            schoolsLoading={formSchoolsLoading}
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
  schools: ResourceSchoolSearchOption[];
  schoolsLoading: boolean;
  onSubmit: (payload: UpsertResourcePayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const initialValue = props.formContext.item;
  const kind = props.formContext.kind;
  const requiresSchool = kind === "ASSESSMENT";

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const levelIdsWithTracks = useMemo(
    () =>
      new Set(
        props.catalog.curriculums
          .filter((c) => c.trackId)
          .map((c) => c.academicLevelId),
      ),
    [props.catalog.curriculums],
  );

  const initialCycleId =
    props.catalog.academicLevels.find(
      (l) => l.id === initialValue?.academicLevelId,
    )?.cycleId ?? "";

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(buildResourceFormSchema(t, kind, levelIdsWithTracks)),
    defaultValues: {
      title: initialValue?.title ?? "",
      schoolId: initialValue?.schoolId ?? "",
      cycleId: initialCycleId,
      academicLevelId: initialValue?.academicLevelId ?? "",
      trackId: initialValue?.trackId ?? "",
      subjectId: initialValue?.subjectId ?? "",
      examType: initialValue?.examType ?? "SEQUENCE_TEST",
      sequence: initialValue?.sequence ?? "SEQ_1",
      academicYearLabel:
        initialValue?.academicYearLabel ?? currentAcademicYearLabel(),
    },
  });

  const selectedSchoolId = watch("schoolId");
  const selectedCycleId = watch("cycleId");
  const selectedLevelId = watch("academicLevelId");
  const selectedTrackId = watch("trackId");

  // Le lot initial (top 50 par nom) ne couvre pas les 300+ écoles de la
  // plateforme : on enrichit ce pool avec les résultats de recherche serveur
  // au fil de la frappe, sans jamais perdre l'école déjà sélectionnée.
  const [extraSchools, setExtraSchools] = useState<
    ResourceSchoolSearchOption[]
  >([]);
  const schoolSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const schoolPool: ResourceSchoolSearchOption[] = useMemo(() => {
    const byId = new Map<string, ResourceSchoolSearchOption>();
    for (const s of props.schools) byId.set(s.id, s);
    for (const s of extraSchools) byId.set(s.id, s);
    if (
      initialValue?.schoolId &&
      initialValue.school &&
      !byId.has(initialValue.schoolId)
    ) {
      byId.set(initialValue.schoolId, {
        id: initialValue.schoolId,
        name: initialValue.school.name,
        cycle: null,
        languageSystem: null,
      });
    }
    return Array.from(byId.values());
  }, [props.schools, extraSchools, initialValue]);

  const selectedSchool = schoolPool.find((s) => s.id === selectedSchoolId);
  const schoolOptions: InlineSelectDropDownOption[] = schoolPool.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  function handleSchoolQueryChange(query: string) {
    if (schoolSearchDebounceRef.current) {
      clearTimeout(schoolSearchDebounceRef.current);
    }
    schoolSearchDebounceRef.current = setTimeout(() => {
      resourcesApi
        .searchSchools(query || undefined)
        .then(setExtraSchools)
        .catch(() => {});
    }, 300);
  }

  useEffect(() => {
    if (!requiresSchool) return;
    if (!selectedSchool || !selectedSchool.cycle) return;
    const resolvedCycleId =
      props.catalog.cycles.find((c) => c.code === selectedSchool.cycle)?.id ??
      "";
    if (resolvedCycleId && resolvedCycleId !== selectedCycleId) {
      setValue("cycleId", resolvedCycleId);
      setValue("academicLevelId", "");
      setValue("trackId", "");
      setValue("subjectId", "");
    }
  }, [requiresSchool, selectedSchool, props.catalog.cycles]);

  const cycleOptions: InlineSelectDropDownOption[] = props.catalog.cycles.map(
    (c) => ({ value: c.id, label: c.label }),
  );
  const levelOptions: InlineSelectDropDownOption[] =
    props.catalog.academicLevels
      .filter((l) => !selectedCycleId || l.cycleId === selectedCycleId)
      .filter(
        (l) =>
          !requiresSchool ||
          !selectedSchool?.languageSystem ||
          selectedSchool.languageSystem === "BILINGUAL" ||
          !l.languageSystem ||
          l.languageSystem === selectedSchool.languageSystem,
      )
      .map((l) => ({ value: l.id, label: l.label }));

  const trackIdsForLevel = new Set(
    props.catalog.curriculums
      .filter((c) => c.academicLevelId === selectedLevelId && c.trackId)
      .map((c) => c.trackId as string),
  );
  const levelHasTracks = trackIdsForLevel.size > 0;
  const trackOptions: InlineSelectDropDownOption[] = props.catalog.tracks
    .filter((tr) => trackIdsForLevel.has(tr.id))
    .map((tr) => ({ value: tr.id, label: tr.label }));

  const resolvedCurriculum = props.catalog.curriculums.find(
    (c) =>
      c.academicLevelId === selectedLevelId &&
      c.trackId === (levelHasTracks ? selectedTrackId || null : null),
  );
  const subjectIdsForCurriculum = resolvedCurriculum
    ? new Set(
        props.catalog.curriculumSubjects
          .filter((cs) => cs.curriculumId === resolvedCurriculum.id)
          .map((cs) => cs.subjectId),
      )
    : new Set<string>();
  const subjectOptions: InlineSelectDropDownOption[] = props.catalog.subjects
    .filter((s) => subjectIdsForCurriculum.has(s.id))
    .map((s) => ({
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
        schoolId: kind === "ASSESSMENT" ? values.schoolId : undefined,
        academicLevelId: values.academicLevelId,
        trackId: levelHasTracks ? values.trackId || undefined : undefined,
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

        {requiresSchool ? (
          <View style={styles.fieldGroup}>
            <Controller
              control={control}
              name="schoolId"
              render={({ field: { value, onChange } }) => (
                <InlineSearchSelect
                  label={t("resources.form.schoolLabel")}
                  options={schoolOptions}
                  value={value}
                  onChange={(next) => {
                    onChange(next);
                    setValue("academicLevelId", "");
                    setValue("trackId", "");
                    setValue("subjectId", "");
                  }}
                  placeholder={
                    props.schoolsLoading
                      ? t("resources.form.schoolLoading")
                      : t("resources.form.schoolPlaceholder")
                  }
                  loading={props.schoolsLoading}
                  onQueryChange={handleSchoolQueryChange}
                  hasError={!!errors.schoolId}
                  testID="resources-form-school"
                />
              )}
            />
            {errors.schoolId?.message ? (
              <Text
                style={styles.fieldError}
                testID="resources-form-school-error"
              >
                {errors.schoolId.message}
              </Text>
            ) : null}
            {!errors.schoolId?.message &&
            selectedSchool &&
            !selectedSchool.cycle ? (
              <Text
                style={styles.fieldError}
                testID="resources-form-school-no-cycle-error"
              >
                {t("resources.form.validation.schoolCycleMissing")}
              </Text>
            ) : null}
          </View>
        ) : null}

        {!requiresSchool ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("resources.form.cycleLabel")}
            </Text>
            <Controller
              control={control}
              name="cycleId"
              render={({ field: { value, onChange } }) => (
                <InlineSelectDropDown
                  options={cycleOptions}
                  value={value}
                  onChange={(next) => {
                    onChange(next);
                    setValue("academicLevelId", "");
                    setValue("trackId", "");
                    setValue("subjectId", "");
                  }}
                  placeholder={t("resources.form.cyclePlaceholder")}
                  hasError={!!errors.cycleId}
                  testID="resources-form-cycle"
                />
              )}
            />
            {errors.cycleId?.message ? (
              <Text
                style={styles.fieldError}
                testID="resources-form-cycle-error"
              >
                {errors.cycleId.message}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {t("resources.form.levelLabel")}
          </Text>
          <Controller
            control={control}
            name="academicLevelId"
            render={({ field: { value, onChange } }) => (
              <InlineSelectDropDown
                options={levelOptions}
                value={value}
                onChange={(next) => {
                  onChange(next);
                  setValue("trackId", "");
                  setValue("subjectId", "");
                }}
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

        {levelHasTracks ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("resources.form.trackLabel")}
            </Text>
            <Controller
              control={control}
              name="trackId"
              render={({ field: { value, onChange } }) => (
                <InlineSelectDropDown
                  options={trackOptions}
                  value={value}
                  onChange={(next) => {
                    onChange(next);
                    setValue("subjectId", "");
                  }}
                  placeholder={t("resources.form.trackPlaceholder")}
                  hasError={!!errors.trackId}
                  testID="resources-form-track"
                />
              )}
            />
            {errors.trackId?.message ? (
              <Text
                style={styles.fieldError}
                testID="resources-form-track-error"
              >
                {errors.trackId.message}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {t("resources.form.subjectLabel")}
          </Text>
          <Controller
            control={control}
            name="subjectId"
            render={({ field: { value, onChange } }) => (
              <InlineSelectDropDown
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
              <InlineSelectDropDown
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
              <InlineSelectDropDown
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
                <InlineSelectDropDown
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
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
    marginBottom: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}33`,
    backgroundColor: colors.surface,
    gap: 14,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
  filterActionResetDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterActionResetLabel: {
    color: colors.warmAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionResetLabelDisabled: {
    color: colors.textSecondary,
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
    backgroundColor: colors.accentTeal,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  moderationCardMain: { flex: 1, gap: 6 },
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
