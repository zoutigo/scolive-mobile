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
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
import { supplyListsApi } from "../../api/supply-lists.api";
import { teachersApi } from "../../api/teachers.api";
import { curriculumsApi } from "../../api/curriculums.api";
import { extractApiError } from "../../utils/api-error";
import { moduleBack } from "../../utils/moduleBack";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { ConfirmDialog } from "../ConfirmDialog";
import { PageHelpModal } from "../help/PageHelpModal";
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
import type { SupplyListRow } from "../../types/supply-lists.types";

type TabKey = "lists" | "forms";

function roleAllowsSupplyLists(role: string | null | undefined) {
  return (
    role === "SCHOOL_ADMIN" ||
    role === "SCHOOL_MANAGER" ||
    role === "SUPERVISOR" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

const itemSchema = z.object({
  rank: z.coerce.number().int().min(1),
  label: z.string().trim().min(1, "Libellé requis"),
  quantity: z.coerce.number().int().min(1, "Quantité requise"),
  note: z.string().optional(),
});

const supplyListFormSchema = z.object({
  schoolYearId: z.string().min(1, "Année scolaire requise"),
  academicLevelId: z.string().min(1, "Niveau requis"),
  trackId: z.string().optional(),
  items: z.array(itemSchema).min(1, "Au moins un article"),
});
type SupplyListFormValues = z.input<typeof supplyListFormSchema>;

export function SupplyListsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("lists");
  const [supplyLists, setSupplyLists] = useState<SupplyListRow[]>([]);
  const [schoolYears, setSchoolYears] = useState<TeacherSchoolYearOption[]>([]);
  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplyListRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const effectiveRole = user?.activeRole ?? null;
  const canAccessModule = roleAllowsSupplyLists(effectiveRole);

  const form = useForm<SupplyListFormValues>({
    resolver: zodResolver(supplyListFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      schoolYearId: "",
      academicLevelId: "",
      trackId: "",
      items: [{ rank: 1, label: "", quantity: 1, note: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const loadModuleData = useCallback(async () => {
    if (!schoolSlug) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [listRows, yearRows, levelRows, trackRows] = await Promise.all([
        supplyListsApi.listSupplyLists(schoolSlug),
        teachersApi.listSchoolYears(schoolSlug),
        curriculumsApi.listAcademicLevels(schoolSlug),
        curriculumsApi.listTracks(schoolSlug),
      ]);
      setSupplyLists(listRows);
      setSchoolYears(yearRows);
      setLevels(levelRows);
      setTracks(trackRows);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [schoolSlug]);

  useEffect(() => {
    void loadModuleData();
  }, [loadModuleData]);

  function exitForms() {
    setTab("lists");
  }

  function openCreate() {
    form.reset({
      schoolYearId: "",
      academicLevelId: "",
      trackId: "",
      items: [{ rank: 1, label: "", quantity: 1, note: "" }],
    });
    setTab("forms");
  }

  function openEdit(supplyList: SupplyListRow) {
    form.reset({
      schoolYearId: supplyList.schoolYear.id,
      academicLevelId: supplyList.academicLevel.id,
      trackId: supplyList.track?.id ?? "",
      items: supplyList.items
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map((item) => ({
          rank: item.rank,
          label: item.label,
          quantity: item.quantity,
          note: item.note ?? "",
        })),
    });
    setTab("forms");
  }

  async function onSubmit(values: SupplyListFormValues) {
    if (!schoolSlug) return;
    setSubmitting(true);
    try {
      await supplyListsApi.upsertSupplyList(schoolSlug, {
        schoolYearId: values.schoolYearId,
        academicLevelId: values.academicLevelId,
        trackId: values.trackId || undefined,
        items: values.items.map((item) => ({
          rank: Number(item.rank),
          label: item.label,
          quantity: Number(item.quantity),
          note: item.note || undefined,
        })),
      });
      await loadModuleData();
      showSuccess({
        title: t("supplyListsAdmin.success.saved"),
        message: "",
      });
      setTimeout(() => {
        exitForms();
      }, 2000);
    } catch (error) {
      showError({
        title: t("supplyListsAdmin.errors.save"),
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
      await supplyListsApi.deleteSupplyList(schoolSlug, deleteTarget.id);
      setDeleteTarget(null);
      await loadModuleData();
      showSuccess({
        title: t("supplyListsAdmin.success.deleted"),
        message: "",
      });
    } catch (error) {
      showError({
        title: t("supplyListsAdmin.errors.delete"),
        message: extractApiError(error),
      });
    } finally {
      setDeleting(false);
    }
  }

  const yearOptions = useMemo(
    () => schoolYears.map((y) => ({ value: y.id, label: y.label })),
    [schoolYears],
  );
  const levelOptions = useMemo(
    () => levels.map((l) => ({ value: l.id, label: l.label })),
    [levels],
  );
  const trackOptions = useMemo(
    () => [
      { value: "", label: t("supplyListsAdmin.form.trackNone") },
      ...tracks.map((tr) => ({ value: tr.id, label: tr.label })),
    ],
    [tracks, t],
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
          title={t("supplyListsAdmin.title")}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="supply-lists-header"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="bag-outline"
            title={t("supplyListsAdmin.lockedTitle")}
            message={t("supplyListsAdmin.lockedMessage")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title={t("supplyListsAdmin.title")}
        onBack={() => (tab === "forms" ? exitForms() : moduleBack(router))}
        topInset={insets.top}
        testID="supply-lists-header"
        backTestID="supply-lists-back-btn"
        helpAction={
          tab === "lists"
            ? {
                label: t("supplyListsAdmin.help.menuLabel"),
                onPress: () => setHelpVisible(true),
                testID: "supply-lists-help-menu-item",
              }
            : undefined
        }
      />

      {tab === "lists" ? (
        <View style={styles.content}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          {isLoading ? (
            <LoadingBlock label={t("common.loading")} />
          ) : supplyLists.length === 0 ? (
            <EmptyState
              icon="bag-outline"
              title={t("supplyListsAdmin.empty")}
              message=""
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              testID="supply-lists-list"
            >
              {supplyLists.map((supplyList) => (
                <View
                  key={supplyList.id}
                  style={styles.entityRow}
                  testID={`supply-list-${supplyList.id}`}
                >
                  <View style={styles.entityMain}>
                    <Text style={styles.entityTitle}>
                      {supplyList.academicLevel.label}
                      {supplyList.track ? ` - ${supplyList.track.label}` : ""}
                    </Text>
                    <Text style={styles.entityMeta}>
                      {supplyList.schoolYear.label}
                    </Text>
                    {supplyList.items
                      .slice()
                      .sort((a, b) => a.rank - b.rank)
                      .map((item) => (
                        <Text key={item.id} style={styles.entityMeta}>
                          {item.rank}. {item.label} — x{item.quantity}
                        </Text>
                      ))}
                  </View>
                  <View style={styles.iconActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => openEdit(supplyList)}
                      testID={`supply-list-edit-${supplyList.id}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setDeleteTarget(supplyList)}
                      disabled={deleting}
                      testID={`supply-list-delete-${supplyList.id}`}
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

      {tab === "forms" ? (
        <View style={styles.formsTabContent} testID="supply-list-forms-tab">
          <View style={styles.heroWrapper}>
            <FormHero
              icon="add-circle-outline"
              title={t("supplyListsAdmin.form.title")}
              subtitle={t("supplyListsAdmin.form.subtitle")}
              palette="primary"
              testID="supply-list-form-hero"
            />
          </View>
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
              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  {t("supplyListsAdmin.form.schoolYear")}
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
                      testID="supply-list-form-year"
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
                  {t("supplyListsAdmin.form.academicLevel")}
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
                      testID="supply-list-form-level"
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
                  {t("supplyListsAdmin.form.track")}
                </Text>
                <Controller
                  control={form.control}
                  name="trackId"
                  render={({ field: { onChange, value } }) => (
                    <InlineSelectDropDown
                      options={trackOptions}
                      value={value ?? ""}
                      onChange={onChange}
                      testID="supply-list-form-track"
                    />
                  )}
                />
              </View>

              <Text style={styles.formLabel}>
                {t("supplyListsAdmin.form.items")}
              </Text>
              {fields.map((field, index) => (
                <View key={field.id} style={styles.itemRow}>
                  <Controller
                    control={form.control}
                    name={`items.${index}.rank`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.formInput, styles.itemRankInput]}
                        value={String(value ?? "")}
                        onChangeText={onChange}
                        keyboardType="numeric"
                        testID={`supply-list-form-item-${index}-rank`}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`items.${index}.label`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.formInput, styles.itemLabelInput]}
                        value={value ?? ""}
                        onChangeText={onChange}
                        placeholder={t("supplyListsAdmin.form.label")}
                        testID={`supply-list-form-item-${index}-label`}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.formInput, styles.itemQuantityInput]}
                        value={String(value ?? "")}
                        onChangeText={onChange}
                        keyboardType="numeric"
                        placeholder={t("supplyListsAdmin.form.quantity")}
                        testID={`supply-list-form-item-${index}-quantity`}
                      />
                    )}
                  />
                  <TouchableOpacity
                    style={styles.removeItemButton}
                    onPress={() => remove(index)}
                    disabled={fields.length === 1}
                    testID={`supply-list-form-item-${index}-remove`}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={colors.notification}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              {form.formState.errors.items?.message ? (
                <Text style={styles.formError}>
                  {form.formState.errors.items.message}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() =>
                  append({
                    rank: fields.length + 1,
                    label: "",
                    quantity: 1,
                    note: "",
                  })
                }
                testID="supply-list-form-add-item"
              >
                <Text style={styles.addItemText}>
                  {t("supplyListsAdmin.form.addItem")}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.formActionsBar}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={exitForms}
                testID="supply-list-form-cancel"
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
                testID="supply-list-form-submit"
              >
                <Text style={styles.submitButtonText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}

      {tab !== "forms" ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openCreate}
          testID="supply-lists-fab"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={deleteTarget != null}
        title={t("supplyListsAdmin.deleteConfirm.title")}
        message={
          deleteTarget
            ? `${deleteTarget.academicLevel.label}${deleteTarget.track ? ` - ${deleteTarget.track.label}` : ""} (${deleteTarget.schoolYear.label})`
            : ""
        }
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PageHelpModal
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        title={t("supplyListsAdmin.help.title")}
        sections={[
          {
            title: t("supplyListsAdmin.help.section1Title"),
            body: [t("supplyListsAdmin.help.section1Body")],
          },
          {
            title: t("supplyListsAdmin.help.section2Title"),
            body: [t("supplyListsAdmin.help.section2Body")],
          },
        ]}
        closeLabel={t("supplyListsAdmin.help.close")}
        testID="supply-lists-help-modal"
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
  formsTabContent: { flex: 1 },
  heroWrapper: { padding: 16 },
  formsKeyboardArea: { flex: 1 },
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
  formError: { color: colors.notification, fontSize: 12, lineHeight: 16 },
  itemRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  itemRankInput: { width: 44 },
  itemLabelInput: { flex: 1 },
  itemQuantityInput: { width: 70 },
  removeItemButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  addItemButton: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  addItemText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
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
