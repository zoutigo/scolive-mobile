import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
import { subjectsApi } from "../../api/subjects.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { ConfirmDialog } from "../ConfirmDialog";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import {
  buildAdminSubtitle,
  getPortalLabel,
  getViewType,
} from "../navigation/nav-config";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "../timetable/TimetableCommon";
import type { CurriculumRow } from "../../types/curriculums.types";
import type { SubjectRow } from "../../types/subjects.types";
import { moduleBack } from "../../utils/moduleBack";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "list" | "help" | "forms";
type ListTabKey = "list" | "help";

type FormContext = {
  type: "create-subject" | "edit-subject";
  originTab: ListTabKey;
  item: SubjectRow | null;
};

type BranchDraft = {
  key: string;
  id?: string;
  name: string;
  code: string;
};

type SubjectSubmitValues = {
  name: string;
  curriculumIds: string[];
  branches: Array<{ id?: string; name: string; code?: string }>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const BASE_TAB_ITEMS: Array<{ key: ListTabKey; label: string }> = [
  { key: "list", label: "Matières" },
  { key: "help", label: "Aide" },
];

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const subjectFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom de la matière est obligatoire."),
});

function curriculumLabel(curriculum: CurriculumRow) {
  return curriculum.track
    ? `${curriculum.academicLevel.label} · ${curriculum.track.label}`
    : curriculum.academicLevel.label;
}

function subjectNiveauxLabels(subject: SubjectRow) {
  return subject.curriculumSubjects.map((entry) =>
    entry.curriculum.track
      ? `${entry.curriculum.academicLevel.label} · ${entry.curriculum.track.label}`
      : entry.curriculum.academicLevel.label,
  );
}

function subjectSearchText(subject: SubjectRow) {
  return [
    subject.name,
    ...subjectNiveauxLabels(subject),
    ...subject.branches.map((branch) => branch.name),
  ]
    .join(" ")
    .toLowerCase();
}

function roleAllowsAdmin(role: string | null | undefined) {
  return role === "SCHOOL_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
}

let branchDraftCounter = 0;
function nextBranchKey() {
  branchDraftCounter += 1;
  return `new-branch-${branchDraftCounter}`;
}

// ---------------------------------------------------------------------------
// TextFormField
// ---------------------------------------------------------------------------

type TextFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  testID: string;
};

const TextFormField = React.forwardRef<TextInput, TextFormFieldProps>(
  function TextFormField(props, ref) {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{props.label}</Text>
        <TextInput
          ref={ref}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={() => {
            setFocused(false);
            props.onBlur();
          }}
          onFocus={() => setFocused(true)}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.formInput,
            focused && styles.formInputFocused,
            props.error ? styles.formInputError : null,
          ]}
          testID={props.testID}
        />
        {props.error ? (
          <Text style={styles.formError} testID={`${props.testID}-error`}>
            {props.error}
          </Text>
        ) : null}
      </View>
    );
  },
);

// ---------------------------------------------------------------------------
// FormActions
// ---------------------------------------------------------------------------

