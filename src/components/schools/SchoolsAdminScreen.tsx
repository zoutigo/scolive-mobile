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
import { schoolsApi } from "../../api/schools.api";
import { ConfirmDialog } from "../ConfirmDialog";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { FormHero } from "../forms/FormHero";
import { SelectDropdown } from "../SelectDropdown";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation, type TranslateFn } from "../../i18n/useTranslation";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import { CyclePill, LanguagePill, StatTile } from "./SchoolBadges";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import type {
  CreateSchoolPayload,
  SchoolCycle,
  SchoolLanguageSystem,
  SchoolRow,
  UpdateSchoolPayload,
} from "../../types/schools.types";
import { moduleBack } from "../../utils/moduleBack";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "synthese" | "list" | "help" | "forms";
type ListTabKey = "synthese" | "list" | "help";

type FormContext = {
  type: "create-school" | "edit-school";
  originTab: ListTabKey;
  school: SchoolRow | null;
};

const CYCLE_KEYS: SchoolCycle[] = ["PRIMARY", "SECONDARY"];
const LANGUAGE_KEYS: SchoolLanguageSystem[] = [
  "FRANCOPHONE",
  "ANGLOPHONE",
  "BILINGUAL",
];

function roleAllowsPlatformAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function buildCreateSchema(t: TranslateFn) {
  return z.object({
    name: z.string().trim().min(1, t("schoolsAdmin.form.errors.nameRequired")),
    country: z.string().trim().optional(),
    region: z.string().trim().optional(),
    city: z.string().trim().optional(),
    cycle: z.union([
      z.literal("PRIMARY"),
      z.literal("SECONDARY"),
      z.literal(""),
    ]),
    languageSystem: z.union([
      z.literal("FRANCOPHONE"),
      z.literal("ANGLOPHONE"),
      z.literal("BILINGUAL"),
      z.literal(""),
    ]),
    schoolAdminEmail: z
      .string()
      .trim()
      .email(t("schoolsAdmin.form.errors.emailInvalid")),
  });
}

function buildEditSchema(t: TranslateFn) {
  return z.object({
    name: z.string().trim().min(1, t("schoolsAdmin.form.errors.nameRequired")),
    country: z.string().trim().optional(),
    region: z.string().trim().optional(),
    city: z.string().trim().optional(),
    cycle: z.union([
      z.literal("PRIMARY"),
      z.literal("SECONDARY"),
      z.literal(""),
    ]),
    languageSystem: z.union([
      z.literal("FRANCOPHONE"),
      z.literal("ANGLOPHONE"),
      z.literal("BILINGUAL"),
      z.literal(""),
    ]),
  });
}

// ---------------------------------------------------------------------------
// TextFormField (local — borderRadius 6, cf. skill improve-mobile-form)
// ---------------------------------------------------------------------------

type TextFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  testID: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
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
          keyboardType={props.keyboardType}
          autoCapitalize={props.autoCapitalize}
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

