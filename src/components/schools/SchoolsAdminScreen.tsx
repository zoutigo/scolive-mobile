import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { InlineSearchSelect } from "../InlineSearchSelect";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
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
import { CyclePill, LanguagePill } from "./SchoolBadges";
import {
  EMPTY_SCHOOL_ADMIN_ENTRY,
  SchoolAdminEntryForm,
  schoolAdminEntryToPayload,
  validateSchoolAdminEntry,
  type SchoolAdminEntryErrors,
  type SchoolAdminEntryValue,
} from "./SchoolAdminEntryForm";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import {
  CAMEROON_CITIES_BY_REGION,
  CAMEROON_COUNTRY,
  CAMEROON_REGIONS,
} from "../../data/cameroon-locations";
import type {
  AddSchoolAdminPayload,
  CreateSchoolPayload,
  SchoolCycle,
  SchoolLanguageSystem,
  SchoolRow,
  SchoolsListMeta,
  SchoolsOverview,
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

type SchoolsFilters = {
  cycle: SchoolCycle | null;
  languageSystem: SchoolLanguageSystem | null;
};

const NO_FILTERS: SchoolsFilters = { cycle: null, languageSystem: null };

const CYCLE_KEYS: SchoolCycle[] = ["PRIMARY", "SECONDARY"];
const LANGUAGE_KEYS: SchoolLanguageSystem[] = [
  "FRANCOPHONE",
  "ANGLOPHONE",
  "BILINGUAL",
];

const SEARCH_DEBOUNCE_MS = 300;

function hasActiveFilters(filters: SchoolsFilters) {
  return filters.cycle != null || filters.languageSystem != null;
}

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
  onSubmit: (
    values: CreateSchoolPayload,
    additionalAdmins: AddSchoolAdminPayload[],
  ) => Promise<void> | void;
  t: TranslateFn;
}) {
  const { t } = props;
  const schema = useMemo(() => buildCreateSchema(t), [t]);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      country: CAMEROON_COUNTRY.value,
      region: "",
      city: "",
      cycle: "",
      languageSystem: "",
    },
  });

  const region = watch("region");

  const [mainAdmin, setMainAdmin] = useState<SchoolAdminEntryValue>(
    EMPTY_SCHOOL_ADMIN_ENTRY,
  );
  const [mainAdminErrors, setMainAdminErrors] =
    useState<SchoolAdminEntryErrors>({});
  const [additionalAdmins, setAdditionalAdmins] = useState<
    SchoolAdminEntryValue[]
  >([]);
  const [additionalAdminErrors, setAdditionalAdminErrors] = useState<
    SchoolAdminEntryErrors[]
  >([]);

  const submit = handleSubmit(
    async (values) => {
      const mainErrors = validateSchoolAdminEntry(mainAdmin, t);
      const additionalErrorsList = additionalAdmins.map((admin) =>
        validateSchoolAdminEntry(admin, t),
      );
      const hasMainErrors = Object.keys(mainErrors).length > 0;
      const hasAdditionalErrors = additionalErrorsList.some(
        (entryErrors) => Object.keys(entryErrors).length > 0,
      );

      if (hasMainErrors || hasAdditionalErrors) {
        setMainAdminErrors(mainErrors);
        setAdditionalAdminErrors(additionalErrorsList);
        return;
      }
      setMainAdminErrors({});
      setAdditionalAdminErrors([]);

      const mainPayload = schoolAdminEntryToPayload(mainAdmin);
      if (!mainPayload) return;

      const additionalPayloads = additionalAdmins
        .map(schoolAdminEntryToPayload)
        .filter(
          (payload): payload is AddSchoolAdminPayload => payload !== null,
        );

      await props.onSubmit(
        {
          name: values.name,
          country: values.country || undefined,
          region: values.region || undefined,
          city: values.city || undefined,
          cycle: values.cycle || undefined,
          languageSystem: values.languageSystem || undefined,
          ...(mainPayload.email
            ? { schoolAdminEmail: mainPayload.email }
            : {
                schoolAdminPhone: mainPayload.phone,
                schoolAdminPin: mainPayload.pin,
              }),
        },
        additionalPayloads,
      );
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
        render={({ field: { value } }) => (
          <InlineSearchSelect
            label={t("schoolsAdmin.form.country")}
            options={[CAMEROON_COUNTRY]}
            value={value || CAMEROON_COUNTRY.value}
            onChange={() => {}}
            disabled
            testID="schools-create-country"
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange } }) => (
          <InlineSearchSelect
            label={t("schoolsAdmin.form.region")}
            options={CAMEROON_REGIONS}
            value={value ?? ""}
            onChange={(next) => {
              onChange(next);
              setValue("city", "");
            }}
            placeholder={t("schoolsAdmin.form.regionPlaceholder")}
            testID="schools-create-region"
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { value, onChange } }) => (
          <InlineSearchSelect
            label={t("schoolsAdmin.form.city")}
            options={region ? (CAMEROON_CITIES_BY_REGION[region] ?? []) : []}
            value={value ?? ""}
            onChange={onChange}
            disabled={!region}
            placeholder={
              region
                ? t("schoolsAdmin.form.cityPlaceholder")
                : t("schoolsAdmin.form.cityPlaceholderNoRegion")
            }
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
            <InlineSelectDropDown
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
            <InlineSelectDropDown
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

      <Text style={styles.formSectionTitle}>
        {t("schoolsAdmin.form.mainAdminTitle")}
      </Text>
      <SchoolAdminEntryForm
        value={mainAdmin}
        onChange={setMainAdmin}
        errors={mainAdminErrors}
        title={t("schoolsAdmin.form.mainAdminTitle")}
        testIDPrefix="schools-create-main-admin"
        t={t}
      />

      <Text style={styles.formSectionTitle}>
        {t("schoolsAdmin.form.additionalAdminsTitle")}
      </Text>
      {additionalAdmins.map((admin, index) => (
        <SchoolAdminEntryForm
          key={index}
          value={admin}
          onChange={(next) =>
            setAdditionalAdmins((prev) =>
              prev.map((entry, i) => (i === index ? next : entry)),
            )
          }
          errors={additionalAdminErrors[index]}
          title={`${t("schoolsAdmin.form.additionalAdminTitle")} ${index + 2}`}
          onRemove={() => {
            setAdditionalAdmins((prev) => prev.filter((_, i) => i !== index));
            setAdditionalAdminErrors((prev) =>
              prev.filter((_, i) => i !== index),
            );
          }}
          testIDPrefix={`schools-create-additional-admin-${index}`}
          t={t}
        />
      ))}
      <TouchableOpacity
        style={styles.addAdminButton}
        onPress={() =>
          setAdditionalAdmins((prev) => [...prev, EMPTY_SCHOOL_ADMIN_ENTRY])
        }
        testID="schools-create-add-admin"
      >
        <Text style={styles.addAdminButtonLabel}>
          {t("schoolsAdmin.form.addAdminButton")}
        </Text>
      </TouchableOpacity>

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: props.school.name,
      country: CAMEROON_COUNTRY.value,
      region: props.school.region ?? "",
      city: props.school.city ?? "",
      cycle: props.school.cycle ?? "",
      languageSystem: props.school.languageSystem ?? "",
    },
  });

  const region = watch("region");

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
        render={({ field: { value } }) => (
          <InlineSearchSelect
            label={t("schoolsAdmin.form.country")}
            options={[CAMEROON_COUNTRY]}
            value={value || CAMEROON_COUNTRY.value}
            onChange={() => {}}
            disabled
            testID="schools-edit-country"
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field: { value, onChange } }) => (
          <InlineSearchSelect
            label={t("schoolsAdmin.form.region")}
            options={CAMEROON_REGIONS}
            value={value ?? ""}
            onChange={(next) => {
              onChange(next);
              setValue("city", "");
            }}
            placeholder={t("schoolsAdmin.form.regionPlaceholder")}
            testID="schools-edit-region"
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field: { value, onChange } }) => (
          <InlineSearchSelect
            label={t("schoolsAdmin.form.city")}
            options={region ? (CAMEROON_CITIES_BY_REGION[region] ?? []) : []}
            value={value ?? ""}
            onChange={onChange}
            disabled={!region}
            placeholder={
              region
                ? t("schoolsAdmin.form.cityPlaceholder")
                : t("schoolsAdmin.form.cityPlaceholderNoRegion")
            }
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
            <InlineSelectDropDown
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
            <InlineSelectDropDown
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

function OverviewStatCard(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  testID?: string;
}) {
  return (
    <View
      style={[styles.overviewStatCard, { borderLeftColor: props.color }]}
      testID={props.testID}
    >
      <Ionicons name={props.icon} size={20} color={props.color} />
      <View style={styles.overviewStatTexts}>
        <Text style={styles.overviewStatValue}>{props.value}</Text>
        <Text style={styles.overviewStatLabel}>{props.label}</Text>
      </View>
    </View>
  );
}

