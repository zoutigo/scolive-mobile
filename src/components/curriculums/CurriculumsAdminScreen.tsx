import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
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
import { curriculumsApi } from "../../api/curriculums.api";
import { platformCatalogApi } from "../../api/platform-catalog.api";
import { ConfirmDialog } from "../ConfirmDialog";
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
  SectionCard,
} from "../timetable/TimetableCommon";
import type {
  CreateAcademicLevelPayload,
  CreateCurriculumPayload,
  CreateSubjectPayload,
  CreateTrackPayload,
  CurriculumAcademicLevel,
  CurriculumRow,
  CurriculumSubjectCatalogItem,
  CurriculumSubjectRow,
  CurriculumTrack,
  UpdateAcademicLevelPayload,
  UpdateTrackPayload,
  UpsertCurriculumSubjectPayload,
} from "../../types/curriculums.types";
import type {
  CreateNationalCyclePayload,
  NationalAcademicLevelRow,
  NationalCurriculumRow,
  NationalCurriculumSubjectRow,
  NationalCycleRow,
  NationalSubjectRow,
  NationalTrackRow,
  SchoolLanguageSystem,
  UpsertNationalCurriculumSubjectPayload,
} from "../../types/platform-catalog.types";
import { moduleBack } from "../../utils/moduleBack";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListTabKey = "levels" | "tracks" | "curriculums" | "subjects" | "help";
type TabKey = ListTabKey | "forms";

type NationalTabKey =
  | "overview"
  | "cycles"
  | "levels"
  | "tracks"
  | "curriculums"
  | "subjects";
type NationalPaneKey = NationalTabKey | "forms";

type NationalFormContext =
  | {
      kind: "cycle";
      mode: FormMode;
      originPane: NationalTabKey;
      id?: string;
      initialValues?: { code: string; label: string };
    }
  | {
      kind: "level";
      mode: FormMode;
      originPane: NationalTabKey;
      id?: string;
      initialValues?: {
        code: string;
        label: string;
        cycleId?: string;
        languageSystem?: SchoolLanguageSystem | "";
      };
    }
  | {
      kind: "track";
      mode: FormMode;
      originPane: NationalTabKey;
      id?: string;
      initialValues?: { code: string; label: string };
    }
  | {
      kind: "curriculum";
      mode: FormMode;
      originPane: NationalTabKey;
      item?: NationalCurriculumRow | null;
    }
  | {
      kind: "subject";
      mode: FormMode;
      originPane: NationalTabKey;
      id?: string;
      initialValues?: { code: string; name: string };
    };

type NationalDeleteTarget =
  | { kind: "cycle"; id: string; label: string }
  | { kind: "level"; id: string; label: string }
  | { kind: "track"; id: string; label: string }
  | { kind: "curriculum"; id: string; label: string }
  | { kind: "subject"; id: string; label: string };

type FormMode = "create" | "edit";
type LevelTrackKind = "level" | "track";

type FormContext =
  | {
      kind: LevelTrackKind;
      mode: FormMode;
      originTab: ListTabKey;
      itemId?: string;
      initialValues?: {
        code: string;
        label: string;
      };
    }
  | {
      kind: "curriculum";
      mode: FormMode;
      originTab: ListTabKey;
      item?: CurriculumRow | null;
    }
  | {
      kind: "curriculum-subject";
      mode: FormMode;
      originTab: ListTabKey;
      item?: CurriculumSubjectRow | null;
    }
  | {
      kind: "subject";
      mode: FormMode;
      originTab: ListTabKey;
    };

type DeleteTarget =
  | { kind: "level"; id: string; label: string }
  | { kind: "track"; id: string; label: string }
  | { kind: "curriculum"; id: string; label: string }
  | {
      kind: "curriculum-subject";
      curriculumId: string;
      subjectId: string;
      label: string;
    };

const BASE_TAB_ITEMS: Array<{ key: ListTabKey; label: string }> = [
  { key: "levels", label: "Niveaux" },
  { key: "tracks", label: "Filières" },
  { key: "curriculums", label: "Curriculums" },
  { key: "subjects", label: "Matières" },
  { key: "help", label: "Aide" },
];

const LEVEL_TRACK_FORM_SCHEMA = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire."),
  label: z.string().trim().min(1, "Le libellé est obligatoire."),
});

const NATIONAL_CYCLE_FORM_SCHEMA = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire."),
  label: z.string().trim().min(1, "Le libellé est obligatoire."),
});

const NATIONAL_LEVEL_FORM_SCHEMA = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire."),
  label: z.string().trim().min(1, "Le libellé est obligatoire."),
  cycleId: z.string(),
  languageSystem: z.union([
    z.literal("FRANCOPHONE"),
    z.literal("ANGLOPHONE"),
    z.literal("BILINGUAL"),
    z.literal(""),
  ]),
});

const CURRICULUM_FORM_SCHEMA = z.object({
  academicLevelId: z
    .string()
    .trim()
    .min(1, "Le niveau académique est obligatoire."),
  trackId: z.string().trim().optional(),
});

const NATIONAL_CURRICULUM_FORM_SCHEMA = z.object({
  academicLevelId: z
    .string()
    .trim()
    .min(1, "Le niveau académique est obligatoire."),
  trackId: z.string().trim().optional(),
});

const NATIONAL_TRACK_FORM_SCHEMA = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire."),
  label: z.string().trim().min(1, "Le libellé est obligatoire."),
});

const NATIONAL_SUBJECT_FORM_SCHEMA = z.object({
  code: z.string().trim().min(1, "Le code est obligatoire."),
  name: z.string().trim().min(1, "Le nom est obligatoire."),
});

const NATIONAL_CURRICULUM_SUBJECT_FORM_SCHEMA = z.object({
  subjectId: z.string().trim().min(1, "Choisissez une matière."),
  coefficient: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Le coefficient doit être positif.",
    ),
  weeklyHours: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Les heures doivent être positives.",
    ),
  isMandatory: z.boolean(),
});

function roleAllowsPlatformAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const CURRICULUM_SUBJECT_FORM_SCHEMA = z.object({
  curriculumId: z.string().trim().min(1, "Choisissez un curriculum."),
  subjectId: z.string().trim().min(1, "Choisissez une matière."),
  coefficient: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Le coefficient doit être positif.",
    ),
  weeklyHours: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      "Les heures doivent être positives.",
    ),
  isMandatory: z.boolean(),
});

const SUBJECT_FORM_SCHEMA = z.object({
  name: z.string().trim().min(1, "Le nom de la matière est obligatoire."),
});

function normalizeOptionalNumber(value?: string) {
  if (!value || value.trim() === "") {
    return undefined;
  }
  return Number(value);
}

function buildCurriculumNamePreview(params: {
  academicLevelId: string;
  trackId?: string;
  academicLevels: CurriculumAcademicLevel[];
  tracks: CurriculumTrack[];
}) {
  const level = params.academicLevels.find(
    (entry) => entry.id === params.academicLevelId,
  );
  if (!level) return "Sélectionnez un niveau";
  const track = params.tracks.find((entry) => entry.id === params.trackId);
  return `${level.code} - ${track?.code ?? "TRONC_COMMUN"}`;
}

function formatCount(value: number, singular: string, plural?: string) {
  return `${value} ${value > 1 ? (plural ?? `${singular}s`) : singular}`;
}

function accentForTab(tab: ListTabKey) {
  switch (tab) {
    case "levels":
      return "#D89B5B";
    case "tracks":
      return "#247C72";
    case "curriculums":
      return "#0C5FA8";
    case "subjects":
      return "#E07B2A";
    case "help":
      return "#7A5C3E";
  }
}

function rowPaletteForTab(tab: Exclude<ListTabKey, "help">, index: number) {
  const palettes: Record<Exclude<ListTabKey, "help">, [string, string]> = {
    levels: ["#FFF9F3", "#FFF2E4"],
    tracks: ["#F4FCFA", "#EAF7F4"],
    curriculums: ["#F5FAFF", "#ECF4FB"],
    subjects: ["#FFF7F0", "#FFF0E1"],
  };

  const [base, alternate] = palettes[tab];
  return {
    backgroundColor: index % 2 === 0 ? base : alternate,
    accentColor: accentForTab(tab),
  };
}

function alternateCard(index: number) {
  return index % 2 === 0 ? colors.surface : "#FFF8F0";
}

type TextFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  testID: string;
  keyboardType?: "default" | "numeric";
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