function FormActions(props: {
  submitLabel: string;
  submittingLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  testIDPrefix: string;
  t: TranslateFn;
}) {
  return (
    <View style={styles.formActions}>
      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={props.onCancel}
        testID={`${props.testIDPrefix}-cancel`}
      >
        <Text style={styles.secondaryActionLabel}>
          {props.t("schoolsAdmin.form.cancel")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.primaryAction,
          props.isSubmitting && styles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting}
        onPress={props.onSubmit}
        testID={`${props.testIDPrefix}-submit`}
      >
        <Text style={styles.primaryActionLabel}>
          {props.isSubmitting ? props.submittingLabel : props.submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CreateSchoolFormContent
// ---------------------------------------------------------------------------

function CreateSchoolFormContent(props: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateSchoolPayload) => Promise<void> | void;
  t: TranslateFn;
}) {
  const { t } = props;
  const schema = useMemo(() => buildCreateSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      country: "",
      region: "",
      city: "",
      cycle: "",
      languageSystem: "",
      schoolAdminEmail: "",
    },
  });

  const submit = handleSubmit(
    async (values) => {
      await props.onSubmit({
        name: values.name,
        country: values.country || undefined,
        region: values.region || undefined,
        city: values.city || undefined,
        cycle: values.cycle || undefined,
        languageSystem: values.languageSystem || undefined,
        schoolAdminEmail: values.schoolAdminEmail,
      });
    },
    (errs) => {
      const first = Object.keys(errs)[0];
      if (first) focusField(first as Parameters<typeof focusField>[0]);
    },
  );

  return (
    <View style={styles.form} testID="schools-create-form">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.name")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.namePlaceholder")}
            error={errors.name?.message}
            testID="schools-create-name"
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.country")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.countryPlaceholder")}
            testID="schools-create-country"
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.region")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.regionPlaceholder")}
            testID="schools-create-region"
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.city")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.cityPlaceholder")}
            testID="schools-create-city"
          />
        )}
      />
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{t("schoolsAdmin.form.cycle")}</Text>
        <Controller
          control={control}
          name="cycle"
          render={({ field: { value, onChange } }) => (
            <SelectDropdown
              options={CYCLE_KEYS.map((key) => ({
                value: key,
                label: t(`schoolsAdmin.cycle.${key}`),
              }))}
              value={value}
              onChange={(next) => onChange(next as "" | SchoolCycle)}
              placeholder={t("schoolsAdmin.form.cyclePlaceholder")}
              testID="schools-create-cycle"
            />
          )}
        />
      </View>
      <View style={styles.formField}>
        <Text style={styles.formLabel}>
          {t("schoolsAdmin.form.languageSystem")}
        </Text>
        <Controller
          control={control}
          name="languageSystem"
          render={({ field: { value, onChange } }) => (
            <SelectDropdown
              options={LANGUAGE_KEYS.map((key) => ({
                value: key,
                label: t(`schoolsAdmin.language.${key}`),
              }))}
              value={value}
              onChange={(next) => onChange(next as "" | SchoolLanguageSystem)}
              placeholder={t("schoolsAdmin.form.languageSystemPlaceholder")}
              testID="schools-create-language-system"
            />
          )}
        />
      </View>
      <Controller
        control={control}
        name="schoolAdminEmail"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.adminEmail")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.adminEmailPlaceholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.schoolAdminEmail?.message}
            testID="schools-create-admin-email"
          />
        )}
      />
      <FormActions
        submitLabel={t("schoolsAdmin.form.submitCreate")}
        submittingLabel={t("schoolsAdmin.form.submittingCreate")}
        isSubmitting={props.isSubmitting}
        onCancel={props.onCancel}
        onSubmit={submit}
        testIDPrefix="schools-create"
        t={t}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// EditSchoolFormContent
// ---------------------------------------------------------------------------

