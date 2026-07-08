import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useTranslation } from "../../i18n/useTranslation";
import type { TranslateFn } from "../../i18n/useTranslation";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { resourcesApi, resourcesAdminApi } from "../../api/resources.api";
import { extractApiError } from "../../utils/api-error";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { SelectDropdown, type SelectOption } from "../SelectDropdown";
import { RichEditorField, type RichEditorFieldRef } from "../editor/RichEditorField";
import { ResourceCard } from "./ResourceCard";
import { moduleBack } from "../../utils/moduleBack";
import type {
  ResourceAttachment,
  ResourceCatalog,
  ResourceDetail,
  ResourceExamType,
  ResourceKind,
  ResourceRow,
  ResourceSequence,
  UpsertResourcePayload,
} from "../../types/resources.types";

type TabKey = "ASSESSMENT" | "EXAM" | "mine" | "favorites" | "moderation" | "forms";

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

function examTypeOptions(t: TranslateFn): SelectOption[] {
  return [
    { value: "SEQUENCE_TEST", label: t("resources.examType.sequenceTest") },
    { value: "POP_QUIZ", label: t("resources.examType.popQuiz") },
    { value: "MOCK_EXAM", label: t("resources.examType.mockExam") },
  ];
}

function buildResourceFormSchema(t: TranslateFn, kind: ResourceKind) {
  return z.object({
    title: z.string().trim().min(1, t("resources.form.validation.titleRequired")),
    academicLevelId: z
      .string()
      .trim()
      .min(1, t("resources.form.validation.levelRequired")),
    subjectId: z
      .string()
      .trim()
      .min(1, t("resources.form.validation.subjectRequired")),
    examType: z.string().trim().min(1, t("resources.form.validation.examTypeRequired")),
    sequence:
      kind === "ASSESSMENT"
        ? z.string().trim().min(1, t("resources.form.validation.sequenceRequired"))
        : z.string(),
  });
}

type ResourceFormValues = {
  title: string;
  academicLevelId: string;
  subjectId: string;
  examType: string;
  sequence: string;
};