function CompactSelectField(props: {
  label?: string;
  value: string;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder?: string;
  onChange: (value: string) => void;
  testID: string;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected =
    props.options.find((option) => option.value === props.value) ?? null;

  return (
    <View style={styles.formField}>
      {props.label ? <Text style={styles.formLabel}>{props.label}</Text> : null}
      <TouchableOpacity
        style={[
          styles.compactSelectTrigger,
          props.error ? styles.compactSelectTriggerError : null,
          props.disabled ? styles.compactSelectTriggerDisabled : null,
        ]}
        onPress={() => {
          if (!props.disabled) {
            setOpen(true);
          }
        }}
        disabled={props.disabled}
        testID={props.testID}
      >
        <View style={styles.compactSelectTextWrap}>
          <Text style={styles.compactSelectValue} numberOfLines={1}>
            {selected?.label ?? props.placeholder ?? "Sélectionner…"}
          </Text>
          {selected?.meta ? (
            <Text style={styles.compactSelectMeta} numberOfLines={1}>
              {selected.meta}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {props.error ? (
        <Text style={styles.formError} testID={`${props.testID}-error`}>
          {props.error}
        </Text>
      ) : null}

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.selectOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
          testID={`${props.testID}-overlay`}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
            style={styles.selectSheet}
            testID={`${props.testID}-sheet`}
          >
            <Text
              style={styles.selectSheetTitle}
              testID={`${props.testID}-sheet-title`}
            >
              {props.label ?? "Sélection"}
            </Text>
            <ScrollView
              contentContainerStyle={styles.selectSheetOptions}
              showsVerticalScrollIndicator={false}
            >
              {props.options.map((option) => {
                const active = option.value === props.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.selectOptionRow,
                      active && styles.selectOptionRowActive,
                    ]}
                    onPress={() => {
                      props.onChange(option.value);
                      setOpen(false);
                    }}
                    testID={`${props.testID}-option-${option.value}`}
                  >
                    <View style={styles.selectOptionTextWrap}>
                      <Text
                        style={[
                          styles.selectOptionLabel,
                          active && styles.selectOptionLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.meta ? (
                        <Text
                          style={[
                            styles.selectOptionMeta,
                            active && styles.selectOptionMetaActive,
                          ]}
                        >
                          {option.meta}
                        </Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.warmAccent}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function FormActions(props: {
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  testIDPrefix: string;
}) {
  return (
    <View
      style={styles.formActions}
      testID={`${props.testIDPrefix}-action-bar`}
    >
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
          (props.submitDisabled || props.isSubmitting) &&
            styles.primaryActionDisabled,
        ]}
        disabled={props.submitDisabled || props.isSubmitting}
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
// LevelTrackFormContent — formulaire inline niveau/filière (sans Modal)
// ---------------------------------------------------------------------------

function LevelTrackFormContent(props: {
  kind: LevelTrackKind;
  mode: FormMode;
  initialValues?: {
    code: string;
    label: string;
  };
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    values: CreateAcademicLevelPayload | CreateTrackPayload,
  ) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof LEVEL_TRACK_FORM_SCHEMA>>({
    resolver: zodResolver(LEVEL_TRACK_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      code: props.initialValues?.code ?? "",
      label: props.initialValues?.label ?? "",
    },
  });

  const actionLabel =
    props.mode === "create"
      ? props.kind === "level"
        ? "Créer le niveau"
        : "Créer la filière"
      : "Enregistrer";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID={`curriculum-${props.kind}-form-content`}
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Code"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={props.kind === "level" ? "Ex: 6EME" : "Ex: C"}
              error={errors.code?.message}
              testID={`curriculum-${props.kind}-code-input`}
            />
          )}
        />
        <Controller
          control={control}
          name="label"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Libellé"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={
                props.kind === "level" ? "Ex: Sixième" : "Ex: Scientifique"
              }
              error={errors.label?.message}
              testID={`curriculum-${props.kind}-label-input`}
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={actionLabel}
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (values) => props.onSubmit(values),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix={`curriculum-${props.kind}-form`}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// CurriculumFormContent — formulaire inline curriculum (sans Modal)
// ---------------------------------------------------------------------------

function CurriculumFormContent(props: {
  item?: CurriculumRow | null;
  academicLevels: CurriculumAcademicLevel[];
  tracks: CurriculumTrack[];
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateCurriculumPayload) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    watch,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof CURRICULUM_FORM_SCHEMA>>({
    resolver: zodResolver(CURRICULUM_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      academicLevelId:
        props.item?.academicLevelId ?? props.academicLevels[0]?.id ?? "",
      trackId: props.item?.trackId ?? "",
    },
  });

  const values = watch();
  const previewName = buildCurriculumNamePreview({
    academicLevelId: values.academicLevelId,
    trackId: values.trackId,
    academicLevels: props.academicLevels,
    tracks: props.tracks,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="curriculum-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="academicLevelId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Niveau académique"
              value={value}
              onChange={onChange}
              options={props.academicLevels.map((level) => ({
                value: level.id,
                label: level.label,
                meta: level.code,
              }))}
              testID="curriculum-form-level"
              error={errors.academicLevelId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="trackId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Filière"
              value={value ?? ""}
              onChange={onChange}
              options={[
                {
                  value: "",
                  label: "Tronc commun",
                  meta: "Sans filière dédiée",
                },
                ...props.tracks.map((track) => ({
                  value: track.id,
                  label: track.label,
                  meta: track.code,
                })),
              ]}
              testID="curriculum-form-track"
            />
          )}
        />
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Nom généré automatiquement</Text>
          <Text
            style={styles.previewValue}
            testID="curriculum-form-name-preview"
          >
            {previewName}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={props.item ? "Enregistrer" : "Créer le curriculum"}
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (formValues) =>
                props.onSubmit({
                  academicLevelId: formValues.academicLevelId,
                  trackId: formValues.trackId?.trim()
                    ? formValues.trackId.trim()
                    : undefined,
                }),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="curriculum-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// CurriculumSubjectFormContent — formulaire inline matière (sans Modal)
// ---------------------------------------------------------------------------

function CurriculumSubjectFormContent(props: {
  item?: CurriculumSubjectRow | null;
  selectedCurriculumId: string;
  curriculums: CurriculumRow[];
  subjects: CurriculumSubjectCatalogItem[];
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (
    curriculumId: string,
    values: UpsertCurriculumSubjectPayload,
  ) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof CURRICULUM_SUBJECT_FORM_SCHEMA>>({
    resolver: zodResolver(CURRICULUM_SUBJECT_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      curriculumId: props.selectedCurriculumId,
      subjectId: props.item?.subjectId ?? "",
      coefficient:
        props.item?.coefficient != null ? String(props.item.coefficient) : "",
      weeklyHours:
        props.item?.weeklyHours != null ? String(props.item.weeklyHours) : "",
      isMandatory: props.item?.isMandatory ?? true,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="curriculum-subject-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="curriculumId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Curriculum"
              value={value}
              onChange={onChange}
              options={props.curriculums.map((curriculum) => ({
                value: curriculum.id,
                label: curriculum.name,
                meta: `${formatCount(curriculum._count.subjects, "matière")} · ${formatCount(
                  curriculum._count.classes,
                  "classe",
                )}`,
              }))}
              testID="curriculum-subject-form-curriculum"
              error={errors.curriculumId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="subjectId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Matière"
              value={value}
              onChange={onChange}
              options={props.subjects.map((subject) => ({
                value: subject.id,
                label: subject.name,
                meta:
                  subject._count?.curriculumSubjects != null
                    ? formatCount(
                        subject._count.curriculumSubjects,
                        "curriculum",
                      )
                    : undefined,
              }))}
              testID="curriculum-subject-form-subject"
              error={errors.subjectId?.message}
              disabled={!!props.item}
            />
          )}
        />
        <Controller
          control={control}
          name="coefficient"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Coefficient"
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: 4"
              keyboardType="numeric"
              error={errors.coefficient?.message}
              testID="curriculum-subject-form-coefficient"
            />
          )}
        />
        <Controller
          control={control}
          name="weeklyHours"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Heures / semaine"
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: 3"
              keyboardType="numeric"
              error={errors.weeklyHours?.message}
              testID="curriculum-subject-form-weekly-hours"
            />
          )}
        />
        <Controller
          control={control}
          name="isMandatory"
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchField}>
              <View style={styles.switchFieldText}>
                <Text style={styles.formLabel}>Matière obligatoire</Text>
                <Text style={styles.switchFieldHint}>
                  Désactivez pour une matière optionnelle.
                </Text>
              </View>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{
                  false: colors.warmBorder,
                  true: colors.accentTeal,
                }}
                thumbColor={colors.white}
                testID="curriculum-subject-form-mandatory"
              />
            </View>
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={props.item ? "Enregistrer" : "Ajouter la matière"}
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (values) => {
                await props.onSubmit(values.curriculumId, {
                  subjectId: values.subjectId,
                  isMandatory: values.isMandatory,
                  coefficient: normalizeOptionalNumber(values.coefficient),
                  weeklyHours: normalizeOptionalNumber(values.weeklyHours),
                });
              },
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="curriculum-subject-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// SubjectFormContent — formulaire inline création de matière (sans Modal)
// ---------------------------------------------------------------------------

function SubjectFormContent(props: {
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateSubjectPayload) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof SUBJECT_FORM_SCHEMA>>({
    resolver: zodResolver(SUBJECT_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      name: "",
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="curriculum-subject-catalog-form-content"
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
              testID="curriculum-subject-catalog-name-input"
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel="Créer la matière"
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (values) => props.onSubmit(values),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="curriculum-subject-catalog-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Hero content helpers
// ---------------------------------------------------------------------------

function formHeroIcon(
  ctx: FormContext,
): React.ComponentProps<typeof Ionicons>["name"] {
  if (ctx.kind === "level") {
    return ctx.mode === "create" ? "layers-outline" : "create-outline";
  }
  if (ctx.kind === "track") {
    return ctx.mode === "create" ? "git-branch-outline" : "create-outline";
  }
  if (ctx.kind === "curriculum") {
    return ctx.mode === "create" ? "albums-outline" : "create-outline";
  }
  if (ctx.kind === "subject") {
    return "add-circle-outline";
  }
  return ctx.mode === "create" ? "link-outline" : "create-outline";
}

function formHeroTitle(ctx: FormContext): string {
  if (ctx.kind === "level") {
    return ctx.mode === "create"
      ? "Créer un niveau académique"
      : "Modifier le niveau académique";
  }
  if (ctx.kind === "track") {
    return ctx.mode === "create"
      ? "Créer une filière académique"
      : "Modifier la filière académique";
  }
  if (ctx.kind === "curriculum") {
    return ctx.mode === "create"
      ? "Créer un curriculum"
      : "Modifier le curriculum";
  }
  if (ctx.kind === "subject") {
    return "Créer une matière";
  }
  return ctx.mode === "create"
    ? "Ajouter une matière"
    : "Modifier la matière du curriculum";
}

function formHeroSubtitle(ctx: FormContext): string {
  if (ctx.kind === "level") {
    return "Définissez un repère académique clair pour organiser les classes et les programmes.";
  }
  if (ctx.kind === "track") {
    return "Structurez les parcours proposés avec une dénomination claire et réutilisable.";
  }
  if (ctx.kind === "curriculum") {
    return "Assemblez un niveau et une filière dans un formulaire compact pour produire un intitulé cohérent.";
  }
  if (ctx.kind === "subject") {
    return "Ajoutez une matière au catalogue de l'établissement. Elle pourra ensuite être liée à n'importe quel curriculum.";
  }
  return "Sélectionnez rapidement le curriculum et la matière, puis ajustez les paramètres pédagogiques.";
}

function renderFormContent(
  ctx: FormContext,
  props: {
    orderedLevels: CurriculumAcademicLevel[];
    orderedTracks: CurriculumTrack[];
    orderedCurriculums: CurriculumRow[];
    subjects: CurriculumSubjectCatalogItem[];
    selectedCurriculumId: string;
    isSubmittingLevelTrack: boolean;
    isSubmittingCurriculum: boolean;
    isSubmittingCurriculumSubject: boolean;
    isSubmittingSubject: boolean;
    onCancel: () => void;
    onSubmitLevelTrack: (
      values: CreateAcademicLevelPayload | CreateTrackPayload,
    ) => Promise<void> | void;
    onSubmitCurriculum: (
      values: CreateCurriculumPayload,
    ) => Promise<void> | void;
    onSubmitCurriculumSubject: (
      curriculumId: string,
      values: UpsertCurriculumSubjectPayload,
    ) => Promise<void> | void;
    onSubmitSubject: (values: CreateSubjectPayload) => Promise<void> | void;
  },
) {
  switch (ctx.kind) {
    case "level":
    case "track":
      return (
        <LevelTrackFormContent
          kind={ctx.kind}
          mode={ctx.mode}
          initialValues={ctx.initialValues}
          isSubmitting={props.isSubmittingLevelTrack}
          onCancel={props.onCancel}
          onSubmit={props.onSubmitLevelTrack}
        />
      );
    case "curriculum":
      return (
        <CurriculumFormContent
          item={ctx.item}
          academicLevels={props.orderedLevels}
          tracks={props.orderedTracks}
          isSubmitting={props.isSubmittingCurriculum}
          onCancel={props.onCancel}
          onSubmit={props.onSubmitCurriculum}
        />
      );
    case "curriculum-subject":
      return (
        <CurriculumSubjectFormContent
          item={ctx.item}
          selectedCurriculumId={
            ctx.item && props.selectedCurriculumId
              ? props.selectedCurriculumId
              : props.selectedCurriculumId ||
                props.orderedCurriculums[0]?.id ||
                ""
          }
          curriculums={props.orderedCurriculums}
          subjects={props.subjects}
          isSubmitting={props.isSubmittingCurriculumSubject}
          onCancel={props.onCancel}
          onSubmit={props.onSubmitCurriculumSubject}
        />
      );
    case "subject":
      return (
        <SubjectFormContent
          isSubmitting={props.isSubmittingSubject}
          onCancel={props.onCancel}
          onSubmit={props.onSubmitSubject}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// NationalCatalogSection — catalogue national (plateforme)
// ---------------------------------------------------------------------------

const NATIONAL_LEVEL_LANGUAGE_SYSTEM_OPTIONS = [
  { value: "FRANCOPHONE", label: "Francophone" },
  { value: "ANGLOPHONE", label: "Anglophone" },
  { value: "BILINGUAL", label: "Bilingue" },
];

function NationalCycleFormContent(props: {
  mode: FormMode;
  initialValues?: { code: string; label: string };
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateNationalCyclePayload) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof NATIONAL_CYCLE_FORM_SCHEMA>>({
    resolver: zodResolver(NATIONAL_CYCLE_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      code: props.initialValues?.code ?? "",
      label: props.initialValues?.label ?? "",
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="national-cycle-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Code"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: PRIMARY"
              error={errors.code?.message}
              testID="national-cycle-form-code"
            />
          )}
        />
        <Controller
          control={control}
          name="label"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Libellé"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: Primaire"
              error={errors.label?.message}
              testID="national-cycle-form-label"
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer le cycle" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (values) => props.onSubmit(values),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="national-cycle-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function NationalLevelFormContent(props: {
  cycles: NationalCycleRow[];
  mode: FormMode;
  initialValues?: {
    code: string;
    label: string;
    cycleId?: string;
    languageSystem?: "FRANCOPHONE" | "ANGLOPHONE" | "BILINGUAL" | "";
  };
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    code: string;
    label: string;
    cycleId?: string;
    languageSystem?: "FRANCOPHONE" | "ANGLOPHONE" | "BILINGUAL";
  }) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof NATIONAL_LEVEL_FORM_SCHEMA>>({
    resolver: zodResolver(NATIONAL_LEVEL_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      code: props.initialValues?.code ?? "",
      label: props.initialValues?.label ?? "",
      cycleId: props.initialValues?.cycleId ?? "",
      languageSystem: props.initialValues?.languageSystem ?? "",
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="national-level-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Code"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: 6EME"
              error={errors.code?.message}
              testID="national-level-form-code"
            />
          )}
        />
        <Controller
          control={control}
          name="label"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Libellé"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: 6ème"
              error={errors.label?.message}
              testID="national-level-form-label"
            />
          )}
        />
        <Controller
          control={control}
          name="cycleId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Cycle"
              value={value}
              onChange={onChange}
              options={props.cycles.map((cycle) => ({
                value: cycle.id,
                label: cycle.label,
                meta: cycle.code,
              }))}
              placeholder="Sélectionner un cycle"
              testID="national-level-form-cycle"
              error={errors.cycleId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="languageSystem"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Système linguistique"
              value={value}
              onChange={(next) =>
                onChange(
                  next as "" | "FRANCOPHONE" | "ANGLOPHONE" | "BILINGUAL",
                )
              }
              options={NATIONAL_LEVEL_LANGUAGE_SYSTEM_OPTIONS}
              placeholder="Sélectionner un système"
              testID="national-level-form-language-system"
              error={errors.languageSystem?.message}
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer le niveau" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (values) =>
                props.onSubmit({
                  code: values.code,
                  label: values.label,
                  cycleId: values.cycleId || undefined,
                  languageSystem: values.languageSystem || undefined,
                }),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="national-level-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function NationalCurriculumFormContent(props: {
  levels: NationalAcademicLevelRow[];
  tracks: NationalTrackRow[];
  mode: FormMode;
  initialValues?: { academicLevelId: string; trackId?: string | null };
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    academicLevelId: string;
    trackId?: string;
  }) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof NATIONAL_CURRICULUM_FORM_SCHEMA>>({
    resolver: zodResolver(NATIONAL_CURRICULUM_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      academicLevelId:
        props.initialValues?.academicLevelId ?? props.levels[0]?.id ?? "",
      trackId: props.initialValues?.trackId ?? "",
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="national-curriculum-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="academicLevelId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Niveau académique"
              value={value}
              onChange={onChange}
              options={props.levels.map((level) => ({
                value: level.id,
                label: level.label,
                meta: level.code,
              }))}
              testID="national-curriculum-form-level"
              error={errors.academicLevelId?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="trackId"
          render={({ field: { value, onChange } }) => (
            <CompactSelectField
              label="Filière"
              value={value ?? ""}
              onChange={onChange}
              options={[
                {
                  value: "",
                  label: "Tronc commun",
                  meta: "Sans filière dédiée",
                },
                ...props.tracks.map((track) => ({
                  value: track.id,
                  label: track.label,
                  meta: track.code,
                })),
              ]}
              testID="national-curriculum-form-track"
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer le curriculum" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(async (values) =>
              props.onSubmit({
                academicLevelId: values.academicLevelId,
                trackId: values.trackId || undefined,
              }),
            )()
          }
          testIDPrefix="national-curriculum-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function NationalTrackFormContent(props: {
  mode: FormMode;
  initialValues?: { code: string; label: string };
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: { code: string; label: string }) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof NATIONAL_TRACK_FORM_SCHEMA>>({
    resolver: zodResolver(NATIONAL_TRACK_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: props.initialValues ?? { code: "", label: "" },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="national-track-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Code"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: D"
              error={errors.code?.message}
              testID="national-track-form-code"
            />
          )}
        />
        <Controller
          control={control}
          name="label"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Libellé"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: Série D"
              error={errors.label?.message}
              testID="national-track-form-label"
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer la filière" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (values) => props.onSubmit(values),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="national-track-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function NationalSubjectFormContent(props: {
  mode: FormMode;
  initialValues?: { code: string; name: string };
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: { code: string; name: string }) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof NATIONAL_SUBJECT_FORM_SCHEMA>>({
    resolver: zodResolver(NATIONAL_SUBJECT_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: props.initialValues ?? { code: "", name: "" },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="national-subject-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Code"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: MATH"
              error={errors.code?.message}
              testID="national-subject-form-code"
            />
          )}
        />
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Nom"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: Mathématiques"
              error={errors.name?.message}
              testID="national-subject-form-name"
            />
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer la matière" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={() =>
            void handleSubmit(
              async (values) => props.onSubmit(values),
              (errs) => {
                const first = Object.keys(errs)[0];
                if (first)
                  focusField(first as Parameters<typeof focusField>[0]);
              },
            )()
          }
          testIDPrefix="national-subject-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function NationalCurriculumSubjectFormContent(props: {
  subjects: NationalSubjectRow[];
  isSubmitting?: boolean;
  onSubmit: (
    values: UpsertNationalCurriculumSubjectPayload,
  ) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof NATIONAL_CURRICULUM_SUBJECT_FORM_SCHEMA>>({
    resolver: zodResolver(NATIONAL_CURRICULUM_SUBJECT_FORM_SCHEMA),
    mode: "onChange",
    defaultValues: {
      subjectId: "",
      coefficient: "",
      weeklyHours: "",
      isMandatory: true,
    },
  });

  const submit = handleSubmit(
    async (values) => {
      await props.onSubmit({
        subjectId: values.subjectId,
        isMandatory: values.isMandatory,
        coefficient: normalizeOptionalNumber(values.coefficient),
        weeklyHours: normalizeOptionalNumber(values.weeklyHours),
      });
      reset({
        subjectId: values.subjectId,
        coefficient: "",
        weeklyHours: "",
        isMandatory: values.isMandatory,
      });
    },
    (errs) => {
      const first = Object.keys(errs)[0];
      if (first) focusField(first as Parameters<typeof focusField>[0]);
    },
  );

  return (
    <View
      style={styles.nationalForm}
      testID="curriculums-national-curriculum-subject-form"
    >
      <Controller
        control={control}
        name="subjectId"
        render={({ field: { value, onChange } }) => (
          <CompactSelectField
            label="Matière"
            value={value}
            onChange={onChange}
            options={props.subjects.map((subject) => ({
              value: subject.id,
              label: subject.name,
              meta: subject.code,
            }))}
            testID="curriculums-national-curriculum-subject-subject"
            error={errors.subjectId?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="coefficient"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Coefficient"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: 4"
            keyboardType="numeric"
            error={errors.coefficient?.message}
            testID="curriculums-national-curriculum-subject-coefficient"
          />
        )}
      />
      <Controller
        control={control}
        name="weeklyHours"
        render={({ field: { value, onChange, onBlur, ref } }) => (
          <TextFormField
            ref={ref}
            label="Heures / semaine"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Ex: 3"
            keyboardType="numeric"
            error={errors.weeklyHours?.message}
            testID="curriculums-national-curriculum-subject-weekly-hours"
          />
        )}
      />
      <Controller
        control={control}
        name="isMandatory"
        render={({ field: { value, onChange } }) => (
          <View style={styles.switchField}>
            <View style={styles.switchFieldText}>
              <Text style={styles.formLabel}>Matière obligatoire</Text>
              <Text style={styles.switchFieldHint}>
                Désactivez pour une matière optionnelle.
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{
                false: colors.warmBorder,
                true: colors.accentTeal,
              }}
              thumbColor={colors.white}
              testID="curriculums-national-curriculum-subject-mandatory"
            />
          </View>
        )}
      />
      <TouchableOpacity
        style={[
          styles.primaryAction,
          props.isSubmitting && styles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting}
        onPress={submit}
        testID="curriculums-national-curriculum-subject-submit"
      >
        <Text style={styles.primaryActionLabel}>
          {props.isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const NATIONAL_TAB_ITEMS: Array<{ key: NationalTabKey; label: string }> = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "cycles", label: "Cycles" },
  { key: "levels", label: "Niveaux" },
  { key: "tracks", label: "Filières" },
  { key: "curriculums", label: "Curriculums" },
  { key: "subjects", label: "Matières" },
];

const NATIONAL_TAB_STYLE_MAP: Record<
  Exclude<NationalTabKey, "overview">,
  Exclude<ListTabKey, "help">
> = {
  cycles: "levels",
  levels: "tracks",
  tracks: "tracks",
  curriculums: "curriculums",
  subjects: "subjects",
};

function nationalAccent(tab: Exclude<NationalTabKey, "overview">) {
  return accentForTab(NATIONAL_TAB_STYLE_MAP[tab]);
}

function nationalRowPalette(
  tab: Exclude<NationalTabKey, "overview">,
  index: number,
) {
  return rowPaletteForTab(NATIONAL_TAB_STYLE_MAP[tab], index);
}

function nationalFormHeroIcon(
  ctx: NationalFormContext,
): React.ComponentProps<typeof Ionicons>["name"] {
  if (ctx.kind === "cycle") {
    return ctx.mode === "create" ? "layers-outline" : "create-outline";
  }
  if (ctx.kind === "level") {
    return ctx.mode === "create" ? "school-outline" : "create-outline";
  }
  if (ctx.kind === "track") {
    return ctx.mode === "create" ? "git-branch-outline" : "create-outline";
  }
  if (ctx.kind === "curriculum") {
    return ctx.mode === "create" ? "albums-outline" : "create-outline";
  }
  return ctx.mode === "create" ? "book-outline" : "create-outline";
}

function nationalFormHeroTitle(ctx: NationalFormContext): string {
  if (ctx.kind === "cycle") {
    return ctx.mode === "create"
      ? "Créer un cycle national"
      : "Modifier le cycle national";
  }
  if (ctx.kind === "level") {
    return ctx.mode === "create"
      ? "Créer un niveau national"
      : "Modifier le niveau national";
  }
  if (ctx.kind === "track") {
    return ctx.mode === "create"
      ? "Créer une filière nationale"
      : "Modifier la filière nationale";
  }
  if (ctx.kind === "curriculum") {
    return ctx.mode === "create"
      ? "Créer un curriculum national"
      : "Modifier le curriculum national";
  }
  return ctx.mode === "create"
    ? "Créer une matière nationale"
    : "Modifier la matière nationale";
}

function nationalFormHeroSubtitle(ctx: NationalFormContext): string {
  if (ctx.kind === "cycle") {
    return "Les cycles structurent les niveaux nationaux (primaire, secondaire...) pour toutes les écoles.";
  }
  if (ctx.kind === "level") {
    return "Rattachez ce niveau à un cycle pour qu'il apparaisse dans le bon regroupement.";
  }
  if (ctx.kind === "track") {
    return "Les filières nationales pourront être rattachées à un niveau lors de la création d'un curriculum national.";
  }
  if (ctx.kind === "curriculum") {
    return "Assemblez un niveau national pour produire un curriculum partagé par toutes les écoles.";
  }
  return "Ajoutez une matière au catalogue national. Elle pourra être rattachée à n'importe quel curriculum national.";
}

function NationalCatalogTabs(props: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [pane, setPane] = useState<NationalPaneKey>("overview");
  const [formContext, setFormContext] = useState<NationalFormContext | null>(
    null,
  );
  const [cycles, setCycles] = useState<NationalCycleRow[]>([]);
  const [levels, setLevels] = useState<NationalAcademicLevelRow[]>([]);
  const [tracks, setTracks] = useState<NationalTrackRow[]>([]);
  const [curriculums, setCurriculums] = useState<NationalCurriculumRow[]>([]);
  const [subjects, setSubjects] = useState<NationalSubjectRow[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<
    NationalCurriculumSubjectRow[]
  >([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [selectedCycleFilterId, setSelectedCycleFilterId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCurriculumSubjects, setIsLoadingCurriculumSubjects] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmittingCycle, setIsSubmittingCycle] = useState(false);
  const [isSubmittingLevel, setIsSubmittingLevel] = useState(false);
  const [isSubmittingTrack, setIsSubmittingTrack] = useState(false);
  const [isSubmittingCurriculum, setIsSubmittingCurriculum] = useState(false);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
  const [isSubmittingCurriculumSubject, setIsSubmittingCurriculumSubject] =
    useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NationalDeleteTarget | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [cycleRows, levelRows, trackRows, curriculumRows, subjectRows] =
        await Promise.all([
          platformCatalogApi.listNationalCycles(),
          platformCatalogApi.listNationalAcademicLevels(),
          platformCatalogApi.listNationalTracks(),
          platformCatalogApi.listNationalCurriculums(),
          platformCatalogApi.listNationalSubjects(),
        ]);
      setCycles(cycleRows);
      setLevels(levelRows);
      setTracks(trackRows);
      setCurriculums(curriculumRows);
      setSubjects(subjectRows);
    } catch (error) {
      setErrorMessage(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCurriculumSubjects = useCallback(
    async (curriculumId: string) => {
      setIsLoadingCurriculumSubjects(true);
      try {
        setCurriculumSubjects(
          await platformCatalogApi.listNationalCurriculumSubjects(curriculumId),
        );
      } catch (error) {
        showError({
          title: "Chargement impossible",
          message: extractApiError(error),
        });
      } finally {
        setIsLoadingCurriculumSubjects(false);
      }
    },
    [showError],
  );

  useEffect(() => {
    if (!selectedCurriculumId) {
      setCurriculumSubjects([]);
      return;
    }
    void loadCurriculumSubjects(selectedCurriculumId);
  }, [selectedCurriculumId, loadCurriculumSubjects]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await load();
    if (selectedCurriculumId) {
      await loadCurriculumSubjects(selectedCurriculumId);
    }
    setRefreshing(false);
  }, [load, loadCurriculumSubjects, selectedCurriculumId]);

  const orderedCycles = useMemo(
    () => [...cycles].sort((a, b) => a.code.localeCompare(b.code)),
    [cycles],
  );
  const orderedLevels = useMemo(
    () => [...levels].sort((a, b) => a.code.localeCompare(b.code)),
    [levels],
  );
  const filteredLevels = useMemo(
    () =>
      selectedCycleFilterId
        ? orderedLevels.filter(
            (level) => level.cycleId === selectedCycleFilterId,
          )
        : orderedLevels,
    [orderedLevels, selectedCycleFilterId],
  );
  const orderedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.code.localeCompare(b.code)),
    [tracks],
  );
  const orderedCurriculums = useMemo(
    () => [...curriculums].sort((a, b) => a.name.localeCompare(b.name)),
    [curriculums],
  );
  const orderedSubjects = useMemo(
    () => [...subjects].sort((a, b) => a.name.localeCompare(b.name)),
    [subjects],
  );

  const cycleBreakdown = useMemo(() => {
    const unclassifiedCount = levels.filter((level) => !level.cycleId).length;
    return {
      perCycle: orderedCycles.map((cycle) => {
        const levelsForCycle = levels.filter(
          (level) => level.cycleId === cycle.id,
        );
        return {
          cycle,
          count: levelsForCycle.length,
          languageSystemBreakdown: (
            ["FRANCOPHONE", "ANGLOPHONE", "BILINGUAL"] as const
          ).map((languageSystem) => ({
            languageSystem,
            count: levelsForCycle.filter(
              (level) => level.languageSystem === languageSystem,
            ).length,
          })),
        };
      }),
      unclassifiedCount,
    };
  }, [orderedCycles, levels]);

  function exitForms() {
    const origin = formContext?.originPane ?? "overview";
    setFormContext(null);
    setPane(origin);
  }

  function openFab() {
    if (pane === "cycles") {
      setFormContext({ kind: "cycle", mode: "create", originPane: "cycles" });
      setPane("forms");
      return;
    }
    if (pane === "levels") {
      setFormContext({
        kind: "level",
        mode: "create",
        originPane: "levels",
        initialValues: selectedCycleFilterId
          ? {
              code: "",
              label: "",
              cycleId: selectedCycleFilterId,
              languageSystem: "",
            }
          : undefined,
      });
      setPane("forms");
      return;
    }
    if (pane === "tracks") {
      setFormContext({ kind: "track", mode: "create", originPane: "tracks" });
      setPane("forms");
      return;
    }
    if (pane === "curriculums") {
      setFormContext({
        kind: "curriculum",
        mode: "create",
        originPane: "curriculums",
        item: null,
      });
      setPane("forms");
      return;
    }
    if (pane === "subjects") {
      setFormContext({
        kind: "subject",
        mode: "create",
        originPane: "subjects",
      });
      setPane("forms");
    }
  }

  async function handleCycleSubmit(values: CreateNationalCyclePayload) {
    if (!formContext || formContext.kind !== "cycle") return;
    const ctx = formContext;
    setIsSubmittingCycle(true);
    try {
      if (ctx.mode === "create") {
        await platformCatalogApi.createNationalCycle(values);
      } else if (ctx.id) {
        await platformCatalogApi.updateNationalCycle(ctx.id, values);
      }
      await load();
      showSuccess({
        title: ctx.mode === "create" ? "Cycle créé" : "Cycle modifié",
        message: "Les changements sont visibles pour toutes les écoles.",
      });
      const origin = ctx.originPane;
      setTimeout(() => {
        setPane(origin);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingCycle(false);
    }
  }

  async function handleLevelSubmit(values: {
    code: string;
    label: string;
    cycleId?: string;
    languageSystem?: SchoolLanguageSystem;
  }) {
    if (!formContext || formContext.kind !== "level") return;
    const ctx = formContext;
    setIsSubmittingLevel(true);
    try {
      if (ctx.mode === "create") {
        await platformCatalogApi.createNationalAcademicLevel(values);
      } else if (ctx.id) {
        await platformCatalogApi.updateNationalAcademicLevel(ctx.id, values);
      }
      await load();
      showSuccess({
        title:
          ctx.mode === "create"
            ? "Niveau national créé"
            : "Niveau national modifié",
        message: "Les changements sont visibles pour toutes les écoles.",
      });
      const origin = ctx.originPane;
      setTimeout(() => {
        setPane(origin);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingLevel(false);
    }
  }

  async function handleTrackSubmit(values: { code: string; label: string }) {
    if (!formContext || formContext.kind !== "track") return;
    const ctx = formContext;
    setIsSubmittingTrack(true);
    try {
      if (ctx.mode === "create") {
        await platformCatalogApi.createNationalTrack(values);
      } else if (ctx.id) {
        await platformCatalogApi.updateNationalTrack(ctx.id, values);
      }
      await load();
      showSuccess({
        title: ctx.mode === "create" ? "Filière créée" : "Filière modifiée",
        message: "Les changements sont visibles pour toutes les écoles.",
      });
      const origin = ctx.originPane;
      setTimeout(() => {
        setPane(origin);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingTrack(false);
    }
  }

  async function handleCurriculumSubmit(values: {
    academicLevelId: string;
    trackId?: string;
  }) {
    if (!formContext || formContext.kind !== "curriculum") return;
    const ctx = formContext;
    setIsSubmittingCurriculum(true);
    try {
      if (ctx.mode === "create") {
        await platformCatalogApi.createNationalCurriculum(values);
      } else if (ctx.item?.id) {
        await platformCatalogApi.updateNationalCurriculum(ctx.item.id, values);
      }
      await load();
      showSuccess({
        title: ctx.mode === "create" ? "Curriculum créé" : "Curriculum modifié",
        message: "Les changements sont visibles pour toutes les écoles.",
      });
      const origin = ctx.originPane;
      setTimeout(() => {
        setPane(origin);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingCurriculum(false);
    }
  }

  async function handleSubjectSubmit(values: { code: string; name: string }) {
    if (!formContext || formContext.kind !== "subject") return;
    const ctx = formContext;
    setIsSubmittingSubject(true);
    try {
      if (ctx.mode === "create") {
        await platformCatalogApi.createNationalSubject(values);
      } else if (ctx.id) {
        await platformCatalogApi.updateNationalSubject(ctx.id, values);
      }
      await load();
      showSuccess({
        title: ctx.mode === "create" ? "Matière créée" : "Matière modifiée",
        message: "Les changements sont visibles pour toutes les écoles.",
      });
      const origin = ctx.originPane;
      setTimeout(() => {
        setPane(origin);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingSubject(false);
    }
  }

  const handleUpsertCurriculumSubject = useCallback(
    async (values: UpsertNationalCurriculumSubjectPayload) => {
      if (!selectedCurriculumId) return;
      setIsSubmittingCurriculumSubject(true);
      try {
        await platformCatalogApi.upsertNationalCurriculumSubject(
          selectedCurriculumId,
          values,
        );
        showSuccess({
          title: "Matière rattachée",
          message: "Le rattachement au curriculum national est enregistré.",
        });
        await loadCurriculumSubjects(selectedCurriculumId);
        await load();
      } catch (error) {
        showError({
          title: "Enregistrement impossible",
          message: extractApiError(error),
        });
      } finally {
        setIsSubmittingCurriculumSubject(false);
      }
    },
    [
      selectedCurriculumId,
      loadCurriculumSubjects,
      load,
      showSuccess,
      showError,
    ],
  );

  const handleDeleteCurriculumSubject = useCallback(
    async (subjectId: string) => {
      if (!selectedCurriculumId) return;
      try {
        await platformCatalogApi.deleteNationalCurriculumSubject(
          selectedCurriculumId,
          subjectId,
        );
        showSuccess({
          title: "Matière détachée",
          message: "Le rattachement a été retiré du curriculum national.",
        });
        await loadCurriculumSubjects(selectedCurriculumId);
        await load();
      } catch (error) {
        showError({
          title: "Suppression impossible",
          message: extractApiError(error),
        });
      }
    },
    [
      selectedCurriculumId,
      loadCurriculumSubjects,
      load,
      showSuccess,
      showError,
    ],
  );

  async function runDelete(
    action: () => Promise<void>,
    successTitle: string,
    successMessage: string,
  ) {
    setIsDeleting(true);
    try {
      await action();
      showSuccess({ title: successTitle, message: successMessage });
      await load();
    } catch (error) {
      showError({
        title: "Suppression impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);

    if (target.kind === "cycle") {
      await runDelete(
        async () => {
          await platformCatalogApi.deleteNationalCycle(target.id);
        },
        "Cycle supprimé",
        "Le cycle a été retiré du catalogue national.",
      );
      return;
    }
    if (target.kind === "level") {
      await runDelete(
        async () => {
          await platformCatalogApi.deleteNationalAcademicLevel(target.id);
        },
        "Niveau supprimé",
        "Le niveau a été retiré du catalogue national.",
      );
      return;
    }
    if (target.kind === "track") {
      await runDelete(
        async () => {
          await platformCatalogApi.deleteNationalTrack(target.id);
        },
        "Filière supprimée",
        "La filière a été retirée du catalogue national.",
      );
      return;
    }
    if (target.kind === "curriculum") {
      await runDelete(
        async () => {
          await platformCatalogApi.deleteNationalCurriculum(target.id);
        },
        "Curriculum supprimé",
        "Le curriculum a été retiré du catalogue national.",
      );
      return;
    }
    await runDelete(
      async () => {
        await platformCatalogApi.deleteNationalSubject(target.id);
      },
      "Matière supprimée",
      "La matière a été retirée du catalogue national.",
    );
  }

  const fabDisabled = pane === "overview" || pane === "forms";

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title="Catalogue national"
          subtitle="Structure pédagogique commune à toutes les écoles"
          onBack={props.onBack}
          testID="national-catalog-header"
          backTestID="national-catalog-back-btn"
          topInset={insets.top}
        />
        <View style={styles.stateWrap}>
          <LoadingBlock label="Chargement du catalogue national..." />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title="Catalogue national"
        subtitle="Structure pédagogique commune à toutes les écoles"
        onBack={() => (pane === "forms" ? exitForms() : props.onBack())}
        testID="national-catalog-header"
        backTestID="national-catalog-back-btn"
        topInset={insets.top}
      />

      {pane !== "forms" ? (
        <UnderlineTabs
          items={NATIONAL_TAB_ITEMS}
          activeKey={pane}
          onSelect={setPane}
          testIDPrefix="national-catalog-tab"
        />
      ) : null}

      {pane === "forms" && formContext ? (
        <View
          style={styles.formsTabContent}
          testID="national-catalog-forms-tab"
        >
          <View style={styles.heroWrapper}>
            <FormHero
              icon={nationalFormHeroIcon(formContext)}
              title={nationalFormHeroTitle(formContext)}
              subtitle={nationalFormHeroSubtitle(formContext)}
              palette={formContext.mode === "create" ? "teal" : "warm"}
              testID="national-catalog-form-hero"
            />
          </View>
          {formContext.kind === "cycle" ? (
            <NationalCycleFormContent
              mode={formContext.mode}
              initialValues={formContext.initialValues}
              isSubmitting={isSubmittingCycle}
              onCancel={exitForms}
              onSubmit={handleCycleSubmit}
            />
          ) : null}
          {formContext.kind === "level" ? (
            <NationalLevelFormContent
              cycles={orderedCycles}
              mode={formContext.mode}
              initialValues={formContext.initialValues}
              isSubmitting={isSubmittingLevel}
              onCancel={exitForms}
              onSubmit={handleLevelSubmit}
            />
          ) : null}
          {formContext.kind === "track" ? (
            <NationalTrackFormContent
              mode={formContext.mode}
              initialValues={formContext.initialValues}
              isSubmitting={isSubmittingTrack}
              onCancel={exitForms}
              onSubmit={handleTrackSubmit}
            />
          ) : null}
          {formContext.kind === "curriculum" ? (
            <NationalCurriculumFormContent
              levels={orderedLevels}
              tracks={orderedTracks}
              mode={formContext.mode}
              initialValues={
                formContext.item
                  ? {
                      academicLevelId: formContext.item.academicLevelId,
                      trackId: formContext.item.trackId,
                    }
                  : undefined
              }
              isSubmitting={isSubmittingCurriculum}
              onCancel={exitForms}
              onSubmit={handleCurriculumSubmit}
            />
          ) : null}
          {formContext.kind === "subject" ? (
            <NationalSubjectFormContent
              mode={formContext.mode}
              initialValues={formContext.initialValues}
              isSubmitting={isSubmittingSubject}
              onCancel={exitForms}
              onSubmit={handleSubjectSubmit}
            />
          ) : null}
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void refreshAll();
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
                testID="national-catalog-error-banner"
              />
            ) : null}

            {pane === "overview" ? (
              <>
                <View style={styles.statRow} testID="national-overview-stats">
                  <View
                    style={[styles.statTile, { backgroundColor: "#FFF2E4" }]}
                  >
                    <Text style={styles.statTileValue}>{cycles.length}</Text>
                    <Text style={styles.statTileLabel}>
                      {formatCount(cycles.length, "cycle")}
                    </Text>
                  </View>
                  <View
                    style={[styles.statTile, { backgroundColor: "#EAF7F4" }]}
                  >
                    <Text style={styles.statTileValue}>{levels.length}</Text>
                    <Text style={styles.statTileLabel}>
                      {formatCount(levels.length, "niveau", "niveaux")}
                    </Text>
                  </View>
                  <View
                    style={[styles.statTile, { backgroundColor: "#ECF4FB" }]}
                  >
                    <Text style={styles.statTileValue}>
                      {curriculums.length}
                    </Text>
                    <Text style={styles.statTileLabel}>
                      {formatCount(curriculums.length, "curriculum")}
                    </Text>
                  </View>
                  <View
                    style={[styles.statTile, { backgroundColor: "#FFF0E1" }]}
                  >
                    <Text style={styles.statTileValue}>{subjects.length}</Text>
                    <Text style={styles.statTileLabel}>
                      {formatCount(subjects.length, "matière")}
                    </Text>
                  </View>
                </View>

                <SectionCard
                  title="Répartition par cycle"
                  subtitle="Niveaux nationaux regroupés par cycle"
                  testID="national-overview-cycles-card"
                >
                  {cycleBreakdown.perCycle.length === 0 &&
                  cycleBreakdown.unclassifiedCount === 0 ? (
                    <EmptyState
                      icon="layers-outline"
                      title="Aucun cycle"
                      message="Créez un premier cycle dans l'onglet Cycles."
                    />
                  ) : (
                    <View style={styles.listStack}>
                      {cycleBreakdown.perCycle.map((entry) => (
                        <View
                          key={entry.cycle.id}
                          style={styles.cycleBreakdownRow}
                          testID={`national-overview-cycle-${entry.cycle.id}`}
                        >
                          <Text style={styles.entityTitle}>
                            {entry.cycle.label}
                          </Text>
                          <Text style={styles.entityMeta}>
                            {formatCount(
                              entry.count,
                              "niveau national",
                              "niveaux nationaux",
                            )}
                            {entry.languageSystemBreakdown.some(
                              (item) => item.count > 0,
                            )
                              ? ` · ${entry.languageSystemBreakdown
                                  .filter((item) => item.count > 0)
                                  .map(
                                    (item) =>
                                      `${
                                        NATIONAL_LEVEL_LANGUAGE_SYSTEM_OPTIONS.find(
                                          (option) =>
                                            option.value ===
                                            item.languageSystem,
                                        )?.label
                                      }: ${item.count}`,
                                  )
                                  .join(" · ")}`
                              : ""}
                          </Text>
                        </View>
                      ))}
                      {cycleBreakdown.unclassifiedCount > 0 ? (
                        <View
                          style={styles.cycleBreakdownRow}
                          testID="national-overview-cycle-unclassified"
                        >
                          <Text style={styles.entityTitle}>Non classés</Text>
                          <Text style={styles.entityMeta}>
                            {formatCount(
                              cycleBreakdown.unclassifiedCount,
                              "niveau national",
                              "niveaux nationaux",
                            )}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </SectionCard>
              </>
            ) : null}

            {pane === "cycles" ? (
              <SectionCard
                title="Cycles"
                subtitle="Regroupements pédagogiques nationaux (primaire, secondaire...)"
                testID="national-cycles-card"
              >
                {orderedCycles.length === 0 ? (
                  <EmptyState
                    icon="layers-outline"
                    title="Aucun cycle"
                    message="Créez le premier cycle du catalogue national."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedCycles.map((cycle, index) => (
                      <View
                        key={cycle.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: nationalRowPalette("cycles", index)
                              .backgroundColor,
                          },
                        ]}
                        testID={`national-cycle-row-${cycle.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: nationalRowPalette(
                                "cycles",
                                index,
                              ).accentColor,
                            },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {cycle.label}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {cycle.code} ·{" "}
                              {formatCount(
                                cycle._count?.academicLevels ?? 0,
                                "niveau",
                                "niveaux",
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setFormContext({
                                kind: "cycle",
                                mode: "edit",
                                originPane: "cycles",
                                id: cycle.id,
                                initialValues: {
                                  code: cycle.code,
                                  label: cycle.label,
                                },
                              });
                              setPane("forms");
                            }}
                            testID={`national-cycle-edit-${cycle.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "cycle",
                                id: cycle.id,
                                label: cycle.label,
                              })
                            }
                            testID={`national-cycle-delete-${cycle.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {pane === "levels" ? (
              <>
                <View
                  style={styles.chipsRow}
                  testID="national-levels-cycle-filter"
                >
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      !selectedCycleFilterId && styles.chipActive,
                    ]}
                    onPress={() => setSelectedCycleFilterId("")}
                    testID="national-levels-filter-all"
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        !selectedCycleFilterId && styles.chipLabelActive,
                      ]}
                    >
                      Tous
                    </Text>
                  </TouchableOpacity>
                  {orderedCycles.map((cycle) => (
                    <TouchableOpacity
                      key={cycle.id}
                      style={[
                        styles.chip,
                        selectedCycleFilterId === cycle.id && styles.chipActive,
                      ]}
                      onPress={() => setSelectedCycleFilterId(cycle.id)}
                      testID={`national-levels-filter-${cycle.id}`}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          selectedCycleFilterId === cycle.id &&
                            styles.chipLabelActive,
                        ]}
                      >
                        {cycle.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <SectionCard
                  title="Niveaux académiques nationaux"
                  subtitle={
                    selectedCycleFilterId
                      ? "Filtrés par cycle sélectionné"
                      : "Tous les cycles"
                  }
                  testID="national-levels-card"
                >
                  {filteredLevels.length === 0 ? (
                    <EmptyState
                      icon="school-outline"
                      title="Aucun niveau"
                      message="Créez un niveau national pour ce cycle."
                    />
                  ) : (
                    <View style={styles.listStack}>
                      {filteredLevels.map((level, index) => (
                        <View
                          key={level.id}
                          style={[
                            styles.entityRow,
                            {
                              backgroundColor: nationalRowPalette(
                                "levels",
                                index,
                              ).backgroundColor,
                            },
                          ]}
                          testID={`national-level-row-${level.id}`}
                        >
                          <View
                            style={[
                              styles.entityAccent,
                              {
                                backgroundColor: nationalRowPalette(
                                  "levels",
                                  index,
                                ).accentColor,
                              },
                            ]}
                          />
                          <View style={styles.entityMain}>
                            <View style={styles.entityTextWrap}>
                              <Text style={styles.entityTitle}>
                                {level.label}
                              </Text>
                              <Text style={styles.entityMeta}>
                                {[
                                  level.code,
                                  level.cycle?.label,
                                  level.languageSystem
                                    ? NATIONAL_LEVEL_LANGUAGE_SYSTEM_OPTIONS.find(
                                        (option) =>
                                          option.value === level.languageSystem,
                                      )?.label
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.iconActions}>
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => {
                                setFormContext({
                                  kind: "level",
                                  mode: "edit",
                                  originPane: "levels",
                                  id: level.id,
                                  initialValues: {
                                    code: level.code,
                                    label: level.label,
                                    cycleId: level.cycleId ?? "",
                                    languageSystem: level.languageSystem ?? "",
                                  },
                                });
                                setPane("forms");
                              }}
                              testID={`national-level-edit-${level.id}`}
                            >
                              <Ionicons
                                name="pencil-outline"
                                size={18}
                                color={colors.primary}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.iconButton,
                                styles.iconButtonDanger,
                              ]}
                              onPress={() =>
                                setDeleteTarget({
                                  kind: "level",
                                  id: level.id,
                                  label: level.label,
                                })
                              }
                              testID={`national-level-delete-${level.id}`}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color={colors.warmAccent}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </SectionCard>
              </>
            ) : null}

            {pane === "tracks" ? (
              <SectionCard
                title="Filières nationales"
                subtitle="Catalogue partagé par toutes les écoles"
                testID="national-tracks-card"
              >
                {orderedTracks.length === 0 ? (
                  <EmptyState
                    icon="git-branch-outline"
                    title="Aucune filière nationale"
                    message="Créez la première filière du catalogue national."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedTracks.map((track, index) => (
                      <View
                        key={track.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: nationalRowPalette("tracks", index)
                              .backgroundColor,
                          },
                        ]}
                        testID={`national-track-row-${track.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: nationalRowPalette(
                                "tracks",
                                index,
                              ).accentColor,
                            },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {track.label}
                            </Text>
                            <Text style={styles.entityMeta}>{track.code}</Text>
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setFormContext({
                                kind: "track",
                                mode: "edit",
                                originPane: "tracks",
                                id: track.id,
                                initialValues: {
                                  code: track.code,
                                  label: track.label,
                                },
                              });
                              setPane("forms");
                            }}
                            testID={`national-track-edit-${track.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "track",
                                id: track.id,
                                label: track.label,
                              })
                            }
                            testID={`national-track-delete-${track.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {pane === "curriculums" ? (
              <SectionCard
                title="Curriculums nationaux"
                subtitle="Assemblage d'un niveau académique national"
                testID="national-curriculums-card"
              >
                {orderedCurriculums.length === 0 ? (
                  <EmptyState
                    icon="albums-outline"
                    title="Aucun curriculum national"
                    message="Créez le premier curriculum du catalogue national."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedCurriculums.map((curriculum, index) => (
                      <View
                        key={curriculum.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: nationalRowPalette(
                              "curriculums",
                              index,
                            ).backgroundColor,
                          },
                        ]}
                        testID={`national-curriculum-row-${curriculum.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: nationalRowPalette(
                                "curriculums",
                                index,
                              ).accentColor,
                            },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {curriculum.name}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {curriculum.academicLevel.label} ·{" "}
                              {curriculum.track
                                ? curriculum.track.label
                                : "Tronc commun"}{" "}
                              ·{" "}
                              {formatCount(
                                curriculum._count.subjects,
                                "matière",
                              )}{" "}
                              ·{" "}
                              {formatCount(curriculum._count.classes, "classe")}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setFormContext({
                                kind: "curriculum",
                                mode: "edit",
                                originPane: "curriculums",
                                item: curriculum,
                              });
                              setPane("forms");
                            }}
                            testID={`national-curriculum-edit-${curriculum.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "curriculum",
                                id: curriculum.id,
                                label: curriculum.name,
                              })
                            }
                            testID={`national-curriculum-delete-${curriculum.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {pane === "subjects" ? (
              <>
                <SectionCard
                  title="Matières nationales"
                  subtitle="Catalogue partagé par toutes les écoles"
                  testID="national-subjects-card"
                >
                  {orderedSubjects.length === 0 ? (
                    <EmptyState
                      icon="book-outline"
                      title="Aucune matière nationale"
                      message="Créez la première matière du catalogue national."
                    />
                  ) : (
                    <View style={styles.listStack}>
                      {orderedSubjects.map((subject, index) => (
                        <View
                          key={subject.id}
                          style={[
                            styles.entityRow,
                            {
                              backgroundColor: nationalRowPalette(
                                "subjects",
                                index,
                              ).backgroundColor,
                            },
                          ]}
                          testID={`national-subject-row-${subject.id}`}
                        >
                          <View
                            style={[
                              styles.entityAccent,
                              {
                                backgroundColor: nationalRowPalette(
                                  "subjects",
                                  index,
                                ).accentColor,
                              },
                            ]}
                          />
                          <View style={styles.entityMain}>
                            <View style={styles.entityTextWrap}>
                              <Text style={styles.entityTitle}>
                                {subject.name}
                              </Text>
                              <Text style={styles.entityMeta}>
                                {subject.code}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.iconActions}>
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => {
                                setFormContext({
                                  kind: "subject",
                                  mode: "edit",
                                  originPane: "subjects",
                                  id: subject.id,
                                  initialValues: {
                                    code: subject.code,
                                    name: subject.name,
                                  },
                                });
                                setPane("forms");
                              }}
                              testID={`national-subject-edit-${subject.id}`}
                            >
                              <Ionicons
                                name="pencil-outline"
                                size={18}
                                color={colors.primary}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.iconButton,
                                styles.iconButtonDanger,
                              ]}
                              onPress={() =>
                                setDeleteTarget({
                                  kind: "subject",
                                  id: subject.id,
                                  label: subject.name,
                                })
                              }
                              testID={`national-subject-delete-${subject.id}`}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={18}
                                color={colors.warmAccent}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </SectionCard>

                <SectionCard
                  title="Rattachement à un curriculum"
                  subtitle="Associez une matière à un curriculum national avec coefficient et volume horaire"
                  testID="national-rattachement-card"
                >
                  <CompactSelectField
                    label="Curriculum national"
                    value={selectedCurriculumId}
                    onChange={setSelectedCurriculumId}
                    options={orderedCurriculums.map((curriculum) => ({
                      value: curriculum.id,
                      label: curriculum.name,
                    }))}
                    placeholder="Sélectionner un curriculum"
                    testID="national-rattachement-curriculum"
                  />
                  {!selectedCurriculumId ? (
                    <EmptyState
                      icon="link-outline"
                      title="Aucun curriculum sélectionné"
                      message="Sélectionnez un curriculum national pour gérer ses matières."
                    />
                  ) : isLoadingCurriculumSubjects ? (
                    <LoadingBlock label="Chargement des matières..." />
                  ) : (
                    <>
                      <NationalCurriculumSubjectFormContent
                        subjects={orderedSubjects}
                        isSubmitting={isSubmittingCurriculumSubject}
                        onSubmit={handleUpsertCurriculumSubject}
                      />
                      {curriculumSubjects.length === 0 ? (
                        <EmptyState
                          icon="book-outline"
                          title="Aucune matière rattachée"
                          message="Ajoutez une matière ci-dessus."
                        />
                      ) : (
                        <View style={styles.listStack}>
                          {curriculumSubjects.map((entry, index) => (
                            <View
                              key={entry.id}
                              style={[
                                styles.entityRow,
                                {
                                  backgroundColor: nationalRowPalette(
                                    "subjects",
                                    index,
                                  ).backgroundColor,
                                },
                              ]}
                              testID={`national-rattachement-row-${entry.subjectId}`}
                            >
                              <View
                                style={[
                                  styles.entityAccent,
                                  {
                                    backgroundColor: nationalRowPalette(
                                      "subjects",
                                      index,
                                    ).accentColor,
                                  },
                                ]}
                              />
                              <View style={styles.entityMain}>
                                <View style={styles.entityTextWrap}>
                                  <Text style={styles.entityTitle}>
                                    {entry.subject.name}
                                  </Text>
                                  <Text style={styles.entityMeta}>
                                    {[
                                      entry.coefficient != null
                                        ? `Coef. ${entry.coefficient}`
                                        : null,
                                      entry.weeklyHours != null
                                        ? `${entry.weeklyHours}h/sem`
                                        : null,
                                      entry.isMandatory
                                        ? "Obligatoire"
                                        : "Optionnelle",
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={[
                                  styles.iconButton,
                                  styles.iconButtonDanger,
                                ]}
                                onPress={() =>
                                  void handleDeleteCurriculumSubject(
                                    entry.subjectId,
                                  )
                                }
                                testID={`national-rattachement-delete-${entry.subjectId}`}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color={colors.warmAccent}
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </SectionCard>
              </>
            ) : null}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.fab,
              {
                bottom: insets.bottom + 20,
                backgroundColor: fabDisabled
                  ? colors.textSecondary
                  : nationalAccent(pane as Exclude<NationalTabKey, "overview">),
              },
            ]}
            disabled={fabDisabled}
            onPress={openFab}
            activeOpacity={0.88}
            testID="national-catalog-fab"
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Ionicons name="add" size={28} color={colors.white} />
            )}
          </TouchableOpacity>
        </>
      )}

      <ConfirmDialog
        visible={deleteTarget != null}
        title="Confirmer la suppression"
        subtitle={deleteTarget?.label}
        message="Cette action supprimera définitivement cet élément du catalogue national."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// CurriculumsAdminScreen
// ---------------------------------------------------------------------------

export function CurriculumsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("curriculums");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingLevelTrack, setIsSubmittingLevelTrack] = useState(false);
  const [isSubmittingCurriculum, setIsSubmittingCurriculum] = useState(false);
  const [isSubmittingCurriculumSubject, setIsSubmittingCurriculumSubject] =
    useState(false);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
  const [subjectsFabOpen, setSubjectsFabOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [levels, setLevels] = useState<CurriculumAcademicLevel[]>([]);
  const [tracks, setTracks] = useState<CurriculumTrack[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);
  const [subjects, setSubjects] = useState<CurriculumSubjectCatalogItem[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<
    CurriculumSubjectRow[]
  >([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const role = user?.activeRole ?? user?.role ?? null;
  const isAllowed =
    role === "SCHOOL_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
  // Un compte plateforme (SUPER_ADMIN/ADMIN) gère le catalogue NATIONAL, jamais
  // le catalogue d'une école précise — même si schoolSlug reste en mémoire
  // depuis un ancien membership école (cf. règle activeRole du projet).
  const isPlatformAdmin = roleAllowsPlatformAdmin(role);
  const tabItems = BASE_TAB_ITEMS;
  const subtitle = user ? buildAdminSubtitle(user) : null;

  const orderedLevels = useMemo(
    () => [...levels].sort((a, b) => a.code.localeCompare(b.code)),
    [levels],
  );
  const orderedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.code.localeCompare(b.code)),
    [tracks],
  );
  const orderedCurriculums = useMemo(
    () => [...curriculums].sort((a, b) => a.name.localeCompare(b.name)),
    [curriculums],
  );
  const orderedCurriculumSubjects = useMemo(
    () =>
      [...curriculumSubjects].sort((a, b) =>
        a.subject.name.localeCompare(b.subject.name),
      ),
    [curriculumSubjects],
  );
  const selectedCurriculum =
    orderedCurriculums.find((entry) => entry.id === selectedCurriculumId) ??
    null;
  const curriculumSelectOptions = useMemo(
    () =>
      orderedCurriculums.map((curriculum) => ({
        value: curriculum.id,
        label: curriculum.name,
        meta: `${formatCount(curriculum._count.subjects, "matière")} · ${formatCount(
          curriculum._count.classes,
          "classe",
        )}`,
      })),
    [orderedCurriculums],
  );

  const syncSelection = useCallback((list: CurriculumRow[]) => {
    setSelectedCurriculumId((current) => {
      if (list.length === 0) return "";
      if (current && list.some((entry) => entry.id === current)) {
        return current;
      }
      return list[0]?.id ?? "";
    });
  }, []);

  const loadOverview = useCallback(
    async (showSpinner = true) => {
      if (!schoolSlug) return;
      if (showSpinner) {
        setLoading(true);
      }
      setLoadError(null);
      try {
        const [levelRows, trackRows, subjectRows, curriculumRows] =
          await Promise.all([
            curriculumsApi.listAcademicLevels(schoolSlug),
            curriculumsApi.listTracks(schoolSlug),
            curriculumsApi.listSubjects(schoolSlug),
            curriculumsApi.listCurriculums(schoolSlug),
          ]);
        setLevels(levelRows);
        setTracks(trackRows);
        setSubjects(subjectRows);
        setCurriculums(curriculumRows);
        syncSelection(curriculumRows);
      } catch (error) {
        setLoadError(extractApiError(error));
      } finally {
        setLoading(false);
      }
    },
    [schoolSlug, syncSelection],
  );

  const loadSubjectsForCurriculum = useCallback(
    async (curriculumId: string) => {
      if (!schoolSlug || !curriculumId) {
        setCurriculumSubjects([]);
        return;
      }
      try {
        const rows = await curriculumsApi.listCurriculumSubjects(
          schoolSlug,
          curriculumId,
        );
        setCurriculumSubjects(rows);
      } catch (error) {
        setCurriculumSubjects([]);
        setLoadError(extractApiError(error));
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (!isAllowed || isPlatformAdmin) {
      setLoading(false);
      return;
    }
    if (!schoolSlug) {
      setLoading(false);
      return;
    }
    void loadOverview(true);
  }, [isAllowed, isPlatformAdmin, loadOverview, schoolSlug]);

  useEffect(() => {
    if (tab !== "subjects") {
      setSubjectsFabOpen(false);
    }
  }, [tab]);

  useEffect(() => {
    if (!isAllowed || !schoolSlug) return;
    if (tab !== "subjects") return;
    if (!selectedCurriculumId) {
      setCurriculumSubjects([]);
      return;
    }
    void loadSubjectsForCurriculum(selectedCurriculumId);
  }, [
    isAllowed,
    loadSubjectsForCurriculum,
    schoolSlug,
    selectedCurriculumId,
    tab,
  ]);

  const refreshAll = useCallback(async () => {
    if (!schoolSlug || !isAllowed) return;
    setRefreshing(true);
    await loadOverview(false);
    if (selectedCurriculumId && tab === "subjects") {
      await loadSubjectsForCurriculum(selectedCurriculumId);
    }
    setRefreshing(false);
  }, [
    isAllowed,
    loadOverview,
    loadSubjectsForCurriculum,
    schoolSlug,
    selectedCurriculumId,
    tab,
  ]);

  async function runDeleteMutation(
    action: () => Promise<void>,
    successTitle: string,
    successMessage: string,
  ) {
    setIsSubmitting(true);
    try {
      await action();
      showSuccess({
        title: successTitle,
        message: successMessage,
      });
      await loadOverview(false);
      if (selectedCurriculumId) {
        await loadSubjectsForCurriculum(selectedCurriculumId);
      }
    } catch (error) {
      const message = extractApiError(error);
      showError({
        title: "Action impossible",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function exitForms() {
    const origin = formContext?.originTab ?? "curriculums";
    setFormContext(null);
    setTab(origin);
  }

  function openFab() {
    if (tab === "levels") {
      setFormContext({ kind: "level", mode: "create", originTab: "levels" });
      setTab("forms");
      return;
    }
    if (tab === "tracks") {
      setFormContext({ kind: "track", mode: "create", originTab: "tracks" });
      setTab("forms");
      return;
    }
    if (tab === "curriculums") {
      setFormContext({
        kind: "curriculum",
        mode: "create",
        originTab: "curriculums",
        item: null,
      });
      setTab("forms");
      return;
    }
    if (tab === "subjects") {
      setSubjectsFabOpen((prev) => !prev);
    }
  }

  function openCreateSubjectForm() {
    setSubjectsFabOpen(false);
    setFormContext({ kind: "subject", mode: "create", originTab: "subjects" });
    setTab("forms");
  }

  function openLinkSubjectForm() {
    if (curriculums.length === 0) return;
    setSubjectsFabOpen(false);
    setFormContext({
      kind: "curriculum-subject",
      mode: "create",
      originTab: "subjects",
      item: null,
    });
    setTab("forms");
  }

  async function handleLevelTrackSubmit(
    values: CreateAcademicLevelPayload | CreateTrackPayload,
  ) {
    if (
      !schoolSlug ||
      !formContext ||
      (formContext.kind !== "level" && formContext.kind !== "track")
    ) {
      return;
    }
    const ctx = formContext;
    setIsSubmittingLevelTrack(true);
    try {
      if (ctx.kind === "level") {
        if (ctx.mode === "create") {
          await curriculumsApi.createAcademicLevel(schoolSlug, values);
        } else if (ctx.itemId) {
          await curriculumsApi.updateAcademicLevel(
            schoolSlug,
            ctx.itemId,
            values as UpdateAcademicLevelPayload,
          );
        }
      } else {
        if (ctx.mode === "create") {
          await curriculumsApi.createTrack(schoolSlug, values);
        } else if (ctx.itemId) {
          await curriculumsApi.updateTrack(
            schoolSlug,
            ctx.itemId,
            values as UpdateTrackPayload,
          );
        }
      }
      await loadOverview(false);
      showSuccess({
        title:
          ctx.kind === "level"
            ? ctx.mode === "create"
              ? "Niveau créé"
              : "Niveau modifié"
            : ctx.mode === "create"
              ? "Filière créée"
              : "Filière modifiée",
        message:
          ctx.kind === "level"
            ? ctx.mode === "create"
              ? "Le niveau académique a été ajouté."
              : "Le niveau académique a été mis à jour."
            : ctx.mode === "create"
              ? "La filière a été ajoutée."
              : "La filière a été mise à jour.",
      });
      const originTab = ctx.originTab;
      setTimeout(() => {
        setTab(originTab);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingLevelTrack(false);
    }
  }

  async function handleCurriculumSubmit(values: CreateCurriculumPayload) {
    if (!schoolSlug || !formContext || formContext.kind !== "curriculum") {
      return;
    }
    const ctx = formContext;
    setIsSubmittingCurriculum(true);
    try {
      if (ctx.mode === "create") {
        await curriculumsApi.createCurriculum(schoolSlug, values);
      } else if (ctx.item?.id) {
        await curriculumsApi.updateCurriculum(schoolSlug, ctx.item.id, values);
      }
      await loadOverview(false);
      showSuccess({
        title: ctx.mode === "create" ? "Curriculum créé" : "Curriculum modifié",
        message:
          ctx.mode === "create"
            ? "Le curriculum a été ajouté."
            : "Le curriculum a été mis à jour.",
      });
      const originTab = ctx.originTab;
      setTimeout(() => {
        setTab(originTab);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingCurriculum(false);
    }
  }

  async function handleCurriculumSubjectSubmit(
    curriculumId: string,
    values: UpsertCurriculumSubjectPayload,
  ) {
    if (
      !schoolSlug ||
      !formContext ||
      formContext.kind !== "curriculum-subject"
    ) {
      return;
    }
    const ctx = formContext;
    setIsSubmittingCurriculumSubject(true);
    try {
      await curriculumsApi.upsertCurriculumSubject(
        schoolSlug,
        curriculumId,
        values,
      );
      setSelectedCurriculumId(curriculumId);
      await loadOverview(false);
      await loadSubjectsForCurriculum(curriculumId);
      showSuccess({
        title: ctx.mode === "create" ? "Matière ajoutée" : "Matière modifiée",
        message:
          ctx.mode === "create"
            ? "La matière a été liée au curriculum."
            : "Les paramètres de la matière ont été mis à jour.",
      });
      const originTab = ctx.originTab;
      setTimeout(() => {
        setTab(originTab);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingCurriculumSubject(false);
    }
  }

  async function handleSubjectSubmit(values: CreateSubjectPayload) {
    if (!schoolSlug || !formContext || formContext.kind !== "subject") {
      return;
    }
    const ctx = formContext;
    setIsSubmittingSubject(true);
    try {
      await curriculumsApi.createSubject(schoolSlug, values);
      await loadOverview(false);
      showSuccess({
        title: "Matière créée",
        message: "La matière a été ajoutée au catalogue de l'établissement.",
      });
      const originTab = ctx.originTab;
      setTimeout(() => {
        setTab(originTab);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Action impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmittingSubject(false);
    }
  }

  async function confirmDelete() {
    if (!schoolSlug || !deleteTarget) return;
    const currentTarget = deleteTarget;
    setDeleteTarget(null);

    if (currentTarget.kind === "level") {
      await runDeleteMutation(
        async () => {
          await curriculumsApi.deleteAcademicLevel(
            schoolSlug,
            currentTarget.id,
          );
        },
        "Niveau supprimé",
        "Le niveau académique a été supprimé.",
      );
      return;
    }

    if (currentTarget.kind === "track") {
      await runDeleteMutation(
        async () => {
          await curriculumsApi.deleteTrack(schoolSlug, currentTarget.id);
        },
        "Filière supprimée",
        "La filière a été supprimée.",
      );
      return;
    }

    if (currentTarget.kind === "curriculum") {
      await runDeleteMutation(
        async () => {
          await curriculumsApi.deleteCurriculum(schoolSlug, currentTarget.id);
        },
        "Curriculum supprimé",
        "Le curriculum a été supprimé.",
      );
      return;
    }

    await runDeleteMutation(
      async () => {
        await curriculumsApi.deleteCurriculumSubject(
          schoolSlug,
          currentTarget.curriculumId,
          currentTarget.subjectId,
        );
      },
      "Matière retirée",
      "La matière a été retirée du curriculum.",
    );
  }

  const fabDisabled =
    tab === "help" || tab === "forms" || !isAllowed || !schoolSlug;
  const linkSubjectDisabled = curriculums.length === 0;

  const helpCards = [
    {
      title: "Niveaux et filières",
      body: "Créez d'abord la structure académique de l'établissement. Ces références alimentent automatiquement la création des curriculums.",
    },
    {
      title: "Curriculums",
      body: "Un curriculum assemble un niveau et éventuellement une filière. Le nom est généré automatiquement pour rester cohérent avec le web.",
    },
    {
      title: "Matières",
      body: "Ajoutez ensuite les matières autorisées dans chaque curriculum, avec coefficient, volume horaire et caractère obligatoire.",
    },
  ];

  if (!isAllowed) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title="Curriculums"
          subtitle={subtitle ?? getPortalLabel(getViewType(user!))}
          onBack={() => moduleBack(router)}
          testID="curriculums-header"
          backTestID="curriculums-back-btn"
          topInset={insets.top}
        />
        <View style={styles.stateWrap}>
          <EmptyState
            icon="lock-closed-outline"
            title="Accès réservé"
            message="Ce module mobile est disponible pour les comptes school admin."
          />
        </View>
      </View>
    );
  }

  if (isPlatformAdmin) {
    return <NationalCatalogTabs onBack={() => moduleBack(router)} />;
  }

  if (!schoolSlug) {
    return (
      <View style={styles.root}>
        <ModuleHeader
          title="Curriculums"
          subtitle={subtitle}
          onBack={() => moduleBack(router)}
          testID="curriculums-header"
          backTestID="curriculums-back-btn"
          topInset={insets.top}
        />
        <View style={styles.stateWrap}>
          <EmptyState
            icon="business-outline"
            title="École introuvable"
            message="Aucun établissement n'est sélectionné pour ce compte."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ModuleHeader
        title="Curriculums"
        subtitle={subtitle}
        onBack={() => (tab === "forms" ? exitForms() : moduleBack(router))}
        testID="curriculums-header"
        backTestID="curriculums-back-btn"
        topInset={insets.top}
      />

      {tab !== "forms" ? (
        <UnderlineTabs
          items={tabItems}
          activeKey={tab as ListTabKey}
          onSelect={setTab}
          testIDPrefix="curriculums-tab"
        />
      ) : null}

      {loading ? (
        <View style={styles.stateWrap}>
          <LoadingBlock label="Chargement des curriculums..." />
        </View>
      ) : tab === "forms" && formContext ? (
        <View style={styles.formsTabContent} testID="curriculums-forms-tab">
          <View style={styles.heroWrapper}>
            <FormHero
              icon={formHeroIcon(formContext)}
              title={formHeroTitle(formContext)}
              subtitle={formHeroSubtitle(formContext)}
              palette={formContext.mode === "create" ? "teal" : "warm"}
              testID="curriculums-form-hero"
            />
          </View>
          {renderFormContent(formContext, {
            orderedLevels,
            orderedTracks,
            orderedCurriculums,
            subjects,
            selectedCurriculumId,
            isSubmittingLevelTrack,
            isSubmittingCurriculum,
            isSubmittingCurriculumSubject,
            isSubmittingSubject,
            onCancel: exitForms,
            onSubmitLevelTrack: handleLevelTrackSubmit,
            onSubmitCurriculum: handleCurriculumSubmit,
            onSubmitCurriculumSubject: handleCurriculumSubjectSubmit,
            onSubmitSubject: handleSubjectSubmit,
          })}
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void refreshAll();
                }}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {loadError ? (
              <ErrorBanner
                message={loadError}
                onDismiss={() => setLoadError(null)}
                testID="curriculums-error-banner"
              />
            ) : null}

            {tab === "help" ? (
              <SectionCard
                title="Mode d'emploi"
                subtitle="Même logique fonctionnelle que sur le web, adaptée au mobile"
                testID="curriculums-help-card"
              >
                <View style={styles.helpStack}>
                  {helpCards.map((card, index) => (
                    <View
                      key={card.title}
                      style={[
                        styles.helpCard,
                        { backgroundColor: alternateCard(index) },
                      ]}
                    >
                      <Text style={styles.helpCardTitle}>{card.title}</Text>
                      <Text style={styles.helpCardBody}>{card.body}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>
            ) : null}

            {tab === "levels" ? (
              <SectionCard
                title="Niveaux académiques"
                subtitle="Base de la structure pédagogique"
                testID="curriculums-levels-card"
              >
                {orderedLevels.length === 0 ? (
                  <EmptyState
                    icon="layers-outline"
                    title="Aucun niveau"
                    message="Ajoutez un premier niveau académique pour commencer."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedLevels.map((level, index) => (
                      <View
                        key={level.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: rowPaletteForTab("levels", index)
                              .backgroundColor,
                          },
                        ]}
                        testID={`curriculum-level-row-${level.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: rowPaletteForTab("levels", index)
                                .accentColor,
                            },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {level.label}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {level.code} ·{" "}
                              {formatCount(
                                level._count?.curriculums ?? 0,
                                "curriculum",
                              )}{" "}
                              ·{" "}
                              {formatCount(
                                level._count?.classes ?? 0,
                                "classe",
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setFormContext({
                                kind: "level",
                                mode: "edit",
                                originTab: "levels",
                                itemId: level.id,
                                initialValues: {
                                  code: level.code,
                                  label: level.label,
                                },
                              });
                              setTab("forms");
                            }}
                            testID={`curriculum-level-edit-${level.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "level",
                                id: level.id,
                                label: level.label,
                              })
                            }
                            testID={`curriculum-level-delete-${level.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {tab === "tracks" ? (
              <SectionCard
                title="Filières"
                subtitle="Options et spécialisations par niveau"
                testID="curriculums-tracks-card"
              >
                {orderedTracks.length === 0 ? (
                  <EmptyState
                    icon="git-branch-outline"
                    title="Aucune filière"
                    message="Ajoutez une filière si votre établissement distingue plusieurs parcours."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedTracks.map((track, index) => (
                      <View
                        key={track.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: rowPaletteForTab("tracks", index)
                              .backgroundColor,
                          },
                        ]}
                        testID={`curriculum-track-row-${track.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: rowPaletteForTab("tracks", index)
                                .accentColor,
                            },
                          ]}
                        />
                        <View style={styles.entityMain}>
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {track.label}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {track.code} ·{" "}
                              {formatCount(
                                track._count?.curriculums ?? 0,
                                "curriculum",
                              )}{" "}
                              ·{" "}
                              {formatCount(
                                track._count?.classes ?? 0,
                                "classe",
                              )}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setFormContext({
                                kind: "track",
                                mode: "edit",
                                originTab: "tracks",
                                itemId: track.id,
                                initialValues: {
                                  code: track.code,
                                  label: track.label,
                                },
                              });
                              setTab("forms");
                            }}
                            testID={`curriculum-track-edit-${track.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "track",
                                id: track.id,
                                label: track.label,
                              })
                            }
                            testID={`curriculum-track-delete-${track.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {tab === "curriculums" ? (
              <SectionCard
                title="Curriculums"
                subtitle="Assemblage d'un niveau, d'une filière et de matières officielles"
                testID="curriculums-card"
              >
                {orderedCurriculums.length === 0 ? (
                  <EmptyState
                    icon="albums-outline"
                    title="Aucun curriculum"
                    message="Créez un premier curriculum pour configurer les matières autorisées."
                  />
                ) : (
                  <View style={styles.listStack}>
                    {orderedCurriculums.map((curriculum, index) => (
                      <View
                        key={curriculum.id}
                        style={[
                          styles.entityRow,
                          {
                            backgroundColor: rowPaletteForTab(
                              "curriculums",
                              index,
                            ).backgroundColor,
                          },
                        ]}
                        testID={`curriculum-row-${curriculum.id}`}
                      >
                        <View
                          style={[
                            styles.entityAccent,
                            {
                              backgroundColor: rowPaletteForTab(
                                "curriculums",
                                index,
                              ).accentColor,
                            },
                          ]}
                        />
                        <TouchableOpacity
                          style={styles.entityMain}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelectedCurriculumId(curriculum.id);
                            setTab("subjects");
                          }}
                          testID={`curriculum-open-${curriculum.id}`}
                        >
                          <View style={styles.entityTextWrap}>
                            <Text style={styles.entityTitle}>
                              {curriculum.name}
                            </Text>
                            <Text style={styles.entityMeta}>
                              {curriculum.track?.code ?? "TRONC_COMMUN"} ·{" "}
                              {formatCount(
                                curriculum._count.subjects,
                                "matière",
                              )}{" "}
                              ·{" "}
                              {formatCount(curriculum._count.classes, "classe")}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.iconActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              setFormContext({
                                kind: "curriculum",
                                mode: "edit",
                                originTab: "curriculums",
                                item: curriculum,
                              });
                              setTab("forms");
                            }}
                            testID={`curriculum-edit-${curriculum.id}`}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.iconButton,
                              styles.iconButtonNeutral,
                            ]}
                            onPress={() => {
                              setSelectedCurriculumId(curriculum.id);
                              setTab("subjects");
                            }}
                            testID={`curriculum-subjects-${curriculum.id}`}
                          >
                            <Ionicons
                              name="chevron-forward-outline"
                              size={18}
                              color={colors.accentTeal}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, styles.iconButtonDanger]}
                            onPress={() =>
                              setDeleteTarget({
                                kind: "curriculum",
                                id: curriculum.id,
                                label: curriculum.name,
                              })
                            }
                            testID={`curriculum-delete-${curriculum.id}`}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color={colors.warmAccent}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </SectionCard>
            ) : null}

            {tab === "subjects" ? (
              <>
                <View
                  style={styles.subjectSelectorBar}
                  testID="curriculums-subjects-context-card"
                >
                  {orderedCurriculums.length === 0 ? (
                    <EmptyState
                      icon="albums-outline"
                      title="Aucun curriculum disponible"
                      message="Créez d'abord un curriculum avant d'y rattacher des matières."
                    />
                  ) : (
                    <CompactSelectField
                      value={selectedCurriculumId}
                      options={curriculumSelectOptions}
                      placeholder="Choisir un curriculum"
                      onChange={setSelectedCurriculumId}
                      testID="curriculum-selector"
                    />
                  )}
                </View>

                {selectedCurriculum ? (
                  <SectionCard
                    title="Matières"
                    subtitle={`${orderedCurriculumSubjects.length} matière(s)`}
                    testID="curriculums-subjects-card"
                  >
                    {orderedCurriculumSubjects.length === 0 ? (
                      <EmptyState
                        icon="library-outline"
                        title="Aucune matière liée"
                        message="Ajoutez des matières pour définir le contenu officiel de ce curriculum."
                      />
                    ) : (
                      <View style={styles.listStack}>
                        {orderedCurriculumSubjects.map((entry, index) => (
                          <View
                            key={entry.id}
                            style={[
                              styles.entityRow,
                              {
                                backgroundColor: rowPaletteForTab(
                                  "subjects",
                                  index,
                                ).backgroundColor,
                              },
                            ]}
                            testID={`curriculum-subject-row-${entry.id}`}
                          >
                            <View
                              style={[
                                styles.entityAccent,
                                {
                                  backgroundColor: rowPaletteForTab(
                                    "subjects",
                                    index,
                                  ).accentColor,
                                },
                              ]}
                            />
                            <View style={styles.entityMain}>
                              <View style={styles.entityTextWrap}>
                                <Text style={styles.entityTitle}>
                                  {entry.subject.name}
                                </Text>
                                <Text style={styles.entityMeta}>
                                  Coef. {entry.coefficient ?? "-"} ·{" "}
                                  {entry.weeklyHours ?? "-"} h/sem ·{" "}
                                  {entry.isMandatory
                                    ? "Obligatoire"
                                    : "Optionnelle"}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.iconActions}>
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => {
                                  setFormContext({
                                    kind: "curriculum-subject",
                                    mode: "edit",
                                    originTab: "subjects",
                                    item: entry,
                                  });
                                  setTab("forms");
                                }}
                                testID={`curriculum-subject-edit-${entry.id}`}
                              >
                                <Ionicons
                                  name="pencil-outline"
                                  size={18}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.iconButton,
                                  styles.iconButtonDanger,
                                ]}
                                onPress={() =>
                                  setDeleteTarget({
                                    kind: "curriculum-subject",
                                    curriculumId: selectedCurriculum.id,
                                    subjectId: entry.subjectId,
                                    label: entry.subject.name,
                                  })
                                }
                                testID={`curriculum-subject-delete-${entry.id}`}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color={colors.warmAccent}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </SectionCard>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          {tab !== "help" ? (
            <>
              {tab === "subjects" && subjectsFabOpen ? (
                <TouchableOpacity
                  style={styles.fabBackdrop}
                  activeOpacity={1}
                  onPress={() => setSubjectsFabOpen(false)}
                  testID="curriculums-fab-backdrop"
                />
              ) : null}

              {tab === "subjects" && subjectsFabOpen ? (
                <View
                  style={[
                    styles.fabMiniStack,
                    {
                      bottom: insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT + 74,
                    },
                  ]}
                >
                  <View style={styles.fabMiniRow}>
                    <View style={styles.fabMiniLabel}>
                      <Text style={styles.fabMiniLabelText}>
                        Lier à un curriculum
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.fabMini,
                        {
                          backgroundColor: linkSubjectDisabled
                            ? colors.textSecondary
                            : accentForTab("curriculums"),
                        },
                      ]}
                      disabled={linkSubjectDisabled}
                      onPress={openLinkSubjectForm}
                      activeOpacity={0.88}
                      testID="curriculums-subject-link-fab"
                    >
                      <Ionicons
                        name="link-outline"
                        size={20}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.fabMiniRow}>
                    <View style={styles.fabMiniLabel}>
                      <Text style={styles.fabMiniLabelText}>
                        Nouvelle matière
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.fabMini,
                        { backgroundColor: accentForTab("subjects") },
                      ]}
                      onPress={openCreateSubjectForm}
                      activeOpacity={0.88}
                      testID="curriculums-subject-create-fab"
                    >
                      <Ionicons
                        name="add-outline"
                        size={22}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.fab,
                  {
                    bottom: insets.bottom + 20 + BOTTOM_TAB_BAR_HEIGHT,
                    backgroundColor: fabDisabled
                      ? colors.textSecondary
                      : accentForTab(tab as ListTabKey),
                  },
                ]}
                disabled={fabDisabled}
                onPress={openFab}
                activeOpacity={0.88}
                testID="curriculums-fab"
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Ionicons
                    name={
                      tab === "subjects" && subjectsFabOpen ? "close" : "add"
                    }
                    size={28}
                    color={colors.white}
                  />
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </>
      )}

      <ConfirmDialog
        visible={deleteTarget != null}
        title="Confirmer la suppression"
        subtitle={deleteTarget?.label ?? undefined}
        message={
          deleteTarget?.kind === "curriculum-subject"
            ? "La matière sera retirée du curriculum sélectionné."
            : "Cette action supprimera définitivement cet élément."
        }
        variant="danger"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  stateWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  listStack: {
    gap: 12,
  },
  entityRow: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 0,
    padding: 14,
    paddingLeft: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#8C5A24",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  entityTextWrap: {
    flex: 1,
    gap: 3,
  },
  entityTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  entityMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  iconActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: "rgba(255, 253, 252, 0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonNeutral: {
    backgroundColor: "#E8F5F2",
  },
  iconButtonDanger: {
    backgroundColor: "#FDEEE5",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  fabBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(18, 28, 38, 0.28)",
  },
  fabMiniStack: {
    position: "absolute",
    right: 20,
    gap: 14,
    alignItems: "flex-end",
  },
  fabMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fabMiniLabel: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fabMiniLabelText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  fabMini: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  subjectSelectorBar: {
    marginTop: -4,
  },
  compactSelectTrigger: {
    borderRadius: 14,
    backgroundColor: "#F9F3EA",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#7E5A2F",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  compactSelectTriggerError: {
    borderWidth: 1,
    borderColor: colors.notification,
  },
  compactSelectTriggerDisabled: {
    opacity: 0.6,
  },
  compactSelectTextWrap: {
    flex: 1,
    gap: 3,
  },
  compactSelectValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  compactSelectMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectOverlay: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 38, 0.28)",
    justifyContent: "flex-end",
  },
  selectSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: "70%",
  },
  selectSheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  selectSheetOptions: {
    gap: 8,
  },
  selectOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FBF6EF",
  },
  selectOptionRowActive: {
    backgroundColor: "#FFF0E1",
  },
  selectOptionTextWrap: {
    flex: 1,
    gap: 3,
  },
  selectOptionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  selectOptionLabelActive: {
    color: colors.textPrimary,
  },
  selectOptionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  selectOptionMetaActive: {
    color: colors.warmAccent,
  },
  helpStack: {
    gap: 12,
  },
  helpCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 16,
    gap: 8,
  },
  helpCardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  helpCardBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  // ── Inline form layout (tab "forms") ────────────────────────────────────
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  formField: {
    gap: 8,
  },
  formLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  formInput: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  formInputFocused: {
    borderColor: colors.primary,
  },
  formInputError: {
    borderColor: colors.warmAccent,
  },
  formError: {
    color: colors.warmAccent,
    fontSize: 12,
    lineHeight: 17,
  },
  switchField: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: "#FBF6EF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchFieldText: {
    flex: 1,
    gap: 3,
  },
  switchFieldHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  previewCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    padding: 14,
    gap: 4,
  },
  previewLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  previewValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
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
    backgroundColor: "rgba(255,255,255,0.86)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  primaryActionDisabled: {
    opacity: 0.55,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  // ── Catalogue national ───────────────────────────────────────────────────
  nationalForm: {
    gap: 10,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: "45%",
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  statTileValue: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
  },
  statTileLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  chipLabelActive: {
    color: colors.white,
  },
  cycleBreakdownRow: {
    gap: 3,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.warmBorder,
  },
});