function SynthesisTab(props: {
  overview: SchoolsOverview | null;
  isLoading: boolean;
  t: TranslateFn;
}) {
  const { overview, isLoading, t } = props;

  if (!overview) {
    if (isLoading) {
      return <LoadingBlock label={t("schoolsAdmin.detail.loading")} />;
    }
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
      <Text style={styles.overviewSectionTitle}>
        {t("schoolsAdmin.synthese.overviewTitle")}
      </Text>
      <View style={styles.overviewStatsRow} testID="schools-synthese-overview">
        <OverviewStatCard
          icon="business-outline"
          label={t("schoolsAdmin.synthese.totalSchools")}
          value={overview.totals.schools}
          color={colors.primary}
          testID="schools-synthese-total-schools"
        />
        <OverviewStatCard
          icon="people-outline"
          label={t("schoolsAdmin.synthese.totalStudents")}
          value={overview.totals.students}
          color={colors.accentTeal}
          testID="schools-synthese-total-students"
        />
        <OverviewStatCard
          icon="grid-outline"
          label={t("schoolsAdmin.synthese.totalClasses")}
          value={overview.totals.classes}
          color={colors.warmAccent}
          testID="schools-synthese-total-classes"
        />
      </View>

      <SectionCard
        title={t("schoolsAdmin.synthese.byCycleTitle")}
        testID="schools-synthese-by-cycle"
      >
        <View style={{ gap: 10 }}>
          {(["PRIMARY", "SECONDARY", "UNSET"] as const).map((cycleKey) => {
            const group = overview.byCycle[cycleKey];
            if (group.schools === 0) return null;
            return (
              <View
                key={cycleKey}
                style={styles.cycleRow}
                testID={`schools-synthese-cycle-${cycleKey}`}
              >
                <View style={styles.cycleRowHeader}>
                  <CyclePill cycle={cycleKey === "UNSET" ? null : cycleKey} />
                  <Text style={styles.cycleRowCount}>
                    {group.schools} {t("schoolsAdmin.synthese.schoolsLabel")}
                  </Text>
                </View>
                <Text style={styles.cycleRowDetail}>
                  {group.students} {t("schoolsAdmin.synthese.studentsLabel")} ·{" "}
                  {group.classes} {t("schoolsAdmin.synthese.classesLabel")}
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

  const [overview, setOverview] = useState<SchoolsOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isOverviewRefreshing, setIsOverviewRefreshing] = useState(false);

  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [listMeta, setListMeta] = useState<SchoolsListMeta | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isListLoadingMore, setIsListLoadingMore] = useState(false);
  const [isListRefreshing, setIsListRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SchoolRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<SchoolsFilters>(NO_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<SchoolsFilters>(NO_FILTERS);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const role = user?.activeRole ?? user?.role ?? null;
  const isAllowed = roleAllowsPlatformAdmin(role);

  const loadOverview = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      setErrorMessage(null);
      if (mode === "refresh") setIsOverviewRefreshing(true);
      else setIsOverviewLoading(true);
      try {
        const result = await schoolsApi.getSchoolsOverview();
        setOverview(result);
      } catch (error) {
        setErrorMessage(extractApiError(error));
      } finally {
        setIsOverviewLoading(false);
        setIsOverviewRefreshing(false);
      }
    },
    [],
  );

  const loadList = useCallback(
    async (
      page: number,
      filters: SchoolsFilters,
      searchQuery: string,
      mode: "reset" | "append" | "refresh",
    ) => {
      setErrorMessage(null);
      if (mode === "append") setIsListLoadingMore(true);
      else if (mode === "refresh") setIsListRefreshing(true);
      else setIsListLoading(true);
      try {
        const result = await schoolsApi.listSchools({
          page,
          search: searchQuery || undefined,
          cycle: filters.cycle ?? undefined,
          languageSystem: filters.languageSystem ?? undefined,
        });
        setSchools((prev) =>
          mode === "append" ? [...prev, ...result.items] : result.items,
        );
        setListMeta(result.meta);
      } catch (error) {
        setErrorMessage(extractApiError(error));
      } finally {
        setIsListLoading(false);
        setIsListLoadingMore(false);
        setIsListRefreshing(false);
      }
    },
    [],
  );

  // Précharge overview + première page de la liste dès l'arrivée sur le
  // module, indépendamment de l'onglet actif (évite l'attente au clic sur
  // "Liste").
  useEffect(() => {
    if (!isAllowed) {
      setIsOverviewLoading(false);
      return;
    }
    void loadOverview("initial");
  }, [isAllowed, loadOverview]);

  useEffect(() => {
    if (!isAllowed) {
      setIsListLoading(false);
      return;
    }
    void loadList(1, appliedFilters, appliedSearch, "reset");
  }, [isAllowed, appliedFilters, appliedSearch, loadList]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const handleLoadMoreSchools = useCallback(() => {
    if (!listMeta) return;
    if (listMeta.page >= listMeta.totalPages) return;
    if (isListLoadingMore) return;
    void loadList(listMeta.page + 1, appliedFilters, appliedSearch, "append");
  }, [listMeta, isListLoadingMore, appliedFilters, appliedSearch, loadList]);

  const handleListRefresh = useCallback(() => {
    void loadList(1, appliedFilters, appliedSearch, "refresh");
  }, [loadList, appliedFilters, appliedSearch]);

  const reloadAfterMutation = useCallback(async () => {
    await Promise.all([
      loadOverview("refresh"),
      loadList(1, appliedFilters, appliedSearch, "refresh"),
    ]);
  }, [loadOverview, loadList, appliedFilters, appliedSearch]);

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
    async (
      values: CreateSchoolPayload,
      additionalAdmins: AddSchoolAdminPayload[],
    ) => {
      setIsSubmittingCreate(true);
      try {
        const result = await schoolsApi.createSchool(values);
        const activationCodes: string[] = [];
        if (result.activationCode) activationCodes.push(result.activationCode);

        let additionalFailures = 0;
        for (const admin of additionalAdmins) {
          try {
            const addResult = await schoolsApi.addSchoolAdmin(
              result.school.id,
              admin,
            );
            if (addResult.activationCode) {
              activationCodes.push(addResult.activationCode);
            }
          } catch {
            additionalFailures += 1;
          }
        }

        const messageParts = [
          result.userExisted
            ? t("schoolsAdmin.toast.createdExisting")
            : t("schoolsAdmin.toast.createdNew"),
          ...activationCodes.map(
            (code) => `${t("schoolsAdmin.form.activationCodeBanner")}: ${code}`,
          ),
        ];
        showSuccess({
          title: t("schoolsAdmin.toast.createdTitle"),
          message: messageParts.join("\n"),
        });

        if (additionalFailures > 0) {
          showError({
            title: t("schoolsAdmin.toast.additionalAdminsFailedTitle"),
            message: String(additionalFailures),
          });
        }

        await reloadAfterMutation();
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
    [reloadAfterMutation, showSuccess, showError, t, formContext],
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
        await reloadAfterMutation();
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
    [reloadAfterMutation, showSuccess, showError, t, formContext],
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
      await reloadAfterMutation();
    } catch (error) {
      showError({
        title: t("schoolsAdmin.toast.deleteFailedTitle"),
        message: extractApiError(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, reloadAfterMutation, showSuccess, showError, t]);

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

      {tab === "list" ? (
        <View style={styles.searchRow} testID="schools-search-row">
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder={t("schoolsAdmin.search.placeholder")}
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              autoCapitalize="none"
              accessibilityLabel={t("schoolsAdmin.search.accessibilityLabel")}
              testID="schools-search-input"
            />
            {searchInput.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchInput("")}
                testID="schools-search-clear"
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
            testID="schools-filter-toggle"
            accessibilityLabel={t(
              "schoolsAdmin.filters.toggleAccessibilityLabel",
            )}
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

      {tab === "list" && filtersOpen ? (
        <View style={styles.filterPanel} testID="schools-filter-panel">
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelHeaderIcon}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentTealDark}
              />
            </View>
            <Text style={styles.filterPanelHeaderTitle}>
              {t("schoolsAdmin.filters.toggleAccessibilityLabel")}
            </Text>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>
              {t("schoolsAdmin.filters.cycleLabel")}
            </Text>
            <View style={styles.filterChipsRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  draftFilters.cycle == null && styles.filterChipActive,
                ]}
                onPress={() =>
                  setDraftFilters((current) => ({ ...current, cycle: null }))
                }
                testID="schools-filter-cycle-all"
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    draftFilters.cycle == null && styles.filterChipLabelActive,
                  ]}
                >
                  {t("schoolsAdmin.filters.allOption")}
                </Text>
              </TouchableOpacity>
              {CYCLE_KEYS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterChip,
                    draftFilters.cycle === key && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setDraftFilters((current) => ({ ...current, cycle: key }))
                  }
                  testID={`schools-filter-cycle-${key}`}
                >
                  <Text
                    style={[
                      styles.filterChipLabel,
                      draftFilters.cycle === key &&
                        styles.filterChipLabelActive,
                    ]}
                  >
                    {t(`schoolsAdmin.cycle.${key}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>
              {t("schoolsAdmin.filters.languageLabel")}
            </Text>
            <View style={styles.filterChipsRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  draftFilters.languageSystem == null &&
                    styles.filterChipActive,
                ]}
                onPress={() =>
                  setDraftFilters((current) => ({
                    ...current,
                    languageSystem: null,
                  }))
                }
                testID="schools-filter-language-all"
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    draftFilters.languageSystem == null &&
                      styles.filterChipLabelActive,
                  ]}
                >
                  {t("schoolsAdmin.filters.allOption")}
                </Text>
              </TouchableOpacity>
              {LANGUAGE_KEYS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filterChip,
                    draftFilters.languageSystem === key &&
                      styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setDraftFilters((current) => ({
                      ...current,
                      languageSystem: key,
                    }))
                  }
                  testID={`schools-filter-language-${key}`}
                >
                  <Text
                    style={[
                      styles.filterChipLabel,
                      draftFilters.languageSystem === key &&
                        styles.filterChipLabelActive,
                    ]}
                  >
                    {t(`schoolsAdmin.language.${key}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={resetFilters}
              testID="schools-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("schoolsAdmin.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID="schools-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("schoolsAdmin.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={applyFilters}
              testID="schools-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("schoolsAdmin.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
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
      ) : tab === "list" ? (
        isListLoading && schools.length === 0 ? (
          <View style={styles.stateWrap}>
            <LoadingBlock label={t("schoolsAdmin.detail.loading")} />
          </View>
        ) : (
          <>
            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
                testID="schools-error-banner"
              />
            ) : null}
            <InfiniteScrollList
              data={schools}
              renderItem={({ item: school }) => (
                <SchoolCard
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
              )}
              keyExtractor={(school) => school.id}
              onRefresh={handleListRefresh}
              refreshing={isListRefreshing}
              onLoadMore={handleLoadMoreSchools}
              hasMore={listMeta ? listMeta.page < listMeta.totalPages : false}
              isLoadingMore={isListLoadingMore}
              emptyComponent={
                <EmptyState
                  icon="business-outline"
                  title={t("schoolsAdmin.empty.title")}
                  message={
                    appliedSearch || hasActiveFilters(appliedFilters)
                      ? t("schoolsAdmin.empty.messageSearch")
                      : t("schoolsAdmin.empty.messageDefault")
                  }
                />
              }
              contentContainerStyle={styles.contentContainer}
              testID="schools-list"
            />
          </>
        )
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isOverviewRefreshing}
              onRefresh={() => void loadOverview("refresh")}
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
            <SynthesisTab
              overview={overview}
              isLoading={isOverviewLoading}
              t={t}
            />
          ) : (
            <SectionCard
              title={t("schoolsAdmin.help.title")}
              testID="schools-help-card"
            >
              <Text style={styles.helpText}>{t("schoolsAdmin.help.body")}</Text>
            </SectionCard>
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
    marginHorizontal: 16,
    marginBottom: 12,
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
  filterGroup: {
    gap: 8,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipLabelActive: {
    color: colors.white,
  },
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
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ── Synthesis ─────────────────────────────────────────────────────────
  overviewSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  overviewStatsRow: {
    flexDirection: "row",
    gap: 10,
  },
  overviewStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    borderLeftWidth: 3,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overviewStatTexts: {
    flexShrink: 1,
  },
  overviewStatValue: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  overviewStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
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
  formSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
  },
  addAdminButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 4,
  },
  addAdminButtonLabel: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
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