function EditSchoolFormContent(props: {
  school: SchoolRow;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: UpdateSchoolPayload) => Promise<void> | void;
  t: TranslateFn;
}) {
  const { t } = props;
  const schema = useMemo(() => buildEditSchema(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: props.school.name,
      country: props.school.country ?? "",
      region: props.school.region ?? "",
      city: props.school.city ?? "",
      cycle: props.school.cycle ?? "",
      languageSystem: props.school.languageSystem ?? "",
    },
  });

  const submit = handleSubmit((values) =>
    props.onSubmit({
      name: values.name,
      country: values.country || null,
      region: values.region || null,
      city: values.city || null,
      cycle: values.cycle || null,
      languageSystem: values.languageSystem || null,
    }),
  );

  return (
    <View style={styles.form} testID={`schools-edit-form-${props.school.id}`}>
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.name")}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.namePlaceholder")}
            error={errors.name?.message}
            testID="schools-edit-name"
          />
        )}
      />
      <Controller
        control={control}
        name="country"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.country")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.countryPlaceholder")}
            testID="schools-edit-country"
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.region")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.regionPlaceholder")}
            testID="schools-edit-region"
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label={t("schoolsAdmin.form.city")}
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t("schoolsAdmin.form.cityPlaceholder")}
            testID="schools-edit-city"
          />
        )}
      />
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{t("schoolsAdmin.form.cycle")}</Text>
        <Controller
          control={control}
          name="cycle"
          render={({ field: { value, onChange } }) => (
            <SelectDropdown
              options={CYCLE_KEYS.map((key) => ({
                value: key,
                label: t(`schoolsAdmin.cycle.${key}`),
              }))}
              value={value}
              onChange={(next) => onChange(next as "" | SchoolCycle)}
              placeholder={t("schoolsAdmin.form.cyclePlaceholder")}
              testID="schools-edit-cycle"
            />
          )}
        />
      </View>
      <View style={styles.formField}>
        <Text style={styles.formLabel}>
          {t("schoolsAdmin.form.languageSystem")}
        </Text>
        <Controller
          control={control}
          name="languageSystem"
          render={({ field: { value, onChange } }) => (
            <SelectDropdown
              options={LANGUAGE_KEYS.map((key) => ({
                value: key,
                label: t(`schoolsAdmin.language.${key}`),
              }))}
              value={value}
              onChange={(next) => onChange(next as "" | SchoolLanguageSystem)}
              placeholder={t("schoolsAdmin.form.languageSystemPlaceholder")}
              testID="schools-edit-language-system"
            />
          )}
        />
      </View>
      <FormActions
        submitLabel={t("schoolsAdmin.form.submitEdit")}
        submittingLabel={t("schoolsAdmin.form.submittingEdit")}
        isSubmitting={props.isSubmitting}
        onCancel={props.onCancel}
        onSubmit={submit}
        testIDPrefix="schools-edit"
        t={t}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// SchoolCard — header / body / footer
// ---------------------------------------------------------------------------