export function ResourcesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const memberships = user?.memberships ?? [];
  const canSubmit = memberships.some(
    (m) => m.role === "TEACHER" || m.role === "SCHOOL_ADMIN",
  );
  const isPlatformRole = (user?.platformRoles?.length ?? 0) > 0;
  const submitterSchoolId =
    memberships.find((m) => m.role === "TEACHER" || m.role === "SCHOOL_ADMIN")
      ?.schoolId ?? null;

  const [tab, setTab] = useState<TabKey>("ASSESSMENT");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [catalog, setCatalog] = useState<ResourceCatalog>({
    academicLevels: [],
    subjects: [],
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<ResourceDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [lists, setLists] = useState<
    Record<Exclude<TabKey, "forms" | "moderation">, ResourceRow[]>
  >({
    ASSESSMENT: [],
    EXAM: [],
    mine: [],
    favorites: [],
  });
  const [moderationPart, setModerationPart] = useState<"statement" | "correction">(
    "statement",
  );
  const [moderationItems, setModerationItems] = useState<ResourceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    resourcesApi.getCatalog().then(setCatalog).catch(() => {});
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
          const result = await resourcesApi.listResources({ kind: targetTab });
          setLists((current) => ({ ...current, [targetTab]: result.items }));
        }
      } catch (error) {
        setLoadError(extractApiError(error));
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loadModeration = useCallback(
    async (part: "statement" | "correction") => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await resourcesAdminApi.listAdminResources({
          part,
          status: "PENDING",
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

  async function toggleExpand(resource: ResourceRow) {
    if (expandedId === resource.id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(resource.id);
    setIsLoadingDetail(true);
    try {
      const detail = await resourcesApi.getResource(resource.id);
      setExpandedDetail(detail);
    } catch (error) {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
      setExpandedId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function toggleFavorite(resource: ResourceRow, listKey: Exclude<TabKey, "forms" | "moderation">) {
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

  function openFab() {
    const kind: ResourceKind = tab === "EXAM" ? "EXAM" : "ASSESSMENT";
    setFormContext({ type: "create", kind, originTab: tab, item: null });
    setTab("forms");
  }

  function openEdit(resource: ResourceDetail, originTab: TabKey) {
    setFormContext({ type: "edit", kind: resource.kind, originTab, item: resource });
    setTab("forms");
  }

  function exitForms() {
    const origin = formContext?.originTab ?? "ASSESSMENT";
    setFormContext(null);
    setTab(origin);
  }

  async function handleSubmitResource(payload: UpsertResourcePayload) {
    setIsSubmitting(true);
    try {
      if (formContext?.type === "edit" && formContext.item) {
        await resourcesApi.updateResource(formContext.item.id, payload);
      } else {
        await resourcesApi.createResource(payload);
      }
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.toast.successMessage"),
      });
      const originTab = formContext?.originTab ?? "ASSESSMENT";
      setTimeout(() => {
        setFormContext(null);
        setTab(originTab);
      }, 2000);
    } catch (error) {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleModerationAction(
    resourceId: string,
    action: "approve" | "reject" | "revoke",
  ) {
    try {
      if (moderationPart === "statement") {
        if (action === "approve") await resourcesAdminApi.approveStatement(resourceId);
        else if (action === "reject") await resourcesAdminApi.rejectStatement(resourceId);
        else await resourcesAdminApi.revokeStatement(resourceId);
      } else {
        if (action === "approve") await resourcesAdminApi.approveCorrection(resourceId);
        else if (action === "reject") await resourcesAdminApi.rejectCorrection(resourceId);
        else await resourcesAdminApi.revokeCorrection(resourceId);
      }
      showSuccess({
        title: t("resources.toast.successTitle"),
        message: t("resources.moderation.actionSuccess"),
      });
      void loadModeration(moderationPart);
    } catch (error) {
      showError({
        title: t("resources.toast.errorTitle"),
        message: extractApiError(error),
      });
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
          <Ionicons name="alert-circle-outline" size={16} color={colors.notification} />
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
        {isLoading && tab !== "forms" ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : null}

        {tab === "ASSESSMENT" || tab === "EXAM" || tab === "mine" || tab === "favorites" ? (
          <InfiniteScrollList
            data={lists[tab]}
            keyExtractor={(item) => item.id}
            testID={`resources-list-${tab}`}
            renderItem={({ item }) => (
              <View>
                <ResourceCard
                  resource={item}
                  onPress={() => toggleExpand(item)}
                  onToggleFavorite={() => toggleFavorite(item, tab)}
                  showStatuses={tab === "mine"}
                  testID={`resources-card-${item.id}`}
                />
                {expandedId === item.id ? (
                  <ResourceDetailPanel
                    detail={expandedDetail}
                    isLoading={isLoadingDetail}
                    canEdit={
                      !!expandedDetail &&
                      expandedDetail.authorUserId === user?.id
                    }
                    onEdit={() =>
                      expandedDetail && openEdit(expandedDetail, tab)
                    }
                    t={t}
                  />
                ) : null}
              </View>
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
              <View style={styles.moderationCard} testID={`resources-moderation-card-${item.id}`}>
                <ResourceCard resource={item} onPress={() => toggleExpand(item)} />
                {expandedId === item.id ? (
                  <ResourceDetailPanel
                    detail={expandedDetail}
                    isLoading={isLoadingDetail}
                    canEdit={false}
                    onEdit={() => {}}
                    t={t}
                  />
                ) : null}
                <View style={styles.moderationActions}>
                  <TouchableOpacity
                    style={[styles.moderationBtn, styles.moderationApprove]}
                    onPress={() => handleModerationAction(item.id, "approve")}
                    testID={`resources-moderation-approve-${item.id}`}
                  >
                    <Text style={styles.moderationBtnText}>
                      {t("resources.moderation.approve")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moderationBtn, styles.moderationReject]}
                    onPress={() => handleModerationAction(item.id, "reject")}
                    testID={`resources-moderation-reject-${item.id}`}
                  >
                    <Text style={styles.moderationBtnText}>
                      {t("resources.moderation.reject")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            emptyComponent={
              <Text style={styles.emptyText} testID="resources-moderation-empty">
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
    </View>
  );
}

function ResourceDetailPanel(props: {
  detail: ResourceDetail | null;
  isLoading: boolean;
  canEdit: boolean;
  onEdit: () => void;
  t: TranslateFn;
}) {
  if (props.isLoading) {
    return <ActivityIndicator style={styles.detailLoader} color={colors.primary} />;
  }
  if (!props.detail) return null;
  const { detail, t } = props;

  return (
    <View style={styles.detailPanel} testID="resources-detail-panel">
      <Text style={styles.detailSectionLabel}>
        {t("resources.detail.statement")}
      </Text>
      <Text style={styles.detailText}>{stripHtml(detail.statementContent)}</Text>

      {detail.correctionContent ? (
        <>
          <Text style={styles.detailSectionLabel}>
            {t("resources.detail.correction")}
          </Text>
          <Text style={styles.detailText}>{stripHtml(detail.correctionContent)}</Text>
        </>
      ) : null}

      {detail.attachments.length > 0 ? (
        <View style={styles.attachmentsList}>
          {detail.attachments.map((attachment, idx) => (
            <View key={attachment.id ?? idx} style={styles.attachmentChip}>
              <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.attachmentText} numberOfLines={1}>
                {attachment.fileName}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {props.canEdit ? (
        <TouchableOpacity
          style={styles.editBtn}
          onPress={props.onEdit}
          testID="resources-detail-edit"
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={styles.editBtnText}>{t("resources.detail.edit")}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
  const statementRef = useRef<RichEditorFieldRef>(null);
  const correctionRef = useRef<RichEditorFieldRef>(null);
  const initialValue = props.formContext.item;
  const kind = props.formContext.kind;

  const [statementAttachments, setStatementAttachments] = useState<ResourceAttachment[]>(
    initialValue?.attachments.filter((a) => a.part === "STATEMENT") ?? [],
  );
  const [correctionAttachments, setCorrectionAttachments] = useState<ResourceAttachment[]>(
    initialValue?.attachments.filter((a) => a.part === "CORRECTION") ?? [],
  );
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
    },
  });

  const levelOptions: SelectOption[] = props.catalog.academicLevels.map((l) => ({
    value: l.id,
    label: l.label,
  }));
  const subjectOptions: SelectOption[] = props.catalog.subjects.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  async function handleAddAttachment(target: "statement" | "correction") {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uploaded = await Promise.all(
        result.assets.map((asset) =>
          resourcesApi.uploadAttachment({
            uri: asset.uri,
            mimeType: asset.mimeType ?? "application/octet-stream",
            fileName: asset.name,
          }),
        ),
      );
      if (target === "statement") {
        setStatementAttachments((current) => [...current, ...uploaded]);
      } else {
        setCorrectionAttachments((current) => [...current, ...uploaded]);
      }
    } catch {
      setErrorMessage(t("resources.errors.addAttachment"));
    }
  }

  const heroTitle =
    props.formContext.type === "edit"
      ? (initialValue?.title ?? t("resources.form.editTitle"))
      : kind === "EXAM"
        ? t("resources.form.createExamHeroTitle")
        : t("resources.form.createAssessmentHeroTitle");

  const handleSave = handleSubmit(async (values) => {
    setErrorMessage(null);
    try {
      const statementContent = await statementRef.current?.getContentHtml();
      const correctionContent = await correctionRef.current?.getContentHtml();
      const payload: UpsertResourcePayload = {
        kind,
        schoolId: kind === "ASSESSMENT" ? (props.submitterSchoolId ?? undefined) : undefined,
        academicLevelId: values.academicLevelId,
        subjectId: values.subjectId,
        examType: values.examType as ResourceExamType,
        sequence: kind === "ASSESSMENT" ? (values.sequence as ResourceSequence) : undefined,
        title: values.title.trim(),
        statementContent: statementContent?.trim() ?? "",
        statementAttachments,
        correctionContent: correctionContent?.trim() ? correctionContent : undefined,
        correctionAttachments,
      };
      await props.onSubmit(payload);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    }
  });

  return (
    <View style={styles.formsTabContent} testID="resources-form-tab">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.formsKeyboardArea}
      >
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormHero
            icon={props.formContext.type === "edit" ? "create-outline" : "add-circle-outline"}
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
              <Ionicons name="alert-circle-outline" size={16} color={colors.notification} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("resources.form.titleLabel")}</Text>
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
            <Text style={styles.fieldLabel}>{t("resources.form.levelLabel")}</Text>
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
            <Text style={styles.fieldLabel}>{t("resources.form.subjectLabel")}</Text>
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
              <Text style={styles.fieldError} testID="resources-form-subject-error">
                {errors.subjectId.message}
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("resources.form.examTypeLabel")}</Text>
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
              <Text style={styles.fieldError} testID="resources-form-exam-type-error">
                {errors.examType.message}
              </Text>
            ) : null}
          </View>

          {kind === "ASSESSMENT" ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("resources.form.sequenceLabel")}</Text>
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
                <Text style={styles.fieldError} testID="resources-form-sequence-error">
                  {errors.sequence.message}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t("resources.form.statementLabel")}</Text>
            <RichEditorField
              ref={statementRef}
              initialHtml={initialValue?.statementContent ?? ""}
              placeholder={t("resources.form.statementPlaceholder")}
              insertingPlaceholder={t("resources.form.insertingImage")}
              colorPresets={[]}
              labels={{
                colorMenuTitle: t("resources.form.colorMenu.title"),
                colorMenuMessage: t("resources.form.colorMenu.message"),
                cancel: t("resources.common.cancel"),
              }}
              onUploadInlineImage={(file) =>
                resourcesApi.uploadInlineImage({
                  uri: file.uri,
                  mimeType: file.mimeType,
                  fileName: file.name,
                })
              }
              minHeight={180}
              toolbarTestID="resources-form-statement-toolbar"
              editorTestID="resources-form-statement-editor"
            />
            <TouchableOpacity
              style={styles.addAttachmentBtn}
              onPress={() => handleAddAttachment("statement")}
              testID="resources-form-statement-add-attachment"
            >
              <Ionicons name="attach-outline" size={16} color={colors.primary} />
              <Text style={styles.addAttachmentText}>
                {t("resources.form.addAttachment")}
              </Text>
            </TouchableOpacity>
            <AttachmentList
              attachments={statementAttachments}
              onRemove={(idx) =>
                setStatementAttachments((current) =>
                  current.filter((_, i) => i !== idx),
                )
              }
              testIDPrefix="resources-form-statement-attachment"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t("resources.form.correctionLabel")}{" "}
              <Text style={styles.optionalLabel}>
                ({t("resources.form.optional")})
              </Text>
            </Text>
            <RichEditorField
              ref={correctionRef}
              initialHtml={initialValue?.correctionContent ?? ""}
              placeholder={t("resources.form.correctionPlaceholder")}
              insertingPlaceholder={t("resources.form.insertingImage")}
              colorPresets={[]}
              labels={{
                colorMenuTitle: t("resources.form.colorMenu.title"),
                colorMenuMessage: t("resources.form.colorMenu.message"),
                cancel: t("resources.common.cancel"),
              }}
              onUploadInlineImage={(file) =>
                resourcesApi.uploadInlineImage({
                  uri: file.uri,
                  mimeType: file.mimeType,
                  fileName: file.name,
                })
              }
              minHeight={180}
              toolbarTestID="resources-form-correction-toolbar"
              editorTestID="resources-form-correction-editor"
            />
            <TouchableOpacity
              style={styles.addAttachmentBtn}
              onPress={() => handleAddAttachment("correction")}
              testID="resources-form-correction-add-attachment"
            >
              <Ionicons name="attach-outline" size={16} color={colors.primary} />
              <Text style={styles.addAttachmentText}>
                {t("resources.form.addAttachment")}
              </Text>
            </TouchableOpacity>
            <AttachmentList
              attachments={correctionAttachments}
              onRemove={(idx) =>
                setCorrectionAttachments((current) =>
                  current.filter((_, i) => i !== idx),
                )
              }
              testIDPrefix="resources-form-correction-attachment"
            />
          </View>
        </ScrollView>

        <View style={styles.formActionsBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={props.onCancel}
            testID="resources-form-cancel"
          >
            <Text style={styles.cancelBtnText}>{t("resources.common.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, props.isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSave}
            disabled={props.isSubmitting}
            testID="resources-form-submit"
          >
            {props.isSubmitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>{t("resources.common.submit")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function AttachmentList(props: {
  attachments: ResourceAttachment[];
  onRemove: (index: number) => void;
  testIDPrefix: string;
}) {
  if (props.attachments.length === 0) return null;
  return (
    <View style={styles.attachmentsList}>
      {props.attachments.map((attachment, idx) => (
        <View
          key={`${attachment.fileName}-${idx}`}
          style={styles.attachmentChip}
          testID={`${props.testIDPrefix}-${idx}`}
        >
          <Ionicons name="document-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.attachmentText} numberOfLines={1}>
            {attachment.fileName}
          </Text>
          <TouchableOpacity
            onPress={() => props.onRemove(idx)}
            testID={`${props.testIDPrefix}-${idx}-remove`}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ))}
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
  detailPanel: {
    backgroundColor: colors.warmSurface,
    borderRadius: 8,
    padding: 12,
    marginTop: -6,
    marginBottom: 10,
    gap: 6,
  },
  detailLoader: { marginVertical: 12 },
  detailSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  detailText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
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
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
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