function FormActions(props: {
  submitLabel: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.formActions}>
      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={props.onCancel}
        testID={`${props.testIDPrefix}-cancel`}
      >
        <Text style={styles.secondaryActionLabel}>Annuler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.primaryAction,
          (props.isSubmitting || props.submitDisabled) &&
            styles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting || props.submitDisabled}
        onPress={props.onSubmit}
        testID={`${props.testIDPrefix}-submit`}
      >
        <Text style={styles.primaryActionLabel}>
          {props.isSubmitting ? "Enregistrement..." : props.submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SubjectFormContent — formulaire inline de création/édition (sans Modal)
// ---------------------------------------------------------------------------

function SubjectFormContent(props: {
  mode: "create" | "edit";
  item: SubjectRow | null;
  curriculums: CurriculumRow[];
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: SubjectSubmitValues) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    mode: "onChange",
    defaultValues: {
      name: props.item?.name ?? "",
    },
  });

  const [selectedCurriculumIds, setSelectedCurriculumIds] = useState<
    Set<string>
  >(
    () =>
      new Set(
        props.item?.curriculumSubjects.map((entry) => entry.curriculumId) ?? [],
      ),
  );

  const [branches, setBranches] = useState<BranchDraft[]>(
    () =>
      props.item?.branches.map((branch) => ({
        key: branch.id,
        id: branch.id,
        name: branch.name,
        code: branch.code ?? "",
      })) ?? [],
  );
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCode, setNewBranchCode] = useState("");

  function toggleCurriculum(curriculumId: string) {
    setSelectedCurriculumIds((current) => {
      const next = new Set(current);
      if (next.has(curriculumId)) {
        next.delete(curriculumId);
      } else {
        next.add(curriculumId);
      }
      return next;
    });
  }

  function addBranchDraft() {
    const name = newBranchName.trim();
    if (!name) return;
    setBranches((current) => [
      ...current,
      { key: nextBranchKey(), name, code: newBranchCode.trim() },
    ]);
    setNewBranchName("");
    setNewBranchCode("");
  }

  function removeBranchDraft(key: string) {
    setBranches((current) => current.filter((branch) => branch.key !== key));
  }

  function updateBranchDraft(
    key: string,
    field: "name" | "code",
    value: string,
  ) {
    setBranches((current) =>
      current.map((branch) =>
        branch.key === key ? { ...branch, [field]: value } : branch,
      ),
    );
  }

  const submit = handleSubmit(
    (values) => {
      props.onSubmit({
        name: values.name,
        curriculumIds: Array.from(selectedCurriculumIds),
        branches: branches
          .map((branch) => ({
            id: branch.id,
            name: branch.name.trim(),
            code: branch.code.trim() || undefined,
          }))
          .filter((branch) => branch.name.length > 0),
      });
    },
    (errs) => {
      const first = Object.keys(errs)[0];
      if (first) focusField(first as Parameters<typeof focusField>[0]);
    },
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="subjects-admin-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Nom de la matière"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: Mathématiques"
              error={errors.name?.message}
              testID="subjects-admin-form-name"
            />
          )}
        />

        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Niveaux d'utilisation</Text>
          <Text style={styles.formSectionHint}>
            Sélectionnez les curriculums (niveau et filière) dans lesquels cette
            matière est enseignée.
          </Text>
          {props.curriculums.length === 0 ? (
            <Text style={styles.formSectionEmpty}>
              Aucun curriculum n'existe encore dans l'établissement.
            </Text>
          ) : (
            <View style={styles.checklist}>
              {props.curriculums.map((curriculum) => {
                const checked = selectedCurriculumIds.has(curriculum.id);
                return (
                  <TouchableOpacity
                    key={curriculum.id}
                    style={styles.checklistRow}
                    onPress={() => toggleCurriculum(curriculum.id)}
                    testID={`subjects-admin-form-niveau-${curriculum.id}`}
                  >
                    <Ionicons
                      name={checked ? "checkbox" : "square-outline"}
                      size={20}
                      color={checked ? colors.primary : colors.textSecondary}
                    />
                    <Text style={styles.checklistLabel}>
                      {curriculumLabel(curriculum)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formSectionTitle}>Spécialités</Text>
          <Text style={styles.formSectionHint}>
            Découpez cette matière en spécialités notées séparément (ex:
            Algèbre, Géométrie pour Mathématiques). Optionnel.
          </Text>
          {branches.length > 0 ? (
            <View style={styles.branchList}>
              {branches.map((branch) => (
                <View key={branch.key} style={styles.branchRow}>
                  <View style={styles.branchInputs}>
                    <TextInput
                      value={branch.name}
                      onChangeText={(text) =>
                        updateBranchDraft(branch.key, "name", text)
                      }
                      placeholder="Nom de la spécialité"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.branchNameInput}
                      testID={`subjects-admin-form-branch-name-${branch.key}`}
                    />
                    <TextInput
                      value={branch.code}
                      onChangeText={(text) =>
                        updateBranchDraft(branch.key, "code", text)
                      }
                      placeholder="Code (optionnel)"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.branchCodeInput}
                      testID={`subjects-admin-form-branch-code-${branch.key}`}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.branchRemoveButton}
                    onPress={() => removeBranchDraft(branch.key)}
                    testID={`subjects-admin-form-branch-remove-${branch.key}`}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.notification}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.branchAddRow}>
            <View style={styles.branchInputs}>
              <TextInput
                value={newBranchName}
                onChangeText={setNewBranchName}
                placeholder="Nouvelle spécialité"
                placeholderTextColor={colors.textSecondary}
                style={styles.branchNameInput}
                testID="subjects-admin-form-new-branch-name"
              />
              <TextInput
                value={newBranchCode}
                onChangeText={setNewBranchCode}
                placeholder="Code (optionnel)"
                placeholderTextColor={colors.textSecondary}
                style={styles.branchCodeInput}
                testID="subjects-admin-form-new-branch-code"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.branchAddButton,
                !newBranchName.trim() && styles.branchAddButtonDisabled,
              ]}
              disabled={!newBranchName.trim()}
              onPress={addBranchDraft}
              testID="subjects-admin-form-add-branch"
            >
              <Ionicons name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer la matière" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={submit}
          testIDPrefix="subjects-admin-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// SubjectsAdminScreen
// ---------------------------------------------------------------------------

export function SubjectsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("list");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const effectiveRole = user?.activeRole ?? user?.role ?? null;
  const subtitle = user ? buildAdminSubtitle(user) : null;
  const canAccessModule = roleAllowsAdmin(effectiveRole);

  const subjectCountLabel = `${subjects.length} matière${subjects.length > 1 ? "s" : ""}`;

  const filteredSubjects = useMemo(() => {
    const search = query.trim().toLowerCase();
    const sorted = [...subjects].sort((a, b) => a.name.localeCompare(b.name));
    if (!search) return sorted;
    return sorted.filter((entry) => subjectSearchText(entry).includes(search));
  }, [query, subjects]);

  const visibleSubjects = useMemo(
    () => filteredSubjects.slice(0, visibleCount),
    [filteredSubjects, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, subjects.length]);

  const loadSubjects = useCallback(
    async (refresh = false) => {
      if (!schoolSlug) {
        setErrorMessage("Aucun établissement actif.");
        setIsLoading(false);
        return;
      }
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);
      try {
        const [subjectRows, curriculumRows] = await Promise.all([
          subjectsApi.listSubjects(schoolSlug),
          curriculumsApi.listCurriculums(schoolSlug),
        ]);
        setSubjects(subjectRows);
        setCurriculums(curriculumRows);
      } catch (error) {
        setErrorMessage(extractApiError(error));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (!canAccessModule) return;
    void loadSubjects(false);
  }, [canAccessModule, loadSubjects]);

  const handleRefresh = useCallback(async () => {
    await loadSubjects(true);
  }, [loadSubjects]);

  function exitForms() {
    const origin = formContext?.originTab ?? "list";
    setFormContext(null);
    setTab(origin);
  }

  function openFab() {
    if (tab === "list") {
      setFormContext({
        type: "create-subject",
        originTab: "list",
        item: null,
      });
      setTab("forms");
    }
  }

  async function handleSubmitSubject(values: SubjectSubmitValues) {
    if (!schoolSlug || !formContext) return;
    const isEdit = formContext.type === "edit-subject";
    const existing = formContext.item;

    setIsSubmitting(true);
    try {
      let subjectId: string;
      if (isEdit && existing) {
        await subjectsApi.updateSubject(schoolSlug, existing.id, {
          name: values.name,
        });
        subjectId = existing.id;
      } else {
        const created = await subjectsApi.createSubject(schoolSlug, {
          name: values.name,
        });
        subjectId = created.id;
      }

      const originalCurriculumIds = new Set(
        existing?.curriculumSubjects.map((entry) => entry.curriculumId) ?? [],
      );
      const nextCurriculumIds = new Set(values.curriculumIds);

      for (const curriculumId of nextCurriculumIds) {
        if (!originalCurriculumIds.has(curriculumId)) {
          await curriculumsApi.upsertCurriculumSubject(
            schoolSlug,
            curriculumId,
            { subjectId },
          );
        }
      }
      for (const curriculumId of originalCurriculumIds) {
        if (!nextCurriculumIds.has(curriculumId)) {
          await curriculumsApi.deleteCurriculumSubject(
            schoolSlug,
            curriculumId,
            subjectId,
          );
        }
      }

      const originalBranches = existing?.branches ?? [];
      const nextBranchIds = new Set(
        values.branches.filter((b) => b.id).map((b) => b.id as string),
      );

      for (const branch of values.branches) {
        if (branch.id) {
          const original = originalBranches.find((b) => b.id === branch.id);
          if (
            original &&
            (original.name !== branch.name ||
              (original.code ?? "") !== (branch.code ?? ""))
          ) {
            await subjectsApi.updateSubjectBranch(schoolSlug, branch.id, {
              name: branch.name,
              code: branch.code,
            });
          }
        } else {
          await subjectsApi.createSubjectBranch(schoolSlug, subjectId, {
            name: branch.name,
            code: branch.code,
          });
        }
      }
      for (const original of originalBranches) {
        if (!nextBranchIds.has(original.id)) {
          await subjectsApi.deleteSubjectBranch(schoolSlug, original.id);
        }
      }

      await loadSubjects(true);
      const originTab = formContext.originTab;
      showSuccess({
        title: isEdit ? "Matière modifiée" : "Matière créée",
        message: isEdit
          ? "Les changements sur la matière ont été enregistrés."
          : "La nouvelle matière est disponible pour l'organisation pédagogique.",
      });
      setTimeout(() => {
        setTab(originTab);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Opération impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSubject() {
    if (!schoolSlug || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await subjectsApi.deleteSubject(schoolSlug, deleteTarget.id);
      setDeleteTarget(null);
      await loadSubjects(true);
      showSuccess({
        title: "Matière supprimée",
        message: "La matière a été retirée de l'établissement.",
      });
    } catch (error) {
      showError({
        title: "Suppression impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <LoadingBlock label="Chargement du profil..." />
      </View>
    );
  }

  if (!canAccessModule) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title="Matières"
          subtitle={getPortalLabel(getViewType(user))}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="subjects-admin-header"
          backTestID="subjects-admin-back-btn"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="library-outline"
            title="Module réservé aux comptes admin"
            message="Ce module mobile est disponible pour les comptes school admin."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title="Matières"
        subtitle={subtitle}
        onBack={() => (tab === "forms" ? exitForms() : moduleBack(router))}
        topInset={insets.top}
        testID="subjects-admin-header"
        backTestID="subjects-admin-back-btn"
      />

      {tab !== "forms" ? (
        <UnderlineTabs<ListTabKey>
          items={BASE_TAB_ITEMS}
          activeKey={tab as ListTabKey}
          onSelect={(key) => setTab(key)}
          testIDPrefix="subjects-admin-tab"
        />
      ) : null}

      {/* ── Tab forms : hero + formulaire inline ──────────────────────────── */}
      {tab === "forms" && formContext ? (
        <View style={styles.formsTabContent} testID="subjects-admin-forms-tab">
          <View style={styles.heroWrapper}>
            <FormHero
              icon={
                formContext.type === "create-subject"
                  ? "add-circle-outline"
                  : "create-outline"
              }
              title={
                formContext.type === "create-subject"
                  ? "Créer une matière"
                  : "Modifier la matière"
              }
              subtitle="Renseignez le nom, les niveaux d'utilisation et les spécialités de la matière."
              palette={formContext.type === "create-subject" ? "teal" : "warm"}
              testID="subjects-admin-form-hero"
            />
          </View>
          <SubjectFormContent
            mode={formContext.type === "edit-subject" ? "edit" : "create"}
            item={formContext.item}
            curriculums={curriculums}
            isSubmitting={isSubmitting}
            onCancel={exitForms}
            onSubmit={handleSubmitSubject}
          />
        </View>
      ) : null}

      {/* ── Tabs liste (list / help) ────────────────────────────── */}
      {tab !== "forms" ? (
        isLoading ? (
          <View style={styles.loadingWrap}>
            <LoadingBlock label="Chargement du module matières..." />
          </View>
        ) : (
          <View style={styles.content}>
            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
                testID="subjects-admin-error-banner"
              />
            ) : null}

            {tab === "list" ? (
              <>
                <View
                  style={styles.summaryStrip}
                  testID="subjects-admin-summary"
                >
                  <View style={styles.summaryStatChip}>
                    <Ionicons
                      name="library-outline"
                      size={14}
                      color={colors.accentTeal}
                    />
                    <Text style={styles.summaryStatText}>
                      {subjectCountLabel}
                    </Text>
                  </View>
                </View>
                <InfiniteScrollList
                  data={visibleSubjects}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => {
                    const niveaux = subjectNiveauxLabels(item);
                    return (
                      <View
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor:
                              index % 2 === 0 ? "#FFF9F3" : "#FFF2E4",
                          },
                        ]}
                        testID={`subjects-admin-subject-row-${item.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            { backgroundColor: "#D89B5B" },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>{item.name}</Text>
                            {niveaux.length > 0 ? (
                              <View style={styles.chipsRow}>
                                {niveaux.map((label) => (
                                  <View key={label} style={styles.chip}>
                                    <Text style={styles.chipText}>{label}</Text>
                                  </View>
                                ))}
                              </View>
                            ) : (
                              <Text style={styles.entityMeta}>
                                Aucun niveau affecté
                              </Text>
                            )}
                            {item.branches.length > 0 ? (
                              <View style={styles.chipsRow}>
                                {item.branches.map((branch) => (
                                  <View
                                    key={branch.id}
                                    style={styles.branchChip}
                                  >
                                    <Text style={styles.branchChipText}>
                                      {branch.name}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setFormContext({
                                type: "edit-subject",
                                originTab: "list",
                                item,
                              });
                              setTab("forms");
                            }}
                            testID={`subjects-admin-subject-edit-${item.id}`}
                          >
                            <Ionicons
                              name="create-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => setDeleteTarget(item)}
                            testID={`subjects-admin-subject-delete-${item.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.notification}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                  onRefresh={handleRefresh}
                  refreshing={isRefreshing}
                  onLoadMore={() =>
                    setVisibleCount((current) => current + PAGE_SIZE)
                  }
                  hasMore={visibleSubjects.length < filteredSubjects.length}
                  isLoadingMore={false}
                  testID="subjects-admin-list"
                  contentContainerStyle={styles.listContent}
                  ListHeaderComponent={
                    <View style={styles.listHeader}>
                      <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Rechercher une matière"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.searchInput}
                        testID="subjects-admin-search"
                      />
                    </View>
                  }
                  emptyComponent={
                    <View style={styles.emptyListWrap}>
                      <EmptyState
                        icon="library-outline"
                        title={
                          query.trim()
                            ? "Aucune matière trouvée"
                            : "Aucune matière"
                        }
                        message={
                          query.trim()
                            ? "Ajustez votre recherche pour retrouver une matière."
                            : "Ajoutez une première matière depuis le bouton flottant."
                        }
                      />
                    </View>
                  }
                />
              </>
            ) : null}

            {tab === "help" ? (
              <ScrollView
                style={styles.helpScroll}
                contentContainerStyle={styles.helpContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => {
                      void handleRefresh();
                    }}
                  />
                }
                showsVerticalScrollIndicator={false}
                testID="subjects-admin-help-scroll"
              >
                <View style={styles.helpCard} testID="subjects-admin-help-card">
                  <Text style={styles.helpCardTitle}>Parcours recommandé</Text>
                  <Text style={styles.helpLine}>
                    1. Créez les matières enseignées dans l'établissement.
                  </Text>
                  <Text style={styles.helpLine}>
                    2. Affectez chaque matière aux niveaux (curriculums) où elle
                    est enseignée.
                  </Text>
                  <Text style={styles.helpLine}>
                    3. Ajoutez, si besoin, des spécialités pour noter séparément
                    certaines parties de la matière (ex: Algèbre et Géométrie
                    pour Mathématiques).
                  </Text>
                </View>
                <View style={styles.helpCard}>
                  <Text style={styles.helpCardTitle}>Rappels métier</Text>
                  <Text style={styles.helpLine}>
                    Une matière déjà affectée à un curriculum, à un enseignant
                    ou utilisée dans des notes ne peut pas être supprimée :
                    retirez d'abord ces affectations.
                  </Text>
                  <Text style={styles.helpLine}>
                    Une spécialité déjà utilisée dans une évaluation ne peut pas
                    être supprimée.
                  </Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        )
      ) : null}

      {tab === "list" ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openFab}
          testID="subjects-admin-fab"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={deleteTarget != null}
        title="Supprimer la matière"
        message={
          deleteTarget
            ? `Supprimer définitivement la matière "${deleteTarget.name}" ?`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDeleteSubject();
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lockedWrap: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 10,
  },
  summaryStatChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF7F4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentTeal,
  },
  listContent: {
    paddingBottom: 108,
    gap: 8,
  },
  listHeader: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 14,
  },
  emptyListWrap: {
    paddingTop: 36,
  },
  entityRow: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    padding: 14,
    paddingLeft: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#08467D",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  entityAccent: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderRadius: 999,
  },
  entityMain: {
    flex: 1,
    gap: 6,
  },
  entityTextWrap: {
    gap: 6,
  },
  entityTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  entityMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: "#E7F0FA",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  branchChip: {
    backgroundColor: "#F3EAD9",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  branchChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8A5A22",
  },
  iconActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFFE0",
    alignItems: "center",
    justifyContent: "center",
  },
  helpScroll: {
    flex: 1,
  },
  helpContent: {
    paddingBottom: 108,
    gap: 12,
  },
  helpCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  helpCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  helpLine: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24 + BOTTOM_TAB_BAR_HEIGHT,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  // ── Inline form layout ──────────────────────────────────────────────────
  formsTabContent: {
    flex: 1,
  },
  heroWrapper: {
    padding: 16,
  },
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 20,
  },
  formActionsBar: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  // ── Form fields ─────────────────────────────────────────────────────────
  formField: {
    gap: 8,
  },
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  formInputFocused: {
    borderColor: colors.primary,
  },
  formInputError: {
    borderColor: "#B84A3B",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
  },
  formActions: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  secondaryActionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1.2,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  // ── Niveaux / Spécialités sections ──────────────────────────────────────
  formSection: {
    gap: 10,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  formSectionHint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  formSectionEmpty: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  checklist: {
    gap: 4,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checklistLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  branchList: {
    gap: 8,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  branchAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  branchInputs: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  branchNameInput: {
    flex: 1.4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 13,
  },
  branchCodeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 13,
  },
  branchRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7E4E0",
  },
  branchAddButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentTeal,
  },
  branchAddButtonDisabled: {
    opacity: 0.5,
  },
});