function SchoolCard(props: {
  school: SchoolRow;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: TranslateFn;
}) {
  const { school, t } = props;
  const location = [school.city, school.region, school.country]
    .filter(Boolean)
    .join(", ");

  return (
    <View style={styles.card} testID={`schools-card-${school.id}`}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Ionicons name="business" size={18} color={colors.white} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.schoolName} numberOfLines={2}>
            {school.name}
          </Text>
          <Text style={styles.schoolSlug} numberOfLines={1}>
            {school.slug}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.pillsRow}>
          <CyclePill
            cycle={school.cycle}
            testID={`schools-card-cycle-${school.id}`}
          />
          <LanguagePill
            languageSystem={school.languageSystem}
            testID={`schools-card-language-${school.id}`}
          />
        </View>

        {location ? (
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {t("schoolsAdmin.card.academicYearPrefix")}:{" "}
            {school.academicYear?.label ??
              t("schoolsAdmin.card.noAcademicYear")}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {school.usersCount} {t("schoolsAdmin.card.usersLabel")}
          </Text>
          <Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsText}>
            {school.classesCount} {t("schoolsAdmin.card.classesLabel")}
          </Text>
          <Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsText}>
            {school.studentsCount} {t("schoolsAdmin.card.studentsLabel")}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.footerBtnPrimary}
          onPress={props.onView}
          testID={`schools-view-${school.id}`}
        >
          <Ionicons name="eye-outline" size={15} color={colors.primary} />
          <Text style={styles.footerBtnPrimaryLabel}>
            {t("schoolsAdmin.card.view")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={props.onEdit}
          testID={`schools-edit-${school.id}`}
        >
          <Ionicons
            name="create-outline"
            size={15}
            color={colors.textSecondary}
          />
          <Text style={styles.footerBtnLabel}>
            {t("schoolsAdmin.card.edit")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={props.onDelete}
          testID={`schools-delete-${school.id}`}
        >
          <Ionicons
            name="trash-outline"
            size={15}
            color={colors.notification}
          />
          <Text style={styles.footerBtnDangerLabel}>
            {t("schoolsAdmin.card.delete")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Synthesis tab
// ---------------------------------------------------------------------------

function SynthesisTab(props: { schools: SchoolRow[]; t: TranslateFn }) {
  const { schools, t } = props;

  const totals = useMemo(
    () => ({
      schools: schools.length,
      students: schools.reduce((sum, s) => sum + s.studentsCount, 0),
      classes: schools.reduce((sum, s) => sum + s.classesCount, 0),
    }),
    [schools],
  );

  const byCycle = useMemo(() => {
    const groups: Record<"PRIMARY" | "SECONDARY" | "UNSET", SchoolRow[]> = {
      PRIMARY: [],
      SECONDARY: [],
      UNSET: [],
    };
    for (const school of schools) {
      const key = school.cycle ?? "UNSET";
      groups[key].push(school);
    }
    return groups;
  }, [schools]);

  if (schools.length === 0) {
    return (
      <EmptyState
        icon="stats-chart-outline"
        title={t("schoolsAdmin.synthese.overviewTitle")}
        message={t("schoolsAdmin.synthese.empty")}
      />
    );
  }

  return (
    <View style={{ gap: 12 }} testID="schools-synthese-tab">
      <SectionCard
        title={t("schoolsAdmin.synthese.overviewTitle")}
        testID="schools-synthese-overview"
      >
        <View style={styles.statsGrid}>
          <StatTile
            icon="business-outline"
            label={t("schoolsAdmin.synthese.totalSchools")}
            value={totals.schools}
            tone="primary"
            testID="schools-synthese-total-schools"
          />
          <StatTile
            icon="people-outline"
            label={t("schoolsAdmin.synthese.totalStudents")}
            value={totals.students}
            tone="teal"
            testID="schools-synthese-total-students"
          />
          <StatTile
            icon="grid-outline"
            label={t("schoolsAdmin.synthese.totalClasses")}
            value={totals.classes}
            tone="warm"
            testID="schools-synthese-total-classes"
          />
        </View>
      </SectionCard>

      <SectionCard
        title={t("schoolsAdmin.synthese.byCycleTitle")}
        testID="schools-synthese-by-cycle"
      >
        <View style={{ gap: 10 }}>
          {(["PRIMARY", "SECONDARY", "UNSET"] as const).map((cycleKey) => {
            const rows = byCycle[cycleKey];
            if (rows.length === 0) return null;
            const studentsCount = rows.reduce(
              (sum, s) => sum + s.studentsCount,
              0,
            );
            const classesCount = rows.reduce(
              (sum, s) => sum + s.classesCount,
              0,
            );
            return (
              <View
                key={cycleKey}
                style={styles.cycleRow}
                testID={`schools-synthese-cycle-${cycleKey}`}
              >
                <View style={styles.cycleRowHeader}>
                  <CyclePill cycle={cycleKey === "UNSET" ? null : cycleKey} />
                  <Text style={styles.cycleRowCount}>
                    {rows.length} {t("schoolsAdmin.synthese.schoolsLabel")}
                  </Text>
                </View>
                <Text style={styles.cycleRowDetail}>
                  {studentsCount} {t("schoolsAdmin.synthese.studentsLabel")} ·{" "}
                  {classesCount} {t("schoolsAdmin.synthese.classesLabel")}
                </Text>
              </View>
            );
          })}
        </View>
      </SectionCard>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function SchoolsAdminScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("synthese");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchoolRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");

  const role = user?.activeRole ?? user?.role ?? null;
  const isAllowed = roleAllowsPlatformAdmin(role);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const rows = await schoolsApi.listSchools();
      setSchools(rows);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAllowed) {
      setIsLoading(false);
      return;
    }
    void load();
  }, [load, isAllowed]);

  const orderedSchools = useMemo(
    () => [...schools].sort((a, b) => a.name.localeCompare(b.name)),
    [schools],
  );
  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orderedSchools;
    return orderedSchools.filter((school) =>
      [school.name, school.slug, school.city, school.region, school.country]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [orderedSchools, search]);

  function exitForms() {
    const origin = formContext?.originTab ?? "list";
    setFormContext(null);
    setTab(origin);
  }

  function openFab() {
    const originTab: ListTabKey = tab === "help" ? "list" : (tab as ListTabKey);
    setFormContext({ type: "create-school", originTab, school: null });
    setTab("forms");
  }

  const handleCreate = useCallback(
    async (values: CreateSchoolPayload) => {
      setIsSubmittingCreate(true);
      try {
        const result = await schoolsApi.createSchool(values);
        showSuccess({
          title: t("schoolsAdmin.toast.createdTitle"),
          message: result.userExisted
            ? t("schoolsAdmin.toast.createdExisting")
            : t("schoolsAdmin.toast.createdNew"),
        });
        await load();
        setTimeout(() => exitForms(), 2000);
      } catch (error) {
        showError({
          title: t("schoolsAdmin.toast.createFailedTitle"),
          message: extractApiError(error),
        });
      } finally {
        setIsSubmittingCreate(false);
      }
    },
    [load, showSuccess, showError, t, formContext],
  );

  const handleUpdate = useCallback(
    async (schoolId: string, values: UpdateSchoolPayload) => {
      setIsSubmittingEdit(true);
      try {
        await schoolsApi.updateSchool(schoolId, values);
        showSuccess({
          title: t("schoolsAdmin.toast.updatedTitle"),
          message: t("schoolsAdmin.toast.updatedMessage"),
        });
        await load();
        setTimeout(() => exitForms(), 2000);
      } catch (error) {
        showError({
          title: t("schoolsAdmin.toast.updateFailedTitle"),
          message: extractApiError(error),
        });
      } finally {
        setIsSubmittingEdit(false);
      }
    },
    [load, showSuccess, showError, t, formContext],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await schoolsApi.deleteSchool(deleteTarget.id);
      showSuccess({
        title: t("schoolsAdmin.toast.deletedTitle"),
        message: t("schoolsAdmin.toast.deletedMessage"),
      });
      setDeleteTarget(null);
      await load();
    } catch (error) {
      showError({
        title: t("schoolsAdmin.toast.deleteFailedTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, load, showSuccess, showError, t]);

  if (!isAllowed) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title={t("schoolsAdmin.header.title")}
          onBack={() => moduleBack(router)}
          testID="schools-header"
          topInset={insets.top}
        />
        <View style={styles.stateWrap}>
          <EmptyState
            icon="lock-closed-outline"
            title={t("schoolsAdmin.access.deniedTitle")}
            message={t("schoolsAdmin.access.deniedMessage")}
          />
        </View>
      </View>
    );
  }

  const isFormsTab = tab === "forms";

  return (
    <View style={styles.root}>
      <ModuleHeader
        title={t("schoolsAdmin.header.title")}
        subtitle={
          isFormsTab
            ? formContext?.type === "edit-school"
              ? t("schoolsAdmin.form.editHeroTitle")
              : t("schoolsAdmin.form.createHeroTitle")
            : t("schoolsAdmin.header.subtitle")
        }
        onBack={() => (isFormsTab ? exitForms() : moduleBack(router))}
        testID="schools-header"
        topInset={insets.top}
        secondaryAction={
          tab === "list"
            ? {
                icon: "search-outline",
                onPress: () => setFiltersOpen((current) => !current),
                testID: "schools-search-toggle",
                accessibilityLabel: t("schoolsAdmin.search.accessibilityLabel"),
                active: filtersOpen,
              }
            : undefined
        }
      />

      {!isFormsTab ? (
        <UnderlineTabs
          items={[
            { key: "synthese", label: t("schoolsAdmin.tabs.synthese") },
            { key: "list", label: t("schoolsAdmin.tabs.list") },
            { key: "help", label: t("schoolsAdmin.tabs.help") },
          ]}
          activeKey={tab as ListTabKey}
          onSelect={setTab}
          testIDPrefix="schools-tab"
        />
      ) : null}

      {tab === "list" && filtersOpen ? (
        <View style={styles.searchPanel} testID="schools-filter-panel">
          <TextFormField
            label={t("schoolsAdmin.search.label")}
            value={search}
            onChangeText={setSearch}
            onBlur={() => {}}
            placeholder={t("schoolsAdmin.search.placeholder")}
            testID="schools-filter-search-input"
          />
        </View>
      ) : null}

      {isFormsTab ? (
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
            {formContext?.type === "edit-school" && formContext.school ? (
              <FormHero
                icon="create-outline"
                title={t("schoolsAdmin.form.editHeroTitle")}
                subtitle={t("schoolsAdmin.form.editHeroSubtitle")}
                palette="warm"
                testID="schools-form-hero"
              />
            ) : (
              <FormHero
                icon="person-add-outline"
                title={t("schoolsAdmin.form.createHeroTitle")}
                subtitle={t("schoolsAdmin.form.createHeroSubtitle")}
                palette="teal"
                testID="schools-form-hero"
              />
            )}

            {formContext?.type === "edit-school" && formContext.school ? (
              <EditSchoolFormContent
                school={formContext.school}
                isSubmitting={isSubmittingEdit}
                onCancel={exitForms}
                onSubmit={(values) =>
                  handleUpdate(formContext.school!.id, values)
                }
                t={t}
              />
            ) : (
              <CreateSchoolFormContent
                isSubmitting={isSubmittingCreate}
                onCancel={exitForms}
                onSubmit={handleCreate}
                t={t}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : isLoading ? (
        <View style={styles.stateWrap}>
          <LoadingBlock label={t("schoolsAdmin.detail.loading")} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              testID="schools-error-banner"
            />
          ) : null}

          {tab === "synthese" ? (
            <SynthesisTab schools={schools} t={t} />
          ) : tab === "help" ? (
            <SectionCard
              title={t("schoolsAdmin.help.title")}
              testID="schools-help-card"
            >
              <Text style={styles.helpText}>{t("schoolsAdmin.help.body")}</Text>
            </SectionCard>
          ) : filteredSchools.length === 0 ? (
            <EmptyState
              icon="business-outline"
              title={t("schoolsAdmin.empty.title")}
              message={
                search.trim()
                  ? t("schoolsAdmin.empty.messageSearch")
                  : t("schoolsAdmin.empty.messageDefault")
              }
            />
          ) : (
            filteredSchools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                t={t}
                onView={() =>
                  router.push({
                    pathname: "/(home)/schools/[schoolId]",
                    params: { schoolId: school.id },
                  })
                }
                onEdit={() => {
                  setFormContext({
                    type: "edit-school",
                    originTab: "list",
                    school,
                  });
                  setTab("forms");
                }}
                onDelete={() => setDeleteTarget(school)}
              />
            ))
          )}
        </ScrollView>
      )}

      {!isFormsTab && (tab === "list" || tab === "synthese") ? (
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: insets.bottom + 18 + BOTTOM_TAB_BAR_HEIGHT },
          ]}
          onPress={openFab}
          testID="schools-fab"
          accessibilityLabel={t("schoolsAdmin.fab.create")}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={deleteTarget != null}
        title={t("schoolsAdmin.confirmDelete.title")}
        message={deleteTarget ? `${deleteTarget.name}` : ""}
        confirmLabel={t("schoolsAdmin.confirmDelete.confirm")}
        cancelLabel={t("schoolsAdmin.confirmDelete.cancel")}
        variant="danger"
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  searchPanel: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ── Synthesis ─────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cycleRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 6,
  },
  cycleRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cycleRowCount: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cycleRowDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ── Card ──────────────────────────────────────────────────────────────
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.primary,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  schoolSlug: {
    fontSize: 12,
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statsText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statsDot: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  footerBtnPrimaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  footerBtnLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  footerBtnDangerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.notification,
  },

  // ── Forms ─────────────────────────────────────────────────────────────
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 16,
  },
  form: {
    gap: 10,
  },
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
    marginTop: 6,
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

  // ── FAB ───────────────────────────────────────────────────────────────
  fab: {
    position: "absolute",
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
